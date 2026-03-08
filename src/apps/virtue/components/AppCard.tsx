import type { VirtueApp, VirtueInstallState, VirtueLayoutMode } from '../../../types/virtue';
import { InstallButton } from './InstallButton';

type AppCardProps = {
  app: VirtueApp;
  mode: VirtueLayoutMode;
  installState: VirtueInstallState;
  onOpenDetail: () => void;
  onInstall: () => void;
  onOpen: () => void;
  onUpdate: () => void;
};

export function AppCard({ app, mode, installState, onOpenDetail, onInstall, onOpen, onUpdate }: AppCardProps) {
  return (
    <article className={`virtue-app-card ${mode}`}>
      <button type="button" className="virtue-app-main" onClick={onOpenDetail} aria-label={`Open ${app.name} details`}>
        <div className="virtue-app-icon" aria-hidden="true">
          {app.icon ? <img src={app.icon} alt="" /> : <span>{app.name.slice(0, 1).toUpperCase()}</span>}
        </div>
        <div className="virtue-app-content">
          <h4>{app.name}</h4>
          <p>{app.developer}</p>
          <small>{app.tagline || app.description || 'No description available yet.'}</small>
        </div>
      </button>
      <InstallButton state={installState} onInstall={onInstall} onOpen={onOpen} onUpdate={onUpdate} />
    </article>
  );
}
