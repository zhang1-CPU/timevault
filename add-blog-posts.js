const fs = require('fs');

const jsPath = '/tmp/restore-jun23/assets/index-8n3ZwdDs.js';
let jsContent = fs.readFileSync(jsPath, 'utf-8');

const startMarker = 'const $g=[';
const startIndex = jsContent.indexOf(startMarker);

if (startIndex === -1) {
  console.error('Could not find blog posts array!');
  process.exit(1);
}

let slugCount = 0;
let currentPos = startIndex;
let lastSlugPos = startIndex;

while (true) {
  const slugPos = jsContent.indexOf('slug:"', currentPos);
  if (slugPos === -1) break;
  if (slugPos - startIndex > 250000) break;
  slugCount++;
  lastSlugPos = slugPos;
  currentPos = slugPos + 10;
}

console.log(`Found ${slugCount} blog posts`);

const lastContentStart = jsContent.lastIndexOf('content:`', lastSlugPos + 10000);

let contentEnd = lastContentStart + 9;
let inBacktick = true;
while (inBacktick && contentEnd < jsContent.length) {
  if (jsContent[contentEnd] === '`' && jsContent[contentEnd - 1] !== '\\') {
    inBacktick = false;
  }
  contentEnd++;
}

let objEnd = contentEnd;
let braceCount = 0;
let foundStart = false;
while (objEnd < jsContent.length) {
  if (jsContent[objEnd] === '{') {
    braceCount++;
    foundStart = true;
  } else if (jsContent[objEnd] === '}') {
    braceCount--;
    if (foundStart && braceCount === 0) {
      objEnd++;
      break;
    }
  }
  objEnd++;
}

let arrayEnd = objEnd;
while (arrayEnd < jsContent.length) {
  if (jsContent[arrayEnd] === ']') {
    arrayEnd++;
    break;
  }
  arrayEnd++;
}

console.log(`Array ends at position: ${arrayEnd}`);

const newPosts = [
  {
    slug: "how-to-create-digital-time-capsule",
    title: "How to Create a Digital Time Capsule: A Complete Guide",
    subtitle: "Learn step-by-step how to create digital time capsules that preserve your memories forever using hidden messages in photos.",
    category: "Guides",
    categoryColor: "#60a5fa",
    readTime: "10 min read",
    date: "June 24, 2026",
    tags: ["digital time capsule", "how to create", "memory preservation", "photo steganography"],
    content: `
      <p class="lead">Creating a digital time capsule is one of the most meaningful things you can do. It's a way to capture your current life and send it forward to your future self.</p>
      <h2>Why Create a Digital Time Capsule?</h2>
      <p>Think about it: Where will you be in five years? Ten years? A digital time capsule captures who you are right now so you can revisit it later.</p>
      <h2>What to Include</h2>
      <ul>
        <li>Letters to your future self</li>
        <li>Photos with hidden messages</li>
        <li>Goals and dreams</li>
        <li>Current favorites - songs, movies, books</li>
        <li>Reasons to be grateful</li>
      </ul>
      <h2>How to Create One With TimeVault</h2>
      <p>Simply choose a photo, write your message, set a PIN, choose an unlock date, and download. Your message is encrypted and hidden inside the photo.</p>
      <p><a href="/#seal">Create your first digital time capsule →</a></p>
    `
  },
  {
    slug: "romantic-time-capsule-ideas",
    title: "Romantic Time Capsule Ideas for Couples",
    subtitle: "Discover creative romantic time capsule ideas for couples. From anniversaries to wedding days, preserve your love story in photos.",
    category: "Relationships",
    categoryColor: "#f472b6",
    readTime: "8 min read",
    date: "June 24, 2026",
    tags: ["romantic time capsule", "couples ideas", "anniversary gifts", "love letters"],
    content: `
      <p class="lead">Looking for romantic time capsule ideas? You've come to the right place. Time capsules are one of the most romantic gifts you can give.</p>
      <h2>Why Time Capsules Are Romantic</h2>
      <p>Anyone can buy flowers. But a time capsule? That's personal. That's thoughtful. That says I love you not just for today, but for all the tomorrows.</p>
      <h2>10 Romantic Ideas</h2>
      <ol>
        <li>First date memory capsule</li>
        <li>Wedding vows hidden in a photo</li>
        <li>One year anniversary letter</li>
        <li>"Open when you miss me" messages</li>
        <li>New Year's resolutions together</li>
        <li>Engagement story capsule</li>
        <li>Honeymoon memories</li>
        <li>Bucket list for two</li>
        <li>"Why I love you" list</li>
        <li>Just because - no reason needed</li>
      </ol>
      <p><a href="/#seal">Create a romantic time capsule →</a></p>
    `
  },
  {
    slug: "wedding-time-capsule-tradition",
    title: "Wedding Time Capsule: A New Wedding Tradition",
    subtitle: "Start a new wedding tradition with a time capsule. Learn how to preserve your wedding day memories for future anniversaries.",
    category: "Weddings",
    categoryColor: "#a78bfa",
    readTime: "7 min read",
    date: "June 24, 2026",
    tags: ["wedding time capsule", "wedding tradition", "wedding memory", "anniversary"],
    content: `
      <p class="lead">Your wedding day goes by so fast. A wedding time capsule lets you capture those feelings and memories and keep them forever.</p>
      <h2>What to Include in Your Wedding Time Capsule</h2>
      <ul>
        <li>Private vows for each other</li>
        <li>Letters from your guests</li>
        <li>Your hopes for the marriage</li>
        <li>Details from the day you'll forget</li>
        <li>Advice from parents and grandparents</li>
      </ul>
      <h2>When to Open It</h2>
      <p>Popular choices: 1st anniversary, 5th anniversary, 10th anniversary, 25th anniversary. Or open one every five years!</p>
      <p><a href="/#seal">Create your wedding time capsule →</a></p>
    `
  },
  {
    slug: "steganography-for-beginners",
    title: "Steganography for Beginners: Hide Secrets in Photos",
    subtitle: "A beginner-friendly guide to steganography. Learn how to hide messages in photos and keep your secrets private.",
    category: "Security",
    categoryColor: "#34d399",
    readTime: "9 min read",
    date: "June 24, 2026",
    tags: ["steganography", "hidden messages", "privacy", "photo security"],
    content: `
      <p class="lead">What if you could hide a secret message inside a photo? That's steganography - and it's easier than you think.</p>
      <h2>What Is Steganography?</h2>
      <p>Steganography is hiding secret information inside something that looks ordinary. A photo with a hidden message looks just like a normal photo.</p>
      <h2>How It Works</h2>
      <p>Digital photos are made of pixels. Each pixel has red, green, and blue values. We can hide data in the smallest bits of these values - your eye can't see the difference.</p>
      <h2>Is It Secure?</h2>
      <p>When combined with encryption, yes! TimeVault uses AES-256-GCM encryption plus steganography. Your message is both hidden and locked.</p>
      <p><a href="/#seal">Try steganography for yourself →</a></p>
    `
  },
  {
    slug: "long-distance-relationship-capsule",
    title: "Long Distance Relationship Time Capsule Ideas",
    subtitle: "Bridge the distance with creative time capsule ideas for long distance couples. Send love letters that arrive in the future.",
    category: "Relationships",
    categoryColor: "#f472b6",
    readTime: "8 min read",
    date: "June 24, 2026",
    tags: ["long distance relationship", "LDR gifts", "couples apart", "love letters"],
    content: `
      <p class="lead">Long distance relationships are hard. But a time capsule can make the distance feel a little smaller - and the reunions a little sweeter.</p>
      <h2>Why Time Capsules Work for LDRs</h2>
      <p>They give you both something to look forward to. They create shared moments even when you're apart. They turn waiting into anticipation.</p>
      <h2>Ideas for Long Distance Couples</h2>
      <ul>
        <li>"Open when you miss me" capsule</li>
        <li>Countdown to next visit</li>
        <li>Anniversary surprise capsule</li>
        <li>"I'm proud of you" encouragement</li>
        <li>Memory of your last time together</li>
      </ul>
      <p><a href="/#seal">Create a long distance time capsule →</a></p>
    `
  },
  {
    slug: "self-love-time-capsule",
    title: "Self-Love Time Capsule: A Gift to Your Future Self",
    subtitle: "Learn how to create a self-love time capsule. Write yourself a letter that you can open when you need it most.",
    category: "Self-Reflection",
    categoryColor: "#60a5fa",
    readTime: "7 min read",
    date: "June 24, 2026",
    tags: ["self love", "personal growth", "self care", "future self"],
    content: `
      <p class="lead">We're often kinder to others than we are to ourselves. A self-love time capsule is a gift from you today to you tomorrow.</p>
      <h2>What to Write in a Self-Love Letter</h2>
      <ul>
        <li>Things you're proud of yourself for</li>
        <li>Reminders of your worth</li>
        <li>How far you've come</li>
        <li>Things you love about yourself</li>
        <li>Encouragement for hard days</li>
      </ul>
      <h2>When to Open It</h2>
      <p>Set it for a date when you might need it - a tough time of year, an anniversary of something hard, or just a random Tuesday.</p>
      <p><a href="/#seal">Write your self-love letter →</a></p>
    `
  },
  {
    slug: "pet-memorial-time-capsule",
    title: "Pet Memorial Time Capsule: Honoring Your Furry Friend",
    subtitle: "Create a pet memorial time capsule to honor your beloved pet. Seal memories and photos that you can revisit when you're ready.",
    category: "Pet Memorial",
    categoryColor: "#fbbf24",
    readTime: "6 min read",
    date: "June 24, 2026",
    tags: ["pet memorial", "pet loss", "grief", "memory preservation"],
    content: `
      <p class="lead">Losing a pet is losing a family member. A pet memorial time capsule can help you grieve and remember all the good times.</p>
      <h2>What to Include</h2>
      <ul>
        <li>Favorite memories of your pet</li>
        <li>Their silly habits and quirks</li>
        <li>The day you brought them home</li>
        <li>Things you'll never forget</li>
        <li>How much they meant to you</li>
      </ul>
      <h2>When to Open It</h2>
      <p>There's no right answer. Some people open it after a month. Some wait a year. Some never open it - just knowing it's there is enough.</p>
      <p><a href="/#seal">Create a pet memorial capsule →</a></p>
    `
  },
  {
    slug: "new-years-resolution-capsule",
    title: "New Year's Resolution Time Capsule: Keep Your Promises",
    subtitle: "Tired of broken New Year's resolutions? Try a time capsule. Seal your goals and open them at the end of the year.",
    category: "Self-Reflection",
    categoryColor: "#60a5fa",
    readTime: "6 min read",
    date: "June 24, 2026",
    tags: ["new years resolutions", "goals", "personal growth", "accountability"],
    content: `
      <p class="lead">Most New Year's resolutions fail by February. But a time capsule makes you more likely to follow through - and more honest with yourself.</p>
      <h2>Why It Works</h2>
      <p>Writing down your goals makes you more likely to achieve them. Sealing them in a time capsule adds accountability - future you is watching.</p>
      <h2>How to Do It</h2>
      <ol>
        <li>On New Year's Eve, write your resolutions</li>
        <li>Be specific - "lose 10 pounds" not "get healthy"</li>
        <li>Seal them in a meaningful photo</li>
        <li>Set the unlock date for December 31st</li>
        <li>On that day, reflect and celebrate</li>
      </ol>
      <p><a href="/#seal">Start your resolution time capsule →</a></p>
    `
  },
  {
    slug: "best-anniversary-gifts",
    title: "Best Anniversary Gifts That Actually Mean Something",
    subtitle: "Forget generic gifts. These anniversary gift ideas are personal, meaningful, and will be remembered forever.",
    category: "Anniversary",
    categoryColor: "#f472b6",
    readTime: "7 min read",
    date: "June 24, 2026",
    tags: ["anniversary gifts", "romantic gifts", "couples", "meaningful gifts"],
    content: `
      <p class="lead">Another piece of jewelry? Another bottle of wine? Boring. The best anniversary gifts aren't things - they're feelings, memories, and meaning.</p>
      <h2>Why Time Capsules Make the Best Gifts</h2>
      <ul>
        <li>They're personal - made by you, for them</li>
        <li>They last forever - flowers wilt, chocolates get eaten</li>
        <li>They create anticipation - waiting is part of the fun</li>
        <li>They say "I put thought into this"</li>
      </ul>
      <h2>Anniversary Time Capsule Ideas</h2>
      <ul>
        <li>Letter about your favorite year together</li>
        <li>10 reasons you love them more than ever</li>
        <li>Memory of your wedding day</li>
        <li>Goals for the next year</li>
        <li>Reasons you'd choose them all over again</li>
      </ul>
      <p><a href="/#seal">Create the perfect anniversary gift →</a></p>
    `
  },
  {
    slug: "privacy-in-digital-age",
    title: "Privacy in the Digital Age: How to Keep Messages Private",
    subtitle: "Concerned about privacy? Learn how to keep your personal messages private in an era of data breaches and surveillance.",
    category: "Security",
    categoryColor: "#34d399",
    readTime: "8 min read",
    date: "June 24, 2026",
    tags: ["privacy", "digital privacy", "secure messaging", "data protection"],
    content: `
      <p class="lead">Everything we do online seems to get stored somewhere. But some messages should stay private - and they can, with the right tools.</p>
      <h2>The Problem With Regular Messaging Apps</h2>
      <p>Most messaging apps store your messages on their servers. Even encrypted ones often have access to metadata. Your data is not truly yours.</p>
      <h2>A Better Solution: Steganography</h2>
      <p>With steganography, your message lives inside a photo file. It's not on any server. It's not in any database. It's just a photo - unless you have the PIN.</p>
      <h2>How TimeVault Keeps You Private</h2>
      <ul>
        <li>Zero server storage - we never see your message</li>
        <li>AES-256-GCM encryption</li>
        <li>Hidden in photo pixels - invisible to others</li>
        <li>Time-locked with drand technology</li>
      </ul>
      <p><a href="/#seal">Send a truly private message →</a></p>
    `
  },
  {
    slug: "couple-mode-relationship",
    title: "Couple Mode: Deepen Your Relationship Through Shared Secrets",
    subtitle: "Couple Mode takes time capsules to the next level. Both partners unlock it together - a beautiful metaphor for your relationship.",
    category: "Relationships",
    categoryColor: "#f472b6",
    readTime: "6 min read",
    date: "June 24, 2026",
    tags: ["couple mode", "shared secrets", "relationship building", "couples app"],
    content: `
      <p class="lead">What if a time capsule required both of you to unlock it? That's Couple Mode - two hearts, one lock.</p>
      <h2>How Couple Mode Works</h2>
      <ol>
        <li>Both partners choose the same photo</li>
        <li>Each writes their own message</li>
        <li>Set a date together</li>
        <li>Both have to be there to unlock</li>
        <li>Read each other's messages together</li>
      </ol>
      <h2>Why It's Special</h2>
      <p>It's not just a letter - it's an experience. You both wait together, you both unlock together, you both share the moment together.</p>
      <p><a href="/#couple">Try Couple Mode →</a></p>
    `
  },
  {
    slug: "birthday-time-capsule-gift",
    title: "Birthday Time Capsule: A Gift That Keeps on Giving",
    subtitle: "Looking for a unique birthday gift? A time capsule is personal, thoughtful, and something they'll remember forever.",
    category: "Birthdays",
    categoryColor: "#fbbf24",
    readTime: "6 min read",
    date: "June 24, 2026",
    tags: ["birthday gift", "birthday ideas", "time capsule gift", "unique gift"],
    content: `
      <p class="lead">Birthdays come every year. Make this one unforgettable with a gift that has real meaning.</p>
      <h2>Why a Time Capsule Is the Perfect Birthday Gift</h2>
      <ul>
        <li>It's personal - you wrote it for them</li>
        <li>It's unexpected - most people don't get time capsules</li>
        <li>It lasts - unlike cake or flowers</li>
        <li>It's emotional - prepare for happy tears</li>
      </ul>
      <h2>Birthday Time Capsule Ideas</h2>
      <ul>
        <li>"Reasons you're amazing" list</li>
        <li>Memory of how you met</li>
        <li>Encouragement for the year ahead</li>
        <li>Inside jokes and funny memories</li>
        <li>Wishes for their next year</li>
      </ul>
      <p><a href="/#seal">Create a birthday time capsule →</a></p>
    `
  },
  {
    slug: "graduation-time-capsule",
    title: "Graduation Time Capsule: Capture This Milestone",
    subtitle: "Graduation is a huge milestone. A time capsule lets you capture this moment and look back on it later.",
    category: "Milestones",
    categoryColor: "#a78bfa",
    readTime: "6 min read",
    date: "June 24, 2026",
    tags: ["graduation", "milestone", "student gift", "memory preservation"],
    content: `
      <p class="lead">Graduation is a beginning and an end all at once. A time capsule can help you remember who you were at this important moment.</p>
      <h2>What to Include in Your Graduation Capsule</h2>
      <ul>
        <li>Hopes and fears about the future</li>
        <li>Favorite memories from school</li>
        <li>What you're most proud of</li>
        <li>Your plans and dreams</li>
        <li>Advice for your future self</li>
      </ul>
      <h2>When to Open It</h2>
      <p>5 years after graduation is perfect - you'll be in a totally different place in life, and you'll love seeing how far you've come.</p>
      <p><a href="/#seal">Create a graduation time capsule →</a></p>
    `
  },
  {
    slug: "grief-and-healing-time-capsule",
    title: "Grief and Healing: How Time Capsules Can Help",
    subtitle: "Grief is complicated. Learn how writing a time capsule can help you process loss, honor memory, and find healing.",
    category: "Healing",
    categoryColor: "#f472b6",
    readTime: "7 min read",
    date: "June 24, 2026",
    tags: ["grief", "healing", "loss", "memorial", "emotional health"],
    content: `
      <p class="lead">When we lose someone, we have so many feelings - and so many things we wish we'd said. Writing a time capsule can help.</p>
      <h2>Why Writing Helps With Grief</h2>
      <p>Putting feelings into words is one of the best things we can do for ourselves when we're grieving. It helps us process, remember, and slowly heal.</p>
      <h2>What to Write</h2>
      <ul>
        <li>Things you wish you'd said</li>
        <li>Favorite memories</li>
        <li>What you learned from them</li>
        <li>How you're carrying them forward</li>
        <li>Just... missing them</li>
      </ul>
      <p>There's no right or wrong way. Just write what's in your heart.</p>
      <p><a href="/#seal">Write a grief letter →</a></p>
    `
  },
  {
    slug: "family-time-capsule-tradition",
    title: "Family Time Capsule Tradition: Start a New Family Ritual",
    subtitle: "Start a new family tradition with a yearly time capsule. It's a beautiful way to watch your family grow and change over the years.",
    category: "Family",
    categoryColor: "#fbbf24",
    readTime: "6 min read",
    date: "June 24, 2026",
    tags: ["family time capsule", "family tradition", "family memories", "generations"],
    content: `
      <p class="lead">Families change so fast. Kids grow up, traditions evolve, life moves on. A family time capsule tradition helps you hold onto what matters.</p>
      <h2>How to Start the Tradition</h2>
      <ol>
        <li>Pick a time each year - New Year's, a holiday, a family reunion</li>
        <li>Everyone writes a short message</li>
        <li>Include current photos</li>
        <li>Seal it and set the date for next year</li>
        <li>Open it together and reflect</li>
      </ol>
      <h2>What Kids Love About It</h2>
      <p>Seeing their past writing, remembering old friends, realizing how much they've grown - it's magical for kids (and adults too).</p>
      <p><a href="/#seal">Start a family time capsule tradition →</a></p>
    `
  },
  {
    slug: "time-capsule-vs-memory-book",
    title: "Time Capsule vs Memory Book: Which Is Better?",
    subtitle: "Trying to decide between a time capsule and a memory book? Here's how they compare and which might be right for you.",
    category: "Guides",
    categoryColor: "#60a5fa",
    readTime: "5 min read",
    date: "June 24, 2026",
    tags: ["time capsule vs memory book", "comparison", "memory preservation", "gifts"],
    content: `
      <p class="lead">Both time capsules and memory books preserve memories. But they're very different experiences. Here's how to choose.</p>
      <h2>Memory Books</h2>
      <p><strong>Pros:</strong> You can look at it anytime. Great for photos. Tangible object.</p>
      <p><strong>Cons:</strong> Can get lost or damaged. You see it so often it loses meaning. No surprise element.</p>
      <h2>Time Capsules</h2>
      <p><strong>Pros:</strong> Anticipation and surprise. The element of time makes it more meaningful. Digital ones last forever.</p>
      <p><strong>Cons:</strong> You can't look at it whenever you want. The wait can be hard!</p>
      <h2>Why Not Both?</h2>
      <p>You don't have to choose! Use a memory book for everyday reminiscing and a time capsule for special moments.</p>
      <p><a href="/#seal">Create a time capsule →</a></p>
    `
  },
  {
    slug: "photo-preservation-digital-vs-physical",
    title: "Photo Preservation: Digital vs Physical Photos",
    subtitle: "Which is better for preserving memories - digital or physical photos? Learn the pros, cons, and best practices.",
    category: "Guides",
    categoryColor: "#60a5fa",
    readTime: "7 min read",
    date: "June 24, 2026",
    tags: ["photo preservation", "digital photos", "photo storage", "memory keeping"],
    content: `
      <p class="lead">We take more photos than ever before - but how many will we actually have in 50 years? Here's how to make sure your memories last.</p>
      <h2>The Problem With Physical Photos</h2>
      <ul>
        <li>They fade over time</li>
        <li>They can get lost, damaged, or destroyed</li>
        <li>You only have one copy</li>
        <li>They take up physical space</li>
      </ul>
      <h2>The Problem With Digital Photos</h2>
      <ul>
        <li>Hard drives fail</li>
        <li>Technology changes (how many ZIP drives do you have?)</li>
        <li>They're easy to accidentally delete</li>
        <li>They can feel less "real"</li>
      </ul>
      <h2>The Best of Both Worlds</h2>
      <p>With digital time capsules, you get the longevity of digital plus the meaning of a physical keepsake. Your message lives inside the photo, making it more than just a picture.</p>
      <p><a href="/#seal">Preserve your photos with hidden messages →</a></p>
    `
  },
  {
    slug: "proposal-ideas-time-capsule",
    title: "Proposal Ideas: The Time Capsule Proposal",
    subtitle: "Looking for a unique proposal idea? A time capsule proposal is romantic, personal, and unforgettable. Here's how to do it.",
    category: "Romance",
    categoryColor: "#f472b6",
    readTime: "6 min read",
    date: "June 24, 2026",
    tags: ["proposal ideas", "romantic proposal", "engagement", "unique proposal"],
    content: `
      <p class="lead">If you're planning to propose, you want it to be perfect - personal, romantic, and unforgettable. A time capsule proposal is all three.</p>
      <h2>How a Time Capsule Proposal Works</h2>
      <ol>
        <li>Pick a photo that means something to both of you</li>
        <li>Write "Will you marry me?" inside it</li>
        <li>Tell them you made something for them</li>
        <li>Give them the photo and the PIN</li>
        <li>They unlock it and read the question</li>
        <li>You get down on one knee</li>
      </ol>
      <h2>Why It's Perfect</h2>
      <p>Not only is the proposal itself amazing, but you'll always have that photo with your proposal hidden inside it - the ultimate engagement keepsake.</p>
      <p><a href="/#seal">Plan your perfect proposal →</a></p>
    `
  },
  {
    slug: "valentines-day-gift-ideas",
    title: "Valentine's Day Gift Ideas That Aren't Chocolates",
    subtitle: "Skip the generic chocolates this Valentine's Day. These gift ideas are personal, romantic, and actually mean something.",
    category: "Valentine's Day",
    categoryColor: "#f472b6",
    readTime: "6 min read",
    date: "June 24, 2026",
    tags: ["valentines day gift", "romantic gifts", "valentines ideas", "love gifts"],
    content: `
      <p class="lead">Chocolates are fine. Flowers are nice. But if you want to give something they'll actually remember, try one of these ideas.</p>
      <h2>Time Capsule Valentine's Day Ideas</h2>
      <ul>
        <li><strong>Love letter capsule:</strong> Write a heartfelt letter and seal it for next Valentine's Day</li>
        <li><strong>7-day series:</strong> Create 7 capsules - one for each day of Valentine's week</li>
        <li><strong>Memory capsule:</strong> Your favorite memory from the past year</li>
        <li><strong>Future date:</strong> Plan a future date and seal the details</li>
        <li><strong>Couple mode:</strong> Both write a letter and open them together</li>
      </ul>
      <h2>Why It's Better Than Chocolates</h2>
      <p>Chocolates get eaten in a day. A time capsule gets opened in a year and creates a whole new memory.</p>
      <p><a href="/#seal">Create a Valentine's Day gift →</a></p>
    `
  },
  {
    slug: "friendship-time-capsule",
    title: "Friendship Time Capsule: A Gift for Your Best Friend",
    subtitle: "Your best friend deserves better than a coffee mug. A friendship time capsule is personal, fun, and unforgettable.",
    category: "Friendship",
    categoryColor: "#34d399",
    readTime: "5 min read",
    date: "June 24, 2026",
    tags: ["friendship gift", "best friend", "friends", "gift ideas"],
    content: `
      <p class="lead">Best friends are family we choose. Give them a gift that shows how much they mean - not just another mug.</p>
      <h2>Friendship Time Capsule Ideas</h2>
      <ul>
        <li>Inside jokes compilation</li>
        <li>How you met story (your version)</li>
        <li>Reasons they're a great friend</li>
        <li>Memory of your favorite adventure</li>
        <li>Advice for tough days</li>
        <li>Bucket list for your friendship</li>
      </ul>
      <h2>When to Give It</h2>
      <p>Birthdays, going-away parties, graduation, or just because. Any time is a good time to tell your best friend you love them.</p>
      <p><a href="/#seal">Create a friendship time capsule →</a></p>
    `
  },
  {
    slug: "time-capsule-for-kids",
    title: "Time Capsule for Kids: A Gift They'll Thank You For Later",
    subtitle: "Create a time capsule for your kids that they'll open when they're older. It's the gift that grows more meaningful with time.",
    category: "Family",
    categoryColor: "#fbbf24",
    readTime: "6 min read",
    date: "June 24, 2026",
    tags: ["kids time capsule", "parenting", "family memories", "gifts for kids"],
    content: `
      <p class="lead">Kids grow up so fast. A time capsule is a way to capture who they are right now and give it back to them when they're older.</p>
      <h2>What to Include in a Kids' Time Capsule</h2>
      <ul>
        <li>Letter about who they are right now</li>
        <li>Their favorite things - foods, toys, songs, shows</li>
        <li>Funny things they say</li>
        <li>Your hopes and dreams for them</li>
        <li>What life is like right now</li>
      </ul>
      <h2>When They Should Open It</h2>
      <p>18th birthday, high school graduation, or when they have their first kid. Imagine them reading your words from when they were little - they'll cry happy tears.</p>
      <p><a href="/#seal">Create a time capsule for your kids →</a></p>
    `
  },
  {
    slug: "moving-away-gift-time-capsule",
    title: "Moving Away Gift: The Perfect Farewell Time Capsule",
    subtitle: "Someone you love is moving away? A time capsule is the perfect farewell gift - personal, meaningful, and something they'll take with them.",
    category: "Milestones",
    categoryColor: "#a78bfa",
    readTime: "5 min read",
    date: "June 24, 2026",
    tags: ["moving away gift", "farewell gift", "goodbye gift", "long distance friendship"],
    content: `
      <p class="lead">Saying goodbye is hard. But a thoughtful going-away gift can make it a little easier - and help your friendship survive the distance.</p>
      <h2>Moving Away Time Capsule Ideas</h2>
      <ul>
        <li>Favorite memories together</li>
        <li>Reasons you'll miss them</li>
        <li>Plans for when you visit</li>
        <li>Inside jokes you'll still laugh at</li>
        <li>Reminder that distance doesn't matter</li>
      </ul>
      <h2>Set the Opening Date</h2>
      <p>Set it for when you'll next see each other - or for six months from now, when the newness has worn off and they might need a reminder of home.</p>
      <p><a href="/#seal">Create a moving-away time capsule →</a></p>
    `
  },
  {
    slug: "retirement-gift-time-capsule",
    title: "Retirement Gift: A Time Capsule for the Next Chapter",
    subtitle: "Looking for the perfect retirement gift? A time capsule honors their career and celebrates what comes next.",
    category: "Milestones",
    categoryColor: "#60a5fa",
    readTime: "5 min read",
    date: "June 24, 2026",
    tags: ["retirement gift", "retirement", "career milestone", "going away gift"],
    content: `
      <p class="lead">Retirement is the end of one chapter and the beginning of another. A time capsule honors both.</p>
      <h2>Retirement Time Capsule Ideas</h2>
      <ul>
        <li>Memories from their career</li>
        <li>Advice from coworkers</li>
        <li>Wishes for their retirement</li>
        <li>Bucket list ideas</li>
        <li>Reminders of how much they'll be missed</li>
      </ul>
      <h2>When to Open It</h2>
      <p>One year after retirement - they'll have settled into their new routine and will love looking back at how far they've come.</p>
      <p><a href="/#seal">Create a retirement time capsule →</a></p>
    `
  },
  {
    slug: "time-capsule-date-night",
    title: "Time Capsule Date Night: A Romantic At-Home Date Idea",
    subtitle: "Looking for a unique date night idea? A time capsule date night is fun, romantic, and gives you something to look forward to together.",
    category: "Date Night",
    categoryColor: "#f472b6",
    readTime: "5 min read",
    date: "June 24, 2026",
    tags: ["date night ideas", "romantic date", "at home date", "couple activities"],
    content: `
      <p class="lead">Tired of the same old dinner-and-movie date nights? Try a time capsule date night - it's fun, meaningful, and you get a gift that lasts.</p>
      <h2>How to Plan a Time Capsule Date Night</h2>
      <ol>
        <li>Pick a meaningful photo together</li>
        <li>Both write a letter (no peeking!)</li>
        <li>Cook a nice dinner together</li>
        <li>Create your time capsules</li>
        <li>Exchange them (but don't open!)</li>
        <li>Set a date for your next capsule night</li>
      </ol>
      <h2>What to Write About</h2>
      <ul>
        <li>What you love about this stage of your relationship</li>
        <li>Your favorite date memory</li>
        <li>Things you appreciate about each other</li>
        <li>Dreams for your future together</li>
        <li>The first thing you noticed about them</li>
      </ul>
      <p><a href="/#seal">Plan your time capsule date night →</a></p>
    `
  },
  {
    slug: "digital-legacy-planning",
    title: "Digital Legacy Planning: What Will You Leave Behind?",
    subtitle: "We leave behind more digital footprints than ever. Learn how to curate your digital legacy with intention and meaning.",
    category: "Legacy",
    categoryColor: "#a78bfa",
    readTime: "7 min read",
    date: "June 24, 2026",
    tags: ["digital legacy", "legacy planning", "future generations", "digital afterlife"],
    content: `
      <p class="lead">What will people remember about you when you're gone? In the digital age, we leave behind so much - but how much of it is meaningful?</p>
      <h2>What Is a Digital Legacy?</h2>
      <p>Your digital legacy is everything you leave behind online and in digital files: photos, messages, social media posts, emails, documents. But quantity doesn't equal meaning.</p>
      <h2>How to Curate Your Digital Legacy</h2>
      <ul>
        <li>Write letters to future generations - your kids, grandkids, great-grandkids</li>
        <li>Record your life stories and wisdom</li>
        <li>Share lessons you've learned</li>
        <li>Tell people what they meant to you</li>
        <li>Seal it all in time capsules with specific opening dates</li>
      </ul>
      <p>TimeVault lets you create messages that can be opened by specific people on specific dates - your digital legacy, preserved with intention.</p>
      <p><a href="/#seal">Start building your digital legacy →</a></p>
    `
  },
  {
    slug: "hidden-message-ideas",
    title: "Hidden Message Ideas: 20 Creative Ways to Surprise Someone",
    subtitle: "Looking for creative hidden message ideas? Here are 20 ways to hide secret messages in photos for every occasion.",
    category: "Ideas",
    categoryColor: "#fbbf24",
    readTime: "8 min read",
    date: "June 24, 2026",
    tags: ["hidden message ideas", "secret messages", "surprise ideas", "creative gifts"],
    content: `
      <p class="lead">Hiding a message inside a photo is such a fun way to surprise someone. Here are 20 creative ideas for hidden messages.</p>
      <h2>For Relationships</h2>
      <ol>
        <li>"Will you marry me?" proposal</li>
        <li>Anniversary love letter</li>
        <li>"Open when you miss me" long distance</li>
        <li>Apology letter</li>
        <li>Just because I love you</li>
      </ol>
      <h2>For Friends and Family</h2>
      <ol start="6">
        <li>Birthday surprise</li>
        <li>Congratulations message</li>
        <li>Encouragement for a hard time</li>
        <li>Moving away farewell</li>
        <li>Thank you note</li>
      </ol>
      <h2>For Yourself</h2>
      <ol start="11">
        <li>New Year's resolutions</li>
        <li>Letter to future self</li>
        <li>Self-love note for bad days</li>
        <li>Goal tracker</li>
        <li>Grief processing letter</li>
      </ol>
      <h2>For Milestones</h2>
      <ol start="16">
        <li>Graduation messages</li>
        <li>Wedding vows</li>
        <li>Baby arrival letter</li>
        <li>Retirement wishes</li>
        <li>Memorial tribute</li>
      </ol>
      <p><a href="/#seal">Hide your first secret message →</a></p>
    `
  },
  {
    slug: "couples-bucket-list-capsule",
    title: "Couples Bucket List Capsule: Dream Together",
    subtitle: "Create a couples bucket list and seal it in a time capsule. Open it in a year and see how many adventures you've had.",
    category: "Relationships",
    categoryColor: "#f472b6",
    readTime: "5 min read",
    date: "June 24, 2026",
    tags: ["couple bucket list", "relationship goals", "adventure", "couple activities"],
    content: `
      <p class="lead">Having shared goals and dreams brings couples closer. A bucket list time capsule makes it fun and intentional.</p>
      <h2>How It Works</h2>
      <ol>
        <li>Both write down 5-10 things you want to do together</li>
        <li>Big and small - from "travel to Japan" to "have a picnic in the park"</li>
        <li>Seal your lists in a time capsule</li>
        <li>Set it for one year from now</li>
        <li>Open it together and check off what you've done</li>
      </ol>
      <h2>Why It's Great for Relationships</h2>
      <p>Having shared dreams creates intimacy. Planning adventures together builds excitement. And actually doing them? That's what a great relationship is made of.</p>
      <p><a href="/#seal">Create your couples bucket list →</a></p>
    `
  },
  {
    slug: "morning-letter-challenge",
    title: "The 30-Day Morning Letter Challenge",
    subtitle: "Try the 30-day morning letter challenge. Write a short letter to your partner every morning for 30 days and seal them in time capsules.",
    category: "Relationships",
    categoryColor: "#f472b6",
    readTime: "5 min read",
    date: "June 24, 2026",
    tags: ["relationship challenge", "30 day challenge", "couple challenge", "communication"],
    content: `
      <p class="lead">Want to deepen your relationship? Try the 30-day morning letter challenge. It only takes 5 minutes a day, and the results are incredible.</p>
      <h2>How the Challenge Works</h2>
      <ol>
        <li>Every morning for 30 days, write a short letter to your partner</li>
        <li>It can be one sentence or a whole page</li>
        <li>Seal each one in a time capsule photo</li>
        <li>Give them all at the end of 30 days</li>
        <li>They open one each day for the next 30 days</li>
      </ol>
      <h2>What to Write About</h2>
      <ul>
        <li>What you're grateful for about them</li>
        <li>A small thing you noticed</li>
        <li>Something you're excited about together</li>
        <li>A memory that made you smile</li>
        <li>Just "I love you"</li>
      </ul>
      <p><a href="/#seal">Start the 30-day challenge →</a></p>
    `
  },
  {
    slug: "photo-gift-ideas",
    title: "Creative Photo Gift Ideas That Aren't Frames",
    subtitle: "Tired of the same old framed photo gifts? These creative photo gift ideas are unique, personal, and actually useful.",
    category: "Gift Ideas",
    categoryColor: "#fbbf24",
    readTime: "6 min read",
    date: "June 24, 2026",
    tags: ["photo gifts", "creative gifts", "unique gifts", "personalized gifts"],
    content: `
      <p class="lead">Photos make great gifts - but a plain framed photo is a little boring. These photo gift ideas are creative, personal, and memorable.</p>
      <h2>10 Creative Photo Gift Ideas</h2>
      <ol>
        <li><strong>Time capsule photo:</strong> Hide a message inside a meaningful photo</li>
        <li><strong>Photo calendar:</strong> A different photo for each month</li>
        <li><strong>Photo book:</strong> Curate your best memories together</li>
        <li><strong>Custom puzzle:</strong> Turn a favorite photo into a puzzle</li>
        <li><strong>Photo blanket:</strong> Cozy and sentimental</li>
        <li><strong>Memory jar:</strong> Print small photos and put them in a jar</li>
        <li><strong>Photo ornaments:</strong> For the Christmas tree</li>
        <li><strong>Digital frame:</strong> That plays a slideshow</li>
        <li><strong>Photo map:</strong> Mark all the places you've been together</li>
        <li><strong>Hidden message photo:</strong> The gift that keeps on giving</li>
      </ol>
      <p>A photo with a hidden message inside is the gift that surprises twice - first when they get the photo, and again when they unlock the message.</p>
      <p><a href="/#seal">Create a photo gift with a hidden message →</a></p>
    `
  },
  {
    slug: "apology-letter-time-capsule",
    title: "Apology Letter Time Capsule: When You're Sorry but Words Aren't Enough",
    subtitle: "Saying you're sorry is hard. A heartfelt apology letter in a time capsule shows you mean it and gives them space.",
    category: "Relationships",
    categoryColor: "#f472b6",
    readTime: "5 min read",
    date: "June 24, 2026",
    tags: ["apology", "relationship repair", "saying sorry", "communication"],
    content: `
      <p class="lead">Messing up is human. But how you apologize matters. A time capsule apology letter gives both of you space and shows you've really thought about it.</p>
      <h2>Why a Time Capsule Apology Works</h2>
      <ul>
        <li>It gives them time before they have to respond</li>
        <li>It shows you've put thought and effort into it</li>
        <li>They can read it when they're ready</li>
        <li>It's more thoughtful than a text</li>
      </ul>
      <h2>How to Write a Good Apology Letter</h2>
      <ul>
        <li>Say what you did wrong - clearly</li>
        <li>Take responsibility - no excuses</li>
        <li>Acknowledge how it made them feel</li>
        <li>Say what you'll do differently</li>
        <li>Ask for forgiveness - but don't demand it</li>
      </ul>
      <p><a href="/#seal">Write an apology letter →</a></p>
    `
  },
  {
    slug: "best-friend-birthday-letter",
    title: "Best Friend Birthday Letter: What to Write to Make Them Cry (Happy Tears)",
    subtitle: "Writing a birthday letter to your best friend? Here's what to include to make it the most meaningful gift they get.",
    category: "Friendship",
    categoryColor: "#34d399",
    readTime: "5 min read",
    date: "June 24, 2026",
    tags: ["best friend birthday", "friendship letter", "birthday letter", "gift ideas"],
    content: `
      <p class="lead">Your best friend's birthday is coming up and you want to write something they'll actually keep. Here's how to write a letter that will make them cry happy tears.</p>
      <h2>What to Include</h2>
      <ul>
        <li>How you met - your version of the story</li>
        <li>Your favorite memory together</li>
        <li>Inside jokes that still make you laugh</li>
        <li>Reasons they're a great friend</li>
        <li>How they've changed your life</li>
        <li>Wishes for their year ahead</li>
        <li>I'm so grateful you exist</li>
      </ul>
      <h2>Seal It in a Time Capsule</h2>
      <p>Want to make it even more special? Hide the letter inside a photo of you two. Tell them to open it on their birthday - or set it for NEXT birthday, so they get a surprise reminder of your friendship.</p>
      <p><a href="/#seal">Write the perfect best friend letter →</a></p>
    `
  },
  {
    slug: "couples-communication-exercise",
    title: "Time Capsule Communication Exercise for Couples",
    subtitle: "Want to improve communication in your relationship? Try this simple time capsule exercise that helps you both open up.",
    category: "Relationships",
    categoryColor: "#f472b6",
    readTime: "6 min read",
    date: "June 24, 2026",
    tags: ["communication", "relationship advice", "couples therapy", "emotional intimacy"],
    content: `
      <p class="lead">Good communication is the foundation of a healthy relationship. But it can be hard to open up face to face. This time capsule exercise makes it easier.</p>
      <h2>The Exercise</h2>
      <ol>
        <li>Both of you write answers to the same questions</li>
        <li>Seal them in individual time capsules</li>
        <li>Exchange capsules (but don't open!)</li>
        <li>Wait 24 hours - or a week</li>
        <li>Open each other's letters together</li>
        <li>Talk about what you wrote</li>
      </ol>
      <h2>Questions to Answer</h2>
      <ul>
        <li>What's one thing I wish you knew about me?</li>
        <li>When do I feel most loved by you?</li>
        <li>What's something I'm scared to tell you?</li>
        <li>What can I do better as your partner?</li>
        <li>What's your favorite thing about us?</li>
      </ul>
      <p>Writing gives you time to think before you speak. Reading gives you space to receive without reacting. It's powerful.</p>
      <p><a href="/#seal">Try the communication exercise →</a></p>
    `
  },
  {
    slug: "meaningful-gifts-for-partner",
    title: "10 Meaningful Gifts for Your Partner (That Aren't Expensive)",
    subtitle: "The best gifts aren't the most expensive ones. These meaningful gift ideas are thoughtful, personal, and won't break the bank.",
    category: "Gift Ideas",
    categoryColor: "#fbbf24",
    readTime: "6 min read",
    date: "June 24, 2026",
    tags: ["meaningful gifts", "partner gifts", "thoughtful gifts", "budget gifts"],
    content: `
      <p class="lead">You don't need to spend a lot to give a great gift. The best gifts come from the heart - not from a price tag.</p>
      <h2>10 Meaningful (and Affordable) Gift Ideas</h2>
      <ol>
        <li><strong>Love letter time capsule:</strong> Free, personal, and unforgettable</li>
        <li><strong>Memory jar:</strong> Write 365 memories on slips of paper</li>
        <li><strong>Coupon book:</strong> Good for one massage, one breakfast in bed, etc.</li>
        <li><strong>Mixed tape/playlist:</strong> With notes on why each song matters</li>
        <li><strong>Handwritten letter:</strong> Old school, but always appreciated</li>
        <li><strong>Photo collage:</strong> Print your favorite photos together</li>
        <li><strong>Cook their favorite meal:</strong> Food is love made visible</li>
        <li><strong>Stargazing date:</strong> Pack a blanket and some snacks</li>
        <li><strong>Book of reasons:</strong> 52 reasons why you love them</li>
        <li><strong>Time capsule photo:</strong> A gift that lasts forever</li>
      </ol>
      <p>At the end of the day, what people remember is that you thought of them. That's the real gift.</p>
      <p><a href="/#seal">Create a meaningful gift for free →</a></p>
    `
  },
  {
    slug: "mental-health-time-capsule",
    title: "Mental Health Time Capsule: A Tool for Emotional Wellbeing",
    subtitle: "Did you know time capsules can help with mental health? Learn how writing to your future self can improve your emotional wellbeing.",
    category: "Healing",
    categoryColor: "#f472b6",
    readTime: "7 min read",
    date: "June 24, 2026",
    tags: ["mental health", "emotional wellbeing", "self care", "therapy tool"],
    content: `
      <p class="lead">Mental health tools come in many forms. Writing - especially writing to our future selves - is one of the most underrated ones.</p>
      <h2>How Time Capsules Help Mental Health</h2>
      <ul>
        <li><strong>Emotional processing:</strong> Writing helps us process feelings we can't say out loud</li>
        <li><strong>Gratitude practice:</strong> Writing what we're grateful for improves mood</li>
        <li><strong>Perspective:</strong> Future you will see problems differently than current you</li>
        <li><strong>Self-compassion:</strong> Writing to yourself is an act of self-kindness</li>
        <li><strong>Progress tracking:</strong> See how far you've come</li>
      </ul>
      <h2>Mental Health Time Capsule Ideas</h2>
      <ul>
        <li>Letter to yourself on a bad day - from a good day</li>
        <li>List of things you're proud of</li>
        <li>Reasons to keep going</li>
        <li>Reminders that hard times pass</li>
        <li>Self-compassion letter</li>
      </ul>
      <p><em>Note: TimeVault is not a replacement for professional mental health care. If you're struggling, please reach out to a therapist or counselor.</em></p>
      <p><a href="/#seal">Try a mental health time capsule →</a></p>
    `
  },
  {
    slug: "first-anniversary-gift-paper",
    title: "First Anniversary Gift: Paper (But Make It Romantic)",
    subtitle: "First anniversary is paper. Forget generic stationery - here's how to give the gift of words in the most romantic way.",
    category: "Anniversary",
    categoryColor: "#f472b6",
    readTime: "5 min read",
    date: "June 24, 2026",
    tags: ["first anniversary", "paper anniversary", "anniversary gift", "romantic gift"],
    content: `
      <p class="lead">First anniversary is paper. You could give a card or stationery... or you could give something that will make them cry happy tears.</p>
      <h2>Why Paper Anniversary Is Perfect for Time Capsules</h2>
      <p>The first anniversary gift is paper because it represents the blank page of your marriage. What better way to fill that page than with your words, your memories, your love?</p>
      <h2>Paper Anniversary Time Capsule Ideas</h2>
      <ul>
        <li>Letter about your first year of marriage</li>
        <li>Favorite memories from year one</li>
        <li>What you've learned about each other</li>
        <li>Promises for year two and beyond</li>
        <li>Reasons marrying you was the best decision I ever made</li>
      </ul>
      <p>Write it, seal it in your wedding photo, set the date for your 5th anniversary. It's the paper gift that keeps on giving.</p>
      <p><a href="/#seal">Create your first anniversary gift →</a></p>
    `
  },
  {
    slug: "creative-date-ideas-at-home",
    title: "20 Creative At-Home Date Ideas for Couples",
    subtitle: "Can't go out? These at-home date ideas are fun, romantic, and way more interesting than another night on the couch.",
    category: "Date Night",
    categoryColor: "#f472b6",
    readTime: "7 min read",
    date: "June 24, 2026",
    tags: ["at home date ideas", "date night", "couple activities", "romantic ideas"],
    content: `
      <p class="lead">Staying in doesn't have to be boring. These at-home date ideas are creative, fun, and might even become your new traditions.</p>
      <h2>20 At-Home Date Ideas</h2>
      <ol>
        <li>Time capsule date night - write letters to each other</li>
        <li>Cook a meal neither of you has tried before</li>
        <li>Indoor picnic - spread a blanket in the living room</li>
        <li>DIY spa night - face masks, candles, music</li>
        <li>Movie marathon of your first dates</li>
        <li>Build a fort and watch a movie inside</li>
        <li>Board game tournament</li>
        <li>Stargazing from your balcony or yard</li>
        <li>Write each other love letters</li>
        <li>Dance party for two</li>
        <li>Paint night - no talent required</li>
        <li>Create a couples bucket list</li>
        <li>Bake something together</li>
        <li>Read to each other</li>
        <li>Plan your dream vacation</li>
        <li>Take a virtual museum tour</li>
        <li>Make a time capsule of your life right now</li>
        <li>Question game - ask each other anything</li>
        <li>Puzzle night</li>
        <li>Karaoke night (yes, really)</li>
      </ol>
      <p>Our favorite? The time capsule date night. It's romantic, it's fun, and you get a gift that lasts.</p>
      <p><a href="/#seal">Plan your time capsule date night →</a></p>
    `
  },
  {
    slug: "long-distance-date-ideas",
    title: "Long Distance Date Ideas: Stay Close Even When You're Far",
    subtitle: "Long distance is hard, but it doesn't mean you can't have great dates. These long distance date ideas will help you feel connected even when you're apart.",
    category: "Long Distance",
    categoryColor: "#f472b6",
    readTime: "6 min read",
    date: "June 24, 2026",
    tags: ["long distance dates", "LDR activities", "virtual dates", "couples apart"],
    content: `
      <p class="lead">Being apart is hard, but it doesn't mean you can't have fun together. These long distance date ideas will make the miles feel shorter.</p>
      <h2>Long Distance Date Ideas</h2>
      <ul>
        <li><strong>Virtual movie night:</strong> Same movie, same time, video call</li>
        <li><strong>Online game night:</strong> Play together from afar</li>
        <li><strong>Cook the same meal:</strong> Video call while you cook and eat together</li>
        <li><strong>Virtual museum tour:</strong> Explore art together</li>
        <li><strong>Time capsule exchange:</strong> Both create a capsule and send the photo</li>
        <li><strong>Question game:</strong> Deep conversations from miles away</li>
        <li><strong>Playlists for each other:</strong> Send music that reminds you of each other</li>
        <li><strong>Book club for two:</strong> Read the same book and discuss</li>
        <li><strong>Stargazing together:</strong> Look up at the same sky</li>
        <li><strong>Countdown capsule:</strong> A message that unlocks when you'll meet again</li>
      </ul>
      <h2>Why Time Capsules Work for LDRs</h2>
      <p>They give you something to look forward to together. They're personal. They turn waiting into anticipation. And they create a shared moment even when you're apart.</p>
      <p><a href="/#seal">Create a long distance time capsule →</a></p>
    `
  },
  {
    slug: "new-home-gift-time-capsule",
    title: "New Home Gift: A Housewarming Time Capsule",
    subtitle: "Looking for the perfect housewarming gift? A time capsule for a new home is thoughtful, personal, and something they'll have forever.",
    category: "Milestones",
    categoryColor: "#fbbf24",
    readTime: "5 min read",
    date: "June 24, 2026",
    tags: ["new home gift", "housewarming", "home gift", "milestone gift"],
    content: `
      <p class="lead">A new home is a huge milestone. Give a gift that marks the occasion and will be loved for years to come.</p>
      <h2>Why a Time Capsule Is the Perfect Housewarming Gift</h2>
      <ul>
        <li>It marks the beginning of a new chapter</li>
        <li>It's personal - no one else will give the same gift</li>
        <li>It gets better with time</li>
        <li>It's not just another kitchen gadget</li>
      </ul>
      <h2>What to Write in a New Home Time Capsule</h2>
      <ul>
        <li>Wishes for their new home</li>
        <li>Memories from their old place (if you have them)</li>
        <li>Excitement for all the moments to come</li>
        <li>Inside jokes about their move</li>
        <li>Reminder that home is people, not walls</li>
      </ul>
      <p>Set the opening date for 5 or 10 years from now - when they're settled in and surrounded by new memories.</p>
      <p><a href="/#seal">Create a new home time capsule →</a></p>
    `
  },
  {
    slug: "time-capsule-wedding-ceremony",
    title: "Time Capsule Wedding Ceremony: A New Unity Ritual",
    subtitle: "Instead of a unity candle or sand ceremony, try a time capsule wedding ceremony. It's meaningful, romantic, and uniquely yours.",
    category: "Weddings",
    categoryColor: "#a78bfa",
    readTime: "6 min read",
    date: "June 24, 2026",
    tags: ["wedding ceremony", "unity ritual", "wedding ideas", "time capsule wedding"],
    content: `
      <p class="lead">Unity candles and sand ceremonies are fine. But what about a ritual that actually means something for your marriage long after the wedding day?</p>
      <h2>How a Time Capsule Ceremony Works</h2>
      <ol>
        <li>Before the wedding, each of you writes a letter to the other</li>
        <li>Choose a meaningful photo together</li>
        <li>During the ceremony, you both "seal" your capsules</li>
        <li>The officiant says a few words about time and commitment</li>
        <li>You agree to open them on your 5th or 10th anniversary</li>
      </ol>
      <h2>Why It's Better Than Other Unity Rituals</h2>
      <p>Unity candles burn out. Sand mixes and that's it. But a time capsule? It's a promise you keep opening, year after year. It's a living reminder of why you got married.</p>
      <p><a href="/#seal">Plan your time capsule ceremony →</a></p>
    `
  }
];

console.log(`Adding ${newPosts.length} new posts...`);

function formatPost(post) {
  return `{slug:"${post.slug}",title:"${post.title}",subtitle:'${post.subtitle}',category:"${post.category}",categoryColor:"${post.categoryColor}",readTime:"${post.readTime}",date:"${post.date}",tags:[${post.tags.map(t => `"${t}"`).join(',')}],content:\`${post.content}\`}`;
}

const newPostsStr = newPosts.map(formatPost).join(',');

const beforeArray = jsContent.substring(0, arrayEnd - 1);
const afterArray = jsContent.substring(arrayEnd - 1);

const modifiedContent = beforeArray + ',' + newPostsStr + afterArray;

const newJsPath = '/tmp/restore-jun23/assets/index-8n3ZwdDs.js';
fs.writeFileSync(newJsPath, modifiedContent);

console.log(`Done! New file size: ${(modifiedContent.length / 1024).toFixed(0)}KB`);
console.log(`Original posts: ${slugCount}`);
console.log(`New posts added: ${newPosts.length}`);
console.log(`Total posts: ${slugCount + newPosts.length}`);
