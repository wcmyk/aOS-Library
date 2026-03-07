import { useMemo, useState } from 'react';
import { useHcmStore, type HcmRole } from '../../../state/useHcmStore';

type HcmModule = 'dashboard' | 'core_hr' | 'org' | 'recruiting' | 'onboarding' | 'time' | 'leave' | 'payroll' | 'compensation' | 'legal' | 'calendar' | 'approvals' | 'analytics' | 'audit';

const MODULES: Array<{ key: HcmModule; label: string }> = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'core_hr', label: 'Core HR' },
  { key: 'org', label: 'Org Structure' },
  { key: 'recruiting', label: 'Recruiting' },
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'time', label: 'Time & Attendance' },
  { key: 'leave', label: 'Leave Management' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'compensation', label: 'Compensation' },
  { key: 'legal', label: 'Legal & Compliance' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'audit', label: 'Audit Trail' },
];

function canViewRole(current: HcmRole, module: HcmModule): boolean {
  if (current === 'super_admin') return true;
  if (module === 'payroll') return ['payroll_admin', 'finance_admin', 'hrbp', 'manager'].includes(current);
  if (module === 'compensation') return ['finance_admin', 'hrbp', 'manager', 'executive'].includes(current);
  if (module === 'legal') return ['legal_admin', 'hrbp', 'super_admin'].includes(current);
  if (module === 'analytics') return ['executive', 'finance_admin', 'hrbp', 'super_admin', 'manager'].includes(current);
  return true;
}

function DataTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | number>> }) {
  return (
    <div className="hcm-table-wrap">
      <table className="hcm-table">
        <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={`${i}-${j}`}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function WorkdaySite() {
  const store = useHcmStore();
  const [moduleKey, setModuleKey] = useState<HcmModule>('dashboard');

  const me = useMemo(() => store.users.find((u) => u.id === store.currentUserId) ?? store.users[0], [store.currentUserId, store.users]);

  const visibleModules = MODULES.filter((m) => canViewRole(me.role, m.key));
  const activeModule = visibleModules.find((m) => m.key === moduleKey) ? moduleKey : visibleModules[0]?.key ?? 'dashboard';

  const kpis = {
    headcount: store.employees.filter((e) => e.status === 'active').length,
    openRequisitions: store.requisitions.filter((r) => r.status === 'open').length,
    pendingApprovals: store.approvals.filter((a) => a.status === 'pending').length,
    complianceRisk: store.legalPackets.filter((p) => p.status !== 'completed').length,
  };

  return (
    <div className="hcm-shell">
      <aside className="hcm-sidebar">
        <div className="hcm-logo">AsterHCM</div>
        <div className="hcm-subtitle">Enterprise Workforce OS</div>
        <label className="hcm-user-switch">Act as role
          <select value={store.currentUserId} onChange={(e) => store.setCurrentUser(e.target.value)}>
            {store.users.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.role}</option>)}
          </select>
        </label>
        {visibleModules.map((m) => (
          <button key={m.key} className={activeModule === m.key ? 'active' : ''} type="button" onClick={() => setModuleKey(m.key)}>{m.label}</button>
        ))}
      </aside>

      <section className="hcm-main">
        <header className="hcm-topbar">
          <input placeholder="Search workers, requisitions, approvals, legal packets" />
          <div className="hcm-top-right">
            <span className="hcm-pill">{me.name}</span>
            <span className="hcm-pill">{me.role}</span>
          </div>
        </header>

        <div className="hcm-header">
          <h2>{MODULES.find((m) => m.key === activeModule)?.label}</h2>
          <p>Legal Entity: Aster US LLC · Region: US · Environment: Production Simulation</p>
        </div>

        {activeModule === 'dashboard' && (
          <div className="hcm-grid">
            <div className="hcm-card"><h3>Headcount</h3><p className="hcm-kpi">{kpis.headcount}</p></div>
            <div className="hcm-card"><h3>Open Requisitions</h3><p className="hcm-kpi">{kpis.openRequisitions}</p></div>
            <div className="hcm-card"><h3>Pending Approvals</h3><p className="hcm-kpi">{kpis.pendingApprovals}</p></div>
            <div className="hcm-card"><h3>Compliance Risk Packets</h3><p className="hcm-kpi">{kpis.complianceRisk}</p></div>
            <div className="hcm-card hcm-span-2">
              <h3>Workflow Engine Actions</h3>
              <div className="hcm-actions">
                <button type="button" onClick={store.runHiringFlow}>Flow 1: Hiring → Employee</button>
                <button type="button" onClick={store.runCompChangeFlow}>Flow 2: Compensation Change</button>
                <button type="button" onClick={store.runTimePayrollFlow}>Flow 3: Time → Payroll</button>
                <button type="button" onClick={store.runLeaveFlow}>Flow 4: Leave Request</button>
                <button type="button" onClick={store.runLegalPacketFlow}>Flow 5: Legal Packet</button>
                <button type="button" onClick={store.runTerminationFlow}>Flow 6: Termination</button>
              </div>
            </div>
          </div>
        )}

        {activeModule === 'core_hr' && (
          <DataTable
            headers={['Worker ID', 'Name', 'Status', 'Department', 'Title', 'Manager', 'Type', 'Work Mode', 'Salary (USD)']}
            rows={store.employees.map((e) => [
              e.workerId,
              e.fullName,
              e.status,
              e.department,
              e.title,
              store.employees.find((m) => m.id === e.managerId)?.fullName ?? '-',
              e.employmentType,
              e.workMode,
              e.baseSalaryUSD.toLocaleString(),
            ])}
          />
        )}

        {activeModule === 'org' && (
          <DataTable
            headers={['Legal Entity', 'Business Unit', 'Department', 'Team', 'Cost Center', 'Worker']}
            rows={store.employees.map((e) => [e.legalEntity, e.businessUnit, e.department, e.team, e.costCenter, e.fullName])}
          />
        )}

        {activeModule === 'recruiting' && (
          <div className="hcm-stack">
            <DataTable
              headers={['Requisition', 'Department', 'Headcount', 'Status', 'Hiring Manager']}
              rows={store.requisitions.map((r) => [r.title, r.department, r.headcount, r.status, store.employees.find((e) => e.id === r.hiringManagerEmployeeId)?.fullName ?? '-'])}
            />
            <DataTable
              headers={['Candidate', 'Requisition', 'Stage', 'Offer Status']}
              rows={store.candidates.map((c) => [c.name, store.requisitions.find((r) => r.id === c.requisitionId)?.title ?? '-', c.stage, store.offers.find((o) => o.candidateId === c.id)?.status ?? '-'])}
            />
          </div>
        )}

        {activeModule === 'onboarding' && (
          <div className="hcm-stack">
            <DataTable
              headers={['Task', 'Employee', 'Owner Role', 'Due Date', 'Status']}
              rows={store.onboardingTasks.map((t) => [t.name, store.employees.find((e) => e.id === t.employeeId)?.fullName ?? '-', t.ownerRole, t.dueDate, t.status])}
            />
            <DataTable
              headers={['Offboarding Task', 'Employee', 'Owner Role', 'Due Date', 'Status']}
              rows={store.offboardingTasks.map((t) => [t.name, store.employees.find((e) => e.id === t.employeeId)?.fullName ?? '-', t.ownerRole, t.dueDate, t.status])}
            />
          </div>
        )}

        {activeModule === 'time' && (
          <div className="hcm-stack">
            <DataTable
              headers={['Timesheet', 'Employee', 'Week', 'Total Hours', 'Overtime', 'Status']}
              rows={store.timesheets.map((t) => [t.id, store.employees.find((e) => e.id === t.employeeId)?.fullName ?? '-', `${t.weekStart} → ${t.weekEnd}`, t.totalHours, t.overtimeHours, t.status])}
            />
            <DataTable
              headers={['Date', 'Employee', 'Hours', 'OT', 'Cost Center']}
              rows={store.timeEntries.map((e) => [e.date, store.employees.find((w) => w.id === e.employeeId)?.fullName ?? '-', e.hours, e.overtimeHours, e.costCenter])}
            />
          </div>
        )}

        {activeModule === 'leave' && (
          <div className="hcm-stack">
            <DataTable
              headers={['Request', 'Employee', 'Type', 'Dates', 'Hours', 'Status']}
              rows={store.leaveRequests.map((r) => [r.id, store.employees.find((e) => e.id === r.employeeId)?.fullName ?? '-', r.type, `${r.startDate} → ${r.endDate}`, r.hours, r.status])}
            />
            <DataTable
              headers={['Employee', 'Balance Type', 'Balance Hours', 'Carryover']}
              rows={store.leaveBalances.map((b) => [store.employees.find((e) => e.id === b.employeeId)?.fullName ?? '-', b.type, b.balanceHours, b.carryoverHours])}
            />
          </div>
        )}

        {activeModule === 'payroll' && (
          <div className="hcm-stack">
            <DataTable
              headers={['Pay Period', 'Pay Group', 'Dates', 'Lock Status']}
              rows={store.payPeriods.map((p) => [p.id, p.payGroup, `${p.startDate} → ${p.endDate}`, p.lockStatus])}
            />
            <DataTable
              headers={['Payroll Run', 'Status', 'Gross', 'Deductions', 'Net']}
              rows={store.payrollRuns.map((r) => [r.id, r.status, `$${r.grossPayUSD.toLocaleString()}`, `$${r.deductionsUSD.toLocaleString()}`, `$${r.netPayUSD.toLocaleString()}`])}
            />
          </div>
        )}

        {activeModule === 'compensation' && (
          <DataTable
            headers={['Employee', 'Effective Date', 'Base Salary', 'Bonus Target %', 'Compa Ratio', 'Reason']}
            rows={store.compensationRecords.map((c) => [store.employees.find((e) => e.id === c.employeeId)?.fullName ?? '-', c.effectiveDate, `$${c.baseSalaryUSD.toLocaleString()}`, c.bonusTargetPct, c.compaRatio.toFixed(2), c.changeReason])}
          />
        )}

        {activeModule === 'legal' && (
          <div className="hcm-stack">
            <DataTable
              headers={['Template', 'Version', 'Region', 'Retention (years)']}
              rows={store.legalTemplates.map((t) => [t.name, t.version, t.region, t.retentionYears])}
            />
            <DataTable
              headers={['Packet', 'Employee', 'Status', 'Due Date', 'Document Count']}
              rows={store.legalPackets.map((p) => [p.id, store.employees.find((e) => e.id === p.employeeId)?.fullName ?? '-', p.status, p.dueDate, p.documentIds.length])}
            />
            <DataTable
              headers={['Document', 'Employee', 'Template', 'Status', 'Signed At']}
              rows={store.legalDocuments.map((d) => [d.id, store.employees.find((e) => e.id === d.employeeId)?.fullName ?? '-', store.legalTemplates.find((t) => t.id === d.templateId)?.name ?? '-', d.status, d.signedAt ?? '-'])}
            />
          </div>
        )}

        {activeModule === 'calendar' && (
          <DataTable
            headers={['Date', 'Event', 'Category']}
            rows={store.events.map((e) => [e.date, e.title, e.category])}
          />
        )}

        {activeModule === 'approvals' && (
          <DataTable
            headers={['Type', 'Title', 'Status', 'Requester', 'Approver', 'Due Date']}
            rows={store.approvals.map((a) => [
              a.type,
              a.title,
              a.status,
              store.employees.find((e) => e.id === a.requesterEmployeeId)?.fullName ?? '-',
              store.employees.find((e) => e.id === a.approverEmployeeId)?.fullName ?? '-',
              a.dueDate,
            ])}
          />
        )}

        {activeModule === 'analytics' && (
          <div className="hcm-grid">
            <div className="hcm-card"><h3>Active Workforce by Department</h3>{Array.from(new Set(store.employees.map((e) => e.department))).map((d) => <div key={d} className="hcm-row">{d} <span>{store.employees.filter((e) => e.department === d && e.status === 'active').length}</span></div>)}</div>
            <div className="hcm-card"><h3>Payroll Cost Snapshot</h3><p className="hcm-kpi">${store.payrollRuns.reduce((a, r) => a + r.netPayUSD, 0).toLocaleString()}</p></div>
            <div className="hcm-card"><h3>Approval Backlog by Type</h3>{Array.from(new Set(store.approvals.map((a) => a.type))).map((t) => <div key={t} className="hcm-row">{t}<span>{store.approvals.filter((a) => a.type === t && a.status === 'pending').length}</span></div>)}</div>
            <div className="hcm-card"><h3>Leave Utilization</h3>{store.leaveBalances.map((b) => <div key={b.id} className="hcm-row">{b.type.toUpperCase()}<span>{b.balanceHours}h</span></div>)}</div>
          </div>
        )}

        {activeModule === 'audit' && (
          <DataTable
            headers={['Timestamp', 'Actor', 'Action', 'Entity', 'Detail']}
            rows={store.auditEvents.map((a) => [new Date(a.at).toLocaleString(), store.users.find((u) => u.id === a.actorUserId)?.name ?? a.actorUserId, a.action, `${a.entityType}:${a.entityId}`, a.detail])}
          />
        )}
      </section>
    </div>
  );
}
