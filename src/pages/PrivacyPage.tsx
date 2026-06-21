import { usePageMeta } from '@/lib/usePageMeta';
import type { Page } from '../App';

export function PrivacyPage({ navigate }: { navigate: (to: Page) => void }) {
  usePageMeta(
    'Privacy Policy — TimeVault',
    'TimeVault privacy policy — what we collect (nothing), how encryption works in-browser, third-party infrastructure, cookie policy, and your data rights.'
  );

  return (
    <div className="pt-20 sm:pt-24 animate-page-enter">
      <section className="py-16 sm:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl sm:text-5xl mb-3">
            <span className="gradient-text">Privacy Policy</span>
          </h1>
          <p className="text-white/25 text-sm mb-10 font-light">
            Last updated: June 19, 2026 · Effective date: June 19, 2026
          </p>

          <div className="space-y-10 text-white/30 text-sm leading-relaxed font-light">
            {/* ──────────── 1. INTRODUCTION ──────────── */}
            <Section
              title="1. Introduction"
              paragraphs={[
                'TimeVault ("we", "us", or "our") is a free, privacy-first web application that lets you hide encrypted messages inside photographs. The entire application runs inside your web browser. There is no server-side processing of your content — no photo upload, no cloud storage, no analytics pipeline, no tracking cookie.',
                'This Privacy Policy explains what information is processed, where it is processed, and what choices you have. Because TimeVault is designed to store and collect as little as possible, this document is intentionally short. If you have any question about it, please email us at privacy@timevault.online.',
                'By using TimeVault you agree to the practices described in this policy. If you do not agree, please discontinue use of the service.',
              ]}
            />

            {/* ──────────── 2. INFORMATION WE PROCESS ──────────── */}
            <Section
              title="2. Information We Process"
              paragraphs={[
                'TimeVault is intentionally minimal in the data it touches. The application runs entirely in your browser, which means your messages, your PIN, and your photographs never travel to us. Specifically:',
                '• Your photograph: processed on your device only. The image data is read through the browser\'s FileReader API, embedded with your hidden message, and offered back to you as a downloadable file.',
                '• Your message: encrypted inside your browser with AES-256-GCM before being hidden in the image. We do not see, store, or log any part of the plaintext message.',
                '• Your PIN: derived locally in your browser using PBKDF2 (100,000 iterations). The PIN itself is never transmitted, never logged, never stored by us.',
                '• The drand public randomness: to enable the time-lock feature we contact drand.love, a public, independently-audited randomness beacon. The request is a public HTTP call; the response contains only a cryptographic signature and round number. No personal data is sent or received in this call.',
                'In short: the only information "processed" is information that you choose to type or upload, on your own device. We never receive it.',
              ]}
            />

            {/* ──────────── 3. INFORMATION WE DO NOT COLLECT ──────────── */}
            <Section
              title="3. Information We Do NOT Collect"
              paragraphs={[
                'We think it is worth listing explicitly what we do not do, because many privacy policies are silent on this point:',
                '• We do not collect your IP address (beyond the normal behaviour of static hosting).',
                '• We do not use advertising identifiers, fingerprinting scripts, or third-party trackers.',
                '• We do not store, share, or sell any personal information — because we have no personal information to share.',
                '• We do not set any HTTP cookies for tracking, analytics, or advertising.',
                '• We do not require you to create an account, provide an email address, or log in to use the core service.',
              ]}
            />

            {/* ──────────── 4. COOKIES AND LOCAL STORAGE ──────────── */}
            <Section
              title="4. Cookies and Local Storage"
              paragraphs={[
                'TimeVault does not use HTTP cookies for tracking or advertising.',
                'The application may write small amounts of data to your browser\'s localStorage, for example to remember your preferred language or theme setting. This information stays on your device; you can clear it at any time from your browser settings (typically under "Privacy" or "Site Data").',
                'We do not read localStorage from third parties and we do not share it with anyone.',
              ]}
            />

            {/* ──────────── 5. THIRD-PARTY SERVICES ──────────── */}
            <Section
              title="5. Third-Party Services"
              paragraphs={[
                'We rely on a small number of third-party services to deliver TimeVault. Each is listed here with its purpose and the data it may see:',
                '• Hosting: this site is served through static hosting (GitHub Pages). These providers may keep standard access logs (IP, user agent, requested URL) for a limited time to protect against abuse. This is a standard feature of web hosting and does not contain the content of your messages.',
                '• drand time-lock beacon: when you encrypt or decrypt a time-locked message, your browser requests a public round value from drand.love. No personal data is sent; the response is public randomness.',
                '• Optional email reminder: if you choose to leave an email address so that TimeVault can notify you on the unlock date, that email is stored only for this purpose and is deleted on request. Providing an email address is strictly optional.',
                'Except for the items above, we do not integrate with third-party analytics, advertising networks, or social sharing SDKs.',
              ]}
            />

            {/* ──────────── 6. DATA SECURITY ──────────── */}
            <Section
              title="6. Data Security"
              paragraphs={[
                'Because the service is browser-side, the security of your message is primarily a matter of browser security. We recommend that you always run an up-to-date web browser on a protected device.',
                'Cryptographically, we use the Web Crypto API, which delegates AES-256-GCM to your browser\'s hardened implementation. The time-lock relies on drand\'s threshold BLS signatures, which are publicly verifiable.',
                'We do not claim our implementation is infallible, but we believe it provides meaningful protection against routine observation. If you discover a security issue, please disclose it privately to security@timevault.online before publishing — we will acknowledge and fix verified issues within 30 days.',
              ]}
            />

            {/* ──────────── 7. YOUR RIGHTS ──────────── */}
            <Section
              title="7. Your Rights Under GDPR, CCPA, and Similar Laws"
              paragraphs={[
                'Even though TimeVault stores very little data about you, the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), and other regional laws grant you rights including the right to access, correct, delete, export, or restrict the processing of your personal data.',
                'Because we do not collect personal data in the first place, most of these rights are trivially satisfied — there is no personal dataset for us to hand over. If you previously submitted an email address to the optional reminder service and would like it erased, email privacy@timevault.online and we will confirm deletion within 14 days.',
                'You may also complain to your local data protection authority if you are dissatisfied with our response.',
              ]}
            />

            {/* ──────────── 8. CHILDREN'S PRIVACY ──────────── */}
            <Section
              title="8. Children\'s Privacy"
              paragraphs={[
                'TimeVault is a general-purpose tool and is not directed at children. We do not knowingly collect or solicit personal information from anyone under the age of 13, or the minimum age required by law in their country, whichever is higher.',
                'If you believe a child has sent us personal information, please contact privacy@timevault.online and we will delete it promptly.',
              ]}
            />

            {/* ──────────── 9. INTERNATIONAL USERS ──────────── */}
            <Section
              title="9. International Users"
              paragraphs={[
                'TimeVault is accessible worldwide. Because nothing is stored on our servers, there is no cross-border data transfer of personal data in the traditional sense.',
                'If you are a resident of the European Economic Area, please note that drand\'s public beacon nodes are operated by independent entities in multiple countries. All data returned by them is public randomness and does not identify you.',
                'We host our static files on infrastructure that may be located outside your country of residence, including potentially the United States or the European Union.',
              ]}
            />

            {/* ──────────── 10. DATA RETENTION ──────────── */}
            <Section
              title="10. Data Retention"
              paragraphs={[
                'Core service: we retain nothing. Sealed photos live on your device or wherever you choose to store them.',
                'Optional email reminder: if you opt in, we retain your email address and the unlock date only until the reminder has been sent, or until you request deletion — whichever comes first.',
                'Server access logs: the hosting provider typically retains standard HTTP access logs for between 7 and 30 days. These logs contain the requested URL and requester IP; they do not contain message content.',
              ]}
            />

            {/* ──────────── 11. CHANGES TO THIS POLICY ──────────── */}
            <Section
              title="11. Changes to This Policy"
              paragraphs={[
                'We may update this Privacy Policy from time to time to reflect a change in the service, the law, or both. When we do, we will revise the "Last updated" date at the top of this page.',
                'For material changes we will add a short notice on the homepage. Your continued use of TimeVault after any update means you accept the revised policy.',
              ]}
            />

            {/* ──────────── 12. CONTACT ──────────── */}
            <Section
              title="12. Contact"
              paragraphs={[
                'Questions, requests, or concerns about this policy, or about anything else related to privacy at TimeVault, should be sent to:',
                'privacy@timevault.online',
                'We read and respond to every message, and we aim to reply within five business days.',
              ]}
            />

            {/* Back to home CTA */}
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
