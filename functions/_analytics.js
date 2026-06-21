export async function onRequestPost(context) {
  const { request } = context;
  try {
    const body = await request.json();
    const mode = body.mode;
    const validModes = ['solo', 'couple-a', 'couple-b', 'unlock'];
    if (!mode || !validModes.includes(mode)) {
      return json({ error: 'Invalid mode' }, 400);
    }
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
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
