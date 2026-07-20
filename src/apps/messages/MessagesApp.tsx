import { useMemo, useRef, useState } from 'react';
import { useMessagesStore, type ChatMessage } from '../../state/useMessagesStore';
import { useProfileStore } from '../../state/useProfileStore';
import { generateReply, replyDelay } from './replyEngine';
import './messages.css';

// Apple Messages replica: searchable conversation sidebar, blue/gray bubble
// thread, iMessage composer. Verification codes for enterprise sign-ins
// (Teams, Workday) arrive here from shortcodes, like real MFA texts.

function threadColor(sender: string): string {
  let h = 0;
  for (let i = 0; i < sender.length; i++) h = (h * 31 + sender.charCodeAt(i)) >>> 0;
  return ['#8e8e93', '#5e5ce6', '#ff9f0a', '#30b0c7', '#bf5af2'][h % 5];
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const yesterday = new Date(now.getTime() - 86400000);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

export function MessagesApp() {
  const threads = useMessagesStore((s) => s.threads);
  const appendMessage = useMessagesStore((s) => s.appendMessage);
  const markThreadRead = useMessagesStore((s) => s.markThreadRead);
  const lastRead = useMessagesStore((s) => s.lastRead);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const firstName = useProfileStore((s) => s.fullName).split(' ')[0];
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const sorted = useMemo(() =>
    [...threads].sort((a, b) => {
      const la = a.messages[a.messages.length - 1]?.at ?? '';
      const lb = b.messages[b.messages.length - 1]?.at ?? '';
      return lb.localeCompare(la);
    }).filter((t) => !search.trim() || t.sender.toLowerCase().includes(search.toLowerCase()) || t.messages.some((m) => m.text.toLowerCase().includes(search.toLowerCase()))),
    [threads, search]);

  const active = sorted.find((t) => t.id === activeId) ?? sorted[0] ?? null;

  const send = () => {
    if (!active || !draft.trim()) return;
    const text = draft.trim();
    appendMessage(active.sender, text, { fromMe: true });
    setDraft('');
    setTimeout(() => scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 50);
    // Human contacts answer with a persona-appropriate contextual reply.
    if (active.contact) {
      const history: ChatMessage[] = [...active.messages, { text, at: new Date().toISOString(), fromMe: true }]
        .map((m) => ({ from: m.fromMe ? 'me' as const : 'them' as const, text: m.text, at: m.at }));
      const reply = generateReply(active.contact, text, history, firstName);
      setTimeout(() => {
        appendMessage(active.sender, reply);
        setTimeout(() => scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 60);
      }, replyDelay(reply));
    }
  };

  return (
    <div className="msg-shell">
      <aside className="msg-sidebar">
        <div className="msg-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(120,120,128,0.8)" strokeWidth="2.2"><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></svg>
          <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="msg-list">
          {sorted.map((t) => {
            const last = t.messages[t.messages.length - 1];
            const unread = last && !last.fromMe && (!lastRead[t.id] || new Date(last.at).getTime() > lastRead[t.id]);
            return (
              <button key={t.id} type="button"
                className={`msg-row ${active?.id === t.id ? 'active' : ''}`}
                onClick={() => { setActiveId(t.id); markThreadRead(t.id); }}>
                <span className={`msg-unread-dot ${unread ? 'on' : ''}`} />
                <span className="msg-avatar" style={{ background: threadColor(t.sender) }}>
                  {t.shortcode
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M4 5h16a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 4 5zm8 7.2L4.8 7h14.4z" /></svg>
                    : <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="8.5" r="3.8" /><path d="M4 20.5a8 8 0 0 1 16 0z" /></svg>}
                </span>
                <span className="msg-row-main">
                  <span className="msg-row-top">
                    <strong>{t.sender}</strong>
                    <span className="msg-row-time">{last ? timeLabel(last.at) : ''}</span>
                  </span>
                  <span className="msg-row-preview">{last?.text ?? ''}</span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="msg-main">
        {active ? (
          <>
            <header className="msg-head">
              <span className="msg-avatar msg-avatar-sm" style={{ background: threadColor(active.sender) }}>
                {active.shortcode
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M4 5h16a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 4 5zm8 7.2L4.8 7h14.4z" /></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="8.5" r="3.8" /><path d="M4 20.5a8 8 0 0 1 16 0z" /></svg>}
              </span>
              <div>
                <div className="msg-head-name">{active.sender}</div>
                {active.shortcode && <div className="msg-head-sub">Automated messages — do not reply</div>}
              </div>
              <div className="msg-head-actions">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a84ff" strokeWidth="1.8"><path d="M5 4.5h3l1.8 4.2-2 1.6a13 13 0 0 0 5.9 5.9l1.6-2 4.2 1.8v3a1.5 1.5 0 0 1-1.6 1.5C10.7 20 4 13.3 3.5 6.1A1.5 1.5 0 0 1 5 4.5z" /></svg>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a84ff" strokeWidth="1.8"><rect x="3" y="6" width="12" height="12" rx="2.5" /><path d="M15 12.5 21 16V8z" /></svg>
              </div>
            </header>
            <div className="msg-thread" ref={scrollRef}>
              <div className="msg-daychip">iMessage · {active.shortcode ? 'Text Message' : 'Today'}</div>
              {active.messages.map((m, i) => (
                <div key={i} className={`msg-bubble-row ${m.fromMe ? 'me' : ''}`}>
                  <div className={`msg-bubble ${m.fromMe ? 'blue' : 'gray'}`}>{m.text}</div>
                </div>
              ))}
            </div>
            <footer className="msg-composer">
              <button type="button" className="msg-plus" aria-label="Apps">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 4v16M4 12h16" /></svg>
              </button>
              <div className="msg-input-pill">
                <input placeholder={active.shortcode ? 'Text Message' : 'iMessage'} value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />
                <button type="button" className="msg-send" onClick={send} disabled={!draft.trim()} aria-label="Send">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M12 3.5 5 11h4.5v9h5v-9H19z" /></svg>
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="msg-empty">No Conversation Selected</div>
        )}
      </section>
    </div>
  );
}
