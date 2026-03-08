import { useMemo } from 'react';
import { virtueCatalog } from '../../data/virtue/catalog';
import { useVirtueStore } from '../../hooks/virtue/useVirtueStore';
import type { VirtueApp, VirtueInstallState, VirtueView } from '../../types/virtue';
import { AppCard } from './components/AppCard';
import { EmptyState } from './components/EmptyState';

const NAV: { id: Exclude<VirtueView, 'detail'>; label: string }[] = [
  { id: 'discover', label: 'Discover' },
  { id: 'apps', label: 'Apps' },
  { id: 'categories', label: 'Categories' },
  { id: 'updates', label: 'Updates' },
  { id: 'purchased', label: 'Purchased' },
  { id: 'search', label: 'Search' },
];

const iconForState = (state: VirtueInstallState) => (state === 'installed' ? '✓' : state === 'update_available' ? '↻' : '↓');

function inferInstallState(app: VirtueApp, states: Record<string, VirtueInstallState>): VirtueInstallState {
  if (states[app.id]) return states[app.id];
  if (app.updateAvailable) return 'update_available';
  if (app.installed) return 'installed';
  return 'not_installed';
}

export function VirtueApp() {
  const {
    activeView,
    selectedAppId,
    searchQuery,
    selectedCategory,
    layoutMode,
    sortMode,
    installStates,
    recentSearches,
    setView,
    setSelectedApp,
    setSearchQuery,
    setCategory,
    setLayoutMode,
    setSortMode,
    installApp,
    openApp,
    updateApp,
    updateAll,
  } = useVirtueStore();

  const apps = virtueCatalog.apps;
  const categories = virtueCatalog.categories;

  const filteredApps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const base = apps.filter((app) => {
      const matchesCategory = selectedCategory ? app.category === selectedCategory : true;
      if (!matchesCategory) return false;
      if (!query) return true;
      const haystack = [app.name, app.developer, app.category, app.tagline, app.description].join(' ').toLowerCase();
      return haystack.includes(query);
    });

    return [...base].sort((a, b) => {
      if (sortMode === 'name-desc') return b.name.localeCompare(a.name);
      if (sortMode === 'rating-desc') return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortMode === 'updated-desc') return (b.lastUpdated ?? '').localeCompare(a.lastUpdated ?? '');
      return a.name.localeCompare(b.name);
    });
  }, [apps, searchQuery, selectedCategory, sortMode]);

  const selectedApp = apps.find((app) => app.id === selectedAppId) ?? null;

  const renderGrid = (list: VirtueApp[]) => {
    if (list.length === 0) {
      return <EmptyState title="Your catalog is empty" message="No apps are available yet. Add your own catalog data to begin curating Virtue." />;
    }

    return (
      <div className={`virtue-app-grid ${layoutMode}`}>
        {list.map((app) => {
          const state = inferInstallState(app, installStates);
          return (
            <AppCard
              key={app.id}
              app={app}
              installState={state}
              mode={layoutMode}
              onOpenDetail={() => setSelectedApp(app.id)}
              onInstall={() => installApp(app.id)}
              onOpen={() => openApp(app.id)}
              onUpdate={() => updateApp(app.id)}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="virtue-shell" role="application" aria-label="Virtue App Store">
      <aside className="virtue-sidebar">
        <div className="virtue-brand">
          <div className="virtue-brand-logo">A</div>
          <div>
            <strong>Virtue</strong>
            <small>App Store</small>
          </div>
        </div>
        <nav aria-label="Virtue sections">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeView === item.id ? 'active' : ''}
              onClick={() => {
                setView(item.id);
                setSelectedApp(null);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="virtue-main">
        <header className="virtue-toolbar">
          <input
            aria-label="Search apps"
            placeholder="Search apps, categories, and developers"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="virtue-toolbar-actions">
            <button type="button" onClick={() => setLayoutMode(layoutMode === 'grid' ? 'list' : 'grid')}>{layoutMode === 'grid' ? 'List' : 'Grid'}</button>
            <select aria-label="Sort apps" value={sortMode} onChange={(e) => setSortMode(e.target.value as typeof sortMode)}>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="rating-desc">Highest Rated</option>
              <option value="updated-desc">Recently Updated</option>
            </select>
          </div>
        </header>

        <div className="virtue-content">
          {activeView === 'discover' && (
            <>
              {virtueCatalog.editorialCards.length > 0 && (
                <section className="virtue-hero-row">
                  {virtueCatalog.editorialCards.map((card) => (
                    <article key={card.id} className="virtue-hero-card">
                      <small>{card.subtitle || 'FEATURED'}</small>
                      <h3>{card.title}</h3>
                      <p>{card.description || ''}</p>
                    </article>
                  ))}
                </section>
              )}
              {virtueCatalog.editorialCards.length === 0 && (
                <EmptyState title="Discover is ready" message="Featured stories and collections will appear here once you publish editorial modules and app entries." />
              )}
            </>
          )}

          {activeView === 'apps' && (
            <>
              <div className="virtue-chip-row">
                <button type="button" className={!selectedCategory ? 'active' : ''} onClick={() => setCategory(null)}>All</button>
                {categories.map((c) => (
                  <button key={c.id} type="button" className={selectedCategory === c.id ? 'active' : ''} onClick={() => setCategory(c.id)}>
                    {c.name}
                  </button>
                ))}
              </div>
              {renderGrid(filteredApps)}
            </>
          )}

          {activeView === 'categories' && (
            <div className="virtue-category-grid">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="virtue-category-card"
                  onClick={() => {
                    setCategory(c.id);
                    setView('apps');
                  }}
                >
                  <h4>{c.name}</h4>
                  <p>{c.blurb || 'Browse this category.'}</p>
                  <span>{apps.filter((a) => a.category === c.id).length} apps</span>
                </button>
              ))}
            </div>
          )}

          {activeView === 'updates' && (
            <>
              <div className="virtue-updates-head">
                <h3>Available Updates</h3>
                <button type="button" onClick={updateAll}>Update All</button>
              </div>
              {renderGrid(
                apps.filter((app) => inferInstallState(app, installStates) === 'update_available')
              )}
            </>
          )}

          {activeView === 'purchased' && (
            renderGrid(apps.filter((app) => ['installed', 'update_available'].includes(inferInstallState(app, installStates)) || app.owned))
          )}

          {activeView === 'search' && (
            <>
              {searchQuery.trim() ? renderGrid(filteredApps) : (
                <div className="virtue-recent-searches">
                  <h4>Recent Searches</h4>
                  {recentSearches.length === 0
                    ? <EmptyState title="Start searching" message="Search across app name, developer, category, tagline, and description." />
                    : recentSearches.map((q) => <button key={q} type="button" onClick={() => setSearchQuery(q)}>{q}</button>)}
                </div>
              )}
            </>
          )}

          {(activeView === 'detail' || selectedApp) && selectedApp && (
            <article className="virtue-detail">
              <header>
                <div className="virtue-app-icon large">{selectedApp.icon ? <img src={selectedApp.icon} alt="" /> : <span>{selectedApp.name[0]}</span>}</div>
                <div>
                  <h2>{selectedApp.name}</h2>
                  <p>{selectedApp.developer}</p>
                  <small>{selectedApp.tagline}</small>
                </div>
                <div className="virtue-detail-cta">
                  <button
                    type="button"
                    className="virtue-install-btn"
                    onClick={() => {
                      const state = inferInstallState(selectedApp, installStates);
                      if (state === 'not_installed') installApp(selectedApp.id);
                      if (state === 'update_available') updateApp(selectedApp.id);
                      if (state === 'installed') openApp(selectedApp.id);
                    }}
                  >
                    {iconForState(inferInstallState(selectedApp, installStates))} {inferInstallState(selectedApp, installStates) === 'installed' ? 'Open' : inferInstallState(selectedApp, installStates) === 'update_available' ? 'Update' : 'Install'}
                  </button>
                </div>
              </header>

              {selectedApp.screenshots.length > 0 && (
                <div className="virtue-screenshots">
                  {selectedApp.screenshots.map((shot, idx) => <img key={shot + idx} src={shot} alt={`${selectedApp.name} screenshot ${idx + 1}`} />)}
                </div>
              )}

              <section>
                <h4>About</h4>
                <p>{selectedApp.longDescription || selectedApp.description || 'No description available yet.'}</p>
              </section>
              <section>
                <h4>What’s New</h4>
                <p>{selectedApp.releaseNotes || 'No release notes available yet.'}</p>
              </section>
              <section className="virtue-meta-grid">
                <div><strong>Version</strong><span>{selectedApp.version || '—'}</span></div>
                <div><strong>Size</strong><span>{selectedApp.size || '—'}</span></div>
                <div><strong>Age Rating</strong><span>{selectedApp.ageRating || '—'}</span></div>
                <div><strong>Last Updated</strong><span>{selectedApp.lastUpdated || '—'}</span></div>
              </section>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
