import { DecryptPanel } from '../components/DecryptPanel';
import type { Page } from '../App';

export function UnlockPage({ navigate }: { navigate: (to: Page) => void }) {
  return <DecryptPanel onBack={() => navigate('home')} />;
}
