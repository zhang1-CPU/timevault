// TimeVault Blog — Article data. 2026-06-22
// Each article is a static content block. No CMS, no database.

export interface BlogArticle {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  categoryColor: string;
  readTime: string;
  date: string;
  content: string; // HTML string with full article body
  tags: string[];
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: 'how-to-write-anniversary-letter',
    title: 'How to Write a Time Capsule Letter for Your Anniversary',
    subtitle: 'A step-by-step guide to writing a love letter that your future self — or your partner — will open on your next anniversary.',
    category: 'For Couples',
    categoryColor: '#f5a8bf',
    readTime: '8 min read',
    date: 'June 22, 2026',
    tags: ['anniversary', 'love letter', 'relationship', 'romance', 'anniversary gift ideas'],
    content: `
      <p class="lead">Anniversaries mark something real. The fact that two people chose each other, again, and again — that deserves more than a dinner reservation. A sealed letter gives that milestone the weight it deserves.</p>

      <h2>Why a Letter Beats a Gift</h2>
      <p>Gifts are consumed. Flowers wilt. Jewelry gets taken off. But a letter reads differently every year. When you seal words on your anniversary day, you capture who you are at that exact moment — the specific texture of your love, not a generalized sentiment. A year later, or five, those words arrive like a postcard from the past.</p>
      <p>TimeVault makes this easy: write the letter in our editor, pick any photo of the two of you, set the unlock date to your next anniversary, and download a watermarked image. That image, shared or saved privately, holds your words until the morning arrives.</p>

      <h2>Step 1: Choose the Right Photo</h2>
      <p>The photo is the vault. It should feel like the container of your memory — not just decoration. The best choices are:</p>
      <ul>
        <li>A photo from the night you first met</li>
        <li>Your wedding day, engagement, or the day you moved in together</li>
        <li>A candid moment that captures your actual relationship — messy, funny, real</li>
        <li>A place that matters to the two of you — a restaurant, a city, a bench</li>
      </ul>
      <p>The photo will carry your message. Pick one that holds emotional weight.</p>

      <h2>Step 2: Decide Who Reads It</h2>
      <p>This changes everything about how you write. There are two modes:</p>
      <p><strong>Letter to your partner:</strong> Write directly to them. Tell them what you love right now, what you're grateful for, what you hope for them in the coming year. Use specific memories, not vague affection. "Remember when you made that terrible pasta and we ate it anyway" is better than "I love you so much."</p>
      <p><strong>Letter to your future self together:</strong> Address both of you. Write about the person you are today and what you want to remember. "In 2027, we will have been together for three years. Here's what I want us to know about 2024."</p>

      <h2>Step 3: Set the PIN and Unlock Date</h2>
      <p>Choose a 4-digit PIN that you will both remember but that won't be guessed. A good PIN is a date that matters to you — the day you met, your anniversary, a birthday. Write it down somewhere safe. If you choose Couple Mode in TimeVault, both partners contribute to the message before it's sealed.</p>
      <p>Set the unlock date to your next anniversary, or to a milestone: five years, ten years, a decade from now. The further out you go, the more powerful the letter becomes.</p>

      <h2>Step 4: Write the Letter</h2>
      <p>Don't overthink it. Here's a structure that works:</p>
      <ol>
        <li><strong>Open with now.</strong> "It's our anniversary, June 22, 2024. Here's what life looks like today."</li>
        <li><strong>Name what you love.</strong> Be specific. The small things, not just the big feelings.</li>
        <li><strong>Share a hope or a promise.</strong> What do you want for the person reading this? For your life together?</li>
        <li><strong>End with tenderness.</strong> A phrase they can hold onto. A private reference. Something only the two of you would understand.</li>
      </ol>
      <p>Length: 200–600 words. Enough to be real, short enough to be reread.</p>

      <h2>Step 5: Seal It</h2>
      <p>Upload your chosen photo, paste your letter, set the PIN and unlock date, and click Seal. Download the watermarked image. Save it somewhere you'll remember — your phone's camera roll, a shared album, a printed copy. The image contains your letter; you need both the image and the PIN to open it.</p>
      <p>That image is now a time capsule. It can sit in your chat history, your cloud storage, your desktop. When the date arrives, upload it to TimeVault, enter the PIN, and read what you wrote when the world was different.</p>

      <h2>The Magic of Re-Reading</h2>
      <p>There is something quietly profound about reading your own past words. You'll remember who you were. You'll see what changed and what stayed the same. The letter is a mirror as much as it is a message. And it's free, private, and takes less than ten minutes to create.</p>
      <p>Your next anniversary is coming. Make it count.</p>
    `,
  },
];
