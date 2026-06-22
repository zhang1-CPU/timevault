import { EncryptPanel } from '../components/EncryptPanel';
import { usePageMeta } from '../hooks/usePageMeta';
import type { Page } from '../App';

export function SealPage({ navigate }: { navigate: (to: Page) => void }) {
  usePageMeta({
    title: 'Seal a Message in a Photo — TimeVault',
    description: 'Write a message, hide it inside any photo, and choose a future date when it can be opened. Client-side AES-256 encryption with a cryptographic time-lock.',
    canonicalPath: 'seal',
  });
  return <EncryptPanel onBack={() => navigate('home')} />;
}
