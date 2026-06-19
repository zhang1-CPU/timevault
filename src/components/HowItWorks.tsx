import { Upload, FileKey, Image, Clock, Unlock, Eye, Lock } from 'lucide-react';

interface HowItWorksProps {
  onEncrypt: () => void;
  onDecrypt: () => void;
}

const steps = [
  {
    icon: <Upload className="w-4 h-4 sm:w-5 sm:h-5" />,
    title: 'Choose a Photo',
    desc: 'A picture that means something — a first date, a quiet morning, a place you promised to return to.',
  },
  {
    icon: <FileKey className="w-4 h-4 sm:w-5 sm:h-5" />,
    title: 'Write Your Words',
    desc: 'Tell the future how you feel. Set a four-digit key. Choose the exact moment it may be opened.',
  },
  {
    icon: <Image className="w-4 h-4 sm:w-5 sm:h-5" />,
    title: 'Hide It Away',
    desc: 'Your message dissolves into the pixels. Silent, invisible, safe inside the photo you chose.',
  },
  {
    icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />,
    title: 'Let Time Pass',
    desc: 'Locked by mathematics. Not even we can look inside before the hour you chose. The wait is part of the gift.',
  },
  {
    icon: <Unlock className="w-4 h-4 sm:w-5 sm:h-5" />,
    title: 'Return',
    desc: 'When the moment arrives, open the app. Your photo, your PIN. The message, unchanged, waiting for you.',
  },
  {
    icon: <Eye className="w-4 h-4 sm:w-5 sm:h-5" />,
    title: 'Read',
    desc: 'Meet the person who wrote it. A conversation with who you were — or with someone you love.',
  },
];

export function HowItWorks({ onEncrypt, onDecrypt }: HowItWorksProps) {
  return (
    <section className="py-20 sm:py-28 px-6 relative">
      {/* Soft ambient glow */}
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-rose-500/[0.03] to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-gradient-to-l from-violet-500/[0.03] to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-14 sm:mb-20">
          <p className="text-rose-200/35 text-[11px] sm:text-xs tracking-[0.35em] uppercase mb-4 font-light">
            The Journey
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-light leading-tight mb-5">
            <span className="gradient-text">How It Works</span>
          </h2>
          <p className="text-white/25 max-w-md mx-auto text-sm sm:text-base leading-relaxed font-light">
            Six quiet steps. One message that outlasts the present.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-20">
          {steps.map((step, i) => (
            <div
              key={i}
              className="group relative glass-romantic rounded-2xl p-5 sm:p-6 transition-all duration-500"
            >
              {/* Step number — faint serif */}
              <div className="absolute top-3 right-4 font-serif text-4xl sm:text-5xl italic text-white/[0.04] select-none leading-none">
                {String(i + 1).padStart(2, '0')}
              </div>

              {/* Icon */}
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-rose-400/10 to-violet-400/10
                            flex items-center justify-center mb-4 text-rose-200/50
                            group-hover:from-rose-400/20 group-hover:to-violet-400/15
                            group-hover:scale-110 group-hover:text-rose-100/80
                            transition-all duration-300"
              >
                {step.icon}
              </div>

              {/* Content */}
              <h3 className="text-white/70 font-serif text-base mb-2">{step.title}</h3>
              <p className="text-white/30 text-sm leading-relaxed font-light">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Security layers */}
        <div className="glass-romantic rounded-3xl p-6 sm:p-10 border border-white/[0.04] bg-white/[0.015] mb-20">
          <div className="text-center mb-10">
            <p className="text-white/15 text-[10px] tracking-[0.35em] uppercase mb-2">Security</p>
            <h3 className="font-serif text-2xl sm:text-3xl text-white/40 font-light">Built to stay private</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-5 rounded-2xl border border-white/[0.04] bg-white/[0.015] hover:border-rose-400/10 hover:bg-rose-500/[0.03] transition-all duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500/20 to-violet-500/15 flex items-center justify-center text-rose-200/50">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-white/55 font-serif text-base">Your Secret Key</h4>
              </div>
              <p className="text-white/20 text-xs sm:text-sm leading-relaxed font-light pl-10">
                AES-256 sealed by your 4-digit PIN — not even we can read what you write.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/[0.04] bg-white/[0.015] hover:border-violet-400/10 hover:bg-violet-500/[0.03] transition-all duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/15 flex items-center justify-center text-violet-200/50">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-white/55 font-serif text-base">Time as the Gate</h4>
              </div>
              <p className="text-white/20 text-xs sm:text-sm leading-relaxed font-light pl-10">
                Cryptographically locked to a future date using drand beacon — the clock cannot be turned back.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/[0.04] bg-white/[0.015] hover:border-cyan-400/10 hover:bg-cyan-500/[0.02] transition-all duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/15 to-teal-500/10 flex items-center justify-center text-cyan-200/40">
                  <Image className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-white/55 font-serif text-base">Hidden in Pixels</h4>
              </div>
              <p className="text-white/20 text-xs sm:text-sm leading-relaxed font-light pl-10">
                Your encrypted payload is embedded inside the photo itself. The image is the vault.
              </p>
            </div>
          </div>
        </div>

        {/* CTA at bottom of section */}
        <div className="text-center space-y-6 max-w-xl mx-auto">
          <p className="font-serif italic text-2xl sm:text-3xl text-white/40 leading-relaxed">
            &ldquo;Some things are worth waiting for.&rdquo;
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={onEncrypt}
              className="px-8 py-4 rounded-2xl text-white font-medium text-sm sm:text-base
                         transition-all duration-500 hover:shadow-[0_0_80px_rgba(225,120,140,0.3)]
                         hover:scale-[1.03] active:scale-[0.97] min-h-[56px]
                         flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #e11d48 0%, #8b5cf6 50%, #6366f1 100%)' }}
            >
              <Lock className="w-4 h-4" />
              Seal a Secret
            </button>
            <button
              onClick={onDecrypt}
              className="px-8 py-4 rounded-2xl border border-white/[0.08] text-white/45
                         hover:bg-white/[0.03] hover:border-white/15 hover:text-white/70
                         transition-all duration-300 text-sm sm:text-base
                         flex items-center justify-center gap-2 min-h-[56px] backdrop-blur-sm"
            >
              <Unlock className="w-4 h-4" />
              Open a Photo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
