/**
 * Cloudflare Worker 入口
 * 1. 对 /_analytics/* 路由：处理统计上报和查询（零配置内存计数器）
 * 2. 对其他所有路由：serve dist/ 目录下的静态文件（SPA 回退到 index.html）
 *
 * 说明：采用内存计数器，无需配置 KV/任何外部存储。
 *      - 每次 Worker 冷启动或重新部署，计数从 0 开始
 *      - 多实例场景下各实例独立计数（近似值，对"看各功能大概用了多少次"完全够用）
 *      - 如后续需要精确持久化统计，可切换为 KV/D1 方案
 */

// 内存计数器：Worker 生命周期内持续累加
const counters: Record<string, number> = {
  'solo': 0,
  'couple-a': 0,
  'couple-b': 0,
  'unlock': 0,
};
const STARTED_AT = new Date().toISOString();

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // ── Analytics API ────────────────────────────────────────────
    if (url.pathname.startsWith('/_analytics')) {
      return handleAnalytics(request, env);
    }

    // ── Static assets (SPA fallback) ─────────────────────────────
    return serveStatic(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;

// ── Analytics handlers ──────────────────────────────────────────

async function handleAnalytics(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === 'POST' && url.pathname === '/_analytics') {
    return onRequestPost(request, env);
  }

  if (request.method === 'GET' && url.pathname === '/_analytics/stats') {
    return onRequestGet(request, env);
  }

  return new Response('Not Found', { status: 404 });
}

async function onRequestPost(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as { mode?: string };
    const { mode } = body;

    const validModes = ['solo', 'couple-a', 'couple-b', 'unlock'];
    if (!mode || !validModes.includes(mode)) {
      return json({ error: 'Invalid mode' }, 400);
    }

    counters[mode] = (counters[mode] || 0) + 1;
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
}

async function onRequestGet(request: Request, env: Env): Promise<Response> {
  const secret = request.headers.get('X-Admin-Secret');
  const expectedSecret = env.ADMIN_SECRET || 'changeme';
  if (secret !== expectedSecret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const modes = ['solo', 'couple-a', 'couple-b', 'unlock'];
  const stats: Record<string, number> = {};
  for (const mode of modes) {
    stats[mode] = counters[mode] || 0;
  }

  return json({
    stats,
    started_at: STARTED_AT,
    note: '内存计数：每次部署后从 0 开始',
  }, 200);
}

// ── Static file serving ─────────────────────────────────────────

async function serveStatic(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  // 使用 Cloudflare Workers 的 assets binding（wrangler.toml 里 assets = { directory = "./dist" }）
  // 当配置了 assets 时，env.ASSETS 会自动提供静态文件服务
  const assetBinding = (env as any).ASSETS as { fetch: typeof fetch } | undefined;

  if (assetBinding) {
    // SPA fallback：如果请求的是 HTML 路由（非文件），回退到 index.html
    const url = new URL(request.url);
    const isFile = url.pathname.includes('.') && !url.pathname.endsWith('/');
    if (!isFile) {
      const indexReq = new Request(new URL('/index.html', url.origin), request);
      const resp = await assetBinding.fetch(indexReq);
      if (resp.status !== 404) return resp;
    }
    return assetBinding.fetch(request);
  }

  // Fallback：如果没有 ASSETS binding，返回简单提示
  return new Response('ASSETS not configured', { status: 500 });
}

// ── Helpers ─────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Types ───────────────────────────────────────────────────────

interface Env {
  ADMIN_SECRET?: string;
  ASSETS?: { fetch: typeof fetch };
}
