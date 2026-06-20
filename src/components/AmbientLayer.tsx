/* ─────────────────────────────────────────────
   全局氛围：深黑星空 + 零星闪光 + 偶尔爱心浮动
   设计目标：神秘、安静、低调的浪漫
   ───────────────────────────────────────────── */

// 在模块初始化时一次性生成真正随机的星星位置（不会每次 re-render 改变）
const RAND_SEED = 12345;
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(RAND_SEED);

// 预生成 120 颗星星（散落 + 神秘感）
const STARS = Array.from({ length: 120 }, (_, i) => {
  const size = 0.8 + rand() * 2.2; // 0.8 ~ 3.0 px（大部分是细小的星点）
  const left = rand() * 100; // 真正随机的水平位置
  const top = rand() * 100; // 真正随机的垂直位置
  const dur = 3 + rand() * 7; // 3 ~ 10s 的闪烁节奏（缓慢神秘）
  const delay = rand() * 8;
  const colorIdx = Math.floor(rand() * 5);
  const colors = [
    '#ffffff',   // 纯白（最暗）
    '#d4b3ff',   // 淡紫
    '#e6d0ff',   // 更淡紫
    '#ffd4e0',   // 淡粉
    '#fff2cc',   // 暖金
  ];
  const color = colors[colorIdx];
  const patternIdx = Math.floor(rand() * 4);
  // 降低基础发光（不要太亮）
  const glowIntensity = 0.35 + rand() * 0.35;
  return { size, left, top, dur, delay, color, patternIdx, glowIntensity, i };
});

// 6 个柔光块（原来 8 个，减少以避免过亮）
const GLOWS = Array.from({ length: 6 }, (_, i) => {
  const size = 90 + (i % 3) * 50;
  const left = rand() * 100;
  const top = rand() * 80 + 5;
  const dur = 10 + rand() * 8; // 10 ~ 18s 更慢
  const delay = i * 1.3;
  const palette = [
    'rgba(236, 72, 153, 0.18)',
    'rgba(168, 85, 247, 0.14)',
    'rgba(59, 130, 246, 0.12)',
    'rgba(244, 114, 182, 0.15)',
    'rgba(139, 92, 246, 0.13)',
  ];
  const color = palette[i % palette.length];
  return { size, left, top, dur, delay, color, i };
});

// 爱心（5 颗，不太多）— 极缓慢上浮
const HEARTS = Array.from({ length: 5 }, (_, i) => {
  const size = 10 + (i % 3) * 4;
  const left = rand() * 95 + 2;
  const dur = 22 + rand() * 14; // 22 ~ 36s 超慢速
  const delay = i * 3.5;
  const palette = [
    'rgba(255, 143, 171, 0.35)',
    'rgba(216, 180, 254, 0.30)',
    'rgba(251, 191, 236, 0.28)',
  ];
  const color = palette[i % palette.length];
  return { size, left, dur, delay, color, i };
});

export function AmbientLayer() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse 100% 80% at 50% 0%, #0a0618 0%, #05030a 60%, #020108 100%)',
      }}
      aria-hidden="true"
    >
      {/* 极弱的星云感大色团 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle 400px at 15% 20%, rgba(168, 85, 247, 0.05) 0%, transparent 60%),' +
            'radial-gradient(circle 500px at 85% 70%, rgba(236, 72, 153, 0.04) 0%, transparent 55%),' +
            'radial-gradient(circle 350px at 50% 110%, rgba(59, 130, 246, 0.04) 0%, transparent 60%)',
        }}
      />

      {/* 大光晕 — 柔和、缓慢呼吸 */}
      {GLOWS.map(({ size, left, top, dur, delay, color, i }) => (
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

      {/* 星星 — 真正散落，不刺眼 */}
      {STARS.map(({ size, left, top, dur, delay, color, patternIdx, glowIntensity, i }) => {
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
              opacity: 0.45 * glowIntensity,
              boxShadow: `0 0 ${size * 3}px ${color}, 0 0 ${size * 5}px ${color}`,
              animation: `${animName} ${dur}s ease-in-out ${delay}s infinite`,
            }}
          />
        );
      })}

      {/* 爱心漂浮 — 缓慢、稀疏、不喧宾夺主 */}
      {HEARTS.map(({ size, left, dur, delay, color, i }) => (
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
            filter: `drop-shadow(0 0 ${size * 0.3}px ${color})`,
            opacity: 0.55,
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
