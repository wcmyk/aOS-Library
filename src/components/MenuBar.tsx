import { useEffect, useState } from 'react';

export type MenuBarProps = {
  workspaceName: string;
  stateText: string;
  jobCount: number;
  activeAppName?: string;
  onToggleSpotlight: () => void;
};

const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const fmtDate = (d: Date) => d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

function Logo() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5l7.8 4.5v9L12 20.5 4.2 16V7z" fill="currentColor" opacity="0.92" />
      <path d="M12 2.5v18M4.2 7l7.8 4.5L19.8 7" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" />
    </svg>
  );
}

export function MenuBar({ jobCount, activeAppName, onToggleSpotlight }: MenuBarProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(t);
  }, []);

  const app = activeAppName || 'Finder';
  const menus = ['File', 'Edit', 'View', 'Window', 'Help'];

  return (
    <header className="menubar">
      <div className="menubar-left">
        <button type="button" className="mb-logo" aria-label="System menu"><Logo /></button>
        <span className="mb-app">{app}</span>
        {menus.map((m) => (
          <span key={m} className="mb-menu">{m}</span>
        ))}
      </div>

      <div className="menubar-center" />

      <div className="menubar-right">
        {jobCount > 0 ? <span className="mb-item mb-jobs" title={`${jobCount} background jobs running`}>⟳ {jobCount}</span> : null}
        {/* Battery */}
        <span className="mb-item mb-battery" title="Battery: 73%">
          <span className="mb-batt-pct">73%</span>
          <svg width="26" height="13" viewBox="0 0 26 13"><rect x="0.6" y="0.6" width="21" height="11.8" rx="3" fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.85" /><rect x="2.2" y="2.2" width="14.5" height="8.6" rx="1.6" fill="currentColor" /><rect x="23" y="4" width="2" height="5" rx="1" fill="currentColor" opacity="0.85" /></svg>
        </span>
        {/* Wi-Fi */}
        <button type="button" className="mb-item" aria-label="Wi-Fi">
          <svg width="17" height="13" viewBox="0 0 20 15" fill="currentColor"><path d="M10 14.2a1.7 1.7 0 100-3.4 1.7 1.7 0 000 3.4z" /><path d="M4.6 8.2a7.6 7.6 0 0110.8 0l-1.6 1.6a5.3 5.3 0 00-7.6 0z" opacity="0.95" /><path d="M1.4 5a12.1 12.1 0 0117.2 0l-1.6 1.6a9.8 9.8 0 00-14 0z" opacity="0.85" /></svg>
        </button>
        {/* Spotlight */}
        <button type="button" className="mb-item" onClick={onToggleSpotlight} aria-label="Spotlight Search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.5-4.5" strokeLinecap="round" /></svg>
        </button>
        {/* Control Center */}
        <button type="button" className="mb-item" aria-label="Control Center">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="6" /><path d="M8 9h8M8 15h8" strokeLinecap="round" /><circle cx="10" cy="9" r="1.6" fill="currentColor" stroke="none" /><circle cx="14" cy="15" r="1.6" fill="currentColor" stroke="none" /></svg>
        </button>
        <button type="button" className="mb-clock" onClick={onToggleSpotlight}>
          <span className="mb-date">{fmtDate(now)}</span>
          <span className="mb-time">{fmtTime(now)}</span>
        </button>
      </div>
    </header>
  );
}
