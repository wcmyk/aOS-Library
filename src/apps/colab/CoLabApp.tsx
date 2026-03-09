import { FormEvent, useMemo, useState } from 'react';
import { useCompanyStore } from '../../state/useCompanyStore';

type ChatMessage = { from: 'me' | 'manager'; text: string; time: string };
const t = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function CoLabApp() {
  const accounts = useCompanyStore((s) => s.employerAccounts);
  const activeId = useCompanyStore((s) => s.sessions.activeColabAccountId);
  const login = useCompanyStore((s) => s.loginColab);
  const logout = useCompanyStore((s) => s.logoutColab);
  const [selectedId, setSelectedId] = useState(accounts[0]?.id ?? '');
  const [password, setPassword] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const active = useMemo(() => accounts.find((a) => a.id === activeId) ?? null, [accounts, activeId]);

  if (accounts.length === 0) return <div className="colab-shell"><div className="colab-empty">No company accounts provisioned yet. Accept an offer to create one.</div></div>;

  if (!active) {
    return (
      <div className="colab-shell" style={{ display: 'grid', placeItems: 'center' }}>
        <div style={{ width: 520, background: '#fff', border: '1px solid #dbe3ee', borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Choose CoLab account</h3>
          <div style={{ display: 'grid', gap: 8 }}>{accounts.map((a) => <label key={a.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, display: 'flex', gap: 8 }}><input type="radio" checked={selectedId === a.id} onChange={() => setSelectedId(a.id)} /><span>{a.companyName} · {a.companyEmail}</span></label>)}</div>
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Company password" style={{ marginTop: 10, width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 8 }} />
          <button type="button" onClick={() => login(selectedId, password)} style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: '#334155', color: 'white' }}>Sign in</button>
        </div>
      </div>
    );
  }

  const onSend = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: 'me', text, time: t() }]);
    setInput('');
    setTimeout(() => {
      setMessages((m) => [...m, { from: 'manager', text: `Thanks — noted for ${active.companyName}. I will review this in our team queue.`, time: t() }]);
    }, 800);
  };

  return (
    <div className="colab-shell">
      <aside className="colab-left">
        <div className="colab-brand">CoLab</div>
        <div className="colab-nav active">{active.companyName}</div>
        <button className="colab-nav" type="button" onClick={logout}>Sign out</button>
      </aside>
      <section className="colab-main">
        <header className="colab-header"><div><div className="colab-title">{active.managerName}</div><div className="colab-subtitle">Direct Message · {active.companyEmail}</div></div></header>
        <div className="colab-messages">
          {messages.map((m, i) => <div key={i} className={`colab-msg ${m.from === 'me' ? 'me' : 'manager'}`}><div className="colab-msg-author">{m.from === 'me' ? 'You' : active.managerName} <span>{m.time}</span></div><div>{m.text}</div></div>)}
        </div>
        <form className="colab-inputbar" onSubmit={onSend}><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message" /><button type="submit">Send</button></form>
      </section>
    </div>
  );
}
