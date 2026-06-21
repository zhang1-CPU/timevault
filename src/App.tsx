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

const parsePath = (): Page => {
  // Parse both the pathname and any search query for couple-* deep links
  // (e.g. /couple-b?sid=… works for QR code sharable URLs).
  const search = window.location.search;
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (path.startsWith('couple-') || search.includes('couple-')) return 'couple';
  if (path === '') return 'home';
  return ROUTE_MAP[path] ?? 'home';
};

function usePageRoute() {
  const [page, setPage] = useState<Page>(() => parsePath());

  const navigate = useCallback((to: Page) => {
    const url = to === 'home' ? '/' : `/${to}`;
    window.history.pushState({}, '', url);
    setPage(to);
    // Use setTimeout to ensure scroll happens after React render completes
    setTimeout(() => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    }, 50);
  }, []);

  useEffect(() => {
    const handler = () => {
      setPage(parsePath());
      // Use setTimeout to ensure scroll happens after React render completes
      setTimeout(() => {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        window.scrollTo(0, 0);
      }, 50);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
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
