import { useState, useEffect, useCallback } from 'react';
import { apps as allShellApps } from '../../data/apps';
import { useShellStore } from '../../state/useShellStore';

const STORAGE_KEY = 'aos-appcenter-state';

type AppCenterItem = {
  appId: string;
  order: number;
  pinned: boolean;
};

function loadState(): AppCenterItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppCenterItem[];
  } catch {}
  return [];
}

function saveState(items: AppCenterItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function AppCenterApp() {
  const openWindow = useShellStore((s) => s.openWindow);
  const [items, setItems] = useState<AppCenterItem[]>(() => {
    const saved = loadState();
    if (saved.length > 0) return saved;
    // Seed with all shell apps
    return allShellApps.map((app, i) => ({ appId: app.id, order: i, pinned: false }));
  });
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'all' | 'pinned'>('all');

  useEffect(() => {
    saveState(items);
  }, [items]);

  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  const visibleItems = sortedItems.filter((item) => {
    if (view === 'pinned' && !item.pinned) return false;
    if (searchQuery.trim()) {
      const app = allShellApps.find((a) => a.id === item.appId);
      if (!app) return false;
      return app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             app.description.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const handleDragStart = useCallback((appId: string) => {
    setDragId(appId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, appId: string) => {
    e.preventDefault();
    setDragOver(appId);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDragOver(null);
      return;
    }

    setItems((prev) => {
      const dragItem = prev.find((i) => i.appId === dragId);
      const targetItem = prev.find((i) => i.appId === targetId);
      if (!dragItem || !targetItem) return prev;

      const dragOrder = dragItem.order;
      const targetOrder = targetItem.order;

      return prev.map((item) => {
        if (item.appId === dragId) return { ...item, order: targetOrder };
        if (item.appId === targetId) return { ...item, order: dragOrder };
        return item;
      });
    });

    setDragId(null);
    setDragOver(null);
  }, [dragId]);

  const togglePin = (appId: string) => {
    setItems((prev) => prev.map((item) => item.appId === appId ? { ...item, pinned: !item.pinned } : item));
  };

  const removeApp = (appId: string) => {
    setItems((prev) => prev.filter((item) => item.appId !== appId));
  };

  const addAllMissing = () => {
    setItems((prev) => {
      const existingIds = new Set(prev.map((i) => i.appId));
      const maxOrder = Math.max(...prev.map((i) => i.order), -1);
      const toAdd = allShellApps.filter((a) => !existingIds.has(a.id)).map((a, idx) => ({
        appId: a.id,
        order: maxOrder + 1 + idx,
        pinned: false,
      }));
      return [...prev, ...toAdd];
    });
  };

  const pinnedCount = items.filter((i) => i.pinned).length;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(145deg, #0f1218, #1a1f2e)',
      fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif",
      color: '#e2e8f0',
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
          }}>
            ⊞
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>App Center</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{items.length} apps · {pinnedCount} pinned</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={addAllMissing}
              style={{
                padding: '7px 14px',
                borderRadius: 10,
                background: 'rgba(102,126,234,0.15)',
                border: '1px solid rgba(102,126,234,0.3)',
                color: '#a5b4fc',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Add All Apps
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              placeholder="Search apps…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 16px 9px 36px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.06)',
                color: '#e2e8f0',
                fontSize: 14,
                outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 14 }}>🔍</span>
          </div>
          <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            {(['all', 'pinned'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                style={{
                  padding: '8px 16px',
                  background: view === v ? 'rgba(102,126,234,0.3)' : 'rgba(255,255,255,0.04)',
                  border: 'none',
                  color: view === v ? '#a5b4fc' : '#64748b',
                  fontSize: 13,
                  fontWeight: view === v ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {v === 'all' ? 'All Apps' : `Pinned (${pinnedCount})`}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* App Grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {visibleItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              {view === 'pinned' ? 'No pinned apps' : 'No apps found'}
            </div>
            <div style={{ fontSize: 14 }}>
              {view === 'pinned' ? 'Pin your favorite apps to access them quickly' : 'Try a different search'}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 16,
          }}>
            {visibleItems.map((item) => {
              const app = allShellApps.find((a) => a.id === item.appId);
              if (!app) return null;

              const isDragging = dragId === item.appId;
              const isDragTarget = dragOver === item.appId;

              return (
                <div
                  key={item.appId}
                  draggable
                  onDragStart={() => handleDragStart(item.appId)}
                  onDragOver={(e) => handleDragOver(e, item.appId)}
                  onDrop={(e) => handleDrop(e, item.appId)}
                  onDragEnd={() => { setDragId(null); setDragOver(null); }}
                  style={{
                    background: isDragTarget
                      ? 'rgba(102,126,234,0.2)'
                      : 'rgba(255,255,255,0.04)',
                    border: isDragTarget
                      ? '2px dashed rgba(102,126,234,0.6)'
                      : item.pinned
                      ? '1px solid rgba(102,126,234,0.4)'
                      : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                    opacity: isDragging ? 0.4 : 1,
                    cursor: 'grab',
                    transition: 'background 0.2s, border-color 0.2s, transform 0.15s',
                    position: 'relative',
                    userSelect: 'none',
                  }}
                >
                  {/* Pin indicator */}
                  {item.pinned && (
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      fontSize: 10,
                      color: '#a5b4fc',
                    }}>
                      📌
                    </div>
                  )}

                  {/* App Icon */}
                  <div
                    onClick={() => openWindow(app.id)}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {app.icon.startsWith('data:') || app.icon.startsWith('http') || app.icon.startsWith('/') ? (
                      <img
                        src={app.icon}
                        alt={app.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: `${app.accent}33`,
                        border: `1px solid ${app.accent}44`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 28,
                        fontWeight: 800,
                        color: app.accent,
                      }}>
                        {app.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* App Name */}
                  <div
                    onClick={() => openWindow(app.id)}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      textAlign: 'center',
                      color: '#e2e8f0',
                      cursor: 'pointer',
                      lineHeight: 1.3,
                    }}
                  >
                    {app.name}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => openWindow(app.id)}
                      title="Open App"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 8,
                        background: 'rgba(102,126,234,0.2)',
                        border: '1px solid rgba(102,126,234,0.3)',
                        color: '#a5b4fc',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); togglePin(item.appId); }}
                      title={item.pinned ? 'Unpin' : 'Pin'}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 8,
                        background: item.pinned ? 'rgba(102,126,234,0.3)' : 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: item.pinned ? '#a5b4fc' : '#64748b',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {item.pinned ? '📌' : '📍'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        fontSize: 12,
        color: '#475569',
        flexShrink: 0,
      }}>
        <span>💡 Drag apps to reorder · Click to open · Pin for quick access</span>
        <span style={{ marginLeft: 'auto' }}>
          {visibleItems.length} of {items.length} apps shown
        </span>
      </div>
    </div>
  );
}
