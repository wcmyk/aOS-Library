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

  if (!onboarding) return <div className="workfront-shell"><div className="workfront-empty">Accept a job offer first to load your company-specific PM stack.</div></div>;

  const tool = getTool(onboarding.company);

  return (
    <div className="workfront-shell">
      <aside className="workfront-rail">
        <div className="workfront-logo">Workfront</div>
        <button className="active" type="button">My Work</button>
        <button type="button">Projects</button>
        <button type="button">Requests</button>
        <button type="button">Reports</button>
        <button type="button">Proofing</button>
      </aside>
      <section className="workfront-main">
        <header className="workfront-header">
          <div>
            <h2>{onboarding.company} Delivery Workspace</h2>
            <p>{tool.tool}</p>
          </div>
          <span className="workfront-badge">Role: {onboarding.role}</span>
        </header>
        <div className="workfront-note">{tool.notes}</div>
        <div className="workfront-board">
          <div className="workfront-col">
            <h3>Backlog</h3>
            <div className="workfront-task">Onboarding access audit</div>
            <div className="workfront-task">Role-specific handbook review</div>
          </div>
          <div className="workfront-col">
            <h3>In Progress</h3>
            <div className="workfront-task">Sprint commitments for {onboarding.role}</div>
            <div className="workfront-task">Manager checkpoint setup</div>
          </div>
          <div className="workfront-col">
            <h3>Review</h3>
            <div className="workfront-task">Compliance approval routing</div>
          </div>
          <div className="workfront-col">
            <h3>Done</h3>
            <div className="workfront-task">Tenant provisioning</div>
          </div>
        </div>
      </section>
    </div>
  );
}
