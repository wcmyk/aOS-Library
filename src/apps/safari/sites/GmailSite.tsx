import { useMemo, useState } from 'react';
import { useMailStore, type Email, type EmailFolder } from '../../../state/useMailStore';
import { useProfileStore } from '../../../state/useProfileStore';
import { GmailM, CompanyLogo } from '../../../data/brands';
import { processAtsReply, processHousingAutomation } from '../../outlook/OutlookApp';
import './gmail.css';

type GmCategory = 'primary' | 'promotions' | 'updates';

function extractName(from: string) {
  const m = from.match(/^([^<]+)/);
  return (m?.[1] ?? from).trim();
}
function extractEmail(from: string) {
  const m = from.match(/<([^>]+)>/);
  return m?.[1] ?? from.trim();
}

const GM_COLORS = ['#7b1fa2', '#00897b', '#e53935', '#3949ab', '#f4511e', '#00acc1', '#8e24aa', '#43a047', '#fb8c00', '#5e35b1'];
function gmColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return GM_COLORS[h % GM_COLORS.length];
}

function gmDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function categorize(e: Email): GmCategory {
  const from = e.from.toLowerCase();
  if (/noreply|no-reply|newsletter|promo/.test(from)) return 'promotions';
  if (/hr@|careers@|payroll|rentcafe|mortgage|bank/.test(from)) return 'updates';
  return 'primary';
}

export function GmailSite() {
  const { emails, sendEmail, markRead, toggleStar } = useMailStore();
  const { fullName, preferredEmail } = useProfileStore();
  const [folder, setFolder] = useState<EmailFolder>('inbox');
  const [category, setCategory] = useState<GmCategory>('primary');
  const [openId, setOpenId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [search, setSearch] = useState('');

  const scoped = useMemo(() => {
    let list = emails;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => (e.subject + e.from + e.body).toLowerCase().includes(q));
    }
    return list
      .filter((e) => (folder === 'starred' ? e.starred : e.folder === folder))
      .filter((e) => folder !== 'inbox' || categorize(e) === category)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [emails, folder, category, search]);

  const open = emails.find((e) => e.id === openId) ?? null;
  const unread = emails.filter((e) => e.folder === 'inbox' && !e.read).length;

  const openReply = (e: Email) => {
    setTo(extractEmail(e.from));
    setSubject(e.subject.startsWith('Re: ') ? e.subject : `Re: ${e.subject}`);
    setBody(`\n\nOn ${new Date(e.date).toLocaleString()}, ${extractName(e.from)} wrote:\n> ${e.body.replace(/<[^>]+>/g, ' ').slice(0, 140)}…`);
    setComposeOpen(true);
  };

  const send = () => {
    if (!to || !subject) return;
    sendEmail({ from: preferredEmail, to, subject, body: `<p>${body.replace(/\n/g, '<br>')}</p>`, date: new Date().toISOString(), folder: 'sent' });
    if (open) {
      // Same simulation automation as Outlook: ATS stage codes + housing flows
      processAtsReply(open, body, (e) => sendEmail({ ...e, folder: 'inbox' }));
      processHousingAutomation(open, body, (e) => sendEmail({ ...e, folder: 'inbox' }));
    }
    setComposeOpen(false);
    setTo(''); setSubject(''); setBody('');
  };

  const senderVisual = (e: Email, size: number) => {
    if (e.jobMeta) return <CompanyLogo company={e.jobMeta.company} size={size} />;
    const name = extractName(e.from);
    return <div className="gm-avatar" style={{ width: size, height: size, fontSize: size * 0.42, background: gmColor(name) }}>{name[0]?.toUpperCase() ?? 'U'}</div>;
  };

  return (
    <div className="gm-shell">
      {/* Header */}
      <header className="gm-header">
        <div className="gm-header-left">
          <button type="button" className="gm-burger">☰</button>
          <GmailM size={30} />
          <span className="gm-wordmark">Gmail</span>
        </div>
        <div className="gm-searchwrap">
          <span className="gm-search-ic">🔍</span>
          <input placeholder="Search mail" value={search} onChange={(e) => setSearch(e.target.value)} />
          <span className="gm-search-tune">⚙̸</span>
        </div>
        <div className="gm-header-right">
          <button type="button" title="Support">?</button>
          <button type="button" title="Settings">⚙</button>
          <button type="button" className="gm-waffle" title="Google apps">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="#5f6368"><circle cx="3" cy="3" r="1.7"/><circle cx="9" cy="3" r="1.7"/><circle cx="15" cy="3" r="1.7"/><circle cx="3" cy="9" r="1.7"/><circle cx="9" cy="9" r="1.7"/><circle cx="15" cy="9" r="1.7"/><circle cx="3" cy="15" r="1.7"/><circle cx="9" cy="15" r="1.7"/><circle cx="15" cy="15" r="1.7"/></svg>
          </button>
          <div className="gm-avatar gm-me" style={{ background: '#7b1fa2' }}>{(fullName[0] ?? 'U').toUpperCase()}</div>
        </div>
      </header>

      <div className="gm-layout">
        {/* Left rail */}
        <aside className="gm-rail">
          <button type="button" className="gm-compose" onClick={() => { setTo(''); setSubject(''); setBody(''); setComposeOpen(true); }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#ea4335" d="M20.7 6.3l-3-3a1 1 0 0 0-1.4 0L4 15.6V20h4.4L20.7 7.7a1 1 0 0 0 0-1.4z"/><path fill="#fbbc04" d="M4 15.6V20h4.4l6-6-4.4-4.4z"/><path fill="#34a853" d="M14 5.6L18.4 10l2.3-2.3a1 1 0 0 0 0-1.4l-3-3a1 1 0 0 0-1.4 0z"/><path fill="#4285f4" d="M10 9.6l4.4 4.4 4-4L14 5.6z"/></svg>
            Compose
          </button>
          {([
            ['inbox', '📥', 'Inbox'],
            ['starred', '⭐', 'Starred'],
            ['sent', '📤', 'Sent'],
            ['drafts', '📝', 'Drafts'],
            ['trash', '🗑', 'Trash'],
          ] as Array<[EmailFolder, string, string]>).map(([k, ic, label]) => (
            <button key={k} type="button" className={`gm-rail-item ${folder === k ? 'active' : ''}`} onClick={() => { setFolder(k); setOpenId(null); }}>
              <span className="gm-rail-ic">{ic}</span>
              <span className="gm-rail-label">{label}</span>
              {k === 'inbox' && unread > 0 && <span className="gm-rail-count">{unread}</span>}
            </button>
          ))}
        </aside>

        {/* Main */}
        <main className="gm-main">
          {!open ? (
            <>
              {folder === 'inbox' && (
                <div className="gm-tabs">
                  <button type="button" className={category === 'primary' ? 'active' : ''} onClick={() => setCategory('primary')}>
                    <span className="gm-tab-ic">📥</span> Primary
                  </button>
                  <button type="button" className={category === 'updates' ? 'active' : ''} onClick={() => setCategory('updates')}>
                    <span className="gm-tab-ic">ℹ️</span> Updates
                  </button>
                  <button type="button" className={category === 'promotions' ? 'active' : ''} onClick={() => setCategory('promotions')}>
                    <span className="gm-tab-ic">🏷</span> Promotions
                  </button>
                </div>
              )}
              <div className="gm-list">
                {scoped.length === 0 && <div className="gm-empty">No conversations here.</div>}
                {scoped.map((e) => (
                  <div key={e.id} className={`gm-row ${!e.read ? 'unread' : ''}`} onClick={() => { setOpenId(e.id); markRead(e.id); }}>
                    <input type="checkbox" onClick={(ev) => ev.stopPropagation()} />
                    <button type="button" className={`gm-star ${e.starred ? 'on' : ''}`} onClick={(ev) => { ev.stopPropagation(); toggleStar(e.id); }}>★</button>
                    <span className="gm-row-from">{extractName(e.from)}</span>
                    <span className="gm-row-text">
                      <span className="gm-row-subject">{e.subject}</span>
                      <span className="gm-row-preview"> — {e.body.replace(/<[^>]+>/g, '').slice(0, 80)}</span>
                    </span>
                    <span className="gm-row-date">{gmDate(e.date)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="gm-reader">
              <div className="gm-reader-toolbar">
                <button type="button" onClick={() => setOpenId(null)} title="Back">←</button>
                <button type="button" title="Archive">🗄</button>
                <button type="button" title="Delete">🗑</button>
                <button type="button" title="Mark unread">✉</button>
              </div>
              <h1 className="gm-reader-subject">{open.subject} <span className="gm-label">Inbox</span></h1>
              <div className="gm-reader-head">
                {senderVisual(open, 40)}
                <div className="gm-reader-names">
                  <div><strong>{extractName(open.from)}</strong> <span className="gm-addr">&lt;{extractEmail(open.from)}&gt;</span></div>
                  <div className="gm-addr">to {open.to === preferredEmail ? 'me' : open.to} ▾</div>
                </div>
                <span className="gm-reader-date">{new Date(open.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
              <article className="gm-reader-body" dangerouslySetInnerHTML={{ __html: open.body }} />
              <div className="gm-reader-actions">
                <button type="button" onClick={() => openReply(open)}>↩ Reply</button>
                <button type="button" onClick={() => { setTo(''); setSubject(open.subject.startsWith('Fwd:') ? open.subject : `Fwd: ${open.subject}`); setBody(''); setComposeOpen(true); }}>↪ Forward</button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Compose */}
      {composeOpen && (
        <div className="gm-compose-window">
          <div className="gm-compose-title">
            <span>New Message</span>
            <button type="button" onClick={() => setComposeOpen(false)}>✕</button>
          </div>
          <input className="gm-compose-field" placeholder="Recipients" value={to} onChange={(e) => setTo(e.target.value)} />
          <input className="gm-compose-field" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <textarea className="gm-compose-body" value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="gm-compose-foot">
            <button type="button" className="gm-send" onClick={send}>Send</button>
            <span className="gm-compose-tools">A 📎 🔗 😀 🖼 ⋮</span>
            <button type="button" className="gm-compose-trash" onClick={() => setComposeOpen(false)}>🗑</button>
          </div>
        </div>
      )}
    </div>
  );
}
