import { CoupleMode } from '../components/CoupleMode';
import { usePageMeta } from '../hooks/usePageMeta';
import type { Page } from '../App';

export function CouplePage({ navigate }: { navigate: (to: Page) => void }) {
  usePageMeta({
    title: 'Couple Mode — Co-Create a Time-Locked Letter Together',
    description: 'Two people, one photo, one shared moment locked in time. Both contribute to a message sealed until a shared anniversary or milestone.',
    canonicalPath: 'couple',
  });
  return <CoupleMode onBack={() => navigate('home')} onHome={() => navigate('home')} />;
}
