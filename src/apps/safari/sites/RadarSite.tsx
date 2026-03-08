import { useState } from 'react';
import { useProfileStore } from '../../../state/useProfileStore';

type RadarStatus = 'Open' | 'In Progress' | 'Needs Info' | 'Closed';
type RadarPriority = 'Critical' | 'High' | 'Medium' | 'Low';
type RadarBug = { id: number; title: string; status: RadarStatus; priority: RadarPriority; component: string; assignee: string; updated: string };

function pad(n: number) { return String(n).padStart(6, '0'); }

const BUGS: RadarBug[] = [
  { id: 94821, title: 'UITableView cells misaligned after rotation on iPad Pro', status: 'Open', priority: 'High', component: 'UIKit', assignee: 'You', updated: '2h ago' },
  { id: 94756, title: 'Core ML model inference 15% slower on A17 Pro vs A16', status: 'In Progress', priority: 'Critical', component: 'Core ML', assignee: 'You', updated: '1d ago' },
  { id: 94601, title: 'SwiftUI @State not invalidating on background thread update', status: 'Needs Info', priority: 'Medium', component: 'SwiftUI', assignee: 'Platform Team', updated: '3d ago' },
  { id: 94490, title: 'Bluetooth LE connection drops after screen lock on iOS 17.4', status: 'Open', priority: 'High', component: 'Bluetooth Stack', assignee: 'You', updated: '4d ago' },
  { id: 94312, title: 'AVFoundation audio session interrupted by CallKit improperly', status: 'In Progress', priority: 'High', component: 'AVFoundation', assignee: 'Media', updated: '5d ago' },
  { id: 94201, title: 'Metal shader compilation 200ms delay on first launch', status: 'Open', priority: 'Medium', component: 'Metal', assignee: 'You', updated: '1w ago' },
  { id: 93998, title: 'NSURLSession cookies not persisting across app restarts', status: 'Closed', priority: 'Low', component: 'Foundation', assignee: 'Platform Team', updated: '2w ago' },
  { id: 93812, title: 'Dynamic Island activity shows incorrect elapsed time', status: 'Closed', priority: 'Medium', component: 'Live Activities', assignee: 'You', updated: '2w ago' },
];

const STATUS_COLOR: Record<RadarStatus, string> = {
  'Open': '#d13438',
  'In Progress': '#0078d4',
  'Needs Info': '#e05c00',
  'Closed': '#107c10',
};

const PRIORITY_COLOR: Record<RadarPriority, string> = {
  'Critical': '#d13438',
  'High': '#e05c00',
  'Medium': '#0078d4',
  'Low': '#5e7399',
};

export function RadarSite() {
  const { acceptedJob } = useProfileStore();
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const company = acceptedJob?.company ?? 'Apple';
  const filtered = filter === 'all' ? BUGS : BUGS.filter(b => b.status === filter);
  const selectedBug = BUGS.find(b => b.id === selected);

  return (
    <div className="radar-shell">
      <header className="radar-header">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" stroke="#0071e3" strokeWidth="1.5" fill="none"/>
          <circle cx="10" cy="10" r="5" stroke="#0071e3" strokeWidth="1.5" fill="none"/>
          <circle cx="10" cy="10" r="2" fill="#0071e3"/>
          <line x1="10" y1="1" x2="10" y2="5" stroke="#0071e3" strokeWidth="1.5"/>
          <line x1="10" y1="15" x2="10" y2="19" stroke="#0071e3" strokeWidth="1.5"/>
          <line x1="1" y1="10" x2="5" y2="10" stroke="#0071e3" strokeWidth="1.5"/>
          <line x1="15" y1="10" x2="19" y2="10" stroke="#0071e3" strokeWidth="1.5"/>
        </svg>
        <span className="radar-brand">Radar</span>
        <span className="radar-company">{company} Internal</span>
      </header>

      <div className="radar-layout">
        <aside className="radar-sidebar">
          <div className="radar-filter-title">Filter</div>
          {['all', 'Open', 'In Progress', 'Needs Info', 'Closed'].map((f) => (
            <button key={f} type="button"
              className={`radar-filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All Items' : f}
              <span className="radar-filter-count">{f === 'all' ? BUGS.length : BUGS.filter(b => b.status === f).length}</span>
            </button>
          ))}
        </aside>

        <div className="radar-list">
          {filtered.map(bug => (
            <button key={bug.id} type="button"
              className={`radar-row${selected === bug.id ? ' selected' : ''}`}
              onClick={() => setSelected(bug.id)}
            >
              <div className="radar-row-top">
                <span className="radar-id">RAD-{pad(bug.id)}</span>
                <span className="radar-status" style={{ color: STATUS_COLOR[bug.status] }}>{bug.status}</span>
              </div>
              <div className="radar-row-title">{bug.title}</div>
              <div className="radar-row-meta">
                <span>{bug.component}</span>
                <span className="radar-sep">·</span>
                <span style={{ color: PRIORITY_COLOR[bug.priority] }}>{bug.priority}</span>
                <span className="radar-sep">·</span>
                <span>{bug.updated}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="radar-detail">
          {!selectedBug ? (
            <div className="radar-empty">Select an item to view details</div>
          ) : (
            <div className="radar-detail-inner">
              <div className="radar-detail-id">RAD-{pad(selectedBug.id)}</div>
              <div className="radar-detail-title">{selectedBug.title}</div>
              <div className="radar-detail-grid">
                <div className="radar-detail-field"><label>Status</label><span style={{ color: STATUS_COLOR[selectedBug.status] }}>{selectedBug.status}</span></div>
                <div className="radar-detail-field"><label>Priority</label><span style={{ color: PRIORITY_COLOR[selectedBug.priority] }}>{selectedBug.priority}</span></div>
                <div className="radar-detail-field"><label>Component</label><span>{selectedBug.component}</span></div>
                <div className="radar-detail-field"><label>Assignee</label><span>{selectedBug.assignee}</span></div>
                <div className="radar-detail-field"><label>Last Updated</label><span>{selectedBug.updated}</span></div>
              </div>
              <div className="radar-detail-section">Description</div>
              <div className="radar-detail-desc">
                Steps to reproduce: {selectedBug.title.toLowerCase()}.<br/><br/>
                Expected: Feature works as documented in Apple API guidelines.<br/>
                Actual: Behavior deviates from expected. Reproducible on device; not on simulator.<br/><br/>
                Affects: Production build. Reported by QA team during regression. Linked to {selectedBug.component} subsystem.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
