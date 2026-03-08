import { useEffect, useMemo, useState } from 'react';
import type { ShellApp } from '../data/apps';
import type { WindowState } from '../state/useShellStore';

type DockProps = {
  apps: ShellApp[];
  windows: WindowState[];
  onLaunch: (appId: string) => void;
};

const DOCK_ORDER_KEY = 'aos-dock-order-v2';

export function Dock({ apps, windows, onLaunch }: DockProps) {
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const openApps = new Set(windows.filter((win) => !win.minimized).map((win) => win.appId));

  useEffect(() => {
    const saved = localStorage.getItem(DOCK_ORDER_KEY);
    const parsed = saved ? (JSON.parse(saved) as string[]) : [];
    const ids = apps.map((a) => a.id);
    const merged = [...parsed.filter((id) => ids.includes(id)), ...ids.filter((id) => !parsed.includes(id))];
    setOrder(merged);
  }, [apps]);

  useEffect(() => {
    if (order.length) localStorage.setItem(DOCK_ORDER_KEY, JSON.stringify(order));
  }, [order]);

  const orderedApps = useMemo(() => {
    if (!order.length) return apps;
    const map = new Map(apps.map((a) => [a.id, a]));
    return order.map((id) => map.get(id)).filter(Boolean) as ShellApp[];
  }, [apps, order]);

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(dragId);
      const to = next.indexOf(targetId);
      if (from < 0 || to < 0) return prev;
      next.splice(from, 1);
      next.splice(to, 0, dragId);
      return next;
    });
    setDragId(null);
  };

  return (
    <div className="dock" onMouseLeave={() => setHoverIndex(null)}>
      {orderedApps.map((app, index) => {
        const dist = hoverIndex == null ? 99 : Math.abs(hoverIndex - index);
        const scale = hoverIndex == null ? 1 : dist === 0 ? 1.32 : dist === 1 ? 1.18 : dist === 2 ? 1.07 : 1;
        const lift = hoverIndex == null ? 0 : dist === 0 ? -18 : dist === 1 ? -12 : dist === 2 ? -6 : 0;
        return (
          <button
            key={app.id}
            draggable
            onDragStart={() => setDragId(app.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(app.id)}
            onDragEnd={() => setDragId(null)}
            className={`dock-item ${launchingId === app.id ? 'launching' : ''}`}
            onMouseEnter={() => setHoverIndex(index)}
            onClick={() => {
              setLaunchingId(app.id);
              setTimeout(() => setLaunchingId(null), 420);
              onLaunch(app.id);
            }}
            style={{ transform: `translateY(${lift}px) scale(${scale})` }}
            type="button"
            aria-label={`Open ${app.name}`}
          >
            <img src={app.icon} alt={app.name} className="dock-icon" style={{ width: 58, height: 58, borderRadius: 12 }} />
            <span className="dock-label">{app.name}</span>
            {openApps.has(app.id) && <span className="dock-indicator" />}
          </button>
        );
      })}
    </div>
  );
}
