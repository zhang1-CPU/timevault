import { DecryptPanel } from '../components/DecryptPanel';
import { usePageMeta } from '../hooks/usePageMeta';
import type { Page } from '../App';

export function UnlockPage({ navigate }: { navigate: (to: Page) => void }) {
  usePageMeta({
    title: 'Open Your Sealed Message — TimeVault',
    description: 'Upload a TimeVault photo and enter your 4-digit PIN to reveal the message on or after the chosen date. Cryptographic time-lock guarantee.',
    canonicalPath: 'unlock',
  });
  return <DecryptPanel onBack={() => navigate('home')} />;
}
