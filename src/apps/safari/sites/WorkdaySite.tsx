import { useMemo, useState } from 'react';
import { useMailStore } from '../../../state/useMailStore';
import { useProfileStore } from '../../../state/useProfileStore';

function normalize(text: string): string {
  return text.toLowerCase();
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
    return <div className="simple-site"><h2>Workday</h2><p>Accept an offer in Outlook first to activate your company Workday tenant.</p></div>;
  }

  const isFullTime = normalize(acceptedOffer.employmentType).includes('full-time');
  const totalHours = Object.values(hours).reduce((sum, h) => sum + Number(h || 0), 0);

  return (
    <div className="simple-site">
      <h2>Workday — {acceptedOffer.company}</h2>
      <p>Signed in as <strong>{fullName}</strong> ({preferredEmail}). Employee role: {acceptedOffer.role}.</p>
      <div className="simple-card">
        <h3>Onboarding checklist</h3>
        <ul>
          <li>Company handbook: {acceptedOffer.company} Workplace Standards & Ethics</li>
          <li>Systems access: VPN, SSO, CoLab, project management tools</li>
          <li>Manager: {acceptedOffer.managerName}</li>
        </ul>
      </div>
      <div className="simple-card">
        <h3>Time entry</h3>
        {isFullTime ? (
          <p>This role is marked as <strong>Full-Time</strong>. No daily hour entry required unless your manager requests exception tracking.</p>
        ) : (
          <>
            <p>This role requires weekly timesheet submission.</p>
            <div className="hours-grid">
              {Object.keys(hours).map((d) => (
                <label key={d}>{d}<input value={hours[d]} onChange={(e) => setHours((prev) => ({ ...prev, [d]: e.target.value }))} /></label>
              ))}
            </div>
            <p>Total: <strong>{totalHours}</strong> hours</p>
          </>
        )}
      </div>
    </div>
  );
}
