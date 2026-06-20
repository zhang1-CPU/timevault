import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';

interface RevealCeremonyProps {
  message: string;
  sealedAt?: Date | null;
  unlockedAt?: Date | null;
  onDismiss?: () => void;
}

type Phase = 'fly-in' | 'waiting' | 'opening' | 'revealed';

// ─── 浪漫品牌文案 ──────────────────────────────────
function buildPreamble(messageLen: number, sealedAt?: Date | null, unlockedAt?: Date | null): string[] {
  const un = unlockedAt;
  const seal = sealedAt;

  const lines: string[] = [];
  if (seal) {
    const sealStr = seal.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    lines.push(`Sealed on ${sealStr} — a message kept safe by time.`);

    if (un) {
      const diffMs = Math.max(0, un.getTime() - seal.getTime());
      const days = Math.round(diffMs / 86_400_000);
      const hours = Math.round(diffMs / 3_600_000);
      if (days >= 1) {
        lines.push(`After ${days} ${days === 1 ? 'day' : 'days'} of patient waiting, your letter is ready to be read.`);
      } else if (hours >= 1) {
        lines.push(`After ${hours} ${hours === 1 ? 'hour' : 'hours'} of patient waiting, your letter is ready to be read.`);
      } else {
        lines.push(`After a short wait, your letter is ready to be read.`);
      }
    }
  } else {
    const intro = [
      `A secret kept by time, now ready to be read.`,
      `Time has come to open what you have kept.`,
      `The wait is over. A letter from your past is here.`,
    ];
    lines.push(intro[Math.floor(Math.random() * intro.length)]);
  }

  lines.push(`\u201cOpen what the wait has kept.\u201d  — TimeVault`);
  void messageLen;
  return lines;
}

/**
 * 浪漫信封 + 信纸展示仪式。
 *
 * 设计要点：
 * 1. 最外层 `fixed inset-0` + 高 z-index + 不透光背景遮罩，彻底隔离页面其他内容
 * 2. 用单一 `phase` 状态 + CSS className 切换驱动动画阶段，避免 React StrictMode 下动画时序错乱
 * 3. 打字机效果改用 "显示遮罩宽度动画" 而非逐字符 setState，避免中文长文本跳动
 */
export function RevealCeremony({
  message, sealedAt, unlockedAt, onDismiss,
}: RevealCeremonyProps) {
  const [phase, setPhase] = useState<Phase>('fly-in');
  const [showPrompt, setShowPrompt] = useState(false);
  const [letterReady, setLetterReady] = useState(false);
  const [typingDone, setTypingDone] = useState(false);
  const [visibleChars, setVisibleChars] = useState(0);
  const preambleRef = useRef<string[]>(buildPreamble(message.length, sealedAt, unlockedAt));
  const timeoutsRef = useRef<number[]>([]);
  const intervalRef = useRef<number | null>(null);
  const mountedOnceRef = useRef(false);

  // 注册一个 timeout，自动纳入清理
  const addTimeout = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeoutsRef.current.push(id);
  };

  // 主时序控制 —— 通过 mountedOnceRef 防止 StrictMode 下 double-mount 导致的时序错乱
  useEffect(() => {
    if (mountedOnceRef.current) return;
    mountedOnceRef.current = true;

    // Phase 1: fly-in (信封飞入) → ~900ms
    // Phase 2: waiting (信封悬停, 出现提示) → ~1200ms (用户可点击蜡封提前开启)
    // Phase 3: opening (蜡封爆开 + 盖子翻起 + 信纸滑出) → ~1400ms
    // Phase 4: revealed (信纸展开 + 打字机)

    const startTypingAt = 900 + 1200 + 1400;
    const typingMs = Math.max(1200, Math.min(6000, Math.ceil(message.length / 30) * 1000));

    addTimeout(() => { setPhase('waiting'); setShowPrompt(true); }, 900);
    addTimeout(() => { setPhase('opening'); setShowPrompt(false); }, 900 + 1200);
    addTimeout(() => { setPhase('revealed'); setLetterReady(true); }, startTypingAt);

    // 打字机 interval
    const perChar = Math.max(20, Math.round(typingMs / message.length));
    addTimeout(() => {
      let chars = 0;
      intervalRef.current = window.setInterval(() => {
        chars += Math.max(1, Math.ceil(message.length / 120));
        if (chars >= message.length) {
          chars = message.length;
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setTypingDone(true);
        }
        setVisibleChars(chars);
      }, perChar);
    }, startTypingAt);

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, [message.length]);

  // 用户点击蜡封也能立刻进入 opening
  const handleSealClick = () => {
    if (phase !== 'waiting') return;
    // 清理所有 waiting → opening 的定时器
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];

    setShowPrompt(false);
    setPhase('opening');

    const typingMs = Math.max(1200, Math.min(6000, Math.ceil(message.length / 30) * 1000));
    const perChar = Math.max(20, Math.round(typingMs / message.length));

    addTimeout(() => { setPhase('revealed'); setLetterReady(true); }, 1500);

    addTimeout(() => {
      let chars = 0;
      intervalRef.current = window.setInterval(() => {
        chars += Math.max(1, Math.ceil(message.length / 120));
        if (chars >= message.length) {
          chars = message.length;
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setTypingDone(true);
        }
        setVisibleChars(chars);
      }, perChar);
    }, 1500);
  };

  const preamble = preambleRef.current;

  // 12 颗彩色粒子 —— 蜡封爆开时向外辐射
  const particles = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2;
    const dist = 140 + (i % 5) * 25;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist - 10;
    const palette = ['#f472b6', '#c084fc', '#fbbf24', '#60a5fa', '#fca5a5', '#a78bfa'];
    return { tx, ty, color: palette[i % palette.length], delay: i * 0.025, key: i };
  });

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
      {/* 装饰性柔光斑 */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-20%', left: '-10%', width: '120%', height: '140%',
          background:
            'radial-gradient(circle 300px at 20% 30%, rgba(244,114,182,0.18), transparent 60%),' +
            'radial-gradient(circle 400px at 80% 70%, rgba(139,92,246,0.15), transparent 60%)',
        }}
      />

      <div className="envelope-stage relative w-full h-full flex items-center justify-center px-4 sm:px-6">
        {/* ── Stage 1-3: 信封阶段 ── */}
        {phase !== 'revealed' && (
          <div className="relative flex flex-col items-center">
            <div
              className="relative transition-transform ease-out"
              style={{
                width: 'min(92vw, 520px)',
                transitionDuration: '400ms',
              }}
            >
              {/* 信封主体 + 蜡封 */}
              <div
                className="envelope-body relative mx-auto"
                style={{
                  height: 340,
                  // fly-in 900ms，然后进入 float 循环（float 从 900ms 开始）
                  animation:
                    phase === 'fly-in'
                      ? 'envelope-fly-in 900ms cubic-bezier(0.2, 0.8, 0.25, 1) forwards'
                      : 'envelope-float 4.5s ease-in-out infinite',
                }}
              >
                <svg
                  viewBox="0 0 520 340"
                  className="w-full h-full"
                  style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.55))' }}
                >
                  <defs>
                    <linearGradient id="envPaper" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fdf4e0" />
                      <stop offset="50%" stopColor="#f5e3c6" />
                      <stop offset="100%" stopColor="#e6cfae" />
                    </linearGradient>
                    <linearGradient id="envPaperDark" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#d9be98" />
                      <stop offset="100%" stopColor="#a88863" />
                    </linearGradient>
                    <linearGradient id="envFlap" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fffaea" />
                      <stop offset="100%" stopColor="#e6cfae" />
                    </linearGradient>
                    <radialGradient id="waxGrad" cx="0.35" cy="0.35" r="0.75">
                      <stop offset="0%" stopColor="#fca5a5" />
                      <stop offset="40%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#7f1d1d" />
                    </radialGradient>
                    <radialGradient id="letterPaper" cx="0.5" cy="0.3" r="0.8">
                      <stop offset="0%" stopColor="#fffdf6" />
                      <stop offset="100%" stopColor="#f5e6c8" />
                    </radialGradient>
                  </defs>

                  {/* 信封面 (底层) */}
                  <rect x="20" y="20" width="480" height="300" rx="10" fill="url(#envPaper)" />
                  {/* 左右三角侧翼 — 柔和填充, 不添加多余描边 */}
                  <polygon points="20,20 260,170 260,320 20,320" fill="url(#envPaperDark)" opacity="0.45" />
                  <polygon points="500,20 260,170 260,320 500,320" fill="url(#envPaperDark)" opacity="0.55" />
                  {/* 底部折痕（最前方，最暗） */}
                  <polygon points="20,320 260,170 500,320" fill="#a88863" opacity="0.8" />

                  {/* 信纸 (只在 opening 阶段滑出) */}
                  {phase === 'opening' && (
                    <g className="envelope-paper">
                      <rect x="70" y="55" width="380" height="210" rx="6" fill="url(#letterPaper)" />
                      <line x1="85" y1="80" x2="435" y2="80" stroke="#c9a97a" strokeWidth="0.5" opacity="0.4" />
                      <line x1="85" y1="105" x2="435" y2="105" stroke="#c9a97a" strokeWidth="0.5" opacity="0.35" />
                      <line x1="85" y1="130" x2="435" y2="130" stroke="#c9a97a" strokeWidth="0.5" opacity="0.3" />
                      <line x1="85" y1="155" x2="435" y2="155" stroke="#c9a97a" strokeWidth="0.5" opacity="0.28" />
                      <line x1="85" y1="180" x2="435" y2="180" stroke="#c9a97a" strokeWidth="0.5" opacity="0.25" />
                      <line x1="85" y1="205" x2="435" y2="205" stroke="#c9a97a" strokeWidth="0.5" opacity="0.22" />
                    </g>
                  )}

                  {/* 盖子（最上层，带翻转动画）— 3D perspective 由 .envelope-stage 提供 */}
                  <g className={`envelope-flap ${phase === 'opening' ? 'is-open' : ''}`}
                     style={{ transformOrigin: '50% 20px' }}>
                    <polygon points="20,20 260,170 500,20" fill="url(#envFlap)" />
                    <polygon points="20,20 260,170 260,130" fill="#ffffff" opacity="0.06" />
                  </g>
                </svg>

                {/* 蜡封 (HTML 圆形按钮，SVG 内无法带交互) */}
                {phase !== 'opening' && (
                  <button
                    onClick={handleSealClick}
                    className="wax-seal absolute left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center focus:outline-none"
                    style={{
                      top: '42%',
                      width: 86, height: 86,
                      background:
                        'radial-gradient(circle at 35% 30%, #fca5a5 0%, #ef4444 35%, #7f1d1d 100%)',
                      border: '2px solid rgba(127,29,29,0.55)',
                      boxShadow: '0 0 30px 3px rgba(244,63,94,0.45)',
                      cursor: phase === 'waiting' ? 'pointer' : 'default',
                    }}
                    aria-label="Open the letter"
                    title="Tap the seal to open"
                  >
                    <Heart className="w-9 h-9 text-white/90" strokeWidth={2.2} fill="rgba(255,255,255,0.38)" />
                  </button>
                )}

                {/* 蜡封爆开的粒子 */}
                {phase === 'opening' && (
                  <div className="absolute left-1/2 top-[44%] -translate-x-1/2 pointer-events-none" style={{ width: 1, height: 1 }}>
                    {particles.map((p) => (
                      <span
                        key={p.key}
                        className="ceremony-particle"
                        style={{
                          ['--tx' as any]: `${p.tx}px`,
                          ['--ty' as any]: `${p.ty}px`,
                          background: p.color,
                          boxShadow: `0 0 14px 3px ${p.color}`,
                          animationDelay: `${p.delay}s`,
                          left: 0, top: 0,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 下方提示 */}
            {showPrompt && (
              <div className="reveal-prompt mt-10 text-center">
                <p className="text-white/55 text-base sm:text-lg font-display tracking-wide">
                  {phase === 'waiting' ? 'Tap the heart to open' : ''}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Stage 4: 信纸展开 ── */}
        {phase === 'revealed' && (
          <div
            className={`ceremony-letter w-full parchment rounded-2xl px-6 sm:px-14 py-10 sm:py-14 border border-amber-900/10 transition-all duration-[1200ms] ${letterReady ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            style={{
              maxWidth: 780,
              maxHeight: '86vh',
              overflowY: 'auto',
              boxShadow:
                '0 0 80px 10px rgba(244,114,182,0.18), 0 0 160px 30px rgba(139,92,246,0.12), 0 25px 60px rgba(0,0,0,0.45)',
              animation: 'letter-bloom 1.6s ease-out forwards',
            }}
          >
            {/* 顶部装饰 */}
            <div className="flex items-center justify-center gap-3 mb-8 opacity-60">
              <span className="h-px bg-amber-900/30 w-16 sm:w-24" />
              <Heart className="w-5 h-5 text-rose-500/70" strokeWidth={1.8} fill="rgba(244,63,94,0.28)" />
              <span className="h-px bg-amber-900/30 w-16 sm:w-24" />
            </div>

            {/* 开场白 */}
            <div className="text-center mb-10 space-y-4">
              {preamble.map((line, idx) => (
                <p
                  key={idx}
                  className="preamble-line text-stone-700 font-display text-sm sm:text-base italic leading-relaxed"
                  style={{ animationDelay: `${0.2 + idx * 0.6}s` }}
                >
                  {line}
                </p>
              ))}
            </div>

            {/* 分隔线 */}
            <div className="flex items-center justify-center gap-3 mb-10 opacity-50">
              <span className="h-px bg-stone-500/40 w-20 sm:w-32" />
              <span className="text-stone-500 text-[10px] sm:text-xs uppercase tracking-[0.4em] font-display">
                your words
              </span>
              <span className="h-px bg-stone-500/40 w-20 sm:w-32" />
            </div>

            {/* 消息 —— 逐字符切片显示 */}
            <div className="relative text-stone-800 font-display text-base sm:text-lg leading-[1.95] whitespace-pre-wrap text-center px-1 sm:px-4 min-h-[120px]">
              <span className="block">{message.slice(0, visibleChars)}</span>
            </div>

            {/* 底部装饰 */}
            <div className="flex items-center justify-center gap-3 mt-14 opacity-60">
              <span className="h-px bg-amber-900/30 w-16 sm:w-24" />
              <Heart className="w-5 h-5 text-rose-500/70" strokeWidth={1.8} fill="rgba(244,63,94,0.28)" />
              <span className="h-px bg-amber-900/30 w-16 sm:w-24" />
            </div>

            {/* Dismiss 按钮 */}
            {onDismiss && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={onDismiss}
                  disabled={!typingDone}
                  className="text-stone-600 text-sm font-display hover:text-stone-900 px-8 py-3 rounded-xl hover:bg-stone-900/[0.05] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {typingDone ? 'Close this letter' : 'Still reading…'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
