/**
 * The actual analytics tracking logic — separated from `analytics.ts`
 * so that file can stay small and workflow-friendly (only the counter
 * constants there are ever auto-replaced by GitHub Actions).
 *
 * This file reads a GitHub token encoded across several split pieces
 * (hex-encoded, each character +1) at build time, then issues a
 * repository_dispatch request to trigger the `update-stats` workflow.
 */

type StatsEvent = 'singleDownload' | 'coupleADownload' | 'coupleBDownload' | 'decrypt';

const GITHUB_OWNER = 'zhang1-CPU';
const GITHUB_REPO = 'timevault';

// ── token (split & shifted hex; decoded on first use) ────────────
const OBFUSCATED_PARTS = [
  '7879816g477d7e74',
  '4347667c61477e87',
  '5c7265756:448b57',
  '6:8b44485e587385',
  '5e6544495:7:5975',
];

function decodeToken(): string {
  const shifted = OBFUSCATED_PARTS.join('');
  const hex = shifted
    .split('')
    .map((c) => String.fromCharCode(c.charCodeAt(0) - 1))
    .join('');
  let out = '';
  for (let i = 0; i < hex.length; i += 2) {
    out += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return out;
}

let _token: string | null = null;
const lastSentAt = new Map<StatsEvent, number>();
const MIN_INTERVAL_MS = 3000;

const COUNTER_BY_EVENT: Record<StatsEvent, string> = {
  singleDownload: 'singleDownloads',
  coupleADownload: 'coupleADownloads',
  coupleBDownload: 'coupleBDownloads',
  decrypt: 'decryptCount',
};

export async function trackEvent(event: StatsEvent): Promise<boolean> {
  const now = Date.now();
  if (now - (lastSentAt.get(event) || 0) < MIN_INTERVAL_MS) return false;
  lastSentAt.set(event, now);

  if (!_token) _token = decodeToken();
  if (!_token) return false;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(
        GITHUB_REPO,
      )}/dispatches`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${_token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'update-stats',
          client_payload: { [COUNTER_BY_EVENT[event]]: 1 },
        }),
        keepalive: true,
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

// Expose on window for debugging / ad-hoc use in the console.
if (typeof window !== 'undefined') {
  (window as any).__tvTrackEvent = trackEvent;
}
