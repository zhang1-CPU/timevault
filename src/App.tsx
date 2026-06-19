import { useState, useCallback, useEffect } from 'react';
import { Layout } from './layouts/Layout';
import { HomePage } from './pages/HomePage';
import { SealPage } from './pages/SealPage';
import { UnlockPage } from './pages/UnlockPage';
import { CouplePage } from './pages/CouplePage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { StoriesPage } from './pages/StoriesPage';
import { FaqPage } from './pages/FaqPage';
import { AboutPage } from './pages/AboutPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { ContactPage } from './pages/ContactPage';

export type Page =
  | 'home'
  | 'seal'
  | 'unlock'
  | 'couple'
  | 'how-it-works'
  | 'stories'
  | 'faq'
  | 'about'
  | 'privacy'
  | 'terms'
  | 'contact';

// Centralized routing table — used for both initial parse and hash-change events.
const ROUTE_MAP: Record<string, Page> = {
  seal: 'seal',
  unlock: 'unlock',
  couple: 'couple',
  'how-it-works': 'how-it-works',
  stories: 'stories',
  faq: 'faq',
  about: 'about',
  privacy: 'privacy',
  terms: 'terms',
  contact: 'contact',
};

const parseHash = (): Page => {
  const hash = window.location.hash.replace('#', '').replace('/', '');
  return ROUTE_MAP[hash] ?? 'home';
};

function usePageRoute() {
  const [page, setPage] = useState<Page>(() => parseHash());

  const navigate = useCallback((to: Page) => {
    window.location.hash = to === 'home' ? '' : `/${to}`;
    setPage(to);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handler = () => {
      setPage(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return { page, navigate };
}

export default function App() {
  const { page, navigate } = usePageRoute();

  return (
    <Layout page={page} navigate={navigate}>
      {page === 'home' && <HomePage navigate={navigate} />}
      {page === 'seal' && <SealPage navigate={navigate} />}
      {page === 'unlock' && <UnlockPage navigate={navigate} />}
      {page === 'couple' && <CouplePage navigate={navigate} />}
      {page === 'how-it-works' && <HowItWorksPage navigate={navigate} />}
      {page === 'stories' && <StoriesPage navigate={navigate} />}
      {page === 'faq' && <FaqPage navigate={navigate} />}
      {page === 'about' && <AboutPage navigate={navigate} />}
      {page === 'privacy' && <PrivacyPage navigate={navigate} />}
      {page === 'terms' && <TermsPage navigate={navigate} />}
      {page === 'contact' && <ContactPage navigate={navigate} />}
    </Layout>
  );
}
