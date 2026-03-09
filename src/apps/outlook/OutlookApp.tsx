import { useEffect, useMemo, useRef, useState } from 'react';
import { useMailStore, type EmailFolder } from '../../state/useMailStore';
import { useCompanyStore } from '../../state/useCompanyStore';
import { useProfileStore } from '../../state/useProfileStore';

const FOLDER_LABELS: Record<EmailFolder, string> = {
  inbox: 'Inbox',
  starred: 'Starred',
  sent: 'Sent Items',
  drafts: 'Drafts',
  trash: 'Deleted Items',
};

const FOLDER_ICONS: Record<EmailFolder, string> = {
  inbox: '📥',
  starred: '⭐',
  sent: '📤',
  drafts: '📝',
  trash: '🗑',
};

function percentCount(text: string) {
  const match = text.toUpperCase().match(/PROMOTION(%+)/);
  return match ? match[1].length : 0;
}

function extractName(from: string) {
  const m = from.match(/^([^<]+)/);
  return (m?.[1] ?? from).trim();
}

function extractEmail(from: string) {
  const m = from.match(/<([^>]+)>/);
  return m?.[1] ?? from.trim();
}

function getInitials(name: string) {
  const tokens = name.split(/\s+/).filter(Boolean);
  return (tokens[0]?.[0] ?? 'U') + (tokens[1]?.[0] ?? tokens[0]?.[1] ?? 'S');
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function ProfileAvatar({ fullName, email, onClick }: { fullName: string; email: string; onClick: () => void }) {
  return (
    <button className="out-profile-avatar" onClick={onClick} aria-label={`Open account menu for ${email}`}>
      {getInitials(fullName).toUpperCase()}
    </button>
  );
}

function SignatureEditor({
  signatureName,
  setSignatureName,
  includeOnNew,
  setIncludeOnNew,
  includeOnReply,
  setIncludeOnReply,
}: {
  signatureName: string;
  setSignatureName: (v: string) => void;
  includeOnNew: boolean;
  setIncludeOnNew: (v: boolean) => void;
  includeOnReply: boolean;
  setIncludeOnReply: (v: boolean) => void;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  const run = (command: 'bold' | 'italic' | 'createLink' | 'insertImage') => {
    if (command === 'createLink') {
      const url = window.prompt('Enter link URL');
      if (url) document.execCommand('createLink', false, url);
      return;
    }
    if (command === 'insertImage') {
      const src = window.prompt('Enter image URL');
      if (src) document.execCommand('insertImage', false, src);
      return;
    }
    document.execCommand(command);
    editorRef.current?.focus();
  };

  return (
    <div className="out-signature-editor">
      <label className="out-settings-label">
        Signature name
        <input
          className="out-settings-input"
          value={signatureName}
          onChange={(e) => setSignatureName(e.target.value)}
          placeholder="My signature"
        />
      </label>
      <div className="out-editor-toolbar" role="toolbar" aria-label="Formatting tools">
        <button type="button" onClick={() => run('bold')}><strong>B</strong></button>
        <button type="button" onClick={() => run('italic')}><em>I</em></button>
        <button type="button" onClick={() => run('createLink')}>Link</button>
        <button type="button" onClick={() => run('insertImage')}>Image</button>
      </div>
      <div
        ref={editorRef}
        className="out-rich-editor"
        contentEditable
        suppressContentEditableWarning
        aria-label="Email signature rich text editor"
      >
        Best regards,<br />{signatureName || 'Your Name'}
      </div>
      <label className="out-checkbox"><input type="checkbox" checked={includeOnNew} onChange={(e) => setIncludeOnNew(e.target.checked)} /> Automatically include on new emails</label>
      <label className="out-checkbox"><input type="checkbox" checked={includeOnReply} onChange={(e) => setIncludeOnReply(e.target.checked)} /> Automatically include on replies and forwards</label>
    </div>
  );
}

function SettingsPanel({
  open,
  onClose,
  isDark,
  onToggleTheme,
}: {
  open: boolean;
  onClose: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}) {
  const [signatureName, setSignatureName] = useState('Primary Signature');
  const [includeOnNew, setIncludeOnNew] = useState(true);
  const [includeOnReply, setIncludeOnReply] = useState(true);

  if (!open) return null;

  return (
    <aside className="out-settings-panel" role="dialog" aria-label="Outlook settings">
      <header>
        <h3>Mail settings</h3>
        <button type="button" onClick={onClose}>✕</button>
      </header>
      <section>
        <h4>Email signature</h4>
        <SignatureEditor
          signatureName={signatureName}
          setSignatureName={setSignatureName}
          includeOnNew={includeOnNew}
          setIncludeOnNew={setIncludeOnNew}
          includeOnReply={includeOnReply}
          setIncludeOnReply={setIncludeOnReply}
        />
      </section>
      <section>
        <h4>Rules & automation</h4>
        <ul>
          <li>Inbox rules</li>
          <li>Automatic replies</li>
          <li>Mail layout preferences</li>
          <li>Notification preferences</li>
        </ul>
      </section>
      <section>
        <h4>Appearance</h4>
        <button className="out-appearance-toggle" type="button" onClick={onToggleTheme}>{isDark ? 'Switch to light mode' : 'Switch to dark mode'}</button>
      </section>
    </aside>
  );
}

function AccountDropdown({
  email,
  fullName,
  accounts,
  onSignOut,
  onToggleTheme,
  isDark,
}: {
  email: string;
  fullName: string;
  accounts: string[];
  onSignOut: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
}) {
  const secondary = accounts.filter((a) => a !== email);
  return (
    <div className="out-account-dropdown" role="menu" aria-label="Account menu">
      <div className="out-account-top">
        <div className="out-account-avatar-large">{getInitials(fullName).toUpperCase()}</div>
        <div className="out-account-name">{fullName}</div>
        <div className="out-account-email">{email}</div>
        <button type="button">My Microsoft Account</button>
        <button type="button">My Profile</button>
      </div>
      <hr />
      <div className="out-account-list">
        {secondary.map((acc) => (
          <button key={acc} type="button" className="out-account-item">
            <span>{extractName(fullName)}</span>
            <small>{acc}</small>
          </button>
        ))}
      </div>
      <hr />
      <button type="button" className="out-account-item">Sign in with a different account</button>
      <hr />
      <div className="out-account-settings">
        <button type="button">⚙ Email settings</button>
        <button type="button">✎ Email signature</button>
        <button type="button" onClick={onToggleTheme}>◐ Appearance: {isDark ? 'Dark' : 'Light'}</button>
      </div>
      <hr />
      <button className="out-signout-btn" type="button" onClick={onSignOut}>Sign out</button>
    </div>
  );
}

function OutlookHeader({
  fullName,
  email,
  accounts,
  onCompose,
  onSignOut,
  onOpenSettings,
  isDark,
  onToggleTheme,
}: {
  fullName: string;
  email: string;
  accounts: string[];
  onCompose: () => void;
  onSignOut: () => void;
  onOpenSettings: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      if (!menuRef.current?.contains(ev.target as Node)) setOpen(false);
    };
    const onEsc = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  return (
    <header className="outlook-header">
      <div className="outlook-wordmark">
        <span className="outlook-wordmark-icon">✉</span>
        Outlook
      </div>
      <div className="outlook-toolbar">
        <button className="outlook-toolbar-btn" type="button" onClick={onCompose}>
          <span>✏</span> New mail
        </button>
        <button className="outlook-toolbar-btn" type="button">Delete</button>
        <button className="outlook-toolbar-btn" type="button">Archive</button>
        <button className="outlook-toolbar-btn outlook-toolbar-btn-text" type="button">Sweep ▾</button>
        <button className="outlook-toolbar-btn outlook-toolbar-btn-text" type="button">Move to ▾</button>
        <span className="outlook-toolbar-sep" />
        <button className="outlook-toolbar-btn" type="button">↩</button>
        <button className="outlook-toolbar-btn" type="button">↪</button>
      </div>
      <input className="outlook-search" placeholder="🔍 Search" aria-label="Search mail" />
      <div className="out-header-actions" ref={menuRef}>
        <button className="out-gear-btn" type="button" onClick={onOpenSettings} aria-label="Open settings">⚙</button>
        <ProfileAvatar fullName={fullName} email={email} onClick={() => setOpen((v) => !v)} />
        {open && <AccountDropdown email={email} fullName={fullName} accounts={accounts} onSignOut={onSignOut} onToggleTheme={onToggleTheme} isDark={isDark} />}
      </div>
    </header>
  );
}

function OutlookLoginScreen({
  emailInput,
  setEmailInput,
  password,
  setPassword,
  authError,
  onSignIn,
}: {
  emailInput: string;
  setEmailInput: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  authError: string;
  onSignIn: () => void;
}) {
  return (
    <div className="outlook-login-screen">
      <div className="outlook-login-card">
        <div className="ms-logo" aria-hidden="true"><span />Microsoft</div>
        <h2>Sign in</h2>
        <p>to continue to Outlook</p>
        <input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="Email, phone, or Skype" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <div className="out-login-links"><a href="#">No account? Create one!</a><a href="#">Can&apos;t access your account?</a></div>
        <div className="out-login-actions"><button type="button" onClick={onSignIn}>Next</button></div>
        {authError && <div className="out-auth-error">{authError}</div>}
      </div>
      <button className="out-signin-options" type="button">Sign-in options</button>
    </div>
  );
}

export function OutlookApp() {
  const { emails, sendEmail, markRead } = useMailStore();
  const { fullName } = useProfileStore();
  const accounts = useCompanyStore((s) => s.employerAccounts);
  const activeOutlookEmail = useCompanyStore((s) => s.sessions.activeOutlookEmail);
  const loginOutlook = useCompanyStore((s) => s.loginOutlook);
  const logoutOutlook = useCompanyStore((s) => s.logoutOutlook);
  const ensureEmployerFromOffer = useCompanyStore((s) => s.ensureEmployerFromOffer);
  const applyPromotionCommand = useCompanyStore((s) => s.applyPromotionCommand);

  const [emailInput, setEmailInput] = useState(activeOutlookEmail ?? 'user@workspace.aos');
  const [password, setPassword] = useState('workspace');
  const [authError, setAuthError] = useState('');
  const [folder, setFolder] = useState<EmailFolder>('inbox');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [messageTab, setMessageTab] = useState<'focused' | 'other'>('focused');

  const accountEmails = useMemo(
    () => ['user@workspace.aos', ...accounts.map((a) => a.companyEmail)],
    [accounts],
  );

  if (!activeOutlookEmail) {
    return (
      <OutlookLoginScreen
        emailInput={emailInput}
        setEmailInput={setEmailInput}
        password={password}
        setPassword={setPassword}
        authError={authError}
        onSignIn={() => {
          const ok = loginOutlook(emailInput, password);
          setAuthError(ok ? '' : 'That Microsoft account does not exist.');
        }}
      />
    );
  }

  const scoped = emails.filter((e) => (e.to + e.from).toLowerCase().includes(activeOutlookEmail.toLowerCase()) || activeOutlookEmail === 'user@workspace.aos');
  const folderEmails = scoped.filter((e) => (folder === 'starred' ? e.starred : e.folder === folder)).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const selected = folderEmails.find((e) => e.id === selectedId) ?? folderEmails[0] ?? null;

  const openCompose = (opts?: { to?: string; subject?: string; body?: string }) => {
    setTo(opts?.to ?? '');
    setSubject(opts?.subject ?? '');
    setBody(opts?.body ?? '');
    setComposeOpen(true);
  };

  const openReply = () => {
    if (!selected) return;
    const replyTo = extractEmail(selected.from);
    const replySubject = selected.subject.startsWith('RE: ') ? selected.subject : `RE: ${selected.subject}`;
    const quotedBody = `\n\n--- Original Message ---\nFrom: ${selected.from}\nDate: ${new Date(selected.date).toLocaleString()}\nSubject: ${selected.subject}\n\n`;
    openCompose({ to: replyTo, subject: replySubject, body: quotedBody });
  };

  const openForward = () => {
    if (!selected) return;
    const fwdSubject = selected.subject.startsWith('FW: ') ? selected.subject : `FW: ${selected.subject}`;
    const quotedBody = `\n\n--- Forwarded Message ---\nFrom: ${selected.from}\nDate: ${new Date(selected.date).toLocaleString()}\nSubject: ${selected.subject}\n\n`;
    openCompose({ subject: fwdSubject, body: quotedBody });
  };

  const send = () => {
    if (!to || !subject) return;
    sendEmail({ from: activeOutlookEmail, to, subject, body: `<p>${body.replace(/\n/g, '<br>')}</p>`, date: new Date().toISOString(), folder: 'sent' });
    if (selected) {
      const upper = body.toUpperCase();
      const pCount = percentCount(upper);
      if (pCount > 0) {
        const promo = applyPromotionCommand(activeOutlookEmail, pCount, `email:${selected.subject}`);
        if (promo) {
          sendEmail({ from: `${selected.to} <hr@${selected.to.split('@')[1] || 'company.com'}>`, to: activeOutlookEmail, subject: `Promotion confirmed: ${promo.toTitle}`, body: `<p>Your title has been updated from ${promo.fromTitle} to ${promo.toTitle}. Compensation updated to $${promo.toComp.toLocaleString()}.</p>`, date: new Date().toISOString(), folder: 'inbox' });
        }
      }
      if (upper.includes('I ACCEPT') && selected.jobMeta) {
        const account = ensureEmployerFromOffer({
          companyName: selected.jobMeta.company,
          role: selected.jobMeta.role,
          compensation: selected.jobMeta.compensation,
          managerName: selected.jobMeta.managerName,
          location: selected.jobMeta.location,
          fullName,
          department: selected.jobMeta.category,
        });
        sendEmail({
          from: `People Operations <hr@${account.domain}>`,
          to: activeOutlookEmail,
          subject: `Welcome to ${account.companyName} — account provisioning complete`,
          body: `<p>Your offer has been accepted for ${account.title}.</p><p>Company email: <strong>${account.companyEmail}</strong><br>Workday URL: <strong>workday.${account.domain}</strong><br>Outlook account is now available in account switching.</p>`,
          date: new Date().toISOString(),
          folder: 'inbox',
        });
      }
      if (upper.includes('EXEC')) {
        sendEmail({ from: `Executive Office <execoffice@${activeOutlookEmail.split('@')[1] || 'company.com'}>`, to: activeOutlookEmail, subject: 'Executive role process', body: '<p>Executive and board role requests require separate review. Your request has been logged for executive office screening.</p>', date: new Date().toISOString(), folder: 'inbox' });
      }
    }
    setComposeOpen(false);
    setTo('');
    setSubject('');
    setBody('');
  };

  const unreadCount = folderEmails.filter((e) => !e.read).length;

  return (
    <div className={`outlook-shell ${isDark ? 'theme-dark' : 'theme-light'}`}>
      <OutlookHeader
        fullName={fullName}
        email={activeOutlookEmail}
        accounts={accountEmails}
        onCompose={() => openCompose()}
        onSignOut={logoutOutlook}
        onOpenSettings={() => setSettingsOpen(true)}
        isDark={isDark}
        onToggleTheme={() => setIsDark((v) => !v)}
      />
      <div className="outlook-layout">
        {/* Sidebar */}
        <aside className="outlook-sidebar">
          <div className="outlook-sidebar-section">
            <div className="outlook-sidebar-section-title">Favorites</div>
            {(['inbox', 'sent', 'drafts'] as EmailFolder[]).map((k) => (
              <button
                key={`fav-${k}`}
                className={`outlook-sidebar-item ${folder === k ? 'active' : ''}`}
                type="button"
                onClick={() => setFolder(k)}
              >
                <span className="outlook-sidebar-icon">{FOLDER_ICONS[k]}</span>
                <span className="outlook-sidebar-label">{FOLDER_LABELS[k]}</span>
                {k === 'inbox' && unreadCount > 0 && (
                  <span className="outlook-sidebar-count">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
          <div className="outlook-sidebar-section">
            <div className="outlook-sidebar-section-title">{activeOutlookEmail}</div>
            {(Object.entries(FOLDER_LABELS) as [EmailFolder, string][]).map(([k, v]) => (
              <button
                key={k}
                className={`outlook-sidebar-item ${folder === k ? 'active' : ''}`}
                type="button"
                onClick={() => setFolder(k)}
              >
                <span className="outlook-sidebar-icon">{FOLDER_ICONS[k]}</span>
                <span className="outlook-sidebar-label">{v}</span>
                {k === 'inbox' && unreadCount > 0 && (
                  <span className="outlook-sidebar-count">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Message list */}
        <section className="outlook-message-list">
          {folder === 'inbox' && (
            <div className="outlook-message-tabs">
              <button
                className={messageTab === 'focused' ? 'active' : ''}
                type="button"
                onClick={() => setMessageTab('focused')}
              >
                Focused
              </button>
              <button
                className={messageTab === 'other' ? 'active' : ''}
                type="button"
                onClick={() => setMessageTab('other')}
              >
                Other
              </button>
            </div>
          )}
          {folder !== 'inbox' && (
            <div className="outlook-message-list-header">
              <span>{FOLDER_LABELS[folder]}</span>
              {folderEmails.length > 0 && (
                <span className="outlook-message-list-count">{folderEmails.length}</span>
              )}
            </div>
          )}
          <div className="outlook-message-list-items">
            {folderEmails.length === 0 && (
              <div className="outlook-message-empty">No messages</div>
            )}
            {folderEmails.map((e) => (
              <button
                key={e.id}
                type="button"
                className={`outlook-message-row ${selected?.id === e.id ? 'selected' : ''} ${!e.read ? 'unread' : ''}`}
                onClick={() => { setSelectedId(e.id); markRead(e.id); }}
              >
                <div className="outlook-message-row-avatar">
                  {getInitials(extractName(e.from)).toUpperCase()}
                </div>
                <div className="outlook-message-row-content">
                  <div className="outlook-message-row-top">
                    <span className="outlook-message-from">{extractName(e.from)}</span>
                    <span className="outlook-message-date">{formatDate(e.date)}</span>
                  </div>
                  <div className="outlook-message-subject">{e.subject}</div>
                  <div className="outlook-message-preview">{e.body.replace(/<[^>]+>/g, '').slice(0, 80)}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Reading pane */}
        <main className="outlook-reading-pane">
          {selected ? (
            <>
              <div className="outlook-reading-header">
                <h2 className="outlook-reading-subject">{selected.subject}</h2>
                <div className="outlook-reading-meta">
                  <div className="outlook-reading-avatar">
                    {getInitials(extractName(selected.from)).toUpperCase()}
                  </div>
                  <div className="outlook-reading-meta-text">
                    <div className="outlook-reading-from">
                      <strong>{extractName(selected.from)}</strong>
                      <span className="outlook-reading-from-addr">&lt;{extractEmail(selected.from)}&gt;</span>
                    </div>
                    <div className="outlook-reading-to">To: {selected.to}</div>
                    <div className="outlook-reading-date">{new Date(selected.date).toLocaleString()}</div>
                  </div>
                </div>
                <div className="outlook-reading-actions">
                  <button className="outlook-action-btn outlook-action-reply" type="button" onClick={openReply}>
                    ↩ Reply
                  </button>
                  <button className="outlook-action-btn" type="button" onClick={() => openCompose({ to: selected.from.includes('<') ? `${selected.from}` : selected.from })}>
                    ↩↩ Reply All
                  </button>
                  <button className="outlook-action-btn" type="button" onClick={openForward}>
                    ↪ Forward
                  </button>
                  <button className="outlook-action-btn" type="button">🗑 Delete</button>
                </div>
              </div>
              <article className="outlook-reading-body" dangerouslySetInnerHTML={{ __html: selected.body }} />
            </>
          ) : (
            <div className="outlook-reading-empty">Select an email to read</div>
          )}
        </main>
      </div>

      {composeOpen && (
        <div className="out-compose-overlay">
          <div className="out-compose-modal">
            <div className="out-compose-header">
              <span>New Message</span>
              <button className="out-compose-close" type="button" onClick={() => setComposeOpen(false)}>✕</button>
            </div>
            <div className="out-compose-fields">
              <div className="out-compose-field">
                <span className="out-compose-label">To</span>
                <input className="out-compose-input" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Recipients" />
              </div>
              <div className="out-compose-field">
                <span className="out-compose-label">Subject</span>
                <input className="out-compose-input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
              </div>
            </div>
            <textarea className="out-compose-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message..." />
            <div className="out-compose-footer">
              <button className="out-send-btn" type="button" onClick={send}>Send</button>
              <button className="out-discard-btn" type="button" onClick={() => setComposeOpen(false)}>Discard</button>
            </div>
          </div>
        </div>
      )}

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} isDark={isDark} onToggleTheme={() => setIsDark((v) => !v)} />
    </div>
  );
}
