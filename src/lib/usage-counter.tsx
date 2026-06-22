// TimeVault Usage Counter — Pure frontend stats. 2026-06-22
// Uses localStorage to track seal/download and unlock actions.
// No backend needed — works entirely in the browser.

export interface UsageStats {
  seals: number;
  unlocks: number;
}

const STORAGE_KEY = 'timevault_usage_stats';

export function getUsageStats(): UsageStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch { /* noop */ }
  return { seals: 0, unlocks: 0 };
}

export function incrementSealCount(): void {
  const stats = getUsageStats();
  stats.seals++;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch { /* noop */ }
}

export function incrementUnlockCount(): void {
  const stats = getUsageStats();
  stats.unlocks++;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch { /* noop */ }
}

// Simple display component for Footer
export function UsageCounter() {
  const stats = getUsageStats();
  const total = stats.seals + stats.unlocks;

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-4 text-white/15 text-xs">
      <div className="flex items-center gap-1.5">
        <span className="w-1 h-1 rounded-full bg-rose-400/40" />
        <span>{stats.seals.toLocaleString()} sealed</span>
      </div>
      <div className="w-px h-3 bg-white/10" />
      <div className="flex items-center gap-1.5">
        <span className="w-1 h-1 rounded-full bg-violet-400/40" />
        <span>{stats.unlocks.toLocaleString()} unlocked</span>
      </div>
    </div>
  );
}
