import { useState } from 'react';
import { useShellStore } from '../../state/useShellStore';
import { useSafariStore } from '../../state/useSafariStore';
import { useMailStore, type Email, type EmailFolder, type JobMeta } from '../../state/useMailStore';
import { meetingToolLabel } from '../safari/sites/LinkedInSite';

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

// ── ATS pipeline ───────────────────────────────────────────────────────────────

function strHashNum(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

function generateEIN(company: string): string {
  const h = strHashNum(company);
  const part1 = String(h % 100).padStart(2, '0');
  const part2 = String((h >> 7) % 10000000).padStart(7, '0');
  return `${part1}-${part2}`;
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

function getManagerEmail(managerName: string, domain: string): string {
  const parts = managerName.toLowerCase().split(' ');
  return `${parts[0]}.${parts[parts.length - 1]}@${domain}`;
}

function getCompanyArchetype(company: string): string {
  const type = company.split(' ').pop() ?? 'LLC';
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
    body: `
<p>Dear Applicant,</p>
<p>Thank you for your patience. After reviewing your application, we are pleased to invite you to a <strong>phone screening interview</strong> for the <strong>${meta.role}</strong> role at <strong>${meta.company}</strong>.</p>
<p>Please join us on <strong>${monday} at 2:00 PM</strong> for a 30-minute introductory conversation. We will discuss your background, your interest in the role, and give you an opportunity to ask questions about the team and the position.</p>
<p><strong>Join via ${tool}:</strong><br>
<a href="${meta.meetingLink}" style="color:#0078d4">${meta.meetingLink}</a></p>
<p>During the call, we will cover your relevant experience, motivations for applying, and a brief overview of what success looks like in this role. There is no technical assessment at this stage — this is a conversation.</p>
<p>If this time does not work, please reply and we will find an alternative. We look forward to speaking with you.</p>
<br>
<p>Best regards,<br>
<strong>${meta.recruiter}</strong><br>
Talent Acquisition, ${meta.company}<br>
<span style="color:#666;font-size:13px">careers@${meta.domain}</span></p>
    `.trim(),
    jobMeta: { ...meta, stage: 'phone-screen' },
  };
}

function buildDirectorEmail(meta: JobMeta): Omit<Email, 'id' | 'read' | 'starred'> {
  const tool = meetingToolLabel(meta.meetingTool);
  const monday = getNextMonday();
  return {
    from: `${meta.managerName} — Engineering at ${meta.company} <${getManagerEmail(meta.managerName, meta.domain)}>`,
    to: 'user@workspace.aos',
    subject: `Next Step: Meeting with Engineering Director — ${meta.role} at ${meta.company}`,
    date: new Date().toISOString(),
    folder: 'inbox',
    body: `
<p>Hi,</p>
<p>I'm ${meta.managerName}, Director of Engineering at ${meta.company}. Our recruiting team passed along your profile after your initial screening, and I wanted to personally reach out to schedule a follow-up conversation.</p>
<p>We are looking for someone to take real ownership of this ${meta.role} position, and your background caught my attention. I'd like to spend 45 minutes discussing the technical direction of the team, the specific challenges you'd be working on, and how your experience maps to what we're building.</p>
<p><strong>Join via ${tool} on ${monday} at 3:00 PM:</strong><br>
<a href="${meta.meetingLink}" style="color:#0078d4">${meta.meetingLink}</a></p>
<p>We'll cover:</p>
<ul>
<li>The team's current technical roadmap and priorities</li>
<li>Your experience with the core technical areas of the role</li>
<li>Your working style and what you look for in a team</li>
<li>Answers to any questions you have about ${meta.company}</li>
</ul>
<p>This is a two-way conversation — I want you to leave with a clear picture of what this opportunity looks like and whether it's the right fit for both of us.</p>
<br>
<p>Looking forward to it,<br>
<strong>${meta.managerName}</strong><br>
Director of Engineering, ${meta.company}<br>
<span style="color:#666;font-size:13px">${getManagerEmail(meta.managerName, meta.domain)}</span></p>
    `.trim(),
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
    body: `
<p>Dear Applicant,</p>
<p>Congratulations on advancing in our interview process for the <strong>${meta.role}</strong> position at <strong>${meta.company}</strong>. We are excited to invite you to a <strong>Panel Interview</strong> scheduled for <strong>${monday}</strong>.</p>
<p>The panel is structured as four back-to-back 45-minute sessions. All sessions will be held remotely via ${tool} using the same link:</p>
<p><a href="${meta.meetingLink}" style="color:#0078d4">${meta.meetingLink}</a></p>
<p><strong>Interview Schedule (${monday}):</strong></p>
<table style="border-collapse:collapse;width:100%;font-size:14px">
  <tr style="background:#f1f5f9">
    <td style="padding:8px 12px;font-weight:600">10:00 AM – 10:45 AM</td>
    <td style="padding:8px 12px"><strong>Technical Interview</strong> — Core skills and domain knowledge relevant to the ${meta.role} role</td>
  </tr>
  <tr>
    <td style="padding:8px 12px;font-weight:600">11:00 AM – 11:45 AM</td>
    <td style="padding:8px 12px"><strong>System Design</strong> — Architecture and design decision-making for large-scale systems</td>
  </tr>
  <tr style="background:#f1f5f9">
    <td style="padding:8px 12px;font-weight:600">1:00 PM – 1:45 PM</td>
    <td style="padding:8px 12px"><strong>Behavioral Interview</strong> — Past experience, leadership, and collaboration style</td>
  </tr>
  <tr>
    <td style="padding:8px 12px;font-weight:600">2:00 PM – 2:45 PM</td>
    <td style="padding:8px 12px"><strong>Team Fit & Culture</strong> — Meet members of the team you would be joining</td>
  </tr>
</table>
<br>
<p>Please plan to have a stable internet connection and a quiet environment for the duration of the interviews. You are welcome to take breaks between sessions.</p>
<p>We will send feedback within three business days of the panel. We appreciate your time and look forward to a great set of conversations.</p>
<br>
<p>Best regards,<br>
<strong>${meta.recruiter}</strong><br>
Talent Acquisition, ${meta.company}<br>
<span style="color:#666;font-size:13px">careers@${meta.domain}</span></p>
    `.trim(),
    jobMeta: { ...meta, stage: 'panel' },
  };
}

function buildOfferEmail(meta: JobMeta): Omit<Email, 'id' | 'read' | 'starred'> {
  const archetype = getCompanyArchetype(meta.company);
  const comp = meta.compensation;
  const bonusPct = archetype === 'finance' ? 30 : archetype === 'consulting' ? 20 : 15;
  const bonus = Math.round((comp * bonusPct / 100) / 1000) * 1000;
  const equityNote = archetype === 'tech'
    ? `<p>In addition to base compensation, this offer includes an equity package of <strong>RSUs vesting over 4 years with a 1-year cliff</strong>. Details will be provided in the formal offer letter.</p>`
    : archetype === 'finance'
    ? `<p>This position is eligible for an annual performance bonus targeted at <strong>${bonusPct}% of base salary</strong> (up to ${bonusPct * 2}% based on firm and individual performance). Bonus is paid in Q1 for the prior year.</p>`
    : archetype === 'consulting'
    ? `<p>This offer includes eligibility for our annual performance bonus (<strong>targeted ${bonusPct}%</strong>) and our employee profit-sharing program for qualifying engagements.</p>`
    : `<p>As an early employee, this offer includes a meaningful equity stake in the company. Your options will be detailed in the formal grant agreement.</p>`;

  const closingTone = archetype === 'finance'
    ? 'We look forward to welcoming you to the firm.'
    : archetype === 'tech'
    ? 'We are excited to have you join the team and ship great things together.'
    : archetype === 'consulting'
    ? 'We look forward to having you contribute to our client work from day one.'
    : 'We are excited to have you as a founding team member as we build something special.';

  return {
    from: `${meta.managerName} — Engineering at ${meta.company} <${getManagerEmail(meta.managerName, meta.domain)}>`,
    to: 'user@workspace.aos',
    subject: `Offer of Employment — ${meta.role} at ${meta.company}`,
    date: new Date().toISOString(),
    folder: 'inbox',
    body: `
<p>Dear Applicant,</p>
<p>On behalf of <strong>${meta.company}</strong>, it is my pleasure to extend this formal offer of employment for the position of <strong>${meta.role}</strong>, based in <strong>${meta.location}</strong>.</p>
<p>Following your panel interview, the team was impressed with your technical depth, your communication style, and the clarity of your thinking. We believe you will make a strong contribution to what we are building.</p>
<p><strong>Compensation Package:</strong></p>
<ul>
  <li><strong>Base Salary:</strong> $${comp.toLocaleString()} per year, paid bi-weekly</li>
  <li><strong>Annual Target Bonus:</strong> $${bonus.toLocaleString()} (${bonusPct}% of base, performance-dependent)</li>
  <li><strong>Benefits:</strong> Full medical, dental, and vision coverage; 401(k) with employer match; flexible PTO</li>
</ul>
${equityNote}
<p>This offer is contingent upon successful completion of a background check and verification of your eligibility to work in the United States (Form I-9). Your start date will be confirmed upon acceptance.</p>
<p>To accept this offer, please reply to this email with the words <strong>"I Accept"</strong> and we will send your onboarding packet and next steps within one business day.</p>
<p>${closingTone}</p>
<br>
<p>Sincerely,<br>
<strong>${meta.managerName}</strong><br>
Director of Engineering, ${meta.company}<br>
<span style="color:#666;font-size:13px">${getManagerEmail(meta.managerName, meta.domain)}</span></p>
    `.trim(),
    jobMeta: { ...meta, stage: 'offer' },
  };
}

function buildOnboardingEmail(meta: JobMeta): Omit<Email, 'id' | 'read' | 'starred'> {
  const startDate = getStartDate();
  const ein = generateEIN(meta.company);
  const managerEmail = getManagerEmail(meta.managerName, meta.domain);
  const city = meta.location.split(',')[0] ?? meta.location;
  const companyAddress = `1 ${meta.company.split(' ')[0]} Plaza, Suite 100, ${city}`;

  return {
    from: `${meta.recruiter} — People Operations at ${meta.company} <hr@${meta.domain}>`,
    to: 'user@workspace.aos',
    subject: `Welcome to ${meta.company} — Onboarding Information`,
    date: new Date().toISOString(),
    folder: 'inbox',
    body: `
<p>Dear New Team Member,</p>
<p>Congratulations and welcome to <strong>${meta.company}</strong>! We are thrilled to have you joining us as a <strong>${meta.role}</strong>. This email contains everything you need for your first day and onboarding process.</p>

<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">

<p><strong>Start Date:</strong> ${startDate}<br>
<strong>Hours:</strong> 9:00 AM – 6:00 PM local time; core hours 10:00 AM – 4:00 PM<br>
<strong>Location:</strong> ${meta.location} (or remote if applicable per your offer)<br>
<strong>Manager:</strong> ${meta.managerName} · <a href="mailto:${managerEmail}" style="color:#0078d4">${managerEmail}</a></p>

<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">

<p><strong>Compensation:</strong><br>
Base salary of <strong>$${meta.compensation.toLocaleString()}/year</strong>, paid bi-weekly on the 1st and 15th. Your first paycheck will include any partial-period proration based on your start date. Direct deposit enrollment instructions are included in your onboarding portal.</p>

<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">

<p><strong>Employee Handbook:</strong><br>
Our full handbook is available at <a href="https://handbook.${meta.domain}" style="color:#0078d4">handbook.${meta.domain}</a>. Please review the Code of Conduct, Information Security Policy, and PTO guidelines before your first day.</p>

<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">

<p><strong>Required New Hire Forms:</strong></p>
<p>All new employees are required to complete the following federal forms. Please have appropriate identification documents available.</p>

<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:12px 0">
<p style="margin:0 0 8px;font-weight:600">Form I-9: Employment Eligibility Verification</p>
<p style="margin:0;font-size:13px;color:#475569">Issued by the United States Citizenship and Immigration Services (USCIS). You must present original documents from List A, or one document from both List B and List C, no later than your first day of employment.</p>
<p style="margin:8px 0 0;font-size:13px"><strong>Employer Name:</strong> ${meta.company}<br>
<strong>Employer Address:</strong> ${companyAddress}<br>
<strong>First Day of Employment:</strong> ${startDate}</p>
</div>

<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:12px 0">
<p style="margin:0 0 8px;font-weight:600">IRS Form W-4: Employee's Withholding Certificate</p>
<p style="margin:0;font-size:13px;color:#475569">Complete this form so ${meta.company} can withhold the correct federal income tax from your pay. You may update your withholding at any time by submitting a new W-4.</p>
<p style="margin:8px 0 0;font-size:13px"><strong>Employer Name:</strong> ${meta.company}<br>
<strong>Employer EIN:</strong> ${ein}<br>
<strong>Employer Address:</strong> ${companyAddress}</p>
</div>

<p style="font-size:13px;color:#64748b">Additional state-specific forms may be required based on your work location. Your People Operations contact will provide these separately if applicable.</p>

<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">

<p><strong>IT Setup:</strong><br>
Your equipment will be shipped to arrive before your start date. Once you receive it, follow the setup instructions at <a href="https://it.${meta.domain}/setup" style="color:#0078d4">it.${meta.domain}/setup</a> to provision your accounts, connect to the corporate VPN, and access your development environment.</p>

<p>If you have any questions before your start date, do not hesitate to reach out to your manager ${meta.managerName} at <a href="mailto:${managerEmail}" style="color:#0078d4">${managerEmail}</a> or reply to this email.</p>

<p>We look forward to having you on the team.</p>
<br>
<p>Best regards,<br>
<strong>${meta.recruiter}</strong><br>
People Operations, ${meta.company}<br>
<span style="color:#666;font-size:13px">hr@${meta.domain}</span></p>
    `.trim(),
    jobMeta: { ...meta, stage: 'onboarding' },
  };
}

function processAtsReply(
  original: Email,
  replyBody: string,
  sendEmail: (e: Omit<Email, 'id' | 'read' | 'starred'> & { jobMeta?: JobMeta }) => void
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

// ── Compose Modal ─────────────────────────────────────────────────────────────

type ComposeOptions = {
  replyTo?: {
    to: string;
    subject: string;
    originalEmail?: Email;
  };
};

function ComposeModal({ onClose, options, onSend }: { onClose: () => void; options?: ComposeOptions; onSend?: (body: string, originalEmail?: Email) => void }) {
  const { sendEmail } = useMailStore();
  const rt = options?.replyTo;
  const [to, setTo] = useState(rt?.to ?? '');
  const [subject, setSubject] = useState(
    rt?.subject ? `RE: ${rt.subject.replace(/^RE:\s*/i, '')}` : ''
  );
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
    // ATS cheat code detection
    if (rt?.originalEmail) {
      processAtsReply(rt.originalEmail, body, (e) => sendEmail({ ...e, folder: 'inbox' }));
    }
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
  const { emails, markRead, toggleStar, moveToFolder } = useMailStore();
  const openWindow = useShellStore((s) => s.openWindow);
  const navigate = useSafariStore((s) => s.navigate);
  const [activeFolder, setActiveFolder] = useState<EmailFolder>('inbox');
  const [selectedId, setSelectedId] = useState<string | null>(emails[0]?.id ?? null);
  const [composing, setComposing] = useState<ComposeOptions | null>(null);
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
          {/* Microsoft Outlook-style blue envelope icon */}
          <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="8" fill="#0078d4"/>
            <rect x="7" y="15" width="34" height="23" rx="3" fill="white" opacity="0.95"/>
            <path d="M7 19l17 12 17-12" stroke="#0078d4" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
            <text x="10" y="13" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="11" fill="white">Outlook</text>
          </svg>
          <span className="out-brand-name">Outlook</span>
        </div>
        <input
          className="out-search"
          placeholder="Search mail"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="button" className="out-compose-btn" onClick={() => setComposing({})}>
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
                  <button
                    type="button"
                    className="out-action-btn out-action-reply"
                    onClick={() => setComposing({
                      replyTo: {
                        to: extractEmail(selectedEmail.from),
                        subject: selectedEmail.subject,
                        originalEmail: selectedEmail,
                      }
                    })}
                  >
                    Reply
                  </button>
                </div>
              </div>
              <div
                className="out-detail-body"
                onClick={(event) => {
                  const target = event.target as HTMLElement;
                  const anchorEl = target.closest('a') as HTMLAnchorElement | null;
                  if (!anchorEl?.href) return;
                  event.preventDefault();
                  navigate(anchorEl.href);
                  openWindow('safari');
                }}
                dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
              />
            </>
          )}
        </div>
      </div>

      {composing !== null && (
        <ComposeModal
          onClose={() => setComposing(null)}
          options={composing}
        />
      )}
    </div>
  );
}
