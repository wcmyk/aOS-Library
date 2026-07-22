import { useEffect, useMemo, useState } from 'react';
import { useShellStore } from '../state/useShellStore';
import './launchpad.css';

// macOS-style Launchpad: a full-screen frosted-glass overlay with a centered,
// paginated grid of every installed app. Opened from the Dock's Launchpad
// button; the Dock is raised above it so it stays visible at the bottom.

const PAGE_SIZE = 35; // 7 columns × 5 rows, like macOS

export function Launchpad() {
  const open = useShellStore((s) => s.launchpadOpen);
  const toggle = useShellStore((s) => s.toggleLaunchpad);
  const openWindow = useShellStore((s) => s.openWindow);
  const apps = useShellStore((s) => s.apps);

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  // Reset transient state each time the Launchpad opens.
  useEffect(() => {
    if (open) {
      setQuery('');
      setPage(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggle(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, toggle]);

  const launchable = useMemo(() => apps.filter((a) => !a.dockHidden), [apps]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return launchable;
    return launchable.filter((a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
  }, [launchable, query]);

  const pages = useMemo(() => {
    const out: typeof filtered[] = [];
    for (let i = 0; i < filtered.length; i += PAGE_SIZE) out.push(filtered.slice(i, i + PAGE_SIZE));
    return out.length ? out : [[]];
  }, [filtered]);

  const currentPage = Math.min(page, pages.length - 1);

  if (!open) return null;

  const launch = (id: string) => {
    openWindow(id); // openWindow also closes the Launchpad
  };

  return (
    <div className="lp-overlay" onClick={() => toggle(false)}>
      <div className="lp-search-wrap" onClick={(e) => e.stopPropagation()}>
        <div className="lp-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.2">
            <circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" />
          </svg>
          <input
            autoFocus
            placeholder="Search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
          />
        </div>
      </div>

      <div className="lp-grid-wrap" onClick={() => toggle(false)}>
        <div className="lp-grid" onClick={(e) => e.stopPropagation()}>
          {pages[currentPage].map((app) => (
            <button key={app.id} type="button" className="lp-tile" onClick={() => launch(app.id)}>
              <img src={app.icon} alt={app.name} className="lp-icon" />
              <span className="lp-label">{app.name}</span>
            </button>
          ))}
        </div>
      </div>

      {pages.length > 1 && (
        <div className="lp-dots" onClick={(e) => e.stopPropagation()}>
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`lp-dot ${i === currentPage ? 'active' : ''}`}
              aria-label={`Page ${i + 1}`}
              onClick={() => setPage(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
