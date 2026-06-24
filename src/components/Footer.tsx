import { Heart, ChevronRight, Github, Instagram, Twitter } from 'lucide-react';
import type { Page } from '../App';
import { getStats } from '@/lib/analytics';

export function Footer({ navigate }: { navigate: (to: Page) => void }) {
  const stats = getStats();
  const fmt = (n: number) => n.toLocaleString();

  return (
    <footer className="border-t border-white/[0.03] py-16 sm:py-20 px-6 relative">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[150px] rounded-full bg-gradient-to-t from-rose-500/[0.02] to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-14">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.18) 0%, rgba(168,85,247,0.15) 100%)' }}>
                <Heart className="w-4 h-4 text-rose-200/60" fill="currentColor" />
              </div>
              <h3 className="text-lg font-serif font-light gradient-text">TimeVault</h3>
            </div>
            <p className="text-white/40 text-sm font-serif italic mb-3">
              Write a letter to tomorrow.
            </p>
            <p className="text-white/25 text-sm leading-relaxed font-light max-w-xs mb-5">
              Seal a secret inside any photo. Time-locked cryptography. Your photo is the vault. Zero storage. Complete privacy.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-4">
              <a href="https://github.com/zhang1-CPU/timevault" target="_blank" rel="noopener noreferrer" aria-label="GitHub"
                className="text-white/20 hover:text-rose-200/70 transition-colors duration-300">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://instagram.com/timevault" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="text-white/20 hover:text-rose-200/70 transition-colors duration-300">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://x.com/timevault" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X"
                className="text-white/20 hover:text-rose-200/70 transition-colors duration-300">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white/25 text-[10px] uppercase tracking-[0.3em] mb-4 font-light font-serif">Explore</h4>
            <ul className="space-y-2.5">
              <FooterLink navigate={navigate} to="home" label="Home" />
              <FooterLink navigate={navigate} to="how-it-works" label="How It Works" />
              <FooterLink navigate={navigate} to="stories" label="Stories & Use Cases" />
              <FooterLink href="/blog/" label="Blog" />
              <FooterLink navigate={navigate} to="faq" label="FAQ" />
              <FooterLink navigate={navigate} to="about" label="About" />
            </ul>
          </div>

          {/* Legal + Actions + Live Stats */}
          <div>
            <h4 className="text-white/25 text-[10px] uppercase tracking-[0.3em] mb-4 font-light font-serif">Legal</h4>
            <ul className="space-y-2.5">
              <FooterLink navigate={navigate} to="privacy" label="Privacy Policy" />
              <FooterLink navigate={navigate} to="terms" label="Terms of Service" />
              <FooterLink navigate={navigate} to="contact" label="Contact" />
            </ul>
            <h4 className="text-white/25 text-[10px] uppercase tracking-[0.3em] mb-4 font-light font-serif mt-6">Actions</h4>
            <ul className="space-y-2.5">
              <FooterLink navigate={navigate} to="seal" label="Seal a Message" />
              <FooterLink navigate={navigate} to="unlock" label="Unlock a Photo" />
              <FooterLink navigate={navigate} to="couple" label="Couple Mode" />
            </ul>

            <h4 className="text-white/25 text-[10px] uppercase tracking-[0.3em] mb-3 font-light font-serif mt-6">Community</h4>
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] px-3 py-3 text-white/30 text-[11px] space-y-1.5 font-light">
              <div className="flex items-center justify-between">
                <span className="text-emerald-300/50">Solo sealed</span>
                <span className="tabular-nums text-white/40">{stats ? fmt(stats.singleDownloads) : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-rose-300/50">Couple A</span>
                <span className="tabular-nums text-white/40">{stats ? fmt(stats.coupleADownloads) : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-violet-300/50">Couple B</span>
                <span className="tabular-nums text-white/40">{stats ? fmt(stats.coupleBDownloads) : '—'}</span>
              </div>
              <div className="h-px bg-white/[0.05] my-1.5" />
              <div className="flex items-center justify-between">
                <span className="text-amber-300/50">Messages opened</span>
                <span className="tabular-nums text-white/40">{stats ? fmt(stats.decryptCount) : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.02] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/10 text-xs font-light font-serif italic">
            TimeVault — a quiet promise between you and the future.
          </p>
          <p className="text-white/10 text-[10px] font-light tracking-wide">
            Made with care for those who wait.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ navigate, to, label, href }: { navigate?: (to: Page) => void; to?: Page; label: string; href?: string }) {
  if (href) {
    return (
      <li>
        <a
          href={href}
          className="text-white/15 text-xs hover:text-white/40 transition-colors duration-300 flex items-center gap-1.5 font-light leading-relaxed no-underline group">
          <span>{label}</span>
          <ChevronRight className="w-2.5 h-2.5 opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0 transition-all duration-300 flex-shrink-0" />
        </a>
      </li>
    );
  }
  return (
    <li>
      <button
        onClick={() => navigate && to && navigate(to)}
        className="text-white/15 text-xs hover:text-white/40 transition-colors duration-300 flex items-center gap-1.5 font-light leading-relaxed bg-transparent border-none p-0 cursor-pointer group">
        <span>{label}</span>
        <ChevronRight className="w-2.5 h-2.5 opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0 transition-all duration-300 flex-shrink-0" />
      </button>
    </li>
  );
}

export { ChevronRight };
