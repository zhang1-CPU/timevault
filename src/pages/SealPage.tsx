import { EncryptPanel } from '../components/EncryptPanel';
import type { Page } from '../App';

export function SealPage({ navigate }: { navigate: (to: Page) => void }) {
  return <EncryptPanel onBack={() => navigate('home')} />;
}
