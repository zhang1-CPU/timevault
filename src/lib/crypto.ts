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
const ITERATIONS = 100_000; // PBKDF2 iterations

// ─── Types ───────────────────────────────────────────────────

export interface LockStatus {
  canUnlock: boolean;
  unlockTime: Date | null;
  remainingSeconds: number;
  formattedRemaining: string;
}

// ─── PIN-Based AES Encryption ────────────────────────────────

/**
 * Derive AES key from PIN using PBKDF2.
 * 4-digit PIN -> 256-bit key via 100k iterations.
 */
async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const pinData = new TextEncoder().encode(pin);
  const baseKey = await crypto.subtle.importKey('raw', pinData, 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext with PIN.
 * Returns: base64(salt || iv || ciphertext)
 */
async function encryptWithPin(plaintext: string, pin: string): Promise<string> {
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
async function decryptWithPin(b64: string, pin: string): Promise<string> {
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
export async function sealMessage(
  message: string,
  pin: string,
  unlockDate: Date,
  imageFile: File
): Promise<Blob> {
  // Step 1: PIN-encrypt the message
  const pinEncrypted = await encryptWithPin(message, pin);

  // Step 2: Time-lock the encrypted payload
  const tlockString = await tlockEncryptText(pinEncrypted, unlockDate);

  // Step 3: Encode TLOCK string to binary
  const binaryData = new TextEncoder().encode(tlockString);

  // Step 4: Draw watermark, then LSB embed into image
  return embedInImage(imageFile, binaryData, unlockDate);
}

/**
 * Full decryption: extract from image + time-lock decrypt + PIN decrypt.
 */
export async function revealMessage(
  imageFile: File,
  pin: string
): Promise<{ message: string; unlockTime: Date | null }> {
  // Step 1: Extract TLOCK binary from image
  const binaryData = await extractFromImage(imageFile);
  const tlockString = new TextDecoder().decode(binaryData);

  // Step 2: Time-lock decrypt (checks time internally)
  const pinEncrypted = await tlockDecryptText(tlockString);

  // Step 3: PIN decrypt
  const message = await decryptWithPin(pinEncrypted, pin);

  // Get unlock time for display
  const status = checkStatus(tlockString);
  return { message, unlockTime: status.unlockTime };
}

/**
 * Check if a sealed image can be unlocked yet.
 * Does NOT need PIN — only checks time lock status.
 */
export async function checkImageStatus(imageFile: File): Promise<LockStatus> {
  try {
    const binaryData = await extractFromImage(imageFile);
    const tlockString = new TextDecoder().decode(binaryData);
    return checkStatus(tlockString);
  } catch {
    return {
      canUnlock: false,
      unlockTime: null,
      remainingSeconds: 0,
      formattedRemaining: 'No hidden data found',
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
async function embedInImage(imageFile: File, data: Uint8Array, unlockDate: Date): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(imageFile);
    let cleaned = false;
    const cleanup = () => {
      if (!cleaned) {
        cleaned = true;
        try { URL.revokeObjectURL(url); } catch { /* no-op */ }
      }
    };

    img.onload = () => {
      try {
        if (!img.width || !img.height) {
          cleanup();
          reject(new Error('Image has no content'));
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        // Draw watermark (brand logo + website + unlock time) in bottom-right corner.
        drawBrandWatermark(ctx, canvas.width, canvas.height, unlockDate);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Check capacity
        const numPixels = imageData.data.length / 4;
        const availableBits = numPixels * 3;
        const neededBits = data.length * 8 + 32;
        if (neededBits > availableBits) {
          cleanup();
          reject(
            new Error(
              `Image too small. Need ${Math.ceil(neededBits / 8)} bytes, have ${Math.floor(availableBits / 8)}. Use a larger image.`
            )
          );
          return;
        }

        embedLsb(imageData, data);
        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) resolve(blob);
            else reject(new Error('Failed to create PNG blob'));
          },
          'image/png'
        );
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Extract binary data from LSB-steganography image.
 */
async function extractFromImage(imageFile: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(imageFile);
    let cleaned = false;
    const cleanup = () => {
      if (!cleaned) {
        cleaned = true;
        try { URL.revokeObjectURL(url); } catch { /* no-op */ }
      }
    };

    img.onload = () => {
      try {
        if (!img.width || !img.height) {
          cleanup();
          reject(new Error('Image has no content'));
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          reject(new Error('Canvas 2D context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = extractLsb(imageData);

        cleanup();
        resolve(data);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

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

  // Write 32-bit length header (big-endian)
  const length = data.length;
  for (let i = 31; i >= 0; i--) {
    writeBit((length >>> i) & 1);
  }

  // Write data bytes
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

  // Read 32-bit length header
  if (numPixels < 11) { // Need at least 32 bits = 11 pixels (11*3=33 bits available)
    throw new Error('No hidden data found in this image');
  }

  let length = 0;
  for (let i = 0; i < 32; i++) {
    length = (length << 1) | readBit();
  }

  // Validate: length must be positive AND fit within remaining pixels
  // After 32-bit header: remaining bits = (numPixels * 3) - 32
  // Available data bytes = Math.floor(((numPixels * 3) - 32) / 8)
  const maxDataBytes = Math.max(0, Math.floor(((numPixels * 3) - 32) / 8));
  if (length <= 0 || length > maxDataBytes) {
    throw new Error('No hidden data found in this image');
  }

  // Read data
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
