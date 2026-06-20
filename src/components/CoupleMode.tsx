import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  createSession,
  splitPhotoSimple,
  generateCoupleURL,
  generateQRCode,
  sealHalf,
  loadSession,
  saveSession,
  markQRUsed,
  type CoupleSession,
} from '@/lib/couple-crypto';
import { CoupleHeader, MobilePromptBanner } from './CoupleHeader';
import {
  Upload, Lock, Scissors, QrCode, Check, Timer, FileKey,
  AlertCircle, Download, Copy, Heart,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════════════════════

type Step =
  | 'landing'
  | 'upload'
  | 'cut'
  | 'cut-fade'      // Fade transition after cut confirm
  | 'a-write'
  | 'a-qr'
  | 'b-welcome'     // B scans QR → sees preview + unlock time
  | 'b-write'       // B writes message + PIN
  | 'b-done';       // B downloads sealed half

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
  // ─── Core state ────────────────────────────────────────────
  const [step, setStep] = useState<Step>('landing');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // ─── Mount-time values (keep render pure, no Date.now calls) ───
  const mountTime = useMemo(() => Date.now(), []);
  const minUnlockDate = useMemo(
    () => new Date(mountTime + 60000).toISOString().slice(0, 16),
    [mountTime]
  );

  // ─── Photo data ────────────────────────────────────────────
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const originalPreviewRef = useRef<string>('');
  const [leftHalfBlob, setLeftHalfBlob] = useState<Blob | null>(null);
  const [rightHalfBlob, setRightHalfBlob] = useState<Blob | null>(null);
  const [leftPreview, setLeftPreview] = useState('');
  const [rightPreview, setRightPreview] = useState('');

  // ─── Cut editor ────────────────────────────────────────────
  const [splitX, setSplitX] = useState(0.5);  // 0-1 normalized
  const [isDragging, setIsDragging] = useState(false);
  const cutCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  // ─── A's data ──────────────────────────────────────────────
  const [messageA, setMessageA] = useState('');
  const [pinA, setPinA] = useState('');
  const [unlockDate, setUnlockDate] = useState('');

  // ─── Session & QR ──────────────────────────────────────────
  const [session, setSession] = useState<CoupleSession | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [copied, setCopied] = useState(false);

  // ─── B's data ──────────────────────────────────────────────
  const [bPreviewFromQR, setBPreviewFromQR] = useState('');
  const [bUnlockTime, setBUnlockTime] = useState('');
  const bUnlockTimeRef = useRef('');
  const [bSessionId, setBSessionId] = useState('');
  const [messageB, setMessageB] = useState('');
  const [pinB, setPinB] = useState('');
  const [sealedBlobB, setSealedBlobB] = useState<Blob | null>(null);

  // ─── Object URL cleanup tracking ───────────────────────────
  const objectUrlsRef = useRef<string[]>([]);
  const trackUrl = useCallback((url: string) => {
    objectUrlsRef.current.push(url);
    return url;
  }, []);
  const revokeAllUrls = useCallback(() => {
    objectUrlsRef.current.forEach(URL.revokeObjectURL);
    objectUrlsRef.current = [];
  }, []);

  // ─── Timer cleanup (prevent React state updates after unmount) ───────
  const timersRef = useRef<Set<number>>(new Set());
  const safeSetTimeout = useCallback((fn: () => void, ms: number): number => {
    const id = window.setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, ms);
    timersRef.current.add(id);
    return id;
  }, []);
  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current.clear();
  }, []);

  // ─── Error helpers ─────────────────────────────────────────
  const clearError = useCallback(() => setError(''), []);
  const withError = useCallback((msg: string) => {
    setError(msg);
    setIsProcessing(false);
  }, []);

  // ─── Unmount cleanup: cancel timers + revoke object URLs ───
  useEffect(() => {
    return () => {
      clearAllTimers();
      revokeAllUrls();
    };
  }, [clearAllTimers, revokeAllUrls]);

  // ─── Step: Upload ──────────────────────────────────────────
  const handleImageUpload = useCallback((file: File) => {
    clearError();
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, or WebP)');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`Image too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      return;
    }
    setOriginalImage(file);
    const url = URL.createObjectURL(file);
    originalPreviewRef.current = url;
    trackUrl(url);
    setStep('cut');
  }, [clearError, trackUrl]);

  // ─── Step: Cut — Canvas rendering ──────────────────────────
  // Render the cut preview line on the image
  useEffect(() => {
    if (step !== 'cut' && step !== 'cut-fade') return;
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

      imageSizeRef.current = { w: img.width, h: img.height };
      canvas.width = w;
      canvas.height = h;

      // Draw image
      ctx.drawImage(img, 0, 0, w, h);

      // Draw split line (only in cut step, not in fade)
      if (step === 'cut') {
        const splitPos = splitX * w;
        ctx.save();
        ctx.strokeStyle = 'rgba(232, 160, 170, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([10, 7]);
        ctx.beginPath();
        ctx.moveTo(splitPos, 0);
        ctx.lineTo(splitPos, h);
        ctx.stroke();

        // Labels
        ctx.setLineDash([]);
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillStyle = 'rgba(232, 180, 180, 0.9)';
        ctx.fillText('A', splitPos - 24, 28);
        ctx.fillStyle = 'rgba(200, 180, 230, 0.9)';
        ctx.fillText('B', splitPos + 12, 28);

        // Split percentage indicator
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '11px Inter, sans-serif';
        const pct = Math.round(splitX * 100);
        ctx.fillText(`${pct}% / ${100 - pct}%`, splitPos + 15, h - 12);
        ctx.restore();
      }
    };
    img.src = previewUrl;
  }, [step, splitX]);

  // ─── Cut pointer handlers ──────────────────────────────────
  const handleCutPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = cutCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    const normX = Math.max(0.05, Math.min(0.95, x / canvas.width));
    setSplitX(normX);
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
    const normX = Math.max(0.05, Math.min(0.95, x / canvas.width));
    setSplitX(normX);
  }, [isDragging]);

  const handleCutPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ─── BUG FIX #1: splitX is normalized (0-1), splitPhotoSimple needs pixel coords
  const applyCut = useCallback(async () => {
    if (!originalImage) return;
    clearError();
    setIsProcessing(true);
    try {
      const imgSize = imageSizeRef.current;
      // Convert normalized splitX to absolute pixel coordinate
      const pixelSplitX = Math.round(splitX * imgSize.w);
      const { leftBlob, rightBlob } = await splitPhotoSimple(originalImage, pixelSplitX);
      setLeftHalfBlob(leftBlob);
      setRightHalfBlob(rightBlob);
      setLeftPreview(trackUrl(URL.createObjectURL(leftBlob)));
      setRightPreview(trackUrl(URL.createObjectURL(rightBlob)));
      setStep('cut-fade');
      safeSetTimeout(() => setStep('a-write'), 1800);
    } catch (err) {
      withError(err instanceof Error ? err.message : 'Failed to split photo');
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage, splitX, clearError, withError, trackUrl, safeSetTimeout]);

  // ─── Step: A Write → Generate QR ──────────────────────────
  const handleAGenerateQR = useCallback(async () => {
    if (!originalImage || !rightHalfBlob || !messageA.trim() || pinA.length !== PIN_LENGTH || !unlockDate) {
      setError('Please fill in all fields');
      return;
    }
    const unlock = new Date(unlockDate);
    if (isNaN(unlock.getTime())) {
      setError('Invalid unlock date');
      return;
    }
    if (unlock.getTime() <= Date.now() + 60000) {
      setError('Unlock time must be at least 1 minute in the future');
      return;
    }
    const maxUnlock = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);
    if (unlock > maxUnlock) {
      setError('Unlock time cannot exceed 10 years from now');
      return;
    }
    clearError();
    setIsProcessing(true);

    try {
      // Create session with B's preview
      const sess = await createSession(originalImage, rightHalfBlob, unlock);
      sess.aData = { message: messageA.trim(), pin: pinA };
      sess.aCompleted = true;
      saveSession(sess);
      setSession(sess);

      // Seal A's half (replace blob with sealed version)
      const sealedLeft = await sealHalf(leftHalfBlob!, messageA.trim(), pinA, unlock);
      // Revoke previous left preview before replacing
      if (leftPreview) URL.revokeObjectURL(leftPreview);
      setLeftHalfBlob(sealedLeft);
      setLeftPreview(trackUrl(URL.createObjectURL(sealedLeft)));

      const url = generateCoupleURL(sess);
      const qr = await generateQRCode(url);
      setQrCode(qr);

      setStep('a-qr');
    } catch (err) {
      withError(err instanceof Error ? err.message : 'Failed to generate QR code');
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage, rightHalfBlob, messageA, pinA, unlockDate, leftHalfBlob, leftPreview, clearError, withError, trackUrl]);

  // ─── B Path: Parse QR URL ──────────────────────────────────
  // B scans QR → directly enters b-welcome with preview + unlock time
  // No verification needed — QR itself is the one-time key
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('couple')) return;

    const searchParams = hash.includes('?') ? hash.split('?')[1] : '';
    if (!searchParams) return;

    const params = new URLSearchParams(searchParams);
    const sid = params.get('s');
    const role = params.get('r');

    if (role === 'b' && sid) {
      setBSessionId(sid);

      // Load session data
      const sess = loadSession(sid);
      if (sess) {
        // Check if already used
        if (sess.qrUsed || sess.bCompleted) {
          setBPreviewFromQR(sess.bHalfPreview || '');
          setBUnlockTime(sess.unlockTime || '');
          bUnlockTimeRef.current = sess.unlockTime || '';
          setStep('b-done');
          setError('This link has already been used.');
          return;
        }
        setBPreviewFromQR(sess.bHalfPreview || '');
        setBUnlockTime(sess.unlockTime || '');
        bUnlockTimeRef.current = sess.unlockTime || '';
      }

      // Cross-device fallback: preview embedded in URL
      const urlPreview = params.get('p');
      if (urlPreview && !sess) {
        setBPreviewFromQR(urlPreview);
      }

      // Decode unlock time from URL if available
      const urlUnlock = params.get('u');
      if (urlUnlock && !bUnlockTimeRef.current) {
        setBUnlockTime(urlUnlock);
        bUnlockTimeRef.current = urlUnlock;
      }

      // Direct to welcome page
      setStep('b-welcome');
    }
  }, []);

  // ─── Step: B Write → Seal ──────────────────────────────────
  const handleBSeal = useCallback(async () => {
    if (!messageB.trim() || pinB.length !== PIN_LENGTH) {
      setError('Please write a message and set a 4-digit PIN');
      return;
    }
    if (!bUnlockTime) {
      setError('Missing unlock time data');
      return;
    }
    const unlock = new Date(bUnlockTime);
    if (isNaN(unlock.getTime())) {
      setError('Invalid unlock time');
      return;
    }
    clearError();
    setIsProcessing(true);

    try {
      const sess = loadSession(bSessionId);
      // For B's half, we need to re-split the original photo
      // In practice, B uploads the original and we extract their half
      // For now, use a simplified approach
      // Use the preview as the half image (compressed but functional)
      const resp = await fetch(bPreviewFromQR);
      if (!resp.ok) throw new Error('Failed to load preview image');
      const previewBlob = await resp.blob();

      const sealed = await sealHalf(previewBlob, messageB.trim(), pinB, unlock);
      setSealedBlobB(sealed);

      // Update session
      if (sess) {
        sess.bData = { message: messageB.trim(), pin: pinB };
        sess.bCompleted = true;
        saveSession(sess);
      }

      setStep('b-done');
    } catch (err) {
      withError(err instanceof Error ? err.message : 'Failed to seal message');
    } finally {
      setIsProcessing(false);
    }
  }, [messageB, pinB, bUnlockTime, bPreviewFromQR, bSessionId, clearError, withError]);

  // ─── Navigation ────────────────────────────────────────────
  const goBack = useCallback(() => {
    if (step === 'landing') { onBack(); return; }
    if (step === 'upload') setStep('landing');
    else if (step === 'cut') setStep('upload');
    else if (step === 'cut-fade') setStep('cut');
    else if (step === 'a-write') setStep('cut');
    else if (step === 'a-qr') setStep('a-write');
    else if (step === 'b-welcome') onHome();
    else if (step === 'b-write') setStep('b-welcome');
    else if (step === 'b-done') onHome();
  }, [step, onBack, onHome]);

  // ─── Header title ──────────────────────────────────────────
  const headerTitle = useMemo(() => {
    switch (step) {
      case 'upload': return 'A — Upload';
      case 'cut': return 'A — Draw the Line';
      case 'cut-fade': return 'A — Splitting...';
      case 'a-write': return 'A — Your Message';
      case 'a-qr': return 'A — Share';
      case 'b-welcome': return 'B — Welcome';
      case 'b-write': return 'B — Your Message';
      case 'b-done': return 'B — Complete';
      default: return undefined;
    }
  }, [step]);

  // ─── Cleanup on unmount ────────────────────────────────────
  useEffect(() => () => revokeAllUrls(), [revokeAllUrls]);

  // ════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex flex-col pt-[72px] sm:pt-[80px]">
      {/* pt 预留顶部 NavBar 高度，避免在移动端被 fixed NavBar 覆盖 */}
      <CoupleHeader onBack={goBack} title={headerTitle} />
      <MobilePromptBanner />

      <main className="flex-1 flex items-start justify-center px-4 sm:px-6 py-6 sm:py-8">
        <div className="w-full max-w-lg mx-auto">
          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center flex items-start justify-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {step === 'landing' && (
            <LandingStep
              onStartSeal={() => setStep('upload')}
              onStartUnlock={() => {
                // B clicks "I Received a QR Code" — show a helpful message
                // In real usage, B scans the QR code directly
                setError('Please scan the QR code sent by your partner, or paste the link with #couple in your browser.');
              }}
            />
          )}
          {step === 'upload' && <UploadStep onUpload={handleImageUpload} />}
          {step === 'cut' && (
            <CutStep
              canvasRef={cutCanvasRef}
              onPointerDown={handleCutPointerDown}
              onPointerMove={handleCutPointerMove}
              onPointerUp={handleCutPointerUp}
              onConfirm={applyCut}
              splitX={splitX}
              isProcessing={isProcessing}
            />
          )}
          {/* BUG FIX #2: Fade transition step */}
          {step === 'cut-fade' && <CutFadeStep leftPreview={leftPreview} rightPreview={rightPreview} />}
          {step === 'a-write' && (
            <AWriteStep
              leftPreview={leftPreview}
              rightPreview={rightPreview}
              messageA={messageA} setMessageA={setMessageA}
              pinA={pinA} setPinA={setPinA}
              unlockDate={unlockDate} setUnlockDate={setUnlockDate}
              onGenerateQR={handleAGenerateQR}
              isProcessing={isProcessing}
              minUnlockDate={minUnlockDate}
            />
          )}
          {step === 'a-qr' && (
            <AQRStep
              qrCode={qrCode}
              leftPreview={leftPreview}
              unlockDate={unlockDate}
              onCopyLink={() => {
                if (session) {
                  navigator.clipboard.writeText(generateCoupleURL(session)).catch(() => {});
                  setCopied(true);
                  safeSetTimeout(() => setCopied(false), 2000);
                }
              }}
              copied={copied}
              mountTime={mountTime}
            />
          )}
          {step === 'b-welcome' && (
            <BWelcomeStep
              preview={bPreviewFromQR}
              unlockTime={bUnlockTime}
              onContinue={() => {
                markQRUsed(bSessionId);
                setStep('b-write');
              }}
            />
          )}
          {step === 'b-write' && (
            <BWriteStep
              preview={bPreviewFromQR}
              messageB={messageB} setMessageB={setMessageB}
              pinB={pinB} setPinB={setPinB}
              onSeal={handleBSeal}
              isProcessing={isProcessing}
            />
          )}
          {step === 'b-done' && <BDoneStep sealedBlob={sealedBlobB} onHome={onHome} mountTime={mountTime} />}
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Step Components
// ═══════════════════════════════════════════════════════════════

// ─── Landing ─────────────────────────────────────────────────
function LandingStep({ onStartSeal, onStartUnlock }: { onStartSeal: () => void; onStartUnlock: () => void }) {
  return (
    <div className="space-y-10 pt-4">
      {/* Page header — clear and instructional */}
      <div className="text-center space-y-4">
        <img src="/logo.png" alt="TimeVault" className="w-14 h-14 mx-auto opacity-55 animate-breathe" />
        <h1 className="text-4xl sm:text-5xl font-serif font-light">
          <span className="gradient-text">For Two</span>
        </h1>
        <p className="text-white/30 text-sm leading-relaxed max-w-sm mx-auto font-light">
          One photo. Two halves. Two secrets. Only when reunited can the full message be revealed.
        </p>
      </div>

      {/* How it works — role A vs role B */}
      <div className="glass-romantic rounded-2xl p-5 sm:p-6 border border-white/[0.04] space-y-4">
        <h3 className="font-serif text-white/50 text-base text-center">How It Works</h3>

        {/* Person A */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-500/[0.1] flex items-center justify-center border border-rose-400/20">
            <span className="text-rose-300/70 text-xs font-serif font-medium">A</span>
          </div>
          <div className="space-y-1">
            <p className="text-white/55 text-sm font-serif">You (Person A)</p>
            <p className="text-white/25 text-xs leading-relaxed font-light">
              Upload a photo, split it in two, write your secret, and send a QR code to your partner.
            </p>
          </div>
        </div>

        {/* Person B */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500/[0.1] flex items-center justify-center border border-violet-400/20">
            <span className="text-violet-300/70 text-xs font-serif font-medium">B</span>
          </div>
          <div className="space-y-1">
            <p className="text-white/55 text-sm font-serif">Your Partner (Person B)</p>
            <p className="text-white/25 text-xs leading-relaxed font-light">
              Scans the QR code, writes their reply, downloads their sealed half of the photo.
            </p>
          </div>
        </div>

        {/* Unlock */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/[0.1] flex items-center justify-center border border-emerald-400/20">
            <span className="text-emerald-300/70 text-xs font-serif font-medium">🔓</span>
          </div>
          <div className="space-y-1">
            <p className="text-white/55 text-sm font-serif">Together</p>
            <p className="text-white/25 text-xs leading-relaxed font-light">
              When the moment arrives, both halves meet. Enter your PINs. The full message is revealed.
            </p>
          </div>
        </div>
      </div>

      {/* Step guide */}
      <div className="space-y-2.5">
        {[
          { num: '1', color: 'rose', text: 'Person A uploads a photo together' },
          { num: '2', color: 'rose', text: 'Person A draws a line to split it in two' },
          { num: '3', color: 'rose', text: 'Person A writes their message + sets PIN' },
          { num: '4', color: 'violet', text: 'Person A sends the QR code to Person B' },
          { num: '5', color: 'violet', text: 'Person B scans it, writes their reply + PIN' },
          { num: '6', color: 'emerald', text: 'When the time comes — reunite & unlock together' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-3.5 glass rounded-xl px-4 py-3.5 transition-all duration-200">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-serif
              ${s.color === 'rose' ? 'bg-rose-500/[0.08] border border-rose-400/15 text-rose-300/50' : ''}
              ${s.color === 'violet' ? 'bg-violet-500/[0.08] border border-violet-400/15 text-violet-300/50' : ''}
              ${s.color === 'emerald' ? 'bg-emerald-500/[0.08] border border-emerald-400/15 text-emerald-300/50' : ''}`}>
              {s.num}
            </div>
            <span className="text-white/45 text-sm font-light">{s.text}</span>
          </div>
        ))}
      </div>

      {/* Mobile tip */}
      <div className="flex items-start gap-2.5 p-4 rounded-xl bg-amber-500/[0.05] border border-amber-500/10">
        <div className="text-amber-300/40 flex-shrink-0 mt-0.5 text-sm">📱</div>
        <p className="text-white/25 text-xs leading-relaxed font-light">
          <strong className="text-white/35">Best on mobile:</strong> Person B should open the QR code link on their phone camera or browser. Works best on Safari or Chrome for mobile.
        </p>
      </div>

      {/* CTA buttons */}
      <div className="space-y-3">
        <button onClick={onStartSeal}
          className="w-full py-4.5 sm:py-5 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl text-white font-medium text-base
                     transition-all duration-300 hover:shadow-[0_0_60px_rgba(244,63,94,0.3)] hover:scale-[1.02] active:scale-[0.97]
                     flex items-center justify-center gap-2.5 min-h-[58px]">
          <Scissors className="w-5 h-5 sm:w-6 sm:h-6" />
          I am Person A — Start Now
        </button>
        <button onClick={onStartUnlock}
          className="w-full py-4.5 sm:py-5 border border-white/[0.1] rounded-2xl text-white/45 text-sm sm:text-base
                     hover:bg-white/[0.03] hover:border-white/15 hover:text-white/70 transition-all
                     flex items-center justify-center gap-2.5 min-h-[58px]">
          <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
          I Received a QR Code (Person B)
        </button>
      </div>
    </div>
  );
}

// ─── Upload ──────────────────────────────────────────────────
function UploadStep({ onUpload }: { onUpload: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-8 pt-8">
      <div className="text-center space-y-3">
        <p className="text-rose-300/30 text-xs tracking-[0.3em] uppercase">A — Step 1 of 4</p>
        <h2 className="text-3xl font-display font-light">
          <span className="gradient-text bg-gradient-to-r from-rose-300/80 to-pink-300/70">Choose Your Photo</span>
        </h2>
        <p className="text-white/25 text-sm">A picture that holds meaning for both of you</p>
      </div>

      <div onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onUpload(f); }}
        className="border-2 border-dashed border-white/[0.08] rounded-2xl p-16 text-center cursor-pointer
                   hover:border-rose-400/30 hover:bg-white/[0.01] transition-all duration-300 group">
        <div className="w-16 h-16 rounded-full bg-rose-500/[0.06] flex items-center justify-center mx-auto mb-4
                        group-hover:bg-rose-500/[0.12] group-hover:scale-110 transition-all">
          <Upload className="w-7 h-7 text-rose-400/50" />
        </div>
        <p className="text-white/40 text-lg mb-1 font-light">Drop a photo here</p>
        <p className="text-white/15 text-sm">or click to browse</p>
        <p className="text-white/10 text-xs mt-3">PNG, JPG, WebP — up to 20MB</p>
      </div>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden"
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
    </div>
  );
}

// ─── Cut ─────────────────────────────────────────────────────
function CutStep({
  canvasRef, onPointerDown, onPointerMove, onPointerUp, onConfirm, splitX, isProcessing,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: () => void;
  onConfirm: () => void;
  splitX: number;
  isProcessing: boolean;
}) {
  return (
    <div className="space-y-6 pt-4">
      <div className="text-center space-y-2">
        <p className="text-rose-300/30 text-xs tracking-[0.3em] uppercase">A — Step 2 of 4</p>
        <h2 className="text-2xl font-display font-light text-white/70">Draw the Line</h2>
        <p className="text-white/25 text-xs">Drag the line to set the boundary. Left is yours (A), right is your partner&apos;s (B).</p>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-white/[0.06] bg-black/20 select-none">
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="w-full cursor-col-resize touch-none"
          style={{ maxHeight: '50vh', display: 'block' }}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1 glass-romantic rounded-lg p-3 text-center">
          <span className="text-rose-300/50 text-xs font-medium">Side A — Yours ({Math.round(splitX * 100)}%)</span>
        </div>
        <div className="flex-1 glass-romantic rounded-lg p-3 text-center">
          <span className="text-violet-300/50 text-xs font-medium">Side B — Partner&apos;s ({Math.round((1 - splitX) * 100)}%)</span>
        </div>
      </div>

      <button onClick={onConfirm} disabled={isProcessing}
        className="w-full py-4.5 sm:py-5 bg-gradient-to-r from-rose-500/95 to-pink-600/95 rounded-2xl text-white font-medium text-sm sm:text-base
                   transition-all duration-300 hover:shadow-[0_0_60px_rgba(244,63,94,0.25)] hover:scale-[1.02] active:scale-[0.97]
                   disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[56px] sm:min-h-[60px]">
        {isProcessing ? (
          <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Splitting...</>
        ) : (
          <><Scissors className="w-5 h-5" /> Confirm Split</>
        )}
      </button>
    </div>
  );
}

// ─── BUG FIX #2: Cut Fade Transition ─────────────────────────
function CutFadeStep({ leftPreview, rightPreview }: { leftPreview: string; rightPreview: string }) {
  return (
    <div className="space-y-8 pt-8 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-light text-white/70">Separating...</h2>
        <p className="text-white/25 text-sm">Two halves. Two secrets.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Side A - Stays */}
        <div className="space-y-2">
          <div className="rounded-xl overflow-hidden border-2 border-rose-400/30 shadow-[0_0_30px_rgba(225,120,140,0.1)]
                          animate-fade-in-up">
            <img src={leftPreview} alt="Your half" className="w-full" />
          </div>
          <p className="text-rose-300/50 text-xs animate-fade-in-up-delay-1">
            <Check className="w-3 h-3 inline mr-1" />Side A — Kept
          </p>
        </div>

        {/* Side B - Fades out */}
        <div className="space-y-2">
          <div className="rounded-xl overflow-hidden border border-violet-400/10 relative
                          animate-fade-out-slow">
            <img src={rightPreview} alt="Partner's half" className="w-full opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0612] via-[#0a0612]/60 to-transparent flex items-center justify-center">
              <QrCode className="w-8 h-8 text-violet-300/30" />
            </div>
          </div>
          <p className="text-violet-300/30 text-xs animate-fade-in-up-delay-1">
            Side B — Sent via QR
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── A Write ─────────────────────────────────────────────────
function AWriteStep({
  leftPreview, rightPreview, messageA, setMessageA, pinA, setPinA, unlockDate, setUnlockDate,
  onGenerateQR, isProcessing, minUnlockDate,
}: {
  leftPreview: string; rightPreview: string;
  messageA: string; setMessageA: (v: string) => void;
  pinA: string; setPinA: (v: string) => void;
  unlockDate: string; setUnlockDate: (v: string) => void;
  onGenerateQR: () => void;
  isProcessing: boolean;
  minUnlockDate: string;
}) {
  return (
    <div className="space-y-6 pt-4">
      <div className="text-center space-y-2">
        <p className="text-rose-300/30 text-xs tracking-[0.3em] uppercase">A — Step 3 of 4</p>
        <h2 className="text-2xl font-display font-light text-white/70">Write Your Secret</h2>
      </div>

      {/* Halves */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="rounded-xl overflow-hidden border-2 border-rose-400/25 relative">
            <img src={leftPreview} alt="Your half" className="w-full" />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-rose-300/80 text-[10px] font-medium">A — Yours</div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="rounded-xl overflow-hidden border border-violet-400/10 relative opacity-40">
            <img src={rightPreview} alt="Partner's half" className="w-full" />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-violet-300/60 text-[10px] font-medium">B — QR</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-white/30 text-xs uppercase tracking-wider font-light">Your Message</label>
          <textarea value={messageA} onChange={(e) => setMessageA(e.target.value)}
            placeholder="Write from the heart..." rows={4} maxLength={2000}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/10
                       focus:border-rose-400/40 focus:outline-none focus:ring-1 focus:ring-rose-400/20 resize-none transition-all text-sm leading-relaxed" />
          <div className="text-right text-white/10 text-xs">{messageA.length}/2000</div>
        </div>

        <div className="space-y-1.5">
          <label className="text-white/30 text-xs uppercase tracking-wider font-light flex items-center gap-1">
            <FileKey className="w-3 h-3" /> Your 4-Digit Key
          </label>
          <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4}
            value={pinA} onChange={(e) => setPinA(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="****"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-center
                       tracking-[1em] text-lg font-mono placeholder:tracking-normal placeholder:text-white/10
                       focus:border-rose-400/40 focus:outline-none focus:ring-1 focus:ring-rose-400/20 transition-all" />
        </div>

        <div className="space-y-1.5">
          <label className="text-white/30 text-xs uppercase tracking-wider font-light flex items-center gap-1">
            <Timer className="w-3 h-3" /> When to Unlock
          </label>
          <input type="datetime-local" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)}
            min={minUnlockDate}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm
                       focus:border-rose-400/40 focus:outline-none focus:ring-1 focus:ring-rose-400/20 transition-all [color-scheme:dark]" />
        </div>
      </div>

      <button onClick={onGenerateQR} disabled={isProcessing}
        className="w-full py-4.5 sm:py-5 bg-gradient-to-r from-rose-500/95 to-pink-600/95 rounded-2xl text-white font-medium text-sm sm:text-base
                   transition-all duration-300 hover:shadow-[0_0_60px_rgba(244,63,94,0.25)] hover:scale-[1.02] active:scale-[0.97]
                   disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[56px] sm:min-h-[60px]">
        {isProcessing ? (
          <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sealing...</>
        ) : (
          <><QrCode className="w-5 h-5" /> Generate QR Code for B</>
        )}
      </button>
    </div>
  );
}

// ─── A QR ────────────────────────────────────────────────────
function AQRStep({ qrCode, leftPreview, unlockDate, onCopyLink, copied, mountTime }: {
  qrCode: string; leftPreview: string; unlockDate: string;
  onCopyLink: () => void; copied: boolean;
  mountTime: number;
}) {
  const date = unlockDate ? new Date(unlockDate) : null;
  return (
    <div className="space-y-8 pt-4">
      <div className="text-center space-y-2">
        <p className="text-rose-300/30 text-xs tracking-[0.3em] uppercase">A — Step 4 of 4</p>
        <h2 className="text-2xl font-display font-light text-white/70">Share with Your Love</h2>
        <p className="text-white/25 text-xs">Send this QR code. They&apos;ll scan it to write their half.</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="p-5 rounded-2xl border border-rose-400/15 bg-white/[0.02]">
          <img src={qrCode} alt="QR Code" className="w-56 h-56" />
        </div>
        <button onClick={onCopyLink}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.08] text-white/30 text-sm
                     hover:bg-white/[0.03] hover:border-white/15 hover:text-white/50 transition-all">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      <div className="glass-romantic rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400/60" />
          <span className="text-white/50 text-sm font-light">Your half is sealed</span>
        </div>
        <div className="rounded-lg overflow-hidden border border-rose-400/10 max-w-[180px] mx-auto">
          <img src={leftPreview} alt="Your sealed half" className="w-full" />
        </div>
        {date && (
          <p className="text-center text-white/20 text-xs">
            Unlocks {date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        <a href={leftPreview} download={`timevault-half-a-${mountTime}.png`}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-rose-500/[0.08] border border-rose-400/15
                     text-rose-200/60 text-sm hover:bg-rose-500/[0.15] hover:text-rose-100 transition-all min-h-[52px] no-underline">
          <Download className="w-4 h-4" /> Download My Half
        </a>
      </div>

      <p className="text-center text-white/15 text-xs italic font-display">
        &ldquo;Distance means so little when someone means so much.&rdquo;
      </p>
    </div>
  );
}

// ─── B Welcome ───────────────────────────────────────────────
function BWelcomeStep({ preview, unlockTime, onContinue }: { preview: string; unlockTime: string; onContinue: () => void }) {
  const date = unlockTime ? new Date(unlockTime) : null;
  return (
    <div className="space-y-8 pt-8">
      <div className="text-center space-y-4">
        <img src="/logo.png" alt="TimeVault" className="w-12 h-12 mx-auto opacity-50 animate-breathe" />
        <h2 className="text-3xl font-display font-light">
          <span className="gradient-text bg-gradient-to-r from-violet-300/80 to-rose-300/70">A Message Awaits</span>
        </h2>
        <p className="text-white/25 text-sm">Someone has split a photo and saved half for you.</p>
      </div>

      {/* B's half preview */}
      {preview && (
        <div className="space-y-2">
          <div className="rounded-xl overflow-hidden border border-violet-400/15 max-w-[240px] mx-auto relative">
            <img src={preview} alt="Your half" className="w-full" />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/50 text-violet-300/70 text-[10px] font-medium">Your Half</div>
          </div>
          <p className="text-center text-violet-300/30 text-[10px]">This is your part of the photo</p>
        </div>
      )}

      {/* Unlock time */}
      {date && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-romantic">
            <Timer className="w-3.5 h-3.5 text-amber-300/40" />
            <span className="text-white/40 text-xs">
              Unlocks {date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      )}

      {/* Info note */}
      <div className="glass rounded-xl p-4 border border-white/[0.04]">
        <p className="text-white/20 text-xs text-center leading-relaxed">
          Write your reply below. Your message will be sealed inside your half of the photo.
          <br />Each half has its own secret key — only you can unlock yours.
        </p>
      </div>

      {/* Continue button */}
      <button onClick={onContinue}
        className="w-full py-4.5 sm:py-5 bg-gradient-to-r from-violet-500/95 to-rose-500/95 rounded-2xl text-white font-medium text-sm sm:text-lg
                   transition-all duration-300 hover:shadow-[0_0_60px_rgba(139,92,246,0.25)] hover:scale-[1.02] active:scale-[0.97]
                   flex items-center justify-center gap-2 min-h-[56px] sm:min-h-[60px]">
        <Heart className="w-5 h-5 sm:w-6 sm:h-6" /> Write My Message
      </button>
    </div>
  );
}

// ─── B Write ─────────────────────────────────────────────────
function BWriteStep({ preview, messageB, setMessageB, pinB, setPinB, onSeal, isProcessing }: {
  preview: string; messageB: string; setMessageB: (v: string) => void;
  pinB: string; setPinB: (v: string) => void; onSeal: () => void; isProcessing: boolean;
}) {
  return (
    <div className="space-y-6 pt-4">
      <div className="text-center space-y-2">
        <p className="text-violet-300/30 text-xs tracking-[0.3em] uppercase">B — Write</p>
        <h2 className="text-2xl font-display font-light text-white/70">Write Your Reply</h2>
      </div>

      {preview && (
        <div className="rounded-xl overflow-hidden border border-violet-400/15 max-w-[200px] mx-auto relative">
          <img src={preview} alt="Your half" className="w-full" />
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/50 text-violet-300/70 text-[10px]">Your Half</div>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-white/30 text-xs uppercase tracking-wider font-light">Your Message</label>
          <textarea value={messageB} onChange={(e) => setMessageB(e.target.value)}
            placeholder="Write what you feel..." rows={4} maxLength={2000}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/10
                       focus:border-violet-400/40 focus:outline-none focus:ring-1 focus:ring-violet-400/20 resize-none transition-all text-sm leading-relaxed" />
          <div className="text-right text-white/10 text-xs">{messageB.length}/2000</div>
        </div>

        <div className="space-y-1.5">
          <label className="text-white/30 text-xs uppercase tracking-wider font-light flex items-center gap-1">
            <FileKey className="w-3 h-3" /> Your 4-Digit Key
          </label>
          <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4}
            value={pinB} onChange={(e) => setPinB(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="****"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-center
                       tracking-[1em] text-lg font-mono placeholder:tracking-normal placeholder:text-white/10
                       focus:border-violet-400/40 focus:outline-none focus:ring-1 focus:ring-violet-400/20 transition-all" />
        </div>
      </div>

      <button onClick={onSeal} disabled={isProcessing}
        className="w-full py-4.5 sm:py-5 bg-gradient-to-r from-violet-500/95 to-rose-500/95 rounded-2xl text-white font-medium text-sm sm:text-base
                   transition-all duration-300 hover:shadow-[0_0_60px_rgba(139,92,246,0.25)] hover:scale-[1.02] active:scale-[0.97]
                   disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[56px] sm:min-h-[60px]">
        {isProcessing ? (
          <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sealing...</>
        ) : (
          <><Lock className="w-5 h-5" /> Seal &amp; Download My Half</>
        )}
      </button>
    </div>
  );
}

// ─── B Done ──────────────────────────────────────────────────
function BDoneStep({ sealedBlob, onHome, mountTime }: { sealedBlob: Blob | null; onHome: () => void; mountTime: number }) {
  const blobUrl = useMemo(() => {
    return sealedBlob ? URL.createObjectURL(sealedBlob) : '';
  }, [sealedBlob]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  return (
    <div className="space-y-8 pt-8">
      <div className="text-center space-y-4">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-400/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-emerald-300/70" />
          </div>
        </div>
        <h2 className="text-3xl font-display font-light">
          <span className="gradient-text bg-gradient-to-r from-emerald-300/70 to-teal-300/60">Sealed</span>
        </h2>
        <p className="text-white/25 text-sm">Your half is ready. The link has been consumed.</p>
      </div>

      {sealedBlob && blobUrl && (
        <div className="flex justify-center">
          <a href={blobUrl} download={`timevault-half-b-${mountTime}.png`}
            className="inline-flex items-center gap-2 px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-violet-500/95 to-rose-500/95 rounded-2xl
                       text-white font-medium text-sm sm:text-lg transition-all duration-300
                       hover:shadow-[0_0_60px_rgba(139,92,246,0.3)] hover:scale-[1.02] active:scale-[0.97] min-h-[56px] no-underline">
            <Download className="w-5 h-5 sm:w-6 sm:h-6" /> Download My Sealed Half
          </a>
        </div>
      )}

      <div className="text-center space-y-2 pt-4">
        <p className="text-white/25 text-xs italic font-display">
          &ldquo;Distance means so little when someone means so much.&rdquo;
        </p>
      </div>

      <button onClick={onHome} className="w-full py-4 text-white/40 hover:text-white/60 text-sm transition-colors border border-white/[0.05] rounded-2xl hover:bg-white/[0.02] min-h-[52px]">
        Back to Home
      </button>
    </div>
  );
}
