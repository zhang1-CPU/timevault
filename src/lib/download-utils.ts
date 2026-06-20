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
  // Prefer native share on mobile — this is what Android users expect.
  if (
    typeof navigator !== 'undefined' &&
    'share' in navigator &&
    'canShare' in navigator &&
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  ) {
    try {
      const fileLike = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
      const shareData: ShareData = {
        files: [fileLike],
        title: filename,
        text: filename,
      };
      if ((navigator as Navigator & { canShare: (d: ShareData) => boolean }).canShare(shareData)) {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share(shareData);
        return;
      }
    } catch {
      // fall through to anchor-based download
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.target = '_self';
    // dispatching click directly (not using `.click()`) plays nicer with
    // browsers that require a user gesture for downloads.
    document.body.appendChild(a);
    const evt = new MouseEvent('click', {
      bubbles: false,
      cancelable: true,
      view: window,
    });
    a.dispatchEvent(evt);
    // Small delay before revocation so the browser has enough time to
    // read the blob and start the download.
    window.setTimeout(() => {
      try { URL.revokeObjectURL(url); } catch { /* noop */ }
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 1500);
  } catch {
    try { URL.revokeObjectURL(url); } catch { /* noop */ }
  }
}
