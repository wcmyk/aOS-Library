import type { VirtueApp, VirtueInstallState } from '../../../types/virtue';
import { InstallButton } from '../components/InstallButton';
import { useVirtueStore } from '../../../hooks/virtue/useVirtueStore';

type GamesPageProps = {
  games: VirtueApp[];
  getInstallState: (appId: string) => VirtueInstallState;
  onOpenDetail: (appId: string) => void;
  onInstall: (appId: string) => void;
  onOpen: (appId: string) => void;
  onUpdate: (appId: string) => void;
};

const SECTIONS: { title: string; subtitle: string; count: number }[] = [
  { title: "What We're Playing", subtitle: 'These favorites are always a great choice', count: 3 },
  { title: 'Must-Play Games', subtitle: 'Evolving worlds filled with exciting events', count: 4 },
  { title: 'Based on Your Recent Downloads', subtitle: 'More games we think you will love', count: 99 },
];

function GameRow({
  app,
  installState,
  first,
  onOpenDetail,
  onInstall,
  onOpen,
  onUpdate,
}: {
  app: VirtueApp;
  installState: VirtueInstallState;
  first: boolean;
  onOpenDetail: () => void;
  onInstall: () => void;
  onOpen: () => void;
  onUpdate: () => void;
}) {
  const progress = useVirtueStore((s) => s.downloadProgress[app.id] ?? 0);
  return (
    <div className={`mas-grow ${first ? 'first' : ''}`}>
      <button type="button" className="mas-gmain" onClick={onOpenDetail} aria-label={`Open ${app.name}`}>
        <div className="mas-gicon" aria-hidden="true">
          {app.icon ? <img src={app.icon} alt="" /> : <span>{app.name.slice(0, 1)}</span>}
        </div>
        <div className="mas-gcopy">
          <h4>{app.name}</h4>
          <p>{app.tagline || app.developer}</p>
        </div>
      </button>
      <div className="mas-gright">
        <InstallButton state={installState} progress={progress} onInstall={onInstall} onOpen={onOpen} onUpdate={onUpdate} />
        <span className="mas-giap">In-App Purchases</span>
      </div>
    </div>
  );
}

export function GamesPage({ games, getInstallState, onOpenDetail, onInstall, onOpen, onUpdate }: GamesPageProps) {
  let cursor = 0;
  const sections = SECTIONS.map((sec) => {
    const slice = games.slice(cursor, cursor + sec.count);
    cursor += slice.length;
    return { ...sec, games: slice };
  }).filter((s) => s.games.length > 0);

  return (
    <div className="virtue-page-stack">
      <header className="mas-section-head">
        <h2>Games</h2>
        <p>Blockbuster hits, cozy worlds and quick pick-up-and-play fun.</p>
      </header>
      {sections.map((sec) => (
        <section key={sec.title} className="mas-gsec">
          <header className="mas-ghead">
            <h3>{sec.title} <span className="chev">›</span></h3>
            <p>{sec.subtitle}</p>
          </header>
          <div className="mas-glist">
            {sec.games.map((app, i) => (
              <GameRow
                key={app.id}
                app={app}
                first={i === 0}
                installState={getInstallState(app.id)}
                onOpenDetail={() => onOpenDetail(app.id)}
                onInstall={() => onInstall(app.id)}
                onOpen={() => onOpen(app.id)}
                onUpdate={() => onUpdate(app.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
