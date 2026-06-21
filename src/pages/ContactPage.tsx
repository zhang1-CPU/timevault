import { Shield, Heart, Lock, FileText } from 'lucide-react';
import { usePageMeta } from '@/lib/usePageMeta';
import type { Page } from '../App';

export function ContactPage({ navigate }: { navigate: (to: Page) => void }) {
  usePageMeta(
    'Contact — TimeVault',
    'Questions about TimeVault, privacy, or time-locked messages? Get in touch with our team — we read every message.'
  );

  return (
    <div className="pt-20 sm:pt-24 animate-page-enter">
      <section className="py-16 sm:py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-rose-200/30 text-[11px] tracking-[0.4em] uppercase mb-4 font-light">
            Get in touch
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl mb-5">
            <span className="gradient-text">Contact Us</span>
          </h1>
          <p className="text-white/30 text-sm font-light leading-relaxed max-w-lg mx-auto">
            We read every message. Most questions are answered within five business days.
          </p>
        </div>
      </section>

      <section className="pb-10 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* General inquiries */}
          <div className="glass-romantic rounded-2xl p-6 border border-white/[0.04]">
            <Shield className="w-7 h-7 text-rose-200/50 mb-4" />
            <h3 className="font-serif text-lg text-white/65 mb-2">General Inquiries</h3>
            <p className="text-white/25 text-xs leading-relaxed mb-3 font-light">
              Questions about how TimeVault works, the cryptography behind it, or potential integrations.
            </p>
            <a
              href="mailto:hello@timevault.online"
              className="text-white/50 text-sm hover:text-white/80 transition-colors font-light underline-offset-2 hover:underline"
            >
              hello@timevault.online
            </a>
          </div>

          {/* Privacy / Rights */}
          <div className="glass-romantic rounded-2xl p-6 border border-white/[0.04]">
            <Lock className="w-7 h-7 text-rose-200/50 mb-4" />
            <h3 className="font-serif text-lg text-white/65 mb-2">Privacy and Data Requests</h3>
            <p className="text-white/25 text-xs leading-relaxed mb-3 font-light">
              To confirm, access, or delete any personal information you believe we hold (for example, an email address from the optional reminder service).
            </p>
            <a
              href="mailto:privacy@timevault.online"
              className="text-white/50 text-sm hover:text-white/80 transition-colors font-light underline-offset-2 hover:underline"
            >
              privacy@timevault.online
            </a>
          </div>

          {/* Legal */}
          <div className="glass-romantic rounded-2xl p-6 border border-white/[0.04]">
            <FileText className="w-7 h-7 text-rose-200/50 mb-4" />
            <h3 className="font-serif text-lg text-white/65 mb-2">Legal</h3>
            <p className="text-white/25 text-xs leading-relaxed mb-3 font-light">
              Questions about our Terms of Service, copyright, or permissions for use in educational / research projects.
            </p>
            <a
              href="mailto:legal@timevault.online"
              className="text-white/50 text-sm hover:text-white/80 transition-colors font-light underline-offset-2 hover:underline"
            >
              legal@timevault.online
            </a>
          </div>

          {/* Press / stories */}
          <div className="glass-romantic rounded-2xl p-6 border border-white/[0.04]">
            <Heart className="w-7 h-7 text-rose-200/50 mb-4" />
            <h3 className="font-serif text-lg text-white/65 mb-2">Stories and Press</h3>
            <p className="text-white/25 text-xs leading-relaxed mb-3 font-light">
              Writing about TimeVault or hidden-message apps in general? Happy to share context and screenshots.
            </p>
            <a
              href="mailto:press@timevault.online"
              className="text-white/50 text-sm hover:text-white/80 transition-colors font-light underline-offset-2 hover:underline"
            >
              press@timevault.online
            </a>
          </div>
        </div>
      </section>

      {/* Response time */}
      <section className="pb-16 px-6">
        <div className="max-w-2xl mx-auto text-center glass-romantic rounded-2xl p-8 border border-white/[0.04]">
          <h3 className="font-serif text-2xl text-white/60 mb-3">Response Time</h3>
          <p className="text-white/25 text-sm leading-relaxed mb-5 font-light">
            We aim to reply within five business days. Security-related disclosures are reviewed within 72 hours.
          </p>
          <p className="text-white/15 text-xs font-light tracking-wide">
            TimeVault — a quiet promise between you and the future.
          </p>
          <div className="pt-6 mt-2">
            <button
              onClick={() => navigate('home')}
              className="text-white/35 hover:text-white/60 text-xs transition-colors font-light border-none bg-transparent cursor-pointer"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
