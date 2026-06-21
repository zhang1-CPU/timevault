import { Heart, Gift, Star, Users, Calendar, Plane, Leaf, Moon, Sparkles, MessageSquare, ArrowRight } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import type { Page } from '../App';

const TOP_STORIES: { icon: React.ReactNode; title: string; desc: string; page: Page; }[] = [
  {
    icon: <Heart className="w-5 h-5" fill="currentColor" />,
    title: 'Anniversary Letters Sealed in Time',
    desc: 'Write your vows inside a photo — open them only on your anniversary.',
    page: 'stories',
  },
  {
    icon: <Gift className="w-5 h-5" fill="currentColor" />,
    title: 'Birthday Traditions That Wait',
    desc: 'Seal a message inside a baby photo — to be opened on the 18th birthday.',
    page: 'stories',
  },
  {
    icon: <Star className="w-5 h-5" fill="currentColor" />,
    title: 'New Year\'s Resolutions',
    desc: 'Lock your January promises. Open them next December.',
    page: 'stories',
  },
  {
    icon: <Moon className="w-5 h-5" fill="currentColor" />,
    title: 'Grief & Healing',
    desc: 'Words that need time before being read.',
    page: 'stories',
  },
];

const RELATED_READS: { label: string; to: Page; icon?: React.ReactNode }[] = [
  { label: 'How does the time-lock actually work?', to: 'how-it-works', icon: <Calendar className="w-4 h-4" /> },
  { label: 'Is the encryption really unbreakable before the unlock date?', to: 'faq', icon: <Star className="w-4 h-4" /> },
  { label: 'Couple Mode — share secrets with two locks', to: 'couple', icon: <Heart className="w-4 h-4" fill="currentColor" /> },
  { label: 'About TimeVault — our story', to: 'about', icon: <Sparkles className="w-4 h-4" /> },
];

export function StoriesPreview({ navigate }: { navigate: (to: Page) => void }) {
  return (
    <section className="relative py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-10 md:mb-14">
            <p className="text-rose-200/35 text-[11px] tracking-[0.4em] uppercase font-light mb-3">
              Stories & Use Cases
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-white/80 mb-4">
              What will you <span className="gradient-text">seal</span> in time?
            </h2>
            <p className="text-white/25 max-w-2xl mx-auto font-light leading-relaxed text-sm md:text-base">
              From anniversary vows to birthday time-capsule messages. Some moments are worth waiting for.
            </p>
          </div>
        </ScrollReveal>

        {/* Top story cards */}
        <ScrollReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {TOP_STORIES.map((story, i) => (
            <div key={i} className="glass-romantic rounded-2xl p-5 reveal-item flex flex-col items-start transition-all duration-500 hover:border-rose-400/15 hover:scale-[1.02] cursor-pointer group"
                 onClick={() => navigate(story.page)}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 text-rose-200/60 bg-rose-500/15 border border-rose-500/10">
                {story.icon}
              </div>
              <h3 className="font-serif text-white/75 text-base mb-2">{story.title}</h3>
              <p className="text-white/25 text-sm leading-relaxed font-light mb-3">{story.desc}</p>
              <div className="mt-auto pt-2 flex items-center gap-1.5 text-[11px] text-white/20 font-light">
                <span>Read the idea</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          ))}
        </ScrollReveal>

        {/* CTA banner */}
        <ScrollReveal className="mt-10 text-center">
          <button
            onClick={() => navigate('stories')}
            className="px-6 py-3 rounded-xl border border-rose-400/15 text-rose-200/50 hover:text-rose-100/80 hover:border-rose-400/30 transition-all duration-300 text-sm font-light inline-flex items-center gap-2 group"
          >
            <MessageSquare className="w-4 h-4" />
            See all 12 use cases
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </ScrollReveal>

        {/* Related reads / internal links */}
        <div className="mt-16 border-t border-white/[0.03 pt-12">
          <ScrollReveal>
            <div className="text-center mb-8">
              <p className="text-white/15 text-[11px] tracking-[0.3em] uppercase font-light">
                Curious how it actually works?
              </p>
              <p className="text-white/40 font-serif text-center mt-2 mb-8">
                Read more...
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RELATED_READS.map((item, i) => (
              <button
                key={i}
                onClick={() => navigate(item.to)}
                className="text-left rounded-2xl p-5 border border-white/[0.03] bg-white/[0.01] hover:border-white/[0.06] hover:bg-white/[0.03] transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/[0.06] border border-rose-400/[0.1] flex items-center justify-center text-rose-200/60 flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/30 text-sm font-light leading-relaxed">{item.label}</p>
                  <p className="text-white/10 text-[11px] font-light tracking-wide mt-1">
                    {item.to}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/15 group-hover:translate-x-0.5 group-hover:text-white/30 transition-all duration-300 flex-shrink-0" />
                </div>
              </button>
            ))}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
