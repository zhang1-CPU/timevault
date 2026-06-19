import { useState, useRef, useCallback, useEffect } from 'react';
import { sealMessage } from '@/lib/crypto';
import { ReminderSection } from './ReminderSection';
import { ArrowLeft, Upload, Lock, Download, Sparkles, Image, FileKey, Calendar } from 'lucide-react';

interface EncryptPanelProps {
  onBack: () => void;
}

export function EncryptPanel({ onBack }: EncryptPanelProps) {
  const [step, setStep] = useState<'upload' | 'compose' | 'review' | 'sealing' | 'done'>('upload');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState('');
  const [pin, setPin] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  // Compute min datetime for unlock (refresh every 60s so past-times never become valid)
  const [minUnlockDate, setMinUnlockDate] = useState(() =>
    new Date(Date.now() + 60000).toISOString().slice(0, 16)
  );
  useEffect(() => {
    const id = window.setInterval(() => {
      setMinUnlockDate(new Date(Date.now() + 60000).toISOString().slice(0, 16));
    }, 60000);
    return () => window.clearInterval(id);
  }, []);
  // Animation refs (to safely cancel timers on unmount)
  const [sealAnimating, setSealAnimating] = useState(false);
  const [hourglassReversing, setHourglassReversing] = useState(false);
  const ceremonyTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sealBtnRef = useRef<HTMLButtonElement>(null);

  // Cleanup: preview URL, any pending ceremony timers
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      if (ceremonyTimerRef.current !== null) {
        window.clearTimeout(ceremonyTimerRef.current);
        ceremonyTimerRef.current = null;
      }
    };
  }, [preview]);

  const revokeResultUrl = useCallback(() => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  }, [resultUrl]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG or JPG)');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Image too large. Maximum 20MB.');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError('');
    setStep('compose');
  }, [preview]);

  const handleSeal = async () => {
    if (!image || !message.trim() || pin.length !== 4 || !unlockDate) {
      setError('Please fill in all fields');
      return;
    }
    const unlock = new Date(unlockDate);
    if (isNaN(unlock.getTime())) {
      setError('Invalid unlock date');
      return;
    }
    const minUnlock = new Date(Date.now() + 60 * 1000);
    if (unlock.getTime() <= minUnlock.getTime()) {
      setError('Unlock time must be at least 1 minute in the future');
      return;
    }
    const maxUnlock = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);
    if (unlock > maxUnlock) {
      setError('Unlock time cannot exceed 10 years from now');
      return;
    }

    // Trigger ceremony animations
    setSealAnimating(true);
    setHourglassReversing(true);
    setStep('sealing');
    setError('');

    try {
      const blob = await sealMessage(message.trim(), pin, unlock, image);
      revokeResultUrl();
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
      // Wait for ceremony animation to complete before showing done state
      // Use timer ref so we can cancel on unmount/back-nav
      ceremonyTimerRef.current = window.setTimeout(() => {
        ceremonyTimerRef.current = null;
        setSealAnimating(false);
        setHourglassReversing(false);
        setStep('done');
      }, 1400);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Encryption failed';
      setError(msg);
      setSealAnimating(false);
      setHourglassReversing(false);
      setStep('compose');
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timevault-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between border-b border-white/[0.04] relative z-10 bg-[#0a0612]/80 backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm sm:text-base min-h-[40px] px-2 py-1 rounded-lg hover:bg-white/[0.03] active:scale-[0.98]"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="font-light">Back</span>
        </button>
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-rose-500/15 to-violet-500/10 flex items-center justify-center border border-white/5">
            <svg viewBox="0 0 64 64" className="w-5 h-5 text-rose-200/80" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 16 L44 16 L34 32 L44 48 L20 48 L30 32 Z" fill="currentColor" fillOpacity="0.22" />
            </svg>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm sm:text-base text-white/45 font-display tracking-wide">TimeVault</span>
            <span className="text-[9px] sm:text-[10px] text-white/15 font-light tracking-wider hidden sm:block">Seal a message in time</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
        <div className="w-full max-w-xl animate-page-enter">

          {/* Progress indicator */}
          {step !== 'done' && step !== 'sealing' && (
            <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 justify-center flex-wrap">
              {(['upload', 'compose', 'review'] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-2 sm:gap-3">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-medium transition-all duration-300 ${
                      step === s
                        ? 'bg-gradient-to-br from-rose-500 to-violet-500 text-white shadow-[0_0_20px_rgba(225,120,140,0.25)]'
                        : (['compose', 'review'] as const).indexOf(step as 'compose' | 'review') > i
                          ? 'bg-rose-500/25 text-rose-200'
                          : 'bg-white/[0.04] text-white/25 border border-white/10'
                    }`}
                  >
                    {(step === 'compose' || step === 'review') && i < (step === 'review' ? 2 : 1) ? (
                      <Sparkles className="w-4 h-4" />
                    ) : i + 1}
                  </div>
                  {i < 2 && (
                    <div
                      className={`w-10 sm:w-12 h-px transition-all duration-300 ${
                        (step === 'compose' && i === 0) || (step === 'review') ? 'bg-rose-400/40' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Error with shake animation */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center animate-gentle-shake">
              {error}
            </div>
          )}

          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-light mb-2">
                  <span className="bg-gradient-to-r from-rose-400 to-violet-400 gradient-text">Choose Your Vessel</span>
                </h2>
                <p className="text-white/30 text-sm">Select a photo to hide your secret inside</p>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    const input = { target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>;
                    handleImageUpload(input);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer
                           transition-all duration-300 group
                           ${isDragOver
                             ? 'border-violet-400/70 bg-violet-500/[0.05] scale-[1.02] shadow-[0_0_40px_rgba(139,92,246,0.15)]'
                             : 'border-white/10 hover:border-violet-400/40 hover:bg-white/[0.02]'
                           }`}
              >
                {/* Upload icon with shimmer sweep on hover */}
                <div className="relative w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-4 overflow-hidden
                                group-hover:bg-violet-500/20 group-hover:scale-110 transition-all duration-300">
                  <div className="absolute inset-0 shimmer-sweep pointer-events-none" />
                  <Upload className="w-7 h-7 text-violet-400 relative z-10" />
                </div>
                <p className="text-white/50 text-lg mb-1">Drop a photo here</p>
                <p className="text-white/20 text-sm">or click to browse</p>
                <p className="text-white/10 text-xs mt-3">PNG, JPG up to 20MB</p>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
          )}

          {/* Step: Compose */}
          {step === 'compose' && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h2 className="text-3xl font-display font-light mb-2">
                  <span className="bg-gradient-to-r from-rose-400 to-violet-400 gradient-text">Write Your Secret</span>
                </h2>
              </div>

              {/* Image preview with glow pulse */}
              {preview && (
                <div className="relative rounded-xl overflow-hidden max-h-48 mx-auto w-fit">
                  <img src={preview} alt="Preview" className="max-h-48 object-contain" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute inset-0 rounded-xl ring-1 ring-white/5" />
                  <div className="absolute inset-0 rounded-xl animate-pulse" style={{ boxShadow: 'inset 0 0 20px rgba(139,92,246,0.15)' }} />
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                    <span className="text-white/50 text-xs flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      {image?.name}
                    </span>
                    <button onClick={() => setStep('upload')} className="text-white/40 hover:text-white text-xs underline">
                      Change
                    </button>
                  </div>
                </div>
              )}

              {/* Message textarea */}
              <div className="space-y-2">
                <label className="text-white/40 text-xs uppercase tracking-wider">Your Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Dear future me..."
                  rows={5}
                  maxLength={5000}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white 
                             placeholder:text-white/15 focus:border-violet-400/40 focus:outline-none 
                             focus:ring-1 focus:ring-violet-400/20 resize-none transition-all text-sm leading-relaxed"
                />
                <div className="text-right text-white/15 text-xs">{message.length}/5000</div>
              </div>

              {/* PIN input */}
              <div className="space-y-2">
                <label className="text-white/40 text-xs uppercase tracking-wider flex items-center gap-1">
                  <FileKey className="w-3 h-3" />
                  4-Digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="****"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-center
                             tracking-[1em] text-lg font-mono placeholder:tracking-normal placeholder:text-white/15
                             focus:border-violet-400/40 focus:outline-none focus:ring-1 focus:ring-violet-400/20 transition-all"
                />
              </div>

              {/* Date picker */}
              <div className="space-y-2">
                <label className="text-white/40 text-xs uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Unlock Time
                </label>
                <input
                  type="datetime-local"
                  value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  min={minUnlockDate}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm
                             focus:border-violet-400/40 focus:outline-none focus:ring-1 focus:ring-violet-400/20 
                             transition-all [color-scheme:dark]"
                />
              </div>

              <button
                onClick={() => {
                  if (!message.trim() || pin.length !== 4 || !unlockDate) {
                    setError('Please fill in all fields');
                    return;
                  }
                  setError('');
                  setStep('review');
                }}
                className="w-full py-4.5 sm:py-5 bg-gradient-to-r from-rose-500 to-violet-600 rounded-2xl text-white
                           font-medium text-base sm:text-lg transition-all duration-300
                           hover:shadow-[0_0_60px_rgba(225,120,140,0.35)] hover:scale-[1.02] active:scale-[0.97]
                           min-h-[56px] sm:min-h-[60px] flex items-center justify-center gap-2"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h2 className="text-3xl font-display font-light mb-2">
                  <span className="bg-gradient-to-r from-rose-400 to-violet-400 gradient-text">Ready to Seal</span>
                </h2>
              </div>

              <div className="glass rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/30">Message</span>
                  <span className="text-white/70">{message.length} characters</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/30">PIN</span>
                  <span className="text-white/70 font-mono tracking-widest">****</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/30">Unlocks</span>
                  <span className="text-white/70">
                    {unlockDate ? new Date(unlockDate).toLocaleString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    }) : ''}
                  </span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/30">Image</span>
                  <span className="text-white/70">{image?.name}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <p className="text-amber-400/60 text-xs text-center">
                  Once sealed, this message can only be unlocked after the specified time with the correct PIN.
                  We store nothing — keep your photo and PIN safe.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setStep('compose')}
                  className="sm:flex-1 py-4 border border-white/10 rounded-2xl text-white/50 text-sm sm:text-base
                             hover:bg-white/[0.04] hover:text-white/70 hover:border-white/20 transition-all min-h-[52px]"
                >
                  Edit
                </button>
                <button
                  ref={sealBtnRef}
                  onClick={handleSeal}
                  className={`sm:flex-[2] py-4 rounded-2xl text-white font-medium text-sm sm:text-base
                              transition-all duration-300 hover:scale-[1.02] active:scale-[0.97]
                              flex items-center justify-center gap-2 min-h-[52px]
                              ${sealAnimating ? 'bg-gradient-to-r from-rose-500 to-violet-600' : 'bg-gradient-to-r from-rose-500 to-violet-600'}`}
                  style={{
                    boxShadow: sealAnimating
                      ? '0 0 80px rgba(225,120,140,0.7), 0 0 160px rgba(139,92,246,0.4)'
                      : '0 0 30px rgba(225,120,140,0.15)'
                  }}
                >
                  <Lock className="w-5 h-5" />
                  Seal with Time Lock
                </button>
              </div>
            </div>
          )}

          {/* Step: Sealing ceremony */}
          {step === 'sealing' && (
            <div className="text-center py-20">
              <div className="relative w-32 h-32 mx-auto mb-10">
                {/* Outer glow */}
                <div className="absolute inset-0 rounded-full" style={{
                  background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
                  animation: 'bokeh-drift 3s ease-in-out infinite',
                }} />
                <div className="absolute inset-2 rounded-full bg-violet-500/10 animate-ping" style={{ animationDuration: '2.5s' }} />
                <div className="absolute inset-4 rounded-full bg-violet-500/08 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.4s' }} />

                {/* Rotating hourglass SVG */}
                <div className={`relative w-28 h-28 mx-auto ${hourglassReversing ? 'animate-hourglass-reverse' : ''}`}>
                  <svg viewBox="0 0 120 120" className="w-full h-full">
                    <defs>
                      <linearGradient id="hgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f8c8d8" />
                        <stop offset="50%" stopColor="#c9a8e8" />
                        <stop offset="100%" stopColor="#b5c8f0" />
                      </linearGradient>
                    </defs>
                    {/* Hourglass frame */}
                    <line x1="35" y1="20" x2="85" y2="20" stroke="url(#hgGrad)" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                    <line x1="35" y1="100" x2="85" y2="100" stroke="url(#hgGrad)" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                    <path d="M 35 20 L 60 60 L 85 20" stroke="url(#hgGrad)" strokeWidth="2.5" fill="none" strokeLinejoin="round" opacity="0.8" />
                    <path d="M 35 100 L 60 60 L 85 100" stroke="url(#hgGrad)" strokeWidth="2.5" fill="none" strokeLinejoin="round" opacity="0.8" />
                    {/* Sand upper */}
                    <path d="M 39 24 L 81 24 L 60 57 L 39 24 Z" fill="url(#hgGrad)" opacity="0.6" />
                    {/* Sand stream */}
                    <line x1="60" y1="57" x2="60" y2="72" stroke="#f5c8a0" strokeWidth="2" opacity="0.9" />
                    {/* Falling grains */}
                    <circle cx="60" cy="78" r="2" fill="#f5c8a0" opacity="0.8" />
                    <circle cx="60" cy="86" r="1.5" fill="#f5c8a0" opacity="0.6" />
                    {/* Sand lower */}
                    <path d="M 42 96 L 78 96 L 60 65 L 42 96 Z" fill="url(#hgGrad)" opacity="0.4" />
                  </svg>
                </div>
              </div>
              <p className="text-xl text-white/60 font-light animate-pulse">Sealing your secret in time...</p>
              <p className="text-white/20 text-sm mt-3">This moment will arrive when the time is right.</p>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && resultBlob && (
            <div className="space-y-6">
              <div className="text-center">
                {/* Animated success icon */}
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-success-ripple" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/20 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-emerald-400 animate-heart-bob" />
                  </div>
                </div>
                <h2 className="text-3xl font-display font-light mb-2">
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-400 gradient-text">Sealed Successfully</span>
                </h2>
                <p className="text-white/30 text-sm">Your secret is now hidden inside this photo</p>
              </div>

              <div className="relative rounded-xl overflow-hidden mx-auto max-w-sm border border-white/10">
                <img src={resultUrl} alt="Sealed" className="w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-center">
                  <span className="text-white/40 text-xs">This photo contains your encrypted message</span>
                </div>
              </div>

              <div className="glass rounded-xl p-5 space-y-3">
                <p className="text-rose-400/80 text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Important — Save These:
                </p>
                <ul className="text-white/35 text-xs space-y-2 list-disc list-inside leading-relaxed">
                  <li>Save this photo as <strong className="text-white/50">PNG</strong> (do not convert to JPG)</li>
                  <li>Remember your <strong className="text-white/50">4-digit PIN</strong></li>
                  <li>Return after <strong className="text-white/50">{unlockDate ? new Date(unlockDate).toLocaleDateString() : ''}</strong> to unlock</li>
                  <li>We store nothing — losing the photo or PIN means losing the message forever</li>
                </ul>
              </div>

              <button
                onClick={handleDownload}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl text-white
                           font-medium text-sm sm:text-base transition-all duration-300
                           hover:shadow-[0_0_60px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.97]
                           flex items-center justify-center gap-2 min-h-[56px]"
              >
                <Download className="w-5 h-5" />
                Download Sealed Photo
              </button>

              <ReminderSection unlockDate={unlockDate} />

              <button
                onClick={onBack}
                className="w-full py-4 text-white/40 hover:text-white/60 text-sm transition-colors border border-white/[0.05] rounded-2xl hover:bg-white/[0.02] min-h-[52px]"
              >
                Seal Another Message
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
