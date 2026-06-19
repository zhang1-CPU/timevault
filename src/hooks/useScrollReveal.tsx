import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/* ─────────────────────────────────────────────
   useScrollReveal — IntersectionObserver 驱动
   元素进入视口时添加 is-visible 类，触发 reveal-up 动画
   用法：const { ref } = useScrollReveal(); <div ref={ref} className="reveal-item">
   ───────────────────────────────────────────── */

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.12,
  rootMargin = '0px 0px -40px 0px'
) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, isVisible };
}

/* ─────────────────────────────────────────────
   ScrollReveal — 包裹子元素的 reveal 容器
   内部所有 .reveal-item 子元素会在进入视口时依次触发动画
   staggerDelay: 相邻子元素的动画延迟差（ms）
   ───────────────────────────────────────────── */

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  threshold?: number;
}

export function ScrollReveal({
  children,
  className = '',
  staggerDelay = 90,
  threshold = 0.1,
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll<HTMLElement>('.reveal-item');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const idx = Array.from(items).indexOf(el);
            setTimeout(() => {
              el.classList.add('is-visible');
            }, idx * staggerDelay);
            observer.unobserve(el);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -30px 0px' }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [staggerDelay, threshold]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
