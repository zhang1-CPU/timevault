import { ArrowRight } from 'lucide-react';
import type { Page } from '../App';

const PREVIEW_STORIES = [
  { emoji: '💌', title: 'Anniversary Letters', desc: 'Write on your wedding day, read on your 5th anniversary.' },
  { emoji: '📖', title: 'Letters to Future You', desc: 'Tell yourself today what you want to remember tomorrow.' },
  { emoji: '🌟', title: "New Year's Resolutions", desc: 'Seal your promises and hold yourself accountable.' },
];

export function StoriesPreview({ navigate }: { navigate: (to: Page) => void }) {
  return (
    <section className="py-12 sm:py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-rose-200/30 text-[10px] tracking-[0.4em] uppercase mb-3 font-light">Stories</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-light mb-3">
            <span className="gradient-text-soft">What People Seal</span>
          </h2>
          <p className="text-white/25 text-sm font-light">Love letters. Dreams. Promises. Secrets. Memories.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {PREVIEW_STORIES.map((s, i) => (
            <div key={i} className="glass-romantic rounded-2xl p-5 text-center transition-all duration-300 hover:border-rose-400/15">
              <div className="text-3xl mb-3">{s.emoji}</div>
              <h4 className="text-white/65 font-serif text-base mb-1">{s.title}</h4>
              <p className="text-white/25 text-xs font-light leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('stories')}
            className="inline-flex items-center gap-2 text-rose-200/50 hover:text-rose-200/80
                       text-sm font-light transition-colors duration-300 bg-transparent border-none cursor-pointer group"
          >
            See all stories
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
}
