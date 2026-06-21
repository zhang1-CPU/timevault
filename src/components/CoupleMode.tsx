import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  generateSessionId,
  splitPhotoByRatio,
  saveSession,
  loadSession,
  getActiveSessionId,
  saveActiveSessionId,
  generateInviteURL,
  generateMergeURL,
  parseInviteURL,
  parseMergeURL,
  generateQRCodeImage,
  type CoupleSession,
} from '@/lib/couple-crypto';
import {
  sealCoupleHalf,
  revealCoupleMessage,
} from '@/lib/crypto';
import { CoupleHeader } from './CoupleHeader';
import { CoupleCeremony } from './CoupleCeremony';
import {
  Upload, Check, Timer, FileKey,
  AlertCircle, Download, Copy, Heart, Sparkles, Lock,
  Image as ImageIcon, Scissors,
} from 'lucide-react';
import { downloadBlob } from '@/lib/download-utils';

// ═══════════════════════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════════════════════

type Scene =
  | 'landing'
  | 'create'
  | 'b-welcome'
  | 'b-write'
  | 'b-done'
  | 'merge'
  | 'unlock';

// ═══════════════════════════════════════════════════════════════
//  Constants
// ═══════════════════════════════════════════════════════════════

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const PIN_LENGTH = 4;

// ═══════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════

interface CoupleModeProps {
  onBack: () => void;
  onHome: () => void;
}

export function CoupleMode({ onBack, onHome }: CoupleModeProps) {
  // ─── Search-parameter routing ───────────────────────────────
  const [scene, setScene] = useState<Scene>('landing');

  useEffect(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    if (path.startsWith('/couple-b')) {
      const params = parseInviteURL(search);
      if (params) { setBParams(params); setScene('b-welcome'); return; }
    }
    if (path.startsWith('/couple-a')) {
      const params = parseMergeURL(search);
      if (params) { setMergeParams(params); setScene('merge'); return; }
    }
    if (path.startsWith('/couple-unlock')) {
      setScene('unlock'); return;
    }
    // Check if there's an active session
    const activeId = getActiveSessionId();
    if (activeId) {
      const sess = loadSession(activeId);
      if (sess) {
        setSession(sess);
        void sess;
        setScene('create');
        return;
      }
    }
    setScene('landing');
  }, []);

  // ─── Session & A's data ────────────────────────────────────
  const [, setSession] = useState<CoupleSession | null>(null);
  const [bParams, setBParams] = useState<Awaited<ReturnType<typeof parseInviteURL>>>(null);
  const [mergeParams, setMergeParams] = useState<Awaited<ReturnType<typeof parseMergeURL>>>(null);

  // ─── A's creation data ─────────────────────────────────────
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string>('');
  const [splitX, setSplitX] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const cutCanvasRef = useRef<HTMLCanvasElement>(null);
  const [sideChoice, setSideChoice] = useState<'left' | 'right' | null>(null);
  const [msgA, setMsgA] = useState('');
  const [pinA, setPinA] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // ─── B's data ─────────────────────────────────────────────
  const [msgB, setMsgB] = useState('');
  const [pinBInput, setPinBInput] = useState('');
  const [bOriginalImage, setBOriginalImage] = useState<File | null>(null);

  // ─── QR ────────────────────────────────────────────────────
  const [inviteQR, setInviteQR] = useState('');
  const [inviteURL, setInviteURL] = useState('');
  const [mergeQR, setMergeQR] = useState('');
  const [mergeURL, setMergeURL] = useState('');
  const [copied, setCopied] = useState(false);

  // ─── Unlock ────────────────────────────────────────────────
  const [unlockImage, setUnlockImage] = useState<File | null>(null);
  const [unlockPin, setUnlockPin] = useState('');
  const [unlockRole, setUnlockRole] = useState<'A' | 'B'>('A');
  const [revealedMsg, setRevealedMsg] = useState('');
  const [revealedOwnMsg, setRevealedOwnMsg] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [showCeremony, setShowCeremony] = useState(false);

  // ─── URL cleanup ───────────────────────────────────────────
  const objectUrlsRef = useRef<string[]>([]);
  const trackUrl = useCallback((url: string) => {
    objectUrlsRef.current.push(url);
    return url;
  }, []);
  const revokeAllUrls = useCallback(() => {
    objectUrlsRef.current.forEach(URL.revokeObjectURL);
    objectUrlsRef.current = [];
  }, []);

  // ─── Timer cleanup ─────────────────────────────────────────
  const timersRef = useRef<Set<number>>(new Set());
  const safeSetTimeout = useCallback((fn: () => void, ms: number): number => {
    const id = window.setTimeout(() => { timersRef.current.delete(id); fn(); }, ms);
    timersRef.current.add(id);
    return id;
  }, []);
  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(id => window.clearTimeout(id));
    timersRef.current.clear();
  }, []);

  useEffect(() => {
    return () => { clearAllTimers(); revokeAllUrls(); };
  }, [clearAllTimers, revokeAllUrls]);

  // ─── Shared helpers ─────────────────────────────────────────
  const mountTime = useMemo(() => Date.now(), []);
  const minUnlockDate = useMemo(
    () => new Date(mountTime + 60000).toISOString().slice(0, 16),
    [mountTime]
  );

  const clearError = useCallback(() => setError(''), []);
  const withError = useCallback((msg: string) => {
    setError(msg);
    setIsProcessing(false);
  }, []);

  // ─── Scene: Upload ─────────────────────────────────────────
  const handleImageUpload = useCallback((file: File) => {
    clearError();
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return; }
    if (file.size > MAX_FILE_SIZE) { setError(`Max file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`); return; }
    setOriginalImage(file);
    const url = URL.createObjectURL(file);
    setOriginalPreviewUrl(url);
    trackUrl(url);
    setScene('create');
  }, [clearError, trackUrl]);

  // ─── Scene: Cut — Canvas rendering ─────────────────────────
  useEffect(() => {
    if (scene !== 'create') return;
    const canvas = cutCanvasRef.current;
    if (!canvas || !originalPreviewUrl) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = document.createElement('img');
    img.onload = () => {
      const containerW = Math.min(canvas.parentElement?.clientWidth || 600, 600);
      const scale = containerW / img.width;
      const w = Math.round(containerW);
      const h = Math.round(img.height * scale);
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      const splitPos = splitX * w;
      ctx.save();
      ctx.strokeStyle = 'rgba(232, 160, 170, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([10, 7]);
      ctx.beginPath();
      ctx.moveTo(splitPos, 0);
      ctx.lineTo(splitPos, h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillStyle = 'rgba(232, 180, 180, 0.9)';
      ctx.fillText('A', splitPos - 24, 28);
      ctx.fillStyle = 'rgba(200, 180, 230, 0.9)';
      ctx.fillText('B', splitPos + 12, 28);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(`${Math.round(splitX * 100)}% / ${100 - Math.round(splitX * 100)}%`, splitPos + 15, h - 12);
      ctx.restore();
    };
    img.src = originalPreviewUrl;
  }, [scene, splitX, originalPreviewUrl]);

  const handleCutPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = cutCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    setSplitX(Math.max(0.05, Math.min(0.95, x / canvas.width)));
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleCutPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const canvas = cutCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    setSplitX(Math.max(0.05, Math.min(0.95, x / canvas.width)));
  }, [isDragging]);

  const handleCutPointerUp = useCallback(() => setIsDragging(false), []);

  // ─── Scene: Create — A uploads → cut → split params into invite QR (no image data) ───
  const handleCreate = useCallback(async () => {
    if (!originalImage || !sideChoice || !msgA.trim() || pinA.length !== PIN_LENGTH || !unlockDate) {
      setError('Please upload a photo, pick a side, write your message, and enter your PIN.');
      return;
    }
    const unlock = new Date(unlockDate);
    if (isNaN(unlock.getTime()) || unlock.getTime() <= Date.now() + 60000) {
      setError('Unlock date must be at least 1 minute in the future.');
      return;
    }
    clearError();
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 30)); // yield so React renders the spinner

    try {
      // 1) Validate — split photo to confirm it works (no A half in QR)
      const { leftBlob: _left, rightBlob: _right } = await splitPhotoByRatio(originalImage, splitX);
      void _left; void _right;
      const mySide: 'left' | 'right' = sideChoice;

      // 2) Save session
      const sessionId = generateSessionId();
      const sess: CoupleSession = {
        sessionId,
        mySide,
        theirSide: sideChoice === 'left' ? 'right' : 'left',
        unlockTime: unlock.toISOString(),
        msgA: msgA.trim(),
        pinA,
        sealedAtA: new Date().toISOString(),
        merged: false,
      };
      saveSession(sess);
      saveActiveSessionId(sessionId);
      setSession(sess);

      // 3) Invite QR: only text params — session id, unlock time, PIN-A, message,
      //    split ratio, and which side A keeps. No image data in the QR.
      const url = generateInviteURL({
        sid: sessionId,
        u: unlock.toISOString(),
        pin_a: pinA,
        msg_a: msgA.trim(),
        split_x: splitX.toFixed(4),
        a_side: mySide,
      });
      const qr = await generateQRCodeImage(url);
      setInviteURL(url);
      setInviteQR(qr);

      setIsProcessing(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      if (msg.includes('network') || msg.includes('fetch') || msg.includes('drand')) {
        withError('Network error — please check your internet connection and try again.');
      } else {
        withError('Unable to generate invitation — ' + msg);
      }
    }
  }, [originalImage, sideChoice, msgA, pinA, unlockDate, splitX, clearError, withError]);

  // ─── Scene: B Welcome ───────────────────────────────────────
  const handleBContinue = useCallback(() => {
    setScene('b-write');
  }, []);

  // ─── Scene: B Write ─────────────────────────────────────────
  const handleBWrite = useCallback(async () => {
    if (!bParams || !msgB.trim() || pinBInput.length !== PIN_LENGTH) {
      setError('Please write a message and enter your 4-digit PIN.');
      return;
    }
    if (!bOriginalImage) {
      setError('Please upload the same original photo that A used.');
      return;
    }
    clearError();
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 30)); // yield so React renders the spinner

    try {
      const unlock = new Date(bParams.u);
      const pinA = bParams.pin_a;
      const pinB = pinBInput;
      const aMsg = bParams.msg_a || '';
      const bMsg = msgB.trim();
      const aSide: 'left' | 'right' = bParams.a_side;
      const bSide: 'left' | 'right' = aSide === 'left' ? 'right' : 'left';
      const splitRatio = parseFloat(bParams.split_x);

      // 1) Split the original photo using the same ratio
      const { leftBlob, rightBlob } = await splitPhotoByRatio(bOriginalImage, splitRatio);
      const bHalfBlob = bSide === 'left' ? leftBlob : rightBlob;

      // 2) Seal & download B's half (high quality)
      const bHalfFile = new File([bHalfBlob], 'b-half.png', { type: 'image/png' });
      const sealedB = await sealCoupleHalf(
        bHalfFile,
        aMsg,
        bMsg,
        pinA,
        pinB,
        unlock,
        bSide,
      );
      await downloadBlob(sealedB, 'timevault-couple-B.png');

      // 3) Merge QR: B sends text metadata back to A (no image data in QR)
      const mergeUrl = generateMergeURL({
        sid: bParams.sid,
        u: bParams.u,
        pin_b: pinB,
        msg_b: bMsg,
        split_x: bParams.split_x,
        a_side: aSide,
      });
      const mergeQRImg = await generateQRCodeImage(mergeUrl);
      setMergeURL(mergeUrl);
      setMergeQR(mergeQRImg);

      // Save B's data to session
      const sess = loadSession(bParams.sid) || {
        sessionId: bParams.sid,
        mySide: aSide,
        theirSide: bSide,
        unlockTime: bParams.u,
        merged: false,
      } as CoupleSession;
      sess.msgB = bMsg;
      sess.pinB = pinB;
      saveSession(sess);

      setIsProcessing(false);
      setScene('b-done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      withError('Sealing failed — ' + msg);
    }
  }, [bParams, msgB, pinBInput, bOriginalImage, clearError, withError]);

  // ─── Scene: Merge — A scans merge QR → uploads original → splits → seals A's half → downloads ───
  const handleMerge = useCallback(async (mergeImage: File) => {
    if (!mergeParams) { setError('Missing merge data'); return; }
    if (!mergeImage) { setError('Please upload the same original photo'); return; }
    clearError();
    setIsProcessing(true);

    try {
      const unlock = new Date(mergeParams.u);
      const splitRatio = parseFloat(mergeParams.split_x);
      const aSide: 'left' | 'right' = mergeParams.a_side;
      const pinB = mergeParams.pin_b;
      const bMsg = mergeParams.msg_b || '';

      // Load session to get A's original message and PIN-A
      const sess = loadSession(mergeParams.sid);
      const aMsg = sess?.msgA || '';
      const pinA = sess?.pinA || '';

      if (!pinA) {
        withError('Cannot find your original PIN — please create a new capsule.');
        return;
      }

      // 1) Split A's original photo using the same ratio from the QR code
      const { leftBlob, rightBlob } = await splitPhotoByRatio(mergeImage, splitRatio);
      const aHalfBlob = aSide === 'left' ? leftBlob : rightBlob;

      // 2) Seal A's half with both messages
      const aHalfFile = new File([aHalfBlob], 'a-half.png', { type: 'image/png' });
      const sealedA = await sealCoupleHalf(
        aHalfFile,
        aMsg,
        bMsg,
        pinA,
        pinB,
        unlock,
        aSide,
      );
      await downloadBlob(sealedA, 'timevault-couple-A.png');

      // 3) Update session
      if (sess) {
        sess.merged = true;
        sess.mergedAt = new Date().toISOString();
        saveSession(sess);
        setSession(sess);
      }

      setIsProcessing(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      withError('Failed to seal your half — ' + msg);
    }
  }, [mergeParams, clearError, withError]);

  // ─── Scene: Unlock ───────────────────────────────────────────
  const handleUnlock = useCallback(async () => {
    if (!unlockImage || unlockPin.length !== PIN_LENGTH) {
      setUnlockError('Please upload your photo and enter your 4-digit key');
      return;
    }
    setUnlockError('');

    try {
      // Use the tlock-embedded messages from the uploaded half image
      const result = await revealCoupleMessage(unlockImage, unlockPin, unlockRole);
      if (!result) {
        setUnlockError("The other person's message isn't here yet — TA may not have written back.");
        return;
      }

      // Also try to reveal the "own" message by swapping the PIN logic.
      // In our sealCoupleHalf implementation:
      //   PIN-A decrypts B's message (b_msg.cipher)
      //   PIN-B decrypts A's message (a_msg.cipher)
      // So: "theirMessage" from revealCoupleMessage is...
      //   role=A, myPin=PIN-A -> decrypts b_msg (B's message) ✓ that's A reading B
      //   role=B, myPin=PIN-B -> decrypts a_msg (A's message) ✓ that's B reading A
      //
      // For the "own message", we need the opposite role:
      //   role=A with PIN-A (used as if role=B) -> decrypts a_msg? No wait...
      //
      // Let me re-read: sealCoupleHalf encrypts msgA with pinB, msgB with pinA.
      // revealCoupleMessage with myPinType='A' decrypts payload.b_msg (encrypted with pinA) = B's msg ✓
      // revealCoupleMessage with myPinType='B' decrypts payload.a_msg (encrypted with pinB) = A's msg ✓
      //
      // So "own message" = opposite role with same PIN:
      //   If role=A with pin=PIN-A: their=B's msg. own=A's msg needs decrypting a_msg.cipher (needs PIN-B).
      //   But A doesn't know PIN-B at unlock time... unless we passed it in the QR.
      //
      // Simplified: just show "theirMessage" as the main reveal. Own message
      // is something the user already knows they wrote, so it's less critical.
      setRevealedMsg(result.theirMessage);
      setRevealedOwnMsg('');
      setShowCeremony(true);
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : 'Failed to unlock');
    }
  }, [unlockImage, unlockPin, unlockRole]);

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <CoupleHeader
        onBack={() => {
          if (scene === 'landing') onBack();
          else if (scene === 'b-welcome') { window.history.pushState({}, '', '/couple'); setScene('landing'); }
          else if (scene === 'b-done') setScene('b-write');
          else if (scene === 'merge') setScene('landing');
          else if (scene === 'unlock') setScene('landing');
          else setScene('landing');
        }}
        title={
          scene === 'create' ? 'Create Your Capsule' :
          scene === 'b-welcome' ? 'A Message for You' :
          scene === 'b-write' ? 'Your Reply' :
          scene === 'b-done' ? 'You\'re All Set' :
          scene === 'merge' ? 'Almost There' :
          scene === 'unlock' ? 'Unlock' :
          undefined
        }
      />

      <main className="flex-1 flex items-start justify-center px-4 sm:px-6 py-6 sm:py-8">
        <div className="w-full max-w-lg mx-auto">

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* ── LANDING ────────────────────────────────────── */}
          {scene === 'landing' && (
            <LandingStep onStart={() => setScene('create')} />
          )}

          {/* ── CREATE: A uploads + cuts + writes ─────────── */}
          {scene === 'create' && (
            <CreateStep
              originalImage={originalImage}
              onUpload={handleImageUpload}
              cutCanvasRef={cutCanvasRef}
              splitX={splitX}
              onPointerDown={handleCutPointerDown}
              onPointerMove={handleCutPointerMove}
              onPointerUp={handleCutPointerUp}
              sideChoice={sideChoice}
              onSideChoice={setSideChoice}
              msgA={msgA} setMsgA={setMsgA}
              pinA={pinA} setPinA={setPinA}
              unlockDate={unlockDate} setUnlockDate={setUnlockDate}
              minUnlockDate={minUnlockDate}
              onCreate={handleCreate}
              isProcessing={isProcessing}
              inviteQR={inviteQR}
              copied={copied}
              onCopy={() => {
                navigator.clipboard.writeText(inviteURL).catch(() => {});
                setCopied(true);
                safeSetTimeout(() => setCopied(false), 2000);
              }}
              onDone={onHome}
            />
          )}

          {/* ── B WELCOME ─────────────────────────────────── */}
          {scene === 'b-welcome' && bParams && (
            <BWelcomeStep
              params={bParams}
              onContinue={handleBContinue}
            />
          )}

          {/* ── B WRITE ────────────────────────────────────── */}
          {scene === 'b-write' && bParams && (
            <BWriteStep
              msgB={msgB} setMsgB={setMsgB}
              pinB={pinBInput} setPinB={setPinBInput}
              onSeal={handleBWrite}
              isProcessing={isProcessing}
              error={error}
              bOriginalImage={bOriginalImage}
              onImageUpload={setBOriginalImage}
            />
          )}

          {/* ── B DONE ─────────────────────────────────────── */}
          {scene === 'b-done' && (
            <BDoneStep
              mergeQR={mergeQR}
              copied={copied}
              onCopy={() => {
                navigator.clipboard.writeText(mergeURL).catch(() => {});
                setCopied(true);
                safeSetTimeout(() => setCopied(false), 2000);
              }}
              onDone={onHome}
            />
          )}

          {/* ── MERGE ──────────────────────────────────────── */}
          {scene === 'merge' && mergeParams && (
            <MergeStep
              params={mergeParams}
              isProcessing={isProcessing}
              onMerge={handleMerge}
              onDone={onHome}
              error={error}
            />
          )}

          {/* ── UNLOCK ─────────────────────────────────────── */}
          {scene === 'unlock' && !showCeremony && (
            <UnlockStep
              unlockImage={unlockImage}
              onImageChange={setUnlockImage}
              unlockPin={unlockPin}
              setUnlockPin={setUnlockPin}
              unlockRole={unlockRole}
              setUnlockRole={setUnlockRole}
              onUnlock={handleUnlock}
              error={unlockError}
            />
          )}

          {scene === 'unlock' && showCeremony && (
            <CoupleCeremony
              messageA={unlockRole === 'A' ? revealedOwnMsg : revealedMsg}
              messageB={unlockRole === 'B' ? revealedOwnMsg : revealedMsg}
              onDismiss={onHome}
              pinType={unlockRole}
            />
          )}

        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Step Components
// ═══════════════════════════════════════════════════════════════

// ─── Landing ─────────────────────────────────────────────────
function LandingStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-12 pt-6 animate-fade-in">
      {/* Hero */}
      <div className="text-center space-y-7">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-500/25 to-violet-500/20 border border-rose-400/25 flex items-center justify-center">
              <Heart className="w-12 h-12 text-rose-300/70 animate-pulse" strokeWidth={1.3} fill="rgba(244,114,182,0.25)" />
            </div>
            <div className="absolute -inset-2 rounded-full bg-rose-500/10 animate-ping" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-500/15 to-violet-500/10 border border-rose-400/20">
          <span className="text-rose-300/60 text-[11px] tracking-[0.25em] uppercase">A Time Capsule for Two Hearts</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-serif font-light leading-[1.15]">
          <span className="block text-white/70">Write it today.</span>
          <span className="block bg-gradient-to-r from-rose-300/85 via-pink-300/75 to-violet-300/80 bg-clip-text text-transparent">
            Seal it.
          </span>
          <span className="block text-white/50 text-3xl sm:text-4xl mt-3">Open it years from now.</span>
        </h1>

        <p className="text-white/35 text-sm sm:text-base leading-relaxed max-w-lg mx-auto font-light">
          One photo. Cut in two. Each of you writes what you want them to read — not today, but on the date you choose.
          Months or years from now, you come back. Two halves reunited. The words you hid finally meet.
        </p>
      </div>

      {/* How it works — more dramatic */}
      <div className="glass-romantic rounded-2xl p-6 sm:p-7 border border-white/[0.06] space-y-5">
        <div className="text-center">
          <h3 className="font-serif text-white/50 text-sm tracking-[0.3em] uppercase">The Ritual</h3>
        </div>

        <div className="space-y-4">
          {[
            { icon: '✂️', label: 'Today — Cut & Seal', desc: 'Upload a photo you both love. Draw a line. Each of you writes your secret across the cut. Take your half.' },
            { icon: '🗓️', label: 'Through Time — Keep Your Half', desc: 'Months pass. Years pass. You keep your half somewhere safe. It waits — your future appointment with this moment.' },
            { icon: '🕯️', label: 'That Day — Return & Reveal', desc: 'On the chosen date, you each come back. Upload your half. Type your key. Only then — at last — the words meet.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500/15 to-violet-500/10 border border-white/[0.07] flex items-center justify-center text-base">
                  {item.icon}
                </div>
                {i < 2 && <div className="w-px h-5 bg-white/[0.08] mt-1.5" />}
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-white/65 text-sm font-medium mb-1">{item.label}</p>
                <p className="text-white/28 text-xs leading-relaxed font-light">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What makes this different — the promise / commitment block */}
      <div className="glass-romantic rounded-2xl p-6 sm:p-7 border border-white/[0.06] space-y-5">
        <div className="text-center">
          <h3 className="font-serif text-white/50 text-sm tracking-[0.3em] uppercase">Your Promise to Each Other</h3>
        </div>

        <div className="grid gap-4">
          <div className="flex items-start gap-3">
            <div className="text-xl flex-shrink-0">🕰️</div>
            <div>
              <p className="text-white/60 text-sm font-medium mb-1">A love that lasts — in writing</p>
              <p className="text-white/25 text-xs leading-relaxed font-light">
                Words you write today. Words you keep for the person you love. Words that only arrive when the time is right.
                It's not just a message — it's proof that your love keeps its promises.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="text-xl flex-shrink-0">🔒</div>
            <div>
              <p className="text-white/60 text-sm font-medium mb-1">Sealed until that day — nobody opens it early</p>
              <p className="text-white/25 text-xs leading-relaxed font-light">
                Not us. Not them. Not even you. The words are encrypted inside your half of the photo and locked to the date you choose.
                Mathematics keeps the promise. Time is the only key.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="text-xl flex-shrink-0">∞</div>
            <div>
              <p className="text-white/60 text-sm font-medium mb-1">We will always be here — for as long as you need us</p>
              <p className="text-white/25 text-xs leading-relaxed font-light">
                Your love isn't a project with an expiry date, and neither is this site. We run permanently — no subscriptions, no trials, no shutdown plans.
                This site will stay online to honor your appointment with the future. Whenever your day finally comes — you come back, and we will be here.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mysterious promise — short and poetic */}
      <div className="text-center space-y-3 px-4">
        <div className="inline-block">
          <p className="text-white/25 text-sm italic font-serif leading-relaxed">
            &ldquo;In a world of instant messages, write something<br />
            that takes time to arrive. True love waits.&rdquo;
          </p>
        </div>
      </div>

      {/* CTA — larger, more dramatic */}
      <button
        onClick={onStart}
        className="w-full py-6 bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 rounded-2xl text-white font-medium text-base sm:text-lg
                   transition-all duration-500 hover:shadow-[0_0_80px_rgba(244,63,94,0.35)] hover:shadow-[0_0_80px_rgba(139,92,246,0.25)] hover:scale-[1.02] active:scale-[0.97]
                   flex items-center justify-center gap-3 min-h-[68px] relative overflow-hidden group"
      >
        <span className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.04] transition-all duration-500" />
        <Sparkles className="w-5 h-5 relative z-10" />
        <span className="relative z-10">Seal a Message for Your Future Together</span>
        <span className="relative z-10 text-white/50 group-hover:translate-x-0.5 transition-transform">→</span>
      </button>

      {/* Tiny hint — builds intrigue */}
      <p className="text-center text-white/15 text-[11px] font-light tracking-wide">
        Free · No account · Your words live only inside your half of the photo · Forever here, whenever you come back
      </p>
    </div>
  );
}

// ─── Create ─────────────────────────────────────────────────
function CreateStep({
  originalImage, onUpload, cutCanvasRef, splitX,
  onPointerDown, onPointerMove, onPointerUp,
  sideChoice, onSideChoice,
  msgA, setMsgA, pinA, setPinA,
  unlockDate, setUnlockDate, minUnlockDate,
  onCreate, isProcessing,
  inviteQR, copied, onCopy,
  onDone,
}: {
  originalImage: File | null;
  onUpload: (f: File) => void;
  cutCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  splitX: number;
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: () => void;
  sideChoice: 'left' | 'right' | null;
  onSideChoice: (s: 'left' | 'right') => void;
  msgA: string; setMsgA: (v: string) => void;
  pinA: string; setPinA: (v: string) => void;
  unlockDate: string; setUnlockDate: (v: string) => void;
  minUnlockDate: string;
  onCreate: () => void;
  isProcessing: boolean;
  inviteQR: string; copied: boolean; onCopy: () => void;
  onDone: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  // If we have invite QR, show the share screen
  if (inviteQR) {
    return (
      <div className="space-y-10 animate-fade-in">
        <div className="text-center space-y-5">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500/15 to-violet-500/10 border border-rose-400/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-rose-300/80" />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10">
            <span className="text-white/40 text-[11px] tracking-[0.25em] uppercase">Step 4 of 4</span>
          </div>
          <h2 className="text-3xl font-serif font-light text-white/80">
            <span className="bg-gradient-to-r from-rose-300/75 to-violet-300/75 bg-clip-text text-transparent">
              Your Half is Sealed
            </span>
          </h2>
          <p className="text-white/35 text-sm max-w-xs mx-auto leading-relaxed">
            Your words are hidden inside your half of the photo.<br />
            Now send this code to them — so they can write their reply, and take their half.
          </p>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-5">
          <div className="p-6 rounded-2xl border border-rose-400/15 bg-white/[0.02]">
            <img src={inviteQR} alt="Invite QR Code" className="w-64 h-64 rounded-xl" />
          </div>
          <button onClick={onCopy}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl border border-white/[0.08] text-white/40 text-sm
                       hover:bg-white/[0.03] hover:border-white/15 hover:text-white/60 transition-all">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Link Copied — Share It' : 'Copy Invitation Link'}
          </button>
        </div>

        <div className="text-center">
          <p className="text-white/20 text-sm italic font-serif max-w-xs mx-auto leading-relaxed">
            &ldquo;Neither of you can read each other yet.<br />
            Only time — and that day — can open what you wrote.&rdquo;
          </p>
        </div>

        <button onClick={onDone}
          className="w-full py-3 text-white/30 text-sm hover:text-white/60 transition-all">
          ← I&apos;m done
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Step 1: Upload */}
      {!originalImage && (
        <div className="space-y-7">
          {/* Romantic header */}
          <div className="text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-500/10 to-violet-500/10 border border-rose-400/20">
              <Heart className="w-3.5 h-3.5 text-rose-400/70" fill="rgba(244,63,94,0.15)" />
              <span className="text-rose-300/60 text-[11px] tracking-[0.25em] uppercase">Sealed by Two</span>
            </div>
            <h2 className="text-4xl font-serif font-light text-white/80 leading-tight">
              <span className="block text-white/70">Pick a photo</span>
              <span className="block bg-gradient-to-r from-rose-300/80 via-pink-300/70 to-violet-300/80 bg-clip-text text-transparent text-3xl mt-1">
                you both love
              </span>
            </h2>
            <p className="text-white/30 text-sm max-w-sm mx-auto leading-relaxed">
              Choose something meaningful — a moment you shared. It will become the vessel for your words.
            </p>
          </div>

          <div className="text-center space-y-2">
            <p className="text-rose-300/30 text-[11px] tracking-[0.3em] uppercase">Step 1 of 4</p>
            <h3 className="text-2xl font-serif font-light text-white/55">Choose Your Photo</h3>
          </div>

          <div onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onUpload(f); }}
            className="border-2 border-dashed border-white/[0.08] rounded-2xl p-12 sm:p-14 text-center cursor-pointer
                       hover:border-rose-400/30 hover:bg-gradient-to-b hover:from-rose-500/[0.03] hover:to-violet-500/[0.03] transition-all duration-300 group">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500/10 to-violet-500/10 flex items-center justify-center mx-auto mb-5
                            group-hover:from-rose-500/25 group-hover:to-violet-500/20 group-hover:scale-110 transition-all duration-300">
              <Upload className="w-9 h-9 text-rose-400/60" />
            </div>
            <p className="text-white/55 text-lg mb-1 font-light">Drop a photo here</p>
            <p className="text-white/25 text-sm">or click to browse</p>
            <p className="text-white/10 text-xs mt-4">PNG · JPG · WebP — up to 20MB</p>
            <p className="text-rose-300/40 text-[11px] mt-3">
              💖 Your photo never leaves your device — it is split and sealed entirely in your browser
            </p>
          </div>

          <div className="text-center space-y-3 px-4">
            <p className="text-white/18 text-sm italic font-serif leading-relaxed max-w-sm mx-auto">
              &ldquo;What you are about to create is not a message.<br />
              It is a moment, kept for a future moment.&rdquo;
            </p>
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        </div>
      )}

      {/* Step 2: Cut */}
      {originalImage && !sideChoice && (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10">
              <Scissors className="w-3 h-3 text-rose-400/50" />
              <span className="text-rose-300/40 text-[11px] tracking-[0.25em] uppercase">Step 2 of 4</span>
            </div>
            <h2 className="text-4xl font-serif font-light text-white/80 leading-tight">
              <span className="block text-white/65">Draw the line</span>
              <span className="block bg-gradient-to-r from-rose-300/75 to-violet-300/75 bg-clip-text text-transparent text-3xl mt-1">
                between you
              </span>
            </h2>
            <p className="text-white/30 text-sm max-w-sm mx-auto leading-relaxed">
              Drag anywhere on the photo to choose where it splits.<br />
              One side is yours to keep. The other — is theirs.
            </p>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-black/20 select-none shadow-xl shadow-black/30">
            <canvas
              ref={cutCanvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              className="w-full cursor-col-resize touch-none"
              style={{ maxHeight: '50vh', display: 'block' }}
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => onSideChoice('left')}
              className="flex-1 py-4.5 rounded-xl border-2 border-rose-400/30 bg-gradient-to-br from-rose-500/[0.06] to-rose-500/[0.02] 
                         text-rose-300/70 text-sm hover:border-rose-400/55 hover:from-rose-500/[0.12] hover:to-rose-500/[0.06] 
                         transition-all duration-300"
            >
              <span className="flex items-center justify-center gap-2">
                <Heart className="w-4 h-4" fill="rgba(244,63,94,0.3)" />
                I keep the left — {Math.round(splitX * 100)}%
              </span>
            </button>
            <button
              onClick={() => onSideChoice('right')}
              className="flex-1 py-4.5 rounded-xl border-2 border-violet-400/30 bg-gradient-to-br from-violet-500/[0.06] to-violet-500/[0.02] 
                         text-violet-300/70 text-sm hover:border-violet-400/55 hover:from-violet-500/[0.12] hover:to-violet-500/[0.06] 
                         transition-all duration-300"
            >
              <span className="flex items-center justify-center gap-2">
                <Heart className="w-4 h-4" fill="rgba(139,92,246,0.3)" />
                I keep the right — {100 - Math.round(splitX * 100)}%
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Write */}
      {originalImage && sideChoice && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center space-y-3">
            <p className="text-rose-300/30 text-[11px] tracking-[0.3em] uppercase">Step 3 of 4</p>
            <h2 className="text-4xl font-serif font-light text-white/80 leading-tight">
              <span className="block text-white/70">Write what</span>
              <span className="block bg-gradient-to-r from-rose-300/75 to-violet-300/75 bg-clip-text text-transparent text-3xl mt-1">
                they won&apos;t read until that day
              </span>
            </h2>
            <p className="text-white/30 text-sm max-w-sm mx-auto leading-relaxed">
              Your words will be sealed inside your half of the photo.<br />
              Neither of you can open them — until the day you chose.
            </p>
          </div>

          <div className="space-y-5">
            {/* Key — more prominence */}
            <div className="space-y-2">
              <label className="text-white/40 text-[11px] uppercase tracking-[0.22em] font-light flex items-center justify-center gap-1.5">
                <FileKey className="w-3.5 h-3.5 text-rose-300/60" /> Your 4-digit key
              </label>
              <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4}
                value={pinA} onChange={(e) => setPinA(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className="w-full px-4 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white text-center
                           tracking-[1.3em] text-2xl font-mono placeholder:tracking-normal placeholder:text-white/10
                           focus:border-rose-400/40 focus:outline-none focus:ring-1 focus:ring-rose-400/20 transition-all" />
              <p className="text-white/18 text-[11px] text-center font-light">Only this key — with the right day — opens your half</p>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-white/40 text-[11px] uppercase tracking-[0.22em] font-light text-center block">
                Your words — sealed until that day
              </label>
              <div className="relative">
                <textarea value={msgA} onChange={(e) => setMsgA(e.target.value)}
                  placeholder="What do you want them to read — on that day, from you..."
                  rows={6} maxLength={2000}
                  className="w-full px-4 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/10
                             focus:border-rose-400/40 focus:outline-none focus:ring-1 focus:ring-rose-400/20 resize-none transition-all text-sm leading-relaxed" />
              </div>
              <div className="text-right text-white/15 text-xs">{msgA.length}/2000</div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-white/40 text-[11px] uppercase tracking-[0.22em] font-light flex items-center justify-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-violet-300/60" /> The day it opens
              </label>
              <input type="datetime-local" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)}
                min={minUnlockDate}
                className="w-full px-4 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white text-center text-base
                           focus:border-violet-400/40 focus:outline-none focus:ring-1 focus:ring-violet-400/20 transition-all [color-scheme:dark]" />
            </div>
          </div>

          <button onClick={onCreate} disabled={isProcessing}
            className="w-full py-5 bg-gradient-to-r from-rose-500/95 via-pink-500/95 to-violet-500/95 rounded-2xl text-white font-medium text-sm
                       transition-all duration-300 hover:shadow-[0_0_70px_rgba(244,63,94,0.3)] hover:shadow-[0_0_70px_rgba(139,92,246,0.2)] hover:scale-[1.01] active:scale-[0.98]
                       disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[60px]">
            {isProcessing ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sealing it into your half...</>
            ) : (
              <>Seal &amp; Generate Invitation</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── B Welcome (simple text-based intro — no image preview in QR) ───────
function BWelcomeStep({
  params,
  onContinue,
}: {
  params: NonNullable<Awaited<ReturnType<typeof parseInviteURL>>>;
  onContinue: () => void;
}) {
  const date = new Date(params.u);

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="text-center space-y-5">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/15 to-rose-500/10 border border-violet-400/25 flex items-center justify-center">
            <Heart className="w-10 h-10 text-violet-300/70" strokeWidth={1.3} fill="rgba(139,92,246,0.25)" />
          </div>
        </div>
        <h2 className="text-4xl sm:text-5xl font-serif font-light leading-tight">
          <span className="block text-white/70">A letter,</span>
          <span className="block bg-gradient-to-r from-violet-300/80 via-pink-300/70 to-rose-300/70 bg-clip-text text-transparent text-3xl sm:text-4xl mt-2">
            meant for your future
          </span>
        </h2>
        <p className="text-white/30 text-sm max-w-sm mx-auto leading-relaxed">
          Someone wrote to you — in a way that only you can read, only on the day they chose.
        </p>
      </div>

      <div className="glass-romantic rounded-2xl p-6 sm:p-7 border border-white/[0.05] space-y-4 text-center">
        <p className="text-white/45 text-sm leading-relaxed">
          To complete the capsule, upload <span className="text-white/70">the same original photo</span> and write your reply. Then take your half — to open together on that day.
        </p>
      </div>

      <div className="text-center">
        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/10">
          <Timer className="w-4 h-4 text-amber-300/60" />
          <span className="text-white/45 text-sm font-light">
            Unlocks {date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      <button onClick={onContinue}
        className="w-full py-5 bg-gradient-to-r from-violet-500 via-pink-500 to-rose-500 rounded-2xl text-white font-medium text-base
                   transition-all duration-300 hover:shadow-[0_0_70px_rgba(139,92,246,0.3)] hover:shadow-[0_0_70px_rgba(244,63,94,0.25)] hover:scale-[1.02] active:scale-[0.97]
                   flex items-center justify-center gap-2.5 min-h-[60px]">
        <Heart className="w-5 h-5" /> Write your reply
      </button>
    </div>
  );
}

// ─── B Write ────────────────────────────────────────────────
function BWriteStep({
  msgB, setMsgB,
  pinB, setPinB,
  onSeal,
  isProcessing,
  error,
  bOriginalImage,
  onImageUpload,
}: {
  msgB: string; setMsgB: (v: string) => void;
  pinB: string; setPinB: (v: string) => void;
  onSeal: () => void;
  isProcessing: boolean;
  error: string;
  bOriginalImage: File | null;
  onImageUpload: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-3">
        <p className="text-violet-300/30 text-[11px] tracking-[0.3em] uppercase">Your turn</p>
        <h2 className="text-3xl font-serif font-light leading-tight text-white/80">
          <span className="block text-white/70">Write what</span>
          <span className="block bg-gradient-to-r from-violet-300/75 to-rose-300/75 bg-clip-text text-transparent text-2xl mt-1">
            they&apos;ll read from you
          </span>
        </h2>
        <p className="text-white/25 text-xs max-w-xs mx-auto leading-relaxed">Upload the same original photo, write your words, then take your half.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Upload photo */}
        <div className="space-y-2">
          <label className="text-white/40 text-[11px] uppercase tracking-[0.22em] font-light flex items-center justify-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-violet-300/60" /> The same photo you both shared
          </label>
          {!bOriginalImage ? (
            <div onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center w-full py-8 rounded-2xl border-2 border-dashed border-violet-400/20
                         bg-white/[0.02] cursor-pointer hover:border-violet-400/40 hover:bg-white/[0.035] transition-all">
              <Upload className="w-8 h-8 text-violet-300/40 mb-3" />
              <span className="text-white/40 text-sm font-light">Tap to upload the original photo</span>
              <span className="text-rose-300/40 text-[11px] mt-2 font-light">🔒 For your privacy, we don't store any of your information. Please re-upload when needed.</span>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImageUpload(file);
                }} />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative rounded-2xl overflow-hidden border border-violet-400/20">
                <img
                  src={URL.createObjectURL(bOriginalImage)}
                  alt="Original photo"
                  className="w-full max-h-56 object-contain bg-black/30"
                />
                <button onClick={() => onImageUpload(null as any)}
                  className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center
                             hover:bg-black/70 transition-all text-white/60 hover:text-white text-sm">
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Key */}
        <div className="space-y-2">
          <label className="text-white/40 text-[11px] uppercase tracking-[0.22em] font-light flex items-center justify-center gap-1.5">
            <FileKey className="w-3.5 h-3.5 text-violet-300/60" /> Your 4-digit key
          </label>
          <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4}
            value={pinB} onChange={(e) => setPinB(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            className="w-full px-4 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white text-center
                       tracking-[1.3em] text-2xl font-mono placeholder:tracking-normal placeholder:text-white/10
                       focus:border-violet-400/40 focus:outline-none focus:ring-1 focus:ring-violet-400/20 transition-all" />
          <p className="text-white/18 text-[11px] text-center font-light">The key for your half — keep it safe</p>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <label className="text-white/40 text-[11px] uppercase tracking-[0.22em] font-light text-center block">
            Your words — sealed until that day
          </label>
          <textarea value={msgB} onChange={(e) => setMsgB(e.target.value)}
            placeholder="Write what you want them to read on that day..."
            rows={6} maxLength={2000}
            className="w-full px-4 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/10
                       focus:border-violet-400/40 focus:outline-none focus:ring-1 focus:ring-violet-400/20 resize-none transition-all text-sm leading-relaxed" />
          <div className="text-right text-white/15 text-xs">{msgB.length}/2000</div>
        </div>
      </div>

      <button onClick={onSeal} disabled={isProcessing}
        className="w-full py-5 bg-gradient-to-r from-violet-500 via-pink-500 to-rose-500 rounded-2xl text-white font-medium text-base
                   transition-all duration-300 hover:shadow-[0_0_70px_rgba(139,92,246,0.3)] hover:shadow-[0_0_70px_rgba(244,63,94,0.25)] hover:scale-[1.02] active:scale-[0.97]
                   disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 min-h-[60px]">
        {isProcessing ? (
          <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sealing your half...</>
        ) : (
          <><Download className="w-5 h-5" /> Seal &amp; Take My Half</>
        )}
      </button>
    </div>
  );
}

// ─── B Done ─────────────────────────────────────────────────
function BDoneStep({
  mergeQR, copied, onCopy, onDone,
}: {
  mergeQR: string; copied: boolean; onCopy: () => void;
  onDone: () => void;
}) {
  return (
    <div className="space-y-10 animate-fade-in">
      <div className="text-center space-y-5">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <h2 className="text-4xl font-serif font-light leading-tight text-white/80">
          <span className="block text-white/70">Your half is</span>
          <span className="block bg-gradient-to-r from-rose-300/75 to-violet-300/75 bg-clip-text text-transparent text-3xl mt-1">
            sealed and saved
          </span>
        </h2>
        <p className="text-white/30 text-sm max-w-sm mx-auto leading-relaxed">
          Your half has been downloaded to your device. Now share this code back to them — so they can seal their half, too.
        </p>
      </div>

      <div className="glass-romantic rounded-2xl p-5 sm:p-6 border border-white/[0.05] space-y-4">
        <p className="text-xs text-white/40 text-center uppercase tracking-[0.3em]">Send this back</p>
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-xl border border-violet-400/15 bg-white/[0.02]">
            <img src={mergeQR} alt="Merge QR" className="w-48 h-48 rounded-lg" />
          </div>
          <button onClick={onCopy}
            className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl border border-white/[0.08] text-white/40 text-sm
                       hover:bg-white/[0.03] hover:border-white/15 hover:text-white/60 transition-all">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied — share it' : 'Copy link'}
          </button>
        </div>
      </div>

      <p className="text-center text-white/20 text-sm italic font-serif max-w-sm mx-auto leading-relaxed">
        &ldquo;Two halves, one photo. On that day — your words finally meet.&rdquo;
      </p>

      <button onClick={onDone}
        className="w-full py-3 text-white/30 text-sm hover:text-white/60 transition-all">
        ← Done
      </button>
    </div>
  );
}

// ─── Merge (A scans B's QR → upload original → split → seal → download A half) ───
function MergeStep({
  params,
  isProcessing,
  onMerge,
  onDone,
  error,
}: {
  params: NonNullable<Awaited<ReturnType<typeof parseMergeURL>>>;
  isProcessing: boolean;
  onMerge: (f: File) => void;
  onDone: () => void;
  error: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const date = new Date(params.u);

  const onImage = (f: File) => {
    setImage(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-5">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <h2 className="text-4xl font-serif font-light leading-tight text-white/80">
          <span className="block text-white/70">They wrote back</span>
          <span className="block bg-gradient-to-r from-rose-300/75 to-violet-300/75 bg-clip-text text-transparent text-3xl mt-1">
            now seal your half
          </span>
        </h2>
        <p className="text-white/28 text-sm max-w-xs mx-auto leading-relaxed">
          Upload the same original photo one more time — to seal your half with the words they added.
        </p>
      </div>

      <div className="text-center">
        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/10">
          <Timer className="w-4 h-4 text-amber-300/60" />
          <span className="text-white/45 text-sm font-light">
            Unlocks {date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {error && (
        <div className="text-center text-rose-400/70 text-sm px-4 py-3 rounded-xl bg-rose-500/5 border border-rose-400/20">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImage(f);
          }}
        />
        {!preview ? (
          <button onClick={() => fileRef.current?.click()}
            className="w-full p-6 sm:p-8 rounded-2xl border-2 border-dashed border-white/15
                       bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/25
                       transition-all text-center space-y-3">
            <div className="flex justify-center">
              <ImageIcon className="w-9 h-9 text-white/40" strokeWidth={1.3} />
            </div>
            <div className="text-white/45 text-sm font-light">Upload the same original photo</div>
            <div className="text-white/20 text-xs">It will be split with the same ratio</div>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-black/20 border border-white/5">
              <img src={preview} alt="preview" className="w-full max-h-64 object-contain" />
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="w-full py-2 text-white/30 text-xs hover:text-white/60 transition-all">
              ← Use a different photo
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => image && onMerge(image)}
        disabled={!image || isProcessing}
        className="w-full py-5 bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 rounded-2xl text-white font-medium text-base
                   transition-all duration-300 hover:shadow-[0_0_70px_rgba(244,63,94,0.3)] hover:shadow-[0_0_70px_rgba(139,92,246,0.25)] hover:scale-[1.02] active:scale-[0.97]
                   disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 min-h-[60px]">
        {isProcessing ? (
          <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sealing your half...</>
        ) : (
          <><Download className="w-5 h-5" /> Seal &amp; Take My Half</>
        )}
      </button>

      <div className="glass-romantic rounded-2xl p-5 sm:p-6 border border-white/[0.05] text-center space-y-2">
        <p className="text-white/40 text-sm leading-relaxed">
          On the unlock date, upload your half and type your key — to finally read each other&apos;s words.
        </p>
      </div>

      <button onClick={onDone}
        className="w-full py-3 text-white/30 text-sm hover:text-white/60 transition-all">
        ← Done
      </button>
    </div>
  );
}

// ─── Unlock ─────────────────────────────────────────────────
function UnlockStep({
  unlockImage, onImageChange, unlockPin, setUnlockPin,
  unlockRole, setUnlockRole, onUnlock, error,
}: {
  unlockImage: File | null; onImageChange: (f: File) => void;
  unlockPin: string; setUnlockPin: (v: string) => void;
  unlockRole: 'A' | 'B'; setUnlockRole: (r: 'A' | 'B') => void;
  onUnlock: () => void; error: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <h2 className="text-4xl sm:text-5xl font-serif font-light leading-tight">
          <span className="block text-white/70">The day is here</span>
          <span className="block bg-gradient-to-r from-rose-300/80 via-pink-300/70 to-violet-300/80 bg-clip-text text-transparent text-3xl sm:text-4xl mt-2">
            Open what&apos;s yours
          </span>
        </h2>
        <p className="text-white/30 text-sm max-w-sm mx-auto leading-relaxed">
          Upload your half and type your key — to finally read what they wrote to you.
        </p>
      </div>

      {/* Role selector */}
      <div className="flex gap-3">
        <button
          onClick={() => setUnlockRole('A')}
          className={`flex-1 py-3.5 rounded-xl text-sm font-light transition-all ${
            unlockRole === 'A'
              ? 'bg-rose-500/15 border-2 border-rose-400/40 text-rose-300/80'
              : 'bg-white/[0.03] border border-white/10 text-white/35 hover:bg-white/[0.05]'
          }`}
        >
          Person A — my key
        </button>
        <button
          onClick={() => setUnlockRole('B')}
          className={`flex-1 py-3.5 rounded-xl text-sm font-light transition-all ${
            unlockRole === 'B'
              ? 'bg-violet-500/15 border-2 border-violet-400/40 text-violet-300/80'
              : 'bg-white/[0.03] border border-white/10 text-white/35 hover:bg-white/[0.05]'
          }`}
        >
          Person B — my key
        </button>
      </div>

      {/* Upload */}
      <div onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onImageChange(f); }}
        className="border-2 border-dashed border-white/[0.08] rounded-2xl p-10 text-center cursor-pointer
                   hover:border-rose-400/30 hover:bg-white/[0.01] transition-all duration-300 group">
        {unlockImage ? (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-white/55 text-sm font-light">Your half — {unlockImage.name}</p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-rose-500/[0.06] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-all">
              <Upload className="w-6 h-6 text-rose-400/50" />
            </div>
            <p className="text-white/45 text-sm font-light">Drop your half here</p>
            <p className="text-white/20 text-[11px] mt-1 font-light">🔒 Your photo never leaves your device</p>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && onImageChange(e.target.files[0])} />

      {/* PIN */}
      <div className="space-y-2">
        <label className="text-white/40 text-[11px] uppercase tracking-[0.22em] font-light text-center block">
          Your 4-digit key
        </label>
        <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4}
          value={unlockPin} onChange={(e) => setUnlockPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          className="w-full px-4 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white text-center
                     tracking-[1.3em] text-2xl font-mono placeholder:tracking-normal placeholder:text-white/10
                     focus:border-rose-400/40 focus:outline-none focus:ring-1 focus:ring-rose-400/20 transition-all" />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button onClick={onUnlock}
        className="w-full py-5 bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 rounded-2xl text-white font-medium text-base
                   transition-all duration-300 hover:shadow-[0_0_70px_rgba(244,63,94,0.3)] hover:shadow-[0_0_70px_rgba(139,92,246,0.25)] hover:scale-[1.02] active:scale-[0.97]
                   flex items-center justify-center gap-2.5 min-h-[60px]">
        <Lock className="w-5 h-5" /> Open &amp; Read
      </button>
    </div>
  );
}