import { useState } from 'react';
import { useProfileStore } from '../../../state/useProfileStore';

const DAYS = ['Mon','Tue','Wed','Thu','Fri'];

type WdTab = 'home' | 'time' | 'pay' | 'benefits' | 'directory';

function formatComp(n: number) {
  return `$${(n / 26).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function nextPayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + (d.getDate() <= 15 ? 15 - d.getDate() : 30 - d.getDate() + 1));
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getWeekDates(): string[] {
  const d = new Date();
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return DAYS.map((_, i) => {
    const day = new Date(mon);
    day.setDate(mon.getDate() + i);
    return day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
}

export function WorkdaySite() {
  const { firstName, lastName, acceptedJob } = useProfileStore();
  const [tab, setTab] = useState<WdTab>('home');
  const [timeEntries, setTimeEntries] = useState<Record<string, { in: string; out: string }>>({});
  const [benefitEnrolled, setBenefitEnrolled] = useState<Record<string, boolean>>({});

  const displayName = firstName && lastName ? `${firstName} ${lastName}` : 'Employee';
  const weekDates = getWeekDates();

  if (!acceptedJob) {
    return (
      <div className="wd-shell wd-login">
        <div className="wd-login-card">
          <div className="wd-workday-logo">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill="#f68220"/>
              <text x="18" y="24" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white" fontFamily="Arial">W</text>
            </svg>
            <span className="wd-login-brand">Workday</span>
          </div>
          <div className="wd-login-title">Sign in to your organization</div>
          <input className="wd-input" placeholder="Work email" type="email" defaultValue="employee@company.com" />
          <input className="wd-input" placeholder="Password" type="password" defaultValue="••••••••" />
          <button type="button" className="wd-login-btn">Sign In</button>
          <p className="wd-login-note">Accept a job offer in Outlook to activate your Workday account.</p>
        </div>
      </div>
    );
  }

  const job = acceptedJob;
  const employeeEmail = firstName && lastName
    ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${job.domain}`
    : `employee@${job.domain}`;
  const managerEmail = job.managerName.toLowerCase().replace(' ', '.') + `@${job.domain}`;
  const isFullTime = job.salary.includes('K') && !['Contract'].includes('Contract'); // all jobs are effectively shown as active
  const biweeklyPay = job.compensation / 26;

  const clockIn = (day: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTimeEntries((p) => ({ ...p, [day]: { in: now, out: p[day]?.out ?? '' } }));
  };
  const clockOut = (day: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTimeEntries((p) => ({ ...p, [day]: { in: p[day]?.in ?? '', out: now } }));
  };

  const totalHours = Object.values(timeEntries).reduce((sum, e) => {
    if (!e.in || !e.out) return sum;
    const [ih, im] = e.in.split(':').map(Number);
    const [oh, om] = e.out.split(':').map(Number);
    return sum + (oh * 60 + om - (ih * 60 + im)) / 60;
  }, 0);

  const tabs: { id: WdTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'time', label: 'Time & Absence' },
    { id: 'pay', label: 'Pay' },
    { id: 'benefits', label: 'Benefits' },
    { id: 'directory', label: 'Directory' },
  ];

  const benefits = [
    { id: 'medical', name: 'Medical Insurance', plan: `${job.company} Premium PPO`, provider: 'BlueCross BlueShield', employee: '$82/mo', employer: 'Covered 80%' },
    { id: 'dental', name: 'Dental Insurance', plan: 'Delta Dental Complete', provider: 'Delta Dental', employee: '$14/mo', employer: 'Covered 75%' },
    { id: 'vision', name: 'Vision Insurance', plan: 'VSP Choice Plus', provider: 'VSP', employee: '$6/mo', employer: 'Covered 80%' },
    { id: '401k', name: '401(k) Retirement', plan: 'Traditional + Roth options', provider: 'Fidelity Investments', employee: 'Up to IRS limit', employer: '4% match' },
    { id: 'life', name: 'Life Insurance', plan: '2× Annual Salary', provider: 'MetLife', employee: '$0 (employer-paid)', employer: 'Fully covered' },
  ];

  return (
    <div className="wd-shell">
      {/* Header */}
      <header className="wd-header">
        <div className="wd-logo">
          <svg width="26" height="26" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill="#f68220"/>
            <text x="18" y="24" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white" fontFamily="Arial">W</text>
          </svg>
          <span className="wd-brand">Workday</span>
        </div>
        <nav className="wd-nav">
          {tabs.map((t) => (
            <button key={t.id} type="button" className={`wd-nav-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="wd-header-right">
          <div className="wd-user-pill">{displayName.split(' ').map(s => s[0]).join('')}</div>
        </div>
      </header>

      <div className="wd-body">
        {/* Home */}
        {tab === 'home' && (
          <div className="wd-home">
            <div className="wd-welcome">
              <div className="wd-welcome-name">Welcome back, {firstName || 'Employee'}</div>
              <div className="wd-welcome-sub">{job.role} · {job.company}</div>
            </div>
            <div className="wd-home-grid">
              <div className="wd-info-card">
                <div className="wd-info-label">Employee ID</div>
                <div className="wd-info-value">EMP-{Math.abs(job.jobId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 90000 + 10000}</div>
              </div>
              <div className="wd-info-card">
                <div className="wd-info-label">Department</div>
                <div className="wd-info-value">Engineering</div>
              </div>
              <div className="wd-info-card">
                <div className="wd-info-label">Work Email</div>
                <div className="wd-info-value" style={{fontSize:'12px'}}>{employeeEmail}</div>
              </div>
              <div className="wd-info-card">
                <div className="wd-info-label">Manager</div>
                <div className="wd-info-value" style={{fontSize:'12px'}}>{job.managerName}</div>
              </div>
            </div>
            <div className="wd-action-items">
              <div className="wd-action-title">Action Items</div>
              <div className="wd-action-list">
                <div className="wd-action-item">
                  <div className="wd-action-dot" style={{background:'#e05c00'}} />
                  <div>
                    <div className="wd-action-name">Complete Form I-9</div>
                    <div className="wd-action-due">Due: First day of employment</div>
                  </div>
                </div>
                <div className="wd-action-item">
                  <div className="wd-action-dot" style={{background:'#e05c00'}} />
                  <div>
                    <div className="wd-action-name">Set Up Direct Deposit</div>
                    <div className="wd-action-due">Required before first paycheck</div>
                  </div>
                </div>
                <div className="wd-action-item">
                  <div className="wd-action-dot" style={{background:'#0078d4'}} />
                  <div>
                    <div className="wd-action-name">Enroll in Benefits</div>
                    <div className="wd-action-due">30-day enrollment window open</div>
                  </div>
                </div>
                <div className="wd-action-item">
                  <div className="wd-action-dot" style={{background:'#0078d4'}} />
                  <div>
                    <div className="wd-action-name">Review Company Handbook</div>
                    <div className="wd-action-due">Complete within first week</div>
                  </div>
                </div>
                <div className="wd-action-item">
                  <div className="wd-action-dot" style={{background:'#107c10'}} />
                  <div>
                    <div className="wd-action-name">IT Equipment Setup</div>
                    <div className="wd-action-due">Self-paced onboarding guide</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time */}
        {tab === 'time' && (
          <div className="wd-time">
            <div className="wd-page-title">Time &amp; Absence</div>
            <div className="wd-timesheet">
              <div className="wd-timesheet-header">
                <span className="wd-ts-week">Current Week</span>
                <span className="wd-ts-total">{totalHours.toFixed(1)} hrs logged</span>
              </div>
              <table className="wd-ts-table">
                <thead>
                  <tr>
                    <th>Day</th><th>Date</th><th>Time In</th><th>Time Out</th><th>Hours</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day, i) => {
                    const entry = timeEntries[day];
                    let hrs = 0;
                    if (entry?.in && entry?.out) {
                      const [ih, im] = entry.in.split(':').map(Number);
                      const [oh, om] = entry.out.split(':').map(Number);
                      hrs = (oh * 60 + om - (ih * 60 + im)) / 60;
                    }
                    const isToday = new Date().getDay() === (i + 1);
                    return (
                      <tr key={day} className={isToday ? 'wd-ts-today' : ''}>
                        <td className="wd-ts-day">{day}</td>
                        <td className="wd-ts-date">{weekDates[i]}</td>
                        <td>{entry?.in || <span className="wd-ts-empty">—</span>}</td>
                        <td>{entry?.out || <span className="wd-ts-empty">—</span>}</td>
                        <td>{entry?.in && entry?.out ? hrs.toFixed(1) : '—'}</td>
                        <td>
                          <button type="button" className="wd-ts-btn" onClick={() => clockIn(day)} disabled={!!entry?.in}>
                            In
                          </button>
                          <button type="button" className="wd-ts-btn" onClick={() => clockOut(day)} disabled={!entry?.in || !!entry?.out}>
                            Out
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="wd-ts-note">Full-time salaried employees are not required to submit timesheets. This view is for your records only.</div>
            </div>
          </div>
        )}

        {/* Pay */}
        {tab === 'pay' && (
          <div className="wd-pay">
            <div className="wd-page-title">Pay</div>
            <div className="wd-pay-grid">
              <div className="wd-pay-card wd-pay-next">
                <div className="wd-pay-card-label">Next Paycheck</div>
                <div className="wd-pay-amount">{formatComp(job.compensation)}</div>
                <div className="wd-pay-date">{nextPayDate()}</div>
                <div className="wd-pay-sub">Gross (before taxes & deductions)</div>
              </div>
              <div className="wd-pay-card">
                <div className="wd-pay-card-label">Annual Base Salary</div>
                <div className="wd-pay-amount">${job.compensation.toLocaleString()}</div>
                <div className="wd-pay-sub">Paid bi-weekly (26 pay periods)</div>
              </div>
              <div className="wd-pay-card">
                <div className="wd-pay-card-label">YTD Gross</div>
                <div className="wd-pay-amount">${Math.round(biweeklyPay * (new Date().getMonth() * 2 + 1)).toLocaleString()}</div>
                <div className="wd-pay-sub">Year-to-date earnings</div>
              </div>
            </div>
            <div className="wd-pay-deductions">
              <div className="wd-pd-title">Estimated Per-Paycheck Deductions</div>
              <div className="wd-pd-row"><span>Federal Income Tax (est.)</span><span>-${(biweeklyPay * 0.22).toFixed(2)}</span></div>
              <div className="wd-pd-row"><span>State Income Tax (est.)</span><span>-${(biweeklyPay * 0.05).toFixed(2)}</span></div>
              <div className="wd-pd-row"><span>Social Security (6.2%)</span><span>-${(biweeklyPay * 0.062).toFixed(2)}</span></div>
              <div className="wd-pd-row"><span>Medicare (1.45%)</span><span>-${(biweeklyPay * 0.0145).toFixed(2)}</span></div>
              <div className="wd-pd-row"><span>401(k) Contribution (6%)</span><span>-${(biweeklyPay * 0.06).toFixed(2)}</span></div>
              <div className="wd-pd-row"><span>Medical / Dental / Vision</span><span>-$102.00</span></div>
              <div className="wd-pd-row wd-pd-net"><span>Estimated Net Pay</span><span>${(biweeklyPay * 0.6455 - 102).toFixed(2)}</span></div>
            </div>
          </div>
        )}

        {/* Benefits */}
        {tab === 'benefits' && (
          <div className="wd-benefits">
            <div className="wd-page-title">Benefits Enrollment</div>
            <div className="wd-enroll-note">Your 30-day enrollment window is open. Elections take effect on your first day of coverage.</div>
            {benefits.map((b) => (
              <div key={b.id} className={`wd-benefit-card${benefitEnrolled[b.id] ? ' enrolled' : ''}`}>
                <div className="wd-benefit-info">
                  <div className="wd-benefit-name">{b.name}</div>
                  <div className="wd-benefit-plan">{b.plan} · {b.provider}</div>
                  <div className="wd-benefit-cost">
                    <span>Employee cost: <strong>{b.employee}</strong></span>
                    <span className="wd-benefit-sep">·</span>
                    <span>Employer: <strong>{b.employer}</strong></span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`wd-enroll-btn${benefitEnrolled[b.id] ? ' enrolled' : ''}`}
                  onClick={() => setBenefitEnrolled((p) => ({ ...p, [b.id]: !p[b.id] }))}
                >
                  {benefitEnrolled[b.id] ? 'Enrolled' : 'Enroll'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Directory */}
        {tab === 'directory' && (
          <div className="wd-directory">
            <div className="wd-page-title">Company Directory</div>
            <div className="wd-dir-grid">
              <div className="wd-dir-card wd-dir-self">
                <div className="wd-dir-avatar" style={{background:'#0078d4'}}>{displayName.split(' ').map(s=>s[0]).join('')}</div>
                <div className="wd-dir-name">{displayName}</div>
                <div className="wd-dir-title">{job.role}</div>
                <div className="wd-dir-email">{employeeEmail}</div>
                <div className="wd-dir-tag">You</div>
              </div>
              <div className="wd-dir-card">
                <div className="wd-dir-avatar" style={{background:'#d13438'}}>{job.managerName.split(' ').map(s=>s[0]).join('')}</div>
                <div className="wd-dir-name">{job.managerName}</div>
                <div className="wd-dir-title">Director of Engineering</div>
                <div className="wd-dir-email">{managerEmail}</div>
                <div className="wd-dir-tag">Your Manager</div>
              </div>
              <div className="wd-dir-card">
                <div className="wd-dir-avatar" style={{background:'#107c10'}}>HR</div>
                <div className="wd-dir-name">People Operations</div>
                <div className="wd-dir-title">HR Department</div>
                <div className="wd-dir-email">hr@{job.domain}</div>
                <div className="wd-dir-tag">HR</div>
              </div>
              <div className="wd-dir-card">
                <div className="wd-dir-avatar" style={{background:'#7719aa'}}>IT</div>
                <div className="wd-dir-name">IT Help Desk</div>
                <div className="wd-dir-title">Technology Support</div>
                <div className="wd-dir-email">it@{job.domain}</div>
                <div className="wd-dir-tag">IT</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
