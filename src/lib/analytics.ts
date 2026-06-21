/**
 * Analytics tracking utilities for TimeVault (zero-backend).
 *
 * How it works:
 *   User clicks download / decrypt → browser issues a POST to
 *   https://api.github.com/repos/zhang1-CPU/timevault/dispatches
 *   which triggers the `update-stats` workflow in this repo.
 *   The workflow reads this file, increments the counter(s) inside
 *   the `__STATS__` block, commits the change, and pushes it back.
 *   GitHub Pages rebuilds and deploys — the next visitor sees the
 *   updated numbers inlined in the JS bundle.
 *
 *   No backend, no database, no Cloudflare Function, no JSON file.
 */

// ═══════════════════════════════════════════════════════════════════
// __STATS__  ←  workflow 只修改这一段。每个数字占一行，格式：
//   // <key>: <number>
// 所有 key: singleDownloads, coupleADownloads, coupleBDownloads, decryptCount
// ═══════════════════════════════════════════════════════════════════

// singleDownloads: 0
// coupleADownloads: 0
// coupleBDownloads: 0
// decryptCount: 0

// ═══════════════════════════════════════════════════════════════════

import { trackEvent as _trackEvent } from '@/lib/analytics-internal';

export const trackEvent = _trackEvent;

/**
 * Parse counter values from the special `// key: number` comments above
 * so the UI can render them without a network round-trip.
 */
export function getStats(): {
  singleDownloads: number;
  coupleADownloads: number;
  coupleBDownloads: number;
  decryptCount: number;
} {
  // This entire module gets bundled. The workflow rewrites the
  // `// key: N` lines above. To make them accessible at runtime we
  // re-read them here with a tiny regex — we just need the comment
  // text as it appears in this source file. Since bundlers normally
  // strip comments, we instead use a well-known Vite trick: keep
  // the counters also inlined below as constants that the workflow
  // rewrites at the same time. See the `STATS_*` constants below.

  return {
    singleDownloads: STATS_SINGLE_DOWNLOADS,
    coupleADownloads: STATS_COUPLE_A_DOWNLOADS,
    coupleBDownloads: STATS_COUPLE_B_DOWNLOADS,
    decryptCount: STATS_DECRYPT_COUNT,
  };
}

// ═══════════════════════════════════════════════════════════════════
// INLINE COUNTERS — these constants are rewritten by the workflow.
// Format: `const STATS_<UPPER_KEY> = <number>;`
// ═══════════════════════════════════════════════════════════════════

const STATS_SINGLE_DOWNLOADS = 0;
const STATS_COUPLE_A_DOWNLOADS = 0;
const STATS_COUPLE_B_DOWNLOADS = 0;
const STATS_DECRYPT_COUNT = 0;

// Re-export a few convenience accessors used by internal.
export { STATS_SINGLE_DOWNLOADS };
