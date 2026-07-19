import { useEffect, useMemo, useRef, useState } from 'react';
import { useMailStore, type Email, type EmailFolder, type JobMeta } from '../../state/useMailStore';
import { useCompanyStore } from '../../state/useCompanyStore';
import { useProfileStore } from '../../state/useProfileStore';
import { meetingToolLabel } from '../safari/sites/LinkedInSite';
import { CompanyLogo } from '../../data/brands';
import './outlook.css';

const FOLDER_LABELS: Record<EmailFolder, string> = {
  inbox: 'Inbox',
  starred: 'Starred',
  sent: 'Sent Items',
  drafts: 'Drafts',
  trash: 'Deleted Items',
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

const AVATAR_COLORS = ['#0f6cbd', '#ca5010', '#038387', '#8764b8', '#498205', '#c239b3', '#986f0b', '#4f6bed', '#d13438', '#00758f'];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' });
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


// ── Onboarding credentials + paperwork ───────────────────────────────────────

function expectedCompanyEmail(fullNameOrPlaceholder: string, domain: string): string {
  const clean = fullNameOrPlaceholder.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/);
  const first = clean[0] ?? 'new';
  const last = clean[clean.length - 1] ?? 'hire';
  return `${first}.${last}@${domain}`;
}

function credentialsBlock(meta: JobMeta): string {
  return `<div style="background:#f0f6ff;border:1px solid #cfe0f5;border-radius:8px;padding:14px;margin:12px 0"><p style="margin:0 0 6px;font-weight:600">Your ${meta.company} account credentials (active upon acceptance)</p><table style="font-size:13px;border-collapse:collapse"><tr><td style="padding:2px 14px 2px 0;color:#555">Company email / Teams sign-in</td><td><strong>&lt;firstname&gt;.&lt;lastname&gt;@${meta.domain}</strong></td></tr><tr><td style="padding:2px 14px 2px 0;color:#555">Temporary password</td><td><strong>Welcome@123</strong></td></tr><tr><td style="padding:2px 14px 2px 0;color:#555">Workday tenant</td><td><strong>workday.${meta.domain}</strong></td></tr><tr><td style="padding:2px 14px 2px 0;color:#555">Microsoft Teams</td><td><strong>${meta.company} tenant — your access is limited to this organization</strong></td></tr></table></div>`;
}

function formCard(title: string, rows: Array<[string, string]>, note?: string): string {
  const body = rows.map(([k, v]) => `<tr><td style=\"padding:3px 16px 3px 0;color:#555;white-space:nowrap\">${k}</td><td style=\"padding:3px 0\"><strong>${v}</strong></td></tr>`).join('');
  return `<div style=\"background:#fbfbf9;border:1.5px solid #c9c9c2;border-radius:6px;padding:14px;margin:12px 0;font-family:Georgia,serif\"><p style=\"margin:0 0 8px;font-weight:700;letter-spacing:0.02em\">${title}</p><table style=\"font-size:13px;border-collapse:collapse\">${body}</table>${note ? `<p style=\"margin:8px 0 0;font-size:12px;color:#777\">${note}</p>` : ''}</div>`;
}

function buildPaperworkEmail(meta: JobMeta, fullName: string, companyEmail: string, password: string): Omit<Email, 'id' | 'read' | 'starred'> {
  const isContract = /contract/i.test(meta.employmentType ?? '');
  const ein = generateEIN(meta.company);
  const today = new Date().toLocaleDateString('en-US');
  const forms = isContract
    ? formCard('Form W-9 — Request for Taxpayer Identification Number and Certification', [
        ['Name (as shown on your income tax return)', fullName],
        ['Federal tax classification', 'Individual/sole proprietor'],
        ['Requester', `${meta.company} · EIN ${ein}`],
        ['TIN', 'XXX-XX-____ (complete in Workday)'],
        ['Certification date', today],
      ], 'As an independent contractor you will receive Form 1099-NEC reporting nonemployee compensation for the year. No taxes are withheld from your payments — you are responsible for quarterly estimated taxes.')
      + formCard('Form 1099-NEC — Nonemployee Compensation (issued each January)', [
        ['Payer', `${meta.company} · EIN ${ein}`],
        ['Recipient', fullName],
        ['Box 1 — Nonemployee compensation', 'Reported at year end'],
      ])
    : formCard("Form I-9 — Employment Eligibility Verification (Section 1)", [
        ['Employee name', fullName],
        ['Employer', `${meta.company} · EIN ${ein}`],
        ['Citizenship/immigration status attestation', 'Complete in Workday within 3 business days of start'],
        ['Acceptable documents', 'List A (e.g., U.S. Passport) OR List B + List C (e.g., license + Social Security card)'],
        ['Section 2 appointment', 'First day, with People Operations'],
      ], 'Federal law requires completion of Form I-9 no later than your third day of employment.')
      + formCard("Form W-4 — Employee's Withholding Certificate", [
        ['Employee', fullName],
        ['Employer', `${meta.company} · EIN ${ein}`],
        ['Filing status', 'Single or Married filing separately (default — update in Workday)'],
        ['Step 2-4 adjustments', 'None on file'],
        ['Signature date', today],
      ])
      + formCard('Direct Deposit Enrollment', [
        ['Bank', 'JPMorgan Chase Bank, N.A.'],
        ['Routing number', '021000021'],
        ['Account', 'Chase Total Checking ····1666'],
        ['Deposit allocation', '100% of net pay'],
      ], 'First deposit lands with your first biweekly payroll run.');

  return {
    from: `People Operations at ${meta.company} <hr@${meta.domain}>`,
    to: 'user@workspace.aos',
    subject: `Onboarding packet — credentials and required employment forms — ${meta.company}`,
    date: new Date().toISOString(),
    folder: 'inbox',
    body: `<p>Welcome to <strong>${meta.company}</strong>!</p><p>Your accounts are provisioned. Use these credentials for company email (Outlook account switcher), <strong>Microsoft Teams</strong>, and Workday:</p><div style="background:#f0f6ff;border:1px solid #cfe0f5;border-radius:8px;padding:14px;margin:10px 0"><table style="font-size:13px;border-collapse:collapse"><tr><td style="padding:2px 14px 2px 0;color:#555">Company email / Teams</td><td><strong>${companyEmail}</strong></td></tr><tr><td style="padding:2px 14px 2px 0;color:#555">Password</td><td><strong>${password}</strong></td></tr><tr><td style="padding:2px 14px 2px 0;color:#555">Workday</td><td><strong>workday.${meta.domain}</strong> (same password)</td></tr></table><p style="margin:8px 0 0;font-size:12px;color:#555">Teams access is scoped to the ${meta.company} tenant only — organizations you don't work for will not appear.</p></div><p>The following ${isContract ? 'contractor' : 'employment'} paperwork is required before your start date. Review each form below; completion is tracked in Workday.</p>${forms}<p>Questions? Reply to this email and People Operations will follow up.</p>`,
    jobMeta: { ...meta, stage: 'onboarding' },
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
    body: `<p>Dear Applicant,</p><p>On behalf of <strong>${meta.company}</strong>, it is my pleasure to extend this formal offer for the position of <strong>${meta.role}</strong>, based in <strong>${meta.location}</strong>.</p><p><strong>Compensation Package:</strong></p><ul><li><strong>Base Salary:</strong> $${meta.compensation.toLocaleString()} per year, paid bi-weekly</li><li><strong>Annual Target Bonus:</strong> $${bonus.toLocaleString()}</li><li><strong>Benefits:</strong> Full medical, dental, vision; 401(k) with employer match; flexible PTO</li></ul>${credentialsBlock(meta)}<p>To accept this offer, please reply with the words <strong>"I Accept"</strong>. Your onboarding packet — including Form I-9, tax withholding forms, and direct deposit enrollment — will follow immediately.</p><br><p>Sincerely,<br><strong>${meta.managerName}</strong><br>Director of Engineering, ${meta.company}</p>`,
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

const MORTGAGE_BANKS = ['CHASE', 'WELLS FARGO', 'TD AMERITRADE', 'PNC', '5/3', 'BANK OF AMERICA', 'CITIBANK', 'CAPITAL ONE', 'HUNTINGTON'];

export function processHousingAutomation(
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

export function processAtsReply(
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

// ── Fluent icons ──────────────────────────────────────────────────────────────

const Ic = {
  mail: (c = 'currentColor') => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm8 7.2L4.4 7h15.2L12 12.2zM4 9.1V17h16V9.1l-7.5 4.8a1 1 0 0 1-1 0L4 9.1z"/></svg>,
  calendar: (c = 'currentColor') => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><path d="M17 3v1H7V3H5v1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3h-2zM4 8h16v10H4V8zm2 2v2h3v-2H6z"/></svg>,
  people: (c = 'currentColor') => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm7.5 1a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5zM2 18.5C2 15.5 5 14 9 14s7 1.5 7 4.5V20H2v-1.5zM17.5 14c-.6 0-1.2.06-1.76.17 1.38.98 2.26 2.3 2.26 4.33V20H22v-1.25c0-2.6-2.06-4.75-4.5-4.75z"/></svg>,
  word: () => <svg width="20" height="20" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="3" fill="#185ABD"/><path d="M6 7l1.8 10h1.9l1.6-7.2L12.9 17h1.9L16.9 7h-1.8l-1.3 7.4L12.2 7h-1.4l-1.6 7.4L7.9 7H6z" fill="#fff"/></svg>,
  excel: () => <svg width="20" height="20" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="3" fill="#107C41"/><path d="M8 7l2.7 5L8 17h2.2l1.7-3.4L13.6 17h2.2l-2.7-5 2.7-5h-2.2l-1.7 3.4L10.2 7H8z" fill="#fff"/></svg>,
  ppt: () => <svg width="20" height="20" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="3" fill="#C43E1C"/><path d="M8 7h4.5a3.25 3.25 0 0 1 0 6.5H10V17H8V7zm2 2v2.5h2.4a1.25 1.25 0 0 0 0-2.5H10z" fill="#fff"/></svg>,
  todo: () => <svg width="20" height="20" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="3" fill="#2564CF"/><path d="M7 12.5l3 3 7-7-1.4-1.4L10 12.7l-1.6-1.6L7 12.5z" fill="#fff"/></svg>,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function MicrosoftLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" aria-hidden="true">
      <rect x="0" y="0" width="10" height="10" fill="#f25022" />
      <rect x="11" y="0" width="10" height="10" fill="#7fba00" />
      <rect x="0" y="11" width="10" height="10" fill="#00a4ef" />
      <rect x="11" y="11" width="10" height="10" fill="#ffb900" />
    </svg>
  );
}

function OutlookLoginScreen({
  emailInput, setEmailInput, password, setPassword, authError, onSignIn,
}: {
  emailInput: string;
  setEmailInput: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  authError: string;
  onSignIn: () => void;
}) {
  const [step, setStep] = useState<'email' | 'password'>('email');
  return (
    <div className="owa-login-bg">
      <div className="owa-login-card">
        <div className="owa-login-mslogo"><MicrosoftLogo /> <span>Microsoft</span></div>
        {step === 'email' ? (
          <>
            <h1>Sign in</h1>
            <p className="owa-login-sub">to continue to Outlook</p>
            <input
              className="owa-login-input"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Email, phone, or Skype"
              onKeyDown={(e) => e.key === 'Enter' && setStep('password')}
            />
            <div className="owa-login-links">
              <span>No account? <a href="#">Create one!</a></span>
              <a href="#">Can&apos;t access your account?</a>
            </div>
            <div className="owa-login-btnrow">
              <button type="button" className="owa-login-back" disabled>Back</button>
              <button type="button" className="owa-login-next" onClick={() => setStep('password')}>Next</button>
            </div>
          </>
        ) : (
          <>
            <div className="owa-login-idrow">‹ {emailInput}</div>
            <h1>Enter password</h1>
            <input
              className="owa-login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && onSignIn()}
            />
            <div className="owa-login-links"><a href="#">Forgot password?</a></div>
            {authError && <div className="owa-login-error">{authError}</div>}
            <div className="owa-login-btnrow">
              <button type="button" className="owa-login-back" onClick={() => setStep('email')}>Back</button>
              <button type="button" className="owa-login-next" onClick={onSignIn}>Sign in</button>
            </div>
          </>
        )}
      </div>
      <div className="owa-login-footer">
        <span>Terms of use</span><span>Privacy &amp; cookies</span><span>· · ·</span>
      </div>
    </div>
  );
}

function AccountDropdown({
  email, fullName, accounts, onSignOut,
}: {
  email: string;
  fullName: string;
  accounts: string[];
  onSignOut: () => void;
}) {
  const secondary = accounts.filter((a) => a !== email);
  return (
    <div className="owa-account-menu" role="menu" aria-label="Account menu">
      <div className="owa-account-top">
        <MicrosoftLogo size={16} />
        <button type="button" className="owa-account-signout" onClick={onSignOut}>Sign out</button>
      </div>
      <div className="owa-account-id">
        <div className="owa-avatar owa-avatar-lg" style={{ background: avatarColor(fullName) }}>{getInitials(fullName).toUpperCase()}</div>
        <div>
          <div className="owa-account-name">{fullName}</div>
          <div className="owa-account-email">{email}</div>
          <button type="button" className="owa-account-link">View account</button>
        </div>
      </div>
      {secondary.length > 0 && (
        <div className="owa-account-others">
          <div className="owa-account-others-title">Other accounts</div>
          {secondary.map((acc) => (
            <button key={acc} type="button" className="owa-account-other">
              <div className="owa-avatar owa-avatar-sm" style={{ background: avatarColor(acc) }}>{acc[0]?.toUpperCase()}</div>
              <span>{acc}</span>
            </button>
          ))}
        </div>
      )}
      <button type="button" className="owa-account-add">+ Sign in with a different account</button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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
  const [accountOpen, setAccountOpen] = useState(false);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [messageTab, setMessageTab] = useState<'focused' | 'other'>('focused');
  const [searchText, setSearchText] = useState('');
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      if (!menuRef.current?.contains(ev.target as Node)) setAccountOpen(false);
    };
    const onEsc = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setAccountOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

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
          setAuthError(ok ? '' : "That Microsoft account doesn't exist. Enter a different account.");
        }}
      />
    );
  }

  const scoped = emails.filter((e) => (e.to + e.from).toLowerCase().includes(activeOutlookEmail.toLowerCase()) || activeOutlookEmail === 'user@workspace.aos');
  const searched = searchText.trim()
    ? scoped.filter((e) => (e.subject + e.from + e.body).toLowerCase().includes(searchText.toLowerCase()))
    : scoped;
  const folderEmails = searched.filter((e) => (folder === 'starred' ? e.starred : e.folder === folder)).sort((a, b) => +new Date(b.date) - +new Date(a.date));
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
    const quotedBody = `\n\n________________________________\nFrom: ${selected.from}\nSent: ${new Date(selected.date).toLocaleString()}\nSubject: ${selected.subject}\n\n`;
    openCompose({ to: replyTo, subject: replySubject, body: quotedBody });
  };

  const openForward = () => {
    if (!selected) return;
    const fwdSubject = selected.subject.startsWith('FW: ') ? selected.subject : `FW: ${selected.subject}`;
    const quotedBody = `\n\n________________________________\nFrom: ${selected.from}\nSent: ${new Date(selected.date).toLocaleString()}\nSubject: ${selected.subject}\n\n`;
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

      // ── I ACCEPT on offer email — provision employer account ────────────────
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
        sendEmail({ ...buildPaperworkEmail(selected.jobMeta, fullName, account.companyEmail, account.outlookPassword), folder: 'inbox' });
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

  const unreadCount = scoped.filter((e) => e.folder === 'inbox' && !e.read).length;

  const senderVisual = (e: Email, size: number) => {
    if (e.jobMeta) return <CompanyLogo company={e.jobMeta.company} size={size} />;
    const name = extractName(e.from);
    return (
      <div className="owa-avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: avatarColor(name) }}>
        {getInitials(name).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="owa-shell">
      {/* ── Suite header ── */}
      <header className="owa-topbar">
        <button type="button" className="owa-waffle" aria-label="App launcher">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#fff"><circle cx="2.5" cy="2.5" r="1.6"/><circle cx="8" cy="2.5" r="1.6"/><circle cx="13.5" cy="2.5" r="1.6"/><circle cx="2.5" cy="8" r="1.6"/><circle cx="8" cy="8" r="1.6"/><circle cx="13.5" cy="8" r="1.6"/><circle cx="2.5" cy="13.5" r="1.6"/><circle cx="8" cy="13.5" r="1.6"/><circle cx="13.5" cy="13.5" r="1.6"/></svg>
        </button>
        <span className="owa-wordmark">Outlook</span>
        <div className="owa-searchwrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#605e5c"><path d="M21.41 18.59l-5.27-5.28A6.83 6.83 0 0 0 17 10a7 7 0 1 0-7 7 6.83 6.83 0 0 0 3.31-.86l5.28 5.27a2 2 0 0 0 2.82-2.82zM5 10a5 5 0 1 1 5 5 5 5 0 0 1-5-5z"/></svg>
          <input placeholder="Search" value={searchText} onChange={(e) => setSearchText(e.target.value)} aria-label="Search mail" />
        </div>
        <div className="owa-topbar-actions" ref={menuRef}>
          <button type="button" title="Settings" className="owa-topbar-ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18"/></svg></button>
          <button type="button" title="Tips" className="owa-topbar-ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.8.6 1.5 1.9 1.5 3.1h4c0-1.2.7-2.5 1.5-3.1A6 6 0 0 0 12 3z"/></svg></button>
          <button type="button" title="Help" className="owa-topbar-ic">?</button>
          <button type="button" className="owa-me" onClick={() => setAccountOpen((v) => !v)} aria-label="Account manager">
            <div className="owa-avatar owa-avatar-me" style={{ background: avatarColor(fullName) }}>{getInitials(fullName).toUpperCase()}</div>
          </button>
          {accountOpen && (
            <AccountDropdown email={activeOutlookEmail} fullName={fullName} accounts={accountEmails} onSignOut={logoutOutlook} />
          )}
        </div>
      </header>

      {/* ── Ribbon ── */}
      <div className="owa-ribbon">
        <div className="owa-ribbon-tabs">
          <button type="button" className="active">Home</button>
          <button type="button">View</button>
          <button type="button">Help</button>
        </div>
        <div className="owa-ribbon-row">
          <button type="button" className="owa-newmail" onClick={() => openCompose()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M20.7 6.3l-3-3a1 1 0 0 0-1.4 0L4 15.6V20h4.4L20.7 7.7a1 1 0 0 0 0-1.4zM7.6 18H6v-1.6l8.3-8.3 1.6 1.6L7.6 18z"/></svg>
            New mail <span className="owa-newmail-caret">▾</span>
          </button>
          <span className="owa-ribbon-sep" />
          <button type="button" className="owa-rbtn" title="Delete"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 7h16M9 7V5h6v2M6.5 7l1 13h9l1-13"/><path d="M10 11v5M14 11v5"/></svg> <span>Delete</span></button>
          <button type="button" className="owa-rbtn" title="Archive"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3.5 4h17v4.5h-17z"/><path d="M5.5 8.5V20h13V8.5M10 12.5h4"/></svg> <span>Archive</span></button>
          <button type="button" className="owa-rbtn" title="Report"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3.5 5 6v5c0 4.5 3 8 7 9.5 4-1.5 7-5 7-9.5V6z"/></svg> <span>Report ▾</span></button>
          <button type="button" className="owa-rbtn" title="Sweep"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m14 4 6 6M13 5l-8 8c-1.5 1.5-2 5-2 5s3.5-.5 5-2l8-8"/></svg> <span>Sweep</span></button>
          <button type="button" className="owa-rbtn" title="Move to"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3.5 6A1.5 1.5 0 0 1 5 4.5h4l2 2.5h8A1.5 1.5 0 0 1 20.5 8.5V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z"/></svg> <span>Move to ▾</span></button>
          <span className="owa-ribbon-sep" />
          <button type="button" className="owa-rbtn" onClick={openReply} title="Reply">↩ <span>Reply</span></button>
          <button type="button" className="owa-rbtn" onClick={openForward} title="Forward">↪ <span>Forward</span></button>
          <span className="owa-ribbon-sep" />
          <button type="button" className="owa-rbtn" title="Read / Unread"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="m4.5 7 7.5 6 7.5-6"/></svg> <span>Read / Unread</span></button>
          <button type="button" className="owa-rbtn" title="Flag"><svg width="14" height="14" viewBox="0 0 24 24" fill="#c50f1f"><path d="M5 3v18h1.8v-7h11.4l-2.6-5.5 2.6-5.5z"/></svg></button>
          <button type="button" className="owa-rbtn" title="Pin"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m9 4 11 11-3 .5L13 19l-2.5-5.5L5 11l3.5-4z"/><path d="m11 13-6 6"/></svg></button>
        </div>
      </div>

      <div className="owa-main">
        {/* ── App rail ── */}
        <nav className="owa-rail">
          <button type="button" className="owa-rail-btn active" title="Mail">{Ic.mail('#0f6cbd')}<span className="owa-rail-dot" /></button>
          <button type="button" className="owa-rail-btn" title="Calendar">{Ic.calendar('#5b5fc7')}</button>
          <button type="button" className="owa-rail-btn" title="People">{Ic.people('#0f6cbd')}</button>
          <button type="button" className="owa-rail-btn" title="To Do">{Ic.todo()}</button>
          <button type="button" className="owa-rail-btn" title="Word">{Ic.word()}</button>
          <button type="button" className="owa-rail-btn" title="Excel">{Ic.excel()}</button>
          <button type="button" className="owa-rail-btn" title="PowerPoint">{Ic.ppt()}</button>
          <button type="button" className="owa-rail-btn" title="More apps">⋯</button>
        </nav>

        {/* ── Folder pane ── */}
        <aside className="owa-folders">
          <div className="owa-folders-section">
            <button type="button" className="owa-folders-group">▾ Favorites</button>
            {(['inbox', 'sent', 'drafts'] as EmailFolder[]).map((k) => (
              <button
                key={`fav-${k}`}
                className={`owa-folder ${folder === k ? 'active' : ''}`}
                type="button"
                onClick={() => setFolder(k)}
              >
                <span className="owa-folder-label">{FOLDER_LABELS[k]}</span>
                {k === 'inbox' && unreadCount > 0 && <span className="owa-folder-count">{unreadCount}</span>}
              </button>
            ))}
          </div>
          <div className="owa-folders-section">
            <button type="button" className="owa-folders-group">▾ {activeOutlookEmail}</button>
            {(Object.entries(FOLDER_LABELS) as [EmailFolder, string][]).map(([k, v]) => (
              <button
                key={k}
                className={`owa-folder ${folder === k ? 'active' : ''}`}
                type="button"
                onClick={() => setFolder(k)}
              >
                <span className="owa-folder-label">{v}</span>
                {k === 'inbox' && unreadCount > 0 && <span className="owa-folder-count">{unreadCount}</span>}
              </button>
            ))}
            <button type="button" className="owa-folder"><span className="owa-folder-label">Junk Email</span></button>
            <button type="button" className="owa-folder"><span className="owa-folder-label">Archive</span></button>
            <button type="button" className="owa-folder"><span className="owa-folder-label">Notes</span></button>
          </div>
        </aside>

        {/* ── Message list ── */}
        <section className="owa-list">
          <div className="owa-list-head">
            {folder === 'inbox' ? (
              <div className="owa-pivots">
                <button type="button" className={messageTab === 'focused' ? 'active' : ''} onClick={() => setMessageTab('focused')}>Focused</button>
                <button type="button" className={messageTab === 'other' ? 'active' : ''} onClick={() => setMessageTab('other')}>Other</button>
              </div>
            ) : (
              <div className="owa-list-title">{FOLDER_LABELS[folder]}</div>
            )}
            <button type="button" className="owa-list-filter">≡ Filter</button>
          </div>
          <div className="owa-list-items">
            {folderEmails.length === 0 && (
              <div className="owa-list-empty">
                <div className="owa-list-empty-art"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="m4.5 7 7.5 6 7.5-6"/></svg></div>
                <strong>All done for the day</strong>
                <span>Enjoy your empty {FOLDER_LABELS[folder].toLowerCase()}.</span>
              </div>
            )}
            {folderEmails.map((e) => (
              <button
                key={e.id}
                type="button"
                className={`owa-row ${selected?.id === e.id ? 'selected' : ''} ${!e.read ? 'unread' : ''}`}
                onClick={() => { setSelectedId(e.id); markRead(e.id); }}
              >
                <span className="owa-row-selbar" />
                {senderVisual(e, 32)}
                <div className="owa-row-content">
                  <div className="owa-row-top">
                    <span className="owa-row-from">{extractName(e.from)}</span>
                    <span className="owa-row-date">{formatDate(e.date)}</span>
                  </div>
                  <div className="owa-row-subject">{e.subject}</div>
                  <div className="owa-row-preview">{e.body.replace(/<[^>]+>/g, '').slice(0, 90)}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Reading pane ── */}
        <main className="owa-reading">
          {selected ? (
            <>
              <div className="owa-reading-subjectrow">
                <h1>{selected.subject}</h1>
                <div className="owa-reading-subjectactions">
                  <button type="button" title="Summarize"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5 14 9l6.5 2L14 13l-2 6.5L10 13 3.5 11 10 9z"/></svg> Summary by Copilot</button>
                </div>
              </div>
              <div className="owa-reading-card">
                <div className="owa-reading-meta">
                  {senderVisual(selected, 40)}
                  <div className="owa-reading-names">
                    <div className="owa-reading-from">
                      <strong>{extractName(selected.from)}</strong>
                      <span className="owa-reading-addr">&lt;{extractEmail(selected.from)}&gt;</span>
                    </div>
                    <div className="owa-reading-to">To: {selected.to === 'user@workspace.aos' ? 'You' : selected.to}</div>
                  </div>
                  <div className="owa-reading-right">
                    <span className="owa-reading-date">{new Date(selected.date).toLocaleString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                    <div className="owa-reading-quick">
                      <button type="button" title="Reply" onClick={openReply}>↩</button>
                      <button type="button" title="Reply all" onClick={() => openCompose({ to: extractEmail(selected.from), subject: selected.subject.startsWith('RE:') ? selected.subject : `RE: ${selected.subject}` })}>↩↩</button>
                      <button type="button" title="Forward" onClick={openForward}>↪</button>
                      <button type="button" title="More actions">⋯</button>
                    </div>
                  </div>
                </div>
                {selected.jobMeta && (
                  <div className="owa-jobbrand">
                    <CompanyLogo company={selected.jobMeta.company} size={44} />
                    <div className="owa-jobbrand-text">
                      <strong>{selected.jobMeta.company}</strong>
                      <span>{selected.jobMeta.role} · {selected.jobMeta.location}</span>
                    </div>
                    <span className={`owa-jobbrand-stage stage-${selected.jobMeta.stage}`}>{selected.jobMeta.stage.replace('-', ' ')}</span>
                  </div>
                )}
                <article className="owa-reading-body" dangerouslySetInnerHTML={{ __html: selected.body }} />
                <div className="owa-reading-replyrow">
                  <button type="button" onClick={openReply}>↩ Reply</button>
                  <button type="button" onClick={openForward}>↪ Forward</button>
                </div>
              </div>
            </>
          ) : (
            <div className="owa-reading-empty">
              <div className="owa-reading-empty-art"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="m4.5 7 7.5 6 7.5-6"/></svg></div>
              <p>Select an item to read</p>
            </div>
          )}
        </main>
      </div>

      {/* ── Compose ── */}
      {composeOpen && (
        <div className="owa-compose-overlay">
          <div className="owa-compose">
            <div className="owa-compose-titlebar">
              <span>{subject || 'New message'}</span>
              <div>
                <button type="button" title="Minimize">—</button>
                <button type="button" title="Close" onClick={() => setComposeOpen(false)}>✕</button>
              </div>
            </div>
            <div className="owa-compose-field">
              <button type="button" className="owa-compose-tobtn">To</button>
              <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="" aria-label="To" />
              <span className="owa-compose-ccbcc">Cc &nbsp; Bcc</span>
            </div>
            <div className="owa-compose-field">
              <input className="owa-compose-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Add a subject" aria-label="Subject" />
            </div>
            <textarea className="owa-compose-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="" aria-label="Message body" />
            <div className="owa-compose-toolbar">
              <button type="button" className="owa-compose-send" onClick={send}>Send <span>▾</span></button>
              <span className="owa-compose-tools"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m20 12-7.6 7.6a5 5 0 0 1-7-7L13 5a3.5 3.5 0 0 1 5 5l-7.6 7.6a2 2 0 0 1-2.9-2.9L14 8.2"/></svg> &nbsp; <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3.5" y="5" width="17" height="14" rx="1.5"/><circle cx="8.5" cy="10" r="1.5"/><path d="m5 18 5-5 3 3 3.5-3.5 3 3"/></svg> &nbsp; <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="8.5"/><path d="M8.8 14a4 4 0 0 0 6.4 0M9.3 9.8h.02M14.7 9.8h.02"/></svg> &nbsp; <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 20h4L20 8l-4-4L4 16z"/><path d="m14 6 4 4"/></svg> &nbsp; ⋯</span>
              <button type="button" className="owa-compose-discard" onClick={() => setComposeOpen(false)} title="Discard"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 7h16M9 7V5h6v2M6.5 7l1 13h9l1-13"/><path d="M10 11v5M14 11v5"/></svg></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
