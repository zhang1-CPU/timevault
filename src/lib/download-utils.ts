import { useEffect } from 'react';
import { incrementSealCount, incrementUnlockCount } from './usage-counter';

function scrollToTopNow() {
  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  } catch {
    window.scrollTo(0, 0);
  }
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/**
 * Scroll the page back to top whenever any of the provided dependencies change.
 * Used to ensure step progression in Seal/Unlock/Couple flows always starts
 * the user at the top of the new step.
 */
export function useScrollToTop(deps: ReadonlyArray<unknown> = []) {
  useEffect(() => {
    const t0 = window.setTimeout(scrollToTopNow, 0);
    const t1 = window.setTimeout(scrollToTopNow, 50);
    const t2 = window.setTimeout(scrollToTopNow, 200);
    const t3 = window.setTimeout(scrollToTopNow, 400);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Send an anonymous usage event to Cloudflare Analytics Engine.
 * This is fire-and-forget, non-blocking, and never affects user experience.
 */
export function trackEvent(mode: string) {
  try {
    const payload = JSON.stringify({ mode });
    // Use sendBeacon for reliability even as the page unloads
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon('/_analytics', blob);
  } catch {
    // Silently ignore — never block the download
  }
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
 *
 * @param blob     - The file blob to download
 * @param filename - The filename shown to the user
 * @param mode     - Analytics event type: 'solo' | 'couple-a' | 'couple-b' | 'unlock'
 */
export async function downloadBlob(
  blob: Blob,
  filename: string,
  mode?: string,
): Promise<void> {
  const url = URL.createObjectURL(blob);
  let openedWindow: Window | null = null;
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && (navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints! > 1);

  try {
    // Desktop + modern mobile: click-based anchor with download attribute
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.target = '_self';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    // On iOS Safari the download confirmation dialog is async — the user
    // has to tap "Download" AFTER we return. If we remove the anchor or
    // revoke the URL too early, the tap silently fails ("no response").
    // Keep both alive long enough for the user to confirm.
    if (isIOS) {
      // Leave anchor in DOM and URL alive for 30s — covers slow taps
      window.setTimeout(() => {
        try { a.remove(); } catch { /* noop */ }
      }, 30000);
    } else {
      // Desktop / Android: removal after 1s is reliably safe
      await new Promise<void>((r) => window.setTimeout(r, 1000));
      try { a.remove(); } catch { /* noop */ }
    }
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
    // Delay URL revocation so the download has time to start.
    // On iOS, the confirmation dialog is async, so we must wait much longer
    // than on desktop — the blob URL needs to live until the user taps "Download".
    const revokeDelay = isIOS ? 60000 : 5000;
    window.setTimeout(() => {
      try { URL.revokeObjectURL(url); } catch { /* no-op */ }
    }, revokeDelay);
  }

  // Track the event AFTER successful download, non-blocking
  if (mode) {
    trackEvent(mode);
    // Update local stats counter (pure frontend, no backend)
    if (mode === 'unlock') {
      incrementUnlockCount();
    } else {
      incrementSealCount();
    }
  }
}
