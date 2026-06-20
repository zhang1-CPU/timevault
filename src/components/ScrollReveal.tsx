import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

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
