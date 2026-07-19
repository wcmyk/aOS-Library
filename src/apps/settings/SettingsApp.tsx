import { useState } from 'react';
import { useProfileStore } from '../../state/useProfileStore';
import { useMailStore, type JobMeta } from '../../state/useMailStore';
import { useDevStore, AI_PLANS, type AiService } from '../../state/useDevStore';
import { REAL_COMPANIES } from '../../data/companies';
import { CompanyLogo, ClaudeSpark, ChatGptKnot, GeminiSpark } from '../../data/brands';

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

export function SettingsApp() {
  const {
    fullName, preferredEmail, icloudEmail, roleHeadline, location,
    workdayRole, isPeopleManager, jobTitle, department, setProfile,
  } = useProfileStore();
  const sendEmail = useMailStore((s) => s.sendEmail);
  const { cashAdjustment, setCashAdjustment, addCash, subscriptions, subscribe, cancelSubscription, noteDevOffer, devOffersGranted } = useDevStore();
  const [tab, setTab] = useState<'general' | 'subscriptions' | 'developer'>('general');
  const [cashInput, setCashInput] = useState(String(cashAdjustment || ''));
  const [offerCompany, setOfferCompany] = useState(REAL_COMPANIES[2]?.name ?? 'Google');
  const [offerRoleIx, setOfferRoleIx] = useState(0);
  const [offerNote, setOfferNote] = useState('');

  const grantOffer = () => {
    const company = REAL_COMPANIES.find((c) => c.name === offerCompany) ?? REAL_COMPANIES[0];
    const [role, category, comp] = DEV_ROLES[offerRoleIx];
    const h = strHash(company.name + role);
    const managerName = ['Elena Vasquez', 'Marcus Thornton', 'Priya Hartwell', 'Darius Chen'][h % 4];
    const recruiter = ['Naomi Calloway', 'Rafael Iyer', 'Ingrid Voss', 'Omar Mensah'][(h >> 3) % 4];
    const meta: JobMeta = {
      jobId: `dev-offer-${Date.now()}`,
      company: company.name,
      role,
      domain: company.domain,
      recruiter,
      salary: `$${Math.round(comp / 1000)}K`,
      category,
      stage: 'offer',
      meetingTool: company.meetingTool,
      meetingLink: `https://meet.google.com/dev-${h.toString(36).slice(0, 8)}`,
      managerName,
      compensation: comp,
      location: company.location,
      employmentType: 'Full-time',
    };
    sendEmail({
      from: `${managerName} — ${company.name} <${managerName.toLowerCase().replace(' ', '.')}@${company.domain}>`,
      to: preferredEmail,
      subject: `Offer of Employment — ${role} at ${company.name}`,
      date: new Date().toISOString(),
      folder: 'inbox',
      body: `<p>Dear ${fullName.split(' ')[0]},</p><p>On behalf of <strong>${company.name}</strong>, it is my pleasure to extend this formal offer for the position of <strong>${role}</strong>, based in <strong>${company.location}</strong>.</p><ul><li><strong>Base Salary:</strong> $${comp.toLocaleString()} per year, paid biweekly</li><li><strong>Benefits:</strong> Full medical, dental, vision; 401(k) with employer match; flexible PTO</li></ul><p>To accept this offer, please reply with the words <strong>"I Accept"</strong> and your onboarding packet will follow within one business day.</p><br><p>Sincerely,<br><strong>${managerName}</strong><br>${company.name}</p>`,
      jobMeta: meta,
    });
    noteDevOffer();
    setOfferNote(`Offer from ${company.name} (${role}) delivered to your Outlook/Gmail inbox. Reply "I Accept" to provision employment.`);
  };

  const aiIcon = (svc: AiService) =>
    svc === 'claude' ? <ClaudeSpark size={26} /> : svc === 'chatgpt' ? <ChatGptKnot size={26} /> : <GeminiSpark size={26} />;

  return (
    <div className="simple-site">
      <h2>Settings</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {([['general', 'General'], ['subscriptions', 'Subscriptions'], ['developer', 'Developer']] as Array<[typeof tab, string]>).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            style={{ padding: '7px 16px', borderRadius: 18, border: '1px solid rgba(148,163,184,0.3)', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: tab === id ? '#3b82f6' : 'transparent', color: tab === id ? '#fff' : 'inherit' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="simple-card">
          <h3>Identity</h3>
          <label>Full name<input value={fullName} onChange={(e) => setProfile({ fullName: e.target.value })} /></label>
          <label>Primary email<input value={preferredEmail} onChange={(e) => setProfile({ preferredEmail: e.target.value })} /></label>
          <label>iCloud profile email<input value={icloudEmail} onChange={(e) => setProfile({ icloudEmail: e.target.value })} /></label>
          <label>Headline<input value={roleHeadline} onChange={(e) => setProfile({ roleHeadline: e.target.value })} /></label>
          <label>Location<input value={location} onChange={(e) => setProfile({ location: e.target.value })} /></label>
          <label>Job title<input value={jobTitle} onChange={(e) => setProfile({ jobTitle: e.target.value })} /></label>
          <label>Department<input value={department} onChange={(e) => setProfile({ department: e.target.value })} /></label>
          <label>Workday role
            <select value={workdayRole} onChange={(e) => setProfile({ workdayRole: e.target.value as typeof workdayRole })}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hrbp">HRBP</option>
              <option value="payroll_admin">Payroll Admin</option>
              <option value="legal_admin">Legal Admin</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>
            <input type="checkbox" checked={isPeopleManager} onChange={(e) => setProfile({ isPeopleManager: e.target.checked })} style={{ width: 'auto', marginRight: 8 }} />
            People manager (enables team approvals)
          </label>
        </div>
      )}

      {tab === 'subscriptions' && (
        <div className="simple-card">
          <h3>AI Subscriptions</h3>
          <p style={{ fontSize: 13, opacity: 0.7, marginTop: -4 }}>
            Subscriptions are billed monthly to your Chase checking account and unlock the assistant's site in Safari.
          </p>
          {(Object.keys(AI_PLANS) as AiService[]).map((svc) => {
            const plan = AI_PLANS[svc];
            const sub = subscriptions[svc];
            return (
              <div key={svc} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px', borderBottom: '1px solid rgba(148,163,184,0.15)' }}>
                {aiIcon(svc)}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{plan.plan}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    ${plan.monthly.toFixed(2)}/month{sub.active && sub.since ? ` · active since ${new Date(sub.since).toLocaleDateString()}` : ''}
                  </div>
                </div>
                {sub.active ? (
                  <button type="button" onClick={() => cancelSubscription(svc)}
                    style={{ padding: '7px 16px', borderRadius: 18, border: '1px solid rgba(148,163,184,0.4)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    Cancel
                  </button>
                ) : (
                  <button type="button" onClick={() => subscribe(svc)}
                    style={{ padding: '7px 16px', borderRadius: 18, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                    Subscribe
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'developer' && (
        <>
          <div className="simple-card">
            <h3>Developer — Cash Controls</h3>
            <p style={{ fontSize: 13, opacity: 0.7, marginTop: -4 }}>
              Adjustment is added on top of payroll deposits in Chase Total Checking. Current adjustment: <strong>${cashAdjustment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input value={cashInput} onChange={(e) => setCashInput(e.target.value)} placeholder="Set exact adjustment ($)" style={{ maxWidth: 200 }} />
              <button type="button" onClick={() => { const v = parseFloat(cashInput); if (!Number.isNaN(v)) setCashAdjustment(v); }}
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Set</button>
              {[100, 1000, 10000].map((amt) => (
                <button key={amt} type="button" onClick={() => { addCash(amt); setCashInput(''); }}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.4)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 13 }}>
                  +${amt.toLocaleString()}
                </button>
              ))}
              <button type="button" onClick={() => { setCashAdjustment(0); setCashInput(''); }}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(214,69,80,0.5)', background: 'transparent', color: '#d64550', cursor: 'pointer', fontSize: 13 }}>Reset</button>
            </div>
          </div>

          <div className="simple-card">
            <h3>Developer — Grant Job Offer</h3>
            <p style={{ fontSize: 13, opacity: 0.7, marginTop: -4 }}>
              Skip the pipeline: instantly deliver a formal offer email from any company. {devOffersGranted > 0 && `(${devOffersGranted} granted so far)`}
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <CompanyLogo company={offerCompany} size={40} />
              <select value={offerCompany} onChange={(e) => setOfferCompany(e.target.value)} style={{ maxWidth: 260 }}>
                {REAL_COMPANIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <select value={offerRoleIx} onChange={(e) => setOfferRoleIx(Number(e.target.value))} style={{ maxWidth: 240 }}>
                {DEV_ROLES.map(([r, , comp], i) => <option key={r} value={i}>{r} — ${Math.round(comp / 1000)}K</option>)}
              </select>
              <button type="button" onClick={grantOffer}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                Send Offer
              </button>
            </div>
            {offerNote && <div style={{ marginTop: 10, fontSize: 13, color: '#16a34a' }}>✓ {offerNote}</div>}
          </div>
        </>
      )}
    </div>
  );
}
