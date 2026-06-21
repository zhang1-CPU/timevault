const counters = { solo: 0, 'couple-a': 0, 'couple-b': 0, unlock: 0 };

export async function onRequestPost(context) {
  const { request } = context;
  try {
    const body = await request.json();
    const mode = body.mode;
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

export async function onRequestGet(context) {
  const { request, env } = context;
  const secret = request.headers.get('X-Admin-Secret');
  const expectedSecret = env.ADMIN_SECRET || 'changeme';
  if (secret !== expectedSecret) {
    return json({ error: 'Unauthorized' }, 401);
  }
  return json({ stats: counters, persistent: false }, 200);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
