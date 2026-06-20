import { useEffect } from 'react';

/**
 * Scroll the page back to top whenever any of the provided dependencies change.
 * Used to ensure step progression in Seal/Unlock/Couple flows always starts
 * the user at the top of the new step.
 */
export function useScrollToTop(deps: ReadonlyArray<unknown> = []) {
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    } catch {
      window.scrollTo(0, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Cross-browser/mobile-safe download for images and files.
 * Works reliably on Android Chrome WebView, Samsung Internet, and iOS Safari.
 */
export async function downloadBlob(
  blob: Blob,
  filename: string,
): Promise<void> {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const url = URL.createObjectURL(blob);

  try {
    if (isMobile) {
      // Mobile: open blob in new tab so browser shows native
      // download / save image / share sheet. This is more reliable
      // than programmatic clicks on mobile browsers.
      window.open(url, '_blank', 'noopener');
    } else {
      // Desktop: use click-based download with "download" attribute
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 100);
    }
  } catch (e) {
    // Last resort fallback
    try {
      window.location.href = url;
    } catch { /* noop */ }
  } finally {
    // Delay cleanup to allow browser to initiate download first
    setTimeout(() => {
      try { URL.revokeObjectURL(url); } catch { /* noop */ }
    }, 5000);
  }
}
