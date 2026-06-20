import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

interface RevealCeremonyProps {
  message: string;
  sealedAt?: Date | null;    // when the message was sealed (not always available)
  unlockedAt?: Date | null;  // when it unlocks / was unlocked
  onDismiss?: () => void;
  autoOpenDelay?: number;    // ms before auto-opening. default 1600
}

// Romantic brand preamble. Picks 1 of 3 intros, uses the brand tagline.
function buildPreamble(messageLen: number, sealedAt?: Date | null, unlockedAt?: Date | null): string[] {
  const now = new Date();
  const un = unlockedAt || now;
  const seal = sealedAt;

  const lines: string[] = [];
  if (seal) {
    const sealStr = seal.toLocaleDateString(undefined, {
      month: 'long', day: 'numeric', year: 'numeric',
    });
    const unStr = un.toLocaleDateString(undefined, {
      month: 'long', day: 'numeric', year: 'numeric',
    });
    const intro = [
      `On ${sealStr}, you sealed a message meant for this moment.`,
      `On ${sealStr}, you wrote words to your future self — and kept them secret.`,
      `On ${sealStr}, you whispered something into time.`,
    ];
    lines.push(intro[Math.floor(Math.random() * intro.length)]);

    if (sealStr !== unStr) {
      const diffMs = Math.max(0, un.getTime() - seal.getTime());
      const days = Math.round(diffMs / 86_400_000);
      if (days > 0) {
        lines.push(`After ${days} ${days === 1 ? 'day' : 'days'} of patient waiting, your letter is ready to be read.`);
      } else {
        lines.push(`After a short wait, your letter is ready to be read.`);
      }
    } else {
      lines.push(`Kept safe, just for a little while. Now —`);
    }
  } else {
    // fallback — no seal date known
    const intro = [
      `A secret kept by time, now ready to be read.`,
      `Time has come to open what you have kept.`,
      `The wait is over. A letter from your past is here.`,
    ];
    lines.push(intro[Math.floor(Math.random() * intro.length)]);
  }

  lines.push(`\u201cOpen what the wait has kept.\u201d  — TimeVault`);
  lines.push('');
  void messageLen; // reserved for future length-aware styling
  return lines;
}

/**
 * Typewriter: progressively reveal the message, one character at a time.
 * Returns the current visible text + whether it is still typing.
 */
function useTypewriter(text: string, start: boolean, cps: number): [string, boolean] {
  const [shown, setShown] = useState('');
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!start) {
      setShown('');
      setTyping(false);
      return;
    }
    setShown('');
    setTyping(true);

    const total = text.length;
    const intervalMs = 1000 / cps;
    let i = 0;

    // Chunk bigger pieces so very long messages reveal fast enough
    const chunk = Math.max(1, Math.round(total / 300));
    const timer = setInterval(() => {
      i = Math.min(total, i + chunk);
      setShown(text.slice(0, i));
      if (i >= total) {
        clearInterval(timer);
        setTyping(false);
      }
    }, intervalMs * chunk);

    return () => clearInterval(timer);
  }, [text, start, cps]);

  return [shown, typing];
}

type Phase = 'flying-in' | 'waiting' | 'opening' | 'revealed';

/**
 * Full-screen romantic envelope ceremony.
 *
 * Phases:
 *  1. envelope flies in
 *  2. floats gently; "Open the letter" prompt appears
 *  3. user clicks (or auto) → seal breaks, lid opens, letter slides out
 *  4. letter expands → preamble fades in → message is typed
 */
export function RevealCeremony({
  message,
  sealedAt,
  unlockedAt,
  onDismiss,
  autoOpenDelay = 1600,
}: RevealCeremonyProps) {
  const [phase, setPhase] = useState<Phase>('flying-in');
  const [sealBroken, setSealBroken] = useState(false);
  const [lidOpen, setLidOpen] = useState(false);
  const [letterOut, setLetterOut] = useState(false);
  const [preamble, setPreamble] = useState<string[]>([]);
  const [typewriterStart, setTypewriterStart] = useState(false);

  // Phase transitions
  useEffect(() => {
    // 1. Envelope finishes flying in after ~ 1100 ms
    const t1 = setTimeout(() => setPhase('waiting'), 1150);
    return () => clearTimeout(t1);
  }, []);

  // Once in waiting: prepare the preamble text (deterministic on message + dates)
  useEffect(() => {
    if (phase === 'waiting') {
      setPreamble(buildPreamble(message.length, sealedAt, unlockedAt));
      // Auto open after delay (user can also click earlier)
      const auto = setTimeout(() => setPhase('opening'), autoOpenDelay);
      return () => clearTimeout(auto);
    }
  }, [phase, message, sealedAt, unlockedAt, autoOpenDelay]);

  // Phase -> opening: choreograph animation sequence
  useEffect(() => {
    if (phase !== 'opening') return;
    setSealBroken(true);
    const t2 = setTimeout(() => setLidOpen(true), 450);
    const t3 = setTimeout(() => setLetterOut(true), 1300);
    const t4 = setTimeout(() => {
      setPhase('revealed');
      setTypewriterStart(true);
    }, 2900);
    return () => { clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [phase]);

  const [typed, isTyping] = useTypewriter(message, typewriterStart, 55);

  // Particles — 12 glowing specks that burst when seal breaks
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const dist = 110 + (i % 5) * 18;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist - 20;
    const palette = ['#f472b6', '#a855f7', '#fbbf24', '#60a5fa', '#fca5a5'];
    return { tx, ty, color: palette[i % palette.length], delay: i * 0.02, key: i };
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
      {/* Romantic glow backdrop — only during the dramatic moment */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
        style={{
          opacity: phase === 'opening' || phase === 'revealed' ? 1 : 0.35,
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(244,114,182,0.10) 0%, rgba(139,92,246,0.06) 35%, transparent 70%)',
        }}
      />

      {/* Stage */}
      <div className="envelope-stage relative flex flex-col items-center pointer-events-auto w-full max-w-2xl px-4">
        {/* ── Phase: flying / waiting / opening — envelope visuals ── */}
        {phase !== 'revealed' && (
          <div
            className="relative"
            style={{
              width: 'min(92vw, 520px)',
              animation:
                phase === 'flying-in'
                  ? 'envelope-fly-in 1.15s cubic-bezier(0.2, 0.8, 0.25, 1) forwards'
                  : undefined,
            }}
          >
            <div className="envelope-body relative mx-auto" style={{ height: 340 }}>
              {/* Envelope body */}
              <svg
                viewBox="0 0 520 340"
                className="w-full h-full"
                style={{ filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.45))' }}
              >
                <defs>
                  <linearGradient id="envPaper" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f8efe0" />
                    <stop offset="50%" stopColor="#efe0c8" />
                    <stop offset="100%" stopColor="#e5d3b8" />
                  </linearGradient>
                  <linearGradient id="envPaperDark" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#d9c3a2" />
                    <stop offset="100%" stopColor="#b89b77" />
                  </linearGradient>
                  <linearGradient id="envFlap" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fff5e3" />
                    <stop offset="100%" stopColor="#e5d3b8" />
                  </linearGradient>
                  <radialGradient id="waxGrad" cx="0.35" cy="0.35" r="0.7">
                    <stop offset="0%" stopColor="#fca5a5" />
                    <stop offset="40%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#7f1d1d" />
                  </radialGradient>
                </defs>

                {/* Letter peeking out (only when opened) */}
                {letterOut && (
                  <g style={{ animation: 'letter-slide-out 1.4s cubic-bezier(0.16,1,0.3,1) forwards' }}>
                    <rect x="70" y="60" width="380" height="200" rx="4" fill="#fdf6ea" opacity="0.95" />
                    <rect x="85" y="80" width="350" height="1" fill="#d7c2a0" opacity="0.5" />
                    <rect x="85" y="100" width="330" height="1" fill="#d7c2a0" opacity="0.45" />
                    <rect x="85" y="120" width="300" height="1" fill="#d7c2a0" opacity="0.4" />
                    <rect x="85" y="140" width="340" height="1" fill="#d7c2a0" opacity="0.4" />
                    <rect x="85" y="160" width="280" height="1" fill="#d7c2a0" opacity="0.35" />
                  </g>
                )}

                {/* Envelope body (back) */}
                <rect x="20" y="20" width="480" height="300" rx="6" fill="url(#envPaper)" />

                {/* Folded sides (two triangles forming a pocket) */}
                <polygon points="20,20 260,180 500,20" fill="url(#envFlap)" opacity="0.95" />

                {/* Bottom fold — visible */}
                <polygon points="20,320 260,180 500,320" fill="url(#envPaperDark)" opacity="0.85" />

                {/* Decorative stitching */}
                <rect x="26" y="26" width="468" height="288" rx="4"
                      fill="none" stroke="#c2a374" strokeDasharray="4 5" strokeWidth="1" opacity="0.35" />

                {/* Flap (top triangle) — with 3D flip animation when opened */}
                <g
                  className={`envelope-lid ${lidOpen ? 'is-open' : ''}`}
                  style={{
                    transformOrigin: '50% 20px',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <polygon points="20,20 260,180 500,20" fill="url(#envFlap)" />
                  {/* subtle highlight */}
                  <polygon points="20,20 260,180 260,140" fill="#ffffff" opacity="0.06" />
                </g>
              </svg>

              {/* Wax seal (on top of envelope, clickable) */}
              {!letterOut && (
                <button
                  onClick={() => phase === 'waiting' && setPhase('opening')}
                  className={`wax-seal absolute left-1/2 -translate-x-1/2 cursor-pointer rounded-full flex items-center justify-center ${sealBroken ? 'is-broken' : ''}`}
                  style={{
                    top: '42%',
                    width: 78,
                    height: 78,
                    background:
                      'radial-gradient(circle at 35% 30%, #fca5a5 0%, #ef4444 35%, #991b1b 100%)',
                    border: '2px solid rgba(127,29,29,0.55)',
                    boxShadow: '0 0 28px 2px rgba(244,63,94,0.45)',
                  }}
                  aria-label="Open the letter"
                  title="Tap the seal to open"
                >
                  <Heart className="w-9 h-9 text-white/90" strokeWidth={2.2} fill="rgba(255,255,255,0.35)" />
                </button>
              )}

              {/* Particles that burst out when seal breaks */}
              {sealBroken && (
                <div className="absolute left-1/2 top-[46%] -translate-x-1/2 pointer-events-none" style={{ width: 1, height: 1 }}>
                  {particles.map((p) => (
                    <span
                      key={p.key}
                      className="ceremony-particle"
                      style={{
                        // @ts-expect-error — CSS custom properties
                        '--tx': `${p.tx}px`,
                        '--ty': `${p.ty}px`,
                        background: p.color,
                        boxShadow: `0 0 14px 3px ${p.color}`,
                        animationDelay: `${p.delay}s`,
                        left: 0,
                        top: 0,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Waiting prompt */}
            {phase === 'waiting' && (
              <div className="reveal-prompt text-center mt-8">
                <button
                  onClick={() => setPhase('opening')}
                  className="text-white/55 text-base sm:text-lg font-display tracking-wide hover:text-white/90 transition-colors px-6 py-3 rounded-xl hover:bg-white/5"
                >
                  Tap the seal to open your letter
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Phase: revealed — letter on parchment with preamble + typewriter ── */}
        {phase === 'revealed' && (
          <div className="ceremony-letter w-full parchment rounded-2xl p-8 sm:p-12 border border-amber-900/10"
               style={{
                 boxShadow:
                   '0 0 80px 10px rgba(244,114,182,0.18), 0 0 160px 30px rgba(139,92,246,0.12), 0 25px 60px rgba(0,0,0,0.35)',
               }}
          >
            {/* Decorative top flourish */}
            <div className="flex items-center justify-center gap-3 mb-6 opacity-60">
              <span className="h-px bg-amber-900/20 w-16" />
              <Heart className="w-4 h-4 text-rose-400/70" strokeWidth={1.8} />
              <span className="h-px bg-amber-900/20 w-16" />
            </div>

            {/* Preamble — lines fade in one at a time */}
            <div className="text-center mb-8 space-y-3">
              {preamble.map((line, idx) => (
                <p
                  key={idx}
                  className="preamble-line text-stone-700 font-display text-sm sm:text-base italic leading-relaxed"
                  style={{ animationDelay: `${0.15 + idx * 0.5}s` }}
                >
                  {line === '' ? '\u00A0' : line}
                </p>
              ))}
            </div>

            {/* Separator with brand tagline feel */}
            <div className="flex items-center justify-center gap-3 mb-8 opacity-50">
              <span className="h-px bg-stone-500/30 w-24 sm:w-32" />
              <span className="text-stone-500 text-[10px] uppercase tracking-[0.35em]">your words</span>
              <span className="h-px bg-stone-500/30 w-24 sm:w-32" />
            </div>

            {/* The message — typewriter */}
            <div className="text-stone-800 font-display text-base sm:text-lg leading-[1.85] whitespace-pre-wrap min-h-[120px] text-center px-2 sm:px-6">
              {typed}
              {isTyping && <span className="typewriter-cursor" style={{ height: '1.2em' }} />}
            </div>

            {/* Bottom flourish */}
            <div className="flex items-center justify-center gap-3 mt-10 opacity-60">
              <span className="h-px bg-amber-900/20 w-16" />
              <Heart className="w-4 h-4 text-rose-400/70" strokeWidth={1.8} />
              <span className="h-px bg-amber-900/20 w-16" />
            </div>

            {/* Dismiss */}
            {onDismiss && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={onDismiss}
                  disabled={isTyping}
                  className="text-stone-600 text-sm font-display hover:text-stone-900 px-6 py-3 rounded-xl hover:bg-stone-900/5 transition-colors disabled:opacity-40"
                >
                  {isTyping ? 'Still reading…' : 'Close this letter'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
