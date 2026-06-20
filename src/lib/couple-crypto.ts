/**
 * TimeVault — Couple Mode Core Logic
 *
 * New design (2026):
 * Each person gets ONE half of the photo + ONE QR code exchange.
 *
 * Encryption model:
 * - A's message → encrypted with PIN-B → only B (with PIN-B) can read it
 * - B's message → encrypted with PIN-A → only A (with PIN-A) can read it
 * - Each half embeds BOTH encrypted messages, tlock-wrapped
 */

import { encryptWithPin, decryptWithPin } from './crypto';
import QRCode from 'qrcode';

// ─── Types ───────────────────────────────────────────────────

export interface CoupleSession {
  sessionId: string;
  mySide: 'left' | 'right';    // which half this person keeps
  theirSide: 'left' | 'right'; // which half the other person keeps
  unlockTime: string;           // ISO string
  // A's data (filled by A at creation)
  msgA?: string;
  pinA?: string;
  pinB?: string;              // A sets this and shares with B
  sealedAtA?: string;         // ISO time A sealed
  // B's data (filled by B)
  msgB?: string;
  // Merge state
  merged: boolean;
  mergedAt?: string;
  // Stored blob data for A's half (as base64 for localStorage)
  _halfBlobA?: string;         // base64-encoded PNG for session persistence
}

export type CoupleRole = 'A' | 'B';

// ─── URL Param Structures ────────────────────────────────────

export interface InviteParams {
  sid: string;
  u: string;
  pina: string;
  msga: string;
  half: 'left' | 'right';
  preview: string;
}

export interface MergeParams {
  sid: string;
  u: string;
  pinb: string;
  msgb: string;
  msga: string;
  sealedat: string;
  half: 'left' | 'right';
  preview?: string;
}

// ─── Local Storage ───────────────────────────────────────────

const SESSION_PREFIX = 'tv_couple_sess_';
const ACTIVE_KEY = 'tv_couple_active';

export function saveSession(session: CoupleSession): void {
  localStorage.setItem(`${SESSION_PREFIX}${session.sessionId}`, JSON.stringify(session));
}

export function loadSession(sessionId: string): CoupleSession | null {
  try {
    const raw = localStorage.getItem(`${SESSION_PREFIX}${sessionId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActiveSessionId(sessionId: string): void {
  localStorage.setItem(ACTIVE_KEY, sessionId);
}

export function getActiveSessionId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function storeBlobForSession(sessionId: string, blob: Blob): void {
  const reader = new FileReader();
  reader.onloadend = () => {
    try {
      const base64 = (reader.result as string).split(',')[1];
      const sess = loadSession(sessionId);
      if (sess) {
        sess._halfBlobA = base64;
        saveSession(sess);
      }
    } catch { /* ignore */ }
  };
  reader.readAsDataURL(blob);
}

export function getBlobFromSession(sessionId: string): Blob | null {
  const sess = loadSession(sessionId);
  if (!sess?._halfBlobA) return null;
  try {
    const byteString = atob(sess._halfBlobA);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: 'image/png' });
  } catch {
    return null;
  }
}

export function clearSession(sessionId: string): void {
  localStorage.removeItem(`${SESSION_PREFIX}${sessionId}`);
  if (getActiveSessionId() === sessionId) {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

// ─── Session ID ──────────────────────────────────────────────

export function generateSessionId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const randomValues = crypto.getRandomValues(new Uint8Array(10));
  for (let i = 0; i < 10; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  const matches = result.match(/.{1,5}/g);
  return (matches || [result]).join('-');
}

// ─── URL Generation ──────────────────────────────────────────

function buildBase(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

export function generateInviteURL(params: InviteParams): string {
  const p = new URLSearchParams();
  p.set('sid', params.sid);
  p.set('u', params.u);
  p.set('pina', params.pina);
  p.set('msga', params.msga);
  p.set('half', params.half);
  // Increase preview limit - QR codes can handle more data
  p.set('preview', params.preview.length > 1500 ? params.preview.substring(0, 1400) : params.preview);
  return `${buildBase()}#couple-b?${p.toString()}`;
}

export function generateMergeURL(params: MergeParams): string {
  const p = new URLSearchParams();
  p.set('sid', params.sid);
  p.set('u', params.u);
  p.set('pinb', params.pinb);
  p.set('msgb', params.msgb);
  p.set('msga', params.msga);
  p.set('sealedat', params.sealedat);
  p.set('half', params.half);
  if (params.preview) {
    p.set('preview', params.preview.length > 600 ? params.preview.substring(0, 500) : params.preview);
  }
  return `${buildBase()}#couple-a?${p.toString()}`;
}

// ─── URL Parsing ─────────────────────────────────────────────

export function parseInviteURL(hash: string): InviteParams | null {
  try {
    const raw = hash.startsWith('#') ? hash.slice(1) : hash;
    const paramStr = raw.split('?')[1] || '';
    const params = new URLSearchParams(paramStr);
    const sid = params.get('sid');
    const u = params.get('u');
    const pina = params.get('pina');
    const msga = params.get('msga');
    const half = params.get('half') as 'left' | 'right' | null;
    const preview = params.get('preview') || '';
    if (!sid || !u || !pina || !msga || !half) return null;
    return { sid, u, pina, msga, half, preview };
  } catch {
    return null;
  }
}

export function parseMergeURL(hash: string): MergeParams | null {
  try {
    const raw = hash.startsWith('#') ? hash.slice(1) : hash;
    const paramStr = raw.split('?')[1] || '';
    const params = new URLSearchParams(paramStr);
    const sid = params.get('sid');
    const u = params.get('u');
    const pinb = params.get('pinb');
    const msgb = params.get('msgb');
    const msga = params.get('msga');
    const sealedat = params.get('sealedat');
    const half = params.get('half') as 'left' | 'right' | null;
    const preview = params.get('preview') || '';
    if (!sid || !u || !pinb || !msgb || !msga || !sealedat || !half) return null;
    return { sid, u, pinb, msgb, msga, sealedat, half, preview: preview || undefined };
  } catch {
    return null;
  }
}

// ─── QR Code Generation ─────────────────────────────────────

export async function generateQRCodeImage(dataUrl: string): Promise<string> {
  return QRCode.toDataURL(dataUrl, {
    width: 300,
    margin: 2,
    color: {
      dark: '#e8a0a0',
      light: '#0a0612',
    },
    errorCorrectionLevel: 'M',
  });
}

// ─── Image Splitting ─────────────────────────────────────────

/**
 * Split an image into left and right halves at the given normalized position.
 */
export async function splitPhotoByRatio(
  imageFile: File,
  splitRatio: number // 0-1, normalized
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
        const splitPx = Math.max(1, Math.min(w - 1, Math.round(splitRatio * w)));

        const leftCanvas = document.createElement('canvas');
        leftCanvas.width = splitPx;
        leftCanvas.height = h;
        leftCanvas.getContext('2d')!.drawImage(img, 0, 0, splitPx, h, 0, 0, splitPx, h);

        const rightCanvas = document.createElement('canvas');
        rightCanvas.width = w - splitPx;
        rightCanvas.height = h;
        rightCanvas.getContext('2d')!.drawImage(img, splitPx, 0, w - splitPx, h, 0, 0, w - splitPx, h);

        Promise.all([
          new Promise<Blob>((res, rej) =>
            leftCanvas.toBlob(b => b ? res(b) : rej(new Error('left toBlob failed')), 'image/png')
          ),
          new Promise<Blob>((res, rej) =>
            rightCanvas.toBlob(b => b ? res(b) : rej(new Error('right toBlob failed')), 'image/png')
          ),
        ]).then(([leftBlob, rightBlob]) => {
          cleanup();
          resolve({ leftBlob, rightBlob });
        }).catch(err => { cleanup(); reject(err); });
      } catch (err) {
        cleanup();
        reject(err);
      }
    };
    img.onerror = () => { cleanup(); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

/**
 * Simple left/right split at a fixed pixel position (used by the cut editor).
 */
export async function splitPhotoSimple(
  imageFile: File,
  splitPx: number
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
        const pos = Math.max(1, Math.min(w - 1, splitPx));

        const leftCanvas = document.createElement('canvas');
        leftCanvas.width = pos;
        leftCanvas.height = h;
        leftCanvas.getContext('2d')!.drawImage(img, 0, 0, pos, h, 0, 0, pos, h);

        const rightCanvas = document.createElement('canvas');
        rightCanvas.width = w - pos;
        rightCanvas.height = h;
        rightCanvas.getContext('2d')!.drawImage(img, pos, 0, w - pos, h, 0, 0, w - pos, h);

        Promise.all([
          new Promise<Blob>((res, rej) =>
            leftCanvas.toBlob(b => b ? res(b) : rej(new Error('left toBlob failed')), 'image/png')
          ),
          new Promise<Blob>((res, rej) =>
            rightCanvas.toBlob(b => b ? res(b) : rej(new Error('right toBlob failed')), 'image/png')
          ),
        ]).then(([leftBlob, rightBlob]) => {
          cleanup();
          resolve({ leftBlob, rightBlob });
        }).catch(err => { cleanup(); reject(err); });
      } catch (err) {
        cleanup();
        reject(err);
      }
    };
    img.onerror = () => { cleanup(); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

// ─── Image Compression ───────────────────────────────────────

export async function compressForQR(imageFile: File, maxWidth = 120, quality = 0.3): Promise<string> {
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
        if (!w || !h) { cleanup(); reject(new Error('Image has no content')); return; }
        const scale = Math.min(1, maxWidth / w);
        const cw = Math.max(1, Math.round(w * scale));
        const ch = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');
        if (!ctx) { cleanup(); reject(new Error('Canvas 2D context not available')); return; }
        ctx.drawImage(img, 0, 0, cw, ch);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        cleanup();
        resolve(dataUrl);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };
    img.onerror = () => { cleanup(); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

// ─── Image Fingerprint (for verification) ──────────────────

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
        if (!w || !h) { cleanup(); reject(new Error('Image has no content')); return; }
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        if (!ctx) { cleanup(); reject(new Error('Canvas 2D context not available')); return; }
        ctx.drawImage(img, 0, 0, 16, 16);
        const data = ctx.getImageData(0, 0, 16, 16).data;
        const blocks: number[] = [];
        for (let by = 0; by < 4; by++) {
          for (let bx = 0; bx < 4; bx++) {
            let r = 0, g = 0, b = 0, count = 0;
            for (let y = by * 4; y < (by + 1) * 4; y++) {
              for (let x = bx * 4; x < (bx + 1) * 4; x++) {
                const idx = (y * 16 + x) * 4;
                r += data[idx]; g += data[idx + 1]; b += data[idx + 2]; count++;
              }
            }
            blocks.push(Math.round(r / count), Math.round(g / count), Math.round(b / count));
          }
        }
        const binary = new Uint8Array(blocks);
        let b64 = '';
        for (let i = 0; i < binary.length; i++) b64 += String.fromCharCode(binary[i]);
        cleanup();
        resolve(btoa(b64));
      } catch (err) {
        cleanup();
        reject(err);
      }
    };
    img.onerror = () => { cleanup(); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

export async function verifyOriginalImage(imageFile: File, fingerprintB64: string): Promise<boolean> {
  try {
    const newFp = await createImageFingerprint(imageFile);
    // Compare block averages with tolerance
    const orig = base64ToBytes(fingerprintB64);
    const uploaded = base64ToBytes(newFp);
    if (orig.length !== uploaded.length) return false;
    let totalDiff = 0;
    for (let i = 0; i < orig.length; i++) totalDiff += Math.abs(orig[i] - uploaded[i]);
    return totalDiff / orig.length < 30;
  } catch {
    return false;
  }
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ─── Legacy exports (backwards compatibility) ────────────────

// Re-export from crypto for convenience
export { encryptWithPin, decryptWithPin };
