import { useState, useRef, useCallback, useEffect } from 'react';
import { revealMessage, checkImageStatus, revealCoupleMessage, type LockStatus } from '@/lib/crypto';
import { ArrowLeft, Upload, Unlock, Clock, AlertCircle, Image, FileKey, Heart } from 'lucide-react';
import { RevealCeremony } from './RevealCeremony';
import { useScrollToTop } from '@/lib/download-utils';

interface DecryptPanelProps {
  onBack: () => void;
}

export function DecryptPanel({ onBack }: DecryptPanelProps) {
  const [step, setStep] = useState<'upload' | 'checking' | 'locked' | 'pin' | 'couple-pin' | 'revealed'>('upload');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<LockStatus | null>(null);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [coupleRole, setCoupleRole] = useState<'A' | 'B'>('A');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Countdown timer
  useEffect(() => {
    if (step !== 'locked' || !status) return;

    const updateCountdown = () => {
      if (status.remainingSeconds <= 0) {
        setStep('pin');
        return;
      }
      const remaining = status.remainingSeconds - Math.floor((Date.now() - (status.checkTimeMs || Date.now())) / 1000);
      if (remaining <= 0) {
        setStep('pin');
        return;
      }

      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);
      const mins = Math.floor((remaining % 3600) / 60);
      const secs = remaining % 60;
      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${String(hours).padStart(2, '0')}h`);
      parts.push(`${String(mins).padStart(2, '0')}m`);
      parts.push(`${String(secs).padStart(2, '0')}s`);
      setCountdown(parts.join(' '));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [step, status]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Revoke previous preview
    if (preview) URL.revokeObjectURL(preview);

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError('');
    setStep('checking');

    try {
      const lockStatus = await checkImageStatus(file);
      lockStatus.checkTimeMs = Date.now();
      setStatus(lockStatus);

      if (!lockStatus.unlockTime) {
        setError('No hidden message found in this image');
        setStep('upload');
        return;
      }

      // This image was created as a two-person (couple) letter
      if (lockStatus.isCoupleMode) {
        if (lockStatus.isCoupleModeReady === false) {
          setError('This couple letter is incomplete — the second person hasn\'t written yet.');
          setStep('upload');
          return;
        }
        // Go to couple pin entry instead of regular pin entry
        setStep('couple-pin');
        return;
      }

      if (!lockStatus.canUnlock) {
        setStep('locked');
        return;
      }

      setStep('pin');
    } catch {
      setError('Failed to check image. Make sure it is a PNG saved from TimeVault.');
      setStep('upload');
    }
  }, [preview]);

  const [sealedAt, setSealedAt] = useState<Date | null>(null);

  const handleUnlock = async () => {
    if (!image || pin.length !== 4) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    setError('');

    try {
      const result = await revealMessage(image, pin);
      setMessage(result.message);
      setSealedAt(result.sealedAt);
      setStep('revealed');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Decryption failed';
      if (msg.includes('LOCKED') || msg.includes('time')) {
        setError('This message is still time-locked');
      } else if (msg.includes('PIN') || msg.includes('password') || msg.includes('key')) {
        setError('Wrong PIN. Please try again.');
      } else if (msg.includes('atob') || msg.includes('base64') || msg.includes('correctly encoded')) {
        setError('The message inside this image could not be read. Try with your original PNG download.');
      } else {
        setError(msg);
      }
    }
  };

  const handleCoupleUnlock = async () => {
    if (!image || pin.length !== 4) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    setError('');

    try {
      const result = await revealCoupleMessage(image, pin, coupleRole);
      if (!result) {
        setError('No message found from your partner');
        return;
      }
      setMessage(result.theirMessage);
      setSealedAt(result.sealedAt);
      setStep('revealed');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Decryption failed';
      if (msg.includes('LOCKED') || msg.includes('time')) {
        setError('This message is still time-locked');
      } else if (msg.includes('PIN') || msg.includes('password') || msg.includes('key')) {
        setError('Wrong PIN. Please try again.');
      } else {
        setError('Decryption failed — ' + msg);
      }
    }
  };

  // Scroll to top every time the user moves to a new step.
  useScrollToTop([step]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header sits directly below the fixed NavBar — outer Layout already reserves the space. */}
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-white/[0.04] relative z-10 bg-[#0a0612]/80 backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm sm:text-base min-h-[40px] px-2 py-1 rounded-lg hover:bg-white/[0.03] active:scale-[0.98] transition-transform"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="font-light">Back</span>
        </button>
        {/* No secondary logo — the top NavBar already carries the brand. */}
        <div className="text-white/30 text-xs sm:text-sm font-light tracking-wide">
          Unlock a Message
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 sm:px-6 py-6 sm:py-8">
        {/* items-start 替代 items-center：让内容从顶部自然开始，避免短步骤时内容在屏幕中间"漂浮" */}
        <div className="w-full max-w-xl mx-auto">
          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-light mb-2">
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-400 gradient-text">
                    Unlock Your Secret
                  </span>
                </h2>
                <p className="text-white/30 text-sm">Upload your sealed TimeVault photo</p>
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
                             ? 'border-emerald-400/70 bg-emerald-500/[0.05] scale-[1.02] shadow-[0_0_40px_rgba(16,185,129,0.15)]'
                             : 'border-white/10 hover:border-emerald-400/40 hover:bg-white/[0.02]'
                           }`}
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4
                                group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all duration-300">
                  <Upload className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-white/50 text-lg mb-1">Drop your sealed photo here</p>
                <p className="text-white/20 text-sm">or click to browse</p>
                <p className="text-white/10 text-xs mt-3">PNG format only</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Checking */}
          {step === 'checking' && (
            <div className="text-center py-20">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-violet-400/20 border-t-violet-400 animate-spin" />
                <Image className="absolute inset-0 m-auto w-6 h-6 text-violet-400" />
              </div>
              <p className="text-white/50">Scanning for hidden message...</p>
            </div>
          )}

          {/* Locked */}
          {step === 'locked' && status && (
            <div className="text-center space-y-8">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-amber-500/15 flex items-center justify-center">
                  <Clock className="w-10 h-10 text-amber-400" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-display font-light text-white/70 mb-2">Still Sealed</h3>
                <p className="text-amber-400/80 text-3xl font-mono tracking-wide">{countdown || status.formattedRemaining}</p>
                {status.unlockTime && (
                  <p className="text-white/20 text-sm mt-2">
                    Unlocks {status.unlockTime.toLocaleString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                )}
              </div>

              {preview && (
                <div className="max-w-xs mx-auto rounded-xl overflow-hidden border border-white/5 opacity-40">
                  <img src={preview} alt="Sealed" className="w-full" />
                </div>
              )}

              <p className="text-white/15 text-xs">The time lock is cryptographically enforced. No one can open it early.</p>
            </div>
          )}

          {/* PIN Entry */}
          {step === 'pin' && (
            <div className="space-y-6 text-center">
              <div>
                <h2 className="text-3xl font-display font-light mb-2">
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-400 gradient-text">
                    Time Has Come
                  </span>
                </h2>
                <p className="text-white/30 text-sm">Enter your PIN to reveal the message</p>
              </div>

              {preview && (
                <div className="max-w-xs mx-auto rounded-xl overflow-hidden border border-white/10">
                  <img src={preview} alt="Sealed" className="w-full" />
                </div>
              )}

              <div className="max-w-[240px] mx-auto space-y-2">
                <label className="text-white/30 text-xs uppercase tracking-wider flex items-center justify-center gap-1">
                  <FileKey className="w-3 h-3" />
                  Your 4-Digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="****"
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  className="w-full px-4 py-4 rounded-xl bg-white/[0.03] border border-white/10 text-white text-center
                             tracking-[1em] text-2xl font-mono placeholder:tracking-normal placeholder:text-white/15
                             focus:border-emerald-400/40 focus:outline-none focus:ring-1 focus:ring-emerald-400/20 
                             transition-all"
                />
              </div>

              <button
                onClick={handleUnlock}
                disabled={pin.length !== 4}
                className="px-10 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl text-white
                           font-medium text-sm sm:text-lg transition-all duration-300
                           hover:shadow-[0_0_60px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.97]
                           disabled:opacity-30 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2 mx-auto min-h-[56px] sm:min-h-[60px]"
              >
                <Unlock className="w-5 h-5 sm:w-6 sm:h-6" />
                Reveal
              </button>
            </div>
          )}

          {/* Couple Mode PIN Entry */}
          {step === 'couple-pin' && (
            <div className="space-y-6 text-center">
              <div>
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-400/20 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-rose-400" fill="rgba(244,63,94,0.2)" />
                  </div>
                </div>
                <h2 className="text-3xl font-display font-light mb-2">
                  <span className="bg-gradient-to-r from-rose-400 to-pink-400 gradient-text">
                    A Letter for Two
                  </span>
                </h2>
                <p className="text-white/30 text-sm">Enter your PIN to read your partner&apos;s message</p>
              </div>

              {preview && (
                <div className="max-w-xs mx-auto rounded-xl overflow-hidden border border-white/10">
                  <img src={preview} alt="Sealed" className="w-full" />
                </div>
              )}

              <div className="max-w-[240px] mx-auto space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setCoupleRole('A')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                      coupleRole === 'A'
                        ? 'bg-rose-500/20 border border-rose-400/40 text-rose-300'
                        : 'bg-white/[0.03] border border-white/10 text-white/40 hover:text-white/60'
                    }`}
                  >
                    Person A
                  </button>
                  <button
                    onClick={() => setCoupleRole('B')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                      coupleRole === 'B'
                        ? 'bg-violet-500/20 border border-violet-400/40 text-violet-300'
                        : 'bg-white/[0.03] border border-white/10 text-white/40 hover:text-white/60'
                    }`}
                  >
                    Person B
                  </button>
                </div>

                <label className="text-white/30 text-xs uppercase tracking-wider flex items-center justify-center gap-1">
                  <FileKey className="w-3 h-3" />
                  Your 4-Digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="****"
                  onKeyDown={(e) => e.key === 'Enter' && handleCoupleUnlock()}
                  className="w-full px-4 py-4 rounded-xl bg-white/[0.03] border border-white/10 text-white text-center
                             tracking-[1em] text-2xl font-mono placeholder:tracking-normal placeholder:text-white/15
                             focus:border-rose-400/40 focus:outline-none focus:ring-1 focus:ring-rose-400/20 
                             transition-all"
                />
              </div>

              <button
                onClick={handleCoupleUnlock}
                disabled={pin.length !== 4}
                className="px-10 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl text-white
                           font-medium text-sm sm:text-lg transition-all duration-300
                           hover:shadow-[0_0_60px_rgba(244,63,94,0.3)] hover:scale-[1.02] active:scale-[0.97]
                           disabled:opacity-30 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2 mx-auto min-h-[56px] sm:min-h-[60px]"
              >
                <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
                Reveal Message
              </button>
            </div>
          )}

          {/* Revealed — romantic envelope ceremony */}
          {step === 'revealed' && (
            <RevealCeremony
              message={message}
              sealedAt={sealedAt}
              unlockedAt={status?.unlockTime ?? undefined}
              onDismiss={onBack}
            />
          )}
        </div>
      </main>
    </div>
  );
}
