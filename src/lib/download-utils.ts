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
      // Mobile strategy: open blob URL directly — most mobile browsers
      // will trigger download/share sheet when navigating to blob URL
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.rel = 'noopener';
      link.target = '_self';
      document.body.appendChild(link);
      link.click();
      // Also try direct navigation as backup
      window.location.href = url;
    } else {
      // Desktop: use click-based download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
    }
  } catch (e) {
    // Last resort: direct navigation
    try {
      window.location.href = url;
    } catch { /* noop */ }
  } finally {
    // Clean up after delay to give browser time to start download
    setTimeout(() => {
      try { URL.revokeObjectURL(url); } catch { /* noop */ }
      try { if (document.body.contains(document.querySelector(`a[href="${url}"]`))) document.body.removeChild(document.querySelector(`a[href="${url}"]`)!); } catch { /* noop */ }
    }, 3000);
  }
}
