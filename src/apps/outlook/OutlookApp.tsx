import { useMemo, useState, type CSSProperties } from 'react';
import { useMailStore, type Email, type EmailFolder } from '../../state/useMailStore';
import { useCompanyStore } from '../../state/useCompanyStore';
import { useProfileStore } from '../../state/useProfileStore';

const FOLDER_LABELS: Record<EmailFolder, string> = { inbox: 'Inbox', starred: 'Starred', sent: 'Sent', drafts: 'Drafts', trash: 'Trash' };

function percentCount(text: string) {
  const match = text.toUpperCase().match(/PROMOTION(%+)/);
  return match ? match[1].length : 0;
}

function extractName(from: string) {
  const m = from.match(/^([^<]+)/);
  return (m?.[1] ?? from).trim();
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
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const accountEmails = ['user@workspace.aos', ...accounts.map((a) => a.companyEmail)];

  if (!activeOutlookEmail) {
    return (
      <div style={{ height: '100%', display: 'grid', placeItems: 'center', background: '#f1f5f9' }}>
        <div style={{ width: 520, background: 'white', border: '1px solid #dbe3ee', borderRadius: 12, padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>Outlook account sign in</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>Choose one mailbox identity. Passwords are account-specific in this simulation.</p>
          <select value={emailInput} onChange={(e) => setEmailInput(e.target.value)} style={input}>{accountEmails.map((e) => <option key={e} value={e}>{e}</option>)}</select>
          <input value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...input, marginTop: 10 }} placeholder="Password" />
          <button type="button" onClick={() => { const ok = loginOutlook(emailInput, password); setAuthError(ok ? '' : 'Invalid credentials.'); }} style={{ ...btn, marginTop: 12 }}>Sign in</button>
          {authError && <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 8 }}>{authError}</div>}
          <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>Workspace account password: <strong>workspace</strong>. Company accounts default to <strong>Welcome@123</strong>.</div>
        </div>
      </div>
    );
  }

  const scoped = emails.filter((e) => (e.to + e.from).toLowerCase().includes(activeOutlookEmail.toLowerCase()) || activeOutlookEmail === 'user@workspace.aos');
  const folderEmails = scoped.filter((e) => folder === 'starred' ? e.starred : e.folder === folder).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const selected = folderEmails.find((e) => e.id === selectedId) ?? folderEmails[0] ?? null;

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
    setTo(''); setSubject(''); setBody('');
  };

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '220px 320px 1fr', background: '#f8fafc' }}>
      <aside style={{ borderRight: '1px solid #dbe3ee', background: '#f1f5f9', padding: 12 }}>
        <div style={{ fontWeight: 800, color: '#0b65a5' }}>Outlook</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{activeOutlookEmail}</div>
        <button type="button" onClick={logoutOutlook} style={{ ...btnGhost, marginTop: 8 }}>Sign out</button>
        <button type="button" onClick={() => setComposeOpen(true)} style={{ ...btn, marginTop: 8 }}>New Message</button>
        <div style={{ marginTop: 14 }}>
          {Object.entries(FOLDER_LABELS).map(([k, v]) => <button key={k} type="button" onClick={() => setFolder(k as EmailFolder)} style={{ ...navBtn, background: folder === k ? '#dbeafe' : 'transparent' }}>{v}</button>)}
        </div>
      </aside>
      <section style={{ borderRight: '1px solid #dbe3ee', overflow: 'auto' }}>
        {folderEmails.map((e) => (
          <button key={e.id} type="button" onClick={() => { setSelectedId(e.id); markRead(e.id); }} style={{ width: '100%', textAlign: 'left', padding: 10, borderBottom: '1px solid #eef2f7', background: selected?.id === e.id ? '#eff6ff' : 'white' }}>
            <div style={{ fontWeight: 600 }}>{extractName(e.from)}</div>
            <div style={{ fontSize: 13 }}>{e.subject}</div>
          </button>
        ))}
      </section>
      <main style={{ padding: 12, overflow: 'auto' }}>
        {selected ? (
          <>
            <h3 style={{ marginTop: 0 }}>{selected.subject}</h3>
            <div style={{ fontSize: 12, color: '#64748b' }}>From {selected.from} to {selected.to}</div>
            <div style={{ marginTop: 12, background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }} dangerouslySetInnerHTML={{ __html: selected.body }} />
          </>
        ) : <div>No email selected.</div>}
      </main>

      {composeOpen && (
        <div style={{ position: 'absolute', right: 20, bottom: 20, width: 460, background: 'white', border: '1px solid #cbd5e1', borderRadius: 10, padding: 12, boxShadow: '0 10px 32px rgba(0,0,0,0.2)' }}>
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="To" style={input} />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" style={{ ...input, marginTop: 8 }} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" style={{ ...input, marginTop: 8, minHeight: 120 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" onClick={send} style={btn}>Send</button>
            <button type="button" onClick={() => setComposeOpen(false)} style={btnGhost}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

const input: CSSProperties = { width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' };
const btn: CSSProperties = { padding: '8px 12px', borderRadius: 8, border: '1px solid #0b65a5', background: '#0b65a5', color: 'white', fontWeight: 700 };
const btnGhost: CSSProperties = { padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white' };
const navBtn: CSSProperties = { width: '100%', textAlign: 'left', borderRadius: 8, padding: '7px 8px', marginBottom: 4 };
