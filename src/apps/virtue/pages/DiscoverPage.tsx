import { useState } from 'react';
import type { VirtueApp, VirtueCatalog, VirtueDiscoverCard, VirtueInstallState } from '../../../types/virtue';
import { EmptyState } from '../components/EmptyState';
import { InstallButton } from '../components/InstallButton';
import { useVirtueStore } from '../../../hooks/virtue/useVirtueStore';
import { MutedIcon, PauseIcon, PlayGlyph, SoundIcon } from '../components/icons';

type DiscoverPageProps = {
  catalog: VirtueCatalog;
  onOpenDetail: (appId: string) => void;
  onSeeAll: () => void;
  getInstallState: (appId: string) => VirtueInstallState;
  onInstall: (appId: string) => void;
  onOpen: (appId: string) => void;
  onUpdate: (appId: string) => void;
};

export function DiscoverPage({
  catalog,
  onOpenDetail,
  onSeeAll,
  getInstallState,
  onInstall,
  onOpen,
  onUpdate,
}: DiscoverPageProps) {
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);

  const discover = catalog.discover;
  if (!discover) {
    return (
      <EmptyState
        title="Discover is ready"
        message="Your editorial stories, spotlight modules, and featured apps will appear here once your catalog is published."
      />
    );
  }

  const appById = (id?: string): VirtueApp | undefined => (id ? catalog.apps.find((app) => app.id === id) : undefined);
  const hero = discover.hero;
  const heroIcon = appById(hero.iconAppId);
  const bestNew = discover.bestNewAppIds.map(appById).filter(Boolean) as VirtueApp[];

  return (
    <div className="virtue-page-stack">
      {/* Hero */}
      <section
        className="mas-hero"
        role="button"
        tabIndex={0}
        aria-label={hero.title}
        onClick={() => hero.appId && onOpenDetail(hero.appId)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && hero.appId) onOpenDetail(hero.appId);
        }}
      >
        {hero.image ? <div className="mas-hero-art" style={{ backgroundImage: `url(${hero.image})` }} /> : null}
        <div className="mas-hero-scrim" />
        <div className="mas-hero-body">
          <span className="mas-hero-eyebrow">{hero.eyebrow}</span>
          <h2 className="mas-hero-title">{hero.title}</h2>
          <p className="mas-hero-desc">{hero.description}</p>
        </div>
        {heroIcon?.icon ? (
          <div className="mas-hero-icon" aria-hidden="true">
            <img src={heroIcon.icon} alt="" />
          </div>
        ) : null}
        <button
          type="button"
          className="mas-hero-ctl play"
          aria-label={paused ? 'Play preview' : 'Pause preview'}
          onClick={(e) => {
            e.stopPropagation();
            setPaused((p) => !p);
          }}
        >
          {paused ? <PlayGlyph /> : <PauseIcon />}
        </button>
        <button
          type="button"
          className="mas-hero-ctl mute"
          aria-label={muted ? 'Unmute preview' : 'Mute preview'}
          onClick={(e) => {
            e.stopPropagation();
            setMuted((m) => !m);
          }}
        >
          {muted ? <MutedIcon /> : <SoundIcon />}
        </button>
      </section>

      {/* Two secondary cards */}
      {discover.cards.length > 0 ? (
        <section className="mas-card-row">
          {discover.cards.map((card) => (
            <DiscoverCard key={card.id} card={card} appById={appById} onOpen={onOpenDetail} />
          ))}
        </section>
      ) : null}

      {/* Best New Apps and Updates */}
      {bestNew.length > 0 ? (
        <section>
          <header className="virtue-section-head">
            <h3>{discover.bestNewTitle}</h3>
            <button type="button" className="mas-see-all" onClick={onSeeAll}>
              See All
            </button>
          </header>
          <div className="mas-bestnew">
            {bestNew.map((app) => (
              <BestNewRow
                key={app.id}
                app={app}
                installState={getInstallState(app.id)}
                onOpenDetail={() => onOpenDetail(app.id)}
                onInstall={() => onInstall(app.id)}
                onOpen={() => onOpen(app.id)}
                onUpdate={() => onUpdate(app.id)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function DiscoverCard({
  card,
  appById,
  onOpen,
}: {
  card: VirtueDiscoverCard;
  appById: (id?: string) => VirtueApp | undefined;
  onOpen: (appId: string) => void;
}) {
  const clusterIcons = (card.appIds ?? [])
    .map((id) => appById(id)?.icon)
    .filter(Boolean)
    .slice(0, 4) as string[];
  const logoApp = card.kind === 'logo' ? appById(card.appId) : undefined;

  return (
    <article
      className="mas-card"
      role={card.appId ? 'button' : undefined}
      tabIndex={card.appId ? 0 : undefined}
      onClick={() => card.appId && onOpen(card.appId)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && card.appId) onOpen(card.appId);
      }}
    >
      <div className="mas-card-copy">
        <span className="mas-card-eyebrow">{card.eyebrow}</span>
        <h3 className="mas-card-title">{card.title}</h3>
        <p className="mas-card-desc">{card.description}</p>
      </div>
      {card.kind === 'cluster' ? (
        <div className="mas-card-media" aria-hidden="true">
          <div className="mas-cluster">
            {clusterIcons.map((src, i) => (
              <img key={i} src={src} alt="" />
            ))}
          </div>
        </div>
      ) : card.kind === 'logo' ? (
        <div className="mas-card-media logo" aria-hidden="true">
          {logoApp?.icon ? <img src={logoApp.icon} alt="" /> : null}
        </div>
      ) : (
        <div className="mas-card-media image" aria-hidden="true">
          {card.image ? <img src={card.image} alt="" /> : null}
        </div>
      )}
    </article>
  );
}

function BestNewRow({
  app,
  installState,
  onOpenDetail,
  onInstall,
  onOpen,
  onUpdate,
}: {
  app: VirtueApp;
  installState: VirtueInstallState;
  onOpenDetail: () => void;
  onInstall: () => void;
  onOpen: () => void;
  onUpdate: () => void;
}) {
  const progress = useVirtueStore((s) => s.downloadProgress[app.id] ?? 0);
  const hasIap = app.price && !app.isFree;
  return (
    <div className="mas-list-row">
      <button type="button" className="mas-list-main" onClick={onOpenDetail} aria-label={`Open ${app.name} details`}>
        <div className="mas-list-icon" aria-hidden="true">
          {app.icon ? <img src={app.icon} alt="" /> : <span>{app.name.slice(0, 1)}</span>}
        </div>
        <div className="mas-list-copy">
          <h4>{app.name}</h4>
          <p>{app.tagline || app.developer}</p>
        </div>
      </button>
      <div className="mas-list-right">
        <InstallButton state={installState} progress={progress} onInstall={onInstall} onOpen={onOpen} onUpdate={onUpdate} />
        {hasIap ? <span className="mas-list-iap">In-App Purchases</span> : null}
      </div>
    </div>
  );
}
