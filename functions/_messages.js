export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { name, message } = body;
    
    if (!name || !message || name.trim().length > 50 || message.trim().length > 500) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
    }

    const id = crypto.randomUUID();
    const entry = {
      id,
      name: name.trim(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    if (env.STATS) {
      await env.STATS.put(`msg_${id}`, JSON.stringify(entry));
      const count = await env.STATS.get('msg_count');
      await env.STATS.put('msg_count', String((parseInt(count || '0') || 0) + 1));
    }

    return new Response(JSON.stringify({ success: true, id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const messages = [];
    if (env.STATS) {
      const keys = await env.STATS.list({ prefix: 'msg_' });
      for (const key of keys.keys) {
        const data = await env.STATS.get(key.name);
        if (data) {
          try {
            messages.push(JSON.parse(data));
          } catch { /* ignore invalid data */ }
        }
      }
    }
    messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return new Response(JSON.stringify({ messages }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch {
    return new Response(JSON.stringify({ messages: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const secret = request.headers.get('X-Admin-Secret');
  const expectedSecret = env.ADMIN_SECRET || 'changeme';
  if (secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
    }

    if (env.STATS) {
      await env.STATS.delete(`msg_${id}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}