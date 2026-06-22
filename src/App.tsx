// TimeVault App — SPA with pathname + hash routing support
import { useState, useCallback, useEffect, useLayoutEffect } from 'react';
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
import { BlogPage } from './pages/BlogPage';
import { MessagePage } from './pages/MessagePage';
import AdminPage from './pages/AdminPage';

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
  | 'contact'
  | 'blog'
  | 'messages'
  | 'admin';

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
  blog: 'blog',
  messages: 'messages',
  admin: 'admin',
};

const parsePath = (): Page => {
  const search = window.location.search;
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (path.startsWith('couple-') || search.includes('couple-')) return 'couple';
  if (path === '') return 'home';
  return ROUTE_MAP[path] ?? 'home';
};

// Force-scroll the window to absolute top — called multiple times to beat
// mobile browsers restoring the previous scroll position.
function scrollToTopNow() {
  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  } catch {
    window.scrollTo(0, 0);
  }
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function usePageRoute() {
  const [page, setPage] = useState<Page>(() => parsePath());

  const navigate = useCallback((to: Page) => {
    const url = to === 'home' ? '/' : `/${to}`;
    window.history.pushState({}, '', url);
    setPage(to);
  }, []);

  // Scroll to top whenever the page changes — use useLayoutEffect for DOM-integrated
  // reset, plus fall-back timers to beat any delayed browser scroll-restoration.
  useLayoutEffect(() => {
    scrollToTopNow();
  }, [page]);

  useEffect(() => {
    const t1 = window.setTimeout(scrollToTopNow, 0);
    const t2 = window.setTimeout(scrollToTopNow, 50);
    const t3 = window.setTimeout(scrollToTopNow, 200);
    const t4 = window.setTimeout(scrollToTopNow, 400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, [page]);

  useEffect(() => {
    const handler = () => {
      setPage(parsePath());
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  return { page, navigate };
}

export default function App() {
  const { page, navigate } = usePageRoute();

  // Admin page has its own layout — no wrapper needed
  if (page === 'admin') {
    return <AdminPage />;
  }

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
      {page === 'blog' && <BlogPage navigate={navigate} />}
      {page === 'messages' && <MessagePage navigate={navigate} />}
    </Layout>
  );
}
// Deployment trigger: Mon Jun 22 01:40:31 UTC 2026
