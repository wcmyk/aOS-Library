import { useMemo, useState } from 'react';
import { useWorkHubStore, type Priority, type Project, type Role, type SavedView, type Status, type Task, type User } from '../../state/useWorkHubStore';

type ModuleKey = 'home' | 'my-work' | 'projects' | 'requests' | 'reports' | 'dashboards' | 'documents' | 'proofing' | 'teams' | 'people' | 'administration';
type ProjectTab = 'overview' | 'tasks' | 'risks' | 'documents' | 'updates' | 'approvals';

const MODULES: Array<{ key: ModuleKey; label: string }> = [
  { key: 'home', label: 'Home' },
  { key: 'my-work', label: 'My Work' },
  { key: 'projects', label: 'Projects' },
  { key: 'requests', label: 'Requests' },
  { key: 'reports', label: 'Reports' },
  { key: 'dashboards', label: 'Dashboards' },
  { key: 'documents', label: 'Documents' },
  { key: 'proofing', label: 'Proofing' },
  { key: 'teams', label: 'Teams' },
  { key: 'people', label: 'People' },
  { key: 'administration', label: 'Administration' },
];

const statuses: Status[] = ['New', 'In Progress', 'Blocked', 'In Review', 'Approved', 'Done'];
const priorities: Priority[] = ['Critical', 'High', 'Medium', 'Low'];

function nameById<T extends { id: string; name: string }>(arr: T[], id: string): string {
  return arr.find((i) => i.id === id)?.name ?? id;
}

function roleCanEdit(role: Role): boolean {
  return !['Executive Viewer'].includes(role);
}

function statusTone(status: Status): string {
  if (status === 'Blocked') return 'wh-badge danger';
  if (status === 'Done' || status === 'Approved') return 'wh-badge success';
  if (status === 'In Review') return 'wh-badge info';
  return 'wh-badge';
}

function priorityTone(priority: Priority): string {
  if (priority === 'Critical') return 'wh-badge danger';
  if (priority === 'High') return 'wh-badge warn';
  return 'wh-badge';
}

function parseDate(date: string): number {
  return new Date(date).getTime();
}

function overdue(task: Task): boolean {
  const end = new Date(task.dueOn);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end.getTime() < today.getTime() && task.status !== 'Done' && task.status !== 'Approved';
}

function LoginScreen({ users }: { users: User[] }) {
  const login = useWorkHubStore((s) => s.login);
  const [selected, setSelected] = useState(users[0]?.id ?? '');

  return (
    <div className="wh-login">
      <div className="wh-login-card">
        <div className="wh-brand">SentinelFlow</div>
        <h2>Enterprise Work Management</h2>
        <p>Sign in with a role profile to simulate production-grade permissions.</p>
        <label>Role Profile
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.role}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => login(selected)}>Sign In</button>
      </div>
    </div>
  );
}

function HomeModule({ tasks }: { tasks: Task[] }) {
  const overdueCount = tasks.filter(overdue).length;
  const inReview = tasks.filter((t) => t.status === 'In Review').length;
  const blocked = tasks.filter((t) => t.status === 'Blocked').length;
  return (
    <div className="wh-panel-grid">
      <div className="wh-card"><h3>Overdue Tasks</h3><p className="wh-kpi">{overdueCount}</p></div>
      <div className="wh-card"><h3>Waiting Approvals</h3><p className="wh-kpi">{inReview}</p></div>
      <div className="wh-card"><h3>Blocked Work</h3><p className="wh-kpi">{blocked}</p></div>
      <div className="wh-card"><h3>Recently Updated</h3>{tasks.slice().sort((a,b)=>parseDate(b.updatedAt)-parseDate(a.updatedAt)).slice(0,5).map((t)=><div key={t.id} className="wh-meta-row">{t.name}</div>)}</div>
    </div>
  );
}

function MyWorkModule({
  tasks,
  users,
  projects,
  role,
}: {
  tasks: Task[];
  users: User[];
  projects: Project[];
  role: Role;
}) {
  const updateTask = useWorkHubStore((s) => s.updateTask);
  const bulkUpdate = useWorkHubStore((s) => s.bulkUpdate);
  const createSavedView = useWorkHubStore((s) => s.createSavedView);
  const savedViews = useWorkHubStore((s) => s.savedViews);
  const currentUserId = useWorkHubStore((s) => s.auth.userId);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<Priority[]>([]);
  const [ownerScope, setOwnerScope] = useState<'mine'|'all'>('mine');
  const [sortBy, setSortBy] = useState<SavedView['sortBy']>('dueOn');
  const [sortDir, setSortDir] = useState<SavedView['sortDir']>('asc');
  const [groupBy, setGroupBy] = useState<SavedView['groupBy']>('none');
  const [selected, setSelected] = useState<string[]>([]);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tasks
      .filter((t) => ownerScope === 'all' || t.ownerId === currentUserId)
      .filter((t) => statusFilter.length === 0 || statusFilter.includes(t.status))
      .filter((t) => priorityFilter.length === 0 || priorityFilter.includes(t.priority))
      .filter((t) => !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || nameById(projects, t.projectId).toLowerCase().includes(q))
      .sort((a, b) => {
        const av = String(a[sortBy]);
        const bv = String(b[sortBy]);
        const cmp = av.localeCompare(bv);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [tasks, ownerScope, currentUserId, statusFilter, priorityFilter, search, sortBy, sortDir, projects]);

  const grouped = useMemo(() => {
    if (groupBy === 'none') return { All: filtered };
    return filtered.reduce<Record<string, Task[]>>((acc, task) => {
      const key = groupBy === 'project' ? nameById(projects, task.projectId) : String(task[groupBy]);
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {});
  }, [filtered, groupBy, projects]);

  const detailTask = tasks.find((t) => t.id === detailTaskId) ?? null;
  const canEdit = roleCanEdit(role);

  return (
    <div className="wh-content-stack">
      <div className="wh-toolbar">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks, projects, descriptions" />
        <select value={ownerScope} onChange={(e) => setOwnerScope(e.target.value as 'mine' | 'all')}>
          <option value="mine">My Work</option>
          <option value="all">All Work</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SavedView['sortBy'])}>
          <option value="dueOn">Due On</option>
          <option value="status">Status</option>
          <option value="priority">Priority</option>
          <option value="name">Name</option>
          <option value="updatedAt">Updated</option>
        </select>
        <select value={sortDir} onChange={(e) => setSortDir(e.target.value as SavedView['sortDir'])}>
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>
        <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as SavedView['groupBy'])}>
          <option value="none">No Group</option>
          <option value="status">Group by Status</option>
          <option value="priority">Group by Priority</option>
          <option value="project">Group by Project</option>
        </select>
        <button type="button" onClick={() => createSavedView({ name: `View ${new Date().toLocaleTimeString()}`, search, statuses: statusFilter, priorities: priorityFilter, owner: ownerScope, sortBy, sortDir, groupBy })}>Save View</button>
      </div>

      <div className="wh-filter-row">
        <div className="wh-chip-group">
          {statuses.map((s) => (
            <button key={s} type="button" className={`wh-chip ${statusFilter.includes(s) ? 'active' : ''}`} onClick={() => setStatusFilter((prev) => prev.includes(s) ? prev.filter((v) => v !== s) : [...prev, s])}>{s}</button>
          ))}
        </div>
        <div className="wh-chip-group">
          {priorities.map((p) => (
            <button key={p} type="button" className={`wh-chip ${priorityFilter.includes(p) ? 'active' : ''}`} onClick={() => setPriorityFilter((prev) => prev.includes(p) ? prev.filter((v) => v !== p) : [...prev, p])}>{p}</button>
          ))}
        </div>
      </div>

      <div className="wh-saved-views">Saved Views: {savedViews.map((v) => <span key={v.id} className="wh-badge">{v.name}</span>)}</div>

      <div className="wh-bulk-row">
        <span>{selected.length} selected</span>
        <button type="button" disabled={selected.length === 0 || !canEdit} onClick={() => bulkUpdate(selected, { status: 'In Review' })}>Bulk: Move to In Review</button>
        <button type="button" disabled={selected.length === 0 || !canEdit} onClick={() => bulkUpdate(selected, { priority: 'High' })}>Bulk: Priority High</button>
      </div>

      <div className="wh-table-wrap">
        {Object.entries(grouped).map(([group, rows]) => (
          <div key={group}>
            <div className="wh-group-header">{group} <span>{rows.length}</span></div>
            <table className="wh-table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={rows.length > 0 && rows.every((r) => selected.includes(r.id))} onChange={(e) => setSelected((prev) => e.target.checked ? Array.from(new Set([...prev, ...rows.map((r) => r.id)])) : prev.filter((id) => !rows.some((r) => r.id === id)))} /></th>
                  <th>Can Start</th><th>Due On</th><th>Name</th><th>Project</th><th>Owner</th><th>Status</th><th>Priority</th><th>Planned Completion</th><th>Queue</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className={overdue(t) ? 'overdue' : ''}>
                    <td><input type="checkbox" checked={selected.includes(t.id)} onChange={(e) => setSelected((prev) => e.target.checked ? [...prev, t.id] : prev.filter((id) => id !== t.id))} /></td>
                    <td>{t.canStart ? 'Yes' : 'No'}</td>
                    <td>{t.dueOn}</td>
                    <td><button className="wh-link-btn" type="button" onClick={() => setDetailTaskId(t.id)}>{t.name}</button></td>
                    <td>{nameById(projects, t.projectId)}</td>
                    <td>{nameById(users, t.ownerId)}</td>
                    <td>
                      {canEdit ? (
                        <select value={t.status} onChange={(e) => updateTask(t.id, { status: e.target.value as Status })}>
                          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : <span className={statusTone(t.status)}>{t.status}</span>}
                    </td>
                    <td>
                      {canEdit ? (
                        <select value={t.priority} onChange={(e) => updateTask(t.id, { priority: e.target.value as Priority })}>
                          {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      ) : <span className={priorityTone(t.priority)}>{t.priority}</span>}
                    </td>
                    <td>{t.plannedCompletion}</td>
                    <td>{t.queueType ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {detailTask && (
        <div className="wh-drawer">
          <div className="wh-drawer-header">
            <h3>{detailTask.name}</h3>
            <button type="button" onClick={() => setDetailTaskId(null)}>Close</button>
          </div>
          <div className="wh-drawer-body">
            <p>{detailTask.description}</p>
            <div className="wh-meta-row"><strong>Project:</strong> {nameById(projects, detailTask.projectId)}</div>
            <div className="wh-meta-row"><strong>Owner:</strong> {nameById(users, detailTask.ownerId)}</div>
            <div className="wh-meta-row"><strong>Status:</strong> <span className={statusTone(detailTask.status)}>{detailTask.status}</span></div>
            <div className="wh-meta-row"><strong>Priority:</strong> <span className={priorityTone(detailTask.priority)}>{detailTask.priority}</span></div>
            <div className="wh-meta-row"><strong>Tags:</strong> {detailTask.tags.join(', ')}</div>
            <div className="wh-meta-row"><strong>Updated:</strong> {new Date(detailTask.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectsModule({ projects, users, tasks }: { projects: Project[]; users: User[]; tasks: Task[] }) {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? '');
  const [tab, setTab] = useState<ProjectTab>('overview');

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? projects[0];
  const projectTasks = tasks.filter((t) => t.projectId === selectedProject.id);

  return (
    <div className="wh-project-layout">
      <div className="wh-project-list">
        <table className="wh-table">
          <thead><tr><th>Project</th><th>Code</th><th>Owner</th><th>Health</th><th>Status</th><th>Target</th></tr></thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className={p.id === selectedProject.id ? 'selected' : ''} onClick={() => setSelectedProjectId(p.id)}>
                <td>{p.name}</td><td>{p.code}</td><td>{nameById(users, p.ownerId)}</td><td>{p.health}</td><td>{p.status}</td><td>{p.targetDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="wh-project-detail">
        <div className="wh-page-header">
          <div>
            <h2>{selectedProject.name}</h2>
            <p>{selectedProject.summary}</p>
          </div>
          <div className="wh-badge">Budget ${selectedProject.budgetUSD.toLocaleString()}</div>
        </div>
        <div className="wh-tabs">
          {(['overview','tasks','risks','documents','updates','approvals'] as ProjectTab[]).map((t) => (
            <button key={t} type="button" className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        {tab === 'overview' && (
          <div className="wh-panel-grid">
            <div className="wh-card"><h3>Health</h3><p>{selectedProject.health}</p></div>
            <div className="wh-card"><h3>Department</h3><p>{selectedProject.department}</p></div>
            <div className="wh-card"><h3>Milestones</h3>{selectedProject.milestones.map((m) => <div key={m} className="wh-meta-row">• {m}</div>)}</div>
            <div className="wh-card"><h3>Activity Feed</h3>{projectTasks.slice(0,4).map((t) => <div key={t.id} className="wh-meta-row">{new Date(t.updatedAt).toLocaleDateString()} — {t.name}</div>)}</div>
          </div>
        )}
        {tab === 'tasks' && (
          <table className="wh-table">
            <thead><tr><th>Name</th><th>Owner</th><th>Status</th><th>Priority</th><th>Due</th></tr></thead>
            <tbody>{projectTasks.map((t) => <tr key={t.id}><td>{t.name}</td><td>{nameById(users, t.ownerId)}</td><td>{t.status}</td><td>{t.priority}</td><td>{t.dueOn}</td></tr>)}</tbody>
          </table>
        )}
        {tab !== 'overview' && tab !== 'tasks' && <div className="wh-card">{tab} module scaffold connected to project context.</div>}
      </div>
    </div>
  );
}

function PlaceholderModule({ label }: { label: string }) {
  return <div className="wh-card">{label} module scaffolding is enabled with shared enterprise shell context.</div>;
}

export function WorkHubApp() {
  const users = useWorkHubStore((s) => s.users);
  const tasks = useWorkHubStore((s) => s.tasks);
  const projects = useWorkHubStore((s) => s.projects);
  const auth = useWorkHubStore((s) => s.auth);
  const logout = useWorkHubStore((s) => s.logout);

  const [moduleKey, setModuleKey] = useState<ModuleKey>('my-work');

  if (!auth.authenticated || !auth.userId) return <LoginScreen users={users} />;

  const currentUser = users.find((u) => u.id === auth.userId) ?? users[0];

  return (
    <div className="wh-shell">
      <aside className="wh-sidebar">
        <div className="wh-brand">SentinelFlow</div>
        {MODULES.map((m) => (
          <button key={m.key} type="button" className={moduleKey === m.key ? 'active' : ''} onClick={() => setModuleKey(m.key)}>{m.label}</button>
        ))}
      </aside>
      <section className="wh-main">
        <header className="wh-topbar">
          <input placeholder="Global search (tasks, projects, requests, docs)" />
          <div className="wh-top-actions">
            <button type="button">Notifications</button>
            <span className="wh-badge">{currentUser.role}</span>
            <button type="button" onClick={logout}>Sign out</button>
          </div>
        </header>

        <div className="wh-page-header">
          <div>
            <h1>{MODULES.find((m) => m.key === moduleKey)?.label}</h1>
            <p>{currentUser.name} · {currentUser.team}</p>
          </div>
        </div>

        {moduleKey === 'home' && <HomeModule tasks={tasks} />}
        {moduleKey === 'my-work' && <MyWorkModule tasks={tasks} users={users} projects={projects} role={currentUser.role} />}
        {moduleKey === 'projects' && <ProjectsModule projects={projects} users={users} tasks={tasks} />}
        {moduleKey === 'requests' && <PlaceholderModule label="Requests" />}
        {moduleKey === 'reports' && <PlaceholderModule label="Reports" />}
        {moduleKey === 'dashboards' && <PlaceholderModule label="Dashboards" />}
        {moduleKey === 'documents' && <PlaceholderModule label="Documents" />}
        {moduleKey === 'proofing' && <PlaceholderModule label="Proofing" />}
        {moduleKey === 'teams' && <PlaceholderModule label="Teams" />}
        {moduleKey === 'people' && <PlaceholderModule label="People" />}
        {moduleKey === 'administration' && <PlaceholderModule label="Administration" />}
      </section>
    </div>
  );
}
