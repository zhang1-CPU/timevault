/**
 * TimeVault - Core Crypto Module
 * 
 * Three-layer security:
 * 1. PIN encryption: PBKDF2 + AES-256-GCM
 * 2. Time lock: tlock (drand IBE-based)
 * 3. Image steganography: LSB in PNG
 */

import {
  encryptText as tlockEncryptText,
  decryptText as tlockDecryptText,
  checkUnlockStatus,
  QUICKNET,
  type UnlockStatus,
} from '@capytime/tlock';

// ─── Constants ───────────────────────────────────────────────

const SALT_SIZE = 16;      // 128-bit salt
const IV_SIZE = 12;        // 96-bit IV for GCM
const ITERATIONS = 25_000; // PBKDF2 iterations — tuned for mobile.
                            // A 4-digit PIN has only 10,000 possibilities regardless,
                            // so extra iterations provide diminishing marginal security
                            // while seriously hurting load time on phones.

// ─── Types ───────────────────────────────────────────────────

export interface LockStatus {
  canUnlock: boolean;
  unlockTime: Date | null;
  remainingSeconds: number;
  formattedRemaining: string;
  checkTimeMs?: number;
}

// ─── PIN-Based AES Encryption ────────────────────────────────

/**
 * Derive AES key from PIN using PBKDF2.
 * Caches results by (pin, salt) because the same PIN is reused
 * multiple times during couple-mode sealing.
 */
const keyCache = new Map<string, CryptoKey>();

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const saltHex = Array.from(salt, b => b.toString(16).padStart(2, '0')).join('');
  const cacheKey = `${pin}-${saltHex}`;
  const cached = keyCache.get(cacheKey);
  if (cached) return cached;

  const pinData = new TextEncoder().encode(pin);
  const baseKey = await crypto.subtle.importKey('raw', pinData, 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  keyCache.set(cacheKey, key);
  // Bounded cache: evict oldest entries when exceeding size
  if (keyCache.size > 16) {
    const firstKey = keyCache.keys().next().value;
    if (firstKey !== undefined) keyCache.delete(firstKey);
  }

  return key;
}

/**
 * Encrypt plaintext with PIN.
 * Returns: base64(salt || iv || ciphertext)
 */
export async function encryptWithPin(plaintext: string, pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_SIZE));
  const key = await deriveKey(pin, salt);
  const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  // Concatenate: salt(16) + iv(12) + ciphertext
  const result = new Uint8Array(SALT_SIZE + IV_SIZE + ciphertext.byteLength);
  result.set(salt, 0);
  result.set(iv, SALT_SIZE);
  result.set(new Uint8Array(ciphertext), SALT_SIZE + IV_SIZE);

  return uint8ToBase64(result);
}

/**
 * Decrypt with PIN.
 * Input: base64(salt || iv || ciphertext)
 */
export async function decryptWithPin(b64: string, pin: string): Promise<string> {
  const data = base64ToUint8(b64);
  const salt = data.slice(0, SALT_SIZE);
  const iv = data.slice(SALT_SIZE, SALT_SIZE + IV_SIZE);
  const ciphertext = data.slice(SALT_SIZE + IV_SIZE);

  const key = await deriveKey(pin, salt);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}

// ─── Time-Lock Layer ─────────────────────────────────────────

/**
 * Full encryption: PIN-encrypt + time-lock + embed in image.
 * Produces a PNG with watermark (品牌 logo + timevault.online + 解锁时间) and LSB hidden data.
 */
const SEAL_PREFIX = 'TV@';

export async function sealMessage(
  message: string,
  pin: string,
  unlockDate: Date,
  imageFile: File
): Promise<Blob> {
  // Step 0: Prepend seal timestamp so "when the message was written" survives decryption
  const sealedAt = new Date();
  const wrappedMessage = `${SEAL_PREFIX}${sealedAt.toISOString()}\n${message}`;

  // Step 1: PIN-encrypt the wrapped message
  const pinEncrypted = await encryptWithPin(wrappedMessage, pin);

  // Step 2: Time-lock the encrypted payload
  const tlockString = await tlockEncryptText(pinEncrypted, unlockDate);

  // Step 3: Encode TLOCK string to binary
  const binaryData = new TextEncoder().encode(tlockString);

  // Step 4: Draw watermark, then LSB embed into image
  return embedInImage(imageFile, binaryData, unlockDate);
}

/**
 * Full decryption: extract from image + time-lock decrypt + PIN decrypt.
 * Returns the plain message along with the unlock time and the time the
 * message was originally sealed (if it carries the TimeVault seal prefix).
 */
export async function revealMessage(
  imageFile: File,
  pin: string
): Promise<{ message: string; unlockTime: Date | null; sealedAt: Date | null }> {
  // Step 1: Extract TLOCK binary from image
  const binaryData = await extractFromImage(imageFile);
  const tlockString = new TextDecoder().decode(binaryData);

  // Step 2: Time-lock decrypt (checks time internally)
  const pinEncrypted = await tlockDecryptText(tlockString);

  // Step 3: PIN decrypt
  const raw = await decryptWithPin(pinEncrypted, pin);

  // Step 4: Unwrap seal time prefix if present (backwards-compatible)
  let message = raw;
  let sealedAt: Date | null = null;
  if (raw.startsWith(SEAL_PREFIX)) {
    const afterPrefix = raw.slice(SEAL_PREFIX.length);
    const nlIdx = afterPrefix.indexOf('\n');
    if (nlIdx !== -1) {
      const candidate = afterPrefix.slice(0, nlIdx).trim();
      const parsed = new Date(candidate);
      if (!Number.isNaN(parsed.getTime())) {
        sealedAt = parsed;
        message = afterPrefix.slice(nlIdx + 1);
      }
    }
  }

  // Get unlock time for display
  const status = checkStatus(tlockString);
  return { message, unlockTime: status.unlockTime, sealedAt };
}

/**
 * Check if a sealed image can be unlocked yet.
 * Does NOT need PIN — only checks time lock status.
 */
/**
 * Check if a sealed image can be unlocked yet.
 * Does NOT need PIN — only checks time lock status.
 *
 * Important: only works on lossless formats (PNG, WebP-lossless).
 * JPEG compression destroys LSB data, so a JPEG of a sealed photo
 * will never be unlockable — we detect this case and warn the user.
 */
export async function checkImageStatus(imageFile: File): Promise<LockStatus> {
  try {
    // Fast check: if the uploaded file is JPEG / JPG it is impossible to recover data
    const isJpeg = /\.(jpe?g)$/i.test(imageFile.name) ||
                   imageFile.type === 'image/jpeg' ||
                   (imageFile.type === '' && imageFile.name.endsWith('.jpg'));
    if (isJpeg) {
      throw new Error('JPEG_COMPRESSION');
    }

    const binaryData = await extractFromImage(imageFile);
    const tlockString = new TextDecoder().decode(binaryData);
    return checkStatus(tlockString);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'JPEG_COMPRESSION') {
      return {
        canUnlock: false,
        unlockTime: null,
        remainingSeconds: 0,
        formattedRemaining: 'JPEG detected — re-upload as PNG (JPEG compression destroys hidden data)',
      };
    }
    return {
      canUnlock: false,
      unlockTime: null,
      remainingSeconds: 0,
      formattedRemaining: 'No hidden data found — upload the sealed PNG you downloaded',
    };
  }
}

/**
 * Check TLOCK string status without decrypting.
 */
export function checkStatus(tlockString: string): LockStatus {
  const status: UnlockStatus = checkUnlockStatus(tlockString, QUICKNET);
  return {
    canUnlock: status.canUnlock,
    unlockTime: status.unlockTime,
    remainingSeconds: status.remainingSeconds,
    formattedRemaining: formatDuration(status.remainingSeconds),
  };
}

// ─── Brand Watermark ─────────────────────────────────────────

/**
 * Draw TimeVault brand watermark in the bottom-right corner.
 * Layout (refined, 2-line rounded pill — pure canvas, no image dependency):
 *   [⧗ hourglass logo] timevault.online     ← brand line, larger logo
 *   Unlocks · YYYY-MM-DD HH:MM              ← unlock date
 *
 * The watermark is drawn before LSB embedding so it becomes a permanent
 * visual part of the image — any image sealed through this site carries it.
 */
function drawBrandWatermark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  unlockDate: Date
): void {
  ctx.save();

  // --- Dynamically scale with image width, never too small / too big ---
  const baseFont = Math.max(12, Math.min(20, Math.round(w * 0.015)));
  const smallFont = Math.max(10, Math.round(baseFont * 0.8));
  const padX = Math.max(10, Math.round(baseFont * 0.6));
  const padY = Math.max(8, Math.round(baseFont * 0.55));
  const margin = Math.max(14, Math.round(baseFont * 0.65));
  const lineGap = Math.max(4, Math.round(baseFont * 0.2));
  const corner = Math.max(6, Math.round(baseFont * 0.4));

  // --- Measure line 1: [logo] TimeVault ---
  const iconSquare = Math.round(baseFont * 1.6); // noticeably bigger logo
  const iconGap = Math.round(baseFont * 0.45);
  ctx.font = `600 ${baseFont}px system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`;
  const line1Width = iconSquare + iconGap + ctx.measureText('TimeVault').width;

  // --- Measure line 2: Unlocks · YYYY-MM-DD HH:MM ---
  ctx.font = `${smallFont}px system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`;
  const line2 = formatUnlockTime(unlockDate);
  const line2Width = ctx.measureText(line2).width;

  const contentWidth = Math.max(line1Width, line2Width);
  const pillW = contentWidth + padX * 2;
  const pillH = baseFont + smallFont + lineGap + padY * 2;
  const pillX = w - pillW - margin;
  const pillY = h - pillH - margin;

  // --- Outer soft glow (a slightly bigger blurred pill under the card) ---
  ctx.shadowColor = 'rgba(232, 120, 140, 0.25)';
  ctx.shadowBlur = Math.max(6, Math.round(baseFont * 0.4));

  // --- Pill body with subtle gradient background ---
  const pillGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY + pillH);
  pillGrad.addColorStop(0, 'rgba(15, 8, 22, 0.75)');
  pillGrad.addColorStop(1, 'rgba(22, 12, 30, 0.68)');
  ctx.fillStyle = pillGrad;
  roundedRect(ctx, pillX, pillY, pillW, pillH, corner);
  ctx.fill();

  ctx.shadowBlur = 0;

  // --- Inner highlight stroke ---
  ctx.strokeStyle = 'rgba(232, 160, 170, 0.18)';
  ctx.lineWidth = 1;
  roundedRect(ctx, pillX, pillY, pillW, pillH, corner);
  ctx.stroke();

  // --- Accent dot (left side) for visual polish ---
  const dotR = Math.max(2, Math.round(baseFont * 0.15));
  const dotY = pillY + padY + dotR + 2;
  ctx.fillStyle = 'rgba(232, 160, 170, 0.7)';
  ctx.beginPath();
  ctx.arc(pillX + padX + dotR, dotY, dotR, 0, Math.PI * 2);
  ctx.fill();

  // --- Line 1: hourglass logo + "TimeVault" ---
  const line1BaseY = pillY + padY + baseFont + 1;
  const logoX = pillX + padX;
  const logoY = line1BaseY - iconSquare + 1; // align logo to text baseline
  drawHourglassLogo(ctx, logoX, logoY, iconSquare, baseFont);

  ctx.fillStyle = 'rgba(255, 245, 248, 0.92)';
  ctx.font = `700 ${baseFont}px system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillText('TimeVault', logoX + iconSquare + iconGap, line1BaseY);

  // --- Line 2: unlock information ---
  const line2BaseY = line1BaseY + lineGap + smallFont;
  ctx.fillStyle = 'rgba(232, 195, 205, 0.78)';
  ctx.font = `500 ${smallFont}px system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`;
  ctx.fillText(line2, logoX, line2BaseY);

  ctx.restore();
}

/**
 * Draw a minimalist hourglass (sand-timer) icon using pure canvas pathing.
 * No external image dependency — consistent across every browser & scale.
 */
function drawHourglassLogo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  baseFont: number
): void {
  ctx.save();

  const cx = x + size / 2;
  const cy = y + size / 2;

  // Soft rose glow background
  ctx.fillStyle = 'rgba(232, 160, 170, 0.2)';
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // Inner ring
  ctx.strokeStyle = 'rgba(232, 160, 170, 0.35)';
  ctx.lineWidth = Math.max(1, Math.round(size * 0.06));
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
  ctx.stroke();

  // Hourglass body: top triangle + bottom triangle sharing vertex at cx,cy
  const lw = Math.max(1, Math.round(baseFont * 0.1));
  ctx.lineWidth = lw;
  ctx.strokeStyle = 'rgba(255, 235, 240, 0.95)';
  ctx.fillStyle = 'rgba(232, 160, 170, 0.55)';

  const pad = size * 0.22;

  // Top triangle
  ctx.beginPath();
  ctx.moveTo(x + pad, y + pad * 1.15);
  ctx.lineTo(x + size - pad, y + pad * 1.15);
  ctx.lineTo(cx + 0.5, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bottom triangle
  ctx.beginPath();
  ctx.moveTo(cx + 0.5, cy);
  ctx.lineTo(x + size - pad, y + size - pad * 1.15);
  ctx.lineTo(x + pad, y + size - pad * 1.15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Thin trickle of sand falling through the middle
  ctx.fillStyle = 'rgba(255, 235, 240, 0.95)';
  const trickleW = Math.max(1, Math.round(size * 0.06));
  ctx.fillRect(cx - trickleW / 2, cy, trickleW, size * 0.2);

  ctx.restore();
}

/**
 * Format unlock date into a polished English line:
 *   "Unlocks · Jun 19, 2026 18:30"
 */
function formatUnlockTime(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `Unlocks · ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// ─── LSB Steganography ───────────────────────────────────────

/**
 * Embed binary data into image using LSB steganography.
 * Also draws a brand watermark (hourglass logo + timevault.online + unlock time)
 * in the bottom-right corner. Output: PNG Blob.
 */
/**
 * Load the input image into a canvas, applying EXIF orientation so that
 * iOS Safari / Android Chrome produce pixel arrays that are aligned
 * with the visual layout. Falls back to plain <img> onload when
 * createImageBitmap is not available.
 */
async function loadImageToCanvas(imageFile: File): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> {
  // Prefer createImageBitmap (modern browsers & Safari 15+) with explicit orientation
  // orientation: 'from-image' applies EXIF rotation onto pixels.
  if (typeof createImageBitmap !== 'undefined') {
    try {
      const bitmap = await createImageBitmap(imageFile, { imageOrientation: 'from-image', premultiplyAlpha: 'none' });
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Canvas 2D context not available');
      ctx.drawImage(bitmap, 0, 0);
      (bitmap as ImageBitmap).close?.();
      return { canvas, ctx };
    } catch {
      // fall through to <img> fallback
    }
  }

  // Fallback: plain <img> element — older browsers
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(imageFile);
    img.onload = () => {
      try {
        // Decode to ensure pixels are ready (needed on some iOS Safari versions)
        const decoder = img.decode ? img.decode() : Promise.resolve();
        (decoder as Promise<void>)
          .then(() => {
            if (!img.width || !img.height) {
              URL.revokeObjectURL(url);
              reject(new Error('Image has no content'));
              return;
            }
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) {
              URL.revokeObjectURL(url);
              reject(new Error('Canvas 2D context not available'));
              return;
            }
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            resolve({ canvas, ctx });
          })
          .catch(() => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to decode image'));
          });
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

async function embedInImage(imageFile: File, data: Uint8Array, unlockDate: Date): Promise<Blob> {
  const { canvas, ctx } = await loadImageToCanvas(imageFile);

  if (!canvas.width || !canvas.height) {
    throw new Error('Image has no content');
  }

  // Draw watermark (brand logo + website + unlock time) in bottom-right corner.
  drawBrandWatermark(ctx, canvas.width, canvas.height, unlockDate);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Check capacity: 4 bytes magic "TVLT" + 4 bytes length + data
  const numPixels = imageData.data.length / 4;
  const availableBits = numPixels * 3;
  const neededBits = MAGIC_BYTES.length * 8 + 32 + data.length * 8;
  if (neededBits > availableBits) {
    throw new Error(
      `Image too small. Need ${Math.ceil(neededBits / 8)} bytes, have ${Math.floor(availableBits / 8)}. Use a larger image.`
    );
  }

  embedLsb(imageData, data);
  ctx.putImageData(imageData, 0, 0);

  // Produce PNG blob; on iOS Safari canvas.toBlob may be missing on old versions.
  return new Promise<Blob>((resolve, reject) => {
    const done = (blob: Blob | null) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create PNG blob'));
    };
    if (typeof (canvas as HTMLCanvasElement & { mozGetAsFile?: (name: string, type: string) => Blob }).mozGetAsFile !== 'undefined') {
      // Firefox legacy path
      done((canvas as HTMLCanvasElement & { mozGetAsFile: (name: string, type: string) => Blob }).mozGetAsFile('timevault.png', 'image/png'));
    } else if (typeof canvas.toBlob !== 'undefined') {
      // Standard path — toBlob is asynchronous on every modern browser.
      canvas.toBlob(done, 'image/png');
    } else {
      // Fallback: toDataURL + manual Blob
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1] || '';
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        done(new Blob([bytes], { type: 'image/png' }));
      } catch (err) {
        reject(err);
      }
    }
  });
}

/**
 * Extract binary data from LSB-steganography image.
 */
async function extractFromImage(imageFile: File): Promise<Uint8Array> {
  const { canvas, ctx } = await loadImageToCanvas(imageFile);

  if (!canvas.width || !canvas.height) {
    throw new Error('Image has no content');
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = extractLsb(imageData);

  return data;
}

// ─── Magic Bytes ──────────────────────────────────────────────

// 4-byte magic identifier: "TVLT" (TimeVaulT) — written before
// the 32-bit length header so the unlock page can quickly tell
// whether a PNG is a valid TimeVault sealed image.
const MAGIC_BYTES = new Uint8Array([0x54, 0x56, 0x4c, 0x54]); // "TVLT"
const MAGIC_LENGTH = MAGIC_BYTES.length;

// ─── LSB Implementation ──────────────────────────────────────

function embedLsb(imageData: ImageData, data: Uint8Array): void {
  const pixels = imageData.data;
  let bitIndex = 0;

  const writeBit = (bit: number) => {
    const pixelIdx = Math.floor(bitIndex / 3);
    const channel = bitIndex % 3; // 0=R, 1=G, 2=B
    const dataIdx = pixelIdx * 4 + channel;
    pixels[dataIdx] = (pixels[dataIdx] & 0xfe) | (bit & 1);
    bitIndex++;
  };

  // Step 1: write 4-byte magic "TVLT" (32 bits)
  for (let byteIdx = 0; byteIdx < MAGIC_LENGTH; byteIdx++) {
    for (let bitOffset = 7; bitOffset >= 0; bitOffset--) {
      writeBit((MAGIC_BYTES[byteIdx] >>> bitOffset) & 1);
    }
  }

  // Step 2: write 32-bit length header (big-endian)
  const length = data.length;
  for (let i = 31; i >= 0; i--) {
    writeBit((length >>> i) & 1);
  }

  // Step 3: write data bytes
  for (let byteIdx = 0; byteIdx < data.length; byteIdx++) {
    for (let bitOffset = 7; bitOffset >= 0; bitOffset--) {
      writeBit((data[byteIdx] >>> bitOffset) & 1);
    }
  }
}

function extractLsb(imageData: ImageData): Uint8Array {
  const pixels = imageData.data;
  const numPixels = pixels.length / 4;
  let bitIndex = 0;

  const readBit = (): number => {
    const pixelIdx = Math.floor(bitIndex / 3);
    const channel = bitIndex % 3;
    const dataIdx = pixelIdx * 4 + channel;
    const bit = pixels[dataIdx] & 1;
    bitIndex++;
    return bit;
  };

  // Step 1: verify minimum size — need at least magic (4 bytes = 32 bits) + length (32 bits) = 64 bits ≈ 22 pixels
  const minPixelsNeeded = Math.ceil((MAGIC_LENGTH * 8 + 32) / 3);
  if (numPixels < minPixelsNeeded) {
    throw new Error('No hidden data found in this image');
  }

  // Step 2: read 4-byte magic and validate ("TVLT")
  const magicBytes = new Uint8Array(MAGIC_LENGTH);
  for (let byteIdx = 0; byteIdx < MAGIC_LENGTH; byteIdx++) {
    let byte = 0;
    for (let bitOffset = 7; bitOffset >= 0; bitOffset--) {
      byte = (byte << 1) | readBit();
    }
    magicBytes[byteIdx] = byte;
  }

  for (let i = 0; i < MAGIC_LENGTH; i++) {
    if (magicBytes[i] !== MAGIC_BYTES[i]) {
      throw new Error('No hidden data found in this image');
    }
  }

  // Step 3: read 32-bit length header
  let length = 0;
  for (let i = 0; i < 32; i++) {
    length = (length << 1) | readBit();
  }

  // Step 4: validate — length must fit in remaining pixels
  const totalBitBudget = numPixels * 3;
  const consumedBits = bitIndex;
  const availableBytes = Math.max(0, Math.floor((totalBitBudget - consumedBits) / 8));
  if (length <= 0 || length > availableBytes || length > 2 * 1024 * 1024) {
    throw new Error('No hidden data found in this image');
  }

  // Step 5: read data
  const data = new Uint8Array(length);
  for (let byteIdx = 0; byteIdx < length; byteIdx++) {
    let byte = 0;
    for (let bitOffset = 0; bitOffset < 8; bitOffset++) {
      byte = (byte << 1) | readBit();
    }
    data[byteIdx] = byte;
  }

  return data;
}

// ─── Utilities ───────────────────────────────────────────────

function uint8ToBase64(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.byteLength; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const data = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    data[i] = binary.charCodeAt(i);
  }
  return data;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return 'Unlockable now';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  return parts.join(' ') || '< 1m';
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Couple Mode — Two-person time-locked sealed messages
// ═══════════════════════════════════════════════════════════════════════════════

export interface CouplePayload {
  version: 2;
  role: 'couple';
  unlock: string;         // ISO unlock time
  sealedAt: string;       // ISO time when first sealed
  side: 'left' | 'right'; // which half this image represents
  a_msg: { cipher: string; }; // A's message, encrypted with PIN-B
  b_msg: { cipher: string; }; // B's message, encrypted with PIN-A
}

/**
 * Build the couple payload JSON string (not yet encrypted).
 */
function buildCouplePayload(
  msgA: string,
  msgB: string,
  pinA: string,
  pinB: string,
  unlockDate: Date,
  side: 'left' | 'right',
  sealedAt: Date
): Promise<string> {
  return encryptWithPin(msgB, pinA).then(cipherB =>
    encryptWithPin(msgA, pinB).then(cipherA => {
      const payload: CouplePayload = {
        version: 2,
        role: 'couple',
        unlock: unlockDate.toISOString(),
        sealedAt: sealedAt.toISOString(),
        side,
        a_msg: { cipher: cipherA },
        b_msg: { cipher: cipherB },
      };
      return JSON.stringify(payload);
    })
  );
}

/**
 * Seal both messages into a single half image (used by both A and B).
 * This is the final sealing step — both messages are embedded,
 * then the whole payload is tlock-encrypted so the image is unreadable until unlockDate.
 */
export async function sealCoupleHalf(
  halfFile: File,
  msgA: string,
  msgB: string,
  pinA: string,
  pinB: string,
  unlockDate: Date,
  side: 'left' | 'right'
): Promise<Blob> {
  const sealedAt = new Date();
  const payload = await buildCouplePayload(msgA, msgB, pinA, pinB, unlockDate, side, sealedAt);
  // Wrap in tlock so the image is cryptographically time-locked
  const tlockString = await tlockEncryptText(payload, unlockDate);
  return embedInImage(halfFile, new TextEncoder().encode(tlockString), unlockDate);
}

/**
 * Seal only A's message into A's half — used during initial creation.
 * B's cipher is left empty; it will be merged later.
 * tlock-wrapped so the image is unreadable until unlockDate.
 */
export async function sealCoupleHalfAOnly(
  halfFile: File,
  msgA: string,
  _pinA: string,
  pinB: string,
  unlockDate: Date,
  side: 'left' | 'right'
): Promise<Blob> {
  const sealedAt = new Date();
  const payload: CouplePayload = {
    version: 2,
    role: 'couple',
    unlock: unlockDate.toISOString(),
    sealedAt: sealedAt.toISOString(),
    side,
    a_msg: { cipher: '' },
    b_msg: { cipher: '' },
  };
  const cipherA = await encryptWithPin(msgA, pinB);
  payload.a_msg = { cipher: cipherA };
  // tlock wrap so A can't read it back before unlock date
  const tlockString = await tlockEncryptText(JSON.stringify(payload), unlockDate);
  return embedInImage(halfFile, new TextEncoder().encode(tlockString), unlockDate);
}

/**
 * Merge B's message into A's half image, producing the final complete PNG.
 * tlock-wrapped so the image is unreadable until unlockDate.
 */
export async function mergeCoupleHalfA(
  halfFileA: File,
  msgA: string,
  msgB: string,
  pinA: string,
  pinB: string,
  unlockDate: Date,
  side: 'left' | 'right',
  sealedAt: Date
): Promise<Blob> {
  const payload = await buildCouplePayload(msgA, msgB, pinA, pinB, unlockDate, side, sealedAt);
  const tlockString = await tlockEncryptText(payload, unlockDate);
  return embedInImage(halfFileA, new TextEncoder().encode(tlockString), unlockDate);
}

/**
 * Reveal the other person's message using your PIN.
 * - PIN-A → decrypts B's message (b_msg, encrypted with PIN-A)
 * - PIN-B → decrypts A's message (a_msg, encrypted with PIN-B)
 *
 * Returns null if the other person hasn't written yet (their cipher is empty).
 */
export async function revealCoupleMessage(
  imageFile: File,
  myPin: string,
  myPinType: 'A' | 'B'
): Promise<{ theirMessage: string; unlockTime: Date; sealedAt: Date } | null> {
  const binaryData = await extractFromImage(imageFile);
  const tlockString = new TextDecoder().decode(binaryData);

  // Step 1: time-lock decrypt
  const tlockDecrypted = await tlockDecryptText(tlockString);

  // Step 2: parse payload
  let payload: CouplePayload;
  try {
    payload = JSON.parse(tlockDecrypted);
  } catch {
    throw new Error('Failed to parse sealed data — this image may not be a valid TimeVault couple capsule');
  }

  if (payload.role !== 'couple') {
    throw new Error('Not a couple-mode image');
  }

  const status = checkStatus(tlockString);
  if (!status.canUnlock || !status.unlockTime) {
    const remaining = formatDuration(status.remainingSeconds);
    throw new Error(`Time lock not yet released — ${remaining} remaining`);
  }

  const target = myPinType === 'A' ? payload.b_msg : payload.a_msg;
  if (!target || !target.cipher) return null;

  const theirMessage = await decryptWithPin(target.cipher, myPin);
  return {
    theirMessage,
    unlockTime: status.unlockTime,
    sealedAt: new Date(payload.sealedAt),
  };
}

/**
 * Check if a couple image is ready to decrypt (time lock released).
 * Also returns which side this is and whether both messages are present.
 */
export async function checkCoupleStatus(
  imageFile: File
): Promise<{
  canUnlock: boolean;
  unlockTime: Date | null;
  side: 'left' | 'right' | null;
  bothMessagesPresent: boolean;
  formattedRemaining: string;
}> {
  try {
    const binaryData = await extractFromImage(imageFile);
    const tlockString = new TextDecoder().decode(binaryData);
    const status = checkStatus(tlockString);

    let side: 'left' | 'right' | null = null;
    let bothMessagesPresent = false;

    try {
      const tlockDecrypted = await tlockDecryptText(tlockString);
      const payload: CouplePayload = JSON.parse(tlockDecrypted);
      side = payload.side || null;
      bothMessagesPresent = !!(payload.a_msg?.cipher && payload.b_msg?.cipher);
    } catch {
      // payload not yet complete — ignore
    }

    return {
      canUnlock: status.canUnlock,
      unlockTime: status.unlockTime,
      side,
      bothMessagesPresent,
      formattedRemaining: status.formattedRemaining,
    };
  } catch {
    return {
      canUnlock: false,
      unlockTime: null,
      side: null,
      bothMessagesPresent: false,
      formattedRemaining: 'No hidden data found',
    };
  }
}
