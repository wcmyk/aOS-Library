import type { VirtueApp, VirtueInstallState } from '../../../types/virtue';
import { AppDetailHeader } from '../components/AppDetailHeader';
import { EmptyState } from '../components/EmptyState';
import { ScreenshotGallery } from '../components/ScreenshotGallery';

type AppDetailPageProps = {
  app: VirtueApp | null;
  installState: VirtueInstallState;
  onInstall: () => void;
  onOpen: () => void;
  onUpdate: () => void;
};

export function AppDetailPage({ app, installState, onInstall, onOpen, onUpdate }: AppDetailPageProps) {
  if (!app) {
    return <EmptyState title="Select an app" message="Choose an app from browse or search to view product details." />;
  }

  return (
    <article className="virtue-detail-page">
      <AppDetailHeader app={app} installState={installState} onInstall={onInstall} onOpen={onOpen} onUpdate={onUpdate} />
      <ScreenshotGallery screenshots={app.screenshots} appName={app.name} />
      <section>
        <h4>About</h4>
        <p>{app.longDescription || app.description || 'No description available yet.'}</p>
      </section>
      <section>
        <h4>What’s New</h4>
        <p>{app.releaseNotes || 'No release notes available yet.'}</p>
      </section>
      <section className="virtue-detail-meta">
        <div><strong>Version</strong><span>{app.version || '—'}</span></div>
        <div><strong>Size</strong><span>{app.size || '—'}</span></div>
        <div><strong>Rating</strong><span>{app.rating ? `${app.rating.toFixed(1)} / 5` : '—'}</span></div>
        <div><strong>Reviews</strong><span>{typeof app.reviewsCount === 'number' ? app.reviewsCount.toLocaleString() : '—'}</span></div>
        <div><strong>Age</strong><span>{app.ageRating || '—'}</span></div>
        <div><strong>Updated</strong><span>{app.lastUpdated || '—'}</span></div>
      </section>
      <section className="virtue-detail-links">
        <div>
          <h4>Compatibility</h4>
          <p>{app.compatibility?.join(', ') || 'Not specified yet.'}</p>
        </div>
        <div>
          <h4>Permissions</h4>
          <p>{app.permissions?.join(', ') || 'Not specified yet.'}</p>
        </div>
        <div>
          <h4>Support</h4>
          <p>
            {app.website ? <a href={app.website} target="_blank" rel="noreferrer">Website</a> : 'No website'}
            {' · '}
            {app.supportUrl ? <a href={app.supportUrl} target="_blank" rel="noreferrer">Support</a> : 'No support URL'}
          </p>
        </div>
      </section>
    </article>
  );
}
