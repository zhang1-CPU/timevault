import { useEffect, useState } from 'react';
import { Heart, Gift, Star, Users, Calendar, Plane, Leaf, Moon, Sparkles, MessageSquare, BookOpen, Globe } from 'lucide-react';
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
  {
    icon: <Heart className="w-7 h-7" fill="currentColor" />,
    color: '#f5a8bf',
    tag: 'Long Distance',
    title: 'Long-Distance Letters That Wait With You',
    desc: 'Distance softens voices, but a photo holds every detail. Seal what you want to say inside a picture from the day you said goodbye. Set it to unlock on the day you meet again. The miles between you become part of the gift — because waiting together is still together.',
    example: '"Three months, twelve days, and I\'m still counting. See you soon."',
  },
  {
    icon: <Gift className="w-7 h-7" fill="currentColor" />,
    color: '#f5c8a0',
    tag: 'Anniversary',
    title: 'Anniversary Gifts That Outlast Flowers',
    desc: 'Roses wilt. Chocolate melts. But a letter sealed inside your first-date photo? It only grows richer with time. Write down what you love about them right now — the quiet laugh, the way they hum while cooking, the song that always makes you think of them. Set it for next year. The gift isn\'t the photo — it\'s remembering.',
    example: '"Right now you\'re humming off-key in the kitchen. I hope you never stop."',
  },
  {
    icon: <Heart className="w-7 h-7" fill="currentColor" />,
    color: '#e8b5d0',
    tag: 'For Two',
    title: 'Two Halves, One Secret',
    desc: 'You each hold half a photo. Alone, it\'s just a picture. Together, it reveals something neither of you could see before — a message written by both of you, sealed in time. Some secrets are too big for one person to keep. Some are meant to be shared, slowly, when the time is right.',
    example: '"One half is mine. The other is yours. The whole thing is us."',
  },
  {
    icon: <Sparkles className="w-7 h-7" fill="currentColor" />,
    color: '#e8d5a0',
    tag: 'Weddings',
    title: 'Wedding Vows Only Time Can Reveal',
    desc: 'On your wedding day, you say the vows out loud for everyone to hear. But what about the ones you only whisper? Seal them inside a wedding photo — the things you want to say but can\'t yet, the promises you\'re afraid to speak aloud. Set them to unlock on your tenth anniversary. Some vows get better with age.',
    example: '"On the day we said forever, here\'s what I really meant by it."',
  },
  {
    icon: <Heart className="w-7 h-7" fill="currentColor" />,
    color: '#f5a8a8',
    tag: 'Proposals',
    title: 'Hide "Marry Me" Inside a Photo',
    desc: 'Hand them an ordinary photo of your favorite place. Tell them it\'s just a picture. Then say — "wait, look closer." At first they won\'t see it. And then they will. The question isn\'t on a ring. It\'s been in the pixels all along, waiting for the right moment to reveal itself.',
    example: '"Turn around. No — look at the photo again. Really look."',
  },
  {
    icon: <Heart className="w-7 h-7" fill="currentColor" />,
    color: '#f5a8bf',
    tag: "Valentine's Day",
    title: 'Valentine\'s Gifts That Actually Mean Something',
    desc: 'Chocolate gets eaten. Flowers wilt. A candlelit dinner ends when the check arrives. But a letter sealed inside a photo? It lasts. Write down the moment you knew — the exact second you realized this person was different. Set it to unlock next Valentine\'s Day. Love isn\'t just one day. It\'s the remembering.',
    example: '"I knew it was you the moment you laughed at my terrible joke."',
  },
  {
    icon: <Heart className="w-7 h-7" fill="currentColor" />,
    color: '#f5c8a0',
    tag: 'New Parents',
    title: 'A Letter to Your Baby — Sealed for Eighteen Years',
    desc: 'On their first birthday, write them a letter about who they are right now — the tiny laugh, the way they say "dada," the socks they always kick off. Seal it inside their birthday photo. Set it to unlock when they turn eighteen. The most meaningful gift you\'ll ever give them is a chance to meet the baby they once were.',
    example: '"You took your first steps today. One day you\'ll take on the world."',
  },
  {
    icon: <Users className="w-7 h-7" fill="currentColor" />,
    color: '#b5d8b8',
    tag: 'Family Legacy',
    title: 'Grandparents\' Stories Sealed in Time',
    desc: 'Ask them to write down what they\'ve learned — about love, about loss, about what matters. Seal it inside a family photo from long ago. Set it to unlock when the grandchildren are old enough to understand. Some wisdom can\'t be rushed. It has to wait for the right ears.',
    example: '"My grandchildren, here is what I\'ve learned about living a good life."',
  },
  {
    icon: <Heart className="w-7 h-7" fill="currentColor" />,
    color: '#b5d8b8',
    tag: 'For Pet Lovers',
    title: 'Letters to the Pets Who Left Paw Prints',
    desc: 'They can\'t read. They never could. But you can still write to them. Seal a letter inside your favorite photo — the one where they\'re curled up on the couch, or running on the beach, or looking at you like you\'re the entire world. The time-lock can be a month, a year, or never. Writing it is itself a way of saying goodbye properly.',
    example: '"Thank you for every morning you woke me up too early. I miss it."',
  },
  {
    icon: <Users className="w-7 h-7" fill="currentColor" />,
    color: '#b5c8f0',
    tag: 'For Friends',
    title: 'A Best-Friend Time Capsule for Ten Years From Now',
    desc: 'At graduation. At a farewell dinner. On the last night of summer. Seal a message inside a photo from your last adventure together. Set it for five or ten years later. When you both open it — over coffee, or wine, or whatever you\'re drinking then — you\'ll laugh, you\'ll cry, and you\'ll remember why this friendship mattered.',
    example: '"You were there when my whole world changed. Thank you for that summer."',
  },
  {
    icon: <BookOpen className="w-7 h-7" fill="currentColor" />,
    color: '#c9a8e8',
    tag: 'Graduation',
    title: 'Seal Your Graduation Day — and Open It Later',
    desc: 'On graduation day, everything feels like an ending. But it\'s really a beginning. Write a letter to yourself five years from now — about what you hope for, what you\'re afraid of, what you think the future holds. Seal it inside your cap-and-gown photo. When it unlocks, you\'ll see how much has changed — and how much of you is still there.',
    example: '"Today you think you have it all figured out. You don\'t. And that\'s okay."',
  },
  {
    icon: <Star className="w-7 h-7" fill="currentColor" />,
    color: '#e8d5a0',
    tag: 'Retirement',
    title: 'A Retirement Gift That Outlasts the Cake',
    desc: 'After decades of showing up, of early mornings and late nights, of projects and meetings and all the small victories — what do you give someone at the end of a career? You give them a chance to look back. Collect letters from colleagues. Seal them inside a group photo. Set the date for one year later. Retirement isn\'t an ending. It\'s the first day you get to read all the things people never said out loud.',
    example: '"You taught me more than you\'ll ever know. Thank you for everything."',
  },
  {
    icon: <BookOpen className="w-7 h-7" fill="currentColor" />,
    color: '#c9a8e8',
    tag: 'For Yourself',
    title: 'A Letter to the Person You\'ll Become',
    desc: 'What do you want to remember about today? Seal your current dreams, fears, and small daily rituals inside a photo of your morning coffee, your desk, your city skyline. Set it for one year. When you open it, you\'ll meet the person you used to be — and you\'ll see how far you\'ve come. The greatest conversation you\'ll ever have is with yourself across time.',
    example: '"You\'re scared right now. Don\'t be. You\'ve got this."',
  },
  {
    icon: <Star className="w-7 h-7" fill="currentColor" />,
    color: '#b5c8f0',
    tag: 'New Year',
    title: 'New Year\'s Resolutions That Actually Stick',
    desc: 'Every January first, you make promises to yourself. Every December thirty-first, you forget most of them. What if instead — you sealed those resolutions inside a photo of New Year\'s Eve? Set the unlock date for the end of the same year. The photo reminds you of the promise. The date makes you face it. Hold yourself accountable to the person you wanted to become.',
    example: '"Learn Italian. Run a marathon. Call Mom more often. Don\'t let me down."',
  },
  {
    icon: <Heart className="w-7 h-7" fill="currentColor" />,
    color: '#f5a8bf',
    tag: 'Self-Love',
    title: 'A Love Letter to Yourself',
    desc: 'Before you can love anyone else fully, you have to learn to be kind to the person in the mirror. Write a letter to yourself on a good day — a day when you feel strong, when you feel like enough. Seal it inside a photo that feels like safety. Give it an unlock date in two weeks or two months. When the bad day comes, you\'ll have a map back to the person you know you are.',
    example: '"You are doing the best you can. And that is more than enough."',
  },
  {
    icon: <Plane className="w-7 h-7" fill="currentColor" />,
    color: '#a8d8e8',
    tag: 'Travel',
    title: 'The Trip You\'ll Never Forget — Sealed in a Photo',
    desc: 'At the end of a journey — a solo backpacking trip, a honeymoon, a year abroad — write about what it meant. Seal it inside the photo that best captures the feeling. Set it to unlock five years later. Some trips change you. Some photos should, too. When you open it, you won\'t just remember where you went. You\'ll remember who you were when you were there.',
    example: '"When you open this, remember: the world is bigger and kinder than your fears."',
  },
  {
    icon: <Leaf className="w-7 h-7" fill="currentColor" />,
    color: '#b5d8b8',
    tag: 'Healing',
    title: 'A Letter for Someone Moving On',
    desc: 'Breakups are hard. Some things are better said in writing — and some things need time before they can be read. Write what you need to say. Seal it inside the photo that marked the beginning. Set the unlock date for a year from now. If you\'re ready, you\'ll open it. If not, you\'ll let it wait. Time decides what\'s worth keeping.',
    example: '"This is my goodbye, written kindly. Read it when you can do the same."',
  },
  {
    icon: <Leaf className="w-7 h-7" fill="currentColor" />,
    color: '#b5d8b8',
    tag: 'Grief & Remembering',
    title: 'Letters to Those Who Are Gone',
    desc: 'When someone we love passes away, we carry a pocket of things we wish we\'d said. Write them a letter — whatever it is you feel. Seal it inside the last photo you took together. The time-lock can be a month, a year, or a decade. The act of writing is itself a form of healing. Some words don\'t need to be heard to matter.',
    example: '"I miss you. I wanted you to know. I will always want you to know."',
  },
  {
    icon: <Gift className="w-7 h-7" fill="currentColor" />,
    color: '#f5c8a0',
    tag: 'Birthdays',
    title: 'A Birthday Gift That Unlocks Every Month',
    desc: 'Instead of one present, give them twelve. Seal twelve short letters inside twelve different photos — one for each month of their birthday year. Each one unlocks on the first of the month. January\'s letter says what you love about them in winter. July\'s letter recalls a summer memory. The gift isn\'t one day. It\'s a whole year of remembering.',
    example: '"This month, I want you to remember that time we got lost in the rain."',
  },
  {
    icon: <Globe className="w-7 h-7" fill="currentColor" />,
    color: '#c9b8e8',
    tag: 'How It Works',
    title: 'Hidden Messages in Plain Sight',
    desc: 'Before encryption, there was steganography — hiding messages where no one would think to look. A note inside a wax seal. A letter in the binding of a book. Now? A secret tucked into the pixels of a digital photo, invisible to everyone except the person who knows it\'s there. The oldest form of secrecy, reborn for the digital age. Your photo is the vault.',
    example: '"The best place to hide something is where no one will think to look."',
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
