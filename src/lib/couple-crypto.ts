/**
 * TimeVault Couple Mode - Core Logic
 *
 * Features:
 * 1. Free-form photo cutting (line-based split)
 * 2. Image compression for QR code embedding
 * 3. Session management (localStorage)
 * 4. QR code generation with embedded preview data
 * 5. Original image verification
 */

import { sealMessage, revealMessage, checkImageStatus, type LockStatus } from './crypto';
import QRCode from 'qrcode';

// ─── Types ───────────────────────────────────────────────────

export interface CoupleSession {
  sessionId: string;
  originalImageHash: string;      // hash for verification
  unlockTime: string;             // ISO string
  bHalfPreview: string;           // compressed base64 preview of B's half
  aCompleted: boolean;
  bCompleted: boolean;
  aData?: { message: string; pin: string };
  bData?: { message: string; pin: string };
  qrUsed: boolean;
}

export type CoupleStep =
  | 'landing'
  | 'upload'
  | 'cut'
  | 'a-write'
  | 'a-qr'
  | 'b-welcome'
  | 'b-verify'
  | 'b-write'
  | 'b-done';

// ─── Constants ───────────────────────────────────────────────

const SESSION_KEY = 'tv_couple_';

// ─── Session ID ──────────────────────────────────────────────

function generateSessionId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const randomValues = crypto.getRandomValues(new Uint8Array(10));
  for (let i = 0; i < 10; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  const matches = result.match(/.{1,5}/g);
  return (matches || [result]).join('-');
}

// ─── Image Hash (for verification) ───────────────────────────

/**
 * Create a compact fingerprint of an image for verification.
 * Returns a base64 string representing a 16x16 downsampled version.
 */
export async function createImageFingerprint(imageFile: File): Promise<string> {
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
        const w = img.width;
        const h = img.height;
        if (!w || !h) {
          cleanup();
          reject(new Error('Image has no content'));
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          reject(new Error('Canvas 2D context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0, 16, 16);
        const data = ctx.getImageData(0, 0, 16, 16).data;
        // Store average RGB of each 4x4 block (4x4=16 blocks)
        const blocks: number[] = [];
        for (let by = 0; by < 4; by++) {
          for (let bx = 0; bx < 4; bx++) {
            let r = 0, g = 0, b = 0, count = 0;
            for (let y = by * 4; y < (by + 1) * 4; y++) {
              for (let x = bx * 4; x < (bx + 1) * 4; x++) {
                const idx = (y * 16 + x) * 4;
                r += data[idx];
                g += data[idx + 1];
                b += data[idx + 2];
                count++;
              }
            }
            blocks.push(Math.round(r / count), Math.round(g / count), Math.round(b / count));
          }
        }
        const binary = new Uint8Array(blocks);
        let b64 = '';
        for (let i = 0; i < binary.length; i++) {
          b64 += String.fromCharCode(binary[i]);
        }
        cleanup();
        resolve(btoa(b64));
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
 * Verify if an uploaded image matches the original fingerprint.
 */
export async function verifyOriginalImage(imageFile: File, fingerprintB64: string): Promise<boolean> {
  try {
    const newFingerprint = await createImageFingerprint(imageFile);
    // Allow some tolerance - compare block averages
    const orig = base64ToBytes(fingerprintB64);
    const uploaded = base64ToBytes(newFingerprint);
    if (orig.length !== uploaded.length) return false;
    let totalDiff = 0;
    for (let i = 0; i < orig.length; i++) {
      totalDiff += Math.abs(orig[i] - uploaded[i]);
    }
    const avgDiff = totalDiff / orig.length;
    return avgDiff < 30; // threshold: average difference per channel < 30
  } catch {
    return false;
  }
}

// ─── Photo Splitting ─────────────────────────────────────────

/**
 * Split an image using a line path.
 * The path defines the boundary between side A (left/top) and side B (right/bottom).
 *
 * mode: 'vertical' = left/right split using x-coordinate at each y
 *       'horizontal' = top/bottom split using y-coordinate at each x
 */
export async function splitPhotoByPath(
  imageFile: File,
  points: { x: number; y: number }[],
  mode: 'vertical' | 'horizontal'
): Promise<{ leftBlob: Blob; rightBlob: Blob; leftCanvas: HTMLCanvasElement; rightCanvas: HTMLCanvasElement }> {
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
        const w = img.width;
        const h = img.height;
        if (!w || !h) {
          cleanup();
          reject(new Error('Image has no content'));
          return;
        }

        // Create left/top half (Side A)
        const leftCanvas = document.createElement('canvas');
        leftCanvas.width = w;
        leftCanvas.height = h;
        const leftCtx = leftCanvas.getContext('2d');
        if (!leftCtx) {
          cleanup();
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        // Create right/bottom half (Side B)
        const rightCanvas = document.createElement('canvas');
        rightCanvas.width = w;
        rightCanvas.height = h;
        const rightCtx = rightCanvas.getContext('2d');
        if (!rightCtx) {
          cleanup();
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        if (mode === 'vertical') {
          // Build a path that covers the left side
          leftCtx.beginPath();
          leftCtx.moveTo(0, 0);
          // Interpolate points to full height
          const pathPoints = interpolatePath(points, h);
          for (let y = 0; y < h; y++) {
            leftCtx.lineTo(pathPoints[y] || w / 2, y);
          }
          leftCtx.lineTo(0, h);
          leftCtx.closePath();
          leftCtx.clip();
          leftCtx.drawImage(img, 0, 0);

          // Right side
          rightCtx.beginPath();
          rightCtx.moveTo(w, 0);
          const rp = interpolatePath(points, h);
          for (let y = 0; y < h; y++) {
            rightCtx.lineTo(rp[y] || w / 2, y);
          }
          rightCtx.lineTo(w, h);
          rightCtx.closePath();
          rightCtx.clip();
          rightCtx.drawImage(img, 0, 0);
        } else {
          // Horizontal split
          const pathPoints = interpolateHorizontalPath(points, w);
          leftCtx.beginPath();
          leftCtx.moveTo(0, 0);
          for (let x = 0; x < w; x++) {
            leftCtx.lineTo(x, pathPoints[x] || h / 2);
          }
          leftCtx.lineTo(w, 0);
          leftCtx.closePath();
          leftCtx.clip();
          leftCtx.drawImage(img, 0, 0);

          rightCtx.beginPath();
          rightCtx.moveTo(0, h);
          for (let x = 0; x < w; x++) {
            rightCtx.lineTo(x, pathPoints[x] || h / 2);
          }
          rightCtx.lineTo(w, h);
          rightCtx.closePath();
          rightCtx.clip();
          rightCtx.drawImage(img, 0, 0);
        }

        // Convert to blobs
        Promise.all([
          canvasToBlob(leftCanvas),
          canvasToBlob(rightCanvas),
        ]).then(([leftBlob, rightBlob]) => {
          cleanup();
          resolve({ leftBlob, rightBlob, leftCanvas, rightCanvas });
        }).catch((err) => {
          cleanup();
          reject(err);
        });
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
 * Simple left/right split (fallback for straight line)
 */
export async function splitPhotoSimple(
  imageFile: File,
  splitX: number
): Promise<{ leftBlob: Blob; rightBlob: Blob }> {
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
        const w = img.width;
        const h = img.height;
        if (!w || !h) {
          cleanup();
          reject(new Error('Image has no content'));
          return;
        }
        const splitPos = Math.max(1, Math.min(w - 1, splitX));

        // Left half
        const leftCanvas = document.createElement('canvas');
        leftCanvas.width = splitPos;
        leftCanvas.height = h;
        leftCanvas.getContext('2d')!.drawImage(img, 0, 0, splitPos, h, 0, 0, splitPos, h);

        // Right half
        const rightCanvas = document.createElement('canvas');
        rightCanvas.width = w - splitPos;
        rightCanvas.height = h;
        rightCanvas.getContext('2d')!.drawImage(img, splitPos, 0, w - splitPos, h, 0, 0, w - splitPos, h);

        Promise.all([canvasToBlob(leftCanvas), canvasToBlob(rightCanvas)]).then(
          ([leftBlob, rightBlob]) => {
            cleanup();
            resolve({ leftBlob, rightBlob });
          }
        ).catch((err) => {
          cleanup();
          reject(err);
        });
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

// ─── Image Compression ───────────────────────────────────────

/**
 * Compress an image to a small preview suitable for QR embedding.
 * Max 200px width, JPEG quality 0.5.
 */
export async function compressForQR(imageFile: File, maxWidth = 200, quality = 0.5): Promise<string> {
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
        const w = img.width;
        const h = img.height;
        if (!w || !h) {
          cleanup();
          reject(new Error('Image has no content'));
          return;
        }
        const scale = Math.min(1, maxWidth / w);
        const cw = Math.max(1, Math.round(w * scale));
        const ch = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          reject(new Error('Canvas 2D context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0, cw, ch);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        cleanup();
        resolve(dataUrl);
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

// ─── Watermark ───────────────────────────────────────────────

export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  text: string
): void {
  ctx.save();
  const fontSize = Math.max(10, Math.min(14, h * 0.025));
  ctx.font = `${fontSize}px 'Inter', sans-serif`;
  const textWidth = ctx.measureText(text).width;
  const padding = 10;
  const pillW = textWidth + padding * 3;
  const pillH = fontSize + padding * 2;
  const pillX = (w - pillW) / 2;
  const pillY = h - pillH - 12;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  roundRect(ctx, pillX, pillY, pillW, pillH, 6);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, pillY + fontSize + padding - 1);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── QR Code ─────────────────────────────────────────────────

/**
 * Generate a short QR URL.
 * Contains: sessionId + role + compressed preview image.
 * The preview is aggressively compressed (~100px, quality 0.3)
 * to keep the total URL under ~500 chars for reliable QR scanning.
 * Full data is also stored in localStorage for same-device access.
 */
export function generateCoupleURL(session: CoupleSession): string {
  const params = new URLSearchParams();
  params.set('s', session.sessionId);
  params.set('r', 'b');
  // Include a tiny preview in URL for cross-device access
  // Truncate to ~500 chars max to keep QR scannable
  const preview = session.bHalfPreview || '';
  if (preview && preview.length < 600) {
    params.set('p', preview);
  } else if (preview) {
    // Too long - store truncated version
    params.set('p', preview.substring(0, 500));
  }
  const base = window.location.origin + window.location.pathname;
  return `${base}#couple?${params.toString()}`;
}

export async function generateQRCode(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 280,
    margin: 3,
    color: {
      dark: '#e8a0a0',
      light: '#0a0612',
    },
    errorCorrectionLevel: 'M',
  });
}

// ─── Session Management ──────────────────────────────────────

export function saveSession(session: CoupleSession): void {
  localStorage.setItem(`${SESSION_KEY}${session.sessionId}`, JSON.stringify(session));
}

export function loadSession(sessionId: string): CoupleSession | null {
  try {
    const data = localStorage.getItem(`${SESSION_KEY}${sessionId}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function markQRUsed(sessionId: string): void {
  const session = loadSession(sessionId);
  if (session) {
    session.qrUsed = true;
    saveSession(session);
  }
}

// ─── Create Full Session ─────────────────────────────────────

export async function createSession(
  originalImage: File,
  rightHalfBlob: Blob,  // B's half
  unlockTime: Date
): Promise<CoupleSession> {
  const sessionId = generateSessionId();
  const hash = await createImageFingerprint(originalImage);

  // Compress B's half for QR preview
  const rightFile = new File([rightHalfBlob], 'b-half.jpg', { type: 'image/jpeg' });
  const bPreview = await compressForQR(rightFile, 180, 0.45);

  const session: CoupleSession = {
    sessionId,
    originalImageHash: hash,
    unlockTime: unlockTime.toISOString(),
    bHalfPreview: bPreview,
    aCompleted: false,
    bCompleted: false,
    qrUsed: false,
  };
  saveSession(session);
  return session;
}

// ─── Seal Message (wraps core crypto) ────────────────────────

export async function sealHalf(
  halfBlob: Blob,
  message: string,
  pin: string,
  unlockDate: Date
): Promise<Blob> {
  const halfFile = new File([halfBlob], 'half.png', { type: 'image/png' });
  return sealMessage(message.trim(), pin, unlockDate, halfFile);
}

// ─── Utilities ───────────────────────────────────────────────

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to blob failed'));
      }, 'image/png');
    } catch (err) {
      reject(err);
    }
  });
}

function interpolatePath(points: { x: number; y: number }[], targetHeight: number): number[] {
  if (points.length < 2) {
    const defaultX = points.length === 1 ? points[0].x : 0.5;
    return new Array(targetHeight).fill(defaultX * targetHeight);
  }
  const sorted = [...points].sort((a, b) => a.y - b.y);
  const result: number[] = [];
  for (let y = 0; y < targetHeight; y++) {
    const normY = y / targetHeight;
    // Find surrounding points
    let x = sorted[0].x;
    for (let i = 0; i < sorted.length - 1; i++) {
      if (normY >= sorted[i].y && normY <= sorted[i + 1].y) {
        const t = (normY - sorted[i].y) / (sorted[i + 1].y - sorted[i].y);
        x = sorted[i].x + (sorted[i + 1].x - sorted[i].x) * t;
        break;
      }
    }
    if (normY > sorted[sorted.length - 1].y) {
      x = sorted[sorted.length - 1].x;
    }
    result.push(x * targetHeight);
  }
  return result;
}

function interpolateHorizontalPath(points: { x: number; y: number }[], targetWidth: number): number[] {
  if (points.length < 2) {
    const defaultY = points.length === 1 ? points[0].y : 0.5;
    return new Array(targetWidth).fill(defaultY * targetWidth);
  }
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const result: number[] = [];
  for (let x = 0; x < targetWidth; x++) {
    const normX = x / targetWidth;
    let y = sorted[0].y;
    for (let i = 0; i < sorted.length - 1; i++) {
      if (normX >= sorted[i].x && normX <= sorted[i + 1].x) {
        const t = (normX - sorted[i].x) / (sorted[i + 1].x - sorted[i].x);
        y = sorted[i].y + (sorted[i + 1].y - sorted[i].y) * t;
        break;
      }
    }
    if (normX > sorted[sorted.length - 1].x) {
      y = sorted[sorted.length - 1].y;
    }
    result.push(y * targetWidth);
  }
  return result;
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Re-export
export { sealMessage, revealMessage, checkImageStatus };
export type { LockStatus };
