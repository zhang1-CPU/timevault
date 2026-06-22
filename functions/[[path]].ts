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
  
  const html = await indexResponse.text();
  
  const path = url.pathname.replace(/^\/+|\/+$/g, '');
  
  const pageMeta = {
    '': {
      title: 'TimeVault — Seal a message, choose when it opens. A time capsule for two hearts.',
      description: 'Write a secret message. Hide it inside any photo. Pick a future date. On that day — and only that day — it opens. End-to-end encrypted. Zero servers. Your photo holds the key.',
    },
    'seal': {
      title: 'Seal a Message in a Photo — TimeVault',
      description: 'Write a message, hide it inside any photo, and choose a future date when it can be opened. Client-side AES-256 encryption with a cryptographic time-lock.',
    },
    'unlock': {
      title: 'Unlock a Time Capsule Photo — TimeVault',
      description: 'Upload a photo containing a time-locked message and unlock it. The message opens only on the date it was sealed for.',
    },
    'couple': {
      title: 'Couple Time Capsule — TimeVault',
      description: 'Create shared secrets for couples. Send encrypted messages that open on a special date. Perfect for anniversaries and meaningful moments.',
    },
    'how-it-works': {
      title: 'How It Works — TimeVault',
      description: 'Learn how TimeVault uses AES-256 encryption and cryptographic time-lock to keep your messages secure until the chosen date.',
    },
    'stories': {
      title: 'Stories — TimeVault',
      description: 'Read stories of love, memories, and meaningful moments preserved in time capsules. See how others use TimeVault.',
    },
    'faq': {
      title: 'FAQ — TimeVault',
      description: 'Frequently asked questions about TimeVault. Learn about security, privacy, and how the time-lock technology works.',
    },
    'blog': {
      title: 'Blog — TimeVault',
      description: 'Tips, ideas, and stories about time capsules, love letters, and meaningful gifts. Discover creative ways to use TimeVault.',
    },
    'about': {
      title: 'About — TimeVault',
      description: 'Learn about TimeVault, the privacy-first time capsule service. We believe in keeping your secrets truly secret.',
    },
    'privacy': {
      title: 'Privacy Policy — TimeVault',
      description: 'TimeVault privacy policy. We never store your messages, photos, or personal data. Zero servers, zero tracking.',
    },
    'terms': {
      title: 'Terms of Service — TimeVault',
      description: 'Terms of service for using TimeVault. Your use of our service is governed by these terms.',
    },
    'contact': {
      title: 'Contact — TimeVault',
      description: 'Get in touch with TimeVault. Have questions, feedback, or ideas? We would love to hear from you.',
    },
  };
  
  const meta = pageMeta[path] || pageMeta[''];
  const canonicalUrl = path 
    ? `https://timevault.online/${path}/` 
    : 'https://timevault.online/';
  
  let modifiedHtml = html
    .replace(/<meta name="robots" content="[^"]*" \/>/, '<meta name="robots" content="index, follow, max-image-preview:large" />')
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${meta.description}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${meta.title}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${meta.description}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${meta.title}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${meta.description}" />`);
  
  const titleMatch = modifiedHtml.match(/<title>[^<]*<\/title>/);
  if (titleMatch) {
    modifiedHtml = modifiedHtml.replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`);
  }
  
  return new Response(modifiedHtml, {
    headers: {
      ...indexResponse.headers,
      'Content-Type': 'text/html; charset=utf-8',
      'X-Redirected-By': 'SPA-Fallback',
      'X-Robots-Tag': 'index, follow',
    },
  });
}