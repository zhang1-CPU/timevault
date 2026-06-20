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
 * Cross-browser/mobile-safe download. The plain `<a href={blobUrl} download>`
 * pattern fails on several Android browsers (Chrome WebView, Samsung Internet)
 * because blob URLs inside anchor elements are not always honored for downloads
 * unless the click is triggered in direct response to a user gesture. This
 * helper creates a fresh object URL and dispatches a synthetic click from an
 * ephemeral anchor element, then revokes the URL after a short delay. It also
 * uses navigator.share on mobile platforms when available, which gives the
 * user a native share sheet that is much more reliable than a raw "save image".
 */
export async function downloadBlob(
  blob: Blob,
  filename: string,
): Promise<void> {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    // Mobile fallback: some browsers ignore click() on anchors
    // so also navigate directly to the blob URL
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.setTimeout(() => {
        try { window.location.href = url; } catch { /* noop */ }
      }, 300);
    }
    window.setTimeout(() => {
      try { URL.revokeObjectURL(url); } catch { /* noop */ }
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 2000);
  } catch {
    try {
      // Last-resort fallback: navigate directly
      window.location.href = URL.createObjectURL(blob);
    } catch { /* noop */ }
  }
}
