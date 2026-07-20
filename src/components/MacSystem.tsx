import { useEffect, useMemo, useState } from 'react';
import './macsystem.css';

const BASE_URL = import.meta.env.BASE_URL;
const WALLPAPER = `${BASE_URL}assets/wallpaper.jpg`;

type Notif = { id: number; app: string; title: string; body: string; icon: 'system' | 'update' | 'cloud' | 'battery' };

const BOOT_NOTIFS: Omit<Notif, 'id'>[] = [
  { app: 'Software Update', title: 'Your Mac is up to date', body: 'aOS 15.1 — all security updates installed.', icon: 'update' },
  { app: 'iCloud', title: 'Backup complete', body: 'Your documents and settings were backed up just now.', icon: 'cloud' },
  { app: 'Battery', title: 'Battery is charged', body: 'You can unplug your Mac — 73% and holding.', icon: 'battery' },
];

function SysGlyph({ kind }: { kind: Notif['icon'] }) {
  const common = { width: 26, height: 26, viewBox: '0 0 24 24' } as const;
  if (kind === 'update')
    return <svg {...common} fill="none" stroke="#fff" strokeWidth="2"><path d="M4 12a8 8 0 018-8 8 8 0 016.9 4M20 12a8 8 0 01-8 8 8 8 0 01-6.9-4" strokeLinecap="round" /><path d="M18 3v5h-5M6 21v-5h5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (kind === 'cloud')
    return <svg {...common} fill="#fff"><path d="M7 18a4 4 0 01-.5-7.97A5 5 0 0116.9 9.5 3.75 3.75 0 0116.5 18z" /></svg>;
  if (kind === 'battery')
    return <svg {...common} fill="none" stroke="#fff" strokeWidth="1.8"><rect x="2" y="7" width="17" height="10" rx="3" /><rect x="4" y="9" width="10" height="6" rx="1.4" fill="#fff" /><path d="M21 10v4" strokeLinecap="round" /></svg>;
  return <svg {...common} fill="#fff"><path d="M12 2.5l7.8 4.5v9L12 20.5 4.2 16V7z" opacity="0.95" /></svg>;
}

export function MacSystem() {
  const [locked, setLocked] = useState(() => {
    try {
      return sessionStorage.getItem('aos-unlocked') !== '1';
    } catch {
      return true;
    }
  });
  const [pwd, setPwd] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [notifs, setNotifs] = useState<Notif[]>([]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  const unlock = () => {
    try {
      sessionStorage.setItem('aos-unlocked', '1');
    } catch {
      /* ignore */
    }
    setLocked(false);
    // Fire boot notifications after unlocking, staggered like macOS.
    BOOT_NOTIFS.forEach((n, i) => {
      window.setTimeout(() => {
        const id = Date.now() + i;
        setNotifs((prev) => [...prev, { ...n, id }]);
        window.setTimeout(() => setNotifs((prev) => prev.filter((x) => x.id !== id)), 6500 + i * 400);
      }, 700 + i * 1400);
    });
  };

  const submit = () => {
    // Any input (or none) unlocks — Touch ID style. Empty just uses Touch ID.
    unlock();
  };

  const time = useMemo(() => now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), [now]);
  const date = useMemo(() => now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }), [now]);

  useEffect(() => {
    if (!locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') submit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  return (
    <>
      {locked ? (
        <div className="mac-lock" style={{ backgroundImage: `url(${WALLPAPER})` }} onClick={() => setPwd((p) => p)}>
          <div className="mac-lock-scrim" />
          <div className="mac-lock-clock">
            <div className="mac-lock-date">{date}</div>
            <div className="mac-lock-time">{time}</div>
          </div>
          <div className="mac-lock-user">
            <div className="mac-lock-avatar">MP</div>
            <div className="mac-lock-name">Michael Pou</div>
            <form
              className="mac-lock-pwd"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <input
                type="password"
                autoFocus
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="Enter Password"
                aria-label="Password"
              />
              <button type="submit" aria-label="Unlock">›</button>
            </form>
            <button type="button" className="mac-lock-touchid" onClick={submit}>Touch ID or Enter Password</button>
          </div>
          <div className="mac-lock-hint">Press Enter to log in</div>
        </div>
      ) : null}

      <div className="mac-notif-stack">
        {notifs.map((n) => (
          <div key={n.id} className="mac-notif" onClick={() => setNotifs((prev) => prev.filter((x) => x.id !== n.id))}>
            <div className="mac-notif-icon"><SysGlyph kind={n.icon} /></div>
            <div className="mac-notif-body">
              <div className="mac-notif-app">{n.app}</div>
              <div className="mac-notif-title">{n.title}</div>
              <div className="mac-notif-text">{n.body}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
