const fs = require('fs');
const path = require('path');

const blogDir = '/tmp/restore-original/blog';
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html');

// Parse all posts
const posts = [];
files.forEach(file => {
  const content = fs.readFileSync(path.join(blogDir, file), 'utf8');
  const slug = file.replace('.html', '');
  const titleMatch = content.match(/<h1 style="font-size: 2rem;[^>]*>([^<]+)<\/h1>/);
  const categoryMatch = content.match(/<span class="category">([^<]+)<\/span>/);
  const descMatch = content.match(/<meta name="description" content="([^"]+)"/);
  const dateMatch = content.match(/<span class="date">([^<]+)<\/span>/);
  
  posts.push({
    slug,
    title: titleMatch ? titleMatch[1] : slug,
    category: categoryMatch ? categoryMatch[1] : '',
    description: descMatch ? descMatch[1] : '',
    date: dateMatch ? dateMatch[1] : 'June 25, 2026'
  });
});

// Sort by date
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

console.log('Total posts for sitemap & index:', posts.length);

// Update sitemap.xml
let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://timevault.online/</loc>
    <lastmod>2026-06-25</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://timevault.online/blog</loc>
    <lastmod>2026-06-25</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;

posts.forEach(post => {
  sitemap += `  <url>
    <loc>https://timevault.online/blog/${post.slug}</loc>
    <lastmod>2026-06-25</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
});

sitemap += '</urlset>';

fs.writeFileSync('/tmp/restore-original/sitemap.xml', sitemap);
console.log('Sitemap updated with', posts.length + 2, 'URLs');

// Update blog/index.html
const blogIndex = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog — TimeVault: Time Capsule Ideas & Guides</title>
  <meta name="description" content="Discover ${posts.length} time capsule ideas, relationship memory guides, anniversary gifts, and tips for preserving your most precious moments with digital time capsules.">
  <meta name="keywords" content="time capsule ideas, digital time capsule, anniversary gifts, memory preservation, relationship gifts, steganography, ${posts.length} articles">
  <meta name="author" content="TimeVault">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://timevault.online/blog">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://timevault.online/blog">
  <meta property="og:title" content="Blog — TimeVault: Time Capsule Ideas & Guides">
  <meta property="og:description" content="Discover ${posts.length} time capsule ideas, relationship memory guides, anniversary gifts, and tips for preserving your most precious moments.">
  <meta property="og:site_name" content="TimeVault">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Blog — TimeVault: Time Capsule Ideas & Guides">
  <meta name="twitter:description" content="Discover ${posts.length} time capsule ideas, relationship memory guides, anniversary gifts, and tips for preserving your most precious moments.">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Blog","name":"TimeVault Blog","url":"https://timevault.online/blog","description":"Time capsule ideas, relationship memory guides, and tips for preserving precious moments.","publisher":{"@type":"Organization","name":"TimeVault"}}
  </script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d0718; color: #e2d5f5; line-height: 1.7; min-height: 100vh; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
    header { text-align: center; padding: 60px 0; border-bottom: 1px solid rgba(139,92,246,0.2); margin-bottom: 50px; }
    header h1 { font-size: 2.8rem; font-weight: 300; color: #c4b5fd; margin-bottom: 15px; }
    header p { color: rgba(200,180,230,0.7); font-size: 1.15rem; max-width: 600px; margin: 0 auto; }
    .back-home { display: inline-block; color: #a78bfa; text-decoration: none; margin-bottom: 30px; font-size: 0.95rem; }
    .back-home:hover { color: #c4b5fd; }
    .post-list { display: grid; gap: 24px; }
    .post-card { padding: 28px; background: rgba(139,92,246,0.05); border: 1px solid rgba(139,92,246,0.15); border-radius: 12px; transition: all 0.2s ease; }
    .post-card:hover { background: rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.3); }
    .post-card h2 { font-size: 1.3rem; font-weight: 500; margin-bottom: 10px; }
    .post-card h2 a { color: #ddd6fe; text-decoration: none; }
    .post-card h2 a:hover { color: #c4b5fd; }
    .post-meta { display: flex; gap: 15px; align-items: center; margin-bottom: 15px; flex-wrap: wrap; }
    .category { background: rgba(139,92,246,0.2); color: #a78bfa; padding: 3px 10px; border-radius: 15px; font-size: 0.8rem; font-weight: 500; }
    .date { color: rgba(200,180,230,0.5); font-size: 0.85rem; }
    .post-excerpt { color: rgba(226,213,245,0.7); font-size: 0.95rem; line-height: 1.6; }
    footer { text-align: center; padding: 60px 0 40px; border-top: 1px solid rgba(139,92,246,0.2); margin-top: 60px; color: rgba(200,180,230,0.5); font-size: 0.9rem; }
    footer a { color: #a78bfa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back-home">← Back to TimeVault</a>
    <header>
      <h1>TimeVault Blog</h1>
      <p>${posts.length} stories, guides, and ideas for what to seal inside a photo — from anniversary surprises to long-distance love.</p>
    </header>
    <div class="post-list">
${posts.map(post => `      <article class="post-card">
        <div class="post-meta">
          <span class="category">${post.category}</span>
          <span class="date">${post.date}</span>
        </div>
        <h2><a href="/blog/${post.slug}">${post.title}</a></h2>
        <p class="post-excerpt">${post.description}</p>
      </article>`).join('\n')}
    </div>
    <footer>
      <p>TimeVault — <a href="/">Seal a message, choose when it opens</a></p>
      <p style="margin-top: 10px; font-size: 0.8rem;">A time capsule for two hearts</p>
    </footer>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(blogDir, 'index.html'), blogIndex);
console.log('Blog index updated with', posts.length, 'posts');
