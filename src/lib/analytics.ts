/**
 * Analytics tracking utilities for TimeVault.
 *
 * 当用户下载封存的图片或成功解密时, 前端会发一个轻量请求到
 * 自家端点 `/_analytics?event=xxx`, 由 Cloudflare Pages Function
 * (见 functions/_analytics.js) 拿着存在 Cloudflare 环境变量里的
 * GITHUB_TOKEN 向 GitHub API 发送 repository_dispatch.
 *
 * 对应 workflow .github/workflows/update-stats.yml 会读取
 * public/stats.json, 把对应计数 +1, 再 commit & push 回本仓库,
 * 刷新后的统计数字便会在下次页面构建时出现在站点 footer 里.
 *
 * 这样做的好处:
 *   - 前端源码里 0 token, 任何访问者都拿不到凭据
 *   - Function 端做了 IP 速率限制, 防止刷爆统计
 *   - 更换 token 只需在 Cloudflare Pages 控制台改环境变量, 不用重部署
 *
 * Usage:
 *   import { trackEvent, getStats } from '@/lib/analytics';
 *   trackEvent('singleDownload');   // 单人模式下载
 *   trackEvent('coupleADownload');  // 情侣模式 A 下载
 *   trackEvent('coupleBDownload');  // 情侣模式 B 下载
 *   trackEvent('decrypt');          // 解密成功
 */

type StatsEvent =
  | 'singleDownload'
  | 'coupleADownload'
  | 'coupleBDownload'
  | 'decrypt';

interface StatsData {
  singleDownloads: number;
  coupleADownloads: number;
  coupleBDownloads: number;
  decryptCount: number;
  updatedAt?: string;
}

const STATS_JSON_URL = '/stats.json';
const ANALYTICS_ENDPOINT = '/_analytics';

// 前端侧防抖: 同一事件 3 秒内只发一次.
// (Cloudflare 端也有更严格的 IP 限流, 这层是为了不浪费网络请求)
const MIN_INTERVAL_MS = 3000;
const lastSentAt = new Map<StatsEvent, number>();

// 乐观累加: 发完请求后立即在本地 +1, 让用户看到"即时"更新.
// 即使 workflow 还没跑完, UI 上数字也不会回退.
const optimisticIncrements: Partial<Record<StatsEvent, number>> = {};

export async function trackEvent(event: StatsEvent): Promise<boolean> {
  const now = Date.now();
  const last = lastSentAt.get(event) || 0;
  optimisticIncrements[event] = (optimisticIncrements[event] || 0) + 1;

  if (now - last < MIN_INTERVAL_MS) return false;
  lastSentAt.set(event, now);

  try {
    const res = await fetch(`${ANALYTICS_ENDPOINT}?event=${encodeURIComponent(event)}`, {
      method: 'GET',
      keepalive: true,
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    // 失败静默: 统计功能不应影响用户体验
    return false;
  }
}

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
    // 读取失败仍然返回 0, 不崩 UI
  }

  baseline.singleDownloads += optimisticIncrements.singleDownload || 0;
  baseline.coupleADownloads += optimisticIncrements.coupleADownload || 0;
  baseline.coupleBDownloads += optimisticIncrements.coupleBDownload || 0;
  baseline.decryptCount += optimisticIncrements.decrypt || 0;

  return baseline;
}

// 方便调试: 开发控制台里可以直接调用
if (typeof window !== 'undefined') {
  (window as any).__tvTrackEvent = trackEvent;
  (window as any).__tvGetStats = getStats;
}
