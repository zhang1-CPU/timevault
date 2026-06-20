import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  generateSessionId,
  splitPhotoByRatio,
  compressForQR,
  saveSession,
  loadSession,
  storeBlobForSession,
  getActiveSessionId,
  getBlobFromSession,
  generateInviteURL,
  generateMergeURL,
  parseInviteURL,
  parseMergeURL,
  generateQRCodeImage,
  type CoupleSession,
} from '@/lib/couple-crypto';
import {
  sealCoupleHalf,
  mergeCoupleHalfA,
  revealCoupleMessage,
  encryptWithPin,
  decryptWithPin,
} from '@/lib/crypto';
import { CoupleHeader } from './CoupleHeader';
import { CoupleCeremony } from './CoupleCeremony';
import {
  Upload, QrCode, Check, Timer, FileKey,
  AlertCircle, Download, Copy, Heart, Sparkles, Lock,
  Image as ImageIcon,
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
  // ─── Hash routing ──────────────────────────────────────────
  const [scene, setScene] = useState<Scene>('landing');

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#couple-b')) {
      const params = parseInviteURL(hash);
      if (params) { setBParams(params); setScene('b-welcome'); return; }
    }
    if (hash.startsWith('#couple-a')) {
      const params = parseMergeURL(hash);
      if (params) { setMergeParams(params); setScene('merge'); return; }
    }
    if (hash.startsWith('#couple-unlock')) {
      setScene('unlock'); return;
    }
    // Check if there's an active session
    const activeId = getActiveSessionId();
    if (activeId) {
      const sess = loadSession(activeId);
      if (sess) {
        setSession(sess);
        setScene('create');
        return;
      }
    }
    setScene('landing');
  }, []);

  // ─── Session & A's data ────────────────────────────────────
  const [session, setSession] = useState<CoupleSession | null>(null);
  const [bParams, setBParams] = useState<Awaited<ReturnType<typeof parseInviteURL>>>(null);
  const [mergeParams, setMergeParams] = useState<Awaited<ReturnType<typeof parseMergeURL>>>(null);

  // ─── A's creation data ─────────────────────────────────────
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const originalPreviewRef = useRef<string>('');
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
  const [bHalfBlob, setBHalfBlob] = useState<Blob | null>(null);
  const [bOriginalImage, setBOriginalImage] = useState<File | null>(null); // B's original half photo for high quality

  // ─── QR & merge ────────────────────────────────────────────
  const [inviteQR, setInviteQR] = useState('');
  const [inviteURL, setInviteURL] = useState('');
  const [mergeQR, setMergeQR] = useState('');
  const [mergeURL, setMergeURL] = useState('');
  const [copied, setCopied] = useState(false);
  const [sealedBlobA, setSealedBlobA] = useState<Blob | null>(null);

  // ─── Unlock ────────────────────────────────────────────────
  const [unlockImage, setUnlockImage] = useState<File | null>(null);
  const [unlockPin, setUnlockPin] = useState('');
  const [unlockRole, setUnlockRole] = useState<'A' | 'B'>('A');
  const [revealedMsg, setRevealedMsg] = useState('');
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
    originalPreviewRef.current = url;
    trackUrl(url);
    setScene('create');
  }, [clearError, trackUrl]);

  // ─── Scene: Cut — Canvas rendering ─────────────────────────
  useEffect(() => {
    if (scene !== 'create') return;
    const canvas = cutCanvasRef.current;
    const previewUrl = originalPreviewRef.current;
    if (!canvas || !previewUrl) return;
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
    img.src = previewUrl;
  }, [scene, splitX]);

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

  // ─── Scene: Create — A fills form + generates invite ─────────
  const handleCreate = useCallback(async () => {
    if (!originalImage || !sideChoice || !msgA.trim() || pinA.length !== PIN_LENGTH || !unlockDate) {
      setError('Please fill in all fields');
      return;
    }
    const unlock = new Date(unlockDate);
    if (isNaN(unlock.getTime()) || unlock.getTime() <= Date.now() + 60000) {
      setError('Unlock date must be at least 1 minute in the future');
      return;
    }
    clearError();
    setIsProcessing(true);

    try {
      // Split photo
      const { leftBlob, rightBlob } = await splitPhotoByRatio(originalImage, splitX);

      // Determine sides
      const mySide: 'left' | 'right' = sideChoice;
      const theirSide: 'left' | 'right' = sideChoice === 'left' ? 'right' : 'left';

      // Generate session
      const sessionId = generateSessionId();
      const sess: CoupleSession = {
        sessionId,
        mySide,
        theirSide,
        unlockTime: unlock.toISOString(),
        msgA: msgA.trim(),
        pinA,
        sealedAtA: new Date().toISOString(),
        merged: false,
      };

      // Determine halves
      const myHalfBlob = mySide === 'left' ? leftBlob : rightBlob;
      const theirHalfBlob = mySide === 'left' ? rightBlob : leftBlob;

      // Compress their half for QR code — tiny preview so QR stays scannable
      const theirPreview = await compressForQR(
        new File([theirHalfBlob], 'their.png', { type: 'image/png' })
      );

      // Store A's half for later merge
      storeBlobForSession(sessionId, myHalfBlob);

      // Encrypt A's message with PIN-A for secure transmission
      const msgaCipher = await encryptWithPin(msgA.trim(), pinA);
      
      // Generate invite URL + QR — short URL so phone can scan reliably
      const url = generateInviteURL({
        sid: sessionId,
        u: unlock.toISOString(),
        pina: pinA,
        msga_cipher: msgaCipher,
        half: theirSide,
        preview: theirPreview,
      });
      const qr = await generateQRCodeImage(url);
      setInviteURL(url);
      setInviteQR(qr);

      // Save session
      saveSession(sess);
      setSession(sess);
      saveSession(sess);

      setIsProcessing(false);
    } catch (err) {
      withError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }, [originalImage, sideChoice, msgA, pinA, unlockDate, clearError, withError]);

  // ─── Scene: B Welcome ───────────────────────────────────────
  const handleBContinue = useCallback(() => {
    setScene('b-write');
  }, []);

  // ─── Scene: B Write ─────────────────────────────────────────
  const handleBWrite = useCallback(async () => {
    if (!bParams || !msgB.trim() || pinBInput.length !== PIN_LENGTH) {
      setError('Please write a message and enter your 4-digit key');
      return;
    }
    if (!bOriginalImage) {
      setError('Please upload your half photo first');
      return;
    }
    clearError();
    setIsProcessing(true);

    try {
      const unlock = new Date(bParams.u);
      const sess = loadSession(bParams.sid) || {
        sessionId: bParams.sid,
        mySide: bParams.half,
        theirSide: bParams.half === 'left' ? 'right' : 'left',
        unlockTime: bParams.u,
        merged: false,
      } as CoupleSession;

      // Decrypt A's message from URL (encrypted with PIN-A)
      const msgA = bParams.msga_cipher ? await decryptWithPin(bParams.msga_cipher, bParams.pina) : '';

      // Seal messages into B's ORIGINAL uploaded photo (high quality)
      const sealedB = await sealCoupleHalf(
        bOriginalImage,
        msgA,           // A's decrypted message
        msgB.trim(),    // B's message
        bParams.pina,   // PIN-A
        pinBInput,      // PIN-B (B's own PIN)
        unlock,
        bParams.half    // B's side
      );

      setBHalfBlob(sealedB);

      // Encrypt B's message with PIN-A for secure transmission to A
      const msgbCipher = await encryptWithPin(msgB.trim(), bParams.pina);

      // Generate merge URL
      const mergeUrl = generateMergeURL({
        sid: bParams.sid,
        u: bParams.u,
        pinb: pinBInput,
        msgb_cipher: msgbCipher,
        sealedat: bParams.sid,
        half: bParams.half,
      });
      const mergeQRImg = await generateQRCodeImage(mergeUrl);
      setMergeURL(mergeUrl);
      setMergeQR(mergeQRImg);

      // Save B's data to session
      sess.msgB = msgB.trim();
      saveSession(sess);

      setIsProcessing(false);
      setScene('b-done');
    } catch (err) {
      withError(err instanceof Error ? err.message : 'Failed to seal your half');
    }
  }, [bParams, msgB, pinBInput, bOriginalImage, clearError, withError]);

  // ─── Scene: Merge ────────────────────────────────────────────
  const handleMerge = useCallback(async () => {
    if (!mergeParams) { setError('Missing merge data'); return; }
    clearError();
    setIsProcessing(true);

    try {
      // Get A's blob from session or reconstruct
      let aBlob = getBlobFromSession(mergeParams.sid);
      if (!aBlob && mergeParams.preview) {
        // Try from session data
        const sess = loadSession(mergeParams.sid);
        if (sess?._halfBlobA) {
          aBlob = getBlobFromSession(mergeParams.sid);
        }
      }

      if (!aBlob) {
        // No session found — reconstruct from merge params preview
        setError('Could not find your saved data. The merge link may have expired or been opened on a different device.');
        setIsProcessing(false);
        return;
      }

      const sess = loadSession(mergeParams.sid);
      if (!sess) { setError('Session not found'); setIsProcessing(false); return; }

      const unlock = new Date(mergeParams.u);

      // Decrypt B's message from URL (encrypted with PIN-A)
      const msgB = mergeParams.msgb_cipher && sess.pinA ? await decryptWithPin(mergeParams.msgb_cipher, sess.pinA) : '';

      // Merge B's message into A's half
      const finalBlob = await mergeCoupleHalfA(
        new File([aBlob], 'a-half.png', { type: 'image/png' }),
        sess.msgA || '',
        msgB,
        sess.pinA || '',
        mergeParams.pinb,
        unlock,
        sess.mySide,
        new Date(sess.sealedAtA || mergeParams.sealedat)
      );

      setSealedBlobA(finalBlob);
      sess.merged = true;
      sess.mergedAt = new Date().toISOString();
      saveSession(sess);

      setIsProcessing(false);
    } catch (err) {
      withError(err instanceof Error ? err.message : 'Failed to merge messages');
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
      const result = await revealCoupleMessage(unlockImage, unlockPin, unlockRole);
      if (!result) {
        setUnlockError("The other person's message isn't here yet — TA may not have written back yet.");
        return;
      }
      setRevealedMsg(result.theirMessage);
      setShowCeremony(true);
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : 'Failed to unlock');
    }
  }, [unlockImage, unlockPin, unlockRole]);

  // ─── Download helper ────────────────────────────────────────
  const handleDownloadA = useCallback(() => {
    if (!sealedBlobA) return;
    const sess = session || (mergeParams ? {
      sessionId: mergeParams.sid,
      mySide: mergeParams.half,
      theirSide: mergeParams.half === 'left' ? 'right' : 'left',
      unlockTime: mergeParams.u,
      merged: false,
    } : null);
    const side = sess?.mySide || 'left';
    downloadBlob(sealedBlobA, `timevault-half-${side}-${Date.now()}.png`);
  }, [sealedBlobA, session, mergeParams]);

  const handleDownloadB = useCallback(() => {
    if (!bHalfBlob) return;
    const side = bParams?.half || 'right';
    downloadBlob(bHalfBlob, `timevault-half-${side}-${Date.now()}.png`);
  }, [bHalfBlob, bParams]);

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <CoupleHeader
        onBack={() => {
          if (scene === 'landing') onBack();
          else if (scene === 'b-welcome') { window.location.hash = ''; setScene('landing'); }
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
              onDownload={handleDownloadB}
              onDone={onHome}
            />
          )}

          {/* ── MERGE ──────────────────────────────────────── */}
          {scene === 'merge' && mergeParams && (
            <MergeStep
              params={mergeParams}
              isProcessing={isProcessing}
              onMerge={handleMerge}
              onDownload={handleDownloadA}
              sealedBlobA={sealedBlobA}
              onDone={onHome}
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
              messageA={unlockRole === 'A' ? revealedMsg : ''}
              messageB={unlockRole === 'B' ? revealedMsg : ''}
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
    <div className="space-y-10 pt-4 animate-fade-in">
      {/* Hero */}
      <div className="text-center space-y-5">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500/20 to-violet-500/20 border border-rose-400/20 flex items-center justify-center">
              <Heart className="w-10 h-10 text-rose-300/70 animate-pulse" strokeWidth={1.5} fill="rgba(244,114,182,0.2)" />
            </div>
            <div className="absolute -inset-2 rounded-full bg-rose-500/10 animate-ping" style={{ animationDuration: '3s' }} />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-serif font-light">
          <span className="bg-gradient-to-r from-rose-300/80 via-pink-300/70 to-violet-300/70 bg-clip-text text-transparent">
            For Two
          </span>
        </h1>
        <p className="text-white/30 text-sm leading-relaxed max-w-sm mx-auto font-light">
          One photo, cut in two. Each of you writes a secret.<br />
          Only at the appointed hour, with your key, can the other read it.
        </p>
      </div>

      {/* How it works */}
      <div className="glass-romantic rounded-2xl p-5 sm:p-6 border border-white/[0.05] space-y-4">
        <h3 className="font-serif text-white/40 text-sm text-center">How it works</h3>
        {[
          { icon: '✂️', label: 'You', desc: 'Upload a photo, split it, write your secret, share a QR code' },
          { icon: '📱', label: 'TA', desc: 'Scans the QR, writes their reply, downloads their half' },
          { icon: '🔓', label: 'Together', desc: 'On the chosen day, each of you uploads your half and types your key' },
        ].map((item, i) => (
          <div key={i} className="flex gap-3.5 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-sm">
              {item.icon}
            </div>
            <div>
              <p className="text-white/55 text-sm font-serif">{item.label}</p>
              <p className="text-white/25 text-xs leading-relaxed font-light">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-center space-y-2">
        <p className="text-white/20 text-sm italic font-serif">
          "I fell in love with the sense of waiting — the idea that some words are worth saving for the right moment."
        </p>
      </blockquote>

      {/* CTA */}
      <button
        onClick={onStart}
        className="w-full py-5 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl text-white font-medium text-base
                   transition-all duration-300 hover:shadow-[0_0_60px_rgba(244,63,94,0.35)] hover:scale-[1.02] active:scale-[0.97]
                   flex items-center justify-center gap-3 min-h-[60px]"
      >
        <Sparkles className="w-5 h-5" />
        Begin a Time Capsule for Two
      </button>
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
      <div className="space-y-8 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center">
              <Check className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-2xl font-serif font-light text-white/80">Your Capsule is Ready</h2>
          <p className="text-white/30 text-sm">Send this QR to TA — TA will scan it and write back</p>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-4">
          <div className="p-5 rounded-2xl border border-rose-400/15 bg-white/[0.02]">
            <img src={inviteQR} alt="Invite QR Code" className="w-60 h-60 rounded-xl" />
          </div>
          <button onClick={onCopy}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.08] text-white/30 text-sm
                       hover:bg-white/[0.03] hover:border-white/15 hover:text-white/50 transition-all">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        <p className="text-center text-white/15 text-xs italic font-serif">
          "The right word at the right moment is like a seed that waits for its season."
        </p>

        <button onClick={onDone}
          className="w-full py-3 text-white/30 text-sm hover:text-white/60 transition-all">
          ← Return home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Step 1: Upload */}
      {!originalImage && (
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-rose-300/30 text-xs tracking-[0.3em] uppercase">Step 1 of 4</p>
            <h2 className="text-2xl font-serif font-light text-white/70">Choose Your Photo</h2>
          </div>
          <div onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onUpload(f); }}
            className="border-2 border-dashed border-white/[0.08] rounded-2xl p-14 text-center cursor-pointer
                       hover:border-rose-400/30 hover:bg-white/[0.01] transition-all duration-300 group">
            <div className="w-14 h-14 rounded-full bg-rose-500/[0.06] flex items-center justify-center mx-auto mb-4
                            group-hover:bg-rose-500/[0.12] group-hover:scale-110 transition-all">
              <Upload className="w-7 h-7 text-rose-400/50" />
            </div>
            <p className="text-white/40 text-lg mb-1 font-light">Drop a photo here</p>
            <p className="text-white/15 text-sm">or click to browse</p>
            <p className="text-white/10 text-xs mt-3">PNG, JPG, WebP — up to 20MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        </div>
      )}

      {/* Step 2: Cut */}
      {originalImage && !sideChoice && (
        <div className="space-y-5">
          <div className="text-center space-y-2">
            <p className="text-rose-300/30 text-xs tracking-[0.3em] uppercase">Step 2 of 4</p>
            <h2 className="text-2xl font-serif font-light text-white/70">Draw the Line</h2>
            <p className="text-white/25 text-xs">Drag to split — left for you, right for TA</p>
          </div>
          <div className="relative rounded-xl overflow-hidden border border-white/[0.06] bg-black/20 select-none">
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
              className="flex-1 py-4 rounded-xl border-2 border-rose-400/30 bg-rose-500/[0.05] text-rose-300/70 text-sm font-serif
                         hover:bg-rose-500/[0.1] transition-all"
            >
              Keep Left ({Math.round(splitX * 100)}%)
            </button>
            <button
              onClick={() => onSideChoice('right')}
              className="flex-1 py-4 rounded-xl border-2 border-violet-400/30 bg-violet-500/[0.05] text-violet-300/70 text-sm font-serif
                         hover:bg-violet-500/[0.1] transition-all"
            >
              Keep Right ({100 - Math.round(splitX * 100)}%)
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Write */}
      {originalImage && sideChoice && (
        <div className="space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <p className="text-rose-300/30 text-xs tracking-[0.3em] uppercase">Step 3 of 4</p>
            <h2 className="text-2xl font-serif font-light text-white/70">Write Your Secret</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-white/30 text-xs uppercase tracking-wider font-light flex items-center gap-1">
                <FileKey className="w-3 h-3" /> Your Key
              </label>
              <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4}
                value={pinA} onChange={(e) => setPinA(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="****"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-center
                           tracking-[1em] text-xl font-mono placeholder:tracking-normal placeholder:text-white/10
                           focus:border-rose-400/40 focus:outline-none focus:ring-1 focus:ring-rose-400/20 transition-all" />
              <p className="text-white/15 text-[10px] text-center">This unlocks TA&apos;s message when the time comes</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-white/30 text-xs uppercase tracking-wider font-light">Your Message</label>
              <textarea value={msgA} onChange={(e) => setMsgA(e.target.value)}
                placeholder="Write what you want TA to read on the appointed day..."
                rows={5} maxLength={2000}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/10
                           focus:border-rose-400/40 focus:outline-none focus:ring-1 focus:ring-rose-400/20 resize-none transition-all text-sm leading-relaxed" />
              <div className="text-right text-white/10 text-xs">{msgA.length}/2000</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-white/30 text-xs uppercase tracking-wider font-light flex items-center gap-1">
                <Timer className="w-3 h-3" /> When It Unlocks
              </label>
              <input type="datetime-local" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)}
                min={minUnlockDate}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm
                           focus:border-rose-400/40 focus:outline-none focus:ring-1 focus:ring-rose-400/20 transition-all [color-scheme:dark]" />
            </div>
          </div>

          <button onClick={onCreate} disabled={isProcessing}
            className="w-full py-4.5 bg-gradient-to-r from-rose-500/95 to-pink-600/95 rounded-2xl text-white font-medium text-sm
                       transition-all duration-300 hover:shadow-[0_0_60px_rgba(244,63,94,0.3)] hover:scale-[1.01] active:scale-[0.98]
                       disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[56px]">
            {isProcessing ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating...</>
            ) : (
              <><QrCode className="w-5 h-5" />Generate QR for TA</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── B Welcome ───────────────────────────────────────────────
function BWelcomeStep({
  params,
  onContinue,
}: {
  params: NonNullable<Awaited<ReturnType<typeof parseInviteURL>>>;
  onContinue: () => void;
}) {
  const date = new Date(params.u);
  const previewUrl = params.preview && params.preview.startsWith('data:') ? params.preview : null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-violet-500/10 border border-violet-400/20 flex items-center justify-center">
            <Heart className="w-8 h-8 text-violet-300/70" strokeWidth={1.5} fill="rgba(139,92,246,0.2)" />
          </div>
        </div>
        <h2 className="text-3xl font-serif font-light">
          <span className="bg-gradient-to-r from-violet-300/80 to-rose-300/70 bg-clip-text text-transparent">
            Someone Left You a Letter
          </span>
        </h2>
        <p className="text-white/25 text-sm">Scanned from a TimeVault capsule — sealed until today</p>
      </div>

      {/* Prompt text */}
      <div className="text-center">
        <p className="text-white/50 text-sm leading-relaxed">
          TA already cropped the photo for you.
          Write your reply below — then you can save your half.
        </p>
      </div>

      {/* Unlock date */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-romantic">
          <Timer className="w-3.5 h-3.5 text-amber-300/40" />
          <span className="text-white/40 text-xs">
            Unlocks {date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* B's half preview */}
      {previewUrl ? (
        <div className="rounded-2xl overflow-hidden border border-violet-400/15 max-w-[120px] mx-auto relative">
          <img src={previewUrl} alt="Your half of the photo" className="w-full" />
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-violet-300/70 text-[9px] font-medium">
            Your Half
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-violet-400/10 max-w-[100px] mx-auto h-24 bg-white/[0.03] flex items-center justify-center">
          <QrCode className="w-8 h-8 text-violet-300/20" />
        </div>
      )}

      <button onClick={onContinue}
        className="w-full py-4.5 bg-gradient-to-r from-violet-500/95 to-rose-500/95 rounded-2xl text-white font-medium text-base
                   transition-all duration-300 hover:shadow-[0_0_60px_rgba(139,92,246,0.3)] hover:scale-[1.02] active:scale-[0.97]
                   flex items-center justify-center gap-2 min-h-[56px]">
        <Heart className="w-5 h-5" /> Write My Reply
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
  const imageUrl = bOriginalImage ? URL.createObjectURL(bOriginalImage) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <p className="text-violet-300/30 text-xs tracking-[0.3em] uppercase">Your Reply</p>
        <h2 className="text-2xl font-serif font-light text-white/70">Write to TA</h2>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Upload photo */}
        <div className="space-y-1.5">
          <label className="text-white/30 text-xs uppercase tracking-wider font-light flex items-center gap-1">
            <ImageIcon className="w-3 h-3" /> Your Half Photo
          </label>
          {!bOriginalImage ? (
            <label className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-violet-400/20 
                             bg-white/[0.02] cursor-pointer hover:border-violet-400/40 hover:bg-white/[0.04] transition-all">
              <Upload className="w-8 h-8 text-violet-300/30 mb-2" />
              <span className="text-white/30 text-sm">Tap to upload your half photo</span>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImageUpload(file);
                }} />
            </label>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-violet-400/20">
              <img src={imageUrl!} alt="Your half" className="w-full max-h-48 object-contain bg-black/30" />
              <button onClick={() => onImageUpload(null as any)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center
                           hover:bg-black/70 transition-all text-white/60 hover:text-white text-xs">
                ✕
              </button>
            </div>
          )}
          <p className="text-white/15 text-[10px] text-center">Upload your half of the original photo for best quality</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-white/30 text-xs uppercase tracking-wider font-light flex items-center gap-1">
            <FileKey className="w-3 h-3" /> Your Key
          </label>
          <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4}
            value={pinB} onChange={(e) => setPinB(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="****"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-center
                       tracking-[1em] text-xl font-mono placeholder:tracking-normal placeholder:text-white/10
                       focus:border-violet-400/40 focus:outline-none focus:ring-1 focus:ring-violet-400/20 transition-all" />
          <p className="text-white/15 text-[10px] text-center">This unlocks TA&apos;s message when the time comes</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-white/30 text-xs uppercase tracking-wider font-light">Your Message</label>
          <textarea value={msgB} onChange={(e) => setMsgB(e.target.value)}
            placeholder="What do you want to say to TA on that day..."
            rows={6} maxLength={2000}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/10
                       focus:border-violet-400/40 focus:outline-none focus:ring-1 focus:ring-violet-400/20 resize-none transition-all text-sm leading-relaxed" />
          <div className="text-right text-white/10 text-xs">{msgB.length}/2000</div>
        </div>
      </div>

      <button onClick={onSeal} disabled={isProcessing}
        className="w-full py-4.5 bg-gradient-to-r from-violet-500/95 to-rose-500/95 rounded-2xl text-white font-medium text-base
                   transition-all duration-300 hover:shadow-[0_0_60px_rgba(139,92,246,0.3)] hover:scale-[1.02] active:scale-[0.97]
                   disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[56px]">
        {isProcessing ? (
          <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sealing...</>
        ) : (
          <><Download className="w-5 h-5" />Seal My Half &amp; Download</>
        )}
      </button>
    </div>
  );
}

// ─── B Done ─────────────────────────────────────────────────
function BDoneStep({
  mergeQR, copied, onCopy, onDownload, onDone,
}: {
  mergeQR: string; copied: boolean; onCopy: () => void;
  onDownload: () => void; onDone: () => void;
}) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center">
            <Check className="w-7 h-7 text-emerald-400" />
          </div>
        </div>
        <h2 className="text-2xl font-serif font-light text-white/80">You&apos;re All Set</h2>
        <p className="text-white/30 text-sm">Your half is saved — now send TA the link to complete the capsule</p>
      </div>

      <button onClick={onDownload}
        className="w-full py-4 rounded-xl bg-violet-500/10 border border-violet-400/20 text-violet-200/70 text-sm
                   hover:bg-violet-500/15 transition-all flex items-center justify-center gap-2 min-h-[52px]">
        <Download className="w-4 h-4" /> Download My Half
      </button>

      <div className="glass-romantic rounded-2xl p-5 space-y-4 border border-white/[0.05]">
        <p className="text-xs text-white/30 text-center uppercase tracking-widest">
          Send This Back to TA
        </p>
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-xl border border-violet-400/15 bg-white/[0.02]">
            <img src={mergeQR} alt="Merge QR" className="w-52 h-52 rounded-lg" />
          </div>
          <button onClick={onCopy}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.08] text-white/30 text-sm
                       hover:bg-white/[0.03] hover:border-white/15 hover:text-white/50 transition-all">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Link for TA'}
          </button>
        </div>
      </div>

      <p className="text-center text-white/15 text-xs italic font-serif">
        &ldquo;Some words need time to become more than words.&rdquo;
      </p>

      <button onClick={onDone}
        className="w-full py-3 text-white/30 text-sm hover:text-white/60 transition-all">
        ← Return home
      </button>
    </div>
  );
}

// ─── Merge ──────────────────────────────────────────────────
function MergeStep({
  params,
  isProcessing,
  onMerge,
  onDownload,
  sealedBlobA,
  onDone,
}: {
  params: NonNullable<Awaited<ReturnType<typeof parseMergeURL>>>;
  isProcessing: boolean;
  onMerge: () => void;
  onDownload: () => void;
  sealedBlobA: Blob | null;
  onDone: () => void;
}) {
  const date = new Date(params.u);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-400/20 flex items-center justify-center">
            <Heart className="w-7 h-7 text-rose-300/70" strokeWidth={1.5} fill="rgba(244,114,182,0.2)" />
          </div>
        </div>
        <h2 className="text-2xl font-serif font-light text-white/80">
          TA Wrote Back
        </h2>
        <p className="text-white/30 text-sm">
          TA&apos;s reply is ready — download your complete capsule now
        </p>
      </div>

      {/* Unlock date */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-romantic">
          <Timer className="w-3.5 h-3.5 text-amber-300/40" />
          <span className="text-white/40 text-xs">
            Unlocks {date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Merge / Download */}
      {sealedBlobA ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 justify-center text-emerald-400/70 text-sm">
            <Check className="w-4 h-4" />
            Capsule ready
          </div>
          <button onClick={onDownload}
            className="w-full py-4 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-200/80 text-sm
                       hover:bg-emerald-500/15 transition-all flex items-center justify-center gap-2 min-h-[52px]">
            <Download className="w-4 h-4" /> Download My Complete Half
          </button>
        </div>
      ) : (
        <button onClick={onMerge} disabled={isProcessing}
          className="w-full py-4.5 bg-gradient-to-r from-rose-500/95 to-pink-600/95 rounded-2xl text-white font-medium text-base
                     transition-all duration-300 hover:shadow-[0_0_60px_rgba(244,63,94,0.3)] hover:scale-[1.02] active:scale-[0.97]
                     disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[56px]">
          {isProcessing ? (
            <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Merging...</>
          ) : (
            <><Download className="w-5 h-5" />Download My Complete Half</>
          )}
        </button>
      )}

      <p className="text-center text-white/15 text-xs italic font-serif">
        &ldquo;Two halves, two secrets, one moment — and then, everything opens.&rdquo;
      </p>

      <button onClick={onDone}
        className="w-full py-3 text-white/30 text-sm hover:text-white/60 transition-all">
        ← Return home
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
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-serif font-light">
          <span className="bg-gradient-to-r from-rose-300/80 to-violet-300/70 bg-clip-text text-transparent">
            Unlock the Capsule
          </span>
        </h2>
        <p className="text-white/25 text-sm">Upload your half and enter your key to read TA&apos;s words</p>
      </div>

      {/* Role selector */}
      <div className="flex gap-3">
        <button
          onClick={() => setUnlockRole('A')}
          className={`flex-1 py-3 rounded-xl text-sm font-serif transition-all ${
            unlockRole === 'A'
              ? 'bg-rose-500/15 border-2 border-rose-400/40 text-rose-300/80'
              : 'bg-white/[0.03] border border-white/10 text-white/30 hover:bg-white/[0.05]'
          }`}
        >
          I&apos;m Person A
        </button>
        <button
          onClick={() => setUnlockRole('B')}
          className={`flex-1 py-3 rounded-xl text-sm font-serif transition-all ${
            unlockRole === 'B'
              ? 'bg-violet-500/15 border-2 border-violet-400/40 text-violet-300/80'
              : 'bg-white/[0.03] border border-white/10 text-white/30 hover:bg-white/[0.05]'
          }`}
        >
          I&apos;m Person B
        </button>
      </div>

      {/* Upload */}
      <div onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onImageChange(f); }}
        className="border-2 border-dashed border-white/[0.08] rounded-2xl p-10 text-center cursor-pointer
                   hover:border-rose-400/30 hover:bg-white/[0.01] transition-all duration-300 group">
        {unlockImage ? (
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-white/50 text-sm">{unlockImage.name}</p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-rose-500/[0.06] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-all">
              <Upload className="w-6 h-6 text-rose-400/50" />
            </div>
            <p className="text-white/40 text-sm font-light">Drop your half here</p>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && onImageChange(e.target.files[0])} />

      {/* PIN */}
      <div className="space-y-1.5">
        <label className="text-white/30 text-xs uppercase tracking-wider font-light flex items-center gap-1">
          <FileKey className="w-3 h-3" /> Your Key
        </label>
        <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4}
          value={unlockPin} onChange={(e) => setUnlockPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="****"
          className="w-full px-4 py-4 rounded-xl bg-white/[0.03] border border-white/10 text-white text-center
                     tracking-[1em] text-2xl font-mono placeholder:tracking-normal placeholder:text-white/10
                     focus:border-rose-400/40 focus:outline-none focus:ring-1 focus:ring-rose-400/20 transition-all" />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button onClick={onUnlock}
        className="w-full py-4.5 bg-gradient-to-r from-rose-500/95 to-pink-600/95 rounded-2xl text-white font-medium text-base
                   transition-all duration-300 hover:shadow-[0_0_60px_rgba(244,63,94,0.3)] hover:scale-[1.02] active:scale-[0.97]
                   flex items-center justify-center gap-2 min-h-[56px]">
        <Lock className="w-5 h-5" /> Unlock &amp; Read
      </button>
    </div>
  );
}
