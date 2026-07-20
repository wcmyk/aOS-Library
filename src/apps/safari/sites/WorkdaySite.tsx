import { useEffect, useMemo, useState } from 'react';
import { useCompanyStore } from '../../../state/useCompanyStore';
import { useProfileStore } from '../../../state/useProfileStore';
import { WorkdayLogo } from '../../../data/brands';
import { buildPaychecks, usd, amountInWords, type Paycheck } from '../../../data/simulator/payroll';
import { generateRoleTasks, loadTaskStates, saveTaskStates, formatCountdown, type TaskState } from '../../../data/simulator/roleTasks';
import './workday.css';

type WdView = 'home' | 'inbox' | 'pay' | 'career' | 'timeoff' | 'benefits' | 'profile' | 'performance';

const COMPLEXITY_TONE: Record<string, string> = {
  Starter: 'wd-chip-green', Moderate: 'wd-chip-blue', Complex: 'wd-chip-amber', Critical: 'wd-chip-red',
};

function initials(name: string): string {
  const t = name.split(/\s+/).filter(Boolean);
  return ((t[0]?.[0] ?? 'U') + (t[1]?.[0] ?? '')).toUpperCase();
}

export function WorkdaySite() {
  const accounts = useCompanyStore((s) => s.employerAccounts);
  const activeId = useCompanyStore((s) => s.sessions.activeWorkdayAccountId);
  const login = useCompanyStore((s) => s.loginWorkday);
  const logout = useCompanyStore((s) => s.logoutWorkday);
  const fullName = useProfileStore((s) => s.fullName);
  const [selectedId, setSelectedId] = useState(accounts[0]?.id ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState<WdView>('home');
  const [payslipId, setPayslipId] = useState<string | null>(null);
  const [showCheck, setShowCheck] = useState(false);
  const [taskStates, setTaskStates] = useState<Record<string, TaskState>>(() => loadTaskStates());
  const [taskOpenId, setTaskOpenId] = useState<string | null>(null);
  const [submitNote, setSubmitNote] = useState('');
  const [ptoStart, setPtoStart] = useState('');
  const [ptoEnd, setPtoEnd] = useState('');
  const [ptoConfirm, setPtoConfirm] = useState('');
  const [, setTick] = useState(0);

  // live countdown pressure — rerender every 30s
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { saveTaskStates(taskStates); }, [taskStates]);

  const active = useMemo(() => accounts.find((a) => a.id === activeId) ?? null, [accounts, activeId]);
  const checks = useMemo(() => (active ? buildPaychecks(active) : []), [active]);
  const tasks = useMemo(() => (active ? generateRoleTasks(active) : []), [active]);
  const openTasks = tasks.filter((t) => (taskStates[t.id]?.status ?? 'open') === 'open');

  if (accounts.length === 0) {
    return (
      <div className="wd-shell wd-center-shell">
        <div className="wd-login-card">
          <WorkdayLogo height={28} />
          <h2>No organization found</h2>
          <p>Workday access is provisioned by your employer. Accept a job offer (via Outlook) and your company tenant will appear here.</p>
        </div>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="wd-shell wd-center-shell">
        <div className="wd-login-card">
          <WorkdayLogo height={28} />
          <h2>Sign In</h2>
          <p className="wd-login-sub">Select your organization to continue to Workday.</p>
          <div className="wd-login-accounts">
            {accounts.map((acc) => (
              <label key={acc.id} className={`wd-login-account ${selectedId === acc.id ? 'active' : ''}`}>
                <input type="radio" checked={selectedId === acc.id} onChange={() => setSelectedId(acc.id)} />
                <div>
                  <div className="wd-login-org">{acc.companyName}</div>
                  <div className="wd-login-meta">{acc.companyEmail} · Employee ID {acc.employeeId}</div>
                </div>
              </label>
            ))}
          </div>
          <input className="wd-login-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <button type="button" className="wd-primary-btn" onClick={() => {
            if (!selectedId) return;
            const ok = login(selectedId, password);
            setError(ok ? '' : 'The username or password you entered is incorrect.');
          }}>Sign In</button>
          {error && <div className="wd-login-error">{error}</div>}
          <button type="button" className="wd-linklike">Forgot Password?</button>
        </div>
      </div>
    );
  }

  const selectedPayslip = checks.find((c) => c.id === payslipId) ?? null;
  const openTask = tasks.find((t) => t.id === taskOpenId) ?? null;
  const latest = checks[0];
  const ptoAccrued = Math.min(120, Math.max(16, checks.length * 4.62)).toFixed(1);

  const completeTask = (id: string, note: string) => {
    setTaskStates((p) => ({ ...p, [id]: { status: 'submitted', submittedAt: Date.now(), note } }));
    setTaskOpenId(null);
    setSubmitNote('');
  };

  const renderTaskRow = (t: (typeof tasks)[number]) => {
    const state = taskStates[t.id]?.status ?? 'open';
    const cd = formatCountdown(t.dueAt);
    return (
      <button key={t.id} type="button" className={`wd-inbox-row ${state !== 'open' ? 'done' : ''}`} onClick={() => setTaskOpenId(t.id)}>
        <div className={`wd-inbox-ic ${cd.tone}`}>{state !== 'open' ? '✓' : '!'}</div>
        <div className="wd-inbox-body">
          <div className="wd-inbox-title">{t.title}</div>
          <div className="wd-inbox-meta">
            Assigned by {t.stakeholder} · Est. {t.estHours}h · <span className={`wd-chip ${COMPLEXITY_TONE[t.complexity]}`}>{t.complexity}</span>
          </div>
        </div>
        <div className={`wd-countdown ${cd.tone}`}>{state === 'open' ? cd.label : 'Submitted'}</div>
      </button>
    );
  };

  return (
    <div className="wd-shell">
      {/* Top bar */}
      <header className="wd-topbar">
        <button type="button" className="wd-logo-btn" onClick={() => setView('home')}><WorkdayLogo height={22} /></button>
        <div className="wd-search">
          <span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg></span>
          <input placeholder="Search Workday" />
        </div>
        <div className="wd-topbar-right">
          <button type="button" className="wd-topic" title="Notifications" onClick={() => setView('inbox')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 17h12l-1.5-2v-4.5a4.5 4.5 0 0 0-9 0V15z"/><path d="M10.3 19.5a1.8 1.8 0 0 0 3.4 0"/></svg>{openTasks.length > 0 && <span className="wd-bubble">{openTasks.length}</span>}
          </button>
          <button type="button" className="wd-topic" title="My Tasks" onClick={() => setView('inbox')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 5.5h16V19H4z"/><path d="M4 13h5a3 3 0 0 0 6 0h5"/></svg>{openTasks.length > 0 && <span className="wd-bubble">{openTasks.length}</span>}
          </button>
          <button type="button" className="wd-avatar" onClick={() => setView('profile')}>{initials(fullName)}</button>
        </div>
      </header>

      <div className="wd-body">
        {/* ── Home ── */}
        {view === 'home' && (
          <>
            <div className="wd-hero">
              <div className="wd-hero-inner">
                <h1>{new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'}, {fullName.split(' ')[0]}</h1>
                <p>{active.title} · {active.companyName} · {active.location}</p>
              </div>
            </div>
            <div className="wd-home-grid">
              <section className="wd-card">
                <header><h3>Awaiting Your Action</h3><button type="button" className="wd-linklike" onClick={() => setView('inbox')}>Go to My Tasks ({openTasks.length})</button></header>
                {openTasks.slice(0, 3).map(renderTaskRow)}
                {openTasks.length === 0 && <div className="wd-empty">You're all caught up.</div>}
              </section>

              <section className="wd-card">
                <header><h3>Your Top Apps</h3></header>
                <div className="wd-apps-grid">
                  {([
                    [<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="6" width="18" height="12" rx="1.5"/><circle cx="12" cy="12" r="2.6"/></svg>, 'Pay', 'pay'],
                    [<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="8.5"/><path d="m15 9-2 5-4 1 2-5z"/></svg>, 'Career', 'career'],
                    [<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9z"/><path d="M12 12v6a2 2 0 0 0 4 0"/></svg>, 'Time Off', 'timeoff'],
                    [<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 20s-7-4.6-9-9c-1.2-2.7.6-6 3.8-6 2 0 3.6 1.2 5.2 3.4C13.6 6.2 15.2 5 17.2 5c3.2 0 5 3.3 3.8 6-2 4.4-9 9-9 9z"/></svg>, 'Benefits', 'benefits'],
                    [<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8.5" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>, 'Personal Info', 'profile'],
                    [<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 19h16"/><path d="m5 15 4.5-4.5 3.5 3L19 8M15.5 8H19v3.5"/></svg>, 'Performance', 'performance'],
                    [<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 5.5h16V19H4z"/><path d="M4 13h5a3 3 0 0 0 6 0h5"/></svg>, 'My Tasks', 'inbox'],
                  ] as Array<[JSX.Element, string, WdView]>).map(([ic, label, v]) => (
                    <button key={label} type="button" className="wd-app-tile" onClick={() => setView(v)}>
                      <span className="wd-app-ic">{ic}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="wd-card">
                <header><h3>Timely Suggestions</h3></header>
                <div className="wd-suggest">
                  {latest && <button type="button" className="wd-suggest-row" onClick={() => { setView('pay'); setPayslipId(latest.id); }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="6" width="18" height="12" rx="1.5"/><circle cx="12" cy="12" r="2.6"/></svg> Your payslip for {new Date(latest.payDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} is ready — view details</button>}
                  <button type="button" className="wd-suggest-row" onClick={() => setView('timeoff')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9z"/><path d="M12 12v6a2 2 0 0 0 4 0"/></svg> You have {ptoAccrued} hours of PTO available — plan time off</button>
                  <button type="button" className="wd-suggest-row" onClick={() => setView('benefits')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 20s-7-4.6-9-9c-1.2-2.7.6-6 3.8-6 2 0 3.6 1.2 5.2 3.4C13.6 6.2 15.2 5 17.2 5c3.2 0 5 3.3 3.8 6-2 4.4-9 9-9 9z"/></svg> Benefits enrollment window is open until the end of the month</button>
                </div>
              </section>

              <section className="wd-card">
                <header><h3>Announcements</h3></header>
                <div className="wd-announce">
                  <div className="wd-announce-item"><strong>{active.companyName} Quarterly All-Hands</strong><span>Thursday 10:00 AM — agenda includes org updates and Q&amp;A with leadership.</span></div>
                  <div className="wd-announce-item"><strong>New expense policy effective this month</strong><span>Meal limits updated; review before your next report.</span></div>
                </div>
              </section>
            </div>
          </>
        )}

        {/* ── My Tasks (inbox) ── */}
        {view === 'inbox' && (
          <div className="wd-page">
            <div className="wd-page-head">
              <h2>My Tasks</h2>
              <span className="wd-page-sub">{openTasks.length} awaiting action · sorted by deadline</span>
            </div>
            <div className="wd-card wd-inbox-list">
              {tasks.map(renderTaskRow)}
              {tasks.length === 0 && <div className="wd-empty">No assignments yet.</div>}
            </div>
          </div>
        )}

        {/* ── Pay ── */}
        {view === 'pay' && (
          <div className="wd-page">
            <div className="wd-page-head"><h2>Pay</h2><span className="wd-page-sub">{active.companyName} · Employee ID {active.employeeId}</span></div>
            <div className="wd-pay-summary">
              <div className="wd-stat"><span>Annual Base Pay</span><strong>{usd(active.compensation)}</strong></div>
              <div className="wd-stat"><span>Most Recent Net Pay</span><strong>{latest ? usd(latest.net) : '—'}</strong></div>
              <div className="wd-stat"><span>YTD Gross</span><strong>{latest ? usd(latest.ytdGross) : '—'}</strong></div>
              <div className="wd-stat"><span>Pay Frequency</span><strong>Biweekly</strong></div>
            </div>
            <div className="wd-card">
              <header><h3>Payslips</h3><span className="wd-page-sub">{checks.length} available</span></header>
              <table className="wd-table">
                <thead><tr><th>Payment Date</th><th>Period</th><th className="wd-num">Hours</th><th className="wd-num">Gross</th><th className="wd-num">Deductions</th><th className="wd-num">Net Pay</th><th /></tr></thead>
                <tbody>
                  {checks.map((c) => (
                    <tr key={c.id}>
                      <td>{new Date(c.payDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td>{new Date(c.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(c.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                      <td className="wd-num">{c.hours.toFixed(2)}</td>
                      <td className="wd-num">{usd(c.gross)}</td>
                      <td className="wd-num">({usd(c.totalDeductions)})</td>
                      <td className="wd-num wd-strong">{usd(c.net)}</td>
                      <td><button type="button" className="wd-linklike" onClick={() => { setPayslipId(c.id); setShowCheck(false); }}>View</button></td>
                    </tr>
                  ))}
                  {checks.length === 0 && <tr><td colSpan={7} className="wd-empty">Your first payslip arrives two weeks after your start date ({active.startDate}).</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="wd-card">
              <header><h3>Tax Documents</h3></header>
              <div className="wd-doc-row"><span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></svg> W-2 Wage and Tax Statement — {new Date().getFullYear() - 1}</span><button type="button" className="wd-linklike">View/Print</button></div>
              <div className="wd-doc-row"><span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></svg> W-4 Employee's Withholding Certificate (on file)</span><button type="button" className="wd-linklike">Update</button></div>
            </div>
          </div>
        )}

        {/* ── Career ── */}
        {view === 'career' && (
          <div className="wd-page">
            <div className="wd-page-head"><h2>Career</h2><span className="wd-page-sub">Job history, growth, and internal mobility</span></div>
            <div className="wd-card">
              <header><h3>Current Position</h3></header>
              <div className="wd-kv"><span>Business Title</span><strong>{active.title}</strong></div>
              <div className="wd-kv"><span>Department</span><strong>{active.department}</strong></div>
              <div className="wd-kv"><span>Manager</span><strong>{active.managerName}</strong></div>
              <div className="wd-kv"><span>Location</span><strong>{active.location}</strong></div>
              <div className="wd-kv"><span>Hire Date</span><strong>{active.startDate}</strong></div>
              <div className="wd-kv"><span>Total Base Pay</span><strong>{usd(active.compensation)} / year</strong></div>
            </div>
            <div className="wd-card">
              <header><h3>Job History</h3></header>
              <div className="wd-timeline">
                {active.promotionHistory.slice().reverse().map((p, i) => (
                  <div key={i} className="wd-timeline-item">
                    <span className="wd-timeline-dot" />
                    <div>
                      <strong>{p.toTitle}</strong>
                      <span>Promotion · {new Date(p.at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · {usd(p.toComp)}/yr</span>
                    </div>
                  </div>
                ))}
                <div className="wd-timeline-item">
                  <span className="wd-timeline-dot start" />
                  <div><strong>{active.promotionHistory.length ? active.promotionHistory[0].fromTitle : active.title}</strong><span>Hired · {active.startDate}</span></div>
                </div>
              </div>
            </div>
            <div className="wd-card">
              <header><h3>Browse Internal Opportunities</h3></header>
              {[`Senior ${active.title}`, `${active.department.toUpperCase()} Team Lead`, 'Rotation Program — 6 months'].map((r) => (
                <div key={r} className="wd-doc-row"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="7" width="16" height="13" rx="1.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M4 12h16"/></svg> {r} — {active.companyName}</span><button type="button" className="wd-linklike">View Job</button></div>
              ))}
            </div>
          </div>
        )}

        {/* ── Time Off ── */}
        {view === 'timeoff' && (
          <div className="wd-page">
            <div className="wd-page-head"><h2>Time Off and Leave</h2></div>
            <div className="wd-pay-summary">
              <div className="wd-stat"><span>PTO Balance</span><strong>{ptoAccrued} hrs</strong></div>
              <div className="wd-stat"><span>Sick Time</span><strong>40.0 hrs</strong></div>
              <div className="wd-stat"><span>Floating Holidays</span><strong>2 days</strong></div>
              <div className="wd-stat"><span>Accrual Rate</span><strong>4.62 hrs / period</strong></div>
            </div>
            <div className="wd-card">
              <header><h3>Request Time Off</h3></header>
              <div className="wd-pto-form">
                <label>From<input type="date" value={ptoStart} onChange={(e) => setPtoStart(e.target.value)} /></label>
                <label>To<input type="date" value={ptoEnd} onChange={(e) => setPtoEnd(e.target.value)} /></label>
                <button type="button" className="wd-primary-btn" onClick={() => {
                  if (ptoStart && ptoEnd) setPtoConfirm(`Request submitted for ${ptoStart} → ${ptoEnd}. Routed to ${active.managerName} for approval.`);
                }}>Submit Request</button>
              </div>
              {ptoConfirm && <div className="wd-confirm">✓ {ptoConfirm}</div>}
            </div>
            <div className="wd-card">
              <header><h3>Upcoming Company Holidays</h3></header>
              {['Labor Day — Sep 7', 'Thanksgiving — Nov 26 & 27', 'Winter Break — Dec 24 → Jan 1'].map((hName) => (
                <div key={hName} className="wd-doc-row"><span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="5.5" width="16" height="14.5" rx="1.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg> {hName}</span></div>
              ))}
            </div>
          </div>
        )}

        {/* ── Performance ── */}
        {view === 'performance' && (() => {
          const submitted = tasks.filter((t) => (taskStates[t.id]?.status ?? 'open') !== 'open');
          const overdue = tasks.filter((t) => (taskStates[t.id]?.status ?? 'open') === 'open' && t.dueAt < Date.now());
          const rating = submitted.length >= 2 && overdue.length === 0 ? 'Exceeds Expectations'
            : overdue.length <= 1 ? 'Meets Expectations'
            : 'Needs Improvement';
          const ratingTone = rating === 'Exceeds Expectations' ? '#0f7b48' : rating === 'Meets Expectations' ? '#1a6fb5' : '#b3261e';
          const half = new Date().getMonth() < 6 ? 'H1' : 'H2';
          const competencies: Array<[string, number]> = [
            ['Delivery & execution', Math.min(100, 55 + submitted.length * 15 - overdue.length * 20)],
            ['Quality of work', Math.min(100, 60 + submitted.length * 12 - overdue.length * 10)],
            ['Communication', 72],
            ['Collaboration', 78],
          ];
          return (
            <div className="wd-page">
              <div className="wd-page-head"><h2>Performance</h2><span className="wd-page-sub">{half} {new Date().getFullYear()} review cycle · {active.companyName}</span></div>
              <div className="wd-perf-grid">
                <section className="wd-card">
                  <header><h3>Current rating</h3></header>
                  <div className="wd-perf-rating" style={{ color: ratingTone }}>{rating}</div>
                  <p className="wd-perf-note">
                    Based on {submitted.length} submitted deliverable{submitted.length === 1 ? '' : 's'} and {overdue.length} overdue task{overdue.length === 1 ? '' : 's'} this cycle.
                    {rating === 'Needs Improvement' ? ' Repeated missed deadlines can lead to a performance improvement plan.' : ' Sustained performance at this level supports promotion in the next review.'}
                  </p>
                  <div className="wd-kv"><span>Manager</span><strong>{active.managerName}</strong></div>
                  <div className="wd-kv"><span>Next review</span><strong>{half === 'H1' ? 'June 30' : 'December 15'}, {new Date().getFullYear()}</strong></div>
                </section>
                <section className="wd-card">
                  <header><h3>Competencies</h3></header>
                  {competencies.map(([label, pct]) => (
                    <div key={label} className="wd-comp-row">
                      <span>{label}</span>
                      <span className="wd-comp-bar"><i style={{ width: `${Math.max(8, pct)}%`, background: pct >= 75 ? '#0f7b48' : pct >= 55 ? '#1a6fb5' : '#b3261e' }} /></span>
                      <strong>{Math.max(8, pct)}</strong>
                    </div>
                  ))}
                  <p className="wd-perf-note">Delivery and quality scores update live from your submissions in My Tasks. Deadlines matter — overdue work pulls the rating down.</p>
                </section>
              </div>
            </div>
          );
        })()}

        {/* ── Benefits ── */}
        {view === 'benefits' && (
          <div className="wd-page">
            <div className="wd-page-head"><h2>Benefits</h2><span className="wd-page-sub">Current elections · {active.companyName}</span></div>
            <div className="wd-benefits-grid">
              {[
                [<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 20s-7-4.6-9-9c-1.2-2.7.6-6 3.8-6 2 0 3.6 1.2 5.2 3.4C13.6 6.2 15.2 5 17.2 5c3.2 0 5 3.3 3.8 6-2 4.4-9 9-9 9z"/></svg>, 'Medical', 'PPO Choice Plus', '$87.50 / period'],
                [<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 4c-2.5 0-4 2-4 4.5 0 4 1.5 5 2 8.5.3 2 .8 3.5 2 3.5s1.3-1.5 1.5-3c.2-1.3.7-2 2.5-2s2.3.7 2.5 2c.2 1.5.3 3 1.5 3s1.7-1.5 2-3.5c.5-3.5 2-4.5 2-8.5C20 6 18.5 4 16 4c-1.5 0-2.5 1-4 1s-2.5-1-4-1z"/></svg>, 'Dental', 'Standard Coverage', '$11.25 / period'],
                [<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="7" cy="14" r="3.2"/><circle cx="17" cy="14" r="3.2"/><path d="M10.2 14h3.6M3.8 14 5.5 7h2M20.2 14 18.5 7h-2"/></svg>, 'Vision', 'VSP Basic', '$3.40 / period'],
                [<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 19h16"/><path d="m5 15 4.5-4.5 3.5 3L19 8M15.5 8H19v3.5"/></svg>, '401(k)', '5% Traditional + 4% employer match', `${usd(Math.round(active.compensation * 0.05 / 26))} / period`],
                [<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3.5 5 6v5c0 4.5 3 8 7 9.5 4-1.5 7-5 7-9.5V6z"/></svg>, 'Life Insurance', '2x annual salary (employer paid)', '$0.00'],
                [<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3.5 12h4l2-5 3 10 2-5h6"/></svg>, 'EAP & Wellness', 'Included', '$0.00'],
              ].map(([ic, name, plan, cost], bi) => (
                <div key={bi} className="wd-benefit-card">
                  <span className="wd-benefit-ic">{ic}</span>
                  <strong>{name}</strong>
                  <span className="wd-benefit-plan">{plan}</span>
                  <span className="wd-benefit-cost">{cost}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Profile ── */}
        {view === 'profile' && (
          <div className="wd-page">
            <div className="wd-profile-hero">
              <div className="wd-profile-avatar">{initials(fullName)}</div>
              <div>
                <h2>{fullName}</h2>
                <p>{active.title} · {active.department}</p>
                <p className="wd-page-sub">{active.companyEmail} · {active.location}</p>
              </div>
              <button type="button" className="wd-secondary-btn" onClick={logout}>Sign Out</button>
            </div>
            <div className="wd-card">
              <header><h3>Workday Account</h3></header>
              <div className="wd-kv"><span>Organization</span><strong>{active.companyName}</strong></div>
              <div className="wd-kv"><span>Employee ID</span><strong>{active.employeeId}</strong></div>
              <div className="wd-kv"><span>Status</span><strong style={{ textTransform: 'capitalize' }}>{active.employmentStatus}</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* ── Payslip modal ── */}
      {selectedPayslip && (
        <div className="wd-modal-overlay" onClick={() => setPayslipId(null)}>
          <div className="wd-modal" onClick={(e) => e.stopPropagation()}>
            <header className="wd-modal-head">
              <h3>Payslip — {new Date(selectedPayslip.payDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h3>
              <div>
                <button type="button" className="wd-secondary-btn" onClick={() => setShowCheck((v) => !v)}>{showCheck ? 'View Statement' : 'View Check'}</button>
                <button type="button" className="wd-modal-close" onClick={() => setPayslipId(null)}>✕</button>
              </div>
            </header>
            {showCheck ? (
              <PaperCheck check={selectedPayslip} payee={fullName} company={active.companyName} location={active.location} />
            ) : (
              <div className="wd-payslip">
                <div className="wd-payslip-cols">
                  <div>
                    <h4>Earnings</h4>
                    <div className="wd-payslip-row"><span>Regular ({selectedPayslip.hours.toFixed(0)} hrs)</span><span>{usd(selectedPayslip.gross)}</span></div>
                    <div className="wd-payslip-row wd-strong"><span>Gross Pay</span><span>{usd(selectedPayslip.gross)}</span></div>
                  </div>
                  <div>
                    <h4>Deductions</h4>
                    {selectedPayslip.deductions.map((d) => (
                      <div key={d.label} className="wd-payslip-row"><span>{d.label}</span><span>({usd(d.amount)})</span></div>
                    ))}
                    <div className="wd-payslip-row wd-strong"><span>Total Deductions</span><span>({usd(selectedPayslip.totalDeductions)})</span></div>
                  </div>
                </div>
                <div className="wd-payslip-net">
                  <div><span>Net Pay</span><strong>{usd(selectedPayslip.net)}</strong></div>
                  <div><span>YTD Gross</span><strong>{usd(selectedPayslip.ytdGross)}</strong></div>
                  <div><span>YTD Net</span><strong>{usd(selectedPayslip.ytdNet)}</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Task detail modal ── */}
      {openTask && (
        <div className="wd-modal-overlay" onClick={() => setTaskOpenId(null)}>
          <div className="wd-modal" onClick={(e) => e.stopPropagation()}>
            <header className="wd-modal-head">
              <h3>{openTask.title}</h3>
              <button type="button" className="wd-modal-close" onClick={() => setTaskOpenId(null)}>✕</button>
            </header>
            <div className="wd-task-detail">
              <div className="wd-task-badges">
                <span className={`wd-chip ${COMPLEXITY_TONE[openTask.complexity]}`}>{openTask.complexity}</span>
                <span className={`wd-countdown ${formatCountdown(openTask.dueAt).tone}`}>{formatCountdown(openTask.dueAt).label}</span>
                <span className="wd-chip">Est. {openTask.estHours}h</span>
                {openTask.tags.map((t) => <span key={t} className="wd-chip">{t}</span>)}
              </div>
              <h4>Brief</h4>
              <p>{openTask.brief}</p>
              <h4>Expected deliverable</h4>
              <p>{openTask.deliverable}</p>
              <h4>Assigned by</h4>
              <p>{openTask.stakeholder}, {active.companyName}</p>
              {(taskStates[openTask.id]?.status ?? 'open') === 'open' ? (
                <>
                  <h4>Submit your work</h4>
                  <textarea
                    className="wd-task-input"
                    rows={4}
                    placeholder="Summarize what you did, link your deliverable, and flag anything at risk…"
                    value={submitNote}
                    onChange={(e) => setSubmitNote(e.target.value)}
                  />
                  <div className="wd-task-actions">
                    <button type="button" className="wd-primary-btn" disabled={submitNote.trim().length < 20}
                      onClick={() => completeTask(openTask.id, submitNote.trim())}>
                      Submit to {openTask.stakeholder.split(' ')[0]}
                    </button>
                    <span className="wd-page-sub">{submitNote.trim().length < 20 ? 'Write at least a short summary (20+ chars) — real deliverables need context.' : 'Ready to submit.'}</span>
                  </div>
                </>
              ) : (
                <div className="wd-confirm">✓ Submitted {taskStates[openTask.id]?.submittedAt ? new Date(taskStates[openTask.id]!.submittedAt!).toLocaleString() : ''} — awaiting review by {openTask.stakeholder}.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Paper check ("checks etc.") ───────────────────────────────────────────────

function PaperCheck({ check, payee, company, location }: { check: Paycheck; payee: string; company: string; location: string }) {
  return (
    <div className="wd-check">
      <div className="wd-check-head">
        <div>
          <strong>{company}</strong>
          <span>Payroll Account · {location}</span>
        </div>
        <div className="wd-check-no">No. {check.checkNumber}</div>
      </div>
      <div className="wd-check-daterow">
        <span className="wd-check-label">DATE</span>
        <span className="wd-check-line">{new Date(check.payDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
      </div>
      <div className="wd-check-payrow">
        <span className="wd-check-label">PAY TO THE<br />ORDER OF</span>
        <span className="wd-check-line wd-check-payee">{payee}</span>
        <span className="wd-check-amountbox">{usd(check.net)}</span>
      </div>
      <div className="wd-check-wordsrow">
        <span className="wd-check-line">{amountInWords(check.net)}</span>
      </div>
      <div className="wd-check-foot">
        <div>
          <span className="wd-check-label">MEMO</span>
          <span className="wd-check-line">Payroll {check.periodStart} – {check.periodEnd}</span>
        </div>
        <div className="wd-check-sig">
          <span className="wd-check-sigline">{company} Payroll Services</span>
          <span className="wd-check-label">AUTHORIZED SIGNATURE</span>
        </div>
      </div>
      <div className="wd-check-micr">⑆021000021⑆ 9448201191⑈ {check.checkNumber}</div>
      <div className="wd-check-void">NON-NEGOTIABLE — DIRECT DEPOSIT ADVICE</div>
    </div>
  );
}
