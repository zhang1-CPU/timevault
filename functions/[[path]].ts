export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  
  const staticPaths = [
    '/assets/',
    '/favicon.svg',
    '/manifest.json',
    '/robots.txt',
    '/sitemap.xml',
    '/og-image.svg',
    '/logo.png',
    '/logo.svg',
    '/google4bd1e08685667667.html'
  ];
  
  if (staticPaths.some(path => url.pathname.startsWith(path))) {
    return await next();
  }
  
  const indexResponse = await fetch(`${url.origin}/index.html`, {
    headers: request.headers,
  });
  
  return new Response(indexResponse.body, {
    headers: {
      ...indexResponse.headers,
      'X-Redirected-By': 'SPA-Fallback',
    },
  });
}
