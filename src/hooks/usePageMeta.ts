// TimeVault — Page-level SEO meta helper. 2026-06-22
// Lightweight wrapper: sets document.title + meta description + canonical + OG tags.
// Pure side-effect — no state, no re-renders, does not touch any existing component logic.
import { useEffect } from 'react';

interface PageMetaOptions {
  title: string;
  description: string;
  canonicalPath?: string; // e.g. "seal" or "how-it-works"
  ogImageUrl?: string;
}

function upsertMeta(name: string, content: string, isProperty = false) {
  if (typeof document === 'undefined') return;
  const attr = isProperty ? 'property' : 'name';
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function usePageMeta({ title, description, canonicalPath, ogImageUrl }: PageMetaOptions) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.title = title;

    upsertMeta('description', description);

    // Canonical
    const fullCanonical = `https://timevault.online/${
      canonicalPath ? canonicalPath.replace(/^\/+|\/+$/g, '') + '/' : ''
    }`;
    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', fullCanonical);

    // Open Graph
    upsertMeta('og:title', title, true);
    upsertMeta('og:description', description, true);
    upsertMeta('og:url', fullCanonical, true);
    upsertMeta('og:type', 'website', true);
    upsertMeta('og:site_name', 'TimeVault', true);
    if (ogImageUrl) upsertMeta('og:image', ogImageUrl, true);

    // Twitter
    upsertMeta('twitter:card', 'summary_large_image');
    upsertMeta('twitter:title', title);
    upsertMeta('twitter:description', description);
  }, [title, description, canonicalPath, ogImageUrl]);
}
