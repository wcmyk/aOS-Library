import type { VirtueApp, VirtueCatalog } from '../../../types/virtue';
import { EmptyState } from '../components/EmptyState';
import { HeroCard } from '../components/HeroCard';
import { AppGrid } from '../components/AppGrid';

type DiscoverPageProps = {
  catalog: VirtueCatalog;
  featuredApps: VirtueApp[];
  onOpenDetail: (appId: string) => void;
  getInstallState: (appId: string) => 'not_installed' | 'installing' | 'installed' | 'update_available';
  onInstall: (appId: string) => void;
  onOpen: (appId: string) => void;
  onUpdate: (appId: string) => void;
};

export function DiscoverPage({
  catalog,
  featuredApps,
  onOpenDetail,
  getInstallState,
  onInstall,
  onOpen,
  onUpdate,
}: DiscoverPageProps) {
  const hasEditorial = catalog.editorialCards.length > 0 || catalog.featuredCollections.length > 0 || featuredApps.length > 0;

  if (!hasEditorial) {
    return (
      <EmptyState
        title="Discover is ready"
        message="Your editorial stories, spotlight modules, and featured apps will appear here once your catalog is published."
      />
    );
  }

  return (
    <div className="virtue-page-stack">
      {catalog.editorialCards.length > 0 ? (
        <section className="virtue-hero-row">
          {catalog.editorialCards.map((card) => (
            <HeroCard key={card.id} card={card} onOpenApp={onOpenDetail} />
          ))}
        </section>
      ) : null}

      {featuredApps.length > 0 ? (
        <section>
          <header className="virtue-section-head">
            <h3>Featured Apps</h3>
          </header>
          <AppGrid
            apps={featuredApps}
            layoutMode="grid"
            getInstallState={getInstallState}
            onOpenDetail={onOpenDetail}
            onInstall={onInstall}
            onOpen={onOpen}
            onUpdate={onUpdate}
            emptyTitle="No featured apps yet"
            emptyMessage="Mark apps as featured in your catalog to populate this section."
          />
        </section>
      ) : null}
    </div>
  );
}
