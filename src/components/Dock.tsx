import { useEffect, useMemo, useState } from 'react';
import type { ShellApp } from '../data/apps';
import type { WindowState } from '../state/useShellStore';

type DockProps = {
  apps: ShellApp[];
  windows: WindowState[];
  onLaunch: (appId: string) => void;
  onLaunchpad: () => void;
  launchpadOpen: boolean;
};

const DOCK_ORDER_KEY = 'aos-dock-order-v2';
const BASE_SIZE = 52; // preferred icon size
const MIN_SIZE = 30; // shrink floor before the dock would overflow
const GAP = 8;

export function Dock({ apps, windows, onLaunch, onLaunchpad, launchpadOpen }: DockProps) {
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1440));
  const openApps = new Set(windows.filter((win) => !win.minimized).map((win) => win.appId));

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
    const visible = apps.filter((a) => !a.dockHidden);
    if (!order.length) return visible;
    const map = new Map(visible.map((a) => [a.id, a]));
    return order.filter((id) => map.has(id)).map((id) => map.get(id)).filter(Boolean) as ShellApp[];
  }, [apps, order]);

  // Responsive sizing: shrink icons so the whole dock always fits on screen
  // (mirrors how the macOS dock scales down when it runs out of room).
  const slots = orderedApps.length + 1; // + Launchpad
  const available = vw - 48 /* screen margins */ - 28 /* dock padding + divider */;
  const size = Math.max(MIN_SIZE, Math.min(BASE_SIZE, Math.floor(available / slots) - GAP));
  const canMagnify = size >= 44; // only bounce when there is room to grow

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
    <div className="dock" style={{ gap: GAP, ...(launchpadOpen ? { zIndex: 9991 } : null) }} onMouseLeave={() => setHoverIndex(null)}>
      {orderedApps.map((app, index) => {
        const dist = hoverIndex == null || !canMagnify ? 99 : Math.abs(hoverIndex - index);
        const scale = dist === 0 ? 1.34 : dist === 1 ? 1.2 : dist === 2 ? 1.08 : 1;
        const lift = dist === 0 ? -18 : dist === 1 ? -12 : dist === 2 ? -6 : 0;
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
            style={{ width: size, height: size, transform: `translateY(${lift}px) scale(${scale})`, transformOrigin: 'bottom center' }}
            type="button"
            aria-label={`Open ${app.name}`}
          >
            <img src={app.icon} alt={app.name} className="dock-icon" style={{ width: size, height: size, borderRadius: size * 0.23 }} />
            <span className="dock-label">{app.name}</span>
            {openApps.has(app.id) && <span className="dock-indicator" />}
          </button>
        );
      })}

      <span className="dock-divider" aria-hidden="true" />

      <button
        className="dock-item"
        onMouseEnter={() => setHoverIndex(null)}
        onClick={onLaunchpad}
        style={{ width: size, height: size }}
        type="button"
        aria-label="Open Launchpad"
      >
        <span className="dock-launchpad" style={{ width: size, height: size, borderRadius: size * 0.23 }} aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} />
          ))}
        </span>
        <span className="dock-label">Launchpad</span>
        {launchpadOpen && <span className="dock-indicator" />}
      </button>
    </div>
  );
}
