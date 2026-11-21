import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BrandMark } from '../components/brand-mark';
import { MessageRenderer } from '../components/message-renderer';

interface SharedMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface SharedConversation {
  conversation: { title: string; model?: string | null; created_at?: string };
  messages: SharedMessage[];
}

export function SharedConversationPage() {
  const { token } = useParams<{ token: string }>();
  const [shared, setShared] = useState<SharedConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!token) {
        setError('This share link is invalid.');
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/chat/share?token=${encodeURIComponent(token)}`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store'
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'This share link is unavailable.');
        if (active) setShared(result as SharedConversation);
      } catch (err: any) {
        if (active) setError(err?.message || 'Unable to load this conversation.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [token]);

  return (
    <main className="min-h-screen bg-[#070708] text-zinc-100">
      <header className="border-b border-white/[.07]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <BrandMark size={26} /> ZenixMind
          </Link>
          <span className="text-[10px] uppercase tracking-[.16em] text-zinc-500">Shared conversation</span>
        </div>
      </header>
      <section className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
        {loading ? (
          <div className="py-20 text-center text-sm text-zinc-500">Loading shared conversation…</div>
        ) : error || !shared ? (
          <div className="rounded-2xl border border-white/[.08] bg-[#101012] p-8 text-center">
            <h1 className="text-lg font-medium">Conversation unavailable</h1>
            <p className="mt-2 text-sm text-zinc-500">{error || 'This share link may have been revoked.'}</p>
            <Link to="/" className="mt-5 inline-flex rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black">Go to ZenixMind</Link>
          </div>
        ) : (
          <>
            <div className="mb-8 border-b border-white/[.07] pb-5">
              <p className="text-[10px] uppercase tracking-[.16em] text-zinc-500">ZenixMind conversation</p>
              <h1 className="mt-2 text-2xl font-medium tracking-tight">{shared.conversation?.title || 'Shared conversation'}</h1>
              <p className="mt-2 text-xs text-zinc-600">Read-only shared link</p>
            </div>
            <div className="space-y-7">
              {(shared.messages || []).map((message, index) => (
                <div key={index} className={message.role === 'user' ? 'flex justify-end' : 'flex gap-3'}>
                  {message.role === 'assistant' && <BrandMark size={26} className="mt-1 shrink-0 text-zinc-200" />}
                  <div className={message.role === 'user' ? 'max-w-[88%] rounded-2xl rounded-br-sm bg-[#1b1b20] px-4 py-3 text-sm leading-6 text-zinc-200' : 'min-w-0 flex-1 text-sm leading-7 text-zinc-200'}>
                    {message.role === 'assistant' ? <MessageRenderer content={message.content} /> : <p className="whitespace-pre-wrap">{message.content}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 border-t border-white/[.07] pt-5 text-center">
              <p className="text-xs text-zinc-500">This conversation was shared from ZenixMind.</p>
              <Link to="/signup" className="mt-3 inline-flex rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black">Create your own workspace</Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
