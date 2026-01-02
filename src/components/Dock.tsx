import { useState } from 'react';
import type { ShellApp } from '../data/apps';
import type { WindowState } from '../state/useShellStore';

type DockProps = {
  apps: ShellApp[];
  windows: WindowState[];
  onLaunch: (appId: string) => void;
};

export function Dock({ apps, windows, onLaunch }: DockProps) {
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const openApps = new Set(windows.filter((win) => !win.minimized).map((win) => win.appId));

  const handleClick = (id: string) => {
    setLaunchingId(id);
    setTimeout(() => setLaunchingId(null), 420);
    onLaunch(id);
  };

  return (
    <div className="dock">
      {apps.map((app) => (
        <button
          key={app.id}
          className={`dock-item ${launchingId === app.id ? 'launching' : ''}`}
          onClick={() => handleClick(app.id)}
          type="button"
          aria-label={`Open ${app.name}`}
        >
          <img
            src={app.icon}
            alt={app.name}
            className="dock-icon"
            style={{ width: 48, height: 48, borderRadius: 10 }}
          />
          <span className="dock-label">{app.name.split(' ')[0]}</span>
          {openApps.has(app.id) && <span className="dock-indicator" />}
        </button>
      ))}
    </div>
  );
}
