import { AppGrid } from '../components/AppGrid';
import { EmptyState } from '../components/EmptyState';
import type { VirtueApp, VirtueLayoutMode, VirtueInstallState } from '../../../types/virtue';

type SearchPageProps = {
  query: string;
  filteredApps: VirtueApp[];
  recentSearches: string[];
  layoutMode: VirtueLayoutMode;
  onSelectRecent: (query: string) => void;
  onClearRecents: () => void;
  getInstallState: (appId: string) => VirtueInstallState;
  onOpenDetail: (appId: string) => void;
  onInstall: (appId: string) => void;
  onOpen: (appId: string) => void;
  onUpdate: (appId: string) => void;
};

export function SearchPage({
  query,
  filteredApps,
  recentSearches,
  layoutMode,
  onSelectRecent,
  onClearRecents,
  getInstallState,
  onOpenDetail,
  onInstall,
  onOpen,
  onUpdate,
}: SearchPageProps) {
  if (!query.trim()) {
    return (
      <section className="virtue-page-stack">
        <header className="virtue-section-head">
          <h3>Recent Searches</h3>
          {recentSearches.length > 0 ? (
            <button type="button" className="virtue-subtle-link" onClick={onClearRecents}>
              Clear
            </button>
          ) : null}
        </header>
        {recentSearches.length === 0 ? (
          <EmptyState title="Start searching" message="Search by app name, developer, category, tagline, or description." compact />
        ) : (
          <div className="virtue-recent-searches">
            {recentSearches.map((entry) => (
              <button key={entry} type="button" onClick={() => onSelectRecent(entry)}>
                {entry}
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <AppGrid
      apps={filteredApps}
      layoutMode={layoutMode}
      getInstallState={getInstallState}
      onOpenDetail={onOpenDetail}
      onInstall={onInstall}
      onOpen={onOpen}
      onUpdate={onUpdate}
      emptyTitle="No matching apps"
      emptyMessage="No apps matched this search. Try another keyword or add apps to your catalog."
    />
  );
}
