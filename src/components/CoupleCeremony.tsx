import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

interface CoupleCeremonyProps {
  messageA: string;
  messageB: string;
  sealedAt?: Date | null;
  unlockedAt?: Date | null;
  onDismiss?: () => void;
}

type Phase = 'drifting' | 'meeting' | 'seal-glow' | 'opening' | 'revealed';

/**
 * Couple ceremony — two envelopes drift from opposite sides, meet in the
 * middle, fuse into one shared letter with both messages side-by-side.
 */
function buildCouplePreamble(sealedAt?: Date | null, unlockedAt?: Date | null): string[] {
  const now = new Date();
  const un = unlockedAt || now;
  const seal = sealedAt;

  const lines: string[] = [];
  if (seal) {
    const sealStr = seal.toLocaleDateString(undefined, {
      month: 'long', day: 'numeric', year: 'numeric',
    });
    lines.push(`On ${sealStr}, two hearts wrote two letters to one another.`);

    if (un.getTime() !== seal.getTime()) {
      const diffMs = Math.max(0, un.getTime() - seal.getTime());
      const days = Math.round(diffMs / 86_400_000);
      if (days > 0) {
        lines.push(`Time held them close for ${days} ${days === 1 ? 'day' : 'days'} — now, at last, they open together.`);
      } else {
        lines.push(`Time held them close — now, at last, they open together.`);
      }
    }
  } else {
    lines.push('Two hearts wrote two letters to one another.');
    lines.push('Time held them close — now, at last, they open together.');
  }
  lines.push(`\u201cOpen what the wait has kept.\u201d  — TimeVault`);
  return lines;
}

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

export function CoupleCeremony({
  messageA, messageB, sealedAt, unlockedAt, onDismiss,
}: CoupleCeremonyProps) {
  const [phase, setPhase] = useState<Phase>('drifting');
  const [lidOpen, setLidOpen] = useState(false);
  const [sealBroken, setSealBroken] = useState(false);
  const [letterOut, setLetterOut] = useState(false);
  const [preamble] = useState(() => buildCouplePreamble(sealedAt, unlockedAt));
  const [typewriterStart, setTypewriterStart] = useState(false);

  // Phase choreography
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('meeting'), 1500);
    const t2 = setTimeout(() => setPhase('seal-glow'), 2800);
    const t3 = setTimeout(() => setPhase('opening'), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    if (phase !== 'opening') return;
    setSealBroken(true);
    const a = setTimeout(() => setLidOpen(true), 500);
    const b = setTimeout(() => setLetterOut(true), 1400);
    const c = setTimeout(() => { setPhase('revealed'); setTypewriterStart(true); }, 3100);
    return () => { clearTimeout(a); clearTimeout(b); clearTimeout(c); };
  }, [phase]);

  const [typedA, typingA] = useTypewriter(messageA, typewriterStart, 45);
  const [typedB, typingB] = useTypewriter(messageB, typewriterStart, 45);
  const isTyping = typingA || typingB;

  const particles = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    const dist = 120 + (i % 6) * 20;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const palette = ['#f472b6', '#c084fc', '#fbbf24', '#60a5fa', '#fca5a5', '#a5b4fc'];
    return { tx, ty, color: palette[i % palette.length], delay: i * 0.03, key: i };
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
      {/* Drifting nebula backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 30% 50%, rgba(244,114,182,0.12) 0%, transparent 60%),' +
            'radial-gradient(ellipse 70% 55% at 70% 50%, rgba(139,92,246,0.12) 0%, transparent 60%)',
        }}
      />

      <div className="envelope-stage relative flex items-center justify-center w-full max-w-5xl px-4 pointer-events-auto">
        {/* ── Phase: drifting / meeting / seal-glow / opening → show envelopes ── */}
        {phase !== 'revealed' && (
          <div className="relative w-full flex items-center justify-center" style={{ height: 420 }}>
            {/* Left envelope (A) */}
            <Envelope
              side="left"
              variant="A"
              phase={phase}
              lidOpen={lidOpen}
              sealBroken={sealBroken}
              letterOut={letterOut}
            />

            {/* Big heart between them — pulses when meeting */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                opacity: phase === 'meeting' || phase === 'seal-glow' || phase === 'opening' ? 1 : 0,
                transform: `translate(-50%, -50%) scale(${phase === 'seal-glow' ? 1.35 : 1})`,
                transition: 'opacity 600ms ease, transform 1200ms cubic-bezier(0.2,0.8,0.25,1)',
              }}
            >
              <Heart
                className="text-rose-400/70"
                strokeWidth={1.8}
                style={{
                  width: 56, height: 56,
                  filter: 'drop-shadow(0 0 22px rgba(244,114,182,0.7))',
                }}
                fill="rgba(244,114,182,0.35)"
              />
            </div>

            {/* Right envelope (B) */}
            <Envelope
              side="right"
              variant="B"
              phase={phase}
              lidOpen={lidOpen}
              sealBroken={sealBroken}
              letterOut={letterOut}
            />

            {/* Particles when seal breaks */}
            {sealBroken && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: 1, height: 1 }}>
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
                      left: 0, top: 0,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Prompt during seal-glow */}
            {phase === 'seal-glow' && (
              <div className="reveal-prompt absolute left-1/2 bottom-4 -translate-x-1/2">
                <p className="text-white/55 text-base font-display tracking-wide">
                  Two letters, one moment —
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Phase: revealed — shared letter with two messages side by side ── */}
        {phase === 'revealed' && (
          <div
            className="ceremony-letter w-full parchment rounded-2xl border border-amber-900/10 p-6 sm:p-10"
            style={{
              boxShadow:
                '0 0 80px 10px rgba(244,114,182,0.18), 0 0 160px 30px rgba(139,92,246,0.12), 0 25px 60px rgba(0,0,0,0.35)',
            }}
          >
            {/* Top flourish */}
            <div className="flex items-center justify-center gap-3 mb-6 opacity-60">
              <span className="h-px bg-amber-900/20 w-12 sm:w-20" />
              <Heart className="w-4 h-4 text-rose-400/70" strokeWidth={1.8} />
              <span className="text-stone-500 text-[10px] uppercase tracking-[0.35em]">two letters</span>
              <Heart className="w-4 h-4 text-violet-400/70" strokeWidth={1.8} />
              <span className="h-px bg-amber-900/20 w-12 sm:w-20" />
            </div>

            {/* Preamble */}
            <div className="text-center mb-8 space-y-3">
              {preamble.map((line, idx) => (
                <p
                  key={idx}
                  className="preamble-line text-stone-700 font-display text-sm sm:text-base italic leading-relaxed"
                  style={{ animationDelay: `${0.15 + idx * 0.55}s` }}
                >
                  {line}
                </p>
              ))}
            </div>

            {/* Two-column message reveal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 relative">
              {/* Center divider — visible on larger screens */}
              <div className="hidden sm:flex absolute top-0 bottom-0 left-1/2 -translate-x-1/2 items-center">
                <Heart className="w-5 h-5 text-rose-400/60 relative z-10" strokeWidth={1.8} fill="rgba(244,114,182,0.25)" />
              </div>

              {/* Message A — left column */}
              <div className="relative px-2 sm:pr-8">
                <div className="text-center mb-4">
                  <span className="preamble-line inline-block text-rose-500/70 text-[11px] uppercase tracking-[0.35em] font-display"
                        style={{ animationDelay: '0.1s' }}>
                    ♥ A
                  </span>
                </div>
                <div className="text-stone-800 font-display text-sm sm:text-[15px] leading-[1.9] whitespace-pre-wrap text-center min-h-[140px]">
                  {typedA}
                  {typingA && <span className="typewriter-cursor" style={{ height: '1.2em' }} />}
                </div>
              </div>

              {/* Message B — right column */}
              <div className="relative px-2 sm:pl-8 sm:border-l sm:border-stone-400/15">
                <div className="text-center mb-4">
                  <span className="preamble-line inline-block text-violet-500/70 text-[11px] uppercase tracking-[0.35em] font-display"
                        style={{ animationDelay: '0.3s' }}>
                    ♥ B
                  </span>
                </div>
                <div className="text-stone-800 font-display text-sm sm:text-[15px] leading-[1.9] whitespace-pre-wrap text-center min-h-[140px]">
                  {typedB}
                  {typingB && <span className="typewriter-cursor" style={{ height: '1.2em' }} />}
                </div>
              </div>
            </div>

            {/* Bottom flourish */}
            <div className="flex items-center justify-center gap-3 mt-10 opacity-60">
              <span className="h-px bg-amber-900/20 w-16" />
              <Heart className="w-4 h-4 text-rose-400/70" strokeWidth={1.8} />
              <span className="h-px bg-amber-900/20 w-16" />
            </div>

            {onDismiss && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={onDismiss}
                  disabled={isTyping}
                  className="text-stone-600 text-sm font-display hover:text-stone-900 px-6 py-3 rounded-xl hover:bg-stone-900/5 transition-colors disabled:opacity-40"
                >
                  {isTyping ? 'Still reading…' : 'Close these letters'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual envelope used in the couple ceremony. Two of these are
 * positioned on either side of the screen.
 */
function Envelope({
  side, variant, phase, lidOpen, sealBroken, letterOut,
}: {
  side: 'left' | 'right';
  variant: 'A' | 'B';
  phase: Phase;
  lidOpen: boolean;
  sealBroken: boolean;
  letterOut: boolean;
}) {
  // Position: far off-screen during drift, closer during meeting, overlapping in opening/revealed
  const [xPercent, yPercent] = (() => {
    if (phase === 'drifting') {
      return side === 'left' ? [-55, 8] : [105, -4];
    }
    if (phase === 'meeting') {
      return side === 'left' ? [-8, 4] : [12, -2];
    }
    // seal-glow / opening / revealed
    return side === 'left' ? [-2, 0] : [6, 0];
  })();

  const isRose = variant === 'A';

  return (
    <div
      className="absolute top-1/2 transition-all ease-out"
      style={{
        left: `${xPercent}%`,
        top: `${50 + yPercent}%`,
        transform: `translate(-50%, -50%) rotate(${side === 'left' ? -6 : 6}deg)`,
        transitionDuration: phase === 'drifting' ? '1500ms' : phase === 'meeting' ? '1400ms' : '900ms',
        transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.25, 1)',
        opacity: phase === 'revealed' ? 0 : 1,
        width: 'min(38vw, 340px)',
      }}
    >
      <div className="envelope-body relative mx-auto" style={{ height: 220 }}>
        <svg viewBox="0 0 340 220" className="w-full h-full"
             style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.45))' }}>
          <defs>
            <linearGradient id={`envPaper-${variant}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#faf1e2" />
              <stop offset="50%" stopColor="#f1e0c4" />
              <stop offset="100%" stopColor="#e3cfae" />
            </linearGradient>
            <linearGradient id={`envFlap-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff8e9" />
              <stop offset="100%" stopColor="#e3cfae" />
            </linearGradient>
            <radialGradient id={`waxG-${variant}`} cx="0.35" cy="0.35" r="0.7">
              <stop offset="0%" stopColor={isRose ? '#fca5a5' : '#c4b5fd'} />
              <stop offset="40%" stopColor={isRose ? '#ef4444' : '#8b5cf6'} />
              <stop offset="100%" stopColor={isRose ? '#7f1d1d' : '#4c1d95'} />
            </radialGradient>
          </defs>

          {/* Letter peeking out */}
          {letterOut && (
            <g style={{ animation: 'letter-slide-out 1.4s cubic-bezier(0.16,1,0.3,1) forwards' }}>
              <rect x="40" y="35" width="260" height="130" rx="4" fill="#fdf6ea" opacity="0.95" />
              <rect x="55" y="50" width="230" height="1" fill="#d7c2a0" opacity="0.5" />
              <rect x="55" y="70" width="220" height="1" fill="#d7c2a0" opacity="0.45" />
              <rect x="55" y="90" width="200" height="1" fill="#d7c2a0" opacity="0.4" />
              <rect x="55" y="110" width="210" height="1" fill="#d7c2a0" opacity="0.4" />
            </g>
          )}

          {/* Envelope body */}
          <rect x="10" y="10" width="320" height="200" rx="4" fill={`url(#envPaper-${variant})`} />

          {/* Left & right triangle "wings" */}
          <polygon points="10,10 170,110 170,210 10,210" fill="#e3cfae" opacity="0.5" />
          <polygon points="330,10 170,110 170,210 330,210" fill="#d9c3a2" opacity="0.6" />

          {/* Bottom fold */}
          <polygon points="10,210 170,110 330,210" fill="#c2a374" opacity="0.55" />

          {/* Decorative stitching */}
          <rect x="16" y="16" width="308" height="188" rx="3"
                fill="none" stroke="#a08050" strokeDasharray="3 4" strokeWidth="0.7" opacity="0.4" />

          {/* Flap */}
          <g
            className={`envelope-lid ${lidOpen ? 'is-open' : ''}`}
            style={{
              transformOrigin: '50% 10px',
              backfaceVisibility: 'hidden',
            }}
          >
            <polygon points="10,10 170,110 330,10" fill={`url(#envFlap-${variant})`} />
            <polygon points="10,10 170,110 170,80" fill="#ffffff" opacity="0.06" />
          </g>
        </svg>

        {/* Wax seal */}
        {!letterOut && (
          <button
            className={`wax-seal absolute left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center ${sealBroken ? 'is-broken' : ''}`}
            style={{
              top: '38%',
              width: 52, height: 52,
              background: `radial-gradient(circle at 35% 30%, ${isRose ? '#fca5a5' : '#c4b5fd'} 0%, ${isRose ? '#ef4444' : '#8b5cf6'} 40%, ${isRose ? '#7f1d1d' : '#4c1d95'} 100%)`,
              border: `1.5px solid ${isRose ? 'rgba(127,29,29,0.55)' : 'rgba(76,29,149,0.55)'}`,
              boxShadow: `0 0 24px 2px ${isRose ? 'rgba(244,63,94,0.5)' : 'rgba(139,92,246,0.5)'}`,
            }}
            aria-label={`Letter ${variant}`}
          >
            <Heart className="w-6 h-6 text-white/90" strokeWidth={2.2} fill="rgba(255,255,255,0.35)" />
          </button>
        )}

        {/* Small variant label */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.35em] font-display text-white/35">
          Letter {variant}
        </div>
      </div>
    </div>
  );
}
