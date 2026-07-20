import { useMemo } from 'react';
import { getVirtueCatalog } from '../../data/virtue/provider';
import './appstore.css';
import { inferInstallState, useVirtueStore } from '../../hooks/virtue/useVirtueStore';
import { filterApps, sortApps } from './utils/catalog';
import { Sidebar } from './components/Sidebar';
import { DiscoverPage } from './pages/DiscoverPage';
import { SectionPage } from './pages/SectionPage';
import { GamesPage } from './pages/GamesPage';
import { AppsPage } from './pages/AppsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { UpdatesList } from './components/UpdatesList';
import { PurchasedPage } from './pages/PurchasedPage';
import { SearchPage } from './pages/SearchPage';
import { AppDetailPage } from './pages/AppDetailPage';
import type { VirtueSection } from '../../types/virtue';

const SECTION_VIEWS: VirtueSection[] = ['arcade', 'create', 'work', 'play', 'develop'];
const USER_NAME = 'Michael Pou';
const USER_INITIALS = 'MP';

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
  const updateApps = catalog.apps.filter((app) => inferInstallState(app.id, installStates) === 'update_available');
  const purchasedApps = catalog.apps.filter(
    (app) => app.owned || ['installed', 'update_available'].includes(inferInstallState(app.id, installStates)),
  );
  const getInstallState = (appId: string) => inferInstallState(appId, installStates);

  const openDetail = (appId: string) => {
    setSelectedApp(appId);
    setView('detail');
  };

  const renderView = () => {
    if (activeView === 'discover') {
      return (
        <DiscoverPage
          catalog={catalog}
          onOpenDetail={openDetail}
          onSeeAll={() => setView('apps')}
          getInstallState={getInstallState}
          onInstall={installApp}
          onOpen={openApp}
          onUpdate={updateApp}
        />
      );
    }

    if (activeView === 'arcade' || activeView === 'play') {
      const games = catalog.apps.filter((app) => app.category === 'games');
      if (games.length > 0) {
        return (
          <GamesPage
            games={games}
            getInstallState={getInstallState}
            onOpenDetail={openDetail}
            onInstall={installApp}
            onOpen={openApp}
            onUpdate={updateApp}
          />
        );
      }
    }

    if (SECTION_VIEWS.includes(activeView as VirtueSection)) {
      const section = activeView as VirtueSection;
      return (
        <SectionPage
          section={section}
          config={catalog.sections?.[section]}
          apps={catalog.apps}
          getInstallState={getInstallState}
          onOpenDetail={openDetail}
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
          getInstallState={getInstallState}
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
          getInstallState={getInstallState}
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
          getInstallState={getInstallState}
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
        installState={selectedApp ? getInstallState(selectedApp.id) : 'not_installed'}
        onInstall={() => selectedApp && installApp(selectedApp.id)}
        onOpen={() => selectedApp && openApp(selectedApp.id)}
        onUpdate={() => selectedApp && updateApp(selectedApp.id)}
      />
    );
  };

  return (
    <div className="virtue-shell" role="application" aria-label="App Store">
      <Sidebar
        activeView={activeView}
        onChangeView={(view) => {
          setView(view);
          if (view !== 'search') setSearchQuery('');
          setSelectedApp(null);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => {
          setView('search');
          addRecentSearch(searchQuery);
        }}
        updateCount={updateApps.length}
        userName={USER_NAME}
        userInitials={USER_INITIALS}
      />

      <section className="virtue-main">
        <main className="virtue-content">{renderView()}</main>
      </section>
    </div>
  );
}
