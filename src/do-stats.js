export class StatsStore {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/inc') {
      try {
        const body = await request.json();
        const mode = body.mode;
        if (mode) {
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

    if (url.pathname === '/stats') {
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
