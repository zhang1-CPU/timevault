import { ArrowLeft, Smartphone } from 'lucide-react';

interface CoupleHeaderProps {
  onBack: () => void;
  title?: string;
  subtitle?: string;
}

export function CoupleHeader({ onBack, title, subtitle }: CoupleHeaderProps) {
  return (
    <header className="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/[0.04] relative z-10 bg-[#0a0612]/80 backdrop-blur-md">
      <div className="flex items-center justify-between">
        {/* Back button — bigger, more touchable */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm sm:text-base min-h-[40px] px-2 py-1 rounded-lg hover:bg-white/[0.03] active:scale-[0.98] transition-transform"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="font-light">Back</span>
        </button>

        {/* Title — shown when provided */}
        {title && (
          <div className="text-center">
            <p className="text-white/45 text-xs sm:text-sm font-light">{title}</p>
            {subtitle && <p className="text-white/15 text-[10px]">{subtitle}</p>}
          </div>
        )}

        {/* Brand logo + name */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-rose-500/15 to-pink-500/10 flex items-center justify-center border border-white/5">
            <svg viewBox="0 0 64 64" className="w-4 h-4 text-rose-200/80" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 16 L44 16 L34 32 L44 48 L20 48 L30 32 Z" fill="currentColor" fillOpacity="0.22" />
            </svg>
          </div>
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm text-white/45 font-display tracking-wide">TimeVault</span>
            <span className="text-rose-300/35 text-[10px] font-light">For Two</span>
          </div>
          <span className="text-rose-300/40 text-[10px] font-light sm:hidden">Two</span>
        </div>
      </div>
    </header>
  );
}

/**
 * Prominent "Open on Mobile" banner shown at top of couple flow.
 * Splitting photos + sharing QR works best on pocket-sized screens.
 */
export function MobilePromptBanner() {
  return (
    <div className="mx-4 sm:mx-6 mt-4 p-4 rounded-2xl border border-rose-400/20 bg-gradient-to-r from-rose-500/[0.08] via-pink-500/[0.05] to-violet-500/[0.08] flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-rose-500/15 border border-rose-400/20 flex items-center justify-center flex-shrink-0">
        <Smartphone className="w-4 h-4 text-rose-200/70" />
      </div>
      <div className="flex-1">
        <p className="text-rose-100/75 text-sm font-medium mb-1">
          Best experienced on your phone
        </p>
        <p className="text-rose-300/45 text-xs leading-relaxed font-light">
          Scan the QR with your partner's phone, or open this page on a mobile browser — sharing half-photos and reading messages is more intimate from the palm of your hand.
        </p>
      </div>
    </div>
  );
}

export function CoupleLogoBadge() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500/15 to-violet-500/10 flex items-center justify-center border border-white/5 animate-breathe">
        <svg viewBox="0 0 64 64" className="w-5 h-5 text-rose-200/80" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M20 16 L44 16 L34 32 L44 48 L20 48 L30 32 Z" fill="currentColor" fillOpacity="0.22" />
        </svg>
      </div>
      <div>
        <span className="text-white/40 text-sm font-display">TimeVault</span>
        <span className="text-rose-300/30 text-xs ml-2">Couple</span>
      </div>
    </div>
  );
}
