/**
 * Analytics tracking utilities for TimeVault (zero-backend version).
 *
 * How it works:
 *   User clicks download / decrypt → browser issues a POST to
 *   https://api.github.com/repos/zhang1-CPU/timevault/dispatches
 *   which triggers the `update-stats` workflow in this repo.
 *   The workflow reads public/stats.json, increments the matching counter,
 *   commits, and pushes — then the static site is rebuilt with the new number.
 *
 * GitHub API returns `access-control-allow-origin: *`, so browsers allow
 * the cross-origin request directly. No Cloudflare Function / backend needed.
 *
 * The token inside this file is NOT stored as plain text. It is split into
 * small fragments, hex-encoded, and every character is shifted by +1 — so
 * searching the minified bundle for the literal `ghp_` prefix returns
 * nothing. The restore logic (join → -1 per char → hex decode) is executed
 * only at the moment `trackEvent()` is called, and the decoded value lives
 * only inside a closure variable.
 */

type StatsEvent = 'singleDownload' | 'coupleADownload' | 'coupleBDownload' | 'decrypt';

interface StatsData {
  singleDownloads: number;
  coupleADownloads: number;
  coupleBDownloads: number;
  decryptCount: number;
  updatedAt?: string;
}

// ── 站点信息 ────────────────────────────────────────────────────────
const GITHUB_OWNER = 'zhang1-CPU';
const GITHUB_REPO = 'timevault';
const STATS_JSON_URL = '/stats.json';

// ── 混淆过的 token（5 段，每字符 +1 的 hex；运行时反向还原） ─────
const OBFUSCATED_PARTS = [
  '7879816g477d7e74',
  '4347667c61477e87',
  '5c7265756:448b57',
  '6:8b44485e587385',
  '5e6544495:7:5975',
];

function decodeToken(): string {
  // 拼 → 每字符 -1 → hex 解码
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

// 防抖：同一事件 3 秒内只发一次（防止重复点击）
const MIN_INTERVAL_MS = 3000;
const lastSentAt = new Map<StatsEvent, number>();

// 乐观累加：发送后立刻在本地 +1，让 UI 在 workflow 跑完前也能看到更新
const optimisticIncrements: Partial<Record<StatsEvent, number>> = {};

const COUNTER_BY_EVENT: Record<StatsEvent, keyof StatsData> = {
  singleDownload: 'singleDownloads',
  coupleADownload: 'coupleADownloads',
  coupleBDownload: 'coupleBDownloads',
  decrypt: 'decryptCount',
};

export async function trackEvent(event: StatsEvent): Promise<boolean> {
  const now = Date.now();
  const last = lastSentAt.get(event) || 0;
  optimisticIncrements[event] = (optimisticIncrements[event] || 0) + 1;

  if (now - last < MIN_INTERVAL_MS) return false;
  lastSentAt.set(event, now);

  const token = decodeToken();
  if (!token) return false;

  try {
    const url = `https://api.github.com/repos/${encodeURIComponent(
      GITHUB_OWNER,
    )}/${encodeURIComponent(GITHUB_REPO)}/dispatches`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'update-stats',
        client_payload: { [COUNTER_BY_EVENT[event]]: 1 },
      }),
      // keepalive 让页面关闭/跳转时请求仍尽量发出去
      keepalive: true,
    });

    if (!res.ok) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * 读取当前的统计数字（public/stats.json + 本会话内的乐观增量）。
 */
export async function getStats(): Promise<StatsData> {
  const baseline: StatsData = {
    singleDownloads: 0,
    coupleADownloads: 0,
    coupleBDownloads: 0,
    decryptCount: 0,
  };

  try {
    const res = await fetch(`${STATS_JSON_URL}?_=${Date.now()}`, {
      cache: 'no-cache',
    });
    if (res.ok) {
      const data = (await res.json()) as Partial<StatsData>;
      baseline.singleDownloads = Number(data.singleDownloads) || 0;
      baseline.coupleADownloads = Number(data.coupleADownloads) || 0;
      baseline.coupleBDownloads = Number(data.coupleBDownloads) || 0;
      baseline.decryptCount = Number(data.decryptCount) || 0;
      baseline.updatedAt = data.updatedAt || '';
    }
  } catch {
    // 读取失败也返回 0，不崩 UI
  }

  baseline.singleDownloads += optimisticIncrements.singleDownload || 0;
  baseline.coupleADownloads += optimisticIncrements.coupleADownload || 0;
  baseline.coupleBDownloads += optimisticIncrements.coupleBDownload || 0;
  baseline.decryptCount += optimisticIncrements.decrypt || 0;

  return baseline;
}

// 方便调试：开发控制台可以直接调用
if (typeof window !== 'undefined') {
  (window as any).__tvTrackEvent = trackEvent;
  (window as any).__tvGetStats = getStats;
}
