/**
 * Cloudflare Worker 入口
 * 1. 对 /_analytics/* 路由：处理统计上报和查询
 * 2. 对其他所有路由：serve dist/ 目录下的静态文件（SPA 回退到 index.html）
 */

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

    const statsKV = env.ANALYTICS_KV;
    if (!statsKV) {
      return new Response(null, { status: 204 });
    }

    const key = `stats:${mode}`;
    const current = (await statsKV.get(key, 'text')) || '0';
    await statsKV.put(key, String(Number(current) + 1));

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

  const statsKV = env.ANALYTICS_KV;
  if (!statsKV) {
    return json({ error: 'KV not configured' }, 503);
  }

  const modes = ['solo', 'couple-a', 'couple-b', 'unlock'];
  const stats: Record<string, number> = {};
  for (const mode of modes) {
    stats[mode] = Number((await statsKV.get(`stats:${mode}`, 'text')) || '0');
  }

  return json(stats, 200);
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
  ANALYTICS_KV: KVNamespace;
  ADMIN_SECRET: string;
  ASSETS?: { fetch: typeof fetch };
}
