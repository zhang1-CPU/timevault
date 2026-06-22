import { useState, useEffect } from 'react';
import { Send, MessageSquare, Heart, Loader2 } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';
import type { Page } from '../App';

interface Message {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

export function MessagePage({ navigate }: { navigate: (to: Page) => void }) {
  usePageMeta({
    title: '用户留言 — TimeVault',
    description: '分享你的 TimeVault 故事，留下你的祝福',
    canonicalPath: 'messages',
  });

  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/_messages');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      console.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/_messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), message: message.trim() }),
      });

      if (res.ok) {
        setSuccess(true);
        setName('');
        setMessage('');
        await fetchMessages();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      console.error('Failed to submit message');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#09090f] pt-8 pb-20">
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-rose-500/20 border border-white/10 flex items-center justify-center mx-auto mb-5">
            <MessageSquare className="w-8 h-8 text-white/60" />
          </div>
          <h1 className="text-3xl font-serif text-white/80 mb-3">用户留言</h1>
          <p className="text-white/30 text-sm">分享你的 TimeVault 故事，留下祝福</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mb-12">
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="你的名字"
                  maxLength={50}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20
                             focus:outline-none focus:border-violet-400/40 transition-colors"
                />
              </div>
              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="写下你想说的话..."
                  maxLength={500}
                  rows={4}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20
                             focus:outline-none focus:border-violet-400/40 transition-colors resize-none"
                />
                <div className="text-right mt-1">
                  <span className="text-white/15 text-xs">{message.length}/500</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting || !name.trim() || !message.trim()}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-rose-600 rounded-2xl text-white font-medium
                           hover:shadow-[0_0_60px_rgba(139,92,246,0.3)] active:scale-[0.97] transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100
                           flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    发送中...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    发送留言
                  </>
                )}
              </button>
            </div>
            {success && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300/80 text-sm text-center">
                ✨ 留言已发送，感谢你的分享！
              </div>
            )}
          </div>
        </form>

        {/* Messages List */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Heart className="w-5 h-5 text-rose-400/60" />
            <h2 className="text-lg font-medium text-white/70">留言墙</h2>
            <span className="text-white/20 text-sm">({messages.length})</span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-6 h-6 text-white/20 animate-spin mx-auto mb-4" />
              <p className="text-white/20 text-sm">加载中...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/20">还没有留言，成为第一个吧！</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-white/70 font-medium">{msg.name}</span>
                    <span className="text-white/15 text-xs">{formatDate(msg.createdAt)}</span>
                  </div>
                  <p className="text-white/50 leading-relaxed">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('home')}
            className="text-white/30 hover:text-white/60 text-sm transition-colors"
          >
            ← 返回首页
          </button>
        </div>
      </div>
    </div>
  );
}