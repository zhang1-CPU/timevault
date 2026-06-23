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

// LSB magic constants for legacy format detection
const MAGIC_LENGTH = 4;
const MAGIC_BYTES = new Uint8Array([0x54, 0x56, 0x4C, 0x54]); // "TVLT"

// ─── Types ───────────────────────────────────────────────────

export interface LockStatus {
  canUnlock: boolean;
  unlockTime: Date | null;
  remainingSeconds: number;
  formattedRemaining: string;
  checkTimeMs?: number;
  isCoupleMode?: boolean;    // true if the image contains two-person sealed messages
  isCoupleModeReady?: boolean; // true if both a_msg & b_msg ciphers are present in the payload
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
  const binaryData = await extractFromImage(imageFile);
  const tlockString = new TextDecoder().decode(binaryData);

  const pinEncrypted = await tlockDecryptText(tlockString);

  // Detect couple-mode payload: it's JSON carrying two ciphertext messages.
  // Attempting to feed JSON through decryptWithPin would fail with an
  // unhelpful "atob" error — intercept early and give the user clear
  // instructions.
  let maybeCouple: { role?: string } | null = null;
  try {
    maybeCouple = JSON.parse(pinEncrypted);
  } catch {
    maybeCouple = null;
  }
  if (maybeCouple && maybeCouple.role === 'couple') {
    throw new Error(
      'This is a two-person message — open it through the Couple unlock page. ' +
      'You will need your own half of the original image and the PIN set when writing it.'
    );
  }

  // Single-person flow: expect a base64(salt+iv+ciphertext) string.
  const raw = await decryptWithPin(pinEncrypted, pin);

  // Unwrap seal-time prefix for single-person messages.
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
    // Fast check: if the uploaded file is JPEG / JPG, LSB data is destroyed
    const isJpeg = /\.(jpe?g)$/i.test(imageFile.name) ||
                   imageFile.type === 'image/jpeg' ||
                   (imageFile.type === '' && imageFile.name.endsWith('.jpg'));
    if (isJpeg) {
      throw new Error('JPEG_COMPRESSION');
    }

    const binaryData = await extractFromImage(imageFile);
    const tlockString = new TextDecoder().decode(binaryData);

    const status = checkStatus(tlockString);

    // Detect couple-mode payload so the UI can route users to the right page
    // (instead of letting them hit a cryptic "atob" error later).
    try {
      const decoded = await tlockDecryptText(tlockString);
      const payload = JSON.parse(decoded);
      if (payload && payload.role === 'couple') {
        status.isCoupleMode = true;
        status.isCoupleModeReady = !!(payload.a_msg?.cipher && payload.b_msg?.cipher);
      }
    } catch {
      // If tlock isn't ready yet, or the payload isn't JSON, ignore — status
      // as returned by checkStatus is still accurate (e.g. "not yet unlocked").
    }

    return status;
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
const MAX_DIMENSION = 2048;

/**
 * Draw a source image/bitmap into a canvas, automatically fitting within
 * MAX_DIMENSION on the longest edge.
 *
 * Critical behavior:
 * - When downscaling is needed: enable smoothing for best visual quality
 * - When drawing 1:1 (no scale): disable smoothing entirely so pixel values
 *   are preserved exactly — this is essential for LSB steganography round-trip
 */
function drawSourceFitted(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  target: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): void {
  const longest = Math.max(srcW, srcH);
  if (longest > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / longest;
    const w = Math.max(1, Math.round(srcW * scale));
    const h = Math.max(1, Math.round(srcH * scale));
    target.width = w;
    target.height = h;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // 9-arg form: source rect (0,0,srcW,srcH) → dest rect (0,0,w,h)
    ctx.drawImage(source, 0, 0, srcW, srcH, 0, 0, w, h);
  } else {
    // Source fits as-is — exact 1:1 copy, NO smoothing to preserve pixel values
    target.width = srcW;
    target.height = srcH;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, 0, 0);
  }
}

/**
 * Load a source image into a canvas for ENCRYPTION.
 *
 * - Applies EXIF orientation (so portrait photos from iPhones display correctly)
 * - Auto-downscales to MAX_DIMENSION for memory safety
 * - For unscaled images: disables smoothing to preserve pixel values
 */
async function loadImageForEncryption(
  imageFile: File,
): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> {
  if (typeof createImageBitmap !== 'undefined') {
    try {
      const bitmap = await createImageBitmap(imageFile, {
        imageOrientation: 'from-image',
        premultiplyAlpha: 'none',
      } as ImageBitmapOptions);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Canvas 2D context not available');
      drawSourceFitted(bitmap, bitmap.width, bitmap.height, canvas, ctx);
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
        const decoder = img.decode ? img.decode() : Promise.resolve();
        (decoder as Promise<void>)
          .then(() => {
            if (!img.width || !img.height) {
              URL.revokeObjectURL(url);
              reject(new Error('Image has no content'));
              return;
            }
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) {
              URL.revokeObjectURL(url);
              reject(new Error('Canvas 2D context not available'));
              return;
            }
            drawSourceFitted(img, img.width, img.height, canvas, ctx);
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

/**
 * Load a sealed PNG image and return its pixel data, with maximum
 * effort to preserve exact pixel values (zero color-space conversion,
 * no smoothing, no resampling).
 *
 * This is the DECRYPTION counterpart to loadImageForEncryption — both
 * must agree on the final pixel values for the generated PNG.
 *
 * Pipeline (tried in order):
 *   1. ImageDecoder API (Safari 17+, Chrome 94+) — native, pixel-exact
 *   2. createImageBitmap + exact-size canvas with smoothing disabled
 *   3. <img> fallback + exact-size canvas
 *
 * Any canvas operations during decryption MUST:
 *   - Match the source image dimensions 1:1
 *   - Have imageSmoothingEnabled = false
 *   - Use premultiplyAlpha: 'none' (no alpha-multiplication rounding)
 *
 * Failure to do so means iOS Safari (and other browsers) will silently
 * apply color-space / gamma conversion that flips LSB bits and makes
 * the hidden message undetectable.
 */
async function loadImageDataForDecryption(imageFile: File): Promise<ImageData> {
  const w = window as unknown as {
    ImageDecoder?: new (opts: unknown) => {
      decode: () => Promise<{ image: { displayWidth: number; displayHeight: number; close?: () => void } }>;
    };
  };

  // ── Path 1: ImageDecoder API (pixel-exact native decode) ──────
  if (typeof w.ImageDecoder !== 'undefined') {
    try {
      const decoder = new w.ImageDecoder({
        data: imageFile,
        type: 'image/png',
        premultiplyAlpha: 'none',
        colorSpaceConversion: 'default',
      });
      const result = await decoder.decode();
      const canvas = document.createElement('canvas');
      canvas.width = result.image.displayWidth;
      canvas.height = result.image.displayHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        const vf = result.image as unknown as CanvasImageSource;
        ctx.drawImage(vf, 0, 0);
        result.image.close?.();
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
    } catch {
      // fall through
    }
  }

  // ── Path 2: createImageBitmap with pixel-preserving options ───
  if (typeof createImageBitmap !== 'undefined') {
    try {
      const bitmap = await createImageBitmap(imageFile, {
        imageOrientation: 'none',
        premultiplyAlpha: 'none',
      } as ImageBitmapOptions);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bitmap, 0, 0);
        (bitmap as ImageBitmap).close?.();
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
    } catch {
      // fall through
    }
  }

  // ── Path 3: <img> fallback ────────────────────────────────────
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(imageFile);
    img.onload = () => {
      const cleanup = () => URL.revokeObjectURL(url);
      try {
        const decoder = img.decode ? img.decode() : Promise.resolve();
        (decoder as Promise<void>)
          .then(() => {
            if (!img.width || !img.height) {
              cleanup();
              reject(new Error('Image has no content'));
              return;
            }
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) {
              cleanup();
              reject(new Error('Canvas 2D context not available'));
              return;
            }
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0);
            cleanup();
            resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
          })
          .catch(() => {
            cleanup();
            reject(new Error('Failed to decode image'));
          });
      } catch (err) {
        cleanup();
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
  const { canvas, ctx } = await loadImageForEncryption(imageFile);

  const w = canvas.width;
  const h = canvas.height;
  if (!w || !h) {
    throw new Error('Image has no content');
  }

  drawBrandWatermark(ctx, w, h, unlockDate);

  // Produce PNG blob from canvas (watermark drawn on top).
  const canvasPngBlob: Blob = await new Promise<Blob>((resolve, reject) => {
    const done = (blob: Blob | null) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create PNG blob'));
    };
    if (typeof (canvas as HTMLCanvasElement & { mozGetAsFile?: (name: string, type: string) => Blob }).mozGetAsFile !== 'undefined') {
      done((canvas as HTMLCanvasElement & { mozGetAsFile: (name: string, type: string) => Blob }).mozGetAsFile('timevault.png', 'image/png'));
    } else if (typeof canvas.toBlob !== 'undefined') {
      canvas.toBlob(done, 'image/png');
    } else {
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

  if (canvasPngBlob.size === 0) {
    throw new Error('Canvas produced empty PNG blob');
  }

  // Encode the payload as base64 and insert it as a PNG tEXt chunk.
  // tEXt chunks use Latin-1 encoding, so we store base64 (all ASCII-safe).
  const pngBytes = await blobToUint8Array(canvasPngBlob);
  const base64 = uint8ToBase64(data);
  const withText = insertPngTextChunk(pngBytes, TV_TEXT_KEYWORD, base64);
  return uint8ArrayToBlob(withText, 'image/png');
}

/**
 * Extract binary data from a sealed TimeVault PNG.
 *
 * Tries two methods, in order:
 *   1. PNG tEXt chunk (new format) — lossless, survives iOS color-space conversion
 *   2. LSB steganography (legacy format) — for backward compatibility
 */
async function extractFromImage(imageFile: File): Promise<Uint8Array> {
  // ── Method 1: PNG tEXt chunk (new, reliable) ────────────────
  const fileBytes = await blobToUint8Array(imageFile);
  const textValue = extractPngTextChunk(fileBytes, TV_TEXT_KEYWORD);
  if (textValue !== null) {
    try {
      return base64ToUint8(textValue);
    } catch {
      // fall through to LSB fallback
    }
  }

  // ── Method 2: LSB steganography (legacy, for old images) ────
  const imageData = await loadImageDataForDecryption(imageFile);
  if (!imageData.width || !imageData.height) {
    throw new Error('Image has no content');
  }
  return extractLsb(imageData);
}

// ─── PNG tEXt Chunk Storage ──────────────────────────────────
//
// We store the sealed payload in a PNG tEXt (text) chunk instead of
// LSB steganography. Why?
//
//   1. iOS Safari applies color-space / gamma conversion when
//      round-tripping PNG pixels through <canvas>, which silently
//      flips the least-significant bits and breaks LSB steganography.
//   2. PNG tEXt chunks are a standard, lossless metadata mechanism —
//      the data survives any pixel-level processing (watermarks,
//      resizing to the same canvas, etc.).
//   3. The payload is already encrypted (AES-256 + tlock), so
//      storing it in a tEXt chunk is just as secure as hiding it
//      in pixel bits.
//
// The keyword is "TimeVault" and the value is base64-encoded binary
// data (the tlock-encrypted payload).
//
// For backward compatibility, we still try LSB extraction as a
// fallback when no tEXt chunk is found.

const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const TV_TEXT_KEYWORD = 'TimeVault';

let crcTable: Uint32Array | null = null;

function getCrcTable(): Uint32Array {
  if (crcTable) return crcTable;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  crcTable = table;
  return table;
}

function crc32(buf: Uint8Array): number {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint32BE(value: number): Uint8Array {
  const b = new Uint8Array(4);
  b[0] = (value >>> 24) & 0xff;
  b[1] = (value >>> 16) & 0xff;
  b[2] = (value >>> 8) & 0xff;
  b[3] = value & 0xff;
  return b;
}

function readUint32BE(buf: Uint8Array, offset: number): number {
  return (
    ((buf[offset] & 0xff) << 24) |
    ((buf[offset + 1] & 0xff) << 16) |
    ((buf[offset + 2] & 0xff) << 8) |
    (buf[offset + 3] & 0xff)
  ) >>> 0;
}

/**
 * Insert a tEXt chunk into a PNG file right after IHDR.
 * keyword + \0 + text (ISO-8859-1 encoded)
 */
function insertPngTextChunk(pngBytes: Uint8Array, keyword: string, text: string): Uint8Array {
  // Verify PNG signature
  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (pngBytes[i] !== PNG_SIGNATURE[i]) {
      throw new Error('Not a valid PNG file');
    }
  }

  // Build the tEXt chunk data: keyword (ASCII) + null + text (Latin-1)
  const keywordBytes = new Uint8Array(keyword.length);
  for (let i = 0; i < keyword.length; i++) {
    keywordBytes[i] = keyword.charCodeAt(i) & 0xff;
  }
  const textBytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    textBytes[i] = text.charCodeAt(i) & 0xff;
  }
  const chunkDataLen = keywordBytes.length + 1 + textBytes.length;
  const chunkData = new Uint8Array(chunkDataLen);
  chunkData.set(keywordBytes, 0);
  chunkData[keywordBytes.length] = 0;
  chunkData.set(textBytes, keywordBytes.length + 1);

  // Build tEXt chunk: type (4) + data
  const chunkType = new Uint8Array([0x74, 0x45, 0x58, 0x74]); // "tEXt"
  const typePlusData = new Uint8Array(4 + chunkDataLen);
  typePlusData.set(chunkType, 0);
  typePlusData.set(chunkData, 4);
  const crcVal = crc32(typePlusData);
  const crcBytes = writeUint32BE(crcVal);

  // Find IHDR end position
  const ihdrLen = readUint32BE(pngBytes, 8);
  const ihdrEnd = 8 + 4 + ihdrLen + 4; // after IHDR CRC

  // Assemble: signature + IHDR + tEXt + rest
  const result = new Uint8Array(PNG_SIGNATURE.length + (pngBytes.length - PNG_SIGNATURE.length) + 4 + 4 + chunkDataLen + 4);
  let pos = 0;
  result.set(pngBytes.subarray(0, ihdrEnd), pos);
  pos += ihdrEnd;
  result.set(writeUint32BE(chunkDataLen), pos);
  pos += 4;
  result.set(typePlusData, pos);
  pos += 4 + chunkDataLen;
  result.set(crcBytes, pos);
  pos += 4;
  result.set(pngBytes.subarray(ihdrEnd), pos);

  return result;
}

/**
 * Extract a tEXt chunk value by keyword from a PNG file.
 * Returns null if not found.
 */
function extractPngTextChunk(pngBytes: Uint8Array, keyword: string): string | null {
  // Verify PNG signature
  if (pngBytes.length < PNG_SIGNATURE.length) return null;
  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (pngBytes[i] !== PNG_SIGNATURE[i]) return null;
  }

  let offset = PNG_SIGNATURE.length;
  while (offset < pngBytes.length - 8) {
    const length = readUint32BE(pngBytes, offset);
    const type = String.fromCharCode(
      pngBytes[offset + 4],
      pngBytes[offset + 5],
      pngBytes[offset + 6],
      pngBytes[offset + 7],
    );

    if (type === 'IEND') break;

    if (type === 'tEXt') {
      const dataStart = offset + 8;
      const dataEnd = dataStart + length;
      // Find null separator
      let nullIdx = -1;
      for (let i = dataStart; i < dataEnd; i++) {
        if (pngBytes[i] === 0) {
          nullIdx = i;
          break;
        }
      }
      if (nullIdx !== -1) {
        const kw = String.fromCharCode(...pngBytes.subarray(dataStart, nullIdx));
        if (kw === keyword) {
          const textBytes = pngBytes.subarray(nullIdx + 1, dataEnd);
          let text = '';
          for (let i = 0; i < textBytes.length; i++) {
            text += String.fromCharCode(textBytes[i]);
          }
          return text;
        }
      }
    }

    offset += 12 + length; // length + type + data + crc
  }

  return null;
}

function uint8ArrayToBlob(bytes: Uint8Array, type: string): Blob {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([buffer], { type });
}

async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// ─── LSB Implementation ──────────────────────────────────────

function extractLsb(imageData: ImageData): Uint8Array {
  const pixels = imageData.data;
  const numPixels = pixels.length / 4;
  // Mirror the encoder: reserve the same watermark-safe region at the
  // end of the pixel buffer so we never try to read bits that were
  // overwritten by the brand watermark.
  const watermarkPixelCount = Math.min(
    Math.max(2000, Math.floor(numPixels * 0.02)),
    Math.floor(numPixels * 0.1)
  );
  const usablePixels = Math.max(1, numPixels - watermarkPixelCount);

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
  if (usablePixels < minPixelsNeeded) {
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

  // Step 4: validate — length must fit in remaining usable bits
  const totalBitBudget = usablePixels * 3;
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
