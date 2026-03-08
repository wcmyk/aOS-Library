import type { VirtueApp } from '../../../types/virtue';
import { EmptyState } from './EmptyState';

type UpdatesListProps = {
  apps: VirtueApp[];
  onUpdate: (appId: string) => void;
  onUpdateAll: () => void;
};

export function UpdatesList({ apps, onUpdate, onUpdateAll }: UpdatesListProps) {
  if (apps.length === 0) {
    return <EmptyState title="Everything is up to date" message="When updates are available for installed apps, they will appear here." />;
  }

  return (
    <section className="virtue-updates-list">
      <div className="virtue-updates-list-header">
        <h3>Available Updates</h3>
        <button type="button" className="virtue-plain-button" onClick={onUpdateAll}>
          Update All
        </button>
      </div>
      {apps.map((app) => (
        <article key={app.id} className="virtue-update-row">
          <div className="virtue-app-icon" aria-hidden="true">
            {app.icon ? <img src={app.icon} alt="" /> : <span>{app.name.slice(0, 1).toUpperCase()}</span>}
          </div>
          <div className="virtue-update-copy">
            <h4>{app.name}</h4>
            <p>{app.releaseNotes || 'Bug fixes and quality improvements.'}</p>
          </div>
          <button type="button" className="virtue-install-button" onClick={() => onUpdate(app.id)}>
            Update
          </button>
        </article>
      ))}
    </section>
  );
}
