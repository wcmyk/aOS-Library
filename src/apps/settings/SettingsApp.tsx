import { useState } from 'react';
import { useProfileStore } from '../../state/useProfileStore';
import { useMailStore, type JobMeta } from '../../state/useMailStore';
import { useDevStore, AI_PLANS, CLAUDE_PLANS, type AiService } from '../../state/useDevStore';
import { useCompanyStore } from '../../state/useCompanyStore';
import { REAL_COMPANIES } from '../../data/companies';
import { CompanyLogo, ClaudeSpark, ChatGptKnot, GeminiSpark } from '../../data/brands';
import { personPhoto } from '../../data/people';
import './settings.css';

// macOS System Settings replica: dark translucent sidebar with colored icon
// rows, search, Apple Account header, and grouped content panes. Functional
// panes: Apple Account (identity), General > About, Subscriptions, Developer.

type Pane =
  | 'account' | 'wifi' | 'bluetooth' | 'network' | 'vpn' | 'battery'
  | 'general' | 'accessibility' | 'appearance' | 'siri' | 'controlcenter'
  | 'desktop' | 'displays' | 'screensaver' | 'subscriptions' | 'developer' | 'about';

const DEV_ROLES: Array<[string, string, number]> = [
  ['Software Engineer', 'swe', 165000],
  ['Senior Software Engineer', 'swe', 210000],
  ['ML Engineer', 'aiml', 195000],
  ['Strategy Consultant', 'consulting', 125000],
  ['Business Analyst', 'consulting', 98000],
  ['Data Analyst', 'analyst', 95000],
  ['Financial Analyst', 'financebiz', 92000],
  ['Quantitative Analyst', 'quant', 180000],
];

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

function SideIcon({ bg, children }: { bg: string; children: React.ReactNode }) {
  return <span className="mst-sideicon" style={{ background: bg }}>{children}</span>;
}

const IC = {
  wifi: <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M12 18.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM12 13c-2.5 0-4.8 1-6.4 2.6l2 2A6.5 6.5 0 0 1 12 15.9c1.7 0 3.3.7 4.4 1.8l2-2A9 9 0 0 0 12 13zm0-5.5c-3.9 0-7.5 1.6-10 4.1l2 2a11 11 0 0 1 16 0l2-2c-2.5-2.5-6.1-4.1-10-4.1z"/></svg>,
  bt: <svg width="12" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M11 2l7 5.5-5 4.5 5 4.5L11 22v-7.5L6.5 18 5 16.5 9.8 12 5 7.5 6.5 6 11 9.5V2zm2 4.5v3.4l2.2-2L13 6.5zm0 7.6v3.4l2.2-1.4-2.2-2z"/></svg>,
  globe: <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7.9 9h-3.4a15.6 15.6 0 0 0-1.2-5.7A8 8 0 0 1 19.9 11zM12 4c.9 1.2 2 3.6 2.3 7H9.7C10 7.6 11.1 5.2 12 4zM4.1 13h3.4c.1 2.1.5 4 1.2 5.7A8 8 0 0 1 4.1 13zm3.4-2H4.1a8 8 0 0 1 4.6-5.7A15.6 15.6 0 0 0 7.5 11zm4.5 9c-.9-1.2-2-3.6-2.3-7h4.6c-.3 3.4-1.4 5.8-2.3 7zm3.3-1.3a15.6 15.6 0 0 0 1.2-5.7h3.4a8 8 0 0 1-4.6 5.7z"/></svg>,
  battery: <svg width="14" height="10" viewBox="0 0 28 14" fill="none"><rect x="1" y="1" width="22" height="12" rx="3" stroke="#fff" strokeWidth="2"/><rect x="4" y="4" width="13" height="6" rx="1" fill="#fff"/><path d="M25 5v4a2.5 2.5 0 0 0 0-4z" fill="#fff"/></svg>,
  gear: <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M19.4 13a7.5 7.5 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3.5h-4l-.3 2.5a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.5 7.5 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 1.7 1l.3 2.5h4l.3-2.5a7.4 7.4 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6zM13 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" transform="translate(-1 -1)"/></svg>,
  access: <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="5" r="2.4"/><path d="M4 8.5l6 1.2v4.1l-2.4 6.3 1.9.8L12 15h0l2.5 5.9 1.9-.8L14 13.8V9.7l6-1.2-.4-1.9L12 8 4.4 6.6z"/></svg>,
  paint: <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0 0 20 2 2 0 0 0 2-2 2 2 0 0 0-.5-1.3 1.9 1.9 0 0 1 1.4-3.2H17a5 5 0 0 0 5-5C22 5.8 17.5 2 12 2zM6.5 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>,
  spark: <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2 6.5L20.5 10 14 12l-2 6.5L10 12 3.5 10 10 8.5z"/></svg>,
  toggles: <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><rect x="3" y="5" width="18" height="5" rx="2.5" opacity="0.55"/><circle cx="7" cy="7.5" r="2.5"/><rect x="3" y="14" width="18" height="5" rx="2.5" opacity="0.55"/><circle cx="17" cy="16.5" r="2.5"/></svg>,
  dock: <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><rect x="3" y="4" width="18" height="12" rx="2" stroke="#fff" strokeWidth="2" fill="none"/><rect x="6" y="18" width="12" height="2.6" rx="1.3"/></svg>,
  display: <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><rect x="2.5" y="4" width="19" height="13" rx="2.5" stroke="#fff" strokeWidth="2" fill="none"/><path d="M9 20.5h6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>,
  stars: <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M6 2l1 3 3 1-3 1-1 3-1-3-3-1 3-1zM16 8l1.4 4.1L21.5 14l-4.1 1.9L16 20l-1.4-4.1L10.5 14l4.1-1.9z"/></svg>,
  card: <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><rect x="2" y="5" width="20" height="14" rx="2.5"/><rect x="2" y="8.6" width="20" height="2.8" fill="rgba(0,0,0,0.35)"/></svg>,
  wrench: <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M21.6 5.5a5.5 5.5 0 0 1-7.4 6.7L7 19.4a2.1 2.1 0 0 1-3-3l7.2-7.2a5.5 5.5 0 0 1 6.7-7.4L14.6 5l.9 3.5 3.5.9z"/></svg>,
};

const SIDEBAR: Array<{ id: Pane; label: string; bg: string; icon: React.ReactNode; group: number }> = [
  { id: 'wifi', label: 'Wi-Fi', bg: '#2d7ff9', icon: IC.wifi, group: 1 },
  { id: 'bluetooth', label: 'Bluetooth', bg: '#2d7ff9', icon: IC.bt, group: 1 },
  { id: 'network', label: 'Network', bg: '#2d7ff9', icon: IC.globe, group: 1 },
  { id: 'vpn', label: 'VPN', bg: '#5856d6', icon: IC.globe, group: 1 },
  { id: 'battery', label: 'Battery', bg: '#65c466', icon: IC.battery, group: 1 },
  { id: 'general', label: 'General', bg: '#8e8e93', icon: IC.gear, group: 2 },
  { id: 'accessibility', label: 'Accessibility', bg: '#2d7ff9', icon: IC.access, group: 2 },
  { id: 'appearance', label: 'Appearance', bg: '#1c1c1e', icon: IC.paint, group: 2 },
  { id: 'siri', label: 'Apple Intelligence & Siri', bg: '#a862ea', icon: IC.spark, group: 2 },
  { id: 'controlcenter', label: 'Control Center', bg: '#8e8e93', icon: IC.toggles, group: 2 },
  { id: 'desktop', label: 'Desktop & Dock', bg: '#1c72e8', icon: IC.dock, group: 2 },
  { id: 'displays', label: 'Displays', bg: '#2d7ff9', icon: IC.display, group: 2 },
  { id: 'screensaver', label: 'Screen Saver', bg: '#30b0c7', icon: IC.stars, group: 2 },
  { id: 'subscriptions', label: 'Subscriptions', bg: '#f0574f', icon: IC.card, group: 3 },
  { id: 'developer', label: 'Developer', bg: '#5e5ce6', icon: IC.wrench, group: 3 },
];

function Row({ label, value, onClick, first, last }: { label: string; value?: string; onClick?: () => void; first?: boolean; last?: boolean }) {
  return (
    <button type="button" className={`mst-row ${first ? 'first' : ''} ${last ? 'last' : ''}`} onClick={onClick}>
      <span>{label}</span>
      <span className="mst-row-right">{value && <span className="mst-row-value">{value}</span>}<span className="mst-chev">›</span></span>
    </button>
  );
}

export function SettingsApp() {
  const profile = useProfileStore();
  const sendEmail = useMailStore((s) => s.sendEmail);
  const { cashAdjustment, setCashAdjustment, addCash, subscriptions, subscribe, cancelSubscription, noteDevOffer, devOffersGranted } = useDevStore();
  const [pane, setPane] = useState<Pane>('general');
  const [search, setSearch] = useState('');
  const [cashInput, setCashInput] = useState('');
  const [offerCompany, setOfferCompany] = useState(REAL_COMPANIES.find((c) => c.name === 'Google')?.name ?? REAL_COMPANIES[0].name);
  const [offerRoleIx, setOfferRoleIx] = useState(0);
  const [offerType, setOfferType] = useState<'Full-time' | 'Contract'>('Full-time');
  const [offerNote, setOfferNote] = useState('');
  const employerAccounts = useCompanyStore((s) => s.employerAccounts);
  const applyPromotionCommand = useCompanyStore((s) => s.applyPromotionCommand);
  const promotable = employerAccounts.filter((a) => a.employmentStatus === 'active' || a.employmentStatus === 'onboarding');
  const [promoAccountId, setPromoAccountId] = useState('');
  const [promoSteps, setPromoSteps] = useState(1);
  const [promoNote, setPromoNote] = useState('');

  const endEmployment = useCompanyStore((s) => s.endEmployment);

  const terminate = () => {
    const acc = promotable.find((a) => a.id === promoAccountId) ?? promotable[0];
    if (!acc) return;
    const ended = endEmployment(acc.id);
    if (!ended) return;
    const finalPay = Math.round((acc.compensation / 26) * 100) / 100;
    sendEmail({
      from: `People Operations <hr@${acc.domain}>`,
      to: 'user@workspace.aos',
      subject: `Notice of separation — ${acc.companyName}`,
      date: new Date().toISOString(),
      folder: 'inbox',
      body: `<p>This letter confirms that your employment with <strong>${acc.companyName}</strong> as ${acc.title} ends effective today.</p><ul><li><strong>Final paycheck:</strong> $${finalPay.toLocaleString(undefined, { minimumFractionDigits: 2 })} (current pay period), paid on the normal payroll date, including accrued unused PTO where required by state law.</li><li><strong>Benefits:</strong> Medical, dental, and vision coverage continue through the end of the month. A COBRA continuation-of-coverage election notice will arrive by mail within 14 days.</li><li><strong>Equipment:</strong> Return your badge and laptop within 5 business days using the prepaid label.</li><li><strong>Systems:</strong> Access to ${acc.companyName} email, Teams, and Workday self-service is now read-only for payroll and tax documents.</li></ul><p>You may be eligible for state unemployment insurance; you can file as early as your first day of unemployment.</p><p>We wish you the best going forward.</p><p>People Operations, ${acc.companyName}</p>`,
    });
    setPromoNote(`${acc.companyName}: employment ended. Separation notice sent to your personal inbox; payroll deposits stop after the final check.`);
  };

  const grantPromotion = () => {
    const acc = promotable.find((a) => a.id === promoAccountId) ?? promotable[0];
    if (!acc) return;
    const promo = applyPromotionCommand(acc.companyEmail, promoSteps, 'developer-panel');
    if (!promo) {
      setPromoNote(`${acc.companyName}: already at the top of the ladder — no promotion applied.`);
      return;
    }
    sendEmail({
      from: `People Operations <hr@${acc.domain}>`,
      to: acc.companyEmail,
      subject: `Promotion confirmed — ${promo.toTitle}`,
      date: new Date().toISOString(),
      folder: 'inbox',
      body: `<p>Congratulations! Following your performance review, your title has been updated from <strong>${promo.fromTitle}</strong> to <strong>${promo.toTitle}</strong>.</p><p>Your new base salary is <strong>$${promo.toComp.toLocaleString()}</strong>/year, effective immediately. This change is reflected in Workday and your next payroll cycle.</p><p>Best regards,<br><strong>People Operations</strong><br>${acc.companyName}</p>`,
    });
    setPromoNote(`${acc.companyName}: ${promo.fromTitle} → ${promo.toTitle}, now $${promo.toComp.toLocaleString()}/year. HR confirmation sent to ${acc.companyEmail}.`);
  };

  const grantOffer = () => {
    const company = REAL_COMPANIES.find((c) => c.name === offerCompany) ?? REAL_COMPANIES[0];
    const [role, category, comp] = DEV_ROLES[offerRoleIx];
    const h = strHash(company.name + role);
    const managerName = ['Elena Vasquez', 'Marcus Thornton', 'Priya Hartwell', 'Darius Chen'][h % 4];
    const recruiter = ['Naomi Calloway', 'Rafael Iyer', 'Ingrid Voss', 'Omar Mensah'][(h >> 3) % 4];
    const first = profile.fullName.toLowerCase().split(' ')[0];
    const last = profile.fullName.toLowerCase().split(' ').slice(-1)[0];
    const meta: JobMeta = {
      jobId: `dev-offer-${Date.now()}`,
      company: company.name, role, domain: company.domain, recruiter,
      salary: `$${Math.round(comp / 1000)}K`, category, stage: 'offer',
      meetingTool: company.meetingTool,
      meetingLink: `https://meet.google.com/dev-${h.toString(36).slice(0, 8)}`,
      managerName, compensation: comp, location: company.location, employmentType: offerType,
    };
    sendEmail({
      from: `${managerName} — ${company.name} <${managerName.toLowerCase().replace(' ', '.')}@${company.domain}>`,
      to: profile.preferredEmail,
      subject: `Offer of Employment — ${role} at ${company.name}`,
      date: new Date().toISOString(),
      folder: 'inbox',
      body: `<p>Dear ${profile.fullName.split(' ')[0]},</p><p>On behalf of <strong>${company.name}</strong>, it is my pleasure to extend this formal offer for the position of <strong>${role}</strong> (${offerType}), based in <strong>${company.location}</strong>.</p><ul><li><strong>${offerType === 'Contract' ? 'Contract Rate' : 'Base Salary'}:</strong> $${comp.toLocaleString()} per year${offerType === 'Contract' ? ' equivalent, invoiced biweekly' : ', paid biweekly'}</li><li><strong>Benefits:</strong> ${offerType === 'Contract' ? 'Not applicable to contractor engagements' : 'Full medical, dental, vision; 401(k) with employer match; flexible PTO'}</li></ul><div style="background:#f0f6ff;border:1px solid #cfe0f5;border-radius:8px;padding:14px;margin:12px 0"><p style="margin:0 0 6px;font-weight:600">Your ${company.name} account credentials (active upon acceptance)</p><table style="font-size:13px;border-collapse:collapse"><tr><td style="padding:2px 14px 2px 0;color:#555">Company email / Teams sign-in</td><td><strong>${first}.${last}@${company.domain}</strong></td></tr><tr><td style="padding:2px 14px 2px 0;color:#555">Temporary password</td><td><strong>Welcome@123</strong></td></tr><tr><td style="padding:2px 14px 2px 0;color:#555">Workday tenant</td><td><strong>workday.${company.domain}</strong></td></tr><tr><td style="padding:2px 14px 2px 0;color:#555">Microsoft Teams</td><td><strong>${company.name} tenant only</strong></td></tr></table></div><p>To accept this offer, reply with the words <strong>"I Accept"</strong> — your onboarding packet (${offerType === 'Contract' ? 'Form W-9 and 1099-NEC information' : 'Form I-9, W-4, and direct deposit enrollment'}) will follow immediately.</p><br><p>Sincerely,<br><strong>${managerName}</strong><br>${company.name}</p>`,
      jobMeta: meta,
    });
    noteDevOffer();
    setOfferNote(`Offer from ${company.name} (${role}, ${offerType}) delivered to your inbox. Reply "I Accept" to provision employment.`);
  };

  const aiIcon = (svc: AiService) =>
    svc === 'claude' ? <ClaudeSpark size={24} /> : svc === 'chatgpt' ? <ChatGptKnot size={24} /> : <GeminiSpark size={24} />;

  const filteredSidebar = SIDEBAR.filter((r) => !search.trim() || r.label.toLowerCase().includes(search.toLowerCase()));

  const paneMeta = SIDEBAR.find((r) => r.id === pane);

  return (
    <div className="mst-shell">
      {/* Sidebar */}
      <aside className="mst-sidebar">
        <div className="mst-searchwrap">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(255,255,255,0.45)"><path d="M21.41 18.59l-5.27-5.28A6.83 6.83 0 0 0 17 10a7 7 0 1 0-7 7 6.83 6.83 0 0 0 3.31-.86l5.28 5.27a2 2 0 0 0 2.82-2.82zM5 10a5 5 0 1 1 5 5 5 5 0 0 1-5-5z"/></svg>
          <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button type="button" className={`mst-account ${pane === 'account' ? 'active' : ''}`} onClick={() => setPane('account')}>
          <img src={personPhoto(profile.fullName)} alt="" />
          <div>
            <div className="mst-account-name">{profile.fullName}</div>
            <div className="mst-account-sub">Apple Account</div>
          </div>
        </button>
        {[1, 2, 3].map((group) => (
          <div key={group} className="mst-sidegroup">
            {filteredSidebar.filter((r) => r.group === group).map((r) => (
              <button key={r.id} type="button" className={`mst-siderow ${pane === r.id ? 'active' : ''}`} onClick={() => setPane(r.id)}>
                <SideIcon bg={r.bg}>{r.icon}</SideIcon>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Content */}
      <main className="mst-content">
        <div className="mst-navchev">
          <span>‹</span><span>›</span>
        </div>

        {pane === 'general' && (
          <>
            <div className="mst-hero">
              <span className="mst-hero-icon" style={{ background: '#8e8e93' }}>{IC.gear}</span>
              <h1>General</h1>
              <p>Manage your overall setup and preferences for aOS, such as software updates, device language, AirDrop, and more.</p>
            </div>
            <div className="mst-group">
              <Row first label="About" onClick={() => setPane('about')} />
              <Row label="Software Update" value="aOS 1.4" />
              <Row last label="Storage" value="128 GB available" />
            </div>
            <div className="mst-group">
              <Row first last label="AppleCare & Warranty" />
            </div>
            <div className="mst-group">
              <Row first last label="AirDrop & Handoff" />
            </div>
            <div className="mst-group">
              <Row first label="AutoFill & Passwords" />
              <Row label="Date & Time" value={new Date().toLocaleDateString('en-US', { timeZoneName: 'short' }).split(', ').pop()} />
              <Row label="Language & Region" value="English (US)" />
              <Row last label="Login Items & Extensions" />
            </div>
          </>
        )}

        {pane === 'about' && (
          <>
            <div className="mst-hero">
              <span className="mst-hero-icon" style={{ background: '#8e8e93' }}>{IC.gear}</span>
              <h1>About</h1>
              <p>Your workspace identity. These details flow to LinkedIn, Workday, payroll paperwork, and email.</p>
            </div>
            <div className="mst-group mst-form">
              <label>Full name<input value={profile.fullName} onChange={(e) => profile.setProfile({ fullName: e.target.value })} /></label>
              <label>Primary email<input value={profile.preferredEmail} onChange={(e) => profile.setProfile({ preferredEmail: e.target.value })} /></label>
              <label>Headline<input value={profile.roleHeadline} onChange={(e) => profile.setProfile({ roleHeadline: e.target.value })} /></label>
              <label>Location<input value={profile.location} onChange={(e) => profile.setProfile({ location: e.target.value })} /></label>
              <label>Job title<input value={profile.jobTitle} onChange={(e) => profile.setProfile({ jobTitle: e.target.value })} /></label>
              <label>Department<input value={profile.department} onChange={(e) => profile.setProfile({ department: e.target.value })} /></label>
            </div>
            <div className="mst-group">
              <Row first label="aOS Version" value="1.4 (Build 26G210)" />
              <Row label="Chip" value="aOS Silicon M4" />
              <Row last label="Serial Number" value="C02XR4AOSLAB" />
            </div>
          </>
        )}

        {pane === 'account' && (
          <>
            <div className="mst-hero mst-hero-account">
              <img className="mst-hero-photo" src={personPhoto(profile.fullName)} alt="" />
              <h1>{profile.fullName}</h1>
              <p>{profile.preferredEmail}</p>
            </div>
            <div className="mst-group">
              <Row first label="Personal Information" onClick={() => setPane('about')} />
              <Row label="Sign-In & Security" value="Two-factor on" />
              <Row last label="Payment & Shipping" value="Chase ····1666" />
            </div>
            <div className="mst-group">
              <Row first label="iCloud" value="128 GB" />
              <Row label="Media & Purchases" />
              <Row last label="Subscriptions" onClick={() => setPane('subscriptions')} />
            </div>
          </>
        )}

        {pane === 'subscriptions' && (
          <>
            <div className="mst-hero">
              <span className="mst-hero-icon" style={{ background: '#f0574f' }}>{IC.card}</span>
              <h1>Subscriptions</h1>
              <p>Billed monthly to Chase Total Checking ····1666. Each subscription unlocks that assistant's site in Safari.</p>
            </div>
            <div className="mst-group">
              {(Object.keys(AI_PLANS) as AiService[]).map((svc, i, arr) => {
                const sub = subscriptions[svc];
                const claudePlan = svc === 'claude' && sub.active && sub.plan ? CLAUDE_PLANS[sub.plan] : null;
                const name = claudePlan ? claudePlan.label : AI_PLANS[svc].plan;
                const monthly = claudePlan
                  ? (sub.plan === 'team' ? CLAUDE_PLANS.team.monthly * 5 : claudePlan.monthly)
                  : AI_PLANS[svc].monthly;
                const priceLabel = claudePlan && sub.plan === 'enterprise'
                  ? 'Provided by your employer'
                  : `$${monthly.toFixed(2)}/month`;
                return (
                  <div key={svc} className={`mst-subrow ${i === 0 ? 'first' : ''} ${i === arr.length - 1 ? 'last' : ''}`}>
                    {aiIcon(svc)}
                    <div className="mst-subrow-body">
                      <div className="mst-subrow-name">{name}</div>
                      <div className="mst-subrow-sub">{priceLabel}{sub.active && sub.since ? ` · renewed since ${new Date(sub.since).toLocaleDateString()}` : ' · not subscribed'}</div>
                      {svc === 'claude' && !sub.active && (
                        <div className="mst-plan-picker">
                          {(['pro', 'max', 'team'] as const).map((pl) => (
                            <button key={pl} type="button" className="mst-plan-chip" onClick={() => subscribe('claude', pl)}>
                              {CLAUDE_PLANS[pl].label.replace('Claude ', '')} · ${CLAUDE_PLANS[pl].monthly}{CLAUDE_PLANS[pl].perSeat ? '/seat' : ''}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {sub.active ? (
                      <button type="button" className="mst-btn-plain" onClick={() => cancelSubscription(svc)}>Cancel</button>
                    ) : (
                      <button type="button" className="mst-btn-blue" onClick={() => subscribe(svc)}>Subscribe</button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {pane === 'developer' && (
          <>
            <div className="mst-hero">
              <span className="mst-hero-icon" style={{ background: '#5e5ce6' }}>{IC.wrench}</span>
              <h1>Developer</h1>
              <p>Simulation controls for facilitators: adjust cash, grant instant job offers, and grant promotions.</p>
            </div>
            <div className="mst-group mst-form">
              <div className="mst-form-title">Cash controls — current adjustment ${cashAdjustment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="mst-inline">
                <input placeholder="Set exact adjustment ($)" value={cashInput} onChange={(e) => setCashInput(e.target.value)} />
                <button type="button" className="mst-btn-blue" onClick={() => { const v = parseFloat(cashInput); if (!Number.isNaN(v)) setCashAdjustment(v); }}>Set</button>
                {[100, 1000, 10000].map((amt) => (
                  <button key={amt} type="button" className="mst-btn-plain" onClick={() => { addCash(amt); setCashInput(''); }}>+${amt.toLocaleString()}</button>
                ))}
                <button type="button" className="mst-btn-danger" onClick={() => { setCashAdjustment(0); setCashInput(''); }}>Reset</button>
              </div>
            </div>
            <div className="mst-group mst-form">
              <div className="mst-form-title">Grant job offer {devOffersGranted > 0 && `(${devOffersGranted} granted)`}</div>
              <div className="mst-inline">
                <CompanyLogo company={offerCompany} size={36} />
                <select value={offerCompany} onChange={(e) => setOfferCompany(e.target.value)}>
                  {REAL_COMPANIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <select value={offerRoleIx} onChange={(e) => setOfferRoleIx(Number(e.target.value))}>
                  {DEV_ROLES.map(([r, , comp], i) => <option key={r} value={i}>{r} — ${Math.round(comp / 1000)}K</option>)}
                </select>
                <select value={offerType} onChange={(e) => setOfferType(e.target.value as 'Full-time' | 'Contract')}>
                  <option value="Full-time">Full-time (W-2)</option>
                  <option value="Contract">Contract (1099)</option>
                </select>
                <button type="button" className="mst-btn-green" onClick={grantOffer}>Send Offer</button>
              </div>
              {offerNote && <div className="mst-note-ok">{offerNote}</div>}
            </div>
            <div className="mst-group mst-form">
              <div className="mst-form-title">Grant promotion</div>
              {promotable.length === 0 ? (
                <div className="mst-note-muted">No active employment. Grant and accept a job offer first, then promotions become available here.</div>
              ) : (
                <div className="mst-inline">
                  <CompanyLogo company={(promotable.find((a) => a.id === promoAccountId) ?? promotable[0]).companyName} size={36} />
                  <select value={promoAccountId || promotable[0].id} onChange={(e) => setPromoAccountId(e.target.value)}>
                    {promotable.map((a) => <option key={a.id} value={a.id}>{a.companyName} — {a.title}</option>)}
                  </select>
                  <select value={promoSteps} onChange={(e) => setPromoSteps(Number(e.target.value))}>
                    <option value={1}>1 level up</option>
                    <option value={2}>2 levels up</option>
                    <option value={3}>3 levels up</option>
                  </select>
                  <button type="button" className="mst-btn-green" onClick={grantPromotion}>Promote</button>
                  <button type="button" className="mst-btn-danger" onClick={terminate}>End employment</button>
                </div>
              )}
              {promoNote && <div className="mst-note-ok">{promoNote}</div>}
            </div>
          </>
        )}

        {pane === 'wifi' && (
          <>
            <div className="mst-hero"><span className="mst-hero-icon" style={{ background: '#2d7ff9' }}>{IC.wifi}</span><h1>Wi-Fi</h1><p>Connected to aOS-Workspace-5G.</p></div>
            <div className="mst-group">
              <Row first label="aOS-Workspace-5G" value="Connected" />
              <Row label="aOS-Guest" />
              <Row last label="Other Networks" />
            </div>
          </>
        )}
        {pane === 'battery' && (
          <>
            <div className="mst-hero"><span className="mst-hero-icon" style={{ background: '#65c466' }}>{IC.battery}</span><h1>Battery</h1><p>Battery Health: Normal. Last charged to 100% today.</p></div>
            <div className="mst-group">
              <Row first label="Battery Level" value="87%" />
              <Row label="Low Power Mode" value="Off" />
              <Row last label="Battery Health" value="Normal" />
            </div>
          </>
        )}
        {(pane === 'bluetooth' || pane === 'network' || pane === 'vpn' || pane === 'accessibility' || pane === 'appearance' || pane === 'siri' || pane === 'controlcenter' || pane === 'desktop' || pane === 'displays' || pane === 'screensaver') && (
          <>
            <div className="mst-hero">
              <span className="mst-hero-icon" style={{ background: paneMeta?.bg ?? '#8e8e93' }}>{paneMeta?.icon}</span>
              <h1>{paneMeta?.label}</h1>
              <p>Settings for {paneMeta?.label} are managed by your organization in this simulation.</p>
            </div>
            <div className="mst-group">
              <Row first label={`${paneMeta?.label} status`} value={pane === 'bluetooth' ? 'On' : 'Default'} />
              <Row last label="Advanced" />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
