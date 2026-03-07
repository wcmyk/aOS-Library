import { useMemo, useState } from 'react';
import { LinkedInSite } from './sites/LinkedInSite';

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
  const site = useMemo(() => SITES.find((s) => s.id === activeSiteId) ?? SITES[0], [activeSiteId]);

  return (
    <div className="safari-shell">
      <div className="safari-toolbar">
        <div className="safari-dots"><span /><span /><span /></div>
        <input value={`https://${site.domain}`} readOnly className="safari-address" />
      </div>
      <div className="safari-layout">
        <aside className="safari-sidebar">
          {SITES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={s.id === activeSiteId ? 'active' : ''}
              onClick={() => setActiveSiteId(s.id)}
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
