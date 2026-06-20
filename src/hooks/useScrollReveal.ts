import { useEffect, useRef, useState } from 'react';

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
