import { useMemo, useState } from 'react';
import { useCompanyStore } from '../../../state/useCompanyStore';
import { useProfileStore } from '../../../state/useProfileStore';
import { AdpLogo } from '../../../data/brands';
import { buildPaychecks, usd } from '../../../data/simulator/payroll';
import './adp.css';

type AdpView = 'dashboard' | 'pay' | 'time' | 'benefits' | 'retirement' | 'taxes';

const NAV: Array<[AdpView, JSX.Element, string]> = [
  ['dashboard', <svg key="d" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M4 11 12 4l8 7" /><path d="M6 10v9h12v-9" /></svg>, 'Dashboard'],
  ['pay', <svg key="p" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /></svg>, 'Pay'],
  ['time', <svg key="t" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.4 2" /></svg>, 'Time & Attendance'],
  ['benefits', <svg key="b" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 20s-7-4.6-9-9c-1.2-2.7.6-6 3.8-6 2 0 3.6 1.2 5.2 3.4C13.6 6.2 15.2 5 17.2 5c3.2 0 5 3.3 3.8 6-2 4.4-9 9-9 9z" /></svg>, 'Benefits'],
  ['retirement', <svg key="r" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M4 19h16" /><path d="m5 15 4.5-4.5 3.5 3L19 8" /><path d="M15.5 8H19v3.5" /></svg>, 'Retirement'],
  ['taxes', <svg key="x" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9 12h6M9 16h6" /></svg>, 'Tax Statements'],
];

export function AdpSite() {
  const accounts = useCompanyStore((s) => s.employerAccounts);
  const fullName = useProfileStore((s) => s.fullName);
  // Real myADP aggregates every employer that runs payroll through ADP — when
  // the user holds multiple jobs they pick which employer's pay to view.
  const employed = accounts.filter((a) => a.employmentStatus === 'active' || a.employmentStatus === 'onboarding');
  const [employerId, setEmployerId] = useState<string | null>(null);
  const active = employed.find((a) => a.id === employerId) ?? employed[0] ?? accounts[0] ?? null;
  const [view, setView] = useState<AdpView>('dashboard');
  const [statementId, setStatementId] = useState<string | null>(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockLog, setClockLog] = useState<string[]>([]);

  const checks = useMemo(() => (active ? buildPaychecks(active) : []), [active]);
  const latest = checks[0];
  const statement = checks.find((c) => c.id === statementId) ?? null;

  if (!active) {
    return (
      <div className="adp-shell adp-center">
        <div className="adp-login-card">
          <AdpLogo height={30} />
          <h2>Welcome to ADP®</h2>
          <p>Your employer hasn't linked an ADP account yet. Once you accept a job offer, payroll access appears here automatically.</p>
        </div>
      </div>
    );
  }

  const takeHomePct = latest ? Math.round((latest.net / latest.gross) * 100) : 0;

  return (
    <div className="adp-shell">
      <header className="adp-topbar">
        <AdpLogo height={24} />
        <span className="adp-product">myADP</span>
        <div className="adp-topbar-right">
          {employed.length > 1 ? (
            <select className="adp-org adp-org-select" value={active.id}
              onChange={(e) => setEmployerId(e.target.value)} aria-label="Select employer">
              {employed.map((a) => <option key={a.id} value={a.id}>{a.companyName}</option>)}
            </select>
          ) : (
            <span className="adp-org">{active.companyName}</span>
          )}
          <div className="adp-avatar">{(fullName[0] ?? 'U').toUpperCase()}</div>
        </div>
      </header>

      <div className="adp-layout">
        <nav className="adp-nav">
          {NAV.map(([id, ic, label]) => (
            <button key={id} type="button" className={view === id ? 'active' : ''} onClick={() => setView(id)}>
              <span className="adp-nav-ic">{ic}</span>{label}
            </button>
          ))}
        </nav>

        <main className="adp-main">
          {view === 'dashboard' && (
            <>
              <h1 className="adp-h1">Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {fullName.split(' ')[0]}</h1>
              <div className="adp-grid">
                <section className="adp-card adp-pay-card">
                  <header><h3>Pay</h3><button type="button" className="adp-link" onClick={() => setView('pay')}>View all</button></header>
                  {latest ? (
                    <>
                      <div className="adp-paydate">Payment on {new Date(latest.payDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                      <div className="adp-net">{usd(latest.net)}</div>
                      <div className="adp-donut" style={{ ['--pct' as string]: `${takeHomePct}` }}>
                        <div className="adp-donut-hole"><strong>{takeHomePct}%</strong><span>take-home</span></div>
                      </div>
                      <div className="adp-pay-legend">
                        <span><i className="adp-dot adp-dot-net" /> Net pay {usd(latest.net)}</span>
                        <span><i className="adp-dot adp-dot-tax" /> Taxes &amp; deductions {usd(latest.totalDeductions)}</span>
                      </div>
                      <button type="button" className="adp-primary" onClick={() => { setView('pay'); setStatementId(latest.id); }}>View pay statement</button>
                    </>
                  ) : <div className="adp-empty">Your first pay lands two weeks after your start date.</div>}
                </section>

                <section className="adp-card">
                  <header><h3>Time</h3><button type="button" className="adp-link" onClick={() => setView('time')}>Timecard</button></header>
                  <div className="adp-clock">
                    <div className="adp-clock-time">{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
                    <button type="button" className={`adp-clock-btn ${clockedIn ? 'out' : 'in'}`} onClick={() => {
                      setClockedIn((v) => !v);
                      setClockLog((l) => [`${clockedIn ? 'Clock out' : 'Clock in'} — ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`, ...l].slice(0, 6));
                    }}>
                      {clockedIn ? 'Clock Out' : 'Clock In'}
                    </button>
                  </div>
                  {clockLog.map((l, i) => <div key={i} className="adp-clock-log">{l}</div>)}
                </section>

                <section className="adp-card">
                  <header><h3>Retirement — 401(k)</h3><button type="button" className="adp-link" onClick={() => setView('retirement')}>Manage</button></header>
                  <div className="adp-kpi">{usd(checks.reduce((s, c) => s + c.gross * 0.05 * 1.8, 0))}</div>
                  <span className="adp-sub">Estimated balance · 5% contribution + 4% employer match</span>
                </section>

                <section className="adp-card">
                  <header><h3>To Do</h3></header>
                  <div className="adp-todo">Confirm your mailing address for W-2 delivery</div>
                  <div className="adp-todo">Review your federal withholding elections (W-4)</div>
                  <div className="adp-todo">Enroll in direct deposit — complete</div>
                </section>
              </div>
            </>
          )}

          {view === 'pay' && (
            <>
              <h1 className="adp-h1">Pay</h1>
              <div className="adp-card">
                <header><h3>Pay Statements</h3><span className="adp-sub">{checks.length} statements</span></header>
                <table className="adp-table">
                  <thead><tr><th>Pay date</th><th>Company</th><th className="adp-num">Gross pay</th><th className="adp-num">Net pay</th><th /></tr></thead>
                  <tbody>
                    {checks.map((c) => (
                      <tr key={c.id}>
                        <td>{new Date(c.payDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td>{active.companyName}</td>
                        <td className="adp-num">{usd(c.gross)}</td>
                        <td className="adp-num adp-strong">{usd(c.net)}</td>
                        <td><button type="button" className="adp-link" onClick={() => setStatementId(c.id)}>View statement</button></td>
                      </tr>
                    ))}
                    {checks.length === 0 && <tr><td colSpan={5} className="adp-empty">No statements yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {view === 'time' && (
            <>
              <h1 className="adp-h1">Time &amp; Attendance</h1>
              <div className="adp-card">
                <header><h3>This Week's Timecard</h3><span className="adp-sub">Standard schedule · 40.0 scheduled hours</span></header>
                <table className="adp-table">
                  <thead><tr><th>Day</th><th>In</th><th>Out</th><th className="adp-num">Hours</th><th>Status</th></tr></thead>
                  <tbody>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d, i) => {
                      const today = (new Date().getDay() + 6) % 7; // Mon=0
                      const past = i < today;
                      const isToday = i === today;
                      return (
                        <tr key={d}>
                          <td>{d}</td>
                          <td>{past || (isToday && clockedIn) ? '9:00 AM' : '—'}</td>
                          <td>{past ? '5:30 PM' : '—'}</td>
                          <td className="adp-num">{past ? '8.00' : isToday && clockedIn ? 'In progress' : '—'}</td>
                          <td>{past ? <span className="adp-pill ok">Approved</span> : isToday ? <span className="adp-pill now">{clockedIn ? 'Clocked in' : 'Today'}</span> : <span className="adp-pill">Scheduled</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {view === 'benefits' && (
            <>
              <h1 className="adp-h1">Benefits</h1>
              <div className="adp-grid">
                {[
                  ['Medical — PPO Choice Plus', 'Employee only · $87.50 per pay period'],
                  ['Dental — Standard', 'Employee only · $11.25 per pay period'],
                  ['Vision — VSP Basic', 'Employee only · $3.40 per pay period'],
                  ['Basic Life & AD&D', '2x salary · employer paid'],
                ].map(([name, sub]) => (
                  <section key={name} className="adp-card"><h3 style={{ margin: 0 }}>{name}</h3><span className="adp-sub">{sub}</span></section>
                ))}
              </div>
            </>
          )}

          {view === 'retirement' && (
            <>
              <h1 className="adp-h1">Retirement</h1>
              <div className="adp-card">
                <header><h3>401(k) Plan — {active.companyName}</h3></header>
                <div className="adp-kv"><span>Your contribution</span><strong>5% Traditional</strong></div>
                <div className="adp-kv"><span>Employer match</span><strong>100% of first 4%</strong></div>
                <div className="adp-kv"><span>YTD contributions</span><strong>{latest ? usd(latest.ytdGross * 0.05) : '$0.00'}</strong></div>
                <div className="adp-kv"><span>Investment lineup</span><strong>Target Date 2065 Fund (default)</strong></div>
              </div>
            </>
          )}

          {view === 'taxes' && (
            <>
              <h1 className="adp-h1">Tax Statements</h1>
              <div className="adp-card">
                <div className="adp-kv"><span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></svg> {new Date().getFullYear() - 1} W-2 — {active.companyName}</span><button type="button" className="adp-link">Download PDF</button></div>
                <div className="adp-kv"><span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></svg> W-4 on file — Single, no adjustments</span><button type="button" className="adp-link">Update withholding</button></div>
                <div className="adp-kv"><span>State filing — {active.location.split(', ')[1] ?? 'NY'}</span><button type="button" className="adp-link">View</button></div>
              </div>
            </>
          )}
        </main>
      </div>

      {statement && (
        <div className="adp-modal-overlay" onClick={() => setStatementId(null)}>
          <div className="adp-modal" onClick={(e) => e.stopPropagation()}>
            <header className="adp-modal-head">
              <div><AdpLogo height={18} /> <strong style={{ marginLeft: 8 }}>Earnings Statement</strong></div>
              <button type="button" onClick={() => setStatementId(null)}>✕</button>
            </header>
            <div className="adp-statement">
              <div className="adp-statement-meta">
                <div><span>Company</span><strong>{active.companyName}</strong></div>
                <div><span>Employee</span><strong>{fullName}</strong></div>
                <div><span>Pay date</span><strong>{new Date(statement.payDate).toLocaleDateString()}</strong></div>
                <div><span>Period</span><strong>{statement.periodStart} – {statement.periodEnd}</strong></div>
                <div><span>Check no.</span><strong>{statement.checkNumber}</strong></div>
              </div>
              <table className="adp-table">
                <thead><tr><th>Earnings</th><th className="adp-num">Rate</th><th className="adp-num">Hours</th><th className="adp-num">This period</th><th className="adp-num">YTD</th></tr></thead>
                <tbody>
                  <tr><td>Regular</td><td className="adp-num">{usd(statement.gross / statement.hours)}</td><td className="adp-num">{statement.hours.toFixed(2)}</td><td className="adp-num">{usd(statement.gross)}</td><td className="adp-num">{usd(statement.ytdGross)}</td></tr>
                </tbody>
              </table>
              <table className="adp-table">
                <thead><tr><th>Deductions</th><th className="adp-num">This period</th></tr></thead>
                <tbody>
                  {statement.deductions.map((d) => (
                    <tr key={d.label}><td>{d.label}</td><td className="adp-num">({usd(d.amount)})</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="adp-statement-net">
                <span>Net Pay</span><strong>{usd(statement.net)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
