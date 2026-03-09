import { useState, useEffect } from 'react';
import { apps as allShellApps } from '../../data/apps';
import { useShellStore } from '../../state/useShellStore';

const STORAGE_KEY = 'aos-appcenter-state';

type AppCenterItem = { appId: string; order: number; pinned: boolean };

const loadState = (): AppCenterItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppCenterItem[];
  } catch {}
  return allShellApps.slice(0, 10).map((app, i) => ({ appId: app.id, order: i, pinned: false }));
};

export function AppCenterApp() {
  const openWindow = useShellStore((s) => s.openWindow);
  const [items, setItems] = useState<AppCenterItem[]>(loadState);
  const [dragId, setDragId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(items)), [items]);

  const listedIds = new Set(items.map((i) => i.appId));
  const availableApps = allShellApps.filter((a) => !listedIds.has(a.id));
  const visibleItems = [...items].sort((a, b) => a.order - b.order).filter((item) => {
    if (!searchQuery.trim()) return true;
    const app = allShellApps.find((a) => a.id === item.appId);
    if (!app) return false;
    const q = searchQuery.toLowerCase();
    return app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q);
  });

  const addToCenter = (appId: string) => {
    setItems((prev) => {
      const maxOrder = Math.max(-1, ...prev.map((x) => x.order));
      return [...prev, { appId, order: maxOrder + 1, pinned: false }];
    });
  };

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '280px 1fr', background: '#0f172a', color: '#e2e8f0' }}>
      <aside style={{ borderRight: '1px solid rgba(255,255,255,0.08)', padding: 16, overflow: 'auto' }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>App Center</div>
        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>Drag applications into the center panel</div>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search applications"
          style={{ marginTop: 12, width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#111827', color: '#e2e8f0' }}
        />
        <div style={{ marginTop: 14, fontSize: 12, textTransform: 'uppercase', color: '#64748b' }}>Available</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {availableApps.map((app) => (
            <button key={app.id} draggable onDragStart={() => setDragId(app.id)} onClick={() => addToCenter(app.id)} type="button" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, background: '#111827', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
              <img src={app.icon} alt={app.name} style={{ width: 28, height: 28, borderRadius: 8 }} />
              <span style={{ fontSize: 13 }}>{app.name}</span>
            </button>
          ))}
        </div>
      </aside>

      <section
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => {
          if (dragId && !listedIds.has(dragId)) addToCenter(dragId);
          setDragId(null);
        }}
        style={{ padding: 20, overflow: 'auto' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14 }}>
          {visibleItems.map((item) => {
            const app = allShellApps.find((a) => a.id === item.appId);
            if (!app) return null;
            return (
              <div
                key={item.appId}
                draggable
                onDragStart={() => setDragId(item.appId)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!dragId || dragId === item.appId) return;
                  setItems((prev) => {
                    const drag = prev.find((x) => x.appId === dragId);
                    const target = prev.find((x) => x.appId === item.appId);
                    if (!drag || !target) return prev;
                    return prev.map((x) => x.appId === dragId ? { ...x, order: target.order } : x.appId === item.appId ? { ...x, order: drag.order } : x);
                  });
                }}
                style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 12, display: 'grid', placeItems: 'center', gap: 8 }}
              >
                <img src={app.icon} alt={app.name} style={{ width: 52, height: 52, borderRadius: 12 }} />
                <div style={{ fontSize: 12, textAlign: 'center' }}>{app.name}</div>
                <button type="button" onClick={() => openWindow(app.id)} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.35)', color: '#bfdbfe', fontSize: 11 }}>Open</button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
