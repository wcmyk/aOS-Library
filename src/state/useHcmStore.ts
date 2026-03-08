import { create } from 'zustand';

export type HcmRole = 'employee' | 'manager' | 'hrbp' | 'payroll_admin' | 'legal_admin' | 'admin';
export type EmploymentStatus = 'active' | 'leave' | 'terminated' | 'alumni';
export type LeaveType = 'PTO' | 'SICK' | 'UNPAID' | 'BEREAVEMENT' | 'JURY DUTY' | 'PARENTAL';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type PermissionSet = {
  canAccessHR: boolean;
  canAccessPayroll: boolean;
  canAccessLegal: boolean;
  canAccessAdmin: boolean;
  canAccessAnalytics: boolean;
  canApproveTeamTime: boolean;
  canApproveTeamLeave: boolean;
};

export type HcmUser = {
  id: string;
  employeeId: string;
  displayName: string;
  email: string;
  roleType: HcmRole;
  permissions: PermissionSet;
};

export type Employee = {
  id: string;
  workerId: string;
  userId: string;
  displayName: string;
  email: string;
  jobTitle: string;
  department: string;
  employmentStatus: EmploymentStatus;
  isManager: boolean;
  managerEmployeeId?: string;
  location: string;
  baseSalaryUSD: number;
};

export type Timesheet = { id: string; employeeId: string; weekStart: string; weekEnd: string; totalHours: number; overtimeHours: number; status: ApprovalStatus; approverEmployeeId?: string };
export type LeaveRequest = { id: string; employeeId: string; type: LeaveType; startDate: string; endDate: string; hours: number; status: ApprovalStatus; approverEmployeeId?: string; reason: string };
export type PayStub = { id: string; employeeId: string; payDate: string; grossUSD: number; deductionsUSD: number; netUSD: number };
export type Document = { id: string; employeeId: string; name: string; status: 'REQUIRED' | 'COMPLETED'; dueDate?: string };
export type CalendarItem = { id: string; employeeId: string; title: string; date: string; category: 'SHIFT'|'LEAVE'|'PAYROLL'|'COMPLIANCE'|'MEETING' };
export type AuditEvent = { id: string; at: string; actorUserId: string; action: string; entityType: string; entityId: string; detail: string };

export type PermissionContext = {
  currentUser: HcmUser;
  employeeProfile: Employee;
  roleFlags: PermissionSet;
  isManager: boolean;
  canAccessHR: boolean;
  canAccessPayroll: boolean;
  canApproveTeamTime: boolean;
  canApproveTeamLeave: boolean;
};

type SyncPayload = {
  fullName: string;
  preferredEmail: string;
  location: string;
  jobTitle: string;
  department: string;
  roleType: HcmRole;
  isPeopleManager: boolean;
};

type HcmStore = {
  users: HcmUser[];
  employees: Employee[];
  timesheets: Timesheet[];
  leaveRequests: LeaveRequest[];
  payStubs: PayStub[];
  documents: Document[];
  calendarItems: CalendarItem[];
  auditEvents: AuditEvent[];
  currentUserId: string;
  getPermissionContext: () => PermissionContext;
  syncSimulationUser: (payload: SyncPayload) => void;
  submitTimesheet: (hours: number) => void;
  requestLeave: (type: LeaveType, startDate: string, endDate: string, hours: number, reason: string) => void;
  approveTimesheet: (timesheetId: string, decision: Exclude<ApprovalStatus, 'pending'>) => void;
  approveLeave: (leaveId: string, decision: Exclude<ApprovalStatus, 'pending'>) => void;
};

const permissionMap: Record<HcmRole, PermissionSet> = {
  employee: { canAccessHR: false, canAccessPayroll: false, canAccessLegal: false, canAccessAdmin: false, canAccessAnalytics: false, canApproveTeamTime: false, canApproveTeamLeave: false },
  manager: { canAccessHR: false, canAccessPayroll: false, canAccessLegal: false, canAccessAdmin: false, canAccessAnalytics: false, canApproveTeamTime: true, canApproveTeamLeave: true },
  hrbp: { canAccessHR: true, canAccessPayroll: false, canAccessLegal: false, canAccessAdmin: false, canAccessAnalytics: true, canApproveTeamTime: false, canApproveTeamLeave: false },
  payroll_admin: { canAccessHR: false, canAccessPayroll: true, canAccessLegal: false, canAccessAdmin: false, canAccessAnalytics: true, canApproveTeamTime: false, canApproveTeamLeave: false },
  legal_admin: { canAccessHR: false, canAccessPayroll: false, canAccessLegal: true, canAccessAdmin: false, canAccessAnalytics: true, canApproveTeamTime: false, canApproveTeamLeave: false },
  admin: { canAccessHR: true, canAccessPayroll: true, canAccessLegal: true, canAccessAdmin: true, canAccessAnalytics: true, canApproveTeamTime: true, canApproveTeamLeave: true },
};

const seedUsers: HcmUser[] = [
  { id: 'u-seed-manager', employeeId: 'e-seed-manager', displayName: 'Nora Patel', email: 'nora@workspace.aos', roleType: 'manager', permissions: permissionMap.manager },
  { id: 'u-seed-hr', employeeId: 'e-seed-hr', displayName: 'Rohan Iyer', email: 'rohan@workspace.aos', roleType: 'hrbp', permissions: permissionMap.hrbp },
  { id: 'u-seed-legal', employeeId: 'e-seed-legal', displayName: 'Elena Vasquez', email: 'elena@workspace.aos', roleType: 'legal_admin', permissions: permissionMap.legal_admin },
  { id: 'u-seed-payroll', employeeId: 'e-seed-payroll', displayName: 'Darius Kim', email: 'darius@workspace.aos', roleType: 'payroll_admin', permissions: permissionMap.payroll_admin },
  { id: 'u-sim', employeeId: 'e-sim', displayName: 'Workspace User', email: 'user@workspace.aos', roleType: 'employee', permissions: permissionMap.employee },
];

const seedEmployees: Employee[] = [
  { id: 'e-seed-manager', workerId: 'WD-1001', userId: 'u-seed-manager', displayName: 'Nora Patel', email: 'nora@workspace.aos', jobTitle: 'Engineering Manager', department: 'Engineering', employmentStatus: 'active' as EmploymentStatus, isManager: true, location: 'Seattle, WA', baseSalaryUSD: 210000 },
  { id: 'e-seed-hr', workerId: 'WD-1002', userId: 'u-seed-hr', displayName: 'Rohan Iyer', email: 'rohan@workspace.aos', jobTitle: 'HRBP', department: 'HR', employmentStatus: 'active' as EmploymentStatus, isManager: false, location: 'New York, NY', baseSalaryUSD: 164000 },
  { id: 'e-seed-legal', workerId: 'WD-1003', userId: 'u-seed-legal', displayName: 'Elena Vasquez', email: 'elena@workspace.aos', jobTitle: 'Legal Compliance Manager', department: 'Legal', employmentStatus: 'active' as EmploymentStatus, isManager: false, location: 'Boston, MA', baseSalaryUSD: 172000 },
  { id: 'e-seed-payroll', workerId: 'WD-1004', userId: 'u-seed-payroll', displayName: 'Darius Kim', email: 'darius@workspace.aos', jobTitle: 'Payroll Administrator', department: 'Payroll', employmentStatus: 'active' as EmploymentStatus, isManager: false, location: 'Chicago, IL', baseSalaryUSD: 148000 },
  { id: 'e-sim', workerId: 'WD-2001', userId: 'u-sim', displayName: 'Workspace User', email: 'user@workspace.aos', jobTitle: 'Software Engineer', department: 'Engineering', employmentStatus: 'active' as EmploymentStatus, isManager: false, managerEmployeeId: 'e-seed-manager', location: 'Remote', baseSalaryUSD: 132000 },
  { id: 'e-seed-report-1', workerId: 'WD-3001', userId: 'u-dr-1', displayName: 'Harper Quinn', email: 'harper@workspace.aos', jobTitle: 'Business Analyst', department: 'Engineering', employmentStatus: 'active' as EmploymentStatus, isManager: false, managerEmployeeId: 'e-seed-manager', location: 'Austin, TX', baseSalaryUSD: 118000 },
  { id: 'e-seed-report-2', workerId: 'WD-3002', userId: 'u-dr-2', displayName: 'Liam Okoro', email: 'liam@workspace.aos', jobTitle: 'Data Analyst', department: 'Engineering', employmentStatus: 'active' as EmploymentStatus, isManager: false, managerEmployeeId: 'e-seed-manager', location: 'Denver, CO', baseSalaryUSD: 121000 },
];

const seedTimesheets: Timesheet[] = [
  { id: 'ts-sim-1', employeeId: 'e-sim', weekStart: '2026-03-02', weekEnd: '2026-03-08', totalHours: 40, overtimeHours: 0, status: 'pending', approverEmployeeId: 'e-seed-manager' },
  { id: 'ts-dr-1', employeeId: 'e-seed-report-1', weekStart: '2026-03-02', weekEnd: '2026-03-08', totalHours: 42, overtimeHours: 2, status: 'pending', approverEmployeeId: 'e-seed-manager' },
];

const seedLeaveRequests: LeaveRequest[] = [
  { id: 'lr-sim-1', employeeId: 'e-sim', type: 'PTO', startDate: '2026-04-12', endDate: '2026-04-14', hours: 24, status: 'pending', approverEmployeeId: 'e-seed-manager', reason: 'Family travel' },
  { id: 'lr-dr-1', employeeId: 'e-seed-report-2', type: 'SICK', startDate: '2026-03-11', endDate: '2026-03-11', hours: 8, status: 'pending', approverEmployeeId: 'e-seed-manager', reason: 'Medical appointment' },
];

const seedPayStubs: PayStub[] = [
  { id: 'ps-sim-1', employeeId: 'e-sim', payDate: '2026-03-15', grossUSD: 5077, deductionsUSD: 1378, netUSD: 3699 },
];

const seedDocuments: Document[] = [
  { id: 'doc-sim-1', employeeId: 'e-sim', name: 'Code of Conduct Acknowledgement', status: 'COMPLETED' },
  { id: 'doc-sim-2', employeeId: 'e-sim', name: 'Security Training Certification', status: 'REQUIRED', dueDate: '2026-03-20' },
];

const seedCalendar: CalendarItem[] = [
  { id: 'cal-1', employeeId: 'e-sim', title: 'Sprint planning', date: '2026-03-11', category: 'MEETING' },
  { id: 'cal-2', employeeId: 'e-sim', title: 'Payroll cutoff reminder', date: '2026-03-14', category: 'PAYROLL' },
  { id: 'cal-3', employeeId: 'e-seed-report-1', title: 'Team standup', date: '2026-03-11', category: 'MEETING' },
];

function auditEvent(actorUserId: string, action: string, entityType: string, entityId: string, detail: string): AuditEvent {
  return { id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: new Date().toISOString(), actorUserId, action, entityType, entityId, detail };
}

function fallbackContext(state: HcmStore): PermissionContext {
  const currentUser = state.users[0];
  const employeeProfile = state.employees.find((e) => e.id === currentUser.employeeId) ?? state.employees[0];
  const roleFlags = currentUser.permissions;
  return {
    currentUser,
    employeeProfile,
    roleFlags,
    isManager: employeeProfile.isManager,
    canAccessHR: roleFlags.canAccessHR,
    canAccessPayroll: roleFlags.canAccessPayroll,
    canApproveTeamTime: roleFlags.canApproveTeamTime && employeeProfile.isManager,
    canApproveTeamLeave: roleFlags.canApproveTeamLeave && employeeProfile.isManager,
  };
}

export const useHcmStore = create<HcmStore>((set, get) => ({
  users: seedUsers,
  employees: seedEmployees,
  timesheets: seedTimesheets,
  leaveRequests: seedLeaveRequests,
  payStubs: seedPayStubs,
  documents: seedDocuments,
  calendarItems: seedCalendar,
  auditEvents: [],
  currentUserId: 'u-sim',

  getPermissionContext: () => {
    const state = get();
    const currentUser = state.users.find((u) => u.id === state.currentUserId);
    if (!currentUser) return fallbackContext(state);
    const employeeProfile = state.employees.find((e) => e.id === currentUser.employeeId);
    if (!employeeProfile) return fallbackContext(state);
    const roleFlags = currentUser.permissions;
    return {
      currentUser,
      employeeProfile,
      roleFlags,
      isManager: employeeProfile.isManager,
      canAccessHR: roleFlags.canAccessHR,
      canAccessPayroll: roleFlags.canAccessPayroll,
      canApproveTeamTime: roleFlags.canApproveTeamTime && employeeProfile.isManager,
      canApproveTeamLeave: roleFlags.canApproveTeamLeave && employeeProfile.isManager,
    };
  },

  syncSimulationUser: (payload) =>
    set((state) => {
      const existingUser = state.users.find((u) => u.email.toLowerCase() === payload.preferredEmail.toLowerCase() || u.id === 'u-sim');
      const existingEmployee = existingUser
        ? state.employees.find((e) => e.id === existingUser.employeeId)
        : state.employees.find((e) => e.userId === 'u-sim' || e.email.toLowerCase() === payload.preferredEmail.toLowerCase());

      const userId = existingUser?.id ?? 'u-sim';
      const employeeId = existingEmployee?.id ?? 'e-sim';
      const permissions = permissionMap[payload.isPeopleManager && payload.roleType === 'employee' ? 'manager' : payload.roleType];
      const roleType = payload.isPeopleManager && payload.roleType === 'employee' ? 'manager' : payload.roleType;

      const targetIsManager = payload.isPeopleManager || roleType === 'manager';

      const userUnchanged = !!existingUser
        && existingUser.displayName === payload.fullName
        && existingUser.email === payload.preferredEmail
        && existingUser.roleType === roleType
        && existingUser.employeeId === employeeId;

      const employeeUnchanged = !!existingEmployee
        && existingEmployee.displayName === payload.fullName
        && existingEmployee.email === payload.preferredEmail
        && existingEmployee.location === payload.location
        && existingEmployee.jobTitle === payload.jobTitle
        && existingEmployee.department === payload.department
        && existingEmployee.isManager === targetIsManager;

      if (existingUser && existingEmployee && userUnchanged && employeeUnchanged && state.currentUserId === userId) {
        return state;
      }

      const users = existingUser
        ? state.users.map((u) =>
            u.id === existingUser.id
              ? { ...u, displayName: payload.fullName, email: payload.preferredEmail, roleType, permissions, employeeId }
              : u
          )
        : [
            ...state.users,
            { id: userId, employeeId, displayName: payload.fullName, email: payload.preferredEmail, roleType, permissions },
          ];

      const employees = existingEmployee
        ? state.employees.map((e) =>
            e.id === existingEmployee.id
              ? {
                  ...e,
                  userId,
                  displayName: payload.fullName,
                  email: payload.preferredEmail,
                  location: payload.location,
                  jobTitle: payload.jobTitle,
                  department: payload.department,
                  isManager: targetIsManager,
                }
              : e
          )
        : [
            ...state.employees,
            {
              id: employeeId,
              workerId: `WD-${Math.floor(3000 + Math.random() * 6000)}`,
              userId,
              displayName: payload.fullName,
              email: payload.preferredEmail,
              jobTitle: payload.jobTitle,
              department: payload.department,
              employmentStatus: 'active' as EmploymentStatus,
              isManager: targetIsManager,
              managerEmployeeId: 'e-seed-manager',
              location: payload.location,
              baseSalaryUSD: 132000,
            },
          ];

      const newAudit = auditEvent(userId, 'simulation_identity_synced', 'employee', employeeId, `Synced profile for ${payload.fullName}`);
      return {
        users,
        employees,
        currentUserId: userId,
        auditEvents: [newAudit, ...state.auditEvents],
      };
    }),

  submitTimesheet: (hours) =>
    set((state) => {
      const ctx = state.getPermissionContext();
      const approverEmployeeId = ctx.employeeProfile.managerEmployeeId;
      const entry: Timesheet = {
        id: `ts-${Date.now()}`,
        employeeId: ctx.employeeProfile.id,
        weekStart: '2026-03-09',
        weekEnd: '2026-03-15',
        totalHours: hours,
        overtimeHours: Math.max(0, hours - 40),
        status: 'pending',
        approverEmployeeId,
      };
      return {
        timesheets: [entry, ...state.timesheets],
        auditEvents: [auditEvent(ctx.currentUser.id, 'timesheet_submitted', 'timesheet', entry.id, `Submitted ${hours}h`), ...state.auditEvents],
      };
    }),

  requestLeave: (type, startDate, endDate, hours, reason) =>
    set((state) => {
      const ctx = state.getPermissionContext();
      const req: LeaveRequest = {
        id: `lr-${Date.now()}`,
        employeeId: ctx.employeeProfile.id,
        type,
        startDate,
        endDate,
        hours,
        status: 'pending',
        approverEmployeeId: ctx.employeeProfile.managerEmployeeId,
        reason,
      };
      return {
        leaveRequests: [req, ...state.leaveRequests],
        auditEvents: [auditEvent(ctx.currentUser.id, 'leave_requested', 'leave_request', req.id, `${type} ${hours}h requested`), ...state.auditEvents],
      };
    }),

  approveTimesheet: (timesheetId, decision) =>
    set((state) => {
      const ctx = state.getPermissionContext();
      if (!ctx.canApproveTeamTime) return state;
      const target = state.timesheets.find((t) => t.id === timesheetId);
      if (!target) return state;
      const targetEmployee = state.employees.find((e) => e.id === target.employeeId);
      const isDirectReport = !!targetEmployee && targetEmployee.managerEmployeeId === ctx.employeeProfile.id;
      if (!isDirectReport) return state;
      return {
        timesheets: state.timesheets.map((t) => (t.id === timesheetId ? { ...t, status: decision } : t)),
        auditEvents: [auditEvent(ctx.currentUser.id, 'timesheet_decision', 'timesheet', timesheetId, `Decision: ${decision}`), ...state.auditEvents],
      };
    }),

  approveLeave: (leaveId, decision) =>
    set((state) => {
      const ctx = state.getPermissionContext();
      if (!ctx.canApproveTeamLeave) return state;
      const target = state.leaveRequests.find((l) => l.id === leaveId);
      if (!target) return state;
      const targetEmployee = state.employees.find((e) => e.id === target.employeeId);
      const isDirectReport = !!targetEmployee && targetEmployee.managerEmployeeId === ctx.employeeProfile.id;
      if (!isDirectReport) return state;
      return {
        leaveRequests: state.leaveRequests.map((l) => (l.id === leaveId ? { ...l, status: decision } : l)),
        auditEvents: [auditEvent(ctx.currentUser.id, 'leave_decision', 'leave_request', leaveId, `Decision: ${decision}`), ...state.auditEvents],
      };
    }),
}));
