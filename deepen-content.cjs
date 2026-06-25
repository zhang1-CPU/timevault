const fs = require('fs');
const path = require('path');

const blogDir = '/tmp/restore-original/blog';

// 20篇新文章的slug列表
const newPosts = [
  'diy-time-capsule-ideas',
  'first-anniversary-gift-ideas',
  'open-when-letters-ideas-boyfriend',
  'digital-memory-box-app',
  'time-capsule-for-new-baby',
  'how-to-preserve-digital-photos',
  'anniversary-love-letter-for-husband',
  'long-distance-relationship-texts',
  'unique-birthday-gifts-for-her',
  'photo-steganography-guide',
  'mental-health-time-capsule',
  'valentines-day-gift-for-him',
  'how-to-use-timevault',
  'friendship-memory-gift',
  'is-my-photo-safe-privacy',
  'digital-time-capsule-vs-physical',
  'proposal-ideas-romantic-unique',
  'wedding-vow-examples',
  'retirement-gift-ideas-men',
  'create-memories-together-couples'
];

// 每篇文章对应的内容扩展和内链
const contentExtensions = {
  'diy-time-capsule-ideas': {
    extraSections: `
      <h2>How to Choose the Right Container</h2>
      <p>The container you choose matters more than you think. It needs to protect your memories for years, maybe even decades.</p>
      <ul>
        <li><strong>Metal boxes:</strong> Durable, but can rust if not properly sealed</li>
        <li><strong>Acid-free boxes:</strong> Best for paper items — prevents yellowing</li>
        <li><strong>Glass jars:</strong> Beautiful display option, but fragile</li>
        <li><strong>Wooden boxes:</strong> Classic and warm, but check for acid content</li>
        <li><strong>Digital options:</strong> No container needed — just your photos and <a href="/">TimeVault</a></li>
      </ul>
      <h2>How to Decorate Your Time Capsule</h2>
      <p>Make it personal. Paint it, decoupage it, add stickers, write on it with markers. The outside should reflect the memories inside.</p>
      <h3>For Couples</h3>
      <p>Add your wedding date, your initials, or a quote that means something to you both. <a href="/blog/couple-mode-two-hearts-one-lock">Couple mode</a> on TimeVault lets you create shared memories digitally.</p>
      <h3>For Families</h3>
      <p>Have each family member add their handprint or a drawing. It becomes a piece of family art as well as a time capsule.</p>
      <h2>How Long Should You Wait to Open It?</h2>
      <p>There is no right answer. Some people open theirs every year. Some wait 10, 20, even 50 years. It depends on what you put inside and why you are making it.</p>
      <p>Here are some popular options:</p>
      <ul>
        <li><strong>1 year:</strong> Great for New Year's resolutions or annual traditions</li>
        <li><strong>5 years:</strong> Enough time to see real change in your life</li>
        <li><strong>10 years:</strong> A decade — enough time to feel nostalgic</li>
        <li><strong>25 years:</strong> Silver anniversary — perfect for wedding time capsules</li>
        <li><strong>50 years:</strong> For future generations to discover</li>
      </ul>
      <p>Not ready for a physical box? <a href="/blog/how-to-create-digital-time-capsule">Create a digital time capsule</a> that you can open anytime, anywhere.</p>
    `,
    faq: [
      { q: 'What do you put in a DIY time capsule?', a: 'Letters, photos, ticket stubs, newspaper clippings, small mementos, and predictions about the future. The most important thing is that each item has meaning to you.' },
      { q: 'How long do time capsules last?', a: 'Physical time capsules can last decades if stored properly in a cool, dry place. Digital time capsules, when properly backed up, can last essentially forever.' },
      { q: 'Where should I bury or store a time capsule?', a: 'If burying, use a waterproof container and choose a spot that is unlikely to be disturbed. If storing indoors, a closet, attic, or safe deposit box works well.' },
      { q: 'How do you make a time capsule for kids?', a: 'Involve them in the process! Let them decorate the box, choose items, and write their own letters. The more they participate, the more meaning it will have.' }
    ]
  },
  'first-anniversary-gift-ideas': {
    extraSections: `
      <h2>The Meaning Behind the Paper Anniversary</h2>
      <p>The first anniversary is traditionally the paper anniversary. Why paper? It represents the blank page your marriage is writing — fresh, delicate, full of potential. It is the start of your story together.</p>
      <p>Paper is also flexible and strong. It can be folded, written on, drawn on, and made into something beautiful. Just like your first year of marriage.</p>
      <h2>How to Make Your Gift Extra Special</h2>
      <p>It is not about how much you spend. It is about how much thought you put into it.</p>
      <ul>
        <li><strong>Write from the heart.</strong> A short, honest letter beats a long, generic one every time.</li>
        <li><strong>Be specific.</strong> Mention exact moments, inside jokes, specific memories.</li>
        <li><strong>Make it an experience.</strong> The gift is great, but the memory of giving it is what lasts.</li>
        <li><strong>Add a time capsule element.</strong> Create a <a href="/blog/how-to-create-digital-time-capsule">digital time capsule</a> together to open on your 5th anniversary.</li>
      </ul>
      <h2>Traditional vs. Modern: Which to Choose?</h2>
      <p>Traditionalists love paper gifts. Modern couples might prefer something more digital or experiential. There is no wrong answer — choose what feels like <em>you</em> as a couple.</p>
      <p>Or combine both! A handwritten letter (traditional) hidden inside a photo using <a href="/">TimeVault</a> (modern). The best of both worlds.</p>
      <h2>First Anniversary Date Ideas to Pair With Your Gift</h2>
      <ul>
        <li>Recreate your first date</li>
        <li>Have a picnic in the park where you got engaged</li>
        <li>Make your wedding cake together (or try to)</li>
        <li>Watch your wedding video together</li>
        <li>Write letters to each other for your 5th anniversary and seal them away</li>
      </ul>
      <p>Looking for more anniversary ideas? Check out our <a href="/blog/romantic-time-capsule-ideas">romantic time capsule ideas</a> guide.</p>
    `,
    faq: [
      { q: 'What is the traditional first anniversary gift?', a: 'Paper is the traditional first anniversary gift. It represents the blank page of your new life together.' },
      { q: 'What is the modern first anniversary gift?', a: 'Clocks are the modern first anniversary gift, symbolizing the time you have shared and the time ahead.' },
      { q: 'How much should I spend on a first anniversary gift?', a: 'There is no set amount. What matters is thought and meaning, not price. Many of the best gifts are free or inexpensive.' },
      { q: 'What should I write in a first anniversary card?', a: 'Write about your favorite memory from the first year, what you love most about your spouse, and what you look forward to in the years ahead.' }
    ]
  },
  'how-to-preserve-digital-photos': {
    extraSections: `
      <h2>The 3-2-1 Backup Rule Explained</h2>
      <p>You have probably heard of the 3-2-1 backup rule. Let us break it down:</p>
      <ul>
        <li><strong>3 copies of your data</strong> — One is not enough. Two is better. Three is the minimum for real safety.</li>
        <li><strong>2 different media types</strong> — Hard drive, cloud, DVD, USB stick. Different technologies fail in different ways.</li>
        <li><strong>1 off-site copy</strong> — If your house burns down, you lose everything stored there. Off-site means a different physical location.</li>
      </ul>
      <p>Following this rule dramatically reduces your risk of losing photos forever.</p>
      <h2>How to Organize Your Digital Photo Collection</h2>
      <p>A thousand unsorted photos is a mess. A well-organized collection is a treasure. Here is how to do it:</p>
      <h3>Choose a Folder Structure</h3>
      <p>Organize by date, by event, or by person. Whatever makes sense to you. Be consistent.</p>
      <p>Example structure: /Photos/2026/2026-06-vacation/</p>
      <h3>Use Descriptive File Names</h3>
      <p>IMG_1234.jpg tells you nothing. "june-2026-beach-sunset.jpg" tells you a lot.</p>
      <h3>Delete Bad Photos</h3>
      <p>Be ruthless. Blurry photos, duplicates, accidental screenshots — delete them. Your future self will thank you.</p>
      <h3>Add Tags and Metadata</h3>
      <p>Most photo apps let you add tags, descriptions, and people labels. Take five minutes a week to do this. It adds up.</p>
      <h2>Photo File Formats: Which Is Best?</h2>
      <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="border-bottom: 1px solid rgba(139,92,246,0.3);">
          <th style="text-align:left; padding: 8px; color: #c4b5fd;">Format</th>
          <th style="text-align:left; padding: 8px; color: #c4b5fd;">Quality</th>
          <th style="text-align:left; padding: 8px; color: #c4b5fd;">File Size</th>
          <th style="text-align:left; padding: 8px; color: #c4b5fd;">Best For</th>
        </tr>
        <tr style="border-bottom: 1px solid rgba(139,92,246,0.1);">
          <td style="padding: 8px;">JPEG</td>
          <td style="padding: 8px;">Good</td>
          <td style="padding: 8px;">Small</td>
          <td style="padding: 8px;">Everyday photos</td>
        </tr>
        <tr style="border-bottom: 1px solid rgba(139,92,246,0.1);">
          <td style="padding: 8px;">PNG</td>
          <td style="padding: 8px;">Excellent</td>
          <td style="padding: 8px;">Large</td>
          <td style="padding: 8px;">Screenshots, graphics</td>
        </tr>
        <tr style="border-bottom: 1px solid rgba(139,92,246,0.1);">
          <td style="padding: 8px;">RAW</td>
          <td style="padding: 8px;">Best</td>
          <td style="padding: 8px;">Very large</td>
          <td style="padding: 8px;">Professional photography</td>
        </tr>
        <tr>
          <td style="padding: 8px;">HEIC</td>
          <td style="padding: 8px;">Excellent</td>
          <td style="padding: 8px;">Small</td>
          <td style="padding: 8px;">iPhone photos</td>
        </tr>
      </table>
      <h2>Adding Stories to Your Photos</h2>
      <p>Photos capture the moment, but they do not always capture the <em>story</em>. Who is that person? Where were you? Why does this photo matter?</p>
      <p>That is where <a href="/">TimeVault</a> comes in. You can hide the story of a photo <em>inside</em> the photo itself. Years from now, when you (or your kids) unlock it, the whole story comes flooding back.</p>
      <p>It is like having a time capsule inside every picture. <a href="/blog/photo-steganography-hidden-message">Learn more about photo steganography</a>.</p>
    `,
    faq: [
      { q: 'How long do digital photos last?', a: 'Digital files, properly stored and backed up, can last indefinitely. Unlike physical photos, they do not fade or degrade over time — as long as you can open the file format.' },
      { q: 'What is the best way to store thousands of photos?', a: 'Use a combination of cloud storage (for easy access) and an external hard drive (for backup). Organize them by date or event, and delete bad photos regularly.' },
      { q: 'Should I use cloud storage for my photos?', a: 'Yes, but do not rely on cloud storage alone. Use it as part of your 3-2-1 backup strategy. Cloud services can shut down, accounts can get hacked — always have a local backup too.' },
      { q: 'How do I organize years of digital photos?', a: 'Start with the most recent and work backwards. Set aside 15 minutes a week. Delete duplicates and bad photos first. Then organize into folders by date or event.' }
    ]
  }
};

console.log('Deepening content for new posts...');

let count = 0;

newPosts.forEach(slug => {
  const filePath = path.join(blogDir, slug + '.html');
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already deepened
  if (content.includes('Frequently Asked Questions')) return;
  
  const ext = contentExtensions[slug] || {
    extraSections: `
      <h2>Why This Matters More Than You Think</h2>
      <p>In our fast-paced world, taking time to slow down and preserve moments has become rare. But those moments are what life is made of.</p>
      <p>Digital tools make it easier than ever to capture and save memories. But having the tools is not enough — you have to actually use them. You have to take the time to write the letter, take the photo, save the memory.</p>
      <p>Future you will thank you.</p>
      <h2>Getting Started Today</h2>
      <p>You do not need to do everything at once. Start small. Pick one thing. Write one letter. Save one photo. Create one memory.</p>
      <p>Then build from there. Over time, you will have a collection of memories that is priceless.</p>
      <p>Want to try something different? <a href="/">Hide a message in a photo with TimeVault</a>. It is free, it is easy, and it creates a memory that feels like magic.</p>
    `,
    faq: [
      { q: 'How do I get started?', a: 'Start small. Pick one photo, one memory, one moment. Write about it. Save it. Then do another one. Consistency matters more than perfection.' },
      { q: 'What if I am not a good writer?', a: 'You do not have to be a good writer. You just have to be honest. Write like you are talking to a friend. Your voice is what makes it special.' },
      { q: 'How much time does this take?', a: 'As much or as little as you want. Five minutes a day is enough to build something meaningful over time.' },
      { q: 'Can I do this with my partner or family?', a: 'Absolutely. In fact, it is even better together. Shared memories are the best kind. <a href="/blog/couple-mode-two-hearts-one-lock">Try couple mode on TimeVault</a> for shared digital memories.' }
    ]
  };
  
  // Add extra sections before the tags div
  content = content.replace(
    '      <div class="tags">',
    ext.extraSections + '\n      <h2>Frequently Asked Questions</h2>\n' + ext.faq.map((f, i) => `
      <h3>${i+1}. ${f.q}</h3>
      <p>${f.a}</p>`).join('') + '\n\n      <div class="tags">'
  );
  
  // Add FAQ Schema
  const faqSchema = `
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[${ext.faq.map(f => `{"@type":"Question","name":"${f.q.replace(/"/g, '&quot;')}","acceptedAnswer":{"@type":"Answer","text":"${f.a.replace(/"/g, '&quot;')}"}}`).join(',')}]}
  </script>`;
  
  // Add FAQ schema before the first script tag
  content = content.replace(
    '  <script type="application/ld+json">',
    faqSchema + '\n  <script type="application/ld+json">'
  );
  
  fs.writeFileSync(filePath, content);
  count++;
});

console.log('Deepened content for', count, 'posts');
