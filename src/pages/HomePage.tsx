import { HeroSection } from '../components/HeroSection';
import { HowItWorks } from '../components/HowItWorks';
import { StoriesPreview } from '../components/StoriesPreview';
import { ScrollReveal } from '../components/ScrollReveal';
import type { Page } from '../App';

export function HomePage({ navigate }: { navigate: (to: Page) => void }) {
  return (
    <div className="animate-page-enter">
      <HeroSection
        onEncrypt={() => navigate('seal')}
        onDecrypt={() => navigate('unlock')}
        onCouple={() => navigate('couple')}
        onCoupleUnlock={() => { window.location.hash = '#couple-unlock'; window.location.reload(); }}
      />
      <QuoteSection />
      <TestimonialsSection />
      <HowItWorks
        onEncrypt={() => navigate('seal')}
        onDecrypt={() => navigate('unlock')}
      />
      <StoriesPreview navigate={navigate} />
    </div>
  );
}

function QuoteSection() {
  return (
    <section className="relative py-20 sm:py-24 px-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent via-rose-300/15 to-transparent" />
      <div className="max-w-2xl mx-auto text-center relative">
        <p className="font-serif italic text-2xl sm:text-3xl md:text-4xl leading-relaxed text-white/45 mb-5">
          &ldquo;The best time to plant a tree was twenty years ago.
          <br />
          The second best time is now.&rdquo;
        </p>
        <p className="text-white/20 text-xs sm:text-sm tracking-[0.25em] uppercase font-light">
          — An old proverb
        </p>
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent via-rose-300/15 to-transparent" />
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="relative py-14 sm:py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal className="text-center mb-10">
          <p className="text-white/20 text-[10px] tracking-[0.3em] uppercase font-light mb-2">
            What early users say
          </p>
          <h3 className="font-serif text-2xl sm:text-3xl font-light text-white/70 mb-2">
            Quietly loved by <span className="gradient-text">people who wait</span>
          </h3>
          <p className="text-white/25 text-sm font-light max-w-xl mx-auto">
            Case studies from our private testing group.
          </p>
        </ScrollReveal>

        <ScrollReveal className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              quote: "I sealed this for my daughter on her 10th birthday. She opens it on her 18th. Eight years of my love, stored in a single photo.",
              person: "Elena M.",
              role: "Mother · London",
              accent: "rose",
            },
            {
              quote: "My partner and I did couple mode for our one-year anniversary. We write something, we lock it. We'll open it on our 10th anniversary.",
              person: "James & Aria",
              role: "Couple · Melbourne",
              accent: "violet",
            },
            {
              quote: "I use it every New Year's Eve — write myself a message, seal it for December 31. It's my favorite ritual. Nothing gets lost, nothing leaks.",
              person: "Tanya R.",
              role: "Journalist · Berlin",
              accent: "amber",
            },
          ].map((t, i) => (
            <div key={i} className="rounded-2xl p-5 md:p-6 border border-white/[0.04] bg-white/[0.015] hover:border-white/[0.07] hover:bg-white/[0.025] transition-all duration-500">
              <p className="text-white/35 text-sm font-serif italic leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/[0.03]">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-light
                  ${t.accent === 'rose' ? 'bg-rose-500/15 text-rose-200/60 border border-rose-500/10' :
                    t.accent === 'violet' ? 'bg-violet-500/15 text-violet-200/60 border border-violet-500/10' :
                    'bg-amber-500/15 text-amber-200/60 border border-amber-500/10'}`}>
                  {t.person[0]}
                </div>
                <div>
                  <p className="text-white/45 text-xs font-light">{t.person}</p>
                  <p className="text-white/15 text-[10px] font-light tracking-wide">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
