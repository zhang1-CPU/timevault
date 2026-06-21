import { useState, useEffect } from 'react';
import { BarChart3, Lock, RefreshCw, Heart, LockKeyhole, Sparkles, Users } from 'lucide-react';

interface Stats {
  solo: number;
  'couple-a': number;
  'couple-b': number;
  unlock: number;
}

const STAT_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  solo: { label: '单人封印', icon: <LockKeyhole className="w-6 h-6" />, color: 'from-emerald-500 to-teal-600' },
  'couple-a': { label: '情侣封印 · A方', icon: <Heart className="w-6 h-6" />, color: 'from-rose-500 to-pink-500' },
  'couple-b': { label: '情侣封印 · B方', icon: <Sparkles className="w-6 h-6" />, color: 'from-violet-500 to-purple-500' },
  unlock: { label: '解锁查看', icon: <Unlock className="w-6 h-6" />, color: 'from-amber-500 to-orange-500' },
};

function Unlock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [secret, setSecret] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setSecret(password);
  };

  useEffect(() => {
    if (!secret) return;

    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/_analytics/stats', {
          headers: { 'X-Admin-Secret': secret },
        });
        if (res.status === 401) {
          setError('密码错误，请重试');
          setSecret('');
          setPassword('');
          return;
        }
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setStats(data);
        setLastRefresh(new Date());
      } catch {
        setError('加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [secret]);

  const total = stats ? Object.values(stats).reduce((a, b) => a + b, 0) : 0;
  const maxCount = stats ? Math.max(...Object.values(stats), 1) : 1;

  // ── Login form ────────────────────────────────────────────────
  if (!secret) {
    return (
      <div className="min-h-screen bg-[#09090f] flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-rose-500/20 border border-white/10 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-8 h-8 text-white/60" />
            </div>
            <h1 className="text-2xl font-serif text-white/80">管理后台</h1>
            <p className="text-white/30 text-sm mt-2">输入密码查看使用统计</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入管理员密码"
              className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20
                         focus:outline-none focus:border-violet-400/40 transition-colors text-center text-lg tracking-widest"
              autoFocus
            />
            {error && <p className="text-rose-400 text-sm text-center">{error}</p>}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-rose-600 rounded-2xl text-white font-medium
                         hover:shadow-[0_0_60px_rgba(139,92,246,0.3)] active:scale-[0.97] transition-all"
            >
              查看统计
            </button>
          </form>
          <p className="text-white/15 text-xs text-center mt-8">
            TimeVault · Anonymous Analytics
          </p>
        </div>
      </div>
    );
  }

  // ── Stats dashboard ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#09090f] text-white">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-6 pt-14 pb-8">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-rose-500/20 border border-white/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white/60" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-white/80">使用统计</h1>
              {lastRefresh && (
                <p className="text-white/20 text-xs">
                  {lastRefresh.toLocaleTimeString()} 自动刷新
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setSecret('')}
            className="text-white/25 hover:text-white/50 text-sm transition-colors"
          >
            退出
          </button>
        </div>

        {/* Total */}
        <div className="glass-card rounded-3xl p-6 mb-6 border border-white/[0.06]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/15 to-rose-500/15 border border-white/10 flex items-center justify-center">
              <Users className="w-7 h-7 text-violet-400/70" />
            </div>
            <div>
              <p className="text-white/40 text-sm">总使用次数</p>
              <p className="text-4xl font-light text-white/80">{total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Mode cards */}
        <div className="space-y-3">
          {(['solo', 'couple-a', 'couple-b', 'unlock'] as const).map((mode) => {
            const info = STAT_LABELS[mode];
            const count = stats?.[mode] ?? 0;
            const pct = Math.round((count / maxCount) * 100);

            return (
              <div key={mode} className="glass-card rounded-2xl p-5 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center opacity-80`}>
                      <span className="text-white/90">{info.icon}</span>
                    </div>
                    <div>
                      <p className="text-white/50 text-sm">{info.label}</p>
                      <p className="text-2xl font-light text-white/80">{count.toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="text-white/20 text-sm">{pct}%</span>
                </div>
                {/* Mini bar */}
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${info.color} transition-all duration-700`}
                    style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-400/20 text-rose-300/80 text-sm text-center">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-6 flex items-center justify-center gap-2 text-white/25 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            刷新中...
          </div>
        )}

        <p className="text-white/10 text-xs text-center mt-10">
          TimeVault · Anonymous Analytics · 仅统计操作完成次数
        </p>
      </div>
    </div>
  );
}
