// Cloudflare Pages Function — analytics proxy
// 监听路径: /_analytics?event=singleDownload|coupleADownload|coupleBDownload|decrypt
//
// 它做三件事:
//   1) 校验 event 参数, 做简单的 IP 速率限制 (KV 或内存计数)
//   2) 用环境变量 GITHUB_TOKEN 向 GitHub API 发送 repository_dispatch
//   3) 返回 204 No Content, 让前端静默成功/失败
//
// 需要在 Cloudflare Pages 控制台配置两个环境变量:
//   GITHUB_TOKEN  — 具有 `repo` 写权限的 Personal Access Token
//   GITHUB_REPO   — "zhang1-CPU/timevault" (owner/repo 格式)
//
// 触发的 workflow 是 .github/workflows/update-stats.yml,
// 它会读取 public/stats.json → +1 → commit & push 回本仓库.

const VALID_EVENTS = new Set([
  'singleDownload',
  'coupleADownload',
  'coupleBDownload',
  'decrypt',
]);

// event → client_payload 中使用的 key
const COUNTER_BY_EVENT = {
  singleDownload: 'singleDownloads',
  coupleADownload: 'coupleADownloads',
  coupleBDownload: 'coupleBDownloads',
  decrypt: 'decryptCount',
};

// 简单 IP 速率限制 (同一 IP 每 5 秒最多 1 次, 每小时最多 30 次)
// Cloudflare Pages Functions 没有共享 KV 默认可用, 我们用全局内存
// 作为近似 (够用: 多实例会各自计数, 但对防止刷已经够了).
const MIN_INTERVAL_MS = 5000;
const HOURLY_LIMIT = 30;
const lastHitAt = new Map();        // ip -> last timestamp
const hourlyCounts = new Map();     // ip -> { count, windowStartMs }

function rateLimitOk(ip) {
  const now = Date.now();
  const last = lastHitAt.get(ip) || 0;
  if (now - last < MIN_INTERVAL_MS) return false;

  let bucket = hourlyCounts.get(ip);
  if (!bucket || now - bucket.windowStartMs > 3600 * 1000) {
    bucket = { count: 0, windowStartMs: now };
  }
  if (bucket.count >= HOURLY_LIMIT) return false;
  bucket.count += 1;
  hourlyCounts.set(ip, bucket);
  lastHitAt.set(ip, now);
  return true;
}

// Cloudflare Pages v2 Function handler
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const event = url.searchParams.get('event');

  // 只允许 GET / POST, 且 event 必须合法
  if (!VALID_EVENTS.has(event)) {
    return new Response('?event=singleDownload|coupleADownload|coupleBDownload|decrypt', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const cfConnectingIP =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  if (!rateLimitOk(cfConnectingIP)) {
    return new Response('rate limited', { status: 429 });
  }

  const token = env.GITHUB_TOKEN;
  const repo = env.GITHUB_REPO || 'zhang1-CPU/timevault';
  if (!token) {
    return new Response('GITHUB_TOKEN not configured', { status: 500 });
  }

  const counterKey = COUNTER_BY_EVENT[event];
  const dispatchURL = `https://api.github.com/repos/${repo}/dispatches`;

  try {
    const res = await fetch(dispatchURL, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'timevault-analytics-proxy',
      },
      body: JSON.stringify({
        event_type: 'update-stats',
        client_payload: { [counterKey]: 1 },
      }),
      cf: { cacheTtl: 0 },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return new Response(`GitHub API error ${res.status}: ${text.slice(0, 200)}`, {
        status: 502,
      });
    }

    return new Response(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    return new Response('proxy error', { status: 502 });
  }
}
