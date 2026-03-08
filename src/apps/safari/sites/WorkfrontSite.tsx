import { useState } from 'react';
import { useProfileStore } from '../../../state/useProfileStore';

type WfStatus = 'backlog' | 'in-progress' | 'review' | 'done';

type Task = { id: string; title: string; assignee: string; due: string; priority: 'high' | 'medium' | 'low'; points: number; status: WfStatus };

function dueDate(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTasksForRole(role: string, managerName: string, userName: string): Task[] {
  const isFinance = /analyst|finance|account|tax|audit|risk|quant|compliance|trading|banking/i.test(role);
  const isConsulting = /consult|strategy|advisor/i.test(role);
  const isData = /data|scientist|engineer|ml|ai/i.test(role);

  if (isFinance) return [
    { id: 't1', title: 'Q2 Budget vs. Actuals Variance Analysis', assignee: userName, due: dueDate(3), priority: 'high', points: 5, status: 'in-progress' },
    { id: 't2', title: 'Regulatory Capital Reporting (CCAR)', assignee: managerName, due: dueDate(8), priority: 'high', points: 8, status: 'in-progress' },
    { id: 't3', title: 'Update FX Hedging Model Documentation', assignee: userName, due: dueDate(12), priority: 'medium', points: 3, status: 'review' },
    { id: 't4', title: 'Monthly P&L Attribution Report', assignee: userName, due: dueDate(-2), priority: 'medium', points: 3, status: 'done' },
    { id: 't5', title: 'Credit Risk Model Validation – Phase 2', assignee: 'Risk Analytics', due: dueDate(21), priority: 'high', points: 13, status: 'backlog' },
    { id: 't6', title: 'SOX 302/906 Control Testing', assignee: 'Compliance', due: dueDate(30), priority: 'medium', points: 8, status: 'backlog' },
    { id: 't7', title: 'Reconcile Trade Blotter Discrepancies', assignee: userName, due: dueDate(2), priority: 'high', points: 2, status: 'in-progress' },
    { id: 't8', title: 'Internal Audit Finding Remediation', assignee: managerName, due: dueDate(15), priority: 'medium', points: 5, status: 'review' },
  ];
  if (isConsulting) return [
    { id: 't1', title: 'Client Kickoff Deck — Operational Transformation', assignee: userName, due: dueDate(3), priority: 'high', points: 5, status: 'in-progress' },
    { id: 't2', title: 'Market Sizing Analysis — Financial Services Vertical', assignee: userName, due: dueDate(7), priority: 'high', points: 8, status: 'in-progress' },
    { id: 't3', title: 'Stakeholder Interview Synthesis', assignee: managerName, due: dueDate(5), priority: 'medium', points: 3, status: 'review' },
    { id: 't4', title: 'Executive Summary — Phase 1 Findings', assignee: userName, due: dueDate(-1), priority: 'high', points: 5, status: 'done' },
    { id: 't5', title: 'Technology Vendor Assessment', assignee: 'Research Team', due: dueDate(14), priority: 'medium', points: 8, status: 'backlog' },
    { id: 't6', title: 'Implementation Roadmap Development', assignee: userName, due: dueDate(28), priority: 'medium', points: 13, status: 'backlog' },
  ];
  if (isData) return [
    { id: 't1', title: 'Feature Pipeline Migration to Feast', assignee: userName, due: dueDate(5), priority: 'high', points: 8, status: 'in-progress' },
    { id: 't2', title: 'Model Drift Monitoring Dashboard', assignee: userName, due: dueDate(10), priority: 'high', points: 5, status: 'in-progress' },
    { id: 't3', title: 'A/B Test Analysis — Recommendation Engine v2', assignee: managerName, due: dueDate(4), priority: 'medium', points: 3, status: 'review' },
    { id: 't4', title: 'Spark Job Performance Optimization', assignee: userName, due: dueDate(-3), priority: 'medium', points: 5, status: 'done' },
    { id: 't5', title: 'New Training Dataset Curation', assignee: 'Data Platform', due: dueDate(18), priority: 'medium', points: 8, status: 'backlog' },
    { id: 't6', title: 'Model Card Documentation — Prod Models', assignee: userName, due: dueDate(25), priority: 'low', points: 2, status: 'backlog' },
  ];
  // Default tech/engineering tasks
  return [
    { id: 't1', title: 'API Gateway v2 — Auth Middleware', assignee: userName, due: dueDate(4), priority: 'high', points: 8, status: 'in-progress' },
    { id: 't2', title: 'Reduce P99 Latency — User Profile Service', assignee: userName, due: dueDate(8), priority: 'high', points: 5, status: 'in-progress' },
    { id: 't3', title: 'Design Review — Event Schema Migration', assignee: managerName, due: dueDate(3), priority: 'medium', points: 3, status: 'review' },
    { id: 't4', title: 'CI/CD Pipeline Flaky Test Investigation', assignee: userName, due: dueDate(-1), priority: 'medium', points: 2, status: 'done' },
    { id: 't5', title: 'Monitoring Dashboard — SLO Tracking', assignee: userName, due: dueDate(-4), priority: 'high', points: 5, status: 'done' },
    { id: 't6', title: 'Migrate Legacy Auth to OAuth 2.0', assignee: 'Platform Team', due: dueDate(20), priority: 'high', points: 13, status: 'backlog' },
    { id: 't7', title: 'Database Index Optimization — Products Table', assignee: userName, due: dueDate(14), priority: 'medium', points: 5, status: 'backlog' },
    { id: 't8', title: 'Observability Uplift — Distributed Tracing', assignee: userName, due: dueDate(30), priority: 'low', points: 8, status: 'backlog' },
  ];
}

const COLUMNS: { id: WfStatus; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
];

const PRIORITY_COLOR: Record<string, string> = {
  high: '#e05c00', medium: '#0078d4', low: '#5e7399',
};

export function WorkfrontSite() {
  const { acceptedJob, firstName, lastName } = useProfileStore();
  const [activeProject, setActiveProject] = useState('current');
  const [taskStatuses, setTaskStatuses] = useState<Record<string, WfStatus>>({});

  const role = acceptedJob?.role ?? 'Software Engineer';
  const manager = acceptedJob?.managerName ?? 'Your Manager';
  const company = acceptedJob?.company ?? 'Your Company';
  const userName = firstName && lastName ? `${firstName} ${lastName}` : 'You';

  const baseTasks = getTasksForRole(role, manager, userName);
  const tasks = baseTasks.map((t) => ({ ...t, status: taskStatuses[t.id] ?? t.status }));

  const moveTask = (taskId: string, newStatus: WfStatus) => {
    setTaskStatuses((p) => ({ ...p, [taskId]: newStatus }));
  };

  const projects = [
    { id: 'current', name: `${company} — Q2 Delivery`, status: 'Active' },
    { id: 'q1', name: `Q1 Retrospective`, status: 'Closed' },
    { id: 'infra', name: 'Infrastructure Modernization', status: 'Active' },
  ];

  return (
    <div className="wf-shell">
      <header className="wf-header">
        <div className="wf-logo">
          <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="6" fill="#e8441e"/>
            <path d="M8 32L16 16l8 12 6-8 10 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span className="wf-brand">Adobe Workfront</span>
        </div>
        <div className="wf-header-right">
          <span className="wf-company-badge">{company}</span>
        </div>
      </header>

      <div className="wf-layout">
        <aside className="wf-sidebar">
          <div className="wf-sidebar-section">Projects</div>
          {projects.map((p) => (
            <button key={p.id} type="button"
              className={`wf-project-btn${activeProject === p.id ? ' active' : ''}`}
              onClick={() => setActiveProject(p.id)}
            >
              <span className="wf-project-dot" style={{ background: p.status === 'Active' ? '#107c10' : '#5e7399' }} />
              <div>
                <div className="wf-project-name">{p.name}</div>
                <div className="wf-project-status">{p.status}</div>
              </div>
            </button>
          ))}
          <div className="wf-sidebar-section" style={{ marginTop: 16 }}>Reports</div>
          {['Burndown', 'Velocity', 'Capacity'].map((r) => (
            <button key={r} type="button" className="wf-project-btn">{r} Chart</button>
          ))}
        </aside>

        <div className="wf-main">
          <div className="wf-board-header">
            <div className="wf-board-title">{projects.find(p => p.id === activeProject)?.name}</div>
            <div className="wf-board-meta">{tasks.filter(t => t.status === 'in-progress').length} in progress · {tasks.filter(t => t.status === 'done').length} completed</div>
          </div>
          <div className="wf-kanban">
            {COLUMNS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.id);
              return (
                <div key={col.id} className="wf-column">
                  <div className="wf-col-header">
                    <span>{col.label}</span>
                    <span className="wf-col-count">{colTasks.length}</span>
                  </div>
                  {colTasks.map((task) => (
                    <div key={task.id} className="wf-task-card">
                      <div className="wf-task-title">{task.title}</div>
                      <div className="wf-task-meta">
                        <span className="wf-priority" style={{ color: PRIORITY_COLOR[task.priority] }}>{task.priority}</span>
                        <span className="wf-points">{task.points} pts</span>
                      </div>
                      <div className="wf-task-footer">
                        <span className="wf-assignee">{task.assignee.split(' ')[0]}</span>
                        <span className="wf-due">Due {task.due}</span>
                      </div>
                      <select
                        className="wf-status-select"
                        value={task.status}
                        onChange={(e) => moveTask(task.id, e.target.value as WfStatus)}
                      >
                        {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
