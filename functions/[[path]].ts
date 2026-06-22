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
      title: 'Open Your Sealed Message — TimeVault',
      description: 'Upload a TimeVault photo and enter your 4-digit PIN to reveal the message on or after the chosen date. Cryptographic time-lock guarantee.',
    },
    'couple': {
      title: 'Couple Mode — Co-Create a Time-Locked Letter Together',
      description: 'Two people, one photo, one shared moment locked in time. Both contribute to a message sealed until a shared anniversary or milestone.',
    },
    'how-it-works': {
      title: 'How It Works — Step-by-Step | TimeVault',
      description: 'A detailed walkthrough of TimeVault — how we combine AES-256-GCM, drand time-lock encryption, and LSB steganography to create a zero-storage photo-based time capsule.',
    },
    'stories': {
      title: 'Stories & Ideas — What People Seal Inside a Photo | TimeVault',
      description: 'Ideas and inspiration for what to seal inside a photo — anniversary letters, birthday traditions, travel memories, farewell notes, wedding vows, grief letters, and more.',
    },
    'faq': {
      title: 'Frequently Asked Questions — TimeVault',
      description: 'Answers to the most common questions about TimeVault — time-lock encryption, steganography, data privacy, the couple mode, and more.',
    },
    'blog': {
      title: 'TimeVault Blog — Stories, Ideas & Guides',
      description: 'Inspiring guides and ideas for sealing messages in photos — anniversary letters, love letters to future self, creative time capsule ideas, and more.',
    },
    'about': {
      title: 'About TimeVault — Our Story & Values',
      description: 'TimeVault is a free, privacy-first web app that lets you hide encrypted messages inside photos. Built on AES-256-GCM, drand time-lock encryption, and LSB steganography. Zero storage. Complete privacy.',
    },
    'privacy': {
      title: 'Privacy Policy — TimeVault',
      description: 'TimeVault privacy policy — what we collect (nothing), how encryption works in-browser, third-party infrastructure, cookie policy, and your data rights.',
    },
    'terms': {
      title: 'Terms of Service — TimeVault',
      description: 'Terms of Service for TimeVault — a free, browser-side privacy tool. Your use of this service is subject to these terms.',
    },
    'contact': {
      title: 'Contact — TimeVault',
      description: 'Questions about TimeVault, privacy, or time-locked messages? Get in touch with our team — we read every message.',
    },
  };
  
  const blogArticles = {
    'long-distance-relationship-gifts': {
      title: 'Long Distance Relationship Gifts That Actually Mean Something | TimeVault Blog',
      description: 'Discover meaningful long distance relationship gifts that bridge the distance. From time capsules to shared memories, these gifts go beyond material things.',
    },
    'open-when-letters-ideas': {
      title: 'Open When Letters: 30 Ideas for Every Relationship | TimeVault Blog',
      description: 'Discover 30 heartfelt "Open When" letter ideas for boyfriends, girlfriends, best friends, and long distance relationships. Plus how to make them even more special with TimeVault.',
    },
    'is-timevault-safe': {
      title: 'Is TimeVault Safe? How Zero-Server Storage Actually Works | TimeVault Blog',
      description: 'Yes, TimeVault is safe. Here\'s a detailed explanation of how zero-server storage, AES-256-GCM encryption, and drand time-lock work together to keep your secrets secure.',
    },
    'pet-memorial-time-capsule': {
      title: 'Pet Memorial Time Capsule: Keeping Their Memory Alive | TimeVault Blog',
      description: 'Honoring a beloved pet with a digital time capsule. Seal photos and memories inside an image to open when you are ready. A gentle way to remember.',
    },
    'letter-to-future-self': {
      title: 'Letter to My Future Self: What to Write and When to Open It | TimeVault Blog',
      description: 'Learn how to write a powerful letter to your future self. Includes 5 writing prompts and how to seal it with TimeVault until the perfect moment.',
    },
    'anniversary-letters-sealed-in-time': {
      title: 'Anniversary Letters Sealed in Time: A Complete Guide | TimeVault Blog',
      description: 'Discover meaningful anniversary letter ideas and learn how to seal your love letter inside a photo. A gift that waits for the perfect moment.',
    },
    'how-to-write-anniversary-letter': {
      title: 'How to Write a Time Capsule Letter for Your Anniversary | TimeVault Blog',
      description: 'A step-by-step guide to writing a love letter that your future self — or your partner — will open on your next anniversary.',
    },
  };
  
  let meta;
  let canonicalUrl;
  
  if (path.startsWith('blog/')) {
    const slug = path.replace('blog/', '');
    if (blogArticles[slug]) {
      meta = blogArticles[slug];
      canonicalUrl = `https://timevault.online/${path}/`;
    } else {
      meta = pageMeta['blog'];
      canonicalUrl = 'https://timevault.online/blog/';
    }
  } else if (pageMeta[path]) {
    meta = pageMeta[path];
    canonicalUrl = path 
      ? `https://timevault.online/${path}/` 
      : 'https://timevault.online/';
  } else {
    meta = pageMeta[''];
    canonicalUrl = 'https://timevault.online/';
  }
  
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