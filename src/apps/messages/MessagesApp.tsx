import { useEffect, useMemo, useRef, useState } from 'react';
import { personPhoto } from '../../data/people';
import {
  useMessagesStore,
  nextMsgId,
  type Contact,
  type ChatMessage,
} from '../../state/useMessagesStore';
import { generateReply, replyDelay } from './replyEngine';
import './messages.css';

// A curated roster of people the user actually talks to: their manager,
// recruiters, LinkedIn connections, a mentor, a teammate, HR, and a client.
// Each has a relationship that drives how the reply engine responds.
export const CONTACTS: Contact[] = [
  { id: 'manager', name: 'Elena Vasquez', role: 'Engineering Manager', company: 'your team', relationship: 'manager', status: 'Your manager · Active now' },
  { id: 'recruiter', name: 'Rafael Iyer', role: 'Senior Technical Recruiter', company: 'Google', relationship: 'recruiter', status: 'Recruiter · Google' },
  { id: 'mentor', name: 'Marcus Thornton', role: 'VP of Engineering', company: 'Stripe', relationship: 'mentor', status: 'Mentor · Usually replies fast' },
  { id: 'linkedin', name: 'Priya Hartwell', role: 'Staff Product Designer', company: 'Figma', relationship: 'linkedin', status: 'LinkedIn connection' },
  { id: 'colleague', name: 'Darius Chen', role: 'Software Engineer', company: 'your team', relationship: 'colleague', status: 'Teammate · Active now' },
  { id: 'hr', name: 'Naomi Calloway', role: 'People Operations Partner', company: 'your company', relationship: 'hr', status: 'People Ops · Confidential' },
  { id: 'client', name: 'Ingrid Voss', role: 'Director of Operations', company: 'Northwind Co.', relationship: 'client', status: 'Client · Northwind Co.' },
];

// Seeded openers so each thread starts mid-relationship, feeling lived-in.
const OPENERS: Record<string, string> = {
  manager: 'Hey Michael — nice work closing out those tickets this week. Let me know if anything is blocking you before our 1:1.',
  recruiter: "Hi Michael! I came across your profile and I think you'd be a great fit for a role on our team. Are you open to a quick chat?",
  mentor: "Michael! It's been a minute. How's everything going on your end — still enjoying the work?",
  linkedin: 'Thanks for connecting, Michael! Loved your recent post. Let me know if you ever want to swap notes.',
  colleague: 'yo did you see the build broke on main 😅 i think it was the merge from yesterday',
  hr: 'Hi Michael, this is Naomi from People Ops. Just a reminder that open enrollment closes at the end of the month — let me know if you have any questions!',
  client: 'Hello Michael, looking forward to kicking off the next phase. Let us know what you need from our side.',
};

const contactById = (id: string) => CONTACTS.find((c) => c.id === id) ?? CONTACTS[0];

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  return <img className="msg-avatar" src={personPhoto(name)} alt="" width={size} height={size} />;
}

export function MessagesApp() {
  const { conversations, ensureConversation, appendMessage, markRead } = useMessagesStore();
  const [activeId, setActiveId] = useState<string>('manager');
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  // Seed every thread with its opener on first mount.
  useEffect(() => {
    CONTACTS.forEach((c, i) => ensureConversation(c.id, OPENERS[c.id], Date.now() - (CONTACTS.length - i) * 3600_000));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = contactById(activeId);
  const conv = conversations[activeId];
  const messages = useMemo(() => conv?.messages ?? [], [conv]);

  useEffect(() => {
    markRead(activeId);
  }, [activeId, messages.length, markRead]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, typing]);

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const myMsg: ChatMessage = { id: nextMsgId(), from: 'me', text, ts: Date.now() };
    appendMessage(activeId, myMsg);
    setDraft('');

    // Contextual reply after a realistic typing delay.
    const reply = generateReply(active, text, [...messages, myMsg]);
    setTyping(true);
    timerRef.current = window.setTimeout(() => {
      setTyping(false);
      appendMessage(activeId, { id: nextMsgId(), from: 'them', text: reply, ts: Date.now() });
    }, replyDelay(reply));
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="msg-shell">
      {/* Conversation list */}
      <aside className="msg-sidebar">
        <div className="msg-sidebar-head">
          <span className="msg-title">Messages</span>
          <button type="button" className="msg-compose" title="New Message" aria-label="New Message">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-7" strokeLinecap="round" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        <div className="msg-search"><span>🔍</span><input placeholder="Search" readOnly /></div>
        <div className="msg-list">
          {CONTACTS.map((c) => {
            const cc = conversations[c.id];
            const last = cc?.messages[cc.messages.length - 1];
            return (
              <button
                key={c.id}
                type="button"
                className={`msg-list-item ${activeId === c.id ? 'active' : ''}`}
                onClick={() => setActiveId(c.id)}
              >
                <Avatar name={c.name} size={44} />
                <div className="msg-list-body">
                  <div className="msg-list-top">
                    <span className="msg-list-name">{c.name}</span>
                    <span className="msg-list-time">{last ? fmtTime(last.ts) : ''}</span>
                  </div>
                  <div className="msg-list-preview">
                    {cc?.unread && activeId !== c.id ? <span className="msg-dot" /> : null}
                    <span className={cc?.unread && activeId !== c.id ? 'unread' : ''}>
                      {last ? (last.from === 'me' ? 'You: ' : '') + last.text : c.role}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Active thread */}
      <section className="msg-thread">
        <header className="msg-thread-head">
          <Avatar name={active.name} size={30} />
          <div className="msg-thread-title">
            <span className="msg-thread-name">{active.name}</span>
            <span className="msg-thread-sub">{active.status}</span>
          </div>
          <div className="msg-thread-actions">
            <button type="button" aria-label="Audio call">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .58 3.6 1 1 0 0 1-.25 1z" /></svg>
            </button>
            <button type="button" aria-label="Video call">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="6" width="13" height="12" rx="2.5" /><path d="M17 10l5-3v10l-5-3z" /></svg>
            </button>
            <button type="button" aria-label="Details">ⓘ</button>
          </div>
        </header>

        <div className="msg-scroll" ref={scrollRef}>
          <div className="msg-contact-card">
            <Avatar name={active.name} size={62} />
            <div className="msg-contact-name">{active.name}</div>
            <div className="msg-contact-role">{active.role}{active.company !== 'your team' && active.company !== 'your company' ? ` · ${active.company}` : ''}</div>
          </div>
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const grouped = prev && prev.from === m.from && m.ts - prev.ts < 120_000;
            return (
              <div key={m.id} className={`msg-row ${m.from === 'me' ? 'me' : 'them'} ${grouped ? 'grouped' : ''}`}>
                {m.from === 'them' && !grouped ? <Avatar name={active.name} size={26} /> : <span className="msg-avatar-spacer" />}
                <div className="msg-bubble">{m.text}</div>
              </div>
            );
          })}
          {typing ? (
            <div className="msg-row them">
              <Avatar name={active.name} size={26} />
              <div className="msg-bubble msg-typing"><span /><span /><span /></div>
            </div>
          ) : null}
        </div>

        <div className="msg-compose-bar">
          <button type="button" className="msg-plus" aria-label="Attach">+</button>
          <div className="msg-input-wrap">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              placeholder={`Message ${active.name.split(' ')[0]}`}
              rows={1}
            />
            <button type="button" className={`msg-send ${draft.trim() ? 'on' : ''}`} onClick={send} aria-label="Send">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l8 8h-5v10h-6V11H4z" /></svg>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
