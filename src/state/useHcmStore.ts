import { create } from 'zustand';

export type HcmRole =
  | 'employee'
  | 'manager'
  | 'hrbp'
  | 'recruiter'
  | 'payroll_admin'
  | 'finance_admin'
  | 'legal_admin'
  | 'benefits_admin'
  | 'it_admin'
  | 'executive'
  | 'super_admin';

export type EmploymentStatus = 'applicant' | 'active' | 'leave' | 'terminated' | 'alumni';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type HcmUser = { id: string; name: string; email: string; role: HcmRole; employeeId?: string };
export type Employee = {
  id: string;
  workerId: string;
  fullName: string;
  legalEntity: string;
  businessUnit: string;
  department: string;
  team: string;
  costCenter: string;
  managerId?: string;
  title: string;
  level: string;
  employmentType: 'full_time' | 'part_time' | 'contractor' | 'intern' | 'temp';
  workMode: 'onsite' | 'hybrid' | 'remote';
  location: string;
  startDate: string;
  endDate?: string;
  status: EmploymentStatus;
  baseSalaryUSD: number;
  emergencyContact: string;
};

export type JobRequisition = { id: string; title: string; department: string; headcount: number; status: 'draft'|'pending_approval'|'approved'|'open'|'closed'; hiringManagerEmployeeId: string };
export type Candidate = { id: string; requisitionId: string; name: string; stage: 'screen'|'interview'|'offer'|'accepted'|'rejected' };
export type Offer = { id: string; candidateId: string; baseSalaryUSD: number; status: 'draft'|'pending_approval'|'approved'|'accepted'|'declined' };

export type OnboardingTask = { id: string; employeeId: string; name: string; ownerRole: HcmRole; dueDate: string; status: 'todo'|'in_progress'|'done' };
export type OffboardingTask = { id: string; employeeId: string; name: string; ownerRole: HcmRole; dueDate: string; status: 'todo'|'in_progress'|'done' };

export type TimeEntry = { id: string; employeeId: string; date: string; hours: number; overtimeHours: number; costCenter: string };
export type Timesheet = { id: string; employeeId: string; weekStart: string; weekEnd: string; status: ApprovalStatus; totalHours: number; overtimeHours: number };

export type LeaveBalance = { id: string; employeeId: string; type: 'pto'|'sick'|'unpaid'|'parental'; balanceHours: number; carryoverHours: number };
export type LeaveRequest = { id: string; employeeId: string; type: LeaveBalance['type']; startDate: string; endDate: string; hours: number; status: ApprovalStatus; reason: string };

export type CompensationRecord = { id: string; employeeId: string; effectiveDate: string; baseSalaryUSD: number; bonusTargetPct: number; compaRatio: number; changeReason: string };
export type PayPeriod = { id: string; payGroup: string; startDate: string; endDate: string; lockStatus: 'open'|'locked' };
export type PayrollRun = { id: string; payPeriodId: string; status: 'draft'|'preview'|'approved'|'finalized'; grossPayUSD: number; deductionsUSD: number; netPayUSD: number };

export type LegalFormTemplate = { id: string; name: string; version: number; region: string; retentionYears: number };
export type LegalDocument = { id: string; employeeId: string; templateId: string; status: 'required'|'completed'|'flagged'; signedAt?: string };
export type LegalPacket = { id: string; employeeId: string; status: 'assigned'|'in_progress'|'completed'|'non_compliant'; dueDate: string; documentIds: string[] };

export type ApprovalRequest = { id: string; type: 'hiring'|'comp_change'|'timesheet'|'leave'|'legal'|'termination'|'payroll'; title: string; status: ApprovalStatus; requesterEmployeeId?: string; approverEmployeeId?: string; dueDate: string };
export type CalendarEvent = { id: string; title: string; date: string; category: 'payroll'|'leave'|'review'|'interview'|'compliance' };
export type Notification = { id: string; userId: string; text: string; read: boolean; createdAt: string };
export type AuditEvent = { id: string; at: string; actorUserId: string; action: string; entityType: string; entityId: string; detail: string };

type HcmState = {
  users: HcmUser[];
  employees: Employee[];
  requisitions: JobRequisition[];
  candidates: Candidate[];
  offers: Offer[];
  onboardingTasks: OnboardingTask[];
  offboardingTasks: OffboardingTask[];
  timeEntries: TimeEntry[];
  timesheets: Timesheet[];
  leaveBalances: LeaveBalance[];
  leaveRequests: LeaveRequest[];
  compensationRecords: CompensationRecord[];
  payPeriods: PayPeriod[];
  payrollRuns: PayrollRun[];
  legalTemplates: LegalFormTemplate[];
  legalDocuments: LegalDocument[];
  legalPackets: LegalPacket[];
  approvals: ApprovalRequest[];
  events: CalendarEvent[];
  notifications: Notification[];
  auditEvents: AuditEvent[];
  currentUserId: string;
  setCurrentUser: (id: string) => void;
  runHiringFlow: () => void;
  runCompChangeFlow: () => void;
  runTimePayrollFlow: () => void;
  runLeaveFlow: () => void;
  runLegalPacketFlow: () => void;
  runTerminationFlow: () => void;
};

const seedEmployees: Employee[] = [
  { id: 'e1', workerId: 'W-1001', fullName: 'Malik Hartwell', legalEntity: 'Aster US LLC', businessUnit: 'Technology', department: 'Platform Engineering', team: 'Workflow Platform', costCenter: 'CC-ENG-120', managerId: 'e5', title: 'Engineering Manager', level: 'M3', employmentType: 'full_time', workMode: 'hybrid', location: 'San Francisco, CA', startDate: '2022-05-01', status: 'active', baseSalaryUSD: 210000, emergencyContact: 'Nia Hartwell' },
  { id: 'e2', workerId: 'W-1002', fullName: 'Elena Vasquez', legalEntity: 'Aster US LLC', businessUnit: 'Risk', department: 'Enterprise Risk', team: 'Risk Controls', costCenter: 'CC-RSK-220', managerId: 'e6', title: 'Risk Analyst', level: 'IC5', employmentType: 'full_time', workMode: 'remote', location: 'Boston, MA', startDate: '2021-09-12', status: 'active', baseSalaryUSD: 168000, emergencyContact: 'Jules Vasquez' },
  { id: 'e3', workerId: 'W-1003', fullName: 'Rohan Iyer', legalEntity: 'Aster US LLC', businessUnit: 'Compliance', department: 'Compliance Operations', team: 'Regulatory Controls', costCenter: 'CC-CMP-340', managerId: 'e6', title: 'Compliance Reviewer', level: 'IC4', employmentType: 'full_time', workMode: 'onsite', location: 'New York, NY', startDate: '2023-01-20', status: 'active', baseSalaryUSD: 142000, emergencyContact: 'Maya Iyer' },
  { id: 'e4', workerId: 'W-1004', fullName: 'Sophia Chen', legalEntity: 'Aster US LLC', businessUnit: 'Marketing', department: 'Marketing Operations', team: 'Campaign Intake', costCenter: 'CC-MKT-410', managerId: 'e5', title: 'Marketing Ops Specialist', level: 'IC4', employmentType: 'full_time', workMode: 'hybrid', location: 'Austin, TX', startDate: '2022-11-10', status: 'active', baseSalaryUSD: 126000, emergencyContact: 'Noah Chen' },
  { id: 'e5', workerId: 'W-0901', fullName: 'Priya Thornton', legalEntity: 'Aster US LLC', businessUnit: 'Operations', department: 'PMO', team: 'Program Governance', costCenter: 'CC-PMO-100', title: 'Director, Program Operations', level: 'D1', employmentType: 'full_time', workMode: 'hybrid', location: 'Seattle, WA', startDate: '2019-03-02', status: 'active', baseSalaryUSD: 245000, emergencyContact: 'Arun Thornton' },
  { id: 'e6', workerId: 'W-0902', fullName: 'Nora Patel', legalEntity: 'Aster US LLC', businessUnit: 'People Operations', department: 'HR', team: 'HRBP', costCenter: 'CC-HR-001', title: 'HR Business Partner', level: 'M2', employmentType: 'full_time', workMode: 'remote', location: 'Chicago, IL', startDate: '2020-07-15', status: 'active', baseSalaryUSD: 188000, emergencyContact: 'Ari Patel' },
];

const seedUsers: HcmUser[] = [
  { id: 'u1', name: 'Malik Hartwell', email: 'malik@asterhcm.local', role: 'manager', employeeId: 'e1' },
  { id: 'u2', name: 'Elena Vasquez', email: 'elena@asterhcm.local', role: 'employee', employeeId: 'e2' },
  { id: 'u3', name: 'Rohan Iyer', email: 'rohan@asterhcm.local', role: 'legal_admin', employeeId: 'e3' },
  { id: 'u4', name: 'Sophia Chen', email: 'sophia@asterhcm.local', role: 'employee', employeeId: 'e4' },
  { id: 'u5', name: 'Priya Thornton', email: 'priya@asterhcm.local', role: 'super_admin', employeeId: 'e5' },
  { id: 'u6', name: 'Nora Patel', email: 'nora@asterhcm.local', role: 'hrbp', employeeId: 'e6' },
  { id: 'u7', name: 'Darius Kim', email: 'darius@asterhcm.local', role: 'payroll_admin' },
  { id: 'u8', name: 'Leila Moran', email: 'leila@asterhcm.local', role: 'recruiter' },
];

const nowIso = () => new Date().toISOString();

function addAudit(state: HcmState, action: string, entityType: string, entityId: string, detail: string): AuditEvent[] {
  return [
    {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      at: nowIso(),
      actorUserId: state.currentUserId,
      action,
      entityType,
      entityId,
      detail,
    },
    ...state.auditEvents,
  ];
}

export const useHcmStore = create<HcmState>((set) => ({
  users: seedUsers,
  employees: seedEmployees,
  requisitions: [
    { id: 'req-1', title: 'Senior Backend Engineer', department: 'Platform Engineering', headcount: 2, status: 'open', hiringManagerEmployeeId: 'e1' },
  ],
  candidates: [
    { id: 'cand-1', requisitionId: 'req-1', name: 'Iris Delgado', stage: 'offer' },
  ],
  offers: [
    { id: 'off-1', candidateId: 'cand-1', baseSalaryUSD: 186000, status: 'approved' },
  ],
  onboardingTasks: [
    { id: 'on-1', employeeId: 'e2', name: 'Complete security training', ownerRole: 'employee', dueDate: '2026-03-15', status: 'in_progress' },
    { id: 'on-2', employeeId: 'e2', name: 'Manager 30-day check-in', ownerRole: 'manager', dueDate: '2026-03-30', status: 'todo' },
  ],
  offboardingTasks: [],
  timeEntries: [
    { id: 'te-1', employeeId: 'e2', date: '2026-03-03', hours: 8, overtimeHours: 1, costCenter: 'CC-RSK-220' },
    { id: 'te-2', employeeId: 'e2', date: '2026-03-04', hours: 8, overtimeHours: 0, costCenter: 'CC-RSK-220' },
  ],
  timesheets: [
    { id: 'ts-1', employeeId: 'e2', weekStart: '2026-03-02', weekEnd: '2026-03-08', status: 'pending', totalHours: 41, overtimeHours: 1 },
  ],
  leaveBalances: [
    { id: 'lb-1', employeeId: 'e2', type: 'pto', balanceHours: 92, carryoverHours: 12 },
    { id: 'lb-2', employeeId: 'e2', type: 'sick', balanceHours: 40, carryoverHours: 0 },
  ],
  leaveRequests: [
    { id: 'lr-1', employeeId: 'e2', type: 'pto', startDate: '2026-04-12', endDate: '2026-04-14', hours: 24, status: 'pending', reason: 'Family travel' },
  ],
  compensationRecords: [
    { id: 'cr-1', employeeId: 'e2', effectiveDate: '2026-01-01', baseSalaryUSD: 168000, bonusTargetPct: 12, compaRatio: 0.97, changeReason: 'Annual merit' },
  ],
  payPeriods: [
    { id: 'pp-1', payGroup: 'US Biweekly', startDate: '2026-03-01', endDate: '2026-03-15', lockStatus: 'open' },
  ],
  payrollRuns: [
    { id: 'pr-1', payPeriodId: 'pp-1', status: 'preview', grossPayUSD: 550000, deductionsUSD: 132000, netPayUSD: 418000 },
  ],
  legalTemplates: [
    { id: 'lt-1', name: 'US Employee NDA', version: 4, region: 'US', retentionYears: 7 },
    { id: 'lt-2', name: 'Code of Conduct Acknowledgement', version: 9, region: 'Global', retentionYears: 7 },
  ],
  legalDocuments: [
    { id: 'ld-1', employeeId: 'e2', templateId: 'lt-1', status: 'completed', signedAt: '2026-03-01T09:00:00Z' },
    { id: 'ld-2', employeeId: 'e2', templateId: 'lt-2', status: 'required' },
  ],
  legalPackets: [
    { id: 'lp-1', employeeId: 'e2', status: 'in_progress', dueDate: '2026-03-12', documentIds: ['ld-1', 'ld-2'] },
  ],
  approvals: [
    { id: 'ap-1', type: 'leave', title: 'PTO Request — Elena Vasquez', status: 'pending', requesterEmployeeId: 'e2', approverEmployeeId: 'e6', dueDate: '2026-03-08' },
    { id: 'ap-2', type: 'timesheet', title: 'Timesheet Approval — Week 2026-03-02', status: 'pending', requesterEmployeeId: 'e2', approverEmployeeId: 'e6', dueDate: '2026-03-09' },
  ],
  events: [
    { id: 'ev-1', title: 'Payroll deadline', date: '2026-03-14', category: 'payroll' },
    { id: 'ev-2', title: 'Compliance packet due', date: '2026-03-12', category: 'compliance' },
  ],
  notifications: [
    { id: 'nt-1', userId: 'u6', text: 'You have 2 pending approvals.', read: false, createdAt: '2026-03-07T09:00:00Z' },
  ],
  auditEvents: [],
  currentUserId: 'u6',
  setCurrentUser: (id) => set({ currentUserId: id }),

  runHiringFlow: () =>
    set((state) => {
      const newCandidate: Candidate = { id: `cand-${Date.now()}`, requisitionId: state.requisitions[0]?.id ?? 'req-1', name: 'Jordan Rivera', stage: 'accepted' };
      const newEmployee: Employee = {
        id: `e-${Date.now()}`,
        workerId: `W-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: newCandidate.name,
        legalEntity: 'Aster US LLC', businessUnit: 'Technology', department: 'Platform Engineering', team: 'Workflow Platform', costCenter: 'CC-ENG-120',
        managerId: 'e1', title: 'Software Engineer II', level: 'IC3', employmentType: 'full_time', workMode: 'hybrid', location: 'San Francisco, CA', startDate: '2026-04-01', status: 'active', baseSalaryUSD: 154000, emergencyContact: 'Pending',
      };
      return {
        candidates: [newCandidate, ...state.candidates],
        employees: [newEmployee, ...state.employees],
        onboardingTasks: [
          { id: `on-${Date.now()}-1`, employeeId: newEmployee.id, name: 'I-9 verification', ownerRole: 'hrbp', dueDate: '2026-04-02', status: 'todo' },
          { id: `on-${Date.now()}-2`, employeeId: newEmployee.id, name: 'Equipment provisioning', ownerRole: 'it_admin', dueDate: '2026-03-30', status: 'todo' },
          ...state.onboardingTasks,
        ],
        approvals: state.approvals.map((a) => a.type === 'hiring' ? { ...a, status: 'approved' } : a),
        auditEvents: addAudit(state, 'hiring_flow_completed', 'employee', newEmployee.id, 'Candidate converted to employee and onboarding packet initialized'),
      };
    }),

  runCompChangeFlow: () =>
    set((state) => {
      const target = state.employees.find((e) => e.id === 'e2') ?? state.employees[0];
      const newSalary = target.baseSalaryUSD + 12000;
      return {
        employees: state.employees.map((e) => (e.id === target.id ? { ...e, baseSalaryUSD: newSalary } : e)),
        compensationRecords: [
          {
            id: `cr-${Date.now()}`,
            employeeId: target.id,
            effectiveDate: '2026-04-01',
            baseSalaryUSD: newSalary,
            bonusTargetPct: 14,
            compaRatio: 1.02,
            changeReason: 'Promotion + merit',
          },
          ...state.compensationRecords,
        ],
        approvals: state.approvals.map((a) => (a.type === 'comp_change' ? { ...a, status: 'approved' } : a)),
        auditEvents: addAudit(state, 'comp_change_approved', 'compensation_record', target.id, `Salary adjusted to ${newSalary}`),
      };
    }),

  runTimePayrollFlow: () =>
    set((state) => {
      const updatedTimesheets = state.timesheets.map((t) => ({ ...t, status: 'approved' as ApprovalStatus }));
      const updatedRun = state.payrollRuns.map((run) => ({ ...run, status: 'approved' as const }));
      return {
        timesheets: updatedTimesheets,
        payrollRuns: updatedRun,
        approvals: state.approvals.map((a) => (a.type === 'timesheet' || a.type === 'payroll' ? { ...a, status: 'approved' } : a)),
        auditEvents: addAudit(state, 'payroll_flow_processed', 'payroll_run', state.payrollRuns[0]?.id ?? 'pr-1', 'Timesheets approved and payroll moved to approved state'),
      };
    }),

  runLeaveFlow: () =>
    set((state) => {
      const req = state.leaveRequests[0];
      if (!req) return state;
      const balances = state.leaveBalances.map((b) => (b.employeeId === req.employeeId && b.type === req.type ? { ...b, balanceHours: Math.max(0, b.balanceHours - req.hours) } : b));
      return {
        leaveRequests: state.leaveRequests.map((r) => (r.id === req.id ? { ...r, status: 'approved' } : r)),
        leaveBalances: balances,
        events: [{ id: `ev-${Date.now()}`, title: `Leave approved: ${req.startDate} to ${req.endDate}`, date: req.startDate, category: 'leave' }, ...state.events],
        approvals: state.approvals.map((a) => (a.type === 'leave' ? { ...a, status: 'approved' } : a)),
        auditEvents: addAudit(state, 'leave_request_approved', 'leave_request', req.id, `Approved ${req.hours}h ${req.type}`),
      };
    }),

  runLegalPacketFlow: () =>
    set((state) => {
      const packet = state.legalPackets[0];
      if (!packet) return state;
      return {
        legalDocuments: state.legalDocuments.map((d) => (packet.documentIds.includes(d.id) ? { ...d, status: 'completed', signedAt: d.signedAt ?? nowIso() } : d)),
        legalPackets: state.legalPackets.map((p) => (p.id === packet.id ? { ...p, status: 'completed' } : p)),
        approvals: state.approvals.map((a) => (a.type === 'legal' ? { ...a, status: 'approved' } : a)),
        auditEvents: addAudit(state, 'legal_packet_completed', 'legal_packet', packet.id, 'All required forms completed and compliance state updated'),
      };
    }),

  runTerminationFlow: () =>
    set((state) => {
      const target = state.employees.find((e) => e.id === 'e4') ?? state.employees[0];
      return {
        employees: state.employees.map((e) => (e.id === target.id ? { ...e, status: 'alumni', endDate: '2026-03-31' } : e)),
        offboardingTasks: [
          { id: `off-${Date.now()}-1`, employeeId: target.id, name: 'Asset return confirmation', ownerRole: 'it_admin', dueDate: '2026-03-31', status: 'todo' },
          { id: `off-${Date.now()}-2`, employeeId: target.id, name: 'Final pay verification', ownerRole: 'payroll_admin', dueDate: '2026-04-02', status: 'todo' },
          ...state.offboardingTasks,
        ],
        approvals: state.approvals.map((a) => (a.type === 'termination' ? { ...a, status: 'approved' } : a)),
        auditEvents: addAudit(state, 'termination_processed', 'employee', target.id, 'Employee moved to alumni and offboarding tasks generated'),
      };
    }),
}));
