import { useEffect } from 'react';
import { Heart, Shield, Clock, Sparkles, Lock } from 'lucide-react';
import type { Page } from '../App';

const VALUES = [
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Privacy by Design',
    desc: 'Your messages are encrypted entirely in your browser. We never see, store, or transmit the content of your messages. No accounts. No tracking. No data collection.',
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: 'Time as a Promise',
    desc: 'Time is the most honest lock there is. Unlike passwords that can be cracked, time moves at its own pace. We built TimeVault to let time itself be the promise.',
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Built for Emotion',
    desc: "This isn't a tool for engineers. It's a tool for people in love, people with dreams, people who want to send a message through time. The interface should feel as meaningful as the message.",
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'Simple, Not Simplistic',
    desc: 'Under the hood is serious cryptography — AES-256, drand beacons, LSB steganography. But you never have to know any of that. Three steps. One photo. A future moment.',
  },
];

export function AboutPage({ navigate }: { navigate: (to: Page) => void }) {
  useEffect(() => {
    document.title = 'About — TimeVault';

    const metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    metaDesc.content =
      'TimeVault is a free, privacy-first web app that lets you hide encrypted messages inside photos. Built on AES-256-GCM, drand time-lock encryption, and LSB steganography. Zero storage. Complete privacy.';
    document.head.appendChild(metaDesc);

    return () => {
      document.head.removeChild(metaDesc);
    };
  }, []);

  return (
    <div className="pt-20 sm:pt-24 animate-page-enter">
      {/* Hero */}
      <section className="py-16 sm:py-20 px-6 text-center">
        <p className="text-rose-200/35 text-[11px] tracking-[0.4em] uppercase mb-4 font-light">Our Story</p>
        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-light mb-6">
          <span className="gradient-text">About TimeVault</span>
        </h1>
        <p className="text-white/35 max-w-2xl mx-auto font-light leading-relaxed text-base sm:text-lg">
          We believe some words are worth waiting for.
        </p>
      </section>

      {/* Story */}
      <section className="py-8 px-6">
        <div className="max-w-3xl mx-auto glass-romantic rounded-3xl p-8 sm:p-12 border border-white/[0.04] mb-10">
          <h2 className="font-serif text-2xl sm:text-3xl text-white/70 mb-6">
            Why We Built This
          </h2>
          <div className="space-y-5 text-white/30 text-sm sm:text-base leading-relaxed font-light">
            <p>
              Every year on our anniversary, my partner and I write letters to each other. We seal them in envelopes.
              We exchange them on the day. But paper fades. Envelopes get lost in moves.
            </p>
            <p>
              We wanted something more permanent. Something hidden in plain sight. Something that time itself would protect.
            </p>
            <p>
              TimeVault is the result. Write a letter. Choose a photo that means something. Set the unlock date.
              The message waits inside the image — patient, silent, safe — until the moment you chose.
            </p>
            <p>
              And because nothing is stored on our servers, there is no database to hack, no account to compromise,
              no company that could be sold. Your secrets stay yours, forever.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl sm:text-4xl text-center mb-10">
            <span className="gradient-text-soft">What We Stand For</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {VALUES.map((v, i) => (
              <div key={i} className="glass-romantic rounded-2xl p-6 transition-all duration-500 hover:border-rose-400/15">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/[0.06] border border-rose-400/10
                                flex items-center justify-center text-rose-200/50 mb-4">
                  {v.icon}
                </div>
                <h3 className="font-serif text-lg text-white/70 mb-2">{v.title}</h3>
                <p className="text-white/30 text-sm leading-relaxed font-light">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl mb-4">
            <span className="gradient-text-soft">Serious Tech, Simple Design</span>
          </h2>
          <p className="text-white/30 font-light leading-relaxed mb-8 text-sm sm:text-base">
            TimeVault uses AES-256-GCM encryption, drand's verifiable random beacon for time-locking,
            and LSB steganography to hide messages in photos. The same cryptographic standards used
            by banks and governments — made accessible to everyone.
          </p>
          <button
            onClick={() => navigate('how-it-works')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm
                       no-underline transition-all duration-300 hover:shadow-[0_0_40px_rgba(225,120,140,0.3)] hover:scale-[1.02] bg-transparent border-none cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #e11d48 0%, #8b5cf6 50%, #6366f1 100%)' }}
          >
            <Lock className="w-4 h-4" />
            See How It Works
          </button>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center">
        <div className="max-w-md mx-auto">
          <Heart className="w-8 h-8 text-rose-200/30 mx-auto mb-4" />
          <p className="font-serif italic text-xl text-white/35 mb-6">
            Ready to seal your first message?
          </p>
          <button
            onClick={() => navigate('seal')}
            className="inline-block px-8 py-4 rounded-2xl text-white text-sm font-medium no-underline
                       transition-all duration-300 hover:shadow-[0_0_60px_rgba(225,120,140,0.35)] bg-transparent border-none cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #e11d48 0%, #8b5cf6 50%, #6366f1 100%)' }}
          >
            Get Started — It&apos;s Free
          </button>
        </div>
      </section>
    </div>
  );
}
