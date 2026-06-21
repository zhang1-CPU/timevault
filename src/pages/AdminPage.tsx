import { useState, useEffect } from 'react';
import { BarChart3, Lock, RefreshCw, Users } from 'lucide-react';

interface Stats {
  solo: number;
  'couple-a': number;
  'couple-b': number;
  unlock: number;
}

const ROWS: { key: keyof Stats; label: string; color: string }[] = [
  { key: 'solo', label: '单人模式图片下载', color: 'from-emerald-500 to-teal-600' },
  { key: 'couple-a', label: '情侣模式 · A 方下载', color: 'from-rose-500 to-pink-500' },
  { key: 'couple-b', label: '情侣模式 · B 方下载', color: 'from-violet-500 to-purple-500' },
  { key: 'unlock', label: '解密查看', color: 'from-amber-500 to-orange-500' },
];

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // 用密码作为 header 直接调 /_analytics/stats（由 Cloudflare Pages Function 校验）
  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/_analytics/stats', {
        headers: { 'X-Admin-Secret': password },
      });
      if (res.status === 401) {
        setError('密码错误');
        setSubmitted(false);
        return;
      }
      if (!res.ok) throw new Error('服务器返回错误');
      const raw = (await res.json()) as Stats | { stats: Stats; started_at?: string; note?: string };
      const data: Stats = 'stats' in raw ? raw.stats : raw;
      setStats(data);
      setLastRefresh(new Date());
    } catch {
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 通过密码后，进入自动刷新模式
  useEffect(() => {
    if (!submitted) return;
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }
    setSubmitted(true);
  };

  const handleLogout = () => {
    setPassword('');
    setSubmitted(false);
    setStats(null);
  };

  // —— 登录页 ——
  if (!submitted) {
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
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
          <p className="text-white/15 text-xs text-center mt-8">TimeVault · Anonymous Analytics</p>
        </div>
      </div>
    );
  }

  // —— 统计表格页 ——
  const total = stats ? (stats.solo + stats['couple-a'] + stats['couple-b'] + stats.unlock) : 0;
  const maxCount = stats ? Math.max(stats.solo, stats['couple-a'], stats['couple-b'], stats.unlock, 1) : 1;

  return (
    <div className="min-h-screen bg-[#09090f] text-white">
      <div className="max-w-2xl mx-auto px-6 pt-14 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-rose-500/20 border border-white/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white/60" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-white/80">使用统计</h1>
              {lastRefresh && <p className="text-white/20 text-xs">{lastRefresh.toLocaleTimeString()} 自动刷新</p>}
            </div>
          </div>
          <button onClick={handleLogout} className="text-white/25 hover:text-white/50 text-sm transition-colors">
            退出
          </button>
        </div>

        {/* 总次数 */}
        <div className="rounded-3xl p-6 mb-6 border border-white/[0.06] bg-white/[0.02]">
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

        {/* 表格 */}
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 border-b border-white/[0.06]">
                <th className="text-left font-normal px-5 py-3">模式</th>
                <th className="text-right font-normal px-5 py-3">次数</th>
                <th className="text-left font-normal px-5 py-3 w-1/3">占比</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const count = stats ? stats[row.key] : 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const barPct = Math.round((count / maxCount) * 100);
                return (
                  <tr key={row.key} className="border-b border-white/[0.04] last:border-b-0">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${row.color} opacity-80`} />
                        <span className="text-white/70">{row.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-white/80 font-light text-lg tabular-nums">
                      {count.toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${row.color} transition-all duration-700`}
                            style={{ width: `${Math.max(barPct, count > 0 ? 5 : 0)}%` }}
                          />
                        </div>
                        <span className="text-white/25 text-xs w-10 text-right tabular-nums">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

        <p className="text-white/10 text-xs text-center mt-10">TimeVault · Anonymous Analytics</p>
      </div>
    </div>
  );
}
