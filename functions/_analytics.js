/**
 * Cloudflare Pages Function: receives anonymous usage events and stores
 * them as simple counters in KV for the admin dashboard.
 *
 * Endpoints:
 *   POST /_analytics  { mode: "solo" | "couple-a" | "couple-b" | "unlock" }
 *     → increments KV counter "stats:{mode}"
 *   GET /_analytics/stats
 *     → returns { solo: n, "couple-a": n, "couple-b": n, unlock: n }
 *       (protected; requires X-Admin-Secret header)
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { mode } = body;

    const validModes = ['solo', 'couple-a', 'couple-b', 'unlock'];
    if (!validModes.includes(mode)) {
      return new Response(JSON.stringify({ error: 'Invalid mode' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // KV must be bound in Cloudflare Pages settings ("Analytics KV")
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

export async function onRequestGet(context) {
  const { request, env } = context;

  // Simple password protection
  const secret = request.headers.get('X-Admin-Secret');
  const expectedSecret = env.ADMIN_SECRET || 'changeme';
  if (secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const statsKV = env.ANALYTICS_KV;
  if (!statsKV) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const modes = ['solo', 'couple-a', 'couple-b', 'unlock'];
  const stats = {};
  for (const mode of modes) {
    stats[mode] = Number((await statsKV.get(`stats:${mode}`, 'text')) || '0');
  }

  return new Response(JSON.stringify(stats), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
