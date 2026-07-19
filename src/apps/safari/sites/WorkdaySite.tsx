import { useEffect, useMemo, useState } from 'react';
import { useCompanyStore } from '../../../state/useCompanyStore';
import { useProfileStore } from '../../../state/useProfileStore';
import { WorkdayLogo } from '../../../data/brands';
import { buildPaychecks, usd, amountInWords, type Paycheck } from '../../../data/simulator/payroll';
import { generateRoleTasks, loadTaskStates, saveTaskStates, formatCountdown, type TaskState } from '../../../data/simulator/roleTasks';
import './workday.css';

type WdView = 'home' | 'inbox' | 'pay' | 'career' | 'timeoff' | 'benefits' | 'profile';

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
          <span>🔍</span>
          <input placeholder="Search Workday" />
        </div>
        <div className="wd-topbar-right">
          <button type="button" className="wd-topic" title="Notifications" onClick={() => setView('inbox')}>
            🔔{openTasks.length > 0 && <span className="wd-bubble">{openTasks.length}</span>}
          </button>
          <button type="button" className="wd-topic" title="My Tasks" onClick={() => setView('inbox')}>
            📥{openTasks.length > 0 && <span className="wd-bubble">{openTasks.length}</span>}
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
                {openTasks.length === 0 && <div className="wd-empty">You're all caught up. 🎉</div>}
              </section>

              <section className="wd-card">
                <header><h3>Your Top Apps</h3></header>
                <div className="wd-apps-grid">
                  {([
                    ['💰', 'Pay', 'pay'],
                    ['🧭', 'Career', 'career'],
                    ['🌴', 'Time Off', 'timeoff'],
                    ['🩺', 'Benefits', 'benefits'],
                    ['👤', 'Personal Info', 'profile'],
                    ['📥', 'My Tasks', 'inbox'],
                  ] as Array<[string, string, WdView]>).map(([ic, label, v]) => (
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
                  {latest && <button type="button" className="wd-suggest-row" onClick={() => { setView('pay'); setPayslipId(latest.id); }}>💵 Your payslip for {new Date(latest.payDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} is ready — view details</button>}
                  <button type="button" className="wd-suggest-row" onClick={() => setView('timeoff')}>🌴 You have {ptoAccrued} hours of PTO available — plan time off</button>
                  <button type="button" className="wd-suggest-row" onClick={() => setView('benefits')}>🩺 Benefits enrollment window is open until the end of the month</button>
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
              <div className="wd-doc-row"><span>📄 W-2 Wage and Tax Statement — {new Date().getFullYear() - 1}</span><button type="button" className="wd-linklike">View/Print</button></div>
              <div className="wd-doc-row"><span>📄 W-4 Employee's Withholding Certificate (on file)</span><button type="button" className="wd-linklike">Update</button></div>
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
                <div key={r} className="wd-doc-row"><span>💼 {r} — {active.companyName}</span><button type="button" className="wd-linklike">View Job</button></div>
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
                <div key={hName} className="wd-doc-row"><span>📅 {hName}</span></div>
              ))}
            </div>
          </div>
        )}

        {/* ── Benefits ── */}
        {view === 'benefits' && (
          <div className="wd-page">
            <div className="wd-page-head"><h2>Benefits</h2><span className="wd-page-sub">Current elections · {active.companyName}</span></div>
            <div className="wd-benefits-grid">
              {[
                ['🩺', 'Medical', 'PPO Choice Plus', '$87.50 / period'],
                ['🦷', 'Dental', 'Standard Coverage', '$11.25 / period'],
                ['👓', 'Vision', 'VSP Basic', '$3.40 / period'],
                ['📈', '401(k)', '5% Traditional + 4% employer match', `${usd(Math.round(active.compensation * 0.05 / 26))} / period`],
                ['🛡', 'Life Insurance', '2x annual salary (employer paid)', '$0.00'],
                ['🧠', 'EAP & Wellness', 'Included', '$0.00'],
              ].map(([ic, name, plan, cost]) => (
                <div key={name} className="wd-benefit-card">
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
