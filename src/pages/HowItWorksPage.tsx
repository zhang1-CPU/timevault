import { Shield, Lock, Clock, Image, Eye, Zap, Users, Smartphone, ArrowRight, Sparkles } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';
import { usePageMeta } from '@/lib/usePageMeta';
import type { Page } from '../App';

const TECH_STEPS = [
  {
    icon: <Image className="w-6 h-6" />,
    title: 'Step 1 — Choose a Photo Together',
    desc: 'Pick any photo that means something to the two of you — a date night, a trip, a quiet morning, the place you first met. It becomes the envelope, the vault, the gift.',
  },
  {
    icon: <Lock className="w-6 h-6" />,
    title: 'Step 2 — Write What You Feel',
    desc: 'Write a letter, a wish, a secret promise, or a story only the two of you understand. Set a four-digit PIN you will both remember. Set the unlock date — next anniversary, a birthday, five years from now.',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Step 3 — The Encryption Happens',
    desc: 'Your message is encrypted with your PIN (AES-256, the same standard used by banks). Then a second layer locks it: a time-lock using the drand distributed beacon — a global network of computers. Even we cannot open it early.',
  },
  {
    icon: <Image className="w-6 h-6" />,
    title: 'Step 4 — Hidden Inside the Photo',
    desc: 'The encrypted message is embedded into the photo using LSB steganography — every pixel holds a secret. The photo looks completely unchanged. You can share it anywhere.',
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: 'Step 5 — Send It, Store It, Wait',
    desc: 'The sealed photo is yours. Email it, save it to a shared album, print it, frame it. Nothing is stored on our servers. The message waits silently inside the image, patient as time.',
  },
  {
    icon: <Eye className="w-6 h-6" />,
    title: 'Step 6 — When the Moment Arrives',
    desc: 'Both of you come back to TimeVault, upload the photo, enter the PIN. The lock dissolves. The message appears — untouched by time, exactly as it was written.',
  },
];

const SECURITY_LAYERS = [
  {
    icon: <Shield className="w-5 h-5" />,
    color: 'rose',
    title: 'Layer 1 — Your PIN (AES-256-GCM)',
    desc: 'Your four-digit PIN derives a 256-bit encryption key using 100,000 rounds of PBKDF2. Even if someone has the sealed photo, they cannot read it without your PIN.',
  },
  {
    icon: <Clock className="w-5 h-5" />,
    color: 'violet',
    title: 'Layer 2 — Time Lock (drand / tlock)',
    desc: 'After PIN encryption, the message is time-locked using drand — a decentralized network of 70+ nodes generating verifiable randomness. The mathematical structure makes it impossible to decrypt before the chosen date.',
  },
  {
    icon: <Image className="w-5 h-5" />,
    color: 'cyan',
    title: 'Layer 3 — LSB steganography',
    desc: 'The encrypted payload is distributed across the least-significant bits of each pixel in your photo. Visually identical. File size unchanged. Only someone who knows to look can find it.',
  },
];

const TERMS = [
  {
    term: 'AES-256-GCM',
    def: 'The Advanced Encryption Standard with a 256-bit key, in Galois/Counter Mode. The same cipher used by governments and banks to protect classified information. GCM also provides authentication — tampering is detected.',
  },
  {
    term: 'PBKDF2 with 100,000 rounds',
    def: 'Password-Based Key Derivation Function 2. Your PIN is not used directly as a key; instead, it is "stretched" through 100,000 rounds of SHA-256 hashing to produce the final encryption key. This slows brute-force attacks enormously.',
  },
  {
    term: 'drand distributed randomness beacon',
    def: 'A public, independently-operated network of 70+ organisations around the world. Every 30 seconds, it emits a new random value that is mathematically guaranteed to be unpredictable. This is what makes the time-lock possible.',
  },
  {
    term: 'tlock time-lock encryption',
    def: 'A cryptographic construction that uses drand\'s future public randomness as a key. Because nobody — not even us — can predict what the drand network will emit at a future date, messages encrypted against it are unreadable until that moment.',
  },
  {
    term: 'LSB steganography',
    def: 'Least-Significant-Bit steganography. Each pixel in a digital image has colour values from 0 to 255. Changing only the last (least-significant) bit of each value has no effect visible to the human eye, but creates a hidden channel that can carry data.',
  },
  {
    term: 'Zero-knowledge architecture',
    def: 'A design in which the server — us — never sees or stores the user\'s message, PIN, photo, or any form of recoverable data. We serve the code; the browser does the work.',
  },
];

export function HowItWorksPage({ navigate }: { navigate: (to: Page) => void }) {
  usePageMeta(
    'How It Works — TimeVault',
    'A detailed walkthrough of TimeVault — how we combine AES-256-GCM, drand time-lock encryption, and LSB steganography to create a zero-storage photo-based time capsule.'
  );

  return (
    <div className="pt-20 sm:pt-24 animate-page-enter">
      {/* Hero */}
      <section className="py-16 sm:py-20 px-6 text-center">
        <p className="text-rose-200/35 text-[11px] tracking-[0.4em] uppercase mb-4 font-light">Behind the Magic</p>
        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-light mb-6">
          <span className="gradient-text">How It Works</span>
        </h1>
        <p className="text-white/35 max-w-xl mx-auto text-base sm:text-lg font-light leading-relaxed">
          Three layers of cryptography. Zero storage on our servers.<br className="hidden sm:block" />
          Your photo is the vault — and always stays on your device.
        </p>
      </section>

      {/* Steps */}
      <section className="py-8 sm:py-12 px-6">
        <ScrollReveal className="max-w-4xl mx-auto space-y-6 sm:space-y-8" staggerDelay={80}>
          {TECH_STEPS.map((step, i) => (
            <div key={i} className="glass-romantic rounded-2xl p-6 sm:p-8 flex gap-5 sm:gap-7 items-start reveal-item transition-all duration-300">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-rose-500/[0.06] border border-rose-400/10
                              flex items-center justify-center text-rose-200/50">
                {step.icon}
              </div>
              <div>
                <h3 className="text-white/80 font-serif text-lg sm:text-xl mb-2">{step.title}</h3>
                <p className="text-white/30 text-sm sm:text-base leading-relaxed font-light">{step.desc}</p>
              </div>
            </div>
          ))}
        </ScrollReveal>
      </section>

      {/* Security deep dive */}
      <section className="py-12 sm:py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl sm:text-4xl text-center mb-3">
            <span className="gradient-text-soft">Security in Depth</span>
          </h2>
          <p className="text-white/25 text-center mb-10 font-light text-sm">
            Three independent layers — cracking one doesn't help crack the others.
          </p>
          <ScrollReveal className="grid grid-cols-1 sm:grid-cols-3 gap-4" staggerDelay={100}>
            {SECURITY_LAYERS.map((layer, i) => (
              <div key={i} className="glass-romantic rounded-2xl p-6 reveal-item">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4
                                ${layer.color === 'rose' ? 'bg-rose-500/[0.08] text-rose-200/60' : ''}
                                ${layer.color === 'violet' ? 'bg-violet-500/[0.08] text-violet-200/60' : ''}
                                ${layer.color === 'cyan' ? 'bg-cyan-500/[0.06] text-cyan-200/50' : ''}`}>
                  {layer.icon}
                </div>
                <h4 className="text-white/65 font-serif text-sm mb-2">{layer.title}</h4>
                <p className="text-white/25 text-xs leading-relaxed font-light">{layer.desc}</p>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* Under the hood */}
      <section className="py-12 sm:py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-violet-200/40" />
            <p className="text-violet-200/40 text-[11px] tracking-[0.4em] uppercase font-light">Under the Hood</p>
            <Sparkles className="w-5 h-5 text-violet-200/40" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-center mb-6">
            <span className="gradient-text-soft">A Short Technical Glossary</span>
          </h2>
          <p className="text-white/25 text-center mb-10 font-light text-sm max-w-xl mx-auto">
            TimeVault is built on well-understood, peer-reviewed cryptographic primitives. Nothing is &quot;home-made&quot; — every piece below is a standard used across industry and academia.
          </p>
          <ScrollReveal className="space-y-3" staggerDelay={60}>
            {TERMS.map((t, i) => (
              <div key={i} className="glass-romantic rounded-2xl p-5 sm:p-6 reveal-item">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4 mb-1.5">
                  <h3 className="font-serif text-white/70 text-base sm:text-lg whitespace-nowrap">{t.term}</h3>
                  <span className="text-white/15 text-xs font-light hidden sm:inline">—</span>
                  <p className="text-white/30 text-xs sm:text-sm leading-relaxed font-light mt-1 sm:mt-0">{t.def}</p>
                </div>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* Why this is different */}
      <section className="py-12 sm:py-16 px-6">
        <ScrollReveal className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl mb-6 reveal-item">
            <span className="gradient-text-soft">Why TimeVault Is Different</span>
          </h2>
          <div className="glass-romantic rounded-3xl p-6 sm:p-10 space-y-4 text-white/30 text-sm sm:text-base leading-relaxed font-light text-left">
            <p>
              <span className="text-white/50">Most &ldquo;time capsule&rdquo; services store your message on their servers.</span> They promise to deliver it on a future date. But that promise only lasts as long as the company does — servers get shut down, companies fold, data gets lost. And the message itself, while encrypted at rest, can in principle be read or subpoenaed.
            </p>
            <p>
              <span className="text-white/50">TimeVault works the other way around.</span> The message never leaves your device. We ship the cryptography code to your browser; the photo and the PIN stay with you. The sealed image is the only thing that exists when you close the tab — no account, no backup, no paper trail on our side.
            </p>
            <p>
              <span className="text-white/50">The time-lock is mathematical, not administrative.</span> You are not trusting a company to keep a promise. You are trusting a widely-reviewed cryptographic protocol. This difference matters most for long-term capsules: a company can disappear in five years. Math cannot.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* Couple mode teaser */}
      <section className="py-12 sm:py-16 px-6">
        <ScrollReveal>
          <div className="max-w-2xl mx-auto text-center glass-romantic rounded-3xl p-8 sm:p-10 border border-white/[0.04] reveal-item">
            <Users className="w-10 h-10 text-rose-200/50 mx-auto mb-4" />
            <h3 className="font-serif text-2xl sm:text-3xl text-white/70 mb-3">Made for Two</h3>
            <p className="text-white/30 font-light leading-relaxed mb-6 text-sm sm:text-base">
              TimeVault also has a special mode for couples. Split a photo in two, send each half through different channels,
              and only when both halves are reunited can the message be revealed.
            </p>
            <button
              onClick={() => navigate('couple')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-medium no-underline
                         transition-all duration-300 hover:shadow-[0_0_40px_rgba(225,120,140,0.3)]"
              style={{ background: 'linear-gradient(135deg, #e11d48 0%, #8b5cf6 50%, #6366f1 100%)' }}
            >
              <Smartphone className="w-4 h-4" />
              Explore Couple Mode
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </ScrollReveal>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center">
        <p className="font-serif italic text-2xl text-white/35 mb-6">
          &ldquo;Some things are worth waiting for.&rdquo;
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('seal')}
            className="px-8 py-4 rounded-2xl text-white text-sm font-medium no-underline
                       transition-all duration-300 hover:shadow-[0_0_60px_rgba(225,120,140,0.35)] hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #e11d48 0%, #8b5cf6 50%, #6366f1 100%)' }}
          >
            Seal a Message
          </button>
          <button
            onClick={() => navigate('unlock')}
            className="px-8 py-4 rounded-2xl border border-white/[0.08] text-white/45
                       hover:text-white/80 hover:border-white/[0.15] text-sm no-underline
                       transition-all duration-300 flex items-center justify-center gap-2 bg-transparent"
          >
            Unlock a Photo
          </button>
        </div>
      </section>
    </div>
  );
}
