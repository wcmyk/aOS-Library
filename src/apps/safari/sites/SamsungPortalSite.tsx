import { useState } from 'react';
import { useProfileStore } from '../../../state/useProfileStore';

type TaskStatus = 'todo' | 'doing' | 'review' | 'done';

const SPRINT_TASKS = [
  { id: 1, title: 'Exynos 2500 thermal throttle optimization', status: 'doing' as TaskStatus, priority: 'Critical', team: 'Chip / SoC', pts: 13 },
  { id: 2, title: 'Galaxy Fold 6 hinge stress test firmware patch', status: 'review' as TaskStatus, priority: 'High', team: 'Hardware', pts: 8 },
  { id: 3, title: 'One UI 7 camera app crash — portrait mode Samsung S25U', status: 'doing' as TaskStatus, priority: 'Critical', team: 'Software', pts: 8 },
  { id: 4, title: 'Cross-team sync: Korean/US display driver delta', status: 'todo' as TaskStatus, priority: 'Medium', team: 'Display', pts: 5 },
  { id: 5, title: 'BT stack memory leak — Buds3 Pro pairing sequence', status: 'done' as TaskStatus, priority: 'High', team: 'IoT', pts: 5 },
  { id: 6, title: 'SmartThings Matter protocol v1.3 compatibility', status: 'todo' as TaskStatus, priority: 'Medium', team: 'IoT', pts: 8 },
  { id: 7, title: 'CognitiV bottleneck prediction model retrain — Q2 data', status: 'doing' as TaskStatus, priority: 'High', team: 'AI/ML', pts: 13 },
  { id: 8, title: 'DRAM supply chain delay impact analysis', status: 'done' as TaskStatus, priority: 'Medium', team: 'Operations', pts: 3 },
];

const COGNITIVV_ALERTS = [
  { severity: 'warn', msg: 'Display driver integration sprint at 87% capacity — recommend deferring non-critical items', team: 'Display', confidence: '91%' },
  { severity: 'info', msg: 'Korean team velocity trending 12% above plan — early completion of Exynos block expected', team: 'Chip/SoC', confidence: '78%' },
  { severity: 'crit', msg: 'Software branch divergence detected — One UI/Android convergence risk for May 15 release gate', team: 'Software', confidence: '94%' },
  { severity: 'info', msg: 'IoT team timezone sync window optimal: 09:00–11:00 KST / 19:00–21:00 ET', team: 'IoT', confidence: '99%' },
];

const TEAM_STATUS = [
  { city: 'Suwon, KR', status: 'Active', time: '11:00 AM KST', members: 24, sprint: '68%' },
  { city: 'Austin, TX', status: 'Active', time: '09:00 PM ET', members: 11, sprint: '54%' },
  { city: 'Ho Chi Minh City, VN', status: 'Active', time: '09:00 AM ICT', members: 8, sprint: '71%' },
  { city: 'London, UK', status: 'EOD', time: '03:00 AM GMT', members: 6, sprint: '48%' },
];

const COL_LABEL: Record<TaskStatus, string> = { todo: 'To Do', doing: 'Doing', review: 'Review', done: 'Done' };
const COLS: TaskStatus[] = ['todo', 'doing', 'review', 'done'];
const SEVERITY_COLOR: Record<string, string> = { crit: '#d13438', warn: '#e05c00', info: '#0078d4' };

export function SamsungPortalSite() {
  const { acceptedJob } = useProfileStore();
  const [taskStatuses, setTaskStatuses] = useState<Record<number, TaskStatus>>({});
  const role = acceptedJob?.role ?? 'Engineer';

  const tasks = SPRINT_TASKS.map((t) => ({ ...t, status: taskStatuses[t.id] ?? t.status }));
  const move = (id: number, s: TaskStatus) => setTaskStatuses((p) => ({ ...p, [id]: s }));

  return (
    <div className="sams-shell">
      <header className="sams-header">
        <div className="sams-logo">
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="4" fill="#1428a0"/>
            <text x="20" y="27" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white" fontFamily="Arial">S</text>
          </svg>
          <span className="sams-brand">Samsung PLCM Portal</span>
        </div>
        <div className="sams-header-right">
          <span className="sams-role-badge">{role}</span>
        </div>
      </header>

      <div className="sams-body">
        {/* CognitiV Panel */}
        <div className="sams-cognitivv">
          <div className="sams-cog-title">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#1428a0" strokeWidth="1.5"/><path d="M5 8l2 2 4-4" stroke="#1428a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
            CognitiV Network Operations Suite
          </div>
          {COGNITIVV_ALERTS.map((a, i) => (
            <div key={i} className="sams-cog-alert" style={{ borderLeftColor: SEVERITY_COLOR[a.severity] }}>
              <span className="sams-cog-sev" style={{ color: SEVERITY_COLOR[a.severity] }}>{a.severity.toUpperCase()}</span>
              <span className="sams-cog-msg">{a.msg}</span>
              <span className="sams-cog-conf">Confidence: {a.confidence}</span>
            </div>
          ))}
        </div>

        {/* Sprint Board */}
        <div className="sams-board">
          <div className="sams-board-title">Sprint 24-Q2 — Samsung Galaxy Platform</div>
          <div className="sams-kanban">
            {COLS.map((col) => {
              const ct = tasks.filter((t) => t.status === col);
              return (
                <div key={col} className="sams-col">
                  <div className="sams-col-hdr">
                    <span>{COL_LABEL[col]}</span>
                    <span className="sams-col-count">{ct.length}</span>
                  </div>
                  {ct.map((t) => (
                    <div key={t.id} className="sams-task">
                      <div className="sams-task-title">{t.title}</div>
                      <div className="sams-task-meta">
                        <span className="sams-team">{t.team}</span>
                        <span className="sams-pts">{t.pts}sp</span>
                      </div>
                      <select className="sams-status-sel" value={t.status} onChange={(e) => move(t.id, e.target.value as TaskStatus)}>
                        {COLS.map(c => <option key={c} value={c}>{COL_LABEL[c]}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cross-timezone Status */}
        <div className="sams-tz-panel">
          <div className="sams-tz-title">Cross-Timezone Team Status</div>
          <div className="sams-tz-grid">
            {TEAM_STATUS.map((t) => (
              <div key={t.city} className="sams-tz-card">
                <div className="sams-tz-city">{t.city}</div>
                <div className="sams-tz-time">{t.time}</div>
                <div className={`sams-tz-status ${t.status === 'EOD' ? 'eod' : 'active'}`}>{t.status}</div>
                <div className="sams-tz-meta">{t.members} engineers · Sprint {t.sprint}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
