import { useMemo, useState } from 'react';

type Site = { id: string; title: string; domain: string; html: string };

const sites: Site[] = [
  {
    id: 'linkedos',
    title: 'LinkedOS',
    domain: 'jobs.aos',
    html: `<main style="font-family:Inter,sans-serif;padding:24px;background:#f6f8fc;color:#0f172a;min-height:100vh"><h1 style="margin:0">LinkedOS Job Simulator</h1><p>Create interview simulations and recruiter workflows.</p><section style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px"><article style="background:white;border-radius:12px;padding:12px"><h3>Frontend Engineer Simulation</h3><p>Behavioral + technical rounds</p></article><article style="background:white;border-radius:12px;padding:12px"><h3>Product Manager Simulation</h3><p>Roadmap and prioritization loops</p></article></section></main>`,
  },
  {
    id: 'sanctum-web',
    title: 'Sanctum Web',
    domain: 'drive.aos',
    html: `<main style="font-family:Inter,sans-serif;padding:24px;background:#ecf2ff;color:#0f172a;min-height:100vh"><h1>Sanctum Web Dashboard</h1><p>Review synced documents, permissions, and storage lanes.</p></main>`,
  },
];

export function SafariApp() {
  const [activeSiteId, setActiveSiteId] = useState(sites[0].id);
  const site = useMemo(() => sites.find((entry) => entry.id === activeSiteId) ?? sites[0], [activeSiteId]);

  return (
    <div className="safari-shell">
      <div className="safari-toolbar">
        <div className="safari-dots"><span /><span /><span /></div>
        <input value={`https://${site.domain}`} readOnly className="safari-address" />
      </div>
      <div className="safari-layout">
        <aside className="safari-sidebar">
          {sites.map((entry) => (
            <button key={entry.id} type="button" className={entry.id === activeSiteId ? 'active' : ''} onClick={() => setActiveSiteId(entry.id)}>
              <strong>{entry.title}</strong>
              <span>{entry.domain}</span>
            </button>
          ))}
        </aside>
        <section className="safari-view">
          <iframe title={site.title} srcDoc={site.html} sandbox="allow-same-origin" />
        </section>
      </div>
    </div>
  );
}
