import { useState, useEffect } from 'react';
import { BarChart3, Lock, RefreshCw, Heart, LockKeyhole, Sparkles, Users, Settings, LogOut } from 'lucide-react';

interface Stats {
  solo: number;
  'couple-a': number;
  'couple-b': number;
  unlock: number;
}

interface CloudflareCreds {
  accountId: string;
  namespaceId: string;
  apiToken: string;
}

const STAT_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string; key: string }> = {
  solo: { label: '单人模式图片下载', icon: <LockKeyhole className="w-6 h-6" />, color: 'from-emerald-500 to-teal-600', key: 'stats:solo' },
  'couple-a': { label: '情侣模式 · A 方下载', icon: <Heart className="w-6 h-6" />, color: 'from-rose-500 to-pink-500', key: 'stats:couple-a' },
  'couple-b': { label: '情侣模式 · B 方下载', icon: <Sparkles className="w-6 h-6" />, color: 'from-violet-500 to-purple-500', key: 'stats:couple-b' },
  unlock: { label: '解密查看', icon: <UnlockIcon className="w-6 h-6" />, color: 'from-amber-500 to-orange-500', key: 'stats:unlock' },
};

function UnlockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

// ── Local helpers ──────────────────────────────────────────────────────
const LS_AUTH = 'tv.admin.auth';
const LS_CREDS = 'tv.admin.creds';

// 简单密码保护：前端比对 SHA-256 摘要。
// 默认密码 "changeme"（请用你自己的哈希替换下面的常量）。
// 计算方法：node -e "const c=require('crypto'); console.log(c.createHash('sha256').update('你的密码').digest('hex'))"
const EXPECTED_HASH =
  (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('hash')) ||
  '057ba03d6c44104863dc7361fe4578965d1887360f90a0895882e58a6248fc86';

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function fetchFromCloudflare(
  mode: keyof Stats,
  creds: CloudflareCreds,
): Promise<number> {
  const url =
    `https://api.cloudflare.com/client/v4/accounts/${creds.accountId}` +
    `/storage/kv/namespaces/${creds.namespaceId}/values/${encodeURIComponent(STAT_LABELS[mode].key)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${creds.apiToken}` },
  });
  if (res.status === 401 || res.status === 403) throw new Error('API Token 无效或无权限');
  if (res.status === 404) return 0;
  if (!res.ok) throw new Error(`Cloudflare API 错误 (${res.status})`);
  const text = await res.text();
  return Number(text) || 0;
}

// ── Login ─────────────────────────────────────────────────────────────
function LoginPage({ onSuccess, error }: { onSuccess: () => void; error: string }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [localErr, setLocalErr] = useState(error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setLocalErr('');
    const hash = await sha256(password);
    if (hash === EXPECTED_HASH) {
      localStorage.setItem(LS_AUTH, hash);
      onSuccess();
    } else {
      setLocalErr('密码错误，请重试');
    }
    setBusy(false);
  };

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
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入管理员密码"
            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20
                       focus:outline-none focus:border-violet-400/40 transition-colors text-center text-lg tracking-widest"
            autoFocus
            disabled={busy}
          />
          {localErr && <p className="text-rose-400 text-sm text-center">{localErr}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-rose-600 rounded-2xl text-white font-medium
                       hover:shadow-[0_0_60px_rgba(139,92,246,0.3)] active:scale-[0.97] transition-all disabled:opacity-60"
          >
            {busy ? '验证中...' : '查看统计'}
          </button>
        </form>
        <p className="text-white/15 text-xs text-center mt-8">TimeVault · Anonymous Analytics</p>
      </div>
    </div>
  );
}

// ── Credentials setup (首次需要填 Cloudflare 参数) ────────────────────
function CredsPage({
  onSave,
  onCancel,
  initial,
}: {
  onSave: (c: CloudflareCreds) => void;
  onCancel: () => void;
  initial?: CloudflareCreds;
}) {
  const [accountId, setAccountId] = useState(initial?.accountId || '');
  const [namespaceId, setNamespaceId] = useState(initial?.namespaceId || '');
  const [apiToken, setApiToken] = useState(initial?.apiToken || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId.trim() || !namespaceId.trim() || !apiToken.trim()) {
      setError('请完整填写三项内容');
      return;
    }
    const creds: CloudflareCreds = {
      accountId: accountId.trim(),
      namespaceId: namespaceId.trim(),
      apiToken: apiToken.trim(),
    };
    localStorage.setItem(LS_CREDS, JSON.stringify(creds));
    onSave(creds);
  };

  return (
    <div className="min-h-screen bg-[#09090f] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-rose-500/20 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <Settings className="w-7 h-7 text-white/60" />
          </div>
          <h1 className="text-xl font-serif text-white/80">配置 Cloudflare 访问</h1>
          <p className="text-white/30 text-sm mt-2">数据直接从 Cloudflare KV 读取，仅存于本地浏览器</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-white/40 text-xs">Account ID</span>
            <input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="mt-1 w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-violet-400/40 font-mono text-sm"
            />
          </label>
          <label className="block">
            <span className="text-white/40 text-xs">KV Namespace ID</span>
            <input
              value={namespaceId}
              onChange={(e) => setNamespaceId(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="mt-1 w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-violet-400/40 font-mono text-sm"
            />
          </label>
          <label className="block">
            <span className="text-white/40 text-xs">API Token（需 Workers KV Storage:read 权限）</span>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="mt-1 w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-violet-400/40 font-mono text-sm"
            />
          </label>
          {error && <p className="text-rose-400 text-sm text-center pt-2">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 border border-white/10 rounded-xl text-white/50 hover:text-white/80 transition-colors"
            >
              返回
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-rose-600 rounded-xl text-white font-medium hover:shadow-[0_0_60px_rgba(139,92,246,0.3)] active:scale-[0.97] transition-all"
            >
              保存并拉取数据
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────
function Dashboard({
  onLogout,
  onEditCreds,
  creds,
}: {
  onLogout: () => void;
  onEditCreds: () => void;
  creds: CloudflareCreds;
}) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const modes: (keyof Stats)[] = ['solo', 'couple-a', 'couple-b', 'unlock'];
      const results = await Promise.all(modes.map((m) => fetchFromCloudflare(m, creds)));
      const next: Stats = {
        solo: results[0],
        'couple-a': results[1],
        'couple-b': results[2],
        unlock: results[3],
      };
      setStats(next);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creds]);

  const total = stats ? Object.values(stats).reduce((a, b) => a + b, 0) : 0;
  const maxCount = stats ? Math.max(...Object.values(stats), 1) : 1;

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
          <div className="flex items-center gap-4">
            <button
              onClick={onEditCreds}
              className="text-white/25 hover:text-white/50 text-sm transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onLogout}
              className="text-white/25 hover:text-white/50 text-sm transition-colors flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              退出
            </button>
          </div>
        </div>

        {/* Total */}
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

        {/* Table（按用户要求：直接调 Cloudflare API 拉数据展示成表格） */}
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
              {(['solo', 'couple-a', 'couple-b', 'unlock'] as const).map((mode) => {
                const info = STAT_LABELS[mode];
                const count = stats?.[mode] ?? 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const barPct = Math.round((count / maxCount) * 100);
                return (
                  <tr key={mode} className="border-b border-white/[0.04] last:border-b-0">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center opacity-80`}>
                          <span className="text-white/90 scale-75">{info.icon}</span>
                        </div>
                        <span className="text-white/70">{info.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-white/80 font-light text-lg tabular-nums">
                      {count.toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${info.color} transition-all duration-700`}
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

        <p className="text-white/10 text-xs text-center mt-10">
          TimeVault · Anonymous Analytics · 数据来源：Cloudflare KV REST API
        </p>
      </div>
    </div>
  );
}

// ── Main controller ───────────────────────────────────────────────────
type Stage = 'login' | 'creds' | 'dashboard';

export default function AdminPage() {
  const [stage, setStage] = useState<Stage>(() => {
    if (typeof window === 'undefined') return 'login';
    const authed = localStorage.getItem(LS_AUTH) === EXPECTED_HASH;
    if (!authed) return 'login';
    return localStorage.getItem(LS_CREDS) ? 'dashboard' : 'creds';
  });
  const [creds, setCreds] = useState<CloudflareCreds | null>(() => {
    try {
      const raw = localStorage.getItem(LS_CREDS);
      return raw ? (JSON.parse(raw) as CloudflareCreds) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem(LS_AUTH);
    setStage('login');
  };

  const handleSaveCreds = (c: CloudflareCreds) => {
    setCreds(c);
    setStage('dashboard');
  };

  if (stage === 'login') return <LoginPage onSuccess={() => setStage(creds ? 'dashboard' : 'creds')} error="" />;
  if (stage === 'creds' || !creds)
    return <CredsPage initial={creds || undefined} onSave={handleSaveCreds} onCancel={handleLogout} />;
  return <Dashboard creds={creds} onLogout={handleLogout} onEditCreds={() => setStage('creds')} />;
}
