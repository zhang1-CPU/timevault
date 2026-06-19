/* ─────────────────────────────────────────────
   全局氛围：深黑星空 + 零星闪光 + 偶尔爱心浮动
   设计目标：神秘、安静、低调的浪漫
   ───────────────────────────────────────────── */

export function AmbientLayer() {
  // ─── Stars (80 颗，随机位置 + 大小 + 颜色 + 闪烁速度) ───
  const stars = Array.from({ length: 80 }, (_, i) => {
    const size = 1 + (i % 4); // 1, 2, 3, 4 px
    const left = ((i * 17 + 53) % 1000) / 10;
    const top = ((i * 31 + 29) % 1000) / 10;
    const dur = 1.2 + (i % 8) * 0.4; // 1.2 - 4.4s
    const delay = ((i * 7) % 50) / 10;
    const colorIdx = i % 5;
    const colors = [
      '#ffffff',   // 纯白
      '#e0c3ff',   // 淡紫
      '#c7e0ff',   // 淡蓝
      '#ffd4e0',   // 淡粉
      '#fff4cc',   // 暖金
    ];
    const color = colors[colorIdx];
    // 部分星星有更长的"亮"时间，有的快速闪烁
    const patternIdx = i % 4;
    return { size, left, top, dur, delay, color, patternIdx, i };
  });

  // ─── Heavier glows (8 个大光点，柔和但可见的光晕) ───
  const glows = Array.from({ length: 8 }, (_, i) => {
    const size = 80 + (i % 3) * 60;
    const left = 8 + i * 12;
    const top = 10 + (i * 19) % 80;
    const dur = 6 + i * 0.8;
    const delay = i * 0.7;
    const palette = [
      'rgba(236, 72, 153, 0.25)',   // hot pink
      'rgba(168, 85, 247, 0.22)',   // purple
      'rgba(59, 130, 246, 0.18)',   // blue
      'rgba(236, 72, 153, 0.20)',
      'rgba(168, 85, 247, 0.20)',
      'rgba(99, 102, 241, 0.15)',
    ];
    const color = palette[i % palette.length];
    return { size, left, top, dur, delay, color, i };
  });

  // ─── Floating hearts (8 颗，从底部慢慢向上飘) ───
  const hearts = Array.from({ length: 8 }, (_, i) => {
    const size = 10 + (i % 3) * 4;
    const left = 5 + i * 11;
    const dur = 12 + i * 1.8; // 12 - 24s 慢速
    const delay = i * 1.5;
    const palette = [
      'rgba(255, 143, 171, 0.55)',  // soft pink
      'rgba(216, 180, 254, 0.50)',  // lavender
      'rgba(251, 191, 236, 0.45)',  // pale pink
    ];
    const color = palette[i % palette.length];
    return { size, left, dur, delay, color, i };
  });

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse 100% 80% at 50% 0%, #0a0618 0%, #05030a 60%, #020108 100%)',
      }}
      aria-hidden="true"
    >
      {/* 极弱的星云感大色团（几乎看不见，但打破纯黑） */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle 400px at 15% 20%, rgba(168, 85, 247, 0.06) 0%, transparent 60%),' +
            'radial-gradient(circle 500px at 85% 70%, rgba(236, 72, 153, 0.05) 0%, transparent 55%),' +
            'radial-gradient(circle 350px at 50% 110%, rgba(59, 130, 246, 0.06) 0%, transparent 60%)',
        }}
      />

      {/* 大光晕（柔色） */}
      {glows.map(({ size, left, top, dur, delay, color, i }) => (
        <div
          key={`glow-${i}`}
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            left: `${left}%`,
            top: `${top}%`,
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            animation: `nebula-breathe ${dur}s ease-in-out ${delay}s infinite`,
            filter: 'blur(30px)',
          }}
        />
      ))}

      {/* 星星 */}
      {stars.map(({ size, left, top, dur, delay, color, patternIdx, i }) => {
        // 3 种闪烁模式 + 4 种运动
        const animName = `star-pulse-${patternIdx}`;
        return (
          <div
            key={`star-${i}`}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              top: `${top}%`,
              background: color,
              boxShadow: `0 0 ${size * 4}px ${color}, 0 0 ${size * 8}px ${color}`,
              animation: `${animName} ${dur}s ease-in-out ${delay}s infinite`,
            }}
          />
        );
      })}

      {/* 爱心漂浮 */}
      {hearts.map(({ size, left, dur, delay, color, i }) => (
        <div
          key={`heart-${i}`}
          className="absolute"
          style={{
            width: size,
            height: size,
            left: `${left}%`,
            bottom: `-${size + 10}px`,
            color,
            animation: `heart-float ${dur}s linear ${delay}s infinite`,
            filter: `drop-shadow(0 0 ${size / 2}px ${color})`,
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" width="100%" height="100%">
            <path d="M12 21s-7.5-4.6-9.5-9.2C1 8.6 3.1 5.5 6.7 5.5c2 0 3.3 1 4.3 2.3 1-1.3 2.3-2.3 4.3-2.3 3.6 0 5.7 3.1 4.2 6.3-2 4.6-9.5 9.2-9.5 9.2z" />
          </svg>
        </div>
      ))}
    </div>
  );
}
