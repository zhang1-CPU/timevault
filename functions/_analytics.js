export async function onRequestPost(context) {
  const { request } = context;
  try {
    const body = await request.json();
    const mode = body.mode;
    const validModes = ['solo', 'couple-a', 'couple-b', 'unlock'];
    if (!mode || !validModes.includes(mode)) {
      return new Response(null, { status: 204 });
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
  if (secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
    });
  }
  return new Response(JSON.stringify({ stats: { solo: 0, 'couple-a': 0, 'couple-b': 0, unlock: 0 }, persistent: false }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    },
  });
}
