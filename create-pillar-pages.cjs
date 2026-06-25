const fs = require('fs');
const path = require('path');

const blogDir = '/tmp/restore-original/blog';

// Pillar Page 1: Anniversary Guide
const anniversaryPosts = [
  { slug: 'anniversary-gift-ideas-time-capsule', title: 'Best Anniversary Gifts That Actually Mean Something', desc: 'Forget generic gifts. These anniversary gift ideas are personal, meaningful, and will be remembered forever.' },
  { slug: 'anniversary-letters-sealed-in-time', title: 'Anniversary Letters Sealed in Time', desc: 'Why writing anniversary letters and sealing them away is one of the most romantic things you can do.' },
  { slug: 'first-anniversary-time-capsule-ideas', title: 'First Anniversary Time Capsule Ideas', desc: 'Creative first anniversary time capsule ideas to celebrate your first year of marriage.' },
  { slug: 'first-anniversary-gift-ideas', title: '21 First Anniversary Gift Ideas', desc: 'From paper gifts to digital surprises, find the perfect first anniversary gift.' },
  { slug: 'anniversary-love-letter-for-husband', title: 'How to Write an Anniversary Love Letter to Your Husband', desc: 'Guide with real examples for heartfelt anniversary letters he will never forget.' },
  { slug: 'how-to-write-anniversary-letter', title: 'How to Write an Anniversary Letter', desc: 'Step-by-step guide to writing anniversary letters that make them cry (in a good way).' },
  { slug: 'love-after-decades', title: 'Love After Decades: Keeping the Spark Alive', desc: 'How couples who have been together for decades keep their love strong and growing.' },
  { slug: 'romantic-time-capsule-ideas', title: 'Romantic Time Capsule Ideas for Couples', desc: 'The most romantic time capsule ideas for couples who want to preserve their love story.' }
];

const anniversaryContent = `
      <p class="lead">Anniversaries are more than just a date on the calendar. They are a chance to celebrate your love, reflect on your journey together, and create new memories. This complete guide covers everything you need to make every anniversary special.</p>
      
      <h2>Why Anniversaries Matter</h2>
      <p>Anniversaries are important because they give us a reason to pause and appreciate what we have built together. In the busyness of everyday life, it is easy to take each other for granted. Anniversaries force us to slow down, look back, and say "I love you" in a meaningful way.</p>
      <p>They are also an opportunity to create traditions. The things you do on your first anniversary become the things you do on your tenth, your twenty-fifth, your fiftieth.</p>
      
      <h2>Anniversary Gift Ideas by Year</h2>
      <h3>1st Anniversary — Paper</h3>
      <p>The paper anniversary is all about new beginnings. Handwritten letters, art prints, custom maps, and <a href="/blog/first-anniversary-gift-ideas">first anniversary gift ideas</a> that feel personal and romantic.</p>
      
      <h3>5th Anniversary — Wood</h3>
      <p>Wood represents strength and growth. A custom frame, a wooden jewelry box, or planting a tree together are all beautiful options.</p>
      
      <h3>10th Anniversary — Tin/Aluminum</h3>
      <p>Ten years together deserves celebration. Consider a <a href="/blog/romantic-time-capsule-ideas">romantic time capsule</a> to open on your 20th anniversary.</p>
      
      <h3>25th Anniversary — Silver</h3>
      <p>A quarter of a century together. Silver jewelry, a renewal of vows, or a trip to where you first met are all perfect.</p>
      
      <h2>The Best Anniversary Gifts Are Not Things</h2>
      <p>The most memorable anniversary gifts are rarely the most expensive. They are the most thoughtful.</p>
      <ul>
        <li>A handwritten letter telling them exactly what they mean to you</li>
        <li>Re-creating your first date</li>
        <li>A <a href="/blog/digital-memory-box-app">digital memory box</a> of your year together</li>
        <li>Writing letters to each other for the future</li>
        <li>An experience you have always wanted to try together</li>
      </ul>
      
      <h2>Writing Anniversary Letters</h2>
      <p>One of the most powerful things you can do is write an anniversary letter. Not just any letter — a letter that captures this moment in time, that tells your partner exactly how you feel, that can be read again and again for years to come.</p>
      <p>Our guide on <a href="/blog/how-to-write-anniversary-letter">how to write an anniversary letter</a> will walk you through it step by step, with examples to inspire you.</p>
      <p>And if you want to make it even more special? <a href="/">Hide the letter inside a photo using TimeVault</a>. They get the photo now, but the message inside waits for your next anniversary. The reveal moment is unforgettable.</p>
      
      <h2>Traditions to Start on Your First Anniversary</h2>
      <ul>
        <li><strong>Write a letter to each other every year.</strong> Seal them away and read them all on your 10th anniversary.</li>
        <li><strong>Create a time capsule together.</strong> Add something new every year.</li>
        <li><strong>Recreate your first date.</strong> Same place, same outfits, same food. Do it every year.</li>
        <li><strong>Plant something.</strong> A tree, a rose bush, a garden. Watch it grow as your marriage grows.</li>
        <li><strong>Take the same photo every year.</strong> Same pose, same spot. Years from now, you will have an incredible series.</li>
      </ul>
      
      <h2>All Our Anniversary Guides</h2>
      <div class="post-list" style="margin-top: 20px;">
        ${anniversaryPosts.map(p => `
        <article class="post-card">
          <h3 style="margin-bottom: 8px; font-size: 1.1rem;"><a href="/blog/${p.slug}" style="color: #ddd6fe; text-decoration: none;">${p.title}</a></h3>
          <p style="font-size: 0.9rem; color: rgba(200,180,230,0.6); margin: 0;">${p.desc}</p>
        </article>`).join('')}
      </div>
      
      <h2>Final Thought</h2>
      <p>Anniversaries are not about perfection. They are about presence. About showing up for each other, year after year, through the good times and the hard times.</p>
      <p>Whether your first or your fiftieth, every anniversary is a gift. Make the most of it.</p>
      <p>Ready to create something special? <a href="/">Make a digital anniversary memory with TimeVault →</a></p>
    `;

// Pillar Page 2: Long Distance Guide
const longDistancePosts = [
  { slug: 'long-distance-relationship-gifts', title: 'Long Distance Relationship Gifts That Bridge the Miles', desc: 'Gifts that make the distance feel smaller and your connection feel stronger.' },
  { slug: 'long-distance-relationship-love-letter', title: 'Long Distance Love Letters to Keep the Flame Alive', desc: 'What to write when you are miles apart — long distance love letters that make them feel close.' },
  { slug: 'long-distance-relationship-time-capsule', title: 'Long Distance Relationship Time Capsule Ideas', desc: 'Creative ways to build shared memories even when you are apart.' },
  { slug: 'long-distance-relationship-texts', title: '50 Sweet Long Distance Relationship Texts', desc: 'Romantic and supportive texts to send your partner from miles away.' },
  { slug: 'open-when-letters-ideas', title: 'Open When Letter Ideas for Every Situation', desc: 'Creative open when letter ideas for every mood and moment — from missing you to celebrating.' },
  { slug: 'open-when-letters-ideas-boyfriend', title: '30 Open When Letter Ideas for Your Boyfriend', desc: 'Romantic and easy open when letter ideas he will love, from miss you to need a laugh.' },
  { slug: 'future-message-app-couples', title: 'Best Future Message Apps for Long Distance Couples', desc: 'Apps that let you send messages that arrive in the future — perfect for long distance love.' },
  { slug: 'privacy-messaging-app-couples', title: 'Most Private Messaging Apps for Couples', desc: 'Keep your conversations just between the two of you with these secure messaging apps.' }
];

const longDistanceContent = `
      <p class="lead">Long distance relationships are hard. But they are also proof that love can survive — and thrive — across miles. This complete guide covers everything you need to make your long distance relationship not just survive, but grow stronger.</p>
      
      <h2>Why Long Distance Is Hard (And Worth It)</h2>
      <p>Let us be honest: long distance sucks. You miss them. You miss the casual touches, the morning coffee together, the way they laugh at your bad jokes in person. There are nights you go to bed alone and wonder if it is worth it.</p>
      <p>But here is the truth: long distance relationships can also make you stronger. They force you to communicate better, to appreciate each other more, to build a foundation that is not just physical.</p>
      <p>Couples who survive long distance often come out the other side with a deeper appreciation for each other. Because they chose each other, every single day, even when it was hard.</p>
      
      <h2>Staying Connected When You Are Apart</h2>
      <p>The key to a successful long distance relationship is intentional communication. Not just "how was your day?" texts — real, meaningful connection.</p>
      <h3>Daily Check-Ins</h3>
      <p>Good morning and good night texts are a given. But go deeper. Send each other <a href="/blog/long-distance-relationship-texts">sweet messages throughout the day</a> that show you are thinking of them.</p>
      <h3>Quality Time Over Video</h3>
      <p>FaceTime and Zoom are your friends. But do not just sit there scrolling. Do things together:</p>
      <ul>
        <li>Cook the same recipe together over video</li>
        <li>Watch a movie at the same time</li>
        <li>Play online games together</li>
        <li>Do a virtual date — dress up, make nice food, eat "together"</li>
      </ul>
      <h3>Shared Activities</h3>
      <p>Just because you are apart does not mean you cannot share experiences. Read the same book and discuss it. Start a show together and watch an episode a week. Take a walk at the same time and talk on the phone.</p>
      
      <h2>Gifts That Bridge the Distance</h2>
      <p>A good long distance gift makes them feel close, even when you are far away. Here are some of our favorites:</p>
      <ul>
        <li><strong>Open when letters.</strong> A set of letters for different moments — "open when you miss me," "open when you need a laugh," "open when you are stressed." Our <a href="/blog/open-when-letters-ideas">open when letter ideas</a> guide has 30+ ideas.</li>
        <li><strong>Hidden message photos.</strong> Send a photo with a <a href="/">secret message hidden inside</a>. They unlock it with a PIN on a special date. It feels like getting a letter from the future.</li>
        <li><strong>Care packages.</strong> Fill a box with their favorite snacks, a cozy blanket, and handwritten notes.</li>
        <li><strong>Matching items.</strong> Matching hoodies, jewelry, or mugs. When they look at theirs, they think of you.</li>
        <li><strong>A surprise visit.</strong> Nothing beats this one (if you can swing it).</li>
      </ul>
      
      <h2>Writing Long Distance Love Letters</h2>
      <p>There is something special about getting a real letter in the mail when you are long distance. It is tangible. It is something you can hold. It is proof that someone was thinking about you enough to sit down and write.</p>
      <p>Not sure what to write? Our <a href="/blog/long-distance-relationship-love-letter">long distance love letter guide</a> has examples and ideas to inspire you.</p>
      <p>And if you want something even more special? Try <a href="/">TimeVault</a>. Hide a love letter inside a photo of you two. Send them the photo now — they unlock the message on the day you see each other next. The countdown makes the reunion even sweeter.</p>
      
      <h2>Dealing With Hard Days</h2>
      <p>Long distance has hard days. Days when you miss them so much it hurts. Days when you wonder if it is worth it. Days when jealousy or loneliness creep in.</p>
      <p>That is normal. It does not mean your relationship is broken. It means you are human, and you love each other.</p>
      <p>On those days:</p>
      <ul>
        <li>Talk about it. Be honest about how you feel.</li>
        <li>Plan your next visit. Having something to look forward to helps.</li>
        <li>Remind each other why you are doing this.</li>
        <li>Remember: this is temporary. The distance will not last forever.</li>
      </ul>
      
      <h2>All Our Long Distance Guides</h2>
      <div class="post-list" style="margin-top: 20px;">
        ${longDistancePosts.map(p => `
        <article class="post-card">
          <h3 style="margin-bottom: 8px; font-size: 1.1rem;"><a href="/blog/${p.slug}" style="color: #ddd6fe; text-decoration: none;">${p.title}</a></h3>
          <p style="font-size: 0.9rem; color: rgba(200,180,230,0.6); margin: 0;">${p.desc}</p>
        </article>`).join('')}
      </div>
      
      <h2>Final Thought</h2>
      <p>Long distance is not easy. But anything worth having is worth working for. And a love that survives miles? That is the kind of love that lasts a lifetime.</p>
      <p>Be patient with each other. Be kind. Communicate openly. And never forget: the day you are finally together again will make all the hard days worth it.</p>
      <p>Want to create something special for your long distance love? <a href="/">Hide a message in a photo with TimeVault →</a></p>
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
  'anniversary-guide',
  'The Complete Anniversary Guide for Couples',
  'Everything you need to make every anniversary special — gift ideas, letter writing tips, traditions to start, and more.',
  'The ultimate guide to anniversaries for couples — gift ideas by year, letter writing tips, traditions to start, and creative ways to celebrate your love.',
  'anniversary guide, anniversary gifts, anniversary letters, anniversary ideas, romantic anniversary'
);

createPillarPage(
  'long-distance-relationship-guide',
  'The Complete Long Distance Relationship Guide',
  'Everything you need to make your long distance relationship thrive — communication tips, gift ideas, letter templates, and staying connected.',
  'The ultimate guide to long distance relationships — staying connected, gift ideas, love letters, open when letters, and making it work across miles.',
  'long distance relationship guide, long distance love, long distance gifts, open when letters, staying connected'
);

console.log('Done! Created 2 pillar pages.');
