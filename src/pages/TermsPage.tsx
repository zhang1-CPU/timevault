import { usePageMeta } from '@/lib/usePageMeta';
import type { Page } from '../App';

export function TermsPage({ navigate }: { navigate: (to: Page) => void }) {
  usePageMeta(
    'Terms of Service — TimeVault',
    'Terms of Service for TimeVault — a free, browser-side privacy tool. Your use of this service is subject to these terms.'
  );

  return (
    <div className="pt-20 sm:pt-24 animate-page-enter">
      <section className="py-16 sm:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl sm:text-5xl mb-3">
            <span className="gradient-text">Terms of Service</span>
          </h1>
          <p className="text-white/25 text-sm mb-10 font-light">
            Last updated: June 19, 2026 · Effective date: June 19, 2026
          </p>

          <div className="space-y-10 text-white/30 text-sm leading-relaxed font-light">
            {/* 1 */}
            <Section
              title="1. Acceptance of Terms"
              paragraphs={[
                'By accessing or using TimeVault ("the Service") you agree to be bound by these Terms of Service. If you disagree with any part of the terms, please discontinue your use.',
                'The Service is provided free of charge, for personal, non-commercial use. You may use it on as many devices as you like; you may share sealed photos with anyone you choose.',
                'These Terms apply to every visitor and user of the Service, regardless of whether you have created an account (no account is required to use the core service).',
              ]}
            />

            {/* 2 */}
            <Section
              title="2. What the Service Does"
              paragraphs={[
                'TimeVault is a software utility that runs entirely in your web browser. It lets you:',
                '• Hide a text message inside a photograph, encrypted with a personal PIN (AES-256-GCM) and optionally time-locked with the drand distributed beacon.',
                '• Retrieve a previously hidden message from a photograph you hold, by entering the correct PIN at the correct time.',
                '• Use a two-person ("Couple") mode where a single photo can only be unlocked after both parties have added their PIN.',
                'TimeVault does not upload, store, or forward your photos or messages. The cryptographic operation happens on your device; we do not have the ability to read what you have sealed.',
              ]}
            />

            {/* 3 */}
            <Section
              title="3. User Responsibilities and Acceptable Use"
              paragraphs={[
                'You are responsible for the content you choose to seal inside a photograph. You agree not to use the Service:',
                '• to hide, transmit, or distribute illegal content including but not limited to malware, unlawful harassment, non-consensual explicit material, or instructions for criminal activity;',
                '• to violate the legal rights of any other person, including copyright, trademark, privacy, or publicity rights;',
                '• to attempt to reverse-engineer, exploit, or compromise the Service, its hosting infrastructure, or any third-party beacon it depends on;',
                '• in any way that imposes an unreasonable or disproportionately large load on the hosting infrastructure.',
                'The Service is intended for private, personal use. Commercial redistribution, resale, or bundling of TimeVault into a paid product is not permitted without our written agreement.',
              ]}
            />

            {/* 4 */}
            <Section
              title="4. Intellectual Property"
              paragraphs={[
                'The TimeVault brand name, logo, typography, and website design are owned by us. You may not copy, reproduce, or resell the Service or its visual identity.',
                'The software uses a number of open-source libraries, including cryptographic libraries. Their respective licenses and attributions govern those components.',
                'You retain full ownership of any photograph you upload and any message you write inside it. TimeVault claims no intellectual property rights over your content.',
              ]}
            />

            {/* 5 */}
            <Section
              title="5. Third-Party Dependencies"
              paragraphs={[
                'The Service relies on third-party infrastructure that is outside our control. In particular:',
                '• drand distributed randomness beacon (drand.love) — a public, independently-operated network that provides verifiable randomness used by the time-lock feature.',
                '• Your web browser\'s built-in Web Crypto API, which performs the AES-256-GCM encryption.',
                '• The static hosting provider (typically Cloudflare Pages or GitHub Pages) who deliver the HTML/CSS/JavaScript to your browser.',
                'We trust these dependencies but cannot make guarantees about them. A failure, outage, or change of behaviour in any third-party service may affect the behaviour of TimeVault.',
              ]}
            />

            {/* 6 */}
            <Section
              title='6. No Warranty — the Service Is Provided "AS IS"'
              paragraphs={[
                'TimeVault is provided without warranty of any kind — express, implied, or statutory. This includes, but is not limited to, implied warranties of merchantability, fitness for a particular purpose, and non-infringement.',
                'We do not guarantee that the Service will be uninterrupted, error-free, or permanently available. We do not guarantee that any particular sealed photo will be decryptable at a future date, because factors outside our control (for example: the user loses the original photo, forgets the PIN, uses a browser that no longer supports the Web Crypto API, or the drand network changes its protocol) can affect decryption.',
                'You use the Service at your own risk.',
              ]}
            />

            {/* 7 */}
            <Section
              title="7. Limitation of Liability"
              paragraphs={[
                'To the fullest extent permitted by applicable law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation loss of data, loss of profits, emotional distress, or any other personal or commercial harm.',
                'In particular, we accept no responsibility for lost messages, forgotten PINs, corrupted photos, or any other consequence of using the Service — these remain your responsibility.',
                'Our total liability for any claim arising out of or relating to these terms is limited to the greater of (a) the amount paid by you for the Service in the twelve months preceding the claim, or (b) ten United States dollars (USD 10).',
                'Some jurisdictions do not allow the exclusion of consequential or incidental damages, so this limitation may not apply to you.',
              ]}
            />

            {/* 8 */}
            <Section
              title="8. Your Privacy"
              paragraphs={[
                'Your privacy is a core design principle of the Service. Please refer to our separate Privacy Policy, which forms part of these Terms. The short version: we collect nothing, store nothing, and see nothing of your messages.',
              ]}
            />

            {/* 9 */}
            <Section
              title="9. Changes to the Service or Terms"
              paragraphs={[
                'We may modify or discontinue the Service, or any feature within it, at any time without notice. We may also revise these Terms from time to time. When we do, we will update the "Last updated" date at the top of this page and, for material changes, add a short notice on the homepage.',
                'Your continued use of TimeVault after a revision constitutes acceptance of the revised terms.',
              ]}
            />

            {/* 10 */}
            <Section
              title="10. Termination"
              paragraphs={[
                'You may stop using the Service at any time, without notice. We may terminate or restrict access to the Service if you violate these Terms or engage in conduct that, in our reasonable judgment, is harmful to other users or to the Service itself.',
                'Upon termination, the rights granted to you in these Terms cease immediately. Any sealed photos you have already created continue to exist on your device and remain your property.',
              ]}
            />

            {/* 11 */}
            <Section
              title="11. Governing Law and Dispute Resolution"
              paragraphs={[
                'These Terms shall be governed by the laws of the jurisdiction in which the operating entity is registered. For clarity, all legal correspondence should be directed to the contact email listed below.',
                'You agree that any dispute arising from these Terms will first be addressed through good-faith negotiation, and only if that fails through binding arbitration or the courts of the governing jurisdiction.',
              ]}
            />

            {/* 12 */}
            <Section
              title="12. Entire Agreement"
              paragraphs={[
                'These Terms of Service, together with the Privacy Policy, constitute the entire agreement between you and TimeVault regarding your use of the Service and supersede any prior agreements, communications, or understandings.',
              ]}
            />

            {/* 13 */}
            <Section
              title="13. Contact"
              paragraphs={[
                'Questions about these Terms, or requests to use TimeVault under different terms (for example, for educational or non-commercial research), should be sent to:',
                'legal@timevault.online',
                'We aim to reply within five business days.',
              ]}
            />

            <div className="pt-6 flex justify-center">
              <button
                onClick={() => navigate('home')}
                className="text-white/35 hover:text-white/60 text-xs transition-colors font-light border-none bg-transparent cursor-pointer"
              >
                ← Back to home
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  return (
    <div>
      <h2 className="text-white/55 font-serif text-xl sm:text-2xl mb-3">{title}</h2>
      <div className="space-y-2.5">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}
