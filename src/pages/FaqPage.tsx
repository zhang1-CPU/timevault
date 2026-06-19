import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ScrollReveal } from '../hooks/useScrollReveal';
import type { Page } from '../App';

type QA = { q: string; a: string };

const FAQS: QA[] = [
  {
    q: 'What exactly is TimeVault?',
    a: 'TimeVault is a free, privacy-first web app that lets you hide encrypted messages inside photos. You choose when the message can be opened — locked by time itself. Everything happens in your browser. We store nothing on our servers.',
  },
  {
    q: 'How does the time-lock encryption work?',
    a: "We use drand's publicly verifiable random beacon to create a mathematical time-lock. When you seal a message, it's encrypted using your PIN (AES-256-GCM), then a second layer of encryption is applied using the drand beacon at your chosen unlock date. Even we cannot decrypt it before that time.",
  },
  {
    q: 'Is my message really hidden inside the photo?',
    a: 'Yes. We use LSB (Least Significant Bit) steganography to embed your encrypted message into the pixels of the image. The photo looks completely unchanged — same size, same quality, same appearance. Only someone who knows to look can detect it.',
  },
  {
    q: 'Where is my data stored?',
    a: 'Nowhere on our servers. Your message, your PIN, and your photo never leave your device. We use the browser\'s Web Crypto API. The only thing transmitted over the network is the drand beacon\'s public randomness — which is public by design.',
  },
  {
    q: 'What happens if I lose the photo or forget my PIN?',
    a: 'Unfortunately, if you lose the sealed photo or forget your PIN, there is no way to recover the message. We do not store any data. This is by design — it\'s what makes TimeVault truly private. Please keep your sealed photo and PIN safe.',
  },
  {
    q: 'Can I seal a message for more than 10 years?',
    a: 'Currently, the maximum lock duration is 10 years. The tlock library we use is designed for this range. For longer-term time capsules, we recommend a different approach — or returning to TimeVault when the 10-year limit is extended.',
  },
  {
    q: 'What is Couple Mode?',
    a: 'Couple Mode lets two people create a shared secret photo. The photo is split into two halves using visual cryptography — each person holds one half. Only when both halves are reunited can the message be revealed. Perfect for anniversary gifts or long-distance relationships.',
  },
  {
    q: 'Is TimeVault really free?',
    a: 'Yes, completely free. No account, no email, no data collection. We are supported by donations and the belief that privacy tools should be accessible to everyone.',
  },
  {
    q: 'Can I use TimeVault on my phone?',
    a: 'Absolutely. TimeVault is built to work beautifully on both desktop and mobile browsers. The interface adapts to your screen. For the best experience with Couple Mode, we recommend using a mobile browser.',
  },
  {
    q: 'Who can see my sealed photos?',
    a: 'Anyone who receives the photo can see it — it looks like a completely normal image. They cannot tell it contains a hidden message without running steganalysis tools. Your message is encrypted, so even if someone extracts the hidden data, they cannot read it without the PIN and the unlock time.',
  },
  {
    q: 'Does TimeVault work offline?',
    a: 'Once the page is loaded, most features work offline. However, the initial page load and the time-lock encryption/decryption process require a connection to verify the drand beacon.',
  },
  {
    q: 'How is this different from a password-protected ZIP file?',
    a: 'A ZIP file with a password can be decrypted at any time — passwords can be cracked. TimeVault\'s time-lock makes it mathematically impossible to decrypt before your chosen date, even with unlimited computing power. Your PIN is your key, but time itself is the second lock.',
  },
  {
    q: 'How is this different from emailing a letter and scheduling it?',
    a: 'Scheduled email relies on a third-party company that stores your message, reads its content for spam classification, and can be subpoenaed, hacked, or go out of business. With TimeVault, the sealed photo lives wherever you keep it — in your photo album, on your hard drive, with your loved one. There is no intermediary, no server, and nothing to subpoena.',
  },
  {
    q: 'Why use photos and not just text?',
    a: 'Photos are a timeless, universally-recognised carrier of memory. A photo with a hidden message is a true physical time capsule that doubles as something beautiful — something people actually want to print, frame, and share. A text-only time capsule, by comparison, feels more like a password file.',
  },
  {
    q: 'What browsers and devices are supported?',
    a: 'TimeVault works on any modern browser that supports the Web Crypto API and Canvas. This includes recent versions of Chrome, Safari, Firefox, Edge, Brave, and their mobile equivalents on iOS and Android. We recommend keeping your browser up to date for the best experience.',
  },
  {
    q: 'How large can my message be?',
    a: 'There is no hard limit enforced by the app. However, the message is encoded inside the image pixels, so the physical size of the photo imposes the practical limit. A standard smartphone photo (several megabytes) can easily carry a message of many thousands of words — long enough for a detailed letter, a poem, a will, or even a short list of coordinates.',
  },
  {
    q: 'Can I edit or re-save the photo after sealing?',
    a: 'You can — but the hidden message is fragile. Any re-encoding (such as re-saving as a different JPEG quality, cropping, or applying heavy filters) may destroy part or all of the hidden data. For best results, keep the original sealed photo unchanged. If you want to share it on social media, consider posting a thumbnail or a separate copy and keeping the original in a safe place.',
  },
  {
    q: 'Is it possible to hack or brute-force a sealed message?',
    a: 'TimeVault combines AES-256-GCM (a standard, NIST-approved cipher) with a drand time-lock. AES-256-GCM is considered unbreakable with current computing technology; the drand time-lock ensures that decryption is mathematically impossible before the chosen date. Your PIN adds a third, personal factor. There is no known practical way to bypass these protections.',
  },
  {
    q: 'Why do you need a PIN? Isn\'t time-lock enough?',
    a: 'The PIN is a user-specific key — it ensures that even if someone else discovers the drand unlock value, they still cannot read your message without your PIN. It also allows you to re-seal a message multiple times, or to share the photo with someone while controlling who can actually open it. Think of it as: the PIN is the door, and the time-lock is the wall.',
  },
  {
    q: 'What should I choose as my PIN?',
    a: 'Any memorable phrase — a favorite line from a poem, a private joke, a special date, or a meaningful word. We recommend at least 6 characters. Because the PIN stays on your device only, there is no "reset your password" link, so make sure you write it down somewhere safe, or choose something you genuinely will not forget.',
  },
];

export function FaqPage({ navigate }: { navigate: (to: Page) => void }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Frequently Asked Questions — TimeVault';

    const jsonLd = document.createElement('script');
    jsonLd.type = 'application/ld+json';
    jsonLd.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.a,
        },
      })),
    });
    document.head.appendChild(jsonLd);

    const metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    metaDesc.content =
      'Answers to the most common questions about TimeVault — time-lock encryption, steganography, data privacy, the couple mode, and more.';
    document.head.appendChild(metaDesc);

    return () => {
      document.head.removeChild(jsonLd);
      document.head.removeChild(metaDesc);
    };
  }, []);

  return (
    <div className="pt-20 sm:pt-24 animate-page-enter">
      <section className="py-16 sm:py-20 px-6 text-center">
        <p className="text-rose-200/35 text-[11px] tracking-[0.4em] uppercase mb-4 font-light">Questions &amp; Answers</p>
        <h1 className="font-serif text-5xl sm:text-6xl font-light mb-5">
          <span className="gradient-text">Frequently Asked</span>
        </h1>
        <p className="text-white/30 max-w-md mx-auto font-light text-sm leading-relaxed">
          Everything you wanted to know about TimeVault — time-lock encryption, steganography, data privacy, and more.
        </p>
      </section>

      <section className="pb-16 px-6">
        <ScrollReveal className="max-w-3xl mx-auto space-y-3" staggerDelay={50}>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="glass-romantic rounded-xl overflow-hidden transition-all duration-300 reveal-item"
              style={{ transitionDelay: `${i * 20}ms` }}
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4
                           text-white/70 hover:text-white/90 transition-colors duration-200 bg-transparent border-none cursor-pointer"
              >
                <span className="font-light text-sm sm:text-base leading-snug">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${openIdx === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openIdx === i && (
                <div
                  className="px-5 pb-5"
                  style={{ animation: 'page-enter 0.45s cubic-bezier(0.22,1,0.36,1) forwards' }}
                >
                  <div className="h-px bg-white/[0.04] mb-4" />
                  <p className="text-white/30 text-sm leading-relaxed font-light">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </ScrollReveal>
      </section>

      <section className="pb-16 px-6 text-center">
        <ScrollReveal staggerDelay={0}>
          <div className="max-w-md mx-auto glass-romantic rounded-2xl p-6 border border-white/[0.04] reveal-item">
            <p className="text-white/30 font-light text-sm mb-4">Still have questions? Reach out anytime.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('contact')}
                className="px-6 py-3 rounded-xl text-white/50 text-sm hover:text-white/80
                           border border-white/[0.08] hover:border-white/[0.15] no-underline
                           transition-all duration-300 bg-transparent border-[1px] cursor-pointer"
              >
                Contact Us
              </button>
              <button
                onClick={() => navigate('seal')}
                className="px-6 py-3 rounded-xl text-white text-sm no-underline transition-all duration-300 text-center bg-transparent border-none cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #e11d48, #8b5cf6)' }}
              >
                Try It Now
              </button>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
