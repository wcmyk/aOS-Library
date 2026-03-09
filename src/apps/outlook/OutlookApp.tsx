import { useEffect, useMemo, useRef, useState } from 'react';
import { useMailStore, type Email, type EmailFolder, type JobMeta } from '../../state/useMailStore';
import { useCompanyStore } from '../../state/useCompanyStore';
import { useProfileStore } from '../../state/useProfileStore';
import { meetingToolLabel } from '../safari/sites/LinkedInSite';

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

// ── ATS Pipeline ──────────────────────────────────────────────────────────────

function strHashNum(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}
function generateEIN(company: string): string {
  const h = strHashNum(company);
  return `${String(h % 100).padStart(2, '0')}-${String((h >> 7) % 10000000).padStart(7, '0')}`;
}
function getNextMonday(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
function getStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function getManagerEmail(name: string, domain: string): string {
  const parts = name.toLowerCase().split(' ');
  return `${parts[0]}.${parts[parts.length - 1]}@${domain}`;
}
function getCompanyArchetype(company: string): string {
  const type = company.split(' ').pop() ?? '';
  if (['Capital','Partners','Advisory','Advisors'].includes(type)) return 'finance';
  if (['Technologies','Systems','Solutions','Analytics'].includes(type)) return 'tech';
  if (['Consulting'].includes(type)) return 'consulting';
  return 'startup';
}

function buildPhoneScreenEmail(meta: JobMeta): Omit<Email, 'id' | 'read' | 'starred'> {
  const tool = meetingToolLabel(meta.meetingTool);
  const monday = getNextMonday();
  return {
    from: `${meta.recruiter} — Talent Acquisition at ${meta.company} <careers@${meta.domain}>`,
    to: 'user@workspace.aos',
    subject: `Interview Invitation — Phone Screen — ${meta.role} at ${meta.company}`,
    date: new Date().toISOString(),
    folder: 'inbox',
    body: `<p>Dear Applicant,</p><p>Thank you for your patience. After reviewing your application, we are pleased to invite you to a <strong>phone screening interview</strong> for the <strong>${meta.role}</strong> role at <strong>${meta.company}</strong>.</p><p>Please join us on <strong>${monday} at 2:00 PM</strong> for a 30-minute introductory conversation.</p><p><strong>Join via ${tool}:</strong><br><a href="${meta.meetingLink}" style="color:#0078d4">${meta.meetingLink}</a></p><p>There is no technical assessment at this stage — this is a conversation.</p><br><p>Best regards,<br><strong>${meta.recruiter}</strong><br>Talent Acquisition, ${meta.company}</p>`,
    jobMeta: { ...meta, stage: 'phone-screen' },
  };
}

function buildDirectorEmail(meta: JobMeta): Omit<Email, 'id' | 'read' | 'starred'> {
  const tool = meetingToolLabel(meta.meetingTool);
  const monday = getNextMonday();
  const mgEmail = getManagerEmail(meta.managerName, meta.domain);
  return {
    from: `${meta.managerName} — Engineering at ${meta.company} <${mgEmail}>`,
    to: 'user@workspace.aos',
    subject: `Next Step: Meeting with Engineering Director — ${meta.role} at ${meta.company}`,
    date: new Date().toISOString(),
    folder: 'inbox',
    body: `<p>Hi,</p><p>I'm ${meta.managerName}, Director of Engineering at ${meta.company}. I'd like to personally schedule a follow-up conversation.</p><p><strong>Join via ${tool} on ${monday} at 3:00 PM:</strong><br><a href="${meta.meetingLink}" style="color:#0078d4">${meta.meetingLink}</a></p><p>We'll cover the team's roadmap, your experience, and what this opportunity looks like day-to-day.</p><br><p>Looking forward to it,<br><strong>${meta.managerName}</strong><br>Director of Engineering, ${meta.company}</p>`,
    jobMeta: { ...meta, stage: 'director' },
  };
}

function buildPanelEmail(meta: JobMeta): Omit<Email, 'id' | 'read' | 'starred'> {
  const tool = meetingToolLabel(meta.meetingTool);
  const monday = getNextMonday();
  return {
    from: `${meta.recruiter} — Talent Acquisition at ${meta.company} <careers@${meta.domain}>`,
    to: 'user@workspace.aos',
    subject: `Panel Interview Confirmation — ${meta.role} at ${meta.company}`,
    date: new Date().toISOString(),
    folder: 'inbox',
    body: `<p>Dear Applicant,</p><p>Congratulations on advancing for the <strong>${meta.role}</strong> position at <strong>${meta.company}</strong>. We are inviting you to a <strong>Panel Interview</strong> on <strong>${monday}</strong>.</p><p><a href="${meta.meetingLink}" style="color:#0078d4">${meta.meetingLink}</a></p><table style="border-collapse:collapse;width:100%;font-size:13px"><tr style="background:#f1f5f9"><td style="padding:8px"><strong>10:00–10:45 AM</strong></td><td style="padding:8px">Technical Interview</td></tr><tr><td style="padding:8px"><strong>11:00–11:45 AM</strong></td><td style="padding:8px">System Design</td></tr><tr style="background:#f1f5f9"><td style="padding:8px"><strong>1:00–1:45 PM</strong></td><td style="padding:8px">Behavioral Interview</td></tr><tr><td style="padding:8px"><strong>2:00–2:45 PM</strong></td><td style="padding:8px">Team Fit &amp; Culture (${tool})</td></tr></table><p>Feedback will follow within three business days.</p><br><p>Best regards,<br><strong>${meta.recruiter}</strong><br>Talent Acquisition, ${meta.company}</p>`,
    jobMeta: { ...meta, stage: 'panel' },
  };
}

function buildOfferEmail(meta: JobMeta): Omit<Email, 'id' | 'read' | 'starred'> {
  const arch = getCompanyArchetype(meta.company);
  const bonus = Math.round((meta.compensation * (arch === 'finance' ? 0.3 : 0.15)) / 1000) * 1000;
  const mgEmail = getManagerEmail(meta.managerName, meta.domain);
  return {
    from: `${meta.managerName} — Engineering at ${meta.company} <${mgEmail}>`,
    to: 'user@workspace.aos',
    subject: `Offer of Employment — ${meta.role} at ${meta.company}`,
    date: new Date().toISOString(),
    folder: 'inbox',
    body: `<p>Dear Applicant,</p><p>On behalf of <strong>${meta.company}</strong>, it is my pleasure to extend this formal offer for the position of <strong>${meta.role}</strong>, based in <strong>${meta.location}</strong>.</p><p><strong>Compensation Package:</strong></p><ul><li><strong>Base Salary:</strong> $${meta.compensation.toLocaleString()} per year, paid bi-weekly</li><li><strong>Annual Target Bonus:</strong> $${bonus.toLocaleString()}</li><li><strong>Benefits:</strong> Full medical, dental, vision; 401(k) with employer match; flexible PTO</li></ul><p>To accept this offer, please reply with the words <strong>"I Accept"</strong> and we will send your onboarding packet within one business day.</p><br><p>Sincerely,<br><strong>${meta.managerName}</strong><br>Director of Engineering, ${meta.company}</p>`,
    jobMeta: { ...meta, stage: 'offer' },
  };
}

function buildOnboardingEmail(meta: JobMeta): Omit<Email, 'id' | 'read' | 'starred'> {
  const startDate = getStartDate();
  const ein = generateEIN(meta.company);
  const mgEmail = getManagerEmail(meta.managerName, meta.domain);
  const city = meta.location.split(',')[0] ?? meta.location;
  const addr = `1 ${meta.company.split(' ')[0]} Plaza, Suite 100, ${city}`;
  return {
    from: `${meta.recruiter} — People Operations at ${meta.company} <hr@${meta.domain}>`,
    to: 'user@workspace.aos',
    subject: `Welcome to ${meta.company} — Onboarding Information`,
    date: new Date().toISOString(),
    folder: 'inbox',
    body: `<p>Dear New Team Member,</p><p>Congratulations and welcome to <strong>${meta.company}</strong>! You are joining as a <strong>${meta.role}</strong>.</p><p><strong>Start Date:</strong> ${startDate}<br><strong>Manager:</strong> ${meta.managerName} · <a href="mailto:${mgEmail}" style="color:#0078d4">${mgEmail}</a></p><hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0"><p><strong>Compensation:</strong> Base salary of <strong>$${meta.compensation.toLocaleString()}/year</strong>, paid bi-weekly. Direct deposit enrollment instructions are in your onboarding portal.</p><hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0"><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px;margin:10px 0"><p style="margin:0 0 6px;font-weight:600">IRS Form W-4 — Employee's Withholding Certificate</p><p style="margin:0;font-size:13px"><strong>Employer:</strong> ${meta.company} · <strong>EIN:</strong> ${ein}<br><strong>Address:</strong> ${addr}</p></div><p>Please reply to this email confirming receipt. If you have any questions, contact <a href="mailto:${mgEmail}" style="color:#0078d4">${mgEmail}</a>.</p><p><em>Tip: reply with <strong>PROMOTION%</strong> to trigger a promotion review after settling in.</em></p><br><p>Best regards,<br><strong>${meta.recruiter}</strong><br>People Operations, ${meta.company}</p>`,
    jobMeta: { ...meta, stage: 'onboarding' },
  };
}

const MORTGAGE_BANKS = ['CHASE', 'WELLS FARGO', 'TD AMERITRADE', 'PNC', '5/3', 'BANK OF AMERICA', 'CITIBANK', 'CAPITAL ONE'];

function processHousingAutomation(
  original: Email,
  replyBody: string,
  sendEmail: (e: Omit<Email, 'id' | 'read' | 'starred'> & { jobMeta?: JobMeta }) => void,
) {
  const upper = replyBody.toUpperCase();
  const subjectRoot = original.subject.replace(/^RE:\s*/i, '');
  if (upper.includes('APPLY%%%')) {
    sendEmail({ from: 'Prime Residential <leasing@prime-residential.com>', to: 'user@workspace.aos', subject: `Re: ${subjectRoot}`, date: new Date().toISOString(), folder: 'inbox', body: '<p>Your application has been received. Reply with <strong>LEASEPLEASE</strong> to request your lease packet.</p>' });
  }
  if (upper.includes('LEASEPLEASE')) {
    sendEmail({ from: 'Prime Residential <leasing@prime-residential.com>', to: 'user@workspace.aos', subject: `Re: ${subjectRoot}`, date: new Date().toISOString(), folder: 'inbox', body: '<p>Your lease packet is prepared. Reply with <strong>LEASEDONE%</strong> when signed to activate housing and RentCafe tracking.</p>' });
  }
  if (upper.includes('LEASEDONE%')) {
    sendEmail({ from: 'RentCafe <noreply@rentcafe.aos>', to: 'user@workspace.aos', subject: 'RentCafe account activated', date: new Date().toISOString(), folder: 'inbox', body: '<p>Your residence has been confirmed and rent tracking is now active in RentCafe.</p>' });
  }
  if (upper.includes('MORTPLEASE')) {
    sendEmail({ from: 'Mortgage Desk <mortgage@banking.aos>', to: 'user@workspace.aos', subject: 'Mortgage intake received', date: new Date().toISOString(), folder: 'inbox', body: '<p>We have received your mortgage request. Please respond with the bank you want to originate the mortgage with (e.g., CHASE, WELLS FARGO, BANK OF AMERICA).</p>' });
  }
  const bank = MORTGAGE_BANKS.find((b) => upper.includes(b));
  if (bank) {
    sendEmail({ from: `${bank} Mortgage Team <home-loans@${bank.toLowerCase().replace(/\s+/g, '')}.aos>`, to: 'user@workspace.aos', subject: `${bank} mortgage confirmation`, date: new Date().toISOString(), folder: 'inbox', body: `<p>Your mortgage has been initiated with ${bank} and reflected in your banking profile.</p>` });
  }
}

function processAtsReply(
  original: Email,
  replyBody: string,
  sendEmail: (e: Omit<Email, 'id' | 'read' | 'starred'> & { jobMeta?: JobMeta }) => void,
) {
  const { jobMeta } = original;
  if (!jobMeta) return;
  const upper = replyBody.toUpperCase();
  if (jobMeta.stage === 'confirmation' && upper.includes('ATS100')) {
    sendEmail(buildPhoneScreenEmail(jobMeta));
  } else if (jobMeta.stage === 'phone-screen' && upper.includes('MANAGER100')) {
    sendEmail(buildDirectorEmail(jobMeta));
  } else if (jobMeta.stage === 'director' && upper.includes('PANELS100')) {
    sendEmail(buildPanelEmail(jobMeta));
  } else if (jobMeta.stage === 'panel' && upper.includes('THANK YOU')) {
    sendEmail(buildOfferEmail(jobMeta));
  } else if (jobMeta.stage === 'offer' && upper.includes('I ACCEPT')) {
    sendEmail(buildOnboardingEmail(jobMeta));
  }
}

// ── UI helpers ─────────────────────────────────────────────────────────────────

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

      // ── ATS stage advance codes ──────────────────────────────────────────────
      processAtsReply(selected, body, (e) => sendEmail({ ...e, folder: 'inbox' }));

      // ── Housing automation codes ─────────────────────────────────────────────
      processHousingAutomation(selected, body, (e) => sendEmail({ ...e, folder: 'inbox' }));

      // ── PROMOTION% — find the matching employer account by email domain ──────
      const pCount = percentCount(upper);
      if (pCount > 0) {
        // Try activeOutlookEmail first; fall back to finding account by email domain from the selected email
        const senderDomain = selected.from.match(/@([\w.-]+)>?$/)?.[1];
        const matchedAcc = accounts.find((a) =>
          a.companyEmail.toLowerCase() === activeOutlookEmail.toLowerCase() ||
          (senderDomain && a.domain === senderDomain),
        );
        const emailForPromo = matchedAcc?.companyEmail ?? activeOutlookEmail;
        const promo = applyPromotionCommand(emailForPromo, pCount, `email:${selected.subject}`);
        if (promo) {
          sendEmail({
            from: `People Operations <hr@${matchedAcc?.domain ?? selected.from.split('@')[1]?.replace('>', '') ?? 'company.com'}>`,
            to: activeOutlookEmail,
            subject: `Promotion confirmed — ${promo.toTitle}`,
            body: `<p>Congratulations! Your title has been updated from <strong>${promo.fromTitle}</strong> to <strong>${promo.toTitle}</strong>.</p><p>Your new base salary is <strong>$${promo.toComp.toLocaleString()}</strong>/year, effective immediately. This change is reflected in Workday and your next payroll cycle.</p><p>Best regards,<br><strong>People Operations</strong></p>`,
            date: new Date().toISOString(),
            folder: 'inbox',
          });
        }
      }

      // ── I ACCEPT on offer email ─────────────────────────────────────────────
      // (also handled by processAtsReply → buildOnboardingEmail above for the jobMeta flow)
      // This branch handles provisioning the employer account when accepting the offer
      if (upper.includes('I ACCEPT') && selected.jobMeta?.stage === 'offer') {
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
          body: `<p>Your offer has been accepted for <strong>${account.title}</strong>.</p><p>Company email: <strong>${account.companyEmail}</strong><br>Workday URL: <strong>workday.${account.domain}</strong><br>Outlook password: <strong>${account.outlookPassword}</strong><br>Your company Outlook account is now available via account switching.</p>`,
          date: new Date().toISOString(),
          folder: 'inbox',
        });
      }

      // ── EXEC routing ────────────────────────────────────────────────────────
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
