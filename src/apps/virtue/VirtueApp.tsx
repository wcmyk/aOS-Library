import { useMemo } from 'react';
import { getVirtueCatalog } from '../../data/virtue/provider';
import { inferInstallState, useVirtueStore } from '../../hooks/virtue/useVirtueStore';
import { filterApps, sortApps } from './utils/catalog';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { DiscoverPage } from './pages/DiscoverPage';
import { AppsPage } from './pages/AppsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { UpdatesList } from './components/UpdatesList';
import { PurchasedPage } from './pages/PurchasedPage';
import { SearchPage } from './pages/SearchPage';
import { AppDetailPage } from './pages/AppDetailPage';

export function VirtueApp() {
  const catalog = getVirtueCatalog();
  const {
    activeView,
    selectedAppId,
    searchQuery,
    selectedCategory,
    layoutMode,
    sortMode,
    recentSearches,
    installStates,
    setView,
    setSelectedApp,
    setSearchQuery,
    addRecentSearch,
    clearRecentSearches,
    setCategory,
    setLayoutMode,
    setSortMode,
    installApp,
    openApp,
    updateApp,
    updateAll,
  } = useVirtueStore();

  const filteredApps = useMemo(
    () => sortApps(filterApps(catalog.apps, searchQuery, selectedCategory), sortMode),
    [catalog.apps, searchQuery, selectedCategory, sortMode],
  );

  const selectedApp = catalog.apps.find((app) => app.id === selectedAppId) ?? null;
  const featuredApps = catalog.apps.filter((app) => app.featured);
  const updateApps = catalog.apps.filter((app) => inferInstallState(app.id, installStates) === 'update_available');
  const purchasedApps = catalog.apps.filter(
    (app) => app.owned || ['installed', 'update_available'].includes(inferInstallState(app.id, installStates)),
  );

  const openDetail = (appId: string) => {
    setSelectedApp(appId);
    setView('detail');
  };

  const renderView = () => {
    if (activeView === 'discover') {
      return (
        <DiscoverPage
          catalog={catalog}
          featuredApps={featuredApps}
          onOpenDetail={openDetail}
          getInstallState={(appId) => inferInstallState(appId, installStates)}
          onInstall={installApp}
          onOpen={openApp}
          onUpdate={updateApp}
        />
      );
    }

    if (activeView === 'apps') {
      return (
        <AppsPage
          apps={filteredApps}
          categories={catalog.categories}
          selectedCategory={selectedCategory}
          setCategory={setCategory}
          layoutMode={layoutMode}
          getInstallState={(appId) => inferInstallState(appId, installStates)}
          onOpenDetail={openDetail}
          onInstall={installApp}
          onOpen={openApp}
          onUpdate={updateApp}
        />
      );
    }

    if (activeView === 'categories') {
      return (
        <CategoriesPage
          categories={catalog.categories}
          apps={catalog.apps}
          onOpenCategory={(categoryId) => {
            setCategory(categoryId);
            setView('apps');
          }}
        />
      );
    }

    if (activeView === 'updates') {
      return <UpdatesList apps={updateApps} onUpdate={updateApp} onUpdateAll={updateAll} />;
    }

    if (activeView === 'purchased') {
      return (
        <PurchasedPage
          apps={purchasedApps}
          layoutMode={layoutMode}
          getInstallState={(appId) => inferInstallState(appId, installStates)}
          onOpenDetail={openDetail}
          onInstall={installApp}
          onOpen={openApp}
          onUpdate={updateApp}
        />
      );
    }

    if (activeView === 'search') {
      return (
        <SearchPage
          query={searchQuery}
          filteredApps={sortApps(filterApps(catalog.apps, searchQuery, null), sortMode)}
          recentSearches={recentSearches}
          layoutMode={layoutMode}
          onSelectRecent={(query) => {
            setSearchQuery(query);
            addRecentSearch(query);
          }}
          onClearRecents={clearRecentSearches}
          getInstallState={(appId) => inferInstallState(appId, installStates)}
          onOpenDetail={openDetail}
          onInstall={installApp}
          onOpen={openApp}
          onUpdate={updateApp}
        />
      );
    }

    return (
      <AppDetailPage
        app={selectedApp}
        installState={selectedApp ? inferInstallState(selectedApp.id, installStates) : 'not_installed'}
        onInstall={() => selectedApp && installApp(selectedApp.id)}
        onOpen={() => selectedApp && openApp(selectedApp.id)}
        onUpdate={() => selectedApp && updateApp(selectedApp.id)}
      />
    );
  };

  return (
    <div className="virtue-shell" role="application" aria-label="Virtue App Store">
      <Sidebar
        activeView={activeView}
        onChangeView={(view) => {
          setView(view);
          setSelectedApp(null);
        }}
      />

      <section className="virtue-main">
        <header className="virtue-toolbar">
          <SearchBar
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onSubmit={() => {
              setView('search');
              addRecentSearch(searchQuery);
            }}
          />
          <div className="virtue-toolbar-controls">
            <button
              type="button"
              className="virtue-plain-button"
              onClick={() => setLayoutMode(layoutMode === 'grid' ? 'list' : 'grid')}
              aria-label={`Switch to ${layoutMode === 'grid' ? 'list' : 'grid'} view`}
            >
              {layoutMode === 'grid' ? 'List' : 'Grid'}
            </button>
            <select
              aria-label="Sort apps"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as typeof sortMode)}
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="rating-desc">Highest Rated</option>
              <option value="updated-desc">Recently Updated</option>
            </select>
          </div>
        </header>

        <main className="virtue-content">{renderView()}</main>
      </section>
    </div>
  );
}
