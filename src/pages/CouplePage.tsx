import { CoupleMode } from '../components/CoupleMode';
import type { Page } from '../App';

export function CouplePage({ navigate }: { navigate: (to: Page) => void }) {
  return <CoupleMode onBack={() => navigate('home')} onHome={() => navigate('home')} />;
}
