// Durable Object class for persistent stats
export class StatsStore {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/inc' && request.method === 'POST') {
      try {
        const body = await request.json();
        const mode = body.mode;
        const validModes = ['solo', 'couple-a', 'couple-b', 'unlock'];
        if (mode && validModes.includes(mode)) {
          const counter = await this.state.storage.get(mode);
          const newVal = (counter || 0) + 1;
          await this.state.storage.put(mode, newVal);
          return new Response('ok');
        }
      } catch {
        // ignore
      }
      return new Response('bad', { status: 400 });
    }

    if (url.pathname === '/stats' && request.method === 'GET') {
      const counters = {};
      const modes = ['solo', 'couple-a', 'couple-b', 'unlock'];
      for (const m of modes) {
        counters[m] = await this.state.storage.get(m) || 0;
      }
      return new Response(JSON.stringify(counters), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }
}

// Pages fetch handler: serves static files + API endpoints
export async function fetch(request, env, ctx) {
  const url = new URL(request.url);

  // POST /_analytics  ->  increment counter
  if (url.pathname === '/_analytics' && request.method === 'POST') {
    try {
      if (env.STATS_STORE) {
        const id = env.STATS_STORE.idFromName('main');
        const stub = env.STATS_STORE.get(id);
        const body = await request.json();
        await stub.fetch('http://internal/inc', {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(null, { status: 204 });
    } catch {
      return new Response(null, { status: 204 });
    }
  }

  // GET /_analytics/stats  ->  read counters
  if (url.pathname === '/_analytics/stats' && request.method === 'GET') {
    const secret = request.headers.get('X-Admin-Secret');
    const expectedSecret = env.ADMIN_SECRET || 'changeme';
    if (secret !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      });
    }

    let stats = { solo: 0, 'couple-a': 0, 'couple-b': 0, unlock: 0 };
    let persistent = false;

    if (env.STATS_STORE) {
      try {
        const id = env.STATS_STORE.idFromName('main');
        const stub = env.STATS_STORE.get(id);
        const resp = await stub.fetch('http://internal/stats');
        stats = await resp.json();
        persistent = true;
      } catch {
        // fall through with zeros
      }
    }

    return new Response(JSON.stringify({ stats, persistent }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
    });
  }

  // All other requests -> serve static files
  return env.ASSETS.fetch(request);
}
