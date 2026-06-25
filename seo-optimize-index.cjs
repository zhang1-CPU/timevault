const fs = require('fs');
const path = require('path');

const indexPath = '/tmp/restore-original/blog/index.html';
let content = fs.readFileSync(indexPath, 'utf8');

// 1. Add OG image and Twitter image
content = content.replace(
  '<meta property="og:site_name" content="TimeVault">',
  '<meta property="og:site_name" content="TimeVault">\n  <meta property="og:image" content="https://timevault.online/og-image.png">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">\n  <meta property="og:locale" content="en_US">'
);

content = content.replace(
  '<meta name="twitter:description" content="Discover 67 time capsule ideas',
  '<meta name="twitter:image" content="https://timevault.online/og-image.png">\n  <meta name="twitter:description" content="Discover 67 time capsule ideas'
);

// 2. Add breadcrumb Schema
const breadcrumbSchema = `
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://timevault.online/"},{"@type":"ListItem","position":2,"name":"Blog","item":"https://timevault.online/blog"}]}
  </script>`;

content = content.replace(
  '  <script type="application/ld+json">\n  {"@context":"https://schema.org","@type":"Blog"',
  breadcrumbSchema + '\n  <script type="application/ld+json">\n  {"@context":"https://schema.org","@type":"Blog"'
);

// 3. Add breadcrumb navigation HTML
const breadcrumbHTML = `    <nav style="margin-bottom: 30px; font-size: 0.9rem; color: rgba(200,180,230,0.6);">
      <a href="/" style="color: #a78bfa; text-decoration: none;">Home</a>
      <span style="margin: 0 8px;">›</span>
      <span style="color: rgba(200,180,230,0.8);">Blog</span>
    </nav>\n`;

content = content.replace(
  '    <a href="/" class="back-home">← Back to TimeVault</a>',
  breadcrumbHTML + '    <a href="/" class="back-home">← Back to TimeVault</a>'
);

fs.writeFileSync(indexPath, content);
console.log('Blog index SEO optimized');
