import { Lock, Unlock, Heart, Sparkles, ChevronDown, Camera, MessageSquare, Clock } from 'lucide-react';

interface HeroSectionProps {
  onEncrypt: () => void;
  onDecrypt: () => void;
  onCouple: () => void;
}

export function HeroSection({ onEncrypt, onDecrypt, onCouple }: HeroSectionProps) {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 relative overflow-hidden pt-12 pb-20">
      {/* Floating hearts & sparkles */}
      <FloatingDecor />

      {/* Ambient glow halo behind logo — stronger now */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full pointer-events-none"
           style={{
             background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, rgba(168,85,247,0.08) 30%, transparent 70%)',
             animation: 'logo-halo 8s ease-in-out infinite',
           }}
      />

      <div className="text-center max-w-4xl mx-auto relative z-10">
        {/* ─── 沙漏 Logo（重写：纯 CSS 动画，100% 可预测） ─── */}
        <div className="mb-8 sm:mb-10">
          <div className="relative inline-flex items-center justify-center">
            {/* Outer rotating decorative ring */}
            <div
              className="absolute border border-dashed rounded-full pointer-events-none"
              style={{
                width: '160%',
                height: '160%',
                left: '-30%',
                top: '-30%',
                borderColor: 'rgba(255, 182, 193, 0.15)',
                animation: 'ring-spin 18s linear infinite',
              }}
            />

            {/* Glow background */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle, rgba(236,72,153,0.22) 0%, rgba(168,85,247,0.15) 40%, transparent 70%)',
                animation: 'pulse-glow 4s ease-in-out infinite',
                filter: 'blur(20px)',
              }}
            />

            {/* Logo glass container */}
            <div
              className="relative w-24 h-28 sm:w-28 sm:h-32 md:w-32 md:h-36 rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                border: '1px solid rgba(255,182,193,0.18)',
                boxShadow: '0 0 90px rgba(236,72,153,0.28), 0 0 160px rgba(168,85,247,0.18), inset 0 1px 0 rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                animation: 'logo-breathe 5s ease-in-out infinite',
              }}
            >
              {/* The hourglass SVG — refined shape, CSS animated */}
              <svg viewBox="0 0 100 120" className="w-16 h-20 sm:w-20 sm:h-24 md:w-22 md:h-28" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="hGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffc1d4" stopOpacity="1" />
                    <stop offset="50%" stopColor="#e0b0ff" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#b0a8ff" stopOpacity="0.9" />
                  </linearGradient>

                  <linearGradient id="hSandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffd700" stopOpacity="0.95" />
                    <stop offset="40%" stopColor="#ff9f6b" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0.9" />
                  </linearGradient>

                  <linearGradient id="hGlassShine" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                    <stop offset="30%" stopColor="#ffffff" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>

                  <radialGradient id="hGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Ambient glow circle */}
                <circle cx="50" cy="60" r="48" fill="url(#hGlow)">
                  <animate attributeName="r" values="46;52;46" dur="4s" repeatCount="indefinite" />
                </circle>

                {/* Top cap */}
                <rect x="14" y="10" width="72" height="5" rx="1.5" fill="url(#hGlassGrad)" opacity="0.95" />
                {/* Bottom cap */}
                <rect x="14" y="105" width="72" height="5" rx="1.5" fill="url(#hGlassGrad)" opacity="0.95" />

                {/* Glass outline — elegant curved hourglass */}
                <path
                  d="M 16 15
                     L 84 15
                     Q 82 28 68 45
                     Q 56 54 54 58
                     Q 52 60 54 62
                     Q 58 66 68 75
                     Q 82 92 84 105
                     L 16 105
                     Q 18 92 32 75
                     Q 44 66 46 62
                     Q 48 60 46 58
                     Q 42 54 32 45
                     Q 18 28 16 15 Z"
                  fill="url(#hGlassShine)"
                  stroke="url(#hGlassGrad)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  opacity="0.9"
                />

                {/* Top sand pile — CSS animation: shrinks over time */}
                <path
                  d="M 22 18 L 78 18 Q 64 38 54 55 Q 50 58 46 55 Q 36 38 22 18 Z"
                  fill="url(#hSandGrad)"
                  style={{
                    transformOrigin: '50px 58px',
                    animation: 'sand-top 5s ease-in-out infinite',
                  }}
                />

                {/* Bottom sand pile — CSS animation: grows over time */}
                <path
                  d="M 30 88 Q 50 82 70 88 L 80 102 L 20 102 Z"
                  fill="url(#hSandGrad)"
                  opacity="0.85"
                  style={{
                    transformOrigin: '50px 90px',
                    animation: 'sand-bottom 5s ease-in-out infinite',
                  }}
                />

                {/* Narrow neck sand stream */}
                <rect x="49.2" y="58" width="1.6" height="28" fill="url(#hSandGrad)" opacity="0.85">
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="0.8s" repeatCount="indefinite" />
                </rect>

                {/* Falling sand grains — individual animated circles */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <circle key={i} cx="50" cy={62 + i * 2} r="0.8" fill="#ffd700">
                    <animate
                      attributeName="cy"
                      values={`${60};${82}`}
                      dur={`${0.9 + i * 0.15}s`}
                      begin={`${i * 0.18}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;0"
                      dur={`${0.9 + i * 0.15}s`}
                      begin={`${i * 0.18}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                ))}

                {/* Sparkle decorations at corners */}
                <circle cx="20" cy="12.5" r="1.5" fill="#ffb3d0">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="80" cy="12.5" r="1.2" fill="#c8a2ff">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="80" cy="107.5" r="1.5" fill="#ffd700">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="20" cy="107.5" r="1.2" fill="#ec4899">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="1.6s" repeatCount="indefinite" />
                </circle>

                {/* Two extra sparkles on sides */}
                <circle cx="8" cy="60" r="1.3" fill="#ffd700">
                  <animate attributeName="opacity" values="0;0.9;0" dur="1.2s" repeatCount="indefinite" />
                </circle>
                <circle cx="92" cy="60" r="1.1" fill="#ec4899">
                  <animate attributeName="opacity" values="0;0.9;0" dur="1.5s" begin="0.6s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
          </div>
        </div>

        {/* ─── Brand name ─── */}
        <div className="mb-5 sm:mb-8" style={{ animation: 'fade-in-up 0.8s ease-out 0.2s forwards', opacity: 0 }}>
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[9rem] font-serif leading-none tracking-tight">
            <span className="gradient-text inline-block">TimeVault</span>
          </h1>
        </div>

        {/* ─── Tagline ─── */}
        <div className="mb-3 sm:mb-5" style={{ animation: 'fade-in-up 0.8s ease-out 0.4s forwards', opacity: 0 }}>
          <p className="text-2xl sm:text-3xl md:text-4xl text-white/55 font-serif italic leading-snug">
            Write a letter to tomorrow.
          </p>
        </div>

        {/* Secondary romantic line */}
        <div className="mb-9 sm:mb-12" style={{ animation: 'fade-in-up 0.8s ease-out 0.5s forwards', opacity: 0 }}>
          <p className="text-white/40 text-sm sm:text-base max-w-xl mx-auto font-light leading-relaxed">
            Seal a secret inside a photo. Choose the moment it opens.<br className="hidden sm:block" />
            We store nothing. Your photo is the vault.
          </p>
        </div>

        {/* ─── CTA Buttons ─── */}
        <div className="space-y-5 mb-12 sm:mb-16" style={{ animation: 'fade-in-up 0.8s ease-out 0.7s forwards', opacity: 0 }}>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={onEncrypt}
              className="group relative px-8 sm:px-12 py-4.5 sm:py-5 rounded-2xl text-white font-medium text-base sm:text-lg overflow-hidden transition-all duration-500 min-h-[58px] sm:min-h-[62px] active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #e11d48 0%, #d946ef 50%, #6366f1 100%)',
                boxShadow: '0 0 80px rgba(219,39,119,0.3)',
                animation: 'cta-glow 4s ease-in-out infinite',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 120px rgba(219,39,119,0.55)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 80px rgba(219,39,119,0.3)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2.5">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:rotate-12" />
                Seal a Message
              </span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                   style={{ background: 'linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)' }} />
            </button>

            <button
              onClick={onDecrypt}
              className="group px-8 sm:px-12 py-4.5 sm:py-5 border border-white/[0.15] rounded-2xl text-white/60 font-medium text-base sm:text-lg hover:bg-white/[0.05] hover:border-white/30 hover:text-white/90 transition-all duration-300 flex items-center justify-center gap-2.5 min-h-[58px] sm:min-h-[62px] backdrop-blur-sm"
            >
              <Unlock className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:-rotate-12" />
              Unlock a Message
            </button>
          </div>

          {/* Couple Mode — highlighted */}
          <div className="flex justify-center pt-3">
            <button
              onClick={onCouple}
              className="group relative flex items-center gap-4 px-8 sm:px-10 py-4.5 sm:py-5 rounded-full border-2 text-white font-medium text-base sm:text-lg transition-all duration-500 min-h-[56px] sm:min-h-[60px] active:scale-[0.97]"
              style={{
                borderColor: 'rgba(236,72,153,0.45)',
                background: 'linear-gradient(135deg, rgba(219,39,119,0.28) 0%, rgba(168,85,247,0.25) 50%, rgba(236,72,153,0.28) 100%)',
                boxShadow: '0 0 70px rgba(219,39,119,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 110px rgba(219,39,119,0.6), inset 0 1px 0 rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.75)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 70px rgba(219,39,119,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.45)'; }}
            >
              <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-rose-200 fill-rose-400/80" style={{ animation: 'heart-bob 1.8s ease-in-out infinite' }} />
              <span className="text-white/95 font-serif">Couple Mode — Two Hearts, One Time</span>
              <span
                className="text-[10px] sm:text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider text-white"
                style={{
                  background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
                  boxShadow: '0 0 18px rgba(244,63,94,0.7)',
                  animation: 'badge-pulse 2s ease-in-out infinite',
                }}
              >
                NEW
              </span>
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                   style={{ background: 'linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)' }} />
            </button>
          </div>
        </div>

        {/* ─── Feature cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto mb-10">
          <FeatureCard
            icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5" />}
            title="Time-Locked"
            desc="Cryptographically sealed until the chosen moment arrives."
          />
          <FeatureCard
            icon={<Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />}
            title="Hidden in Plain Sight"
            desc="Your message dissolves silently into the pixels of a photo."
          />
          <FeatureCard
            icon={<Heart className="w-4 h-4 sm:w-5 sm:h-5" />}
            title="Yours Alone"
            desc="Nothing uploaded, nothing tracked. Your photo holds the secret."
          />
        </div>

        <div className="hidden md:grid grid-cols-3 gap-6 max-w-xl mx-auto pt-2">
          <MiniFeature icon={<Camera className="w-4 h-4" />} label="Pick a photo together" />
          <MiniFeature icon={<MessageSquare className="w-4 h-4" />} label="Write what you feel" />
          <MiniFeature icon={<Clock className="w-4 h-4" />} label="Wait for the day" />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
        <span className="text-white/15 text-[10px] sm:text-xs tracking-[0.3em] uppercase font-light">Scroll</span>
        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white/15" style={{ animation: 'bounce-indicator 2s ease-in-out infinite' }} />
      </div>
    </section>
  );
}

/* ─── Feature card ─── */
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5 text-center group cursor-default transition-all duration-500"
      style={{
        background: 'linear-gradient(135deg, rgba(255,182,193,0.06) 0%, rgba(192,132,252,0.04) 100%)',
        border: '1px solid rgba(255,182,193,0.12)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,182,193,0.1) 0%, rgba(192,132,252,0.08) 100%)';
        e.currentTarget.style.borderColor = 'rgba(255,182,193,0.22)';
        e.currentTarget.style.boxShadow = '0 0 30px rgba(236,72,153,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,182,193,0.06) 0%, rgba(192,132,252,0.04) 100%)';
        e.currentTarget.style.borderColor = 'rgba(255,182,193,0.12)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center mx-auto mb-3 text-rose-200/60 transition-all duration-300 group-hover:scale-110 group-hover:text-rose-200/90"
        style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.12) 0%, rgba(168,85,247,0.08) 100%)' }}
      >
        {icon}
      </div>
      <h3 className="text-white/70 font-medium mb-1.5 text-sm sm:text-base font-serif">{title}</h3>
      <p className="text-white/30 text-xs sm:text-[13px] leading-relaxed font-light">{desc}</p>
    </div>
  );
}

/* ─── Mini feature ─── */
function MiniFeature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-white/25">
      <div className="w-11 h-11 rounded-full border flex items-center justify-center"
           style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}>
        {icon}
      </div>
      <span className="text-[11px] font-light tracking-wide font-serif italic">{label}</span>
    </div>
  );
}

/* ─── Floating decorations ─── */
function FloatingDecor() {
  const items = Array.from({ length: 22 }, (_, i) => {
    const size = 8 + (i * 3) % 18;
    const left = (i * 4.5) % 100;
    const top = 30 + ((i * 11) % 65);
    const duration = 2 + (i % 5) * 0.6; // 2.0 - 4.4s（快速飘动！）
    const delay = (i * 0.35) % 6;
    const isHeart = i % 3 === 0;
    const palette = ['#ff8fab', '#d8b4fe', '#c084fc', '#fbbf24', '#60a5fa', '#f472b6'];
    const color = palette[i % palette.length];
    return { size, left, top, duration, delay, isHeart, color, i };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map(({ size, left, top, duration, delay, isHeart, color, i }) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${size}px`,
            height: `${size}px`,
            color,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            animationName: 'float',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            opacity: 0.85,
            filter: `drop-shadow(0 0 ${size * 0.6}px ${color})`,
          }}
        >
          {isHeart ? (
            <Heart className="w-full h-full" fill="currentColor" stroke="none" />
          ) : (
            <Sparkles className="w-full h-full" stroke="none" />
          )}
        </div>
      ))}
    </div>
  );
}
