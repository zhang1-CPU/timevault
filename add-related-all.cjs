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
  const tagsMatch = content.match(/<div class="tags">([\s\S]*?)<\/div>/);
  
  let tags = [];
  if (tagsMatch) {
    const tagMatches = tagsMatch[1].match(/<span class="tag">([^<]+)<\/span>/g);
    if (tagMatches) {
      tags = tagMatches.map(t => t.replace(/<\/?span[^>]*>/g, ''));
    }
  }
  
  posts.push({
    slug,
    title: titleMatch ? titleMatch[1] : slug,
    category: categoryMatch ? categoryMatch[1] : '',
    description: descMatch ? descMatch[1] : '',
    tags
  });
});

console.log('Total posts parsed:', posts.length);

// Find related posts function
function findRelatedPosts(currentPost, allPosts, limit = 4) {
  const scored = allPosts
    .filter(p => p.slug !== currentPost.slug)
    .map(p => {
      let score = 0;
      if (p.category === currentPost.category) score += 10;
      const sharedTags = p.tags.filter(t => currentPost.tags.includes(t));
      score += sharedTags.length * 3;
      const currentWords = currentPost.title.toLowerCase().split(/\s+/);
      const pWords = p.title.toLowerCase().split(/\s+/);
      const sharedWords = currentWords.filter(w => pWords.includes(w) && w.length > 3);
      score += sharedWords.length;
      return { post: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return scored.map(s => s.post);
}

// Add related posts to articles that don't have them
let count = 0;
posts.forEach(currentPost => {
  const filePath = path.join(blogDir, currentPost.slug + '.html');
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('related-posts')) {
    return;
  }
  
  const related = findRelatedPosts(currentPost, posts);
  
  const relatedHTML = `
      <div class="related-posts">
        <h3>You might also like</h3>
        <div class="related-grid">
${related.map(p => `          <div class="related-card">
            <h4><a href="/blog/${p.slug}">${p.title}</a></h4>
            <p>${p.description.length > 100 ? p.description.substring(0, 100) + '...' : p.description}</p>
          </div>`).join('\n')}
        </div>
      </div>`;
  
  content = content.replace('    </article>', relatedHTML + '\n    </article>');
  fs.writeFileSync(filePath, content);
  count++;
});

console.log('Added related posts to', count, 'articles');
