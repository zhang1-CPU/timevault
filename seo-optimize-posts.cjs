const fs = require('fs');
const path = require('path');

const blogDir = '/tmp/restore-original/blog';
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html');

console.log('Processing', files.length, 'blog posts...');

let count = 0;

files.forEach(file => {
  const filePath = path.join(blogDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Fix duplicate H1: change header h1 to p
  content = content.replace(
    '<header>\n      <h1>TimeVault Blog</h1>\n      <p>Stories, guides, and inspiration for what to seal inside a photo</p>\n    </header>',
    '<header>\n      <p style="font-size: 1.5rem; font-weight: 300; color: #a78bfa; margin-bottom: 10px; letter-spacing: 2px; text-transform: uppercase; font-size: 0.9rem;">TimeVault Blog</p>\n      <p>Stories, guides, and inspiration for what to seal inside a photo</p>\n    </header>'
  );
  
  // 2. Add OG image tag
  content = content.replace(
    '<meta property="og:site_name" content="TimeVault">',
    '<meta property="og:site_name" content="TimeVault">\n  <meta property="og:image" content="https://timevault.online/og-image.png">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">\n  <meta property="og:type" content="article">\n  <meta property="og:locale" content="en_US">'
  );
  
  // 3. Add Twitter image tag
  content = content.replace(
    '<meta name="twitter:description"',
    '<meta name="twitter:image" content="https://timevault.online/og-image.png">\n  <meta name="twitter:description"'
  );
  
  // 4. Add breadcrumb Schema
  const slug = file.replace('.html', '');
  const titleMatch = content.match(/<h1 style="font-size: 2rem;[^>]*>([^<]+)<\/h1>/);
  const title = titleMatch ? titleMatch[1] : slug;
  
  const breadcrumbSchema = `
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://timevault.online/"},{"@type":"ListItem","position":2,"name":"Blog","item":"https://timevault.online/blog"},{"@type":"ListItem","position":3,"name":"${title.replace(/"/g, '&quot;')}","item":"https://timevault.online/blog/${slug}"}]}
  </script>`;
  
  // Add before the first script tag
  content = content.replace(
    '<script type="application/ld+json">',
    breadcrumbSchema + '\n  <script type="application/ld+json">'
  );
  
  // 5. Add breadcrumb navigation (HTML)
  const breadcrumbHTML = `
    <nav style="margin-bottom: 30px; font-size: 0.9rem; color: rgba(200,180,230,0.6);">
      <a href="/" style="color: #a78bfa; text-decoration: none;">Home</a>
      <span style="margin: 0 8px;">›</span>
      <a href="/blog" style="color: #a78bfa; text-decoration: none;">Blog</a>
      <span style="margin: 0 8px;">›</span>
      <span style="color: rgba(200,180,230,0.8);">${title}</span>
    </nav>`;
  
  // Replace the back-link with full breadcrumb
  content = content.replace(
    '<a href="/blog" class="back-link">← Back to all articles</a>',
    breadcrumbHTML + '\n    <a href="/blog" class="back-link">← Back to all articles</a>'
  );
  
  fs.writeFileSync(filePath, content);
  count++;
});

console.log('SEO optimized', count, 'blog posts');
