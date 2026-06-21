/**
 * Cloudflare Worker 入口
 * 1. 对 /_analytics/* 路由：处理统计上报和查询（数据存 Cloudflare KV，持久化）
 * 2. 对其他所有路由：serve dist/ 目录下的静态文件（SPA 回退到 index.html）
 */

const VALID_MODES = ['solo', 'couple-a', 'couple-b', 'unlock'] as const;

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
    return applyNoCache(await onRequestPost(request, env));
  }

  if (request.method === 'GET' && url.pathname === '/_analytics/stats') {
    return applyNoCache(await onRequestGet(request, env));
  }

  return applyNoCache(new Response('Not Found', { status: 404 }));
}

async function onRequestPost(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as { mode?: string };
    const { mode } = body;

    if (!mode || !(VALID_MODES as readonly string[]).includes(mode)) {
      return json({ error: 'Invalid mode' }, 400);
    }

    const kv = env.ANALYTICS_KV;
    if (!kv) return new Response(null, { status: 204 }); // KV 未绑定时静默

    const key = `stats:${mode}`;
    const current = Number((await kv.get(key)) || '0') || 0;
    await kv.put(key, String(current + 1));

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

  const kv = env.ANALYTICS_KV;
  const stats: Record<string, number> = {};

  if (kv) {
    for (const mode of VALID_MODES) {
      stats[mode] = Number((await kv.get(`stats:${mode}`)) || '0') || 0;
    }
    return json({ stats, persistent: true }, 200);
  }

  // KV 未绑定时给前端一个可读的提示（不会 5xx）
  for (const mode of VALID_MODES) stats[mode] = 0;
  return json({ stats, persistent: false, note: 'KV 未绑定，数据未持久化' }, 200);
}

// ── 缓存控制 ───────────────────────────────────────────────────

function applyNoCache(res: Response): Response {
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  return res;
}

// ── Static file serving ─────────────────────────────────────────

async function serveStatic(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const assetBinding = (env as any).ASSETS as { fetch: typeof fetch } | undefined;

  if (assetBinding) {
    const url = new URL(request.url);
    const isFile = url.pathname.includes('.') && !url.pathname.endsWith('/');
    if (!isFile) {
      const indexReq = new Request(new URL('/index.html', url.origin), request);
      const resp = await assetBinding.fetch(indexReq);
      if (resp.status !== 404) return resp;
    }
    return assetBinding.fetch(request);
  }

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
  ANALYTICS_KV?: KVNamespace;
  ADMIN_SECRET?: string;
  ASSETS?: { fetch: typeof fetch };
}
