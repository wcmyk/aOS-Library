import { useMemo, useState } from 'react';
import { useDriveStore, type DriveDocument } from '../../state/useDriveStore';

type SanctumAppProps = {
  onOpenDocument?: (doc: DriveDocument) => void;
};

type NavSection = 'home' | 'my-drive' | 'shared' | 'recent' | 'starred';
type ViewMode = 'grid' | 'list';
type SortKey = 'name' | 'modified' | 'owner';

const DocIcon = ({ type }: { type: 'document' | 'spreadsheet' }) =>
  type === 'spreadsheet' ? (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="3" fill="#217346" />
      <rect x="3" y="5" width="14" height="1.5" rx="0.5" fill="rgba(255,255,255,0.9)" />
      <rect x="3" y="9" width="14" height="1.5" rx="0.5" fill="rgba(255,255,255,0.7)" />
      <rect x="3" y="13" width="9" height="1.5" rx="0.5" fill="rgba(255,255,255,0.7)" />
      <rect x="9" y="3" width="1.5" height="14" rx="0.5" fill="rgba(255,255,255,0.3)" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="3" fill="#2b579a" />
      <rect x="3" y="5" width="14" height="1.5" rx="0.5" fill="rgba(255,255,255,0.9)" />
      <rect x="3" y="8.5" width="14" height="1.5" rx="0.5" fill="rgba(255,255,255,0.7)" />
      <rect x="3" y="12" width="10" height="1.5" rx="0.5" fill="rgba(255,255,255,0.7)" />
      <rect x="3" y="15.5" width="8" height="1.5" rx="0.5" fill="rgba(255,255,255,0.5)" />
    </svg>
  );

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="1" y="1" width="6" height="6" rx="1" />
    <rect x="9" y="1" width="6" height="6" rx="1" />
    <rect x="1" y="9" width="6" height="6" rx="1" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
  </svg>
);

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="1" y="2" width="14" height="2" rx="1" />
    <rect x="1" y="7" width="14" height="2" rx="1" />
    <rect x="1" y="12" width="14" height="2" rx="1" />
  </svg>
);

export function SanctumApp({ onOpenDocument }: SanctumAppProps) {
  const { documents } = useDriveStore();
  const [nav, setNav] = useState<NavSection>('home');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortKey, setSortKey] = useState<SortKey>('modified');
  const [search, setSearch] = useState('');
  const [starred, setStarred] = useState<Set<string>>(new Set());

  const stats = useMemo(() => {
    const shared = documents.filter((d) => d.sharedWith.length > 0 || d.owner !== 'You').length;
    const mine = documents.filter((d) => d.owner === 'You').length;
    const sheets = documents.filter((d) => d.type === 'spreadsheet').length;
    return { shared, mine, sheets, total: documents.length };
  }, [documents]);

  const visibleDocs = useMemo(() => {
    let docs = [...documents];
    if (nav === 'my-drive') docs = docs.filter((d) => d.owner === 'You');
    else if (nav === 'shared') docs = docs.filter((d) => d.sharedWith.length > 0 || d.owner !== 'You');
    else if (nav === 'recent') docs = docs.slice(0, 8);
    else if (nav === 'starred') docs = docs.filter((d) => starred.has(d.id));

    if (search) {
      const q = search.toLowerCase();
      docs = docs.filter((d) => d.title.toLowerCase().includes(q) || d.owner.toLowerCase().includes(q));
    }

    docs.sort((a, b) => {
      if (sortKey === 'name') return a.title.localeCompare(b.title);
      if (sortKey === 'owner') return a.owner.localeCompare(b.owner);
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    });

    return docs;
  }, [documents, nav, search, sortKey, starred]);

  const toggleStar = (id: string) => {
    setStarred((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const navItems: { id: NavSection; label: string; icon: JSX.Element | string; count?: number }[] = [
    { id: 'home', label: 'Home', icon: '⌂' },
    { id: 'my-drive', label: 'My Drive', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M7 18a4 4 0 0 1-.6-7.96 5.5 5.5 0 0 1 10.8 1.1A3.5 3.5 0 0 1 17 18z"/></svg>, count: stats.mine },
    { id: 'shared', label: 'Shared', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 6a3 3 0 0 1 0 5.6M16.5 13.6A5.5 5.5 0 0 1 20.5 19"/></svg>, count: stats.shared },
    { id: 'recent', label: 'Recent', icon: '⏱' },
    { id: 'starred', label: 'Starred', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 4.5 14.3 9.3l5.2.7-3.8 3.6.9 5.2L12 16.3l-4.6 2.5.9-5.2L4.5 10l5.2-.7z"/></svg>, count: starred.size },
  ];

  const navLabel = navItems.find((n) => n.id === nav)?.label ?? 'Home';

  return (
    <div className="sct-shell">
      {/* Left Sidebar */}
      <aside className="sct-sidebar">
        <div className="sct-brand">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <ellipse cx="11" cy="14" rx="9" ry="6" fill="rgba(79,140,255,0.25)" stroke="rgba(79,140,255,0.7)" strokeWidth="1.5" />
            <ellipse cx="7.5" cy="12" rx="6" ry="4" fill="rgba(120,170,255,0.3)" stroke="rgba(120,170,255,0.6)" strokeWidth="1.5" />
            <ellipse cx="14" cy="11" rx="6" ry="4" fill="rgba(180,210,255,0.35)" stroke="rgba(180,210,255,0.7)" strokeWidth="1.5" />
          </svg>
          <span className="sct-brand-name">Sanctum</span>
        </div>

        <nav className="sct-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sct-nav-item${nav === item.id ? ' active' : ''}`}
              onClick={() => setNav(item.id)}
            >
              <span className="sct-nav-icon">{item.icon}</span>
              <span className="sct-nav-label">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="sct-nav-count">{item.count}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sct-sidebar-section-title">Storage</div>
        <div className="sct-storage">
          <div className="sct-storage-bar">
            <div className="sct-storage-fill" style={{ width: `${Math.min(100, (stats.total / 10) * 100)}%` }} />
          </div>
          <span className="sct-storage-label">{stats.total} files · 5 GB of 15 GB used</span>
        </div>

        <div className="sct-sidebar-section-title" style={{ marginTop: 12 }}>Quick Access</div>
        <div className="sct-quick-access">
          <button type="button" className="sct-quick-btn"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></svg> Documents</button>
          <button type="button" className="sct-quick-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M8 16v-5M12 16V8M16 16v-3"/></svg> Workbooks</button>
          <button type="button" className="sct-quick-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3.5 7h17v13h-17z"/><path d="M7 7V4.5h10V7M3.5 11h17"/></svg> Archive</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="sct-main">
        {/* Top Bar */}
        <div className="sct-topbar">
          <div className="sct-search-wrap">
            <svg className="sct-search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
              <line x1="10" y1="10" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              className="sct-search"
              placeholder="Search files, people, and more..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="sct-topbar-actions">
            <select
              className="sct-sort-select"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              <option value="modified">Modified</option>
              <option value="name">Name</option>
              <option value="owner">Owner</option>
            </select>

            <div className="sct-view-toggle">
              <button
                type="button"
                className={`sct-view-btn${viewMode === 'grid' ? ' active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <GridIcon />
              </button>
              <button
                type="button"
                className={`sct-view-btn${viewMode === 'list' ? ' active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <ListIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Breadcrumb + Title */}
        <div className="sct-breadcrumb">
          <span className="sct-breadcrumb-root">Sanctum Drive</span>
          <span className="sct-breadcrumb-sep">›</span>
          <span className="sct-breadcrumb-current">{navLabel}</span>
          <span className="sct-file-count">{visibleDocs.length} item{visibleDocs.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Stats Row (Home only) */}
        {nav === 'home' && (
          <div className="sct-stats-row">
            <div className="sct-stat-card">
              <div className="sct-stat-icon" style={{ background: 'rgba(43,87,154,0.3)', color: '#6faaff' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></svg></div>
              <div>
                <div className="sct-stat-value">{stats.mine}</div>
                <div className="sct-stat-label">My Files</div>
              </div>
            </div>
            <div className="sct-stat-card">
              <div className="sct-stat-icon" style={{ background: 'rgba(33,115,70,0.3)', color: '#5de09a' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M8 16v-5M12 16V8M16 16v-3"/></svg></div>
              <div>
                <div className="sct-stat-value">{stats.sheets}</div>
                <div className="sct-stat-label">Workbooks</div>
              </div>
            </div>
            <div className="sct-stat-card">
              <div className="sct-stat-icon" style={{ background: 'rgba(180,100,30,0.3)', color: '#ffa94d' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 6a3 3 0 0 1 0 5.6M16.5 13.6A5.5 5.5 0 0 1 20.5 19"/></svg></div>
              <div>
                <div className="sct-stat-value">{stats.shared}</div>
                <div className="sct-stat-label">Shared</div>
              </div>
            </div>
            <div className="sct-stat-card">
              <div className="sct-stat-icon" style={{ background: 'rgba(100,60,180,0.3)', color: '#c084fc' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 4.5 14.3 9.3l5.2.7-3.8 3.6.9 5.2L12 16.3l-4.6 2.5.9-5.2L4.5 10l5.2-.7z"/></svg></div>
              <div>
                <div className="sct-stat-value">{starred.size}</div>
                <div className="sct-stat-label">Starred</div>
              </div>
            </div>
          </div>
        )}

        {/* Files */}
        {visibleDocs.length === 0 ? (
          <div className="sct-empty">
            <div className="sct-empty-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3.5 6A1.5 1.5 0 0 1 5 4.5h4l2 2.5h8A1.5 1.5 0 0 1 20.5 8.5V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z"/></svg></div>
            <div className="sct-empty-title">No files here</div>
            <div className="sct-empty-sub">
              {search ? 'Try a different search term.' : 'Files you add will appear here.'}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="sct-grid">
            {visibleDocs.map((doc) => (
              <div key={doc.id} className="sct-file-card">
                <div className="sct-file-thumb" onClick={() => onOpenDocument?.(doc)}>
                  <div className="sct-file-thumb-bg">
                    <div className="sct-file-thumb-lines">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="sct-thumb-line" style={{ width: `${70 - i * 8}%`, opacity: 0.5 - i * 0.06 }} />
                      ))}
                    </div>
                  </div>
                  <div className="sct-file-type-badge">
                    <DocIcon type={doc.type} />
                  </div>
                </div>
                <div className="sct-file-meta">
                  <div className="sct-file-name" onClick={() => onOpenDocument?.(doc)} title={doc.title}>
                    {doc.title}
                  </div>
                  <div className="sct-file-info">
                    <span>{doc.owner}</span>
                    <span>·</span>
                    <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`sct-star-btn${starred.has(doc.id) ? ' starred' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleStar(doc.id); }}
                  title={starred.has(doc.id) ? 'Unstar' : 'Star'}
                >
                  ★
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="sct-list">
            <div className="sct-list-header">
              <span className="sct-list-col-name">Name</span>
              <span className="sct-list-col">Owner</span>
              <span className="sct-list-col">Modified</span>
              <span className="sct-list-col">Location</span>
              <span className="sct-list-col sct-list-col-action" />
            </div>
            {visibleDocs.map((doc) => (
              <button
                key={doc.id}
                type="button"
                className="sct-list-row"
                onClick={() => onOpenDocument?.(doc)}
              >
                <span className="sct-list-col-name">
                  <span className="sct-list-icon"><DocIcon type={doc.type} /></span>
                  <span className="sct-list-filename">{doc.title}</span>
                  {doc.sharedWith.length > 0 && <span className="sct-shared-badge">Shared</span>}
                </span>
                <span className="sct-list-col sct-list-owner">{doc.owner}</span>
                <span className="sct-list-col">{new Date(doc.updatedAt).toLocaleDateString()}</span>
                <span className="sct-list-col sct-list-folder">{doc.folder}</span>
                <span className="sct-list-col sct-list-col-action">
                  <span
                    className={`sct-star-inline${starred.has(doc.id) ? ' starred' : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleStar(doc.id); }}
                  >★</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
