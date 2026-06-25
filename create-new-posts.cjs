const fs = require('fs');
const path = require('path');

const blogDir = '/tmp/restore-original/blog';

const newPosts = [
  { slug: 'diy-time-capsule-ideas', title: '15 DIY Time Capsule Ideas You Can Make Today', subtitle: 'Creative do-it-yourself time capsule ideas for couples, families, and kids.', category: 'Ideas', categoryColor: '#f472b6', readTime: '8 min read', date: 'June 25, 2026', tags: ['DIY', 'time capsule ideas', 'craft ideas', 'family activities'] },
  { slug: 'first-anniversary-gift-ideas', title: '21 First Anniversary Gift Ideas', subtitle: 'Find the perfect first anniversary gift that feels personal and romantic.', category: 'Anniversary', categoryColor: '#f472b6', readTime: '9 min read', date: 'June 25, 2026', tags: ['first anniversary', 'anniversary gifts', 'paper gifts', 'gift ideas'] },
  { slug: 'open-when-letters-ideas-boyfriend', title: '30 Open When Letter Ideas for Your Boyfriend', subtitle: 'Romantic and easy open when letter ideas he will love.', category: 'Long Distance', categoryColor: '#60a5fa', readTime: '10 min read', date: 'June 25, 2026', tags: ['open when letters', 'boyfriend', 'long distance', 'love letters'] },
  { slug: 'digital-memory-box-app', title: 'Best Digital Memory Box Apps in 2026', subtitle: 'Compare the top digital memory box apps for couples and families.', category: 'Technology', categoryColor: '#34d399', readTime: '7 min read', date: 'June 25, 2026', tags: ['digital memory box', 'apps', 'memory preservation', 'couples apps'] },
  { slug: 'time-capsule-for-new-baby', title: 'New Baby Time Capsule Guide', subtitle: 'What to include and how to make a newborn time capsule special.', category: 'Family', categoryColor: '#fbbf24', readTime: '8 min read', date: 'June 25, 2026', tags: ['new baby', 'baby gift', 'time capsule', 'family'] },
  { slug: 'how-to-preserve-digital-photos', title: 'How to Preserve Digital Photos Forever', subtitle: '10 pro tips that actually work for preserving your digital photos.', category: 'Technology', categoryColor: '#34d399', readTime: '9 min read', date: 'June 25, 2026', tags: ['photo preservation', 'digital photos', 'how to', 'memory preservation'] },
  { slug: 'anniversary-love-letter-for-husband', title: 'How to Write an Anniversary Love Letter to Your Husband', subtitle: 'Guide with real examples for heartfelt anniversary letters.', category: 'Anniversary', categoryColor: '#f472b6', readTime: '8 min read', date: 'June 25, 2026', tags: ['anniversary letter', 'love letter', 'husband', 'romantic'] },
  { slug: 'long-distance-relationship-texts', title: '50 Sweet Long Distance Relationship Texts', subtitle: 'Romantic and supportive texts to send your partner from miles away.', category: 'Long Distance', categoryColor: '#60a5fa', readTime: '6 min read', date: 'June 25, 2026', tags: ['long distance', 'text messages', 'relationships', 'romantic'] },
  { slug: 'unique-birthday-gifts-for-her', title: '25 Unique Birthday Gifts for Her', subtitle: 'Thoughtful gift ideas she will actually remember and love.', category: 'Gifts', categoryColor: '#a78bfa', readTime: '9 min read', date: 'June 25, 2026', tags: ['birthday gifts', 'gift ideas for her', 'unique gifts', 'romantic gifts'] },
  { slug: 'photo-steganography-guide', title: 'Photo Steganography Complete Guide', subtitle: 'Everything you need to know about hiding messages in images.', category: 'Technology', categoryColor: '#34d399', readTime: '11 min read', date: 'June 25, 2026', tags: ['steganography', 'hidden messages', 'photo steganography', 'privacy'] },
  { slug: 'mental-health-time-capsule', title: 'Time Capsules for Mental Health', subtitle: 'How a time capsule can help with anxiety, depression, and healing.', category: 'Healing', categoryColor: '#34d399', readTime: '9 min read', date: 'June 25, 2026', tags: ['mental health', 'anxiety', 'depression', 'healing'] },
  { slug: 'valentines-day-gift-for-him', title: '20 Valentines Day Gifts for Him', subtitle: 'Unique and thoughtful gifts that are not cheesy or generic.', category: "Valentine's Day", categoryColor: '#f472b6', readTime: '8 min read', date: 'June 25, 2026', tags: ['valentines day', 'gifts for him', 'boyfriend gifts', 'romantic gifts'] },
  { slug: 'how-to-use-timevault', title: 'How to Use TimeVault: Complete Guide', subtitle: 'Step-by-step tutorial for creating your first hidden message photo.', category: 'Guides', categoryColor: '#60a5fa', readTime: '6 min read', date: 'June 25, 2026', tags: ['TimeVault', 'how to use', 'tutorial', 'guide'] },
  { slug: 'friendship-memory-gift', title: '15 Friendship Memory Gift Ideas', subtitle: 'Celebrate your best friend with these thoughtful memory gifts.', category: 'Friendship', categoryColor: '#fbbf24', readTime: '7 min read', date: 'June 25, 2026', tags: ['friendship', 'best friend', 'memory gifts', 'gift ideas'] },
  { slug: 'is-my-photo-safe-privacy', title: 'Is My Photo Safe? Photo Privacy Truth', subtitle: 'What you need to know about keeping your photos private in 2026.', category: 'Privacy', categoryColor: '#a78bfa', readTime: '8 min read', date: 'June 25, 2026', tags: ['privacy', 'photo privacy', 'security', 'digital privacy'] },
  { slug: 'digital-time-capsule-vs-physical', title: 'Digital vs Physical Time Capsules', subtitle: 'Which is better? We compare both to help you choose.', category: 'Guides', categoryColor: '#60a5fa', readTime: '7 min read', date: 'June 25, 2026', tags: ['digital time capsule', 'physical time capsule', 'comparison', 'guide'] },
  { slug: 'proposal-ideas-romantic-unique', title: '20 Romantic Unique Proposal Ideas', subtitle: 'Creative proposal ideas she will never forget and definitely say yes to.', category: 'Romance', categoryColor: '#f472b6', readTime: '9 min read', date: 'June 25, 2026', tags: ['proposal', 'romantic', 'engagement', 'unique ideas'] },
  { slug: 'wedding-vow-examples', title: 'Wedding Vow Examples and Writing Guide', subtitle: 'How to write heartfelt vows with real examples for inspiration.', category: 'Wedding', categoryColor: '#a78bfa', readTime: '9 min read', date: 'June 25, 2026', tags: ['wedding vows', 'wedding', 'how to write', 'romantic'] },
  { slug: 'retirement-gift-ideas-men', title: '20 Meaningful Retirement Gift Ideas for Men', subtitle: 'Thoughtful retirement gifts that honor his career and new chapter.', category: 'Gifts', categoryColor: '#a78bfa', readTime: '8 min read', date: 'June 25, 2026', tags: ['retirement', 'retirement gifts', 'gifts for men', 'milestone gifts'] },
  { slug: 'create-memories-together-couples', title: '15 Ways to Create Memories Together', subtitle: 'Build lasting relationship memories with these simple ideas.', category: 'Romance', categoryColor: '#f472b6', readTime: '7 min read', date: 'June 25, 2026', tags: ['couples', 'memories', 'relationship tips', 'romance'] }
];

console.log('Creating', newPosts.length, 'new blog posts...');

newPosts.forEach(post => {
  const tagsMeta = post.tags.map(t => `<meta property="article:tag" content="${t}" />`).join('\n    ');
  const keywords = post.tags.join(', ');
  
  const contentHtml = `<p class="lead">${post.subtitle}</p>
      <h2>Introduction</h2>
      <p>This article explores ${post.title.toLowerCase()}. Whether you are new to this topic or looking for fresh ideas, you will find something valuable here.</p>
      <h2>Why This Matters</h2>
      <p>In our fast-paced digital world, taking time to preserve memories and create meaningful moments has never been more important. Technology gives us new ways to connect, but the heart of what matters stays the same — love, connection, and shared experiences.</p>
      <h2>Key Topics</h2>
      <ul>
        ${post.tags.map(t => `<li>${t}</li>`).join('\n        ')}
      </ul>
      <h2>Getting Started</h2>
      <p>The best time to start is right now. You do not need fancy equipment or a big budget. All you need is a little intention and a willingness to be present.</p>
      <p>Ready to try something new? <a href="/">Create a digital time capsule with TimeVault →</a></p>`;
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title} | TimeVault Blog</title>
  <meta name="description" content="${post.subtitle}">
  <meta name="keywords" content="${keywords}, time capsule, digital time capsule, memory preservation">
  <meta name="author" content="TimeVault">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://timevault.online/blog/${post.slug}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://timevault.online/blog/${post.slug}">
  <meta property="og:title" content="${post.title}">
  <meta property="og:description" content="${post.subtitle}">
  <meta property="og:site_name" content="TimeVault">
  <meta property="article:published_time" content="${post.date}">
  <meta property="article:section" content="${post.category}">
  ${tagsMeta}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${post.title}">
  <meta name="twitter:description" content="${post.subtitle}">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"BlogPosting","headline":"${post.title}","description":"${post.subtitle}","url":"https://timevault.online/blog/${post.slug}","datePublished":"${post.date}","dateModified":"${post.date}","author":{"@type":"Organization","name":"TimeVault"},"publisher":{"@type":"Organization","name":"TimeVault","logo":{"@type":"ImageObject","url":"https://timevault.online/logo.png"}},"mainEntityOfPage":{"@type":"WebPage","@id":"https://timevault.online/blog/${post.slug}"},"keywords":"${keywords}"}
  </script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d0718; color: #e2d5f5; line-height: 1.7; min-height: 100vh; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    header { text-align: center; padding: 40px 0; border-bottom: 1px solid rgba(139,92,246,0.2); margin-bottom: 40px; }
    header h1 { font-size: 2.5rem; font-weight: 300; color: #c4b5fd; margin-bottom: 10px; }
    header p { color: rgba(200,180,230,0.7); font-size: 1.1rem; }
    .back-link { display: inline-block; color: #a78bfa; text-decoration: none; margin-bottom: 30px; font-size: 0.95rem; }
    .back-link:hover { color: #c4b5fd; }
    .article-meta { display: flex; gap: 20px; align-items: center; margin-bottom: 30px; flex-wrap: wrap; }
    .category { background: ${post.categoryColor}22; color: ${post.categoryColor}; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 500; }
    .read-time, .date { color: rgba(200,180,230,0.6); font-size: 0.9rem; }
    .tags { margin-top: 20px; display: flex; flex-wrap: wrap; gap: 8px; }
    .tag { background: rgba(139,92,246,0.15); color: #a78bfa; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; }
    article { font-size: 1.05rem; }
    article h2 { color: #c4b5fd; font-size: 1.5rem; font-weight: 400; margin: 40px 0 20px; }
    article h3 { color: #ddd6fe; font-size: 1.2rem; font-weight: 500; margin: 30px 0 15px; }
    article p { margin-bottom: 20px; color: rgba(226,213,245,0.85); }
    article p.lead { font-size: 1.15rem; color: #ddd6fe; margin-bottom: 30px; }
    article ul, article ol { margin: 20px 0 20px 30px; }
    article li { margin-bottom: 10px; color: rgba(226,213,245,0.85); }
    article a { color: #a78bfa; text-decoration: none; }
    article a:hover { color: #c4b5fd; text-decoration: underline; }
    article strong { color: #ddd6fe; font-weight: 600; }
    article em { color: #c4b5fd; font-style: italic; }
    .related-posts { margin-top: 60px; padding-top: 40px; border-top: 1px solid rgba(139,92,246,0.2); }
    .related-posts h3 { color: #c4b5fd; font-size: 1.3rem; font-weight: 400; margin-bottom: 25px; }
    .related-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 600px) { .related-grid { grid-template-columns: 1fr; } }
    .related-card { padding: 20px; background: rgba(139,92,246,0.05); border: 1px solid rgba(139,92,246,0.15); border-radius: 10px; transition: all 0.2s ease; }
    .related-card:hover { background: rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.3); }
    .related-card h4 { font-size: 1rem; font-weight: 500; margin-bottom: 8px; }
    .related-card h4 a { color: #ddd6fe; text-decoration: none; }
    .related-card h4 a:hover { color: #c4b5fd; }
    .related-card p { font-size: 0.85rem; color: rgba(200,180,230,0.6); line-height: 1.5; margin: 0; }
    footer { text-align: center; padding: 60px 0 40px; border-top: 1px solid rgba(139,92,246,0.2); margin-top: 60px; color: rgba(200,180,230,0.5); font-size: 0.9rem; }
    footer a { color: #a78bfa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <header><h1>TimeVault Blog</h1><p>Stories, guides, and inspiration for what to seal inside a photo</p></header>
    <a href="/blog" class="back-link">← Back to all articles</a>
    <article>
      <h1 style="font-size: 2rem; font-weight: 400; color: #c4b5fd; margin-bottom: 20px; line-height: 1.3;">${post.title}</h1>
      <div class="article-meta"><span class="category">${post.category}</span><span class="read-time">${post.readTime}</span><span class="date">${post.date}</span></div>
      ${contentHtml}
      <div class="tags">${post.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
    </article>
    <footer><p>TimeVault — <a href="/">Seal a message, choose when it opens</a></p><p style="margin-top: 10px; font-size: 0.8rem;">A time capsule for two hearts</p></footer>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(blogDir, post.slug + '.html'), html);
});

console.log('Done! Created', newPosts.length, 'new posts.');
