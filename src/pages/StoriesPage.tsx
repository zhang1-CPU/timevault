import { useEffect, useState } from 'react';
import { Heart, Gift, Star, Users, Calendar, Plane, Leaf, Moon, Sparkles, MessageSquare } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';
import { usePageMeta } from '@/lib/usePageMeta';
import type { Page } from '../App';

const STORIES = [
  {
    icon: <Heart className="w-7 h-7" fill="currentColor" />,
    color: '#f5a8bf',
    tag: 'For Couples',
    title: 'Anniversary Letters Sealed in Time',
    desc: 'Write a love letter on your wedding day. Seal it inside your favorite photo together. Set it to unlock on your fifth anniversary. When the morning arrives, you\'ll read words written by the person you were when you said "I do." The same love, five years wiser.',
    example: '"I can\'t wait to grow old with you. See you in 2029. — Alex"',
  },
  {
    icon: <BookOpen className="w-7 h-7" fill="currentColor" />,
    color: '#c9a8e8',
    tag: 'For Yourself',
    title: 'A Letter to Future You',
    desc: 'What do you want to remember about today? Seal your current dreams, fears, and hopes inside a photo of your morning coffee, your desk, your city skyline. Set it for one year. When you open it, you\'ll meet the person you used to be — and see how far you\'ve come.',
    example: '"You\'re scared right now. Don\'t be. You\'ve got this."',
  },
  {
    icon: <Gift className="w-7 h-7" fill="currentColor" />,
    color: '#f5c8a0',
    tag: 'Birthday Traditions',
    title: '18th Birthday Time Capsule',
    desc: 'On your child\'s first birthday, write them a letter about who they are right now — their laugh, their favorite toy, the way they say "dada." Seal it inside their birthday photo. Set it to unlock on their 18th birthday. It becomes the most meaningful gift they\'ll ever receive.',
    example: '"You took your first steps today. One day you\'ll take on the world."',
  },
  {
    icon: <Star className="w-7 h-7" fill="currentColor" />,
    color: '#b5c8f0',
    tag: 'For Dreamers',
    title: 'New Year\'s Resolutions That Stick',
    desc: 'Every January 1st, seal your resolutions inside a photo of your New Year\'s Eve celebration. Set it to unlock December 31st of the same year. The photo reminds you of the promise. The unlock date makes you face it. Hold yourself accountable to the person you wanted to become.',
    example: '"Learn Italian. Run a marathon. Tell Mom you love her more."',
  },
  {
    icon: <Users className="w-7 h-7" fill="currentColor" />,
    color: '#e8b5d0',
    tag: 'For Families',
    title: 'Grandparents\' Wisdom',
    desc: 'Have grandparents with stories to tell? Ask them to write a letter to their grandchildren — about their childhood, their lessons, their love story. Seal it inside a cherished family photo. Set it to unlock when the grandchildren turn 16, or 21, or whenever the family decides it\'s time.',
    example: '"My grandchildren, here is what I\'ve learned about living a good life."',
  },
  {
    icon: <Calendar className="w-7 h-7" fill="currentColor" />,
    color: '#b5c8f0',
    tag: 'For Friends',
    title: 'The Best-Friend Time Capsule',
    desc: 'At graduation, at a farewell dinner, at the last day of summer — seal a message for your best friend inside a photo of your last adventure together. Set it for five years later. When you both open it, you\'ll laugh, you\'ll cry, you\'ll remember why this friendship mattered.',
    example: '"You were there when my whole world changed. Thank you for that summer."',
  },
  {
    icon: <Plane className="w-7 h-7" fill="currentColor" />,
    color: '#a8d8e8',
    tag: 'Travel & Adventure',
    title: 'The Trip You\'ll Never Forget',
    desc: 'At the end of a long journey — a solo backpacking trip, a honeymoon, a year abroad — write a letter about what the experience meant. Seal it inside the photo that best captures the feeling. Set it to unlock five years later. Some trips change you. Some photos should, too.',
    example: '"When you open this, remember: the world is bigger and kinder than your fears."',
  },
  {
    icon: <Heart className="w-7 h-7" fill="currentColor" />,
    color: '#f5a8a8',
    tag: 'Honest Farewells',
    title: 'A Letter for Someone Moving On',
    desc: 'Breakups are hard. Some things are better said in writing — and some things need time before they can be read. Write what you need to say. Seal it inside the photo that marked the beginning. Set the unlock date for a year from now. If you\'re ready, you\'ll open it. If not, you\'ll let it wait.',
    example: '"This is my goodbye, written kindly. Read it when you can do the same."',
  },
  {
    icon: <Leaf className="w-7 h-7" fill="currentColor" />,
    color: '#b5d8b8',
    tag: 'Loss & Remembering',
    title: 'Letters to Those Who Are Gone',
    desc: 'When someone we love passes away, we carry a pocket of things we wish we\'d said. Write them a letter — whatever it is you feel. Seal it inside the last photo you took together. The time-lock can be a month, a year, or a decade. The act of writing is itself a form of healing.',
    example: '"I miss you. I wanted you to know. I will always want you to know."',
  },
  {
    icon: <Globe className="w-7 h-7" fill="currentColor" />,
    color: '#c9b8e8',
    tag: 'Career & Milestones',
    title: 'Starting Over — in a New City, a New Job, a New Life',
    desc: 'The first day at a new job. The morning you moved to a new city. The month you started therapy. The month you quit. Seal a letter inside a photo from that day. Set it to unlock two years later. You will be astonished at who you become from there.',
    example: '"Today you walked into an empty apartment. By the time you open this, it will be home."',
  },
  {
    icon: <Sparkles className="w-7 h-7" fill="currentColor" />,
    color: '#e8d5a0',
    tag: 'Weddings & Vows',
    title: 'Wedding Vows the Other Person Can\'t Hear Until Later',
    desc: 'Some couples write private vows. Others want to say something on the wedding day that only the other will read years later — a letter to be opened on the fifth, tenth, or fifteenth anniversary. Read together, on an ordinary morning, it becomes the quietest, most intimate celebration.',
    example: '"On the day we said forever, here is what I really meant by it."',
  },
  {
    icon: <Moon className="w-7 h-7" fill="currentColor" />,
    color: '#b5b8e8',
    tag: 'For Grief & Healing',
    title: 'A Letter for a Hard Day',
    desc: 'On a good day — a healthy day, a calm day, a day where things feel right — write a letter to yourself on a bad day. Seal it inside a photo that feels like safety. Give yourself an unlock date in two weeks, or two months. When the bad day comes, you\'ll have a map back to the person you know you are.',
    example: '"You have been here before. You have found your way out before. You will again."',
  },
];

export function StoriesPage({ navigate }: { navigate: (to: Page) => void }) {
  usePageMeta(
    'Stories & Use Cases — TimeVault',
    'Ideas and inspiration for what to seal inside a photo — anniversary letters, birthday traditions, travel memories, farewell notes, wedding vows, grief letters, and more.'
  );

  useEffect(() => {
    const jsonLd = document.createElement('script');
    jsonLd.type = 'application/ld+json';
    jsonLd.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'What People Seal Inside a Photo',
      description:
        'Love letters, dreams, promises, secrets, memories — every photo holds a universe of meaning. Here are the stories people choose to preserve in time.',
      author: { '@type': 'Organization', name: 'TimeVault' },
      publisher: { '@type': 'Organization', name: 'TimeVault' },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://timevault.online/#stories',
      },
    });
    document.head.appendChild(jsonLd);
    return () => {
      try {
        document.head.removeChild(jsonLd);
      } catch {
        // ignore
      }
    };
  }, []);

  return (
    <div className="pt-20 sm:pt-24 animate-page-enter">
      {/* Hero */}
      <section className="py-16 sm:py-20 px-6 text-center">
        <p className="text-rose-200/35 text-[11px] tracking-[0.4em] uppercase mb-4 font-light">Ideas &amp; Inspiration</p>
        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-light mb-6">
          <span className="gradient-text">What People Seal</span>
        </h1>
        <p className="text-white/35 max-w-xl mx-auto text-base sm:text-lg font-light leading-relaxed">
          Love letters. Dreams. Promises. Secrets. Memories.<br className="hidden sm:block" />
          Every photo holds a universe of meaning.
        </p>
      </section>

      {/* Narrative opening */}
      <section className="py-8 px-6">
        <div className="max-w-3xl mx-auto glass-romantic rounded-3xl p-6 sm:p-10">
          <p className="text-white/35 text-sm sm:text-base leading-relaxed font-light mb-4">
            A sealed photo is a small, intentional act of paying attention. It is a way of saying: <span className="text-white/50">this moment matters.</span> You do not need a dramatic life to have something worth sealing. You only need one small, specific thing you do not want to forget.
          </p>
          <p className="text-white/25 text-sm sm:text-base leading-relaxed font-light italic">
            Here are some of the ways people are using TimeVault. Some are big, most are quiet — all are honest.
          </p>
        </div>
      </section>

      {/* Stories grid */}
      <section className="py-8 px-6">
        <ScrollReveal className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6" staggerDelay={70}>
          {STORIES.map((story, i) => (
            <div
              key={i}
              className="glass-romantic rounded-2xl p-6 sm:p-7 transition-all duration-500 hover:border-rose-400/20 reveal-item"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${story.color}20`, color: story.color }}
                >
                  {story.icon}
                </div>
                <span
                  className="text-[11px] px-2.5 py-1 rounded-full border font-light tracking-wide"
                  style={{ borderColor: `${story.color}40`, color: `${story.color}90`, backgroundColor: `${story.color}10` }}
                >
                  {story.tag}
                </span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-white/80 mb-3">{story.title}</h3>
              <p className="text-white/30 text-sm leading-relaxed font-light mb-4">{story.desc}</p>
              {story.example && (
                <blockquote className="border-l-2 pl-4 text-white/25 text-sm italic font-serif" style={{ borderColor: `${story.color}50` }}>
                  {story.example}
                </blockquote>
              )}
            </div>
          ))}
        </ScrollReveal>
      </section>

      {/* Narrative closing */}
      <section className="py-10 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-white/25 text-sm sm:text-base leading-relaxed font-light italic">
            Your life is already full of moments worth keeping. The photo is the vault. The letter is the treasure. Time is simply the lock.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center">
        <ScrollReveal>
          <div className="max-w-xl mx-auto glass-romantic rounded-3xl p-8 sm:p-10 border border-white/[0.04] reveal-item">
            <Heart className="w-8 h-8 text-rose-200/40 mx-auto mb-4" />
            <h3 className="font-serif text-2xl text-white/70 mb-3">What will you seal?</h3>
            <p className="text-white/30 font-light text-sm leading-relaxed mb-6">
              Any moment worth remembering is worth sealing inside a photo.
              Start with today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('seal')}
                className="px-8 py-4 rounded-2xl text-white text-sm font-medium no-underline transition-all duration-300
                           hover:shadow-[0_0_60px_rgba(225,120,140,0.35)] hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #e11d48 0%, #8b5cf6 50%, #6366f1 100%)' }}
              >
                Seal Your First Message
              </button>
              <button
                onClick={() => navigate('couple')}
                className="px-8 py-4 rounded-2xl border border-rose-400/15 text-rose-200/60 text-sm
                           hover:text-rose-100/80 hover:border-rose-400/30 no-underline transition-all duration-300
                           flex items-center justify-center gap-2 bg-transparent"
              >
                <Heart className="w-4 h-4" />
                Couple Mode
              </button>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
