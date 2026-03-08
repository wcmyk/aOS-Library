import type { VirtueApp, VirtueInstallState } from '../../../types/virtue';
import { useVirtueStore } from '../../../hooks/virtue/useVirtueStore';
import { InstallButton } from './InstallButton';

type AppDetailHeaderProps = {
  app: VirtueApp;
  installState: VirtueInstallState;
  onInstall: () => void;
  onOpen: () => void;
  onUpdate: () => void;
};

export function AppDetailHeader({ app, installState, onInstall, onOpen, onUpdate }: AppDetailHeaderProps) {
  const downloadProgress = useVirtueStore((s) => s.downloadProgress[app.id] ?? 0);
  const isInstalling = installState === 'installing';

  return (
    <header className="virtue-detail-header">
      <div className={`virtue-app-icon large${isInstalling ? ' virtue-app-icon-downloading' : ''}`} aria-hidden="true">
        {app.icon ? <img src={app.icon} alt="" style={{ opacity: isInstalling ? 0.4 : 1, transition: 'opacity 0.3s' }} /> : <span>{app.name.slice(0, 1).toUpperCase()}</span>}
      </div>
      <div>
        <h2>{app.name}</h2>
        <p>{app.developer}</p>
        {app.tagline ? <small>{app.tagline}</small> : null}
      </div>
      <InstallButton state={installState} progress={downloadProgress} onInstall={onInstall} onOpen={onOpen} onUpdate={onUpdate} />
    </header>
  );
}
