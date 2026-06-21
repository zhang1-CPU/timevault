import { useEffect } from 'react';

/**
 * Scroll the page back to top whenever any of the provided dependencies change.
 * Used to ensure step progression in Seal/Unlock/Couple flows always starts
 * the user at the top of the new step.
 */
export function useScrollToTop(deps: ReadonlyArray<unknown> = []) {
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        window.scrollTo(0, 0);
      } catch {
        window.scrollTo(0, 0);
      }
    }, 50);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Cross-browser/mobile-safe download for images and files.
 *
 * Desktop: click-based <a download="filename"> — reliable across Chrome/FF/Safari
 * Mobile: modern mobile browsers support the same click-based download. We
 *   only fall back to window.open when the primary click method fails. Some
 *   mobile browsers silently block programmatic window.open from Promise
 *   callbacks because it's not a "direct user gesture" — by calling it from the
 *   original click handler (which is what `a.click()` effectively is), we stay
 *   inside the gesture window.
 */
export async function downloadBlob(
  blob: Blob,
  filename: string,
): Promise<void> {
  const url = URL.createObjectURL(blob);
  let openedWindow: Window | null = null;

  try {
    // Desktop + modern mobile: click-based anchor with download attribute
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.target = '_self';
    document.body.appendChild(a);
    a.click();
    // Delay removal to ensure the browser's download handler has started —
    // 100ms can race on slow Android WebView; 1000ms is reliably safe.
    await new Promise<void>((r) => window.setTimeout(r, 1000));
    document.body.removeChild(a);
    return;
  } catch {
    // Fallback: mobile / older browsers — open the blob URL in a new tab
    try {
      openedWindow = window.open(url, '_blank', 'noopener');
      // If window.open returned null (pop-up blocked), try a direct
      // navigation as a last resort.
      if (!openedWindow) {
        window.location.href = url;
      }
    } catch {
      try {
        window.location.href = url;
      } catch {
        // Final fallback: show the URL in a prompt so the user can copy-paste
        // (This almost never triggers, but avoids a silent failure.)
        try { window.alert('Your download is ready at:\n' + url); } catch { /* no-op */ }
      }
    }
  } finally {
    // Delay URL revocation so the download has time to start
    window.setTimeout(() => {
      try { URL.revokeObjectURL(url); } catch { /* no-op */ }
    }, 5000);
  }
}
