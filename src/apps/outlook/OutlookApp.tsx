import { useState } from 'react';
import { useMailStore, type Email, type EmailFolder } from '../../state/useMailStore';

const FOLDER_LABELS: Record<EmailFolder, string> = {
  inbox: 'Inbox',
  starred: 'Starred',
  sent: 'Sent',
  drafts: 'Drafts',
  trash: 'Deleted Items',
};

// SVG folder icons
const FolderIcon = ({ folder }: { folder: EmailFolder }) => {
  if (folder === 'inbox') return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 2h12a1 1 0 0 1 1 1v2H1V3a1 1 0 0 1 1-1zm-1 5h14v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7zm3 3v1.5h8V10H4z"/>
    </svg>
  );
  if (folder === 'starred') return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1l1.8 4.9H15l-4.2 3 1.6 4.8L8 11l-4.4 2.7 1.6-4.8L1 5.9h5.2z"/>
    </svg>
  );
  if (folder === 'sent') return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1.5 2l13 6-13 6V10l9-2-9-2V2z"/>
    </svg>
  );
  if (folder === 'drafts') return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 2h8l4 4v8H2V2zm7 0v5h5M6 9h4M6 12h4"/>
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 2h10a1 1 0 0 1 1 1v1H2V3a1 1 0 0 1 1-1zm-1 4h12v8H2V6zm3 3l2 2 4-3"/>
    </svg>
  );
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 1) return `${Math.round(diffH * 60)}m ago`;
  if (diffH < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffH < 48) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function extractName(from: string): string {
  const m = from.match(/^([^<]+)</);
  return m ? m[1].trim() : from.split('@')[0] ?? from;
}

function extractEmail(from: string): string {
  const m = from.match(/<([^>]+)>/);
  return m ? m[1] : from;
}

// ── Compose Modal ─────────────────────────────────────────────────────────────

function ComposeModal({ onClose }: { onClose: () => void }) {
  const { sendEmail } = useMailStore();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const send = () => {
    if (!to.trim() || !subject.trim()) return;
    sendEmail({
      from: 'user@workspace.aos',
      to: to.trim(),
      subject: subject.trim(),
      body: `<p>${body.replace(/\n/g, '<br>')}</p>`,
      date: new Date().toISOString(),
      folder: 'sent',
    });
    onClose();
  };

  return (
    <div className="out-compose-overlay" onClick={onClose}>
      <div className="out-compose-modal" onClick={(e) => e.stopPropagation()}>
        <div className="out-compose-header">
          <span>New Message</span>
          <button type="button" className="out-compose-close" onClick={onClose}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l10 10M11 1L1 11" />
            </svg>
          </button>
        </div>
        <div className="out-compose-fields">
          <div className="out-compose-field">
            <label className="out-compose-label">To</label>
            <input className="out-compose-input" value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" />
          </div>
          <div className="out-compose-field">
            <label className="out-compose-label">Subject</label>
            <input className="out-compose-input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
          </div>
          <textarea
            className="out-compose-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message…"
          />
        </div>
        <div className="out-compose-footer">
          <button type="button" className="out-send-btn" onClick={send}>Send</button>
          <button type="button" className="out-discard-btn" onClick={onClose}>Discard</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Outlook App ──────────────────────────────────────────────────────────

export function OutlookApp() {
  const { emails, markRead, toggleStar, moveToFolder, deleteEmail } = useMailStore();
  const [activeFolder, setActiveFolder] = useState<EmailFolder>('inbox');
  const [selectedId, setSelectedId] = useState<string | null>(emails[0]?.id ?? null);
  const [composing, setComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const folderEmails = emails.filter((e) => {
    if (activeFolder === 'starred') return e.starred;
    if (activeFolder === 'inbox') return e.folder === 'inbox';
    return e.folder === activeFolder;
  }).filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return e.subject.toLowerCase().includes(q) || e.from.toLowerCase().includes(q) || e.body.toLowerCase().includes(q);
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const selectedEmail = folderEmails.find((e) => e.id === selectedId) ?? null;

  const folderCount = (f: EmailFolder) => {
    if (f === 'starred') return emails.filter((e) => e.starred).length;
    return emails.filter((e) => e.folder === f && !e.read).length;
  };

  const openEmail = (email: Email) => {
    setSelectedId(email.id);
    if (!email.read) markRead(email.id);
  };

  return (
    <div className="out-shell">
      {/* Title bar */}
      <div className="out-titlebar">
        <div className="out-brand">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect width="20" height="20" rx="3" fill="#0078d4" />
            <path d="M4 5h12v10H4z" fill="white" opacity="0.2" />
            <path d="M4 5l6 5 6-5" stroke="white" strokeWidth="1.5" fill="none" />
            <rect x="4" y="5" width="12" height="10" rx="1" stroke="white" strokeWidth="1" fill="none" />
          </svg>
          <span className="out-brand-name">Outlook</span>
        </div>
        <input
          className="out-search"
          placeholder="Search mail"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="button" className="out-compose-btn" onClick={() => setComposing(true)}>
          + New Message
        </button>
      </div>

      <div className="out-layout">
        {/* Sidebar */}
        <aside className="out-sidebar">
          {(Object.keys(FOLDER_LABELS) as EmailFolder[]).map((f) => {
            const count = folderCount(f);
            return (
              <button
                key={f}
                type="button"
                className={`out-folder-btn${activeFolder === f ? ' active' : ''}`}
                onClick={() => { setActiveFolder(f); setSelectedId(null); }}
              >
                <span className="out-folder-icon"><FolderIcon folder={f} /></span>
                <span className="out-folder-label">{FOLDER_LABELS[f]}</span>
                {count > 0 && <span className="out-folder-count">{count}</span>}
              </button>
            );
          })}
        </aside>

        {/* Email list */}
        <div className="out-list">
          <div className="out-list-header">
            {FOLDER_LABELS[activeFolder]}
            <span className="out-list-count">{folderEmails.length}</span>
          </div>
          {folderEmails.length === 0 && (
            <div className="out-empty">No messages in this folder.</div>
          )}
          {folderEmails.map((email) => (
            <button
              key={email.id}
              type="button"
              className={`out-email-row${selectedId === email.id ? ' selected' : ''}${!email.read ? ' unread' : ''}`}
              onClick={() => openEmail(email)}
            >
              <div className="out-email-row-top">
                <span className="out-email-from">{extractName(email.from)}</span>
                <span className="out-email-date">{formatDate(email.date)}</span>
              </div>
              <div className="out-email-subject">{email.subject}</div>
              <div className="out-email-preview">{email.body.replace(/<[^>]+>/g, '').slice(0, 80)}</div>
            </button>
          ))}
        </div>

        {/* Detail pane */}
        <div className="out-detail">
          {!selectedEmail ? (
            <div className="out-empty out-detail-empty">Select a message to read</div>
          ) : (
            <>
              <div className="out-detail-header">
                <div className="out-detail-subject">{selectedEmail.subject}</div>
                <div className="out-detail-meta">
                  <span className="out-detail-from">
                    <strong>{extractName(selectedEmail.from)}</strong>
                    <span className="out-detail-addr"> &lt;{extractEmail(selectedEmail.from)}&gt;</span>
                  </span>
                  <span className="out-detail-to">To: {selectedEmail.to}</span>
                  <span className="out-detail-date">{new Date(selectedEmail.date).toLocaleString()}</span>
                </div>
                <div className="out-detail-actions">
                  <button type="button" className="out-action-btn" onClick={() => toggleStar(selectedEmail.id)}>
                    {selectedEmail.starred ? 'Unstar' : 'Star'}
                  </button>
                  <button type="button" className="out-action-btn" onClick={() => { moveToFolder(selectedEmail.id, 'trash'); setSelectedId(null); }}>
                    Delete
                  </button>
                  <button type="button" className="out-action-btn out-action-reply" onClick={() => setComposing(true)}>
                    Reply
                  </button>
                </div>
              </div>
              <div
                className="out-detail-body"
                dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
              />
            </>
          )}
        </div>
      </div>

      {composing && <ComposeModal onClose={() => setComposing(false)} />}
    </div>
  );
}
