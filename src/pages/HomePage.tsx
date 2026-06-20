import { HeroSection } from '../components/HeroSection';
import { HowItWorks } from '../components/HowItWorks';
import { StoriesPreview } from './StoriesPreview';
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
