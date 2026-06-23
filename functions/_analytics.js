export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const mode = body.mode;
    const validModes = ['solo', 'couple-a', 'couple-b', 'unlock'];
    if (!mode || !validModes.includes(mode)) {
      return new Response(null, { status: 204 });
    }
    if (env.STATS) {
      const current = await env.STATS.get(mode);
      await env.STATS.put(mode, String((parseInt(current || '0') || 0) + 1));
    }
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const secret = request.headers.get('X-Admin-Secret');
  const expectedSecret = env.ADMIN_SECRET || 'changeme';
  const isAdmin = secret === expectedSecret;

  const stats = { solo: 0, 'couple-a': 0, 'couple-b': 0, unlock: 0 };
  if (env.STATS) {
    for (const key of Object.keys(stats)) {
      const val = await env.STATS.get(key);
      if (val) stats[key] = parseInt(val) || 0;
    }
  }

  const body = isAdmin
    ? { stats, persistent: !!env.STATS }
    : { stats, persistent: false };

  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    },
  });
}
