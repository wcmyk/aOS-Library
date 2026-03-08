import type { VirtueApp, VirtueLayoutMode, VirtueInstallState } from '../../../types/virtue';
import { AppGrid } from '../components/AppGrid';

type PurchasedPageProps = {
  apps: VirtueApp[];
  layoutMode: VirtueLayoutMode;
  getInstallState: (appId: string) => VirtueInstallState;
  onOpenDetail: (appId: string) => void;
  onInstall: (appId: string) => void;
  onOpen: (appId: string) => void;
  onUpdate: (appId: string) => void;
};

export function PurchasedPage({
  apps,
  layoutMode,
  getInstallState,
  onOpenDetail,
  onInstall,
  onOpen,
  onUpdate,
}: PurchasedPageProps) {
  return (
    <AppGrid
      apps={apps}
      layoutMode={layoutMode}
      getInstallState={getInstallState}
      onOpenDetail={onOpenDetail}
      onInstall={onInstall}
      onOpen={onOpen}
      onUpdate={onUpdate}
      emptyTitle="Your library is empty"
      emptyMessage="Installed or purchased apps will appear here once acquired."
    />
  );
}
