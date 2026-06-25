const fs = require('fs');
const path = require('path');

const blogDir = '/tmp/restore-original/blog';

// Pillar Page 3: Wedding Guide
const weddingPosts = [
  { slug: 'time-capsule-for-wedding-day', title: 'Wedding Day Time Capsule Ideas', desc: 'Save your wedding day in a time capsule you will open on your anniversary.' },
  { slug: 'wedding-vow-renewal-ideas', title: 'Vow Renewal Ideas to Reignite Your Love', desc: 'Meaningful vow renewal ideas to celebrate your love all over again.' },
  { slug: 'diy-wedding-gifts-for-couple', title: 'DIY Wedding Gifts for the Couple', desc: 'Thoughtful DIY wedding gifts that feel personal and heartfelt.' },
  { slug: 'first-anniversary-time-capsule-ideas', title: 'First Anniversary Time Capsule Ideas', desc: 'Creative first anniversary time capsule ideas to celebrate year one.' },
  { slug: 'anniversary-letters-sealed-in-time', title: 'Anniversary Letters Sealed in Time', desc: 'Why writing anniversary letters and sealing them away is one of the most romantic things you can do.' },
  { slug: 'how-to-write-anniversary-letter', title: 'How to Write an Anniversary Letter', desc: 'Step-by-step guide to writing anniversary letters that make them cry (in a good way).' },
  { slug: 'romantic-time-capsule-ideas', title: 'Romantic Time Capsule Ideas for Couples', desc: 'The most romantic time capsule ideas for couples who want to preserve their love story.' },
  { slug: 'love-after-decades', title: 'Love After Decades: Keeping the Spark Alive', desc: 'How couples who have been together for decades keep their love strong and growing.' }
];

const weddingContent = `
      <p class="lead">Your wedding day is just the beginning. This complete guide covers everything from engagement to your golden anniversary — all the ways to make your love story last a lifetime.</p>
      
      <h2>Your Wedding Day: Start With Intention</h2>
      <p>A great marriage starts with a great wedding. Not an expensive one — an intentional one. The day you say "I do" sets the tone for everything that comes after.</p>
      <p>One of our favorite wedding day traditions? Creating a <a href="/blog/time-capsule-for-wedding-day">wedding day time capsule</a>. Fill it with your vows, a piece of cake, letters to each other, and mementos from the day. Seal it. Then open it on your first, fifth, tenth anniversary.</p>
      <p>It turns one day into a tradition that lasts forever.</p>
      
      <h2>Before the Wedding</h2>
      <h3>Engagement Season</h3>
      <p>Engagement is such a special time. It is the calm before the storm of wedding planning. Take time to enjoy it. Here are some ideas:</p>
      <ul>
        <li>Write letters to each other about why you said yes</li>
        <li>Create a <a href="/blog/first-date-memory-capsule">first date memory capsule</a></li>
        <li>Start a shared journal</li>
        <li>Take engagement photos (you will cherish these later)</li>
      </ul>
      
      <h3>Wedding Planning Tips</h3>
      <p>Wedding planning can be stressful. Remember: the marriage is more important than the wedding. Here are our tips:</p>
      <ul>
        <li>Pick three things that matter most to you both. Focus on those. Let the rest go.</li>
        <li>Date night every week — no wedding talk allowed</li>
        <li>Write your own vows. It is worth it.</li>
        <li>Take five minutes alone on your wedding day. Just the two of you. Breathe. Take it in.</li>
      </ul>
      
      <h2>Anniversary Traditions to Start on Year One</h2>
      <p>Do not wait until your 10th anniversary to start traditions. Start on year one. Small traditions become big ones.</p>
      <ul>
        <li><strong>Write a letter to each other every year.</strong> Seal them away. Read them all on your 10th anniversary.</li>
        <li><strong>Recreate your first date.</strong> Same place, same food, same outfits.</li>
        <li><strong>Add to your wedding time capsule.</strong> Every anniversary, add something new.</li>
        <li><strong>Take the same photo every year.</strong> Years from now, you will have an incredible series.</li>
      </ul>
      <p>Our <a href="/blog/anniversary-guide">complete anniversary guide</a> has even more ideas for every year.</p>
      
      <h2>Gift Ideas for Every Milestone</h2>
      <p>Great gifts are not about money. They are about thoughtfulness. About seeing the other person and saying "I get you."</p>
      <ul>
        <li><strong>1st anniversary (Paper):</strong> Handwritten letters, art prints, <a href="/blog/first-anniversary-gift-ideas">more paper gift ideas</a></li>
        <li><strong>5th anniversary (Wood):</strong> Custom frames, planting a tree, wooden keepsakes</li>
        <li><strong>10th anniversary (Tin/Aluminum):</strong> A <a href="/blog/romantic-time-capsule-ideas">romantic time capsule</a> to open on your 20th</li>
        <li><strong>25th anniversary (Silver):</strong> Vow renewal, trip to where you met</li>
      </ul>
      
      <h2>Keeping the Spark Alive</h2>
      <p>Love is not just a feeling. It is a choice you make every day. After the wedding, after the honeymoon, after the kids, after the hard days — you choose each other.</p>
      <p>Here is what couples who have been together for decades know:</p>
      <ul>
        <li>Never stop dating each other</li>
        <li>Say "I love you" every day</li>
        <li>Fight fair — you are on the same team</li>
        <li>Laugh together, every single day</li>
        <li>Keep learning about each other — people change</li>
      </ul>
      <p>Our guide on <a href="/blog/love-after-decades">keeping love alive after decades</a> has more wisdom from couples who have been there.</p>
      
      <h2>All Our Wedding & Marriage Guides</h2>
      <div class="post-list" style="margin-top: 20px;">
        ${weddingPosts.map(p => `
        <article class="post-card">
          <h3 style="margin-bottom: 8px; font-size: 1.1rem;"><a href="/blog/${p.slug}" style="color: #ddd6fe; text-decoration: none;">${p.title}</a></h3>
          <p style="font-size: 0.9rem; color: rgba(200,180,230,0.6); margin: 0;">${p.desc}</p>
        </article>`).join('')}
      </div>
      
      <h2>Final Thought</h2>
      <p>A wedding is one day. A marriage is a lifetime. Make the day special. But make the lifetime even more special.</p>
      <p>Every "I love you," every date night, every hand held through hard times — that is what builds a marriage. That is what builds a life.</p>
      <p>Ready to start a beautiful tradition? <a href="/">Create a wedding time capsule with TimeVault →</a></p>
    `;

// Pillar Page 4: Gift Guide
const giftPosts = [
  { slug: 'anniversary-gift-ideas-time-capsule', title: 'Best Anniversary Gifts That Actually Mean Something', desc: 'Forget generic gifts. These anniversary gift ideas are personal, meaningful, and will be remembered forever.' },
  { slug: 'long-distance-relationship-gifts', title: 'Long Distance Relationship Gifts That Bridge the Miles', desc: 'Gifts that make the distance feel smaller and your connection feel stronger.' },
  { slug: 'diy-wedding-gifts-for-couple', title: 'DIY Wedding Gifts for the Couple', desc: 'Thoughtful DIY wedding gifts that feel personal and heartfelt.' },
  { slug: 'time-capsule-for-parents-anniversary', title: "Time Capsule Gift for Parents' Anniversary", desc: 'The most meaningful anniversary gift your parents will ever receive.' },
  { slug: 'time-capsule-for-best-friends', title: "Best Friend Time Capsule Ideas", desc: 'Capture your friendship in a time capsule to open years from now.' },
  { slug: 'open-when-letters-ideas', title: 'Open When Letter Ideas for Every Situation', desc: 'Creative open when letter ideas for every mood and moment.' },
  { slug: 'time-capsule-for-graduation', title: 'Graduation Time Capsule Ideas', desc: 'Capture this milestone in a time capsule your future self will thank you for.' },
  { slug: 'time-capsule-for-babys-first-year', title: "Baby's First Year Time Capsule Ideas", desc: 'Capture every precious moment of baby\'s first year in a time capsule.' }
];

const giftContent = `
      <p class="lead">The best gifts are not the most expensive. They are the most thoughtful. The ones that say "I see you. I know you. I love you." This guide covers meaningful gift ideas for every person and every occasion.</p>
      
      <h2>Why Time Capsules Make the Best Gifts</h2>
      <p>You can buy anyone a sweater. You can order anything online with two-day shipping. But a gift that takes time, thought, and heart?</p>
      <p>That is the gift they remember. That is the gift they keep.</p>
      <p>Time capsule gifts work because they are personal. They tell a story. They capture a moment in time. And they keep giving — every time the person opens it, they feel loved all over again.</p>
      
      <h2>Gift Ideas by Relationship</h2>
      <h3>For Your Partner / Spouse</h3>
      <ul>
        <li><a href="/blog/romantic-time-capsule-ideas">Romantic time capsule</a> — fill it with letters, mementos, and memories from your relationship</li>
        <li><a href="/blog/anniversary-letters-sealed-in-time">Anniversary letters</a> — write a letter for every year ahead</li>
        <li><a href="/blog/first-anniversary-gift-ideas">First anniversary gifts</a> — paper gifts that matter</li>
        <li>A future message: hide a love letter inside a photo, set to open on your next anniversary</li>
      </ul>
      
      <h3>For Long Distance Love</h3>
      <p>When you are miles apart, the best gifts make you feel close. Check out our <a href="/blog/long-distance-relationship-guide">complete long distance guide</a> for more ideas.</p>
      <ul>
        <li><a href="/blog/long-distance-relationship-gifts">Long distance gifts that bridge the miles</a></li>
        <li><a href="/blog/open-when-letters-ideas">Open when letters</a> — for every mood and moment</li>
        <li><a href="/blog/long-distance-relationship-time-capsule">Long distance time capsule</a> — build shared memories even apart</li>
        <li><a href="/blog/future-message-app-couples">Future message apps</a> — send a message that arrives later</li>
      </ul>
      
      <h3>For Best Friends</h3>
      <ul>
        <li><a href="/blog/time-capsule-for-best-friends">Best friend time capsule</a> — capture your friendship right now</li>
        <li><a href="/blog/open-when-letters-ideas-boyfriend">Open when letter ideas</a> (works for best friends too!)</li>
        <li>Custom playlist of your friendship songs</li>
        <li>Scrapbook of your adventures together</li>
      </ul>
      
      <h3>For Parents</h3>
      <ul>
        <li><a href="/blog/time-capsule-for-parents-anniversary">Anniversary time capsule for parents</a> — the gift that makes them cry</li>
        <li>Letters from each kid about what mom/dad means to them</li>
        <li>Family photo book of your favorite memories</li>
        <li>Recorded video messages from the whole family</li>
      </ul>
      
      <h3>For New Parents / Baby</h3>
      <ul>
        <li><a href="/blog/time-capsule-for-babys-first-year">Baby's first year time capsule</a> — capture every precious moment</li>
        <li>Letters to the baby from loved ones</li>
        <li>Handprint and footprint set</li>
        <li>Digital memory box with all the photos and videos</li>
      </ul>
      
      <h2>Gift Ideas by Occasion</h2>
      <ul>
        <li><strong>Anniversaries:</strong> <a href="/blog/anniversary-gift-ideas-time-capsule">Meaningful anniversary gifts</a> that are not just another thing</li>
        <li><strong>Weddings:</strong> <a href="/blog/diy-wedding-gifts-for-couple">DIY wedding gifts</a> that feel personal</li>
        <li><strong>Graduation:</strong> <a href="/blog/time-capsule-for-graduation">Graduation time capsule</a> for the next chapter</li>
        <li><strong>Birthdays:</strong> Letters and memories that celebrate them as a person</li>
        <li><strong>Holidays:</strong> Traditions that last longer than one day</li>
      </ul>
      
      <h2>The Secret to a Great Gift</h2>
      <p>Want to know the secret to giving a great gift? It is not about money. It is about attention.</p>
      <p>Pay attention to what they love. What they talk about. What they wish they had more of. What makes their eyes light up.</p>
      <p>Then give them something that says: "I listen. I see you. I care."</p>
      <p>That is the gift everyone wants. That is the gift no one forgets.</p>
      
      <h2>All Our Gift Guides</h2>
      <div class="post-list" style="margin-top: 20px;">
        ${giftPosts.map(p => `
        <article class="post-card">
          <h3 style="margin-bottom: 8px; font-size: 1.1rem;"><a href="/blog/${p.slug}" style="color: #ddd6fe; text-decoration: none;">${p.title}</a></h3>
          <p style="font-size: 0.9rem; color: rgba(200,180,230,0.6); margin: 0;">${p.desc}</p>
        </article>`).join('')}
      </div>
      
      <h2>Final Thought</h2>
      <p>The best gift you can give anyone is your presence. Your attention. Your time.</p>
      <p>But if you want to pair that with something tangible? A time capsule is perfect. It is not just a thing — it is a memory, a feeling, a moment frozen in time.</p>
      <p>Ready to give a gift they will never forget? <a href="/">Create a digital time capsule with TimeVault →</a></p>
    `;

// Create both pillar pages
function createPillarPage(slug, title, subtitle, description, keywords, content) {
  const tagsMeta = ['guide', 'pillar page', 'time vault', 'memories'].map(t => `<meta property="article:tag" content="${t}" />`).join('\n    ');
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | TimeVault Blog</title>
  <meta name="description" content="${description}">
  <meta name="keywords" content="${keywords}, time capsule, digital time capsule, relationship guide">
  <meta name="author" content="TimeVault">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://timevault.online/blog/${slug}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://timevault.online/blog/${slug}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:site_name" content="TimeVault">
  <meta property="og:image" content="https://timevault.online/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="en_US">
  <meta property="article:published_time" content="June 25, 2026">
  <meta property="article:section" content="Guides">
  ${tagsMeta}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="https://timevault.online/og-image.png">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://timevault.online/"},{"@type":"ListItem","position":2,"name":"Blog","item":"https://timevault.online/blog"},{"@type":"ListItem","position":3,"name":"${title.replace(/"/g, '&quot;')}","item":"https://timevault.online/blog/${slug}"}]}
  </script>
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"BlogPosting","headline":"${title.replace(/"/g, '&quot;')}","description":"${description.replace(/"/g, '&quot;')}","url":"https://timevault.online/blog/${slug}","datePublished":"2026-06-25","dateModified":"2026-06-25","author":{"@type":"Organization","name":"TimeVault"},"publisher":{"@type":"Organization","name":"TimeVault","logo":{"@type":"ImageObject","url":"https://timevault.online/logo.png"}},"mainEntityOfPage":{"@type":"WebPage","@id":"https://timevault.online/blog/${slug}"},"keywords":"${keywords}"}
  </script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d0718; color: #e2d5f5; line-height: 1.7; min-height: 100vh; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    header { text-align: center; padding: 40px 0; border-bottom: 1px solid rgba(139,92,246,0.2); margin-bottom: 40px; }
    header p { color: rgba(200,180,230,0.7); font-size: 1.1rem; }
    .pillars-label { font-size: 0.85rem; font-weight: 500; color: #a78bfa; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; }
    header h1 { font-size: 2.5rem; font-weight: 300; color: #c4b5fd; margin-bottom: 10px; line-height: 1.3; }
    .back-link { display: inline-block; color: #a78bfa; text-decoration: none; margin-bottom: 30px; font-size: 0.95rem; }
    .back-link:hover { color: #c4b5fd; }
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
    .post-list { display: grid; gap: 16px; }
    .post-card { padding: 16px 20px; background: rgba(139,92,246,0.05); border: 1px solid rgba(139,92,246,0.15); border-radius: 10px; transition: all 0.2s ease; }
    .post-card:hover { background: rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.3); }
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
    <header>
      <p class="pillars-label">Pillar Guide</p>
      <h1>${title}</h1>
      <p>${subtitle}</p>
    </header>
    <nav style="margin-bottom: 30px; font-size: 0.9rem; color: rgba(200,180,230,0.6);">
      <a href="/" style="color: #a78bfa; text-decoration: none;">Home</a>
      <span style="margin: 0 8px;">›</span>
      <a href="/blog" style="color: #a78bfa; text-decoration: none;">Blog</a>
      <span style="margin: 0 8px;">›</span>
      <span style="color: rgba(200,180,230,0.8);">${title}</span>
    </nav>
    <a href="/blog" class="back-link">← Back to all articles</a>
    <article>
      ${content}
    </article>
    <footer>
      <p>TimeVault — <a href="/">Seal a message, choose when it opens</a></p>
      <p style="margin-top: 10px; font-size: 0.8rem;">A time capsule for two hearts</p>
    </footer>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(blogDir, slug + '.html'), html);
  console.log('Created pillar page:', slug);
}

createPillarPage(
  'wedding-guide',
  'The Complete Wedding & Marriage Guide',
  'From your wedding day to your golden anniversary — everything you need to build a love that lasts.',
  'The ultimate guide to weddings and marriage — from engagement to anniversary traditions, gift ideas, and keeping love alive for decades.',
  'wedding guide, marriage guide, anniversary traditions, wedding gifts, marriage advice'
);

createPillarPage(
  'gift-guide',
  'The Complete Meaningful Gift Guide',
  'Thoughtful gifts for every person and every occasion — the kind they will never forget.',
  'The ultimate guide to meaningful gifts — anniversary, wedding, birthday, long distance, friendship, and more gift ideas that matter.',
  'gift guide, meaningful gifts, thoughtful gifts, anniversary gifts, birthday gifts, long distance gifts'
);

console.log('Done! Created 2 more pillar pages.');
