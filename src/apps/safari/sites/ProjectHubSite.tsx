import { useMemo } from 'react';
import { useMailStore } from '../../../state/useMailStore';

const COMPANY_PM: Array<{ match: RegExp; tool: string; notes: string }> = [
  { match: /samsung/i, tool: 'Samsung Project Life Cycle Management Portal + CognitiV Network Ops Suite', notes: 'Global synchronized sprints across KR/US/IN/VN and ML-driven bottleneck prediction.' },
  { match: /apple/i, tool: 'Radar', notes: 'Internal issue/program tracking with hardware-software integration workflows.' },
  { match: /j\.?p\.?\s?morgan|jp morgan/i, tool: 'Project SAIL + Senatus AI', notes: 'Modernization portfolio tracking plus ML-on-code toolkit for SDLC acceleration.' },
  { match: /google/i, tool: 'Buganizer + OKR operating cadence', notes: 'Issue tracking plus quarterly goals with agile standups and sprint planning.' },
  { match: /adobe/i, tool: 'Adobe Workfront', notes: 'Program intake, stakeholder approvals, and creative/engineering execution dashboards.' },
];

function getTool(company: string): { tool: string; notes: string } {
  return COMPANY_PM.find((c) => c.match.test(company)) ?? { tool: 'Adobe Workfront', notes: 'Default enterprise PM platform for cross-functional planning and delivery.' };
}

export function ProjectHubSite() {
  const emails = useMailStore((s) => s.emails);
  const onboarding = useMemo(() => emails.find((e) => e.jobMeta?.stage === 'onboarding')?.jobMeta, [emails]);

  if (!onboarding) return <div className="simple-site"><h2>Project Hub</h2><p>Accept a job offer first to load your company-specific PM stack.</p></div>;

  const tool = getTool(onboarding.company);

  return (
    <div className="simple-site">
      <h2>Project Management — {onboarding.company}</h2>
      <div className="simple-card">
        <h3>Primary platform</h3>
        <p><strong>{tool.tool}</strong></p>
        <p>{tool.notes}</p>
      </div>
      <div className="simple-card">
        <h3>Role-specific task lanes for {onboarding.role}</h3>
        <ul>
          <li>Sprint commitments scoped to your team domain and compliance requirements.</li>
          <li>Manager review checkpoints linked with CoLab daily updates.</li>
          <li>Company handbook controls applied to approvals, delivery sign-off, and audit history.</li>
        </ul>
      </div>
    </div>
  );
}
