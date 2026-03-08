import { useState } from 'react';
import { useProfileStore } from '../../../state/useProfileStore';

type BugPriority = 'P0' | 'P1' | 'P2' | 'P3';
type BugStatus = 'New' | 'Assigned' | 'Accepted' | 'Fixed' | "Won't Fix" | 'Verified';

type Issue = {
  id: number;
  title: string;
  priority: BugPriority;
  status: BugStatus;
  component: string;
  assignee: string;
  created: string;
  hotlist?: string;
};

const ISSUES: Issue[] = [
  { id: 312891024, title: 'Search latency regression: P99 up 12ms after cl/78901234', priority: 'P0', status: 'Assigned', component: 'Search/Infra', assignee: 'You', created: '2h ago', hotlist: 'Priority-Launch' },
  { id: 312789344, title: 'ML model serving OOM errors on Borg tasks >128GB', priority: 'P1', status: 'Accepted', component: 'ML Platform', assignee: 'You', created: '6h ago', hotlist: 'Reliability' },
  { id: 312654210, title: 'Kubernetes scheduler preempting high-priority batch jobs', priority: 'P1', status: 'New', component: 'Borg/Scheduling', assignee: 'Unassigned', created: '1d ago', hotlist: 'Reliability' },
  { id: 312512089, title: 'BigQuery MERGE query incorrectly handles NULL keys', priority: 'P2', status: 'Accepted', component: 'BigQuery', assignee: 'You', created: '2d ago' },
  { id: 312401734, title: 'Spanner RPC timeout not propagating to client library', priority: 'P2', status: 'Fixed', component: 'Spanner', assignee: 'Infrastructure', created: '4d ago' },
  { id: 312298012, title: 'TensorFlow SavedModel v2 incompatibility with Serving 2.14', priority: 'P1', status: 'Accepted', component: 'TF Serving', assignee: 'You', created: '5d ago', hotlist: 'ML-Reliability' },
  { id: 312187654, title: 'Stubby client leaks connections on retryable error', priority: 'P3', status: 'New', component: 'RPC/Stubby', assignee: 'Unassigned', created: '1w ago' },
  { id: 311998234, title: 'Add support for INT8 quantization in JAX JIT pipeline', priority: 'P2', status: 'Accepted', component: 'JAX', assignee: 'You', created: '2w ago', hotlist: 'Performance' },
  { id: 311876012, title: 'Buganizer mail delivery delayed for hotlist updates', priority: 'P3', status: "Won't Fix", component: 'Buganizer', assignee: 'Buganizer Team', created: '3w ago' },
  { id: 311654089, title: 'Critique review diff fails to render Unicode left-to-right marks', priority: 'P3', status: 'Verified', component: 'Critique', assignee: 'DevTools', created: '1mo ago' },
];

const P_COLOR: Record<BugPriority, string> = {
  P0: '#d32f2f',
  P1: '#e65100',
  P2: '#1565c0',
  P3: '#455a64',
};

const S_COLOR: Record<BugStatus, string> = {
  New: '#0288d1',
  Assigned: '#7b1fa2',
  Accepted: '#0288d1',
  Fixed: '#2e7d32',
  "Won't Fix": '#616161',
  Verified: '#2e7d32',
};

export function BuganizerSite() {
  const profile = useProfileStore();
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | BugPriority>('all');

  const company = profile.preferredEmail.includes('@') ? profile.preferredEmail.split('@')[1].split('.')[0] : 'Google';
  const filtered = filter === 'all' ? ISSUES : ISSUES.filter((i) => i.priority === filter);
  const selectedIssue = ISSUES.find((i) => i.id === selected);

  return (
    <div className="bug-shell">
      <header className="bug-header">
        <div className="bug-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#4285f4" />
            <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span className="bug-brand">Buganizer</span>
        </div>
        <span className="bug-company-badge">{company} Internal</span>
      </header>

      <div className="bug-layout">
        <aside className="bug-sidebar">
          <div className="bug-sidebar-title">Hotlists</div>
          {(['all', 'P0', 'P1', 'P2', 'P3'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`bug-filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All Issues' : f}
              <span className="bug-count" style={{ background: f !== 'all' ? P_COLOR[f] : '#5e7399' }}>
                {f === 'all' ? ISSUES.length : ISSUES.filter((i) => i.priority === f).length}
              </span>
            </button>
          ))}
          <div className="bug-sidebar-title" style={{ marginTop: 16 }}>Components</div>
          {['Search/Infra', 'ML Platform', 'BigQuery', 'Spanner', 'JAX'].map((c) => (
            <button key={c} type="button" className="bug-filter-btn">{c}</button>
          ))}
        </aside>

        <div className="bug-main">
          <div className="bug-list-header">
            <span className="bug-list-count">{filtered.length} issues</span>
          </div>
          <table className="bug-table">
            <thead>
              <tr>
                <th>ID</th><th>Priority</th><th>Title</th><th>Status</th><th>Component</th><th>Assignee</th><th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((issue) => (
                <tr
                  key={issue.id}
                  className={`bug-row${selected === issue.id ? ' selected' : ''}`}
                  onClick={() => setSelected(issue.id)}
                >
                  <td className="bug-id">{issue.id}</td>
                  <td>
                    <span className="bug-priority-badge" style={{ background: P_COLOR[issue.priority] }}>{issue.priority}</span>
                  </td>
                  <td className="bug-title-cell">
                    {issue.title}
                    {issue.hotlist && <span className="bug-hotlist">{issue.hotlist}</span>}
                  </td>
                  <td><span className="bug-status" style={{ color: S_COLOR[issue.status] }}>{issue.status}</span></td>
                  <td className="bug-component">{issue.component}</td>
                  <td className="bug-assignee">{issue.assignee}</td>
                  <td className="bug-created">{issue.created}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedIssue && (
            <div className="bug-detail-panel">
              <div className="bug-detail-header">
                <div className="bug-detail-id">Issue #{selectedIssue.id}</div>
                <div className="bug-detail-title">{selectedIssue.title}</div>
              </div>
              <div className="bug-detail-grid">
                <div><label>Priority</label><span className="bug-priority-badge" style={{ background: P_COLOR[selectedIssue.priority] }}>{selectedIssue.priority}</span></div>
                <div><label>Status</label><span style={{ color: S_COLOR[selectedIssue.status] }}>{selectedIssue.status}</span></div>
                <div><label>Component</label><span>{selectedIssue.component}</span></div>
                <div><label>Assignee</label><span>{selectedIssue.assignee}</span></div>
                {selectedIssue.hotlist && <div><label>Hotlist</label><span className="bug-hotlist">{selectedIssue.hotlist}</span></div>}
              </div>
              <div className="bug-detail-desc">
                <strong>Description:</strong><br />
                {selectedIssue.title}.<br /><br />
                <strong>Steps to reproduce:</strong><br />
                1. Set up environment as documented in go/repro-steps<br />
                2. Execute the referenced changelist<br />
                3. Observe the behavior described above<br /><br />
                <strong>Impact:</strong> Affects production traffic for {selectedIssue.component} users.<br />
                <strong>Reported via:</strong> Monarch alert / manual observation
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
