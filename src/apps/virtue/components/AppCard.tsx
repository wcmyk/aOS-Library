import type { VirtueApp, VirtueInstallState } from '../../../types/virtue';
import { InstallButton } from './InstallButton';

type Props = {
  app: VirtueApp;
  installState: VirtueInstallState;
  onOpenDetail: () => void;
  onInstall: () => void;
  onOpen: () => void;
  onUpdate: () => void;
  mode?: 'grid' | 'list';
};

export function AppCard({ app, installState, onOpenDetail, onInstall, onOpen, onUpdate, mode = 'grid' }: Props) {
  return (
    <article className={`virtue-app-card ${mode}`}>
      <button type="button" className="virtue-app-main" onClick={onOpenDetail}>
        <div className="virtue-app-icon" aria-hidden="true">
          {app.icon ? <img src={app.icon} alt="" /> : <span>{app.name.slice(0, 1).toUpperCase()}</span>}
        </div>
        <div className="virtue-app-copy">
          <h4>{app.name}</h4>
          <p>{app.tagline || app.developer}</p>
          {mode === 'list' && <small>{app.description || 'No description available yet.'}</small>}
        </div>
      </button>
      <InstallButton state={installState} onInstall={onInstall} onOpen={onOpen} onUpdate={onUpdate} />
    </article>
  );
}
