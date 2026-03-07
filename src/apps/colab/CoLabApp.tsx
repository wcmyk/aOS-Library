import { FormEvent, useMemo, useState } from 'react';
import { useMailStore } from '../../state/useMailStore';
import { useProfileStore } from '../../state/useProfileStore';

type ChatMessage = { from: 'me' | 'manager'; text: string; time: string };

function t() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function reply(company: string, role: string, input: string): string {
  const q = input.toLowerCase();
  if (/weed|drug|high|smoke/.test(q)) {
    return `No — that is not permitted. ${company} requires professional conduct and being fit for duty. If you need support, I can connect you with HR resources.`;
  }
  if (/not work|skip work|avoid work/.test(q)) {
    return `I can’t support that. Let’s clarify today’s priorities so you can deliver with less stress and clear expectations.`;
  }
  if (q.includes('culture')) return `${company} culture is execution-focused: clear ownership, respectful communication, and strong documentation.`;
  if (q.includes('management') || q.includes('manager')) return `I run weekly 1:1s, unblock quickly, and expect early risk visibility. You’ll have autonomy with accountability.`;
  if (q.includes('company') || q.includes('about')) return `${company} expects high-quality delivery in ${role}, cross-team collaboration, and reliable updates in CoLab + project tooling.`;
  return `Thanks for raising this. Post your current task and blocker thread, then I’ll help reprioritize against this sprint’s commitments.`;
}

export function CoLabApp() {
  const emails = useMailStore((s) => s.emails);
  const { preferredEmail } = useProfileStore();
  const onboarding = useMemo(() => emails.find((e) => e.jobMeta?.stage === 'onboarding')?.jobMeta, [emails]);
  const [channel] = useState('Direct Message');
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  if (!onboarding) {
    return <div className="colab-shell"><div className="colab-empty">Accept an offer first to activate your company CoLab tenant.</div></div>;
  }

  const onSend = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { from: 'me', text: trimmed, time: t() }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { from: 'manager', text: reply(onboarding.company, onboarding.role, trimmed), time: t() }]);
    }, 5000);
  };

  return (
    <div className="colab-shell">
      <aside className="colab-left">
        <div className="colab-brand">CoLab</div>
        <button className="colab-nav active" type="button">Chat</button>
        <button className="colab-nav" type="button">Teams</button>
        <button className="colab-nav" type="button">Calendar</button>
        <button className="colab-nav" type="button">Files</button>
      </aside>
      <section className="colab-main">
        <header className="colab-header">
          <div>
            <div className="colab-title">{onboarding.managerName}</div>
            <div className="colab-subtitle">{channel} · {onboarding.company}</div>
          </div>
          <div className="colab-pill">{preferredEmail}</div>
        </header>
        <div className="colab-messages">
          {messages.length === 0 && <p className="colab-placeholder">Say hello or ask about company policy, culture, or project priorities.</p>}
          {messages.map((m, i) => (
            <div key={i} className={`colab-msg ${m.from === 'me' ? 'me' : 'manager'}`}>
              <div className="colab-msg-author">{m.from === 'me' ? 'You' : onboarding.managerName} <span>{m.time}</span></div>
              <div>{m.text}</div>
            </div>
          ))}
          {typing && <div className="colab-typing">{onboarding.managerName} is typing…</div>}
        </div>
        <form className="colab-inputbar" onSubmit={onSend}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message" />
          <button type="submit">Send</button>
        </form>
      </section>
    </div>
  );
}
