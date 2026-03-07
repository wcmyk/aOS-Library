import { create } from 'zustand';

export type Role =
  | 'Admin'
  | 'Project Manager'
  | 'Risk Analyst'
  | 'Compliance Reviewer'
  | 'Marketing Ops Specialist'
  | 'Engineering Manager'
  | 'Executive Viewer';

export type Status = 'New' | 'In Progress' | 'Blocked' | 'In Review' | 'Approved' | 'Done';
export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  team: string;
};

export type Task = {
  id: string;
  name: string;
  projectId: string;
  ownerId: string;
  status: Status;
  priority: Priority;
  dueOn: string;
  plannedCompletion: string;
  canStart: boolean;
  queueType?: string;
  description: string;
  tags: string[];
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  health: 'Green' | 'Amber' | 'Red';
  status: 'Planning' | 'Executing' | 'At Risk' | 'On Hold' | 'Completed';
  department: string;
  startDate: string;
  targetDate: string;
  budgetUSD: number;
  summary: string;
  milestones: string[];
};

export type SavedView = {
  id: string;
  name: string;
  search: string;
  statuses: Status[];
  priorities: Priority[];
  owner: 'mine' | 'all';
  sortBy: keyof Pick<Task, 'dueOn' | 'status' | 'priority' | 'name' | 'updatedAt'>;
  sortDir: 'asc' | 'desc';
  groupBy: 'none' | 'status' | 'priority' | 'project';
};

type AuthState = { authenticated: boolean; userId: string | null };

type WorkHubStore = {
  users: User[];
  tasks: Task[];
  projects: Project[];
  savedViews: SavedView[];
  auth: AuthState;
  login: (userId: string) => void;
  logout: () => void;
  updateTask: (taskId: string, patch: Partial<Task>) => void;
  bulkUpdate: (taskIds: string[], patch: Partial<Task>) => void;
  createSavedView: (view: Omit<SavedView, 'id'>) => void;
};

const users: User[] = [
  { id: 'u1', name: 'Nora Patel', email: 'nora.patel@workspace.aos', role: 'Project Manager', team: 'PMO' },
  { id: 'u2', name: 'Malik Hartwell', email: 'malik.hartwell@workspace.aos', role: 'Engineering Manager', team: 'Engineering Delivery' },
  { id: 'u3', name: 'Elena Vasquez', email: 'elena.vasquez@workspace.aos', role: 'Risk Analyst', team: 'Enterprise Risk' },
  { id: 'u4', name: 'Rohan Iyer', email: 'rohan.iyer@workspace.aos', role: 'Compliance Reviewer', team: 'Compliance' },
  { id: 'u5', name: 'Sophia Chen', email: 'sophia.chen@workspace.aos', role: 'Marketing Ops Specialist', team: 'Marketing Operations' },
  { id: 'u6', name: 'Julian Osei', email: 'julian.osei@workspace.aos', role: 'Executive Viewer', team: 'Executive Office' },
  { id: 'u7', name: 'Priya Thornton', email: 'priya.thornton@workspace.aos', role: 'Admin', team: 'Platform Administration' },
];

const projects: Project[] = [
  {
    id: 'p1',
    name: 'Enterprise Risk Control Modernization',
    code: 'RISK-2026-01',
    ownerId: 'u3',
    health: 'Amber',
    status: 'Executing',
    department: 'Enterprise Risk',
    startDate: '2026-01-10',
    targetDate: '2026-06-30',
    budgetUSD: 1300000,
    summary: 'Consolidate risk controls and automate quarterly attestations across trading and operations.',
    milestones: ['Control inventory baseline', 'Approval matrix rollout', 'Q2 regulatory dry run'],
  },
  {
    id: 'p2',
    name: 'Global Campaign Intake & SLA Program',
    code: 'MKT-OPS-88',
    ownerId: 'u5',
    health: 'Green',
    status: 'Executing',
    department: 'Marketing Operations',
    startDate: '2026-02-01',
    targetDate: '2026-09-15',
    budgetUSD: 820000,
    summary: 'Introduce structured request types, approvals, and SLA dashboards for campaign operations.',
    milestones: ['Request type templates', 'Creative proofing process', 'Regional SLA dashboard'],
  },
  {
    id: 'p3',
    name: 'Engineering Delivery Governance v2',
    code: 'ENG-DEL-402',
    ownerId: 'u2',
    health: 'Red',
    status: 'At Risk',
    department: 'Engineering Delivery',
    startDate: '2026-01-20',
    targetDate: '2026-05-30',
    budgetUSD: 960000,
    summary: 'Unify sprint-to-quarter planning, dependency management, and release readiness criteria.',
    milestones: ['Dependency board', 'Release gate policy', 'Service ownership matrix'],
  },
];

const seedTasks: Task[] = [
  { id: 't1', name: 'Finalize control taxonomy mapping', projectId: 'p1', ownerId: 'u3', status: 'In Progress', priority: 'Critical', dueOn: '2026-03-13', plannedCompletion: '2026-03-12', canStart: true, queueType: 'Risk Review', description: 'Map legacy controls to unified taxonomy and publish v1 mapping reference.', tags: ['risk', 'controls'], updatedAt: '2026-03-07T08:10:00Z' },
  { id: 't2', name: 'Compliance sign-off for attestation workflow', projectId: 'p1', ownerId: 'u4', status: 'In Review', priority: 'High', dueOn: '2026-03-10', plannedCompletion: '2026-03-10', canStart: true, queueType: 'Compliance Approval', description: 'Route workflow and notification cadence for compliance legal sign-off.', tags: ['approval', 'compliance'], updatedAt: '2026-03-07T07:40:00Z' },
  { id: 't3', name: 'Campaign intake form field audit', projectId: 'p2', ownerId: 'u5', status: 'Blocked', priority: 'High', dueOn: '2026-03-08', plannedCompletion: '2026-03-09', canStart: false, queueType: 'Marketing Intake', description: 'Validate request form fields with regional MOPs stakeholders.', tags: ['forms', 'sla'], updatedAt: '2026-03-07T06:00:00Z' },
  { id: 't4', name: 'SLA dashboard KPI definitions', projectId: 'p2', ownerId: 'u1', status: 'In Progress', priority: 'Medium', dueOn: '2026-03-15', plannedCompletion: '2026-03-15', canStart: true, queueType: 'Reporting', description: 'Define KPI dictionary for intake, acceptance, cycle time, and revision loops.', tags: ['dashboard', 'reporting'], updatedAt: '2026-03-07T05:55:00Z' },
  { id: 't5', name: 'Dependency risk review for release train', projectId: 'p3', ownerId: 'u2', status: 'New', priority: 'Critical', dueOn: '2026-03-09', plannedCompletion: '2026-03-09', canStart: true, queueType: 'Engineering Review', description: 'Review unresolved service dependencies blocking Q2 release gate.', tags: ['dependency', 'release'], updatedAt: '2026-03-07T09:12:00Z' },
  { id: 't6', name: 'Executive summary pack refresh', projectId: 'p3', ownerId: 'u6', status: 'New', priority: 'Medium', dueOn: '2026-03-16', plannedCompletion: '2026-03-16', canStart: true, queueType: 'Executive Reporting', description: 'Update dashboard narratives for monthly executive governance forum.', tags: ['exec', 'dashboard'], updatedAt: '2026-03-07T04:12:00Z' },
  { id: 't7', name: 'SOC2 evidence library indexing', projectId: 'p1', ownerId: 'u4', status: 'Done', priority: 'Low', dueOn: '2026-03-01', plannedCompletion: '2026-03-01', canStart: true, queueType: 'Compliance Evidence', description: 'Archive and index SOC2 evidence in standardized folder taxonomy.', tags: ['audit'], updatedAt: '2026-03-01T18:12:00Z' },
  { id: 't8', name: 'Creative proof routing pilot', projectId: 'p2', ownerId: 'u5', status: 'Approved', priority: 'High', dueOn: '2026-03-06', plannedCompletion: '2026-03-06', canStart: true, queueType: 'Proofing', description: 'Run pilot for multi-step creative proof approval across EMEA and NA.', tags: ['proofing'], updatedAt: '2026-03-06T11:00:00Z' },
];

const savedViews: SavedView[] = [
  { id: 'sv1', name: 'My Critical Work', search: '', statuses: ['New', 'In Progress', 'Blocked'], priorities: ['Critical'], owner: 'mine', sortBy: 'dueOn', sortDir: 'asc', groupBy: 'status' },
  { id: 'sv2', name: 'Approval Queue', search: '', statuses: ['In Review'], priorities: ['Critical', 'High', 'Medium', 'Low'], owner: 'all', sortBy: 'updatedAt', sortDir: 'desc', groupBy: 'project' },
];

export const useWorkHubStore = create<WorkHubStore>((set) => ({
  users,
  tasks: seedTasks,
  projects,
  savedViews,
  auth: { authenticated: false, userId: null },
  login: (userId) => set({ auth: { authenticated: true, userId } }),
  logout: () => set({ auth: { authenticated: false, userId: null } }),
  updateTask: (taskId, patch) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, ...patch, updatedAt: new Date().toISOString() }
          : t
      ),
    })),
  bulkUpdate: (taskIds, patch) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        taskIds.includes(t.id)
          ? { ...t, ...patch, updatedAt: new Date().toISOString() }
          : t
      ),
    })),
  createSavedView: (view) =>
    set((state) => ({
      savedViews: [...state.savedViews, { ...view, id: `sv-${Date.now()}` }],
    })),
}));
