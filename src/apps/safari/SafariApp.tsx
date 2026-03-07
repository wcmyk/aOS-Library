import { useEffect, useMemo, useState } from 'react';
import { LinkedInSite } from './sites/LinkedInSite';
import { WorkdaySite } from './sites/WorkdaySite';
import { ProjectHubSite } from './sites/ProjectHubSite';
import { CoLabSite } from './sites/CoLabSite';
import { useSafariStore } from '../../state/useSafariStore';

type SiteEntry =
  | { id: string; title: string; domain: string; kind: 'component'; component: React.ComponentType }
  | { id: string; title: string; domain: string; kind: 'html'; html: string };

const SITES: SiteEntry[] = [
  {
    id: 'linkedin',
    title: 'LinkedIn',
    domain: 'linkedin.com',
    kind: 'component',
    component: LinkedInSite,
  },
  {
    id: 'workday',
    title: 'Workday',
    domain: 'workday.aos',
    kind: 'component',
    component: WorkdaySite,
  },
  {
    id: 'project-hub',
    title: 'Project Hub',
    domain: 'projects.aos',
    kind: 'component',
    component: ProjectHubSite,
  },
  {
    id: 'colab',
    title: 'CoLab',
    domain: 'colab.aos',
    kind: 'component',
    component: CoLabSite,
  },
  {
    id: 'sanctum-web',
    title: 'Sanctum Web',
    domain: 'drive.aos',
    kind: 'html',
    html: `<main style="font-family:Inter,sans-serif;padding:24px;background:#ecf2ff;color:#0f172a;min-height:100vh">
      <h1 style="margin:0 0 8px">Sanctum Web</h1>
      <p style="color:#475569">Review synced documents, permissions, and storage lanes.</p>
    </main>`,
  },
];

export function SafariApp() {
  const [activeSiteId, setActiveSiteId] = useState(SITES[0].id);
  const currentUrl = useSafariStore((s) => s.currentUrl);
  const navigate = useSafariStore((s) => s.navigate);
  const site = useMemo(() => SITES.find((s) => s.id === activeSiteId) ?? SITES[0], [activeSiteId]);

  useEffect(() => {
    const target = currentUrl.replace(/^https?:\/\//, '').toLowerCase();
    const matched = SITES.find((s) => target.includes(s.domain));
    if (matched && matched.id !== activeSiteId) setActiveSiteId(matched.id);
  }, [activeSiteId, currentUrl]);

  return (
    <div className="safari-shell">
      <div className="safari-toolbar">
        <div className="safari-dots"><span /><span /><span /></div>
        <input value={currentUrl} onChange={(e) => navigate(e.target.value)} className="safari-address" />
      </div>
      <div className="safari-layout">
        <aside className="safari-sidebar">
          {SITES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={s.id === activeSiteId ? 'active' : ''}
              onClick={() => { setActiveSiteId(s.id); navigate(`https://${s.domain}`); }}
            >
              <strong>{s.title}</strong>
              <span>{s.domain}</span>
            </button>
          ))}
        </aside>
        <section className="safari-view safari-view-react">
          {site.kind === 'component'
            ? <site.component />
            : <iframe title={site.title} srcDoc={site.html} sandbox="allow-same-origin" />
          }
        </section>
      </div>
    </div>
  );
}
