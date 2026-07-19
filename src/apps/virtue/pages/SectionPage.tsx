import type { VirtueApp, VirtueInstallState, VirtueSection } from '../../../types/virtue';
import { AppGrid } from '../components/AppGrid';

type SectionConfig = { title: string; blurb: string; categoryIds: string[] };

type SectionPageProps = {
  section: VirtueSection;
  config?: SectionConfig;
  apps: VirtueApp[];
  getInstallState: (appId: string) => VirtueInstallState;
  onOpenDetail: (appId: string) => void;
  onInstall: (appId: string) => void;
  onOpen: (appId: string) => void;
  onUpdate: (appId: string) => void;
};

export function SectionPage({
  section,
  config,
  apps,
  getInstallState,
  onOpenDetail,
  onInstall,
  onOpen,
  onUpdate,
}: SectionPageProps) {
  const title = config?.title ?? section;
  const blurb = config?.blurb ?? '';
  const categoryIds = config?.categoryIds ?? [];
  const matched = categoryIds.length ? apps.filter((app) => categoryIds.includes(app.category)) : apps;
  const list = matched.length ? matched : apps;

  return (
    <div className="virtue-page-stack">
      <header className="mas-section-head">
        <h2>{title}</h2>
        {blurb ? <p>{blurb}</p> : null}
      </header>
      <AppGrid
        apps={list}
        layoutMode="grid"
        getInstallState={getInstallState}
        onOpenDetail={onOpenDetail}
        onInstall={onInstall}
        onOpen={onOpen}
        onUpdate={onUpdate}
        emptyTitle="Nothing here yet"
        emptyMessage="Apps in this section will appear here once your catalog is populated."
      />
    </div>
  );
}
