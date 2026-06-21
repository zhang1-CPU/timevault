import { useEffect } from 'react';

/**
 * Set page <title> and <meta name="description"> on mount.
 * Cleans up on unmount so the SPA doesn't end up with multiple
 * description tags after route changes.
 */
export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    const prevTitle = document.title;

    // Update or create <title>
    document.title = title;

    // Update or create description meta tag
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const created: HTMLElement[] = [];

    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
      created.push(meta);
    }
    const prevDesc = meta.content;
    meta.content = description;

    // Update or create og:title and og:description
    let ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
      created.push(ogTitle);
    }
    const prevOgTitle = ogTitle.content;
    ogTitle.content = title;

    let ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null;
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
      created.push(ogDesc);
    }
    const prevOgDesc = ogDesc.content;
    ogDesc.content = description;

    // Cleanup on unmount — restore previous values
    return () => {
      document.title = prevTitle;
      if (meta) meta.content = prevDesc;
      if (ogTitle) ogTitle.content = prevOgTitle;
      if (ogDesc) ogDesc.content = prevOgDesc;
      // Remove any tags we created (they didn't exist in index.html)
      created.forEach((el) => {
        try {
          document.head.removeChild(el);
        } catch {
          // ignore — already removed
        }
      });
    };
  }, [title, description]);
}
