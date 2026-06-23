// TimeVault Global Stats — Pulls aggregate counts from Cloudflare KV via /_analytics.
// Visible to all visitors, no auth required for display.

import { useEffect, useState } from 'react';

export interface GlobalStats {
  solo: number;
  'couple-a': number;
  'couple-b': number;
  unlock: number;
}

const STATS_URL = '/_analytics';

export function GlobalUsageBoard() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(STATS_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        if (cancelled) return;
        setStats({
          solo: data?.stats?.solo ?? 0,
          'couple-a': data?.stats?.['couple-a'] ?? 0,
          'couple-b': data?.stats?.['couple-b'] ?? 0,
          unlock: data?.stats?.unlock ?? 0,
        });
      } catch {
        // Stay silent — never break the page if KV is unreachable
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };
    load();
    // Refresh every 30s so newly incremented counts show up
    const id = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (!loaded) {
    // Render nothing until the first fetch resolves — avoids layout shift
    return null;
  }

  const total = (stats?.solo ?? 0) + (stats?.['couple-a'] ?? 0) + (stats?.['couple-b'] ?? 0) + (stats?.unlock ?? 0);

  return (
    <div
      className="w-full max-w-3xl mx-auto mt-10 mb-2 px-4"
      style={{ animation: 'fade-in-up 0.8s ease-out forwards' }}
    >
      <div
        className="relative rounded-2xl p-5 sm:p-6"
        style={{
          background:
            'linear-gradient(135deg, rgba(236,72,153,0.06) 0%, rgba(168,85,247,0.04) 50%, rgba(99,102,241,0.05) 100%)',
          border: '1px solid rgba(236,72,153,0.14)',
          boxShadow: '0 0 40px rgba(236,72,153,0.06)',
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-pulse" />
          <h4 className="text-white/50 text-[10px] sm:text-xs uppercase tracking-[0.3em] font-light font-serif">
            Live Community Stats
          </h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCell
            label="Solo Seals"
            value={stats?.solo ?? 0}
            color="from-rose-400 to-pink-500"
            dot="bg-rose-400/70"
          />
          <StatCell
            label="Couple A"
            value={stats?.['couple-a'] ?? 0}
            color="from-fuchsia-400 to-purple-500"
            dot="bg-fuchsia-400/70"
          />
          <StatCell
            label="Couple B"
            value={stats?.['couple-b'] ?? 0}
            color="from-violet-400 to-indigo-500"
            dot="bg-violet-400/70"
          />
          <StatCell
            label="Unlocks"
            value={stats?.unlock ?? 0}
            color="from-amber-400 to-orange-500"
            dot="bg-amber-400/70"
          />
        </div>

        <div className="mt-4 pt-4 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
          <p className="text-white/25 text-[11px] font-light font-serif italic">
            {total.toLocaleString()} moments sealed across the world
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  color,
  dot,
}: {
  label: string;
  value: number;
  color: string;
  dot: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-2 px-1">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        <span className="text-white/35 text-[10px] sm:text-xs uppercase tracking-[0.15em] font-light">
          {label}
        </span>
      </div>
      <div
        className={`text-2xl sm:text-3xl font-serif font-light bg-gradient-to-br ${color} bg-clip-text text-transparent tabular-nums`}
      >
        {value.toLocaleString()}
      </div>
    </div>
  );
}
