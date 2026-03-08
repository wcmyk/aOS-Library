import type { VirtueApp, VirtueCategory, VirtueLayoutMode } from '../../../types/virtue';
import { AppGrid } from '../components/AppGrid';
import { CategoryPill } from '../components/CategoryPill';

type AppsPageProps = {
  apps: VirtueApp[];
  categories: VirtueCategory[];
  selectedCategory: string | null;
  layoutMode: VirtueLayoutMode;
  setCategory: (category: string | null) => void;
  getInstallState: (appId: string) => 'not_installed' | 'installing' | 'installed' | 'update_available';
  onOpenDetail: (appId: string) => void;
  onInstall: (appId: string) => void;
  onOpen: (appId: string) => void;
  onUpdate: (appId: string) => void;
};

export function AppsPage({
  apps,
  categories,
  selectedCategory,
  setCategory,
  layoutMode,
  getInstallState,
  onOpenDetail,
  onInstall,
  onOpen,
  onUpdate,
}: AppsPageProps) {
  return (
    <div className="virtue-page-stack">
      <div className="virtue-category-row" role="tablist" aria-label="App categories">
        <CategoryPill label="All" active={!selectedCategory} onClick={() => setCategory(null)} />
        {categories.map((category) => (
          <CategoryPill
            key={category.id}
            label={category.name}
            active={selectedCategory === category.id}
            onClick={() => setCategory(category.id)}
          />
        ))}
      </div>
      <AppGrid
        apps={apps}
        layoutMode={layoutMode}
        getInstallState={getInstallState}
        onOpenDetail={onOpenDetail}
        onInstall={onInstall}
        onOpen={onOpen}
        onUpdate={onUpdate}
        emptyTitle="No apps available yet"
        emptyMessage="Your catalog is empty. Add app entries in the Virtue catalog data source to populate this page."
      />
    </div>
  );
}
