import { useEffect, useMemo, useState } from 'react';
import { useHcmStore, type LeaveType, type PermissionContext } from '../../../state/useHcmStore';
import { useProfileStore } from '../../../state/useProfileStore';

type WorkdayPage =
  | 'home'
  | 'me-profile'
  | 'me-time'
  | 'me-pay'
  | 'me-documents'
  | 'me-leave'
  | 'me-calendar'
  | 'team-timesheets'
  | 'team-leave'
  | 'team-directory'
  | 'hr-core'
  | 'hr-recruiting'
  | 'hr-onboarding'
  | 'hr-compliance'
  | 'payroll-runs'
  | 'payroll-adjustments'
  | 'payroll-statements'
  | 'admin-org'
  | 'admin-roles'
  | 'admin-audit'
  | 'admin-settings';

type NavItem = {
  label: string;
  route?: WorkdayPage;
  children?: NavItem[];
  visible: (ctx: PermissionContext) => boolean;
};

const LEAVE_TYPES: LeaveType[] = ['PTO', 'SICK', 'UNPAID', 'BEREAVEMENT', 'JURY DUTY', 'PARENTAL'];

function DataTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | number | JSX.Element>> }) {
  return (
    <div className="hcm-table-wrap">
      <table className="hcm-table">
        <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={`${i}-${j}`}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function getNavConfig(): NavItem[] {
  return [
    { label: 'Home', route: 'home', visible: () => true },
    {
      label: 'Me',
      visible: () => true,
      children: [
        { label: 'Profile', route: 'me-profile', visible: () => true },
        { label: 'Time', route: 'me-time', visible: () => true },
        { label: 'Pay', route: 'me-pay', visible: () => true },
        { label: 'Documents', route: 'me-documents', visible: () => true },
        { label: 'Leave', route: 'me-leave', visible: () => true },
        { label: 'Calendar', route: 'me-calendar', visible: () => true },
      ],
    },
    {
      label: 'Team',
      visible: (ctx) => ctx.isManager,
      children: [
        { label: 'Team Timesheets', route: 'team-timesheets', visible: (ctx) => ctx.canApproveTeamTime },
        { label: 'Team Leave', route: 'team-leave', visible: (ctx) => ctx.canApproveTeamLeave },
        { label: 'Team Directory', route: 'team-directory', visible: (ctx) => ctx.isManager },
      ],
    },
    {
      label: 'HR',
      visible: (ctx) => ctx.canAccessHR,
      children: [
        { label: 'Core HR', route: 'hr-core', visible: (ctx) => ctx.canAccessHR },
        { label: 'Recruiting', route: 'hr-recruiting', visible: (ctx) => ctx.canAccessHR },
        { label: 'Onboarding', route: 'hr-onboarding', visible: (ctx) => ctx.canAccessHR },
        { label: 'Compliance', route: 'hr-compliance', visible: (ctx) => ctx.canAccessHR },
      ],
    },
    {
      label: 'Payroll',
      visible: (ctx) => ctx.canAccessPayroll,
      children: [
        { label: 'Payroll Runs', route: 'payroll-runs', visible: (ctx) => ctx.canAccessPayroll },
        { label: 'Adjustments', route: 'payroll-adjustments', visible: (ctx) => ctx.canAccessPayroll },
        { label: 'Statements', route: 'payroll-statements', visible: (ctx) => ctx.canAccessPayroll },
      ],
    },
    {
      label: 'Admin',
      visible: (ctx) => ctx.roleFlags.canAccessAdmin,
      children: [
        { label: 'Org Structure', route: 'admin-org', visible: (ctx) => ctx.roleFlags.canAccessAdmin },
        { label: 'Roles', route: 'admin-roles', visible: (ctx) => ctx.roleFlags.canAccessAdmin },
        { label: 'Audit Trail', route: 'admin-audit', visible: (ctx) => ctx.roleFlags.canAccessAdmin },
        { label: 'Settings', route: 'admin-settings', visible: (ctx) => ctx.roleFlags.canAccessAdmin },
      ],
    },
  ];
}

function visibleRoutes(nav: NavItem[], ctx: PermissionContext): WorkdayPage[] {
  const out: WorkdayPage[] = [];
  for (const item of nav) {
    if (!item.visible(ctx)) continue;
    if (item.route) out.push(item.route);
    if (item.children) {
      for (const c of item.children) {
        if (c.visible(ctx) && c.route) out.push(c.route);
      }
    }
  }
  return out;
}

export function WorkdaySite() {
  const {
    fullName,
    preferredEmail,
    location,
    workdayRole,
    isPeopleManager,
    jobTitle,
    department,
  } = useProfileStore();

  const store = useHcmStore();

  useEffect(() => {
    store.syncSimulationUser({
      fullName,
      preferredEmail,
      location,
      roleType: workdayRole,
      isPeopleManager,
      jobTitle,
      department,
    });
  }, [store, fullName, preferredEmail, location, workdayRole, isPeopleManager, jobTitle, department]);

  const permissionCtx = store.getPermissionContext();
  const nav = useMemo(() => getNavConfig(), []);
  const allowedRoutes = useMemo(() => visibleRoutes(nav, permissionCtx), [nav, permissionCtx]);

  const [page, setPage] = useState<WorkdayPage>('home');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Me: true, Team: true });
  const [hoursInput, setHoursInput] = useState(40);
  const [leaveType, setLeaveType] = useState<LeaveType>('PTO');
  const [leaveHours, setLeaveHours] = useState(8);
  const [leaveStart, setLeaveStart] = useState('2026-03-18');
  const [leaveEnd, setLeaveEnd] = useState('2026-03-18');
  const [leaveReason, setLeaveReason] = useState('Personal time');

  useEffect(() => {
    if (!allowedRoutes.includes(page)) setPage(allowedRoutes[0] ?? 'home');
  }, [allowedRoutes, page]);

  const me = permissionCtx.currentUser;
  const myEmployee = permissionCtx.employeeProfile;

  const myTimesheets = store.timesheets.filter((t) => t.employeeId === myEmployee.id);
  const myLeave = store.leaveRequests.filter((l) => l.employeeId === myEmployee.id);
  const myPay = store.payStubs.filter((p) => p.employeeId === myEmployee.id);
  const myDocuments = store.documents.filter((d) => d.employeeId === myEmployee.id);
  const myCalendar = store.calendarItems.filter((c) => c.employeeId === myEmployee.id);
  const directReports = store.employees.filter((e) => e.managerEmployeeId === myEmployee.id);
  const directReportIds = new Set(directReports.map((d) => d.id));
  const teamTimesheets = permissionCtx.canApproveTeamTime ? store.timesheets.filter((t) => directReportIds.has(t.employeeId)) : [];
  const teamLeave = permissionCtx.canApproveTeamLeave ? store.leaveRequests.filter((l) => directReportIds.has(l.employeeId)) : [];

  return (
    <div className="hcm-shell">
      <aside className="hcm-sidebar">
        <div className="hcm-logo">Workday</div>
        <div className="hcm-subtitle">Workforce Portal</div>
        {nav.filter((n) => n.visible(permissionCtx)).map((n) => {
          if (!n.children) {
            return (
              <button key={n.label} type="button" className={page === n.route ? 'active' : ''} onClick={() => n.route && setPage(n.route)}>{n.label}</button>
            );
          }
          const open = expanded[n.label] ?? false;
          const children = n.children.filter((c) => c.visible(permissionCtx));
          if (children.length === 0) return null;
          return (
            <div key={n.label} className="hcm-nav-group" onMouseEnter={() => setExpanded((p) => ({ ...p, [n.label]: true }))}>
              <button type="button" className="hcm-nav-group-btn" onClick={() => setExpanded((p) => ({ ...p, [n.label]: !open }))}>{n.label}</button>
              {open && (
                <div className="hcm-subnav">
                  {children.map((c) => (
                    <button key={c.label} type="button" className={page === c.route ? 'active' : ''} onClick={() => c.route && setPage(c.route)}>{c.label}</button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </aside>

      <section className="hcm-main">
        <header className="hcm-topbar">
          <input placeholder="Search my workday tasks, documents, and requests" />
          <div className="hcm-top-right">
            <span className="hcm-pill">{fullName}</span>
            <span className="hcm-pill">{myEmployee.jobTitle}</span>
          </div>
        </header>

        <div className="hcm-header">
          <h2>Workday — {page.replace(/-/g, ' ')}</h2>
          <p>{myEmployee.department} · {myEmployee.location} · Worker ID {myEmployee.workerId}</p>
        </div>

        {page === 'home' && (
          <div className="hcm-grid">
            <div className="hcm-card"><h3>My pending timesheets</h3><p className="hcm-kpi">{myTimesheets.filter((t) => t.status === 'pending').length}</p></div>
            <div className="hcm-card"><h3>My pending leave requests</h3><p className="hcm-kpi">{myLeave.filter((l) => l.status === 'pending').length}</p></div>
            <div className="hcm-card"><h3>My required docs</h3><p className="hcm-kpi">{myDocuments.filter((d) => d.status === 'REQUIRED').length}</p></div>
            <div className="hcm-card"><h3>Team approvals</h3><p className="hcm-kpi">{permissionCtx.isManager ? teamTimesheets.length + teamLeave.length : 0}</p></div>
          </div>
        )}

        {page === 'me-profile' && (
          <DataTable
            headers={['Field', 'Value']}
            rows={[
              ['Name', myEmployee.displayName],
              ['Email', myEmployee.email],
              ['Job Title', myEmployee.jobTitle],
              ['Department', myEmployee.department],
              ['Employment Status', myEmployee.employmentStatus.toUpperCase()],
              ['Manager', store.employees.find((e) => e.id === myEmployee.managerEmployeeId)?.displayName ?? '-'],
            ]}
          />
        )}

        {page === 'me-time' && (
          <div className="hcm-stack">
            <div className="hcm-card">
              <h3>Submit weekly hours</h3>
              <div className="hcm-actions">
                <input type="number" value={hoursInput} onChange={(e) => setHoursInput(Number(e.target.value))} />
                <button type="button" onClick={() => store.submitTimesheet(hoursInput)}>Submit Timesheet</button>
              </div>
            </div>
            <DataTable
              headers={['Week', 'Total', 'OT', 'Status', 'Approver']}
              rows={myTimesheets.map((t) => [
                `${t.weekStart} → ${t.weekEnd}`,
                t.totalHours,
                t.overtimeHours,
                t.status.toUpperCase(),
                store.employees.find((e) => e.id === t.approverEmployeeId)?.displayName ?? '-',
              ])}
            />
          </div>
        )}

        {page === 'me-leave' && (
          <div className="hcm-stack">
            <div className="hcm-card">
              <h3>Request Leave</h3>
              <div className="hcm-actions hcm-actions-leave">
                <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)}>
                  {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} />
                <input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} />
                <input type="number" value={leaveHours} onChange={(e) => setLeaveHours(Number(e.target.value))} placeholder="Hours" />
                <input value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Reason" />
                <button type="button" onClick={() => store.requestLeave(leaveType, leaveStart, leaveEnd, leaveHours, leaveReason)}>Submit Leave</button>
              </div>
            </div>
            <DataTable
              headers={['Type', 'Dates', 'Hours', 'Status', 'Approver']}
              rows={myLeave.map((l) => [l.type, `${l.startDate} → ${l.endDate}`, l.hours, l.status.toUpperCase(), store.employees.find((e) => e.id === l.approverEmployeeId)?.displayName ?? '-'])}
            />
          </div>
        )}

        {page === 'me-pay' && (
          <DataTable
            headers={['Pay Date', 'Gross', 'Deductions', 'Net']}
            rows={myPay.map((p) => [p.payDate, `$${p.grossUSD.toLocaleString()}`, `$${p.deductionsUSD.toLocaleString()}`, `$${p.netUSD.toLocaleString()}`])}
          />
        )}

        {page === 'me-documents' && (
          <DataTable headers={['Document', 'Status', 'Due Date']} rows={myDocuments.map((d) => [d.name, d.status, d.dueDate ?? '-'])} />
        )}

        {page === 'me-calendar' && (
          <DataTable headers={['Date', 'Event', 'Category']} rows={myCalendar.map((c) => [c.date, c.title, c.category])} />
        )}

        {page === 'team-directory' && permissionCtx.isManager && (
          <DataTable headers={['Worker', 'Title', 'Department', 'Status']} rows={directReports.map((d) => [d.displayName, d.jobTitle, d.department, d.employmentStatus.toUpperCase()])} />
        )}

        {page === 'team-timesheets' && permissionCtx.canApproveTeamTime && (
          <DataTable
            headers={['Worker', 'Week', 'Hours', 'Status', 'Action']}
            rows={teamTimesheets.map((t) => [
              store.employees.find((e) => e.id === t.employeeId)?.displayName ?? '-',
              `${t.weekStart} → ${t.weekEnd}`,
              t.totalHours,
              t.status.toUpperCase(),
              t.status === 'pending'
                ? <div className="hcm-inline-actions"><button type="button" onClick={() => store.approveTimesheet(t.id, 'approved')}>Approve</button><button type="button" onClick={() => store.approveTimesheet(t.id, 'rejected')}>Reject</button></div>
                : 'Finalized',
            ])}
          />
        )}

        {page === 'team-leave' && permissionCtx.canApproveTeamLeave && (
          <DataTable
            headers={['Worker', 'Type', 'Dates', 'Hours', 'Status', 'Action']}
            rows={teamLeave.map((l) => [
              store.employees.find((e) => e.id === l.employeeId)?.displayName ?? '-',
              l.type,
              `${l.startDate} → ${l.endDate}`,
              l.hours,
              l.status.toUpperCase(),
              l.status === 'pending'
                ? <div className="hcm-inline-actions"><button type="button" onClick={() => store.approveLeave(l.id, 'approved')}>Approve</button><button type="button" onClick={() => store.approveLeave(l.id, 'rejected')}>Reject</button></div>
                : 'Finalized',
            ])}
          />
        )}

        {page === 'hr-core' && permissionCtx.canAccessHR && (
          <DataTable
            headers={['Worker ID', 'Name', 'Title', 'Department', 'Manager', 'Status']}
            rows={store.employees.map((e) => [e.workerId, e.displayName, e.jobTitle, e.department, store.employees.find((m) => m.id === e.managerEmployeeId)?.displayName ?? '-', e.employmentStatus.toUpperCase()])}
          />
        )}

        {page === 'hr-recruiting' && permissionCtx.canAccessHR && <div className="hcm-card hcm-stack-card">Recruiting pipeline view available for HR roles.</div>}
        {page === 'hr-onboarding' && permissionCtx.canAccessHR && <div className="hcm-card hcm-stack-card">Onboarding and offboarding administration for HR roles.</div>}
        {page === 'hr-compliance' && permissionCtx.canAccessHR && <div className="hcm-card hcm-stack-card">Compliance packet oversight for HR/legal roles.</div>}

        {(page === 'payroll-runs' || page === 'payroll-adjustments' || page === 'payroll-statements') && permissionCtx.canAccessPayroll && (
          <div className="hcm-card hcm-stack-card">Payroll admin console scoped to authorized payroll roles only.</div>
        )}

        {page === 'admin-org' && permissionCtx.roleFlags.canAccessAdmin && <div className="hcm-card hcm-stack-card">Admin org structure controls.</div>}
        {page === 'admin-roles' && permissionCtx.roleFlags.canAccessAdmin && <div className="hcm-card hcm-stack-card">Role and permission set management.</div>}
        {page === 'admin-settings' && permissionCtx.roleFlags.canAccessAdmin && <div className="hcm-card hcm-stack-card">System settings and module flags.</div>}

        {page === 'admin-audit' && permissionCtx.roleFlags.canAccessAdmin && (
          <DataTable
            headers={['At', 'Actor', 'Action', 'Entity', 'Detail']}
            rows={store.auditEvents.map((a) => [new Date(a.at).toLocaleString(), store.users.find((u) => u.id === a.actorUserId)?.displayName ?? a.actorUserId, a.action, `${a.entityType}:${a.entityId}`, a.detail])}
          />
        )}
      </section>
    </div>
  );
}
