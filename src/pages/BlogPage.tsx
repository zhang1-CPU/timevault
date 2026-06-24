import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, Tag, BookOpen, Heart } from 'lucide-react';
import { blogArticles, type BlogArticle } from '../data/blogArticles';
import { usePageMeta } from '../lib/usePageMeta';

function ArticleCard({ article, onClick }: { article: BlogArticle; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left w-full p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
      }}
    >
      <span
        className="text-[10px] px-3 py-1 rounded-full border font-light tracking-wide mb-3 inline-block"
        style={{
          borderColor: `${article.categoryColor}40`,
          color: `${article.categoryColor}90`,
          backgroundColor: `${article.categoryColor}10`,
        }}
      >
        {article.category}
      </span>
      <h3 className="text-white/80 text-lg font-light leading-relaxed mb-3 group-hover:text-white transition-colors">
        {article.title}
      </h3>
      <p className="text-white/30 text-sm font-light leading-relaxed mb-4 line-clamp-2">
        {article.subtitle}
      </p>
      <div className="flex items-center gap-4 text-white/20 text-xs">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          {article.date}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          {article.readTime}
        </span>
      </div>
    </button>
  );
}

function ArticleDetail({ article, onBack }: { article: BlogArticle; onBack: () => void }) {
  usePageMeta({
    title: `${article.title} | TimeVault Blog`,
    description: article.subtitle,
    canonicalPath: `blog/${article.slug}`,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const relatedArticles = blogArticles
    .filter(a => a.slug !== article.slug && a.category === article.category)
    .slice(0, 2);

  return (
    <div className="animate-page-enter">
      <section className="py-8 px-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/30 hover:text-white/60 text-sm transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to articles
          </button>

          <div className="flex items-center gap-3 mb-6">
            <span
              className="text-[11px] px-3 py-1 rounded-full border font-light tracking-wide"
              style={{
                borderColor: `${article.categoryColor}40`,
                color: `${article.categoryColor}90`,
                backgroundColor: `${article.categoryColor}10`,
              }}
            >
              {article.category}
            </span>
            <span className="flex items-center gap-1.5 text-white/25 text-xs">
              <Calendar className="w-3 h-3" />
              {article.date}
            </span>
            <span className="flex items-center gap-1.5 text-white/25 text-xs">
              <Clock className="w-3 h-3" />
              {article.readTime}
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light mb-4 leading-tight">
            <span className="gradient-text">{article.title}</span>
          </h1>

          <p className="text-white/35 text-base sm:text-lg font-light leading-relaxed mb-10 border-l-2 pl-5" style={{ borderColor: `${article.categoryColor}40` }}>
            {article.subtitle}
          </p>

          <div
            className="blog-content text-white/50 text-sm sm:text-base leading-relaxed font-light space-y-6"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <div className="mt-12 pt-8 border-t border-white/5">
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="w-3 h-3 text-white/20" />
              {article.tags.map(tag => (
                <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/5 text-white/30">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-10 p-6 sm:p-8 rounded-2xl text-center" style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            <Heart className="w-5 h-5 text-rose-300 mx-auto mb-3" />
            <p className="text-white/40 text-sm mb-4">Ready to seal your own message in a photo?</p>
            <a
              href="/seal"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(139, 92, 246, 0.25))',
                border: '1px solid rgba(236, 72, 153, 0.3)',
              }}
            >
              <BookOpen className="w-4 h-4 text-rose-300" />
              Create a time capsule
            </a>
          </div>

          {relatedArticles.length > 0 && (
            <div className="mt-8">
              <h3 className="text-white/50 text-sm font-light mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Related articles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedArticles.map(related => (
                  <button
                    key={related.slug}
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      onBack();
                      setTimeout(() => {
                        const el = document.querySelector(`[data-slug="${related.slug}"]`);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }}
                    className="text-left p-4 rounded-xl transition-colors"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full border font-light tracking-wide mb-2 inline-block"
                      style={{
                        borderColor: `${related.categoryColor}40`,
                        color: `${related.categoryColor}90`,
                        backgroundColor: `${related.categoryColor}10`,
                      }}
                    >
                      {related.category}
                    </span>
                    <p className="text-white/60 text-sm font-light group-hover:text-white/80 transition-colors line-clamp-2">
                      {related.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function BlogPage() {
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);

  usePageMeta({
    title: 'TimeVault Blog — Stories, Ideas & Guides',
    description: 'Inspiring guides and ideas for sealing messages in photos — anniversary letters, love letters to future self, creative time capsule ideas, and more.',
    canonicalPath: 'blog',
  });

  if (selectedArticle) {
    return (
      <ArticleDetail
        article={selectedArticle}
        onBack={() => setSelectedArticle(null)}
      />
    );
  }

  return (
    <div className="pt-20 sm:pt-24 animate-page-enter">
      <section className="py-16 sm:py-20 px-6 text-center">
        <p className="text-rose-200/35 text-[11px] tracking-[0.4em] uppercase mb-4 font-light flex items-center justify-center gap-2">
          <BookOpen className="w-3 h-3" />
          The Journal
        </p>
        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-light mb-6">
          <span className="gradient-text">Ideas Worth Sealing</span>
        </h1>
        <p className="text-white/35 max-w-xl mx-auto text-base sm:text-lg font-light leading-relaxed">
          Stories, guides, and inspiration for what to seal inside a photo — and why it matters.
        </p>
      </section>

      <section className="py-8 px-6 pb-24">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {blogArticles.map((article) => (
            <div key={article.slug} data-slug={article.slug}>
              <ArticleCard
                article={article}
                onClick={() => setSelectedArticle(article)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
