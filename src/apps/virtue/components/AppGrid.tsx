import { AppCard } from './AppCard';
import { EmptyState } from './EmptyState';
import type { VirtueApp, VirtueInstallState, VirtueLayoutMode } from '../../../types/virtue';

type AppGridProps = {
  apps: VirtueApp[];
  layoutMode: VirtueLayoutMode;
  getInstallState: (appId: string) => VirtueInstallState;
  onOpenDetail: (appId: string) => void;
  onInstall: (appId: string) => void;
  onOpen: (appId: string) => void;
  onUpdate: (appId: string) => void;
  emptyTitle: string;
  emptyMessage: string;
};

export function AppGrid({
  apps,
  layoutMode,
  getInstallState,
  onOpenDetail,
  onInstall,
  onOpen,
  onUpdate,
  emptyTitle,
  emptyMessage,
}: AppGridProps) {
  if (apps.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className={`virtue-app-grid ${layoutMode}`}>
      {apps.map((app) => (
        <AppCard
          key={app.id}
          app={app}
          mode={layoutMode}
          installState={getInstallState(app.id)}
          onOpenDetail={() => onOpenDetail(app.id)}
          onInstall={() => onInstall(app.id)}
          onOpen={() => onOpen(app.id)}
          onUpdate={() => onUpdate(app.id)}
        />
      ))}
    </div>
  );
}
