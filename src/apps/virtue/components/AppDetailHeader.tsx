import type { VirtueApp, VirtueInstallState } from '../../../types/virtue';
import { InstallButton } from './InstallButton';

type AppDetailHeaderProps = {
  app: VirtueApp;
  installState: VirtueInstallState;
  onInstall: () => void;
  onOpen: () => void;
  onUpdate: () => void;
};

export function AppDetailHeader({ app, installState, onInstall, onOpen, onUpdate }: AppDetailHeaderProps) {
  return (
    <header className="virtue-detail-header">
      <div className="virtue-app-icon large" aria-hidden="true">
        {app.icon ? <img src={app.icon} alt="" /> : <span>{app.name.slice(0, 1).toUpperCase()}</span>}
      </div>
      <div>
        <h2>{app.name}</h2>
        <p>{app.developer}</p>
        {app.tagline ? <small>{app.tagline}</small> : null}
      </div>
      <InstallButton state={installState} onInstall={onInstall} onOpen={onOpen} onUpdate={onUpdate} />
    </header>
  );
}
