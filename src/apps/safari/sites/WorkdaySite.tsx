import { useMemo, useState } from 'react';
import { useMailStore } from '../../../state/useMailStore';
import { useProfileStore } from '../../../state/useProfileStore';

function normalize(text: string | undefined): string {
  return (text ?? '').toLowerCase();
}

export function WorkdaySite() {
  const emails = useMailStore((s) => s.emails);
  const { fullName, preferredEmail } = useProfileStore();
  const acceptedOffer = useMemo(
    () => emails.find((e) => e.jobMeta?.stage === 'onboarding')?.jobMeta,
    [emails]
  );
  const [hours, setHours] = useState<Record<string, string>>({ Mon: '8', Tue: '8', Wed: '8', Thu: '8', Fri: '8' });

  if (!acceptedOffer) {
    return <div className="workday-shell"><div className="workday-empty">Accept an offer in Outlook first to activate your company Workday tenant.</div></div>;
  }

  const isFullTime = normalize(acceptedOffer.employmentType).includes('full-time');
  const totalHours = Object.values(hours).reduce((sum, h) => sum + Number(h || 0), 0);

  return (
    <div className="workday-shell">
      <aside className="workday-nav">
        <div className="workday-logo">workday</div>
        <button type="button" className="active">Home</button>
        <button type="button">Inbox</button>
        <button type="button">Time</button>
        <button type="button">Benefits</button>
        <button type="button">Pay</button>
        <button type="button">Learning</button>
      </aside>
      <section className="workday-main">
        <header className="workday-header">
          <div>
            <h2>{acceptedOffer.company} Tenant</h2>
            <p>{fullName} · {acceptedOffer.role}</p>
          </div>
          <div className="workday-user">{preferredEmail}</div>
        </header>

        <div className="workday-grid">
          <article className="workday-card">
            <h3>Onboarding</h3>
            <ul>
              <li>Read employee handbook and code of conduct</li>
              <li>Complete I-9/W-4 packet</li>
              <li>Security training + acceptable use</li>
              <li>Manager connect: {acceptedOffer.managerName}</li>
            </ul>
          </article>

          <article className="workday-card">
            <h3>Compensation snapshot</h3>
            <p>Base pay: <strong>${acceptedOffer.compensation.toLocaleString()}/year</strong></p>
            <p>Location: {acceptedOffer.location}</p>
            <p>Employment type: {acceptedOffer.employmentType || 'Full-time'}</p>
          </article>

          <article className="workday-card workday-time">
            <h3>Time entry</h3>
            {isFullTime ? (
              <p>This role is Full-Time. Hour-by-hour daily entry is optional unless requested by your manager.</p>
            ) : (
              <>
                <p>Weekly timesheet (required):</p>
                <div className="hours-grid">
                  {Object.keys(hours).map((d) => (
                    <label key={d}>{d}<input value={hours[d]} onChange={(e) => setHours((prev) => ({ ...prev, [d]: e.target.value }))} /></label>
                  ))}
                </div>
                <p>Total: <strong>{totalHours}</strong> hours</p>
              </>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
