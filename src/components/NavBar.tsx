import { useState, useEffect, useCallback } from 'react';
import { Menu, X, Heart } from 'lucide-react';
import type { Page } from '../App';

const NAV_LINKS: { to: Page; label: string; accent?: boolean; heart?: boolean }[] = [
  { to: 'home', label: 'Home' },
  { to: 'how-it-works', label: 'How It Works' },
  { to: 'stories', label: 'Stories' },
  { to: 'faq', label: 'FAQ' },
  { to: 'about', label: 'About' },
];

const ACTION_LINKS: { to: Page; label: string; accent?: boolean; heart?: boolean }[] = [
  { to: 'unlock', label: 'Unlock', heart: false },
  { to: 'seal', label: 'Seal a Message', accent: true },
  { to: 'couple', label: 'For Two', heart: true },
];

export function NavBar({ page, navigate }: { page: Page; navigate: (to: Page) => void }) {
  const [scrolled, setScrolled] = useState(() =>
    typeof window !== 'undefined' && window.scrollY > 40
  );
  const [menuOpen, setMenuOpen] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 40);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const isActive = (p: Page) => page === p;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[rgba(10,6,18,0.88)]/90 backdrop-blur-xl border-b border-white/[0.05] shadow-[0_4px_30px_rgba(0,0,0,0.35)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-[70px] flex items-center justify-between">
          {/* Brand */}
          <button
            onClick={() => navigate('home')}
            className="flex items-center gap-2.5 group no-underline bg-transparent border-none p-0 cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-rose-400/20 to-violet-400/15
                            border border-white/[0.06] flex items-center justify-center
                            group-hover:border-rose-400/25 transition-all duration-300
                            shadow-[0_0_12px_rgba(225,120,140,0.12)]">
              <svg viewBox="0 0 64 64" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M20 16 L44 16 L34 32 L44 48 L20 48 L30 32 Z" fill="currentColor" fillOpacity="0.3" strokeOpacity="0.9" />
              </svg>
            </div>
            <span className="text-base sm:text-lg font-serif font-light tracking-wider gradient-text animate-shimmer"
                  style={{ backgroundImage: 'linear-gradient(100deg, #f8c8d8, #c9a8e8, #b5c8f0, #f8c8d8)', backgroundSize: '200% auto' }}>
              TimeVault
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={`relative px-3.5 py-2 text-[13px] font-light tracking-wide transition-all duration-300 rounded-lg bg-transparent border-none cursor-pointer
                  ${isActive(to) ? 'text-white/80' : 'text-white/35 hover:text-white/70'}`}
              >
                {label}
                {isActive(to) && (
                  <span className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-rose-300/40 to-transparent" />
                )}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {ACTION_LINKS.map(({ to, label, accent, heart }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={`px-4 py-2 text-[13px] font-light transition-all duration-300 rounded-xl border-none cursor-pointer min-h-[40px]
                  ${accent ? 'text-white font-medium hover:shadow-[0_0_40px_rgba(225,120,140,0.3)] hover:scale-[1.02]' : ''}
                  ${heart ? 'flex items-center gap-1.5 text-rose-200/60 hover:text-rose-100/80 bg-rose-500/[0.08] border border-rose-400/15 hover:border-rose-400/30' : ''}
                  ${!accent && !heart ? 'text-white/40 hover:text-white/70' : ''}`}
                style={accent ? { background: 'linear-gradient(135deg, #e11d48 0%, #8b5cf6 50%, #6366f1 100%)' } : undefined}
              >
                {heart && <Heart className="w-3 h-3" fill="currentColor" />}
                {label}
              </button>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-white/50 hover:text-white/80 transition-colors bg-transparent border-none cursor-pointer"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 bottom-0 w-72 bg-[#0d0818]/95 backdrop-blur-xl
                      border-l border-white/[0.06] p-6 pt-20 transition-transform duration-300 flex flex-col gap-1
                      ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <p className="text-white/15 text-[10px] uppercase tracking-[0.25em] mb-3 px-2">Navigate</p>

          {[...NAV_LINKS, ...ACTION_LINKS].map(({ to, label, accent, heart }) => (
            <button
              key={to}
              onClick={() => { navigate(to); setMenuOpen(false); }}
              className={`px-4 py-3.5 text-sm font-light rounded-xl transition-all duration-200 bg-transparent border-none cursor-pointer text-left
                ${accent ? 'bg-gradient-to-r from-rose-500 to-violet-500 text-white text-center' : isActive(to) ? 'bg-rose-500/[0.1] text-white/80' : 'text-white/45 hover:text-white/80 hover:bg-white/[0.04]'}`}
            >
              {heart && <Heart className="w-3.5 h-3.5 inline mr-1" fill="currentColor" />}
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
