/**
 * Cloudflare Worker 入口
 * 1. 对 /_analytics/* 路由：处理统计上报和查询
 * 2. 对其他所有路由：serve dist/ 目录下的静态文件（SPA 回退到 index.html）
 *
 * 持久化方案：Durable Objects（无需在 Cloudflare dashboard 做任何手动配置，
 * 只要 wrangler.toml 里声明 binding，push 后自动生效，数据持久保存。
 */

const VALID_MODES = ['solo', 'couple-a', 'couple-b', 'unlock'] as const;
const DO_ORIGIN = 'do://internal'; // 内部调用 DO 时用的虚拟 origin

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

// ── Handlers ────────────────────────────────────────────────────

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

function callDO(env: Env): { fetch: (req: RequestInfo | URL, init?: RequestInit) => Promise<Response> } {
  const ns = env.STATS_STORE;
  const id = ns.idFromName('global-stats');
  return ns.get(id);
}

async function onRequestPost(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as { mode?: string };
    const mode = body.mode;
    if (!mode || !(VALID_MODES as readonly string[]).includes(mode)) {
      return json({ error: 'Invalid mode' }, 400);
    }
    await callDO(env).fetch(`${DO_ORIGIN}/inc`, {
      method: 'POST',
      body: JSON.stringify({ mode }),
    });
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

  try {
    const resp = await callDO(env).fetch(`${DO_ORIGIN}/stats`);
    const raw = (await resp.json()) as Record<string, number>;
    return json({ stats: raw, persistent: true }, 200);
  } catch {
    const empty: Record<string, number> = {};
    for (const m of VALID_MODES) empty[m] = 0;
    return json({ stats: empty, persistent: false }, 200);
  }
}

// ── Cache-Control ────────────────────────────────────────────

function applyNoCache(res: Response): Response {
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  return res;
}

// ── Static file serving ───────────────────────────────────────

async function serveStatic(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const assetBinding = (env as any).ASSETS as { fetch: typeof fetch } | undefined;

  if (assetBinding) {
    const url = new URL(request.url);
    const isFile = url.pathname.includes('.') && !url.pathname.endsWith('/');
    if (!isFile) {
      const indexReq = new Request(new URL('/index.html', url.origin), request;
      const resp = await assetBinding.fetch(indexReq);
      if (resp.status !== 404) return resp;
    }
    return assetBinding.fetch(request);
  }

  return new Response('ASSETS not configured', { status: 500 });
}

// ── Helpers ────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Durable Object：持久化计数器（每次部署/重启数据都在）──────

export class StatsStore {
  state: DurableObjectState;
  env: Env;
  counters: Record<string, number>;
  loaded: Promise<void>;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.counters = { solo: 0, 'couple-a': 0, 'couple-b': 0, unlock: 0 };
    this.loaded = state.blockConcurrencyWhile(async () => {
      try {
        const stored = await state.storage.get<Record<string, number>>('counters');
        if (stored && typeof stored === 'object') {
          this.counters = { ...this.counters, ...stored };
        }
      } catch {
        // 第一次运行时可能没有存储数据，保持默认 0
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    await this.loaded;
    const url = new URL(request.url);

    if (url.pathname === '/inc') {
      try {
        const body = (await request.json()) as { mode?: string };
        const mode = body.mode;
        if (mode && (VALID_MODES as readonly string[]).includes(mode)) {
          this.counters[mode] = (this.counters[mode] || 0) + 1;
          this.state.storage.put('counters', this.counters); // 异步写入，不等待
          return new Response('ok');
        }
      } catch {
        // ignore
      }
      return new Response('bad', { status: 400 });
    }

    if (url.pathname === '/stats') {
      return new Response(JSON.stringify(this.counters), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }
}

// ── Types ─────────────────────────────────────────────────────

interface Env {
  STATS_STORE: DurableObjectNamespace;
  ADMIN_SECRET?: string;
  ASSETS?: { fetch: typeof fetch };
}
