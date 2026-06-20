import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';

interface CoupleCeremonyProps {
  messageA: string;
  messageB: string;
  sealedAt?: Date | null;
  unlockedAt?: Date | null;
  onDismiss?: () => void;
}

type Phase = 'drifting' | 'meeting' | 'opening' | 'revealed';

function buildPreamble(sealedAt?: Date | null, unlockedAt?: Date | null): string[] {
  const lines: string[] = [];
  if (sealedAt && unlockedAt) {
    const sealStr = sealedAt.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    lines.push(`On ${sealStr}, two hearts wrote two letters to one another.`);
    const diffMs = Math.max(0, unlockedAt.getTime() - sealedAt.getTime());
    const days = Math.round(diffMs / 86_400_000);
    if (days > 0) {
      lines.push(`Time held them close for ${days} ${days === 1 ? 'day' : 'days'} — now, at last, they open together.`);
    } else {
      lines.push(`Time held them close — now, at last, they open together.`);
    }
  } else {
    lines.push('Two hearts wrote two letters to one another.');
    lines.push('Time held them close — now, at last, they open together.');
  }
  lines.push(`\u201cOpen what the wait has kept.\u201d  — TimeVault`);
  return lines;
}

function makeParticles(n: number, palette: string[], base = 160) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2;
    const dist = base + (i % 6) * 28;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    return { tx, ty, color: palette[i % palette.length], delay: i * 0.025, key: i };
  });
}

export function CoupleCeremony({
  messageA, messageB, sealedAt, unlockedAt, onDismiss,
}: CoupleCeremonyProps) {
  const [phase, setPhase] = useState<Phase>('drifting');
  const [letterReady, setLetterReady] = useState(false);
  const [visibleA, setVisibleA] = useState(0);
  const [visibleB, setVisibleB] = useState(0);
  const [typingDone, setTypingDone] = useState(false);
  const preambleRef = useRef<string[]>(buildPreamble(sealedAt, unlockedAt));
  const timeoutsRef = useRef<number[]>([]);
  const intervalRef = useRef<[number | null, number | null]>([null, null]);
  const mountedOnceRef = useRef(false);

  const addTimeout = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeoutsRef.current.push(id);
  };

  useEffect(() => {
    if (mountedOnceRef.current) return;
    mountedOnceRef.current = true;

    const startRevealAt = 1200 + 1400 + 1400;
    const maxLen = Math.max(messageA.length, messageB.length);
    const typingMs = Math.max(1400, Math.min(6500, Math.ceil(maxLen / 30) * 1000));

    addTimeout(() => setPhase('meeting'), 1200);
    addTimeout(() => setPhase('opening'), 1200 + 1400);
    addTimeout(() => { setPhase('revealed'); setLetterReady(true); }, startRevealAt);

    const perCharA = Math.max(20, Math.round(typingMs / Math.max(messageA.length, 1)));
    const perCharB = Math.max(20, Math.round(typingMs / Math.max(messageB.length, 1)));

    const startInterval = (
      idx: 0 | 1,
      msgLen: number,
      perChar: number,
      setter: (n: number) => void,
    ) => {
      let chars = 0;
      intervalRef.current[idx] = window.setInterval(() => {
        chars += Math.max(1, Math.ceil(msgLen / 120));
        if (chars >= msgLen) {
          chars = msgLen;
          const id = intervalRef.current[idx];
          if (id !== null) { clearInterval(id); intervalRef.current[idx] = null; }
          if (idx === 1) setTypingDone(true);
        }
        setter(chars);
      }, perChar);
    };

    addTimeout(() => {
      startInterval(0, messageA.length, perCharA, setVisibleA);
      startInterval(1, messageB.length, perCharB, setVisibleB);
    }, startRevealAt);

    return () => {
      intervalRef.current.forEach((id) => { if (id !== null) clearInterval(id); });
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, [messageA.length, messageB.length]);

  const palette = ['#f472b6', '#c084fc', '#fbbf24', '#60a5fa', '#fca5a5', '#a78bfa', '#fcd34d'];

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 120% 90% at 50% 50%, rgba(20, 10, 40, 0.97) 0%, rgba(8, 5, 20, 0.99) 60%, #02010a 100%)',
        backdropFilter: 'blur(6px)',
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-20%', left: '-10%', width: '120%', height: '140%',
          background:
            'radial-gradient(circle 300px at 20% 30%, rgba(244,114,182,0.18), transparent 60%),' +
            'radial-gradient(circle 400px at 80% 70%, rgba(139,92,246,0.15), transparent 60%)',
        }}
      />

      <div className="relative w-full h-full flex items-center justify-center px-4 sm:px-6">
        {phase !== 'revealed' && (
          <div className="relative flex items-center justify-center w-full max-w-4xl" style={{ minHeight: 420 }}>
            <CoupleEnvelope side="left" label="A" phase={phase} particles={makeParticles(9, palette)} color="#f472b6" />
            <div
              className="absolute left-1/2 top-1/2 pointer-events-none"
              style={{
                transform: 'translate(-50%, -50%)',
                opacity: phase === 'meeting' || phase === 'opening' ? 1 : 0,
                transition: 'opacity 1200ms cubic-bezier(0.2, 0.8, 0.25, 1)',
              }}
            >
              <div style={{ transform: `scale(${phase === 'meeting' || phase === 'opening' ? 1.3 : 0.7})`, transition: 'transform 1200ms cubic-bezier(0.2, 0.8, 0.25, 1)' }}>
                <Heart
                  strokeWidth={1.8}
                  style={{
                    width: 64,
                    height: 64,
                    color: '#f472b6',
                    filter: 'drop-shadow(0 0 28px rgba(244,114,182,0.7))',
                    fill: 'rgba(244,114,182,0.32)',
                  }}
                />
              </div>
            </div>
            <CoupleEnvelope side="right" label="B" phase={phase} particles={makeParticles(9, palette, 150)} color="#c084fc" />
          </div>
        )}

        {phase === 'revealed' && (
          <div
            className={`ceremony-letter w-full parchment rounded-2xl border border-amber-900/10 px-6 sm:px-10 py-8 sm:py-12 transition-all duration-[1200ms] ${letterReady ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            style={{
              maxWidth: 1100,
              maxHeight: '86vh',
              overflowY: 'auto',
              boxShadow:
                '0 0 80px 10px rgba(244,114,182,0.18), 0 0 160px 30px rgba(139,92,246,0.12), 0 25px 60px rgba(0,0,0,0.45)',
              animation: 'letter-bloom 1.6s ease-out forwards',
            }}
          >
            <div className="flex items-center justify-center gap-3 mb-8 opacity-60">
              <span className="h-px bg-rose-400/40 w-10 sm:w-20" />
              <Heart className="w-5 h-5 text-rose-400/80" strokeWidth={1.8} fill="rgba(244,63,94,0.28)" />
              <span className="text-stone-500 text-[10px] sm:text-xs uppercase tracking-[0.4em] font-display">two letters</span>
              <Heart className="w-5 h-5 text-violet-400/80" strokeWidth={1.8} fill="rgba(139,92,246,0.28)" />
              <span className="h-px bg-violet-400/40 w-10 sm:w-20" />
            </div>

            <div className="text-center mb-10 space-y-4">
              {preambleRef.current.map((line, idx) => (
                <p
                  key={idx}
                  className="preamble-line text-stone-700 font-display text-sm sm:text-base italic leading-relaxed"
                  style={{ animationDelay: `${0.2 + idx * 0.6}s` }}
                >
                  {line}
                </p>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 mb-10 opacity-50">
              <span className="h-px bg-stone-500/40 w-20 sm:w-32" />
              <span className="text-stone-500 text-[10px] sm:text-xs uppercase tracking-[0.4em] font-display">your words</span>
              <span className="h-px bg-stone-500/40 w-20 sm:w-32" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 relative">
              <div className="relative px-2 sm:pr-8 sm:border-r sm:border-stone-400/20">
                <div className="text-center mb-5">
                  <span className="inline-block text-rose-500/80 text-[11px] sm:text-xs uppercase tracking-[0.4em] font-display">♥ A</span>
                </div>
                <div className="text-stone-800 font-display text-sm sm:text-[15px] leading-[1.95] whitespace-pre-wrap text-center min-h-[160px]">
                  {messageA.slice(0, visibleA)}
                </div>
              </div>
              <div className="relative px-2 sm:pl-8">
                <div className="text-center mb-5">
                  <span className="inline-block text-violet-500/80 text-[11px] sm:text-xs uppercase tracking-[0.4em] font-display">♥ B</span>
                </div>
                <div className="text-stone-800 font-display text-sm sm:text-[15px] leading-[1.95] whitespace-pre-wrap text-center min-h-[160px]">
                  {messageB.slice(0, visibleB)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mt-12 opacity-60">
              <span className="h-px bg-amber-900/30 w-16 sm:w-24" />
              <Heart className="w-5 h-5 text-rose-500/80" strokeWidth={1.8} fill="rgba(244,63,94,0.28)" />
              <span className="h-px bg-amber-900/30 w-16 sm:w-24" />
            </div>

            {onDismiss && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={onDismiss}
                  disabled={!typingDone}
                  className="text-stone-600 text-sm font-display hover:text-stone-900 px-8 py-3 rounded-xl hover:bg-stone-900/[0.05] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {typingDone ? 'Close these letters' : 'Still reading…'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface CoupleEnvelopeProps {
  side: 'left' | 'right';
  label: 'A' | 'B';
  phase: Phase;
  particles: { tx: number; ty: number; color: string; delay: number; key: number }[];
  color: string;
}

function CoupleEnvelope({ side, label, phase, particles, color }: CoupleEnvelopeProps) {
  let offset = 0;
  if (phase === 'drifting') {
    offset = side === 'left' ? -48 : 58;
  } else if (phase === 'meeting') {
    offset = side === 'left' ? -6 : 10;
  } else {
    offset = side === 'left' ? -4 : 4;
  }
  const rot = side === 'left' ? -5 : 5;

  const paperId = `env-paper-${side}-${label}`;
  const flapId = `env-flap-${side}-${label}`;
  const waxId = `env-wax-${side}-${label}`;
  const letterId = `env-letter-${side}-${label}`;
  const waxTop = side === 'left' ? '#fca5a5' : '#c4b5fd';
  const waxDark = side === 'left' ? '#7f1d1d' : '#4c1d95';

  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: 'min(38vw, 340px)',
        transform: `translate(${offset}vw, 0) rotate(${rot}deg)`,
        transition:
          phase === 'drifting'
            ? 'transform 1200ms cubic-bezier(0.2, 0.8, 0.25, 1)'
            : phase === 'meeting'
            ? 'transform 1400ms cubic-bezier(0.2, 0.8, 0.25, 1)'
            : 'transform 900ms ease-out',
        position: 'relative',
      }}
    >
      <div
        className="envelope-body relative mx-auto"
        style={{
          height: 220,
          animation: 'envelope-float 4.5s ease-in-out infinite',
        }}
      >
        <svg viewBox="0 0 340 220" className="w-full h-full" style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.45))' }}>
          <defs>
            <linearGradient id={paperId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fdf4e0" />
              <stop offset="50%" stopColor="#f5e3c6" />
              <stop offset="100%" stopColor="#e6cfae" />
            </linearGradient>
            <linearGradient id={flapId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fffaea" />
              <stop offset="100%" stopColor="#e6cfae" />
            </linearGradient>
            <radialGradient id={waxId} cx="0.35" cy="0.35" r="0.75">
              <stop offset="0%" stopColor={waxTop} />
              <stop offset="40%" stopColor={color} />
              <stop offset="100%" stopColor={waxDark} />
            </radialGradient>
            <radialGradient id={letterId} cx="0.5" cy="0.3" r="0.8">
              <stop offset="0%" stopColor="#fffdf6" />
              <stop offset="100%" stopColor="#f5e6c8" />
            </radialGradient>
          </defs>

          <rect x="10" y="10" width="320" height="200" rx="6" fill={`url(#${paperId})`} />
          <polygon points="10,10 170,110 170,210 10,210" fill="#e6cfae" opacity="0.5" />
          <polygon points="330,10 170,110 170,210 330,210" fill="#d9be98" opacity="0.6" />
          <polygon points="10,210 170,110 330,210" fill="#b08c63" opacity="0.7" />
          <rect x="18" y="18" width="304" height="184" rx="4" fill="none" stroke="#a08050" strokeDasharray="3 5" strokeWidth="0.7" opacity="0.5" />

          {phase === 'opening' && (
            <g className="envelope-paper">
              <rect x="40" y="35" width="260" height="130" rx="4" fill={`url(#${letterId})`} />
              <rect x="55" y="55" width="230" height="1" fill="#c9a97a" opacity="0.5" />
              <rect x="55" y="75" width="220" height="1" fill="#c9a97a" opacity="0.45" />
              <rect x="55" y="95" width="200" height="1" fill="#c9a97a" opacity="0.4" />
              <rect x="55" y="115" width="210" height="1" fill="#c9a97a" opacity="0.4" />
            </g>
          )}

          <g className={`envelope-flap ${phase === 'opening' ? 'is-open' : ''}`} style={{ transformOrigin: '50% 10px' }}>
            <polygon points="10,10 170,110 330,10" fill={`url(#${flapId})`} />
            <polygon points="10,10 170,110 170,80" fill="#ffffff" opacity="0.07" />
          </g>
        </svg>

        {phase !== 'opening' && (
          <div
            className="wax-seal absolute left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center"
            style={{
              top: '38%',
              width: 52,
              height: 52,
              background: `radial-gradient(circle at 35% 30%, ${waxTop} 0%, ${color} 35%, ${waxDark} 100%)`,
              border: `1.5px solid ${side === 'left' ? 'rgba(127,29,29,0.55)' : 'rgba(76,29,149,0.55)'}`,
              boxShadow: side === 'left' ? '0 0 24px 2px rgba(244,63,94,0.5)' : '0 0 24px 2px rgba(139,92,246,0.5)',
            }}
          >
            <Heart className="w-6 h-6 text-white/90" strokeWidth={2.2} fill="rgba(255,255,255,0.35)" />
          </div>
        )}

        {phase === 'opening' && (
          <div className="absolute left-1/2 top-[44%] -translate-x-1/2 pointer-events-none" style={{ width: 1, height: 1 }}>
            {particles.map((p) => (
              <span
                key={p.key}
                className="ceremony-particle"
                style={{
                  ['--tx' as string]: `${p.tx}px`,
                  ['--ty' as string]: `${p.ty}px`,
                  background: p.color,
                  boxShadow: `0 0 14px 3px ${p.color}`,
                  animationDelay: `${p.delay}s`,
                  left: 0, top: 0,
                }}
              />
            ))}
          </div>
        )}

        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.35em] font-display text-white/40 text-center whitespace-nowrap">
          Letter {label}
        </div>
      </div>
    </div>
  );
}
