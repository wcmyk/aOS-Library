import { useEffect, useMemo, useState } from 'react';
import { LinkedInSite } from './sites/LinkedInSite';
import { WorkdaySite } from './sites/WorkdaySite';
import { ProjectHubSite } from './sites/ProjectHubSite';
import { WorkfrontSite } from './sites/WorkfrontSite';
import { CoLabSite } from './sites/CoLabSite';
import { useSafariStore } from '../../state/useSafariStore';

type SiteId = 'linkedin' | 'workday' | 'adobe-workfront' | 'project-hub' | 'colab' | 'sanctum-web';

type SiteEntry =
  | { id: SiteId; title: string; domain: string; kind: 'component'; component: React.ComponentType }
  | { id: SiteId; title: string; domain: string; kind: 'html'; html: string };

const SITES: SiteEntry[] = [
  { id: 'linkedin',        title: 'LinkedIn',          domain: 'linkedin.com',          kind: 'component', component: LinkedInSite },
  { id: 'workday',         title: 'Workday',           domain: 'workday.company.io',    kind: 'component', component: WorkdaySite },
  { id: 'workfront',       title: 'Adobe Workfront',   domain: 'app.workfront.com',     kind: 'component', component: WorkfrontSite },
  { id: 'radar',           title: 'Radar',             domain: 'radar.apple.com',       kind: 'component', component: RadarSite },
  { id: 'buganizer',       title: 'Buganizer',         domain: 'b.corp.google.com',     kind: 'component', component: BuganizerSite },
  { id: 'project-sail',    title: 'Project SAIL',      domain: 'projectsail.jpmorgan.com', kind: 'component', component: ProjectSailSite },
  { id: 'samsung-portal',  title: 'Samsung PLCM Portal', domain: 'portal.samsung-dev.net', kind: 'component', component: SamsungPortalSite },
  {
    id: 'workday',
    title: 'Workday',
    domain: 'workday.aos',
    kind: 'component',
    component: WorkdaySite,
  },

  {
    id: 'adobe-workfront',
    title: 'Adobe Workfront',
    domain: 'workfront.aos',
    kind: 'component',
    component: ProjectHubSite,
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
    id: 'workday',
    title: 'Workday',
    domain: 'workday.aos',
    kind: 'component',
    component: WorkdaySite,
  },

  {
    id: 'adobe-workfront',
    title: 'Adobe Workfront',
    domain: 'workfront.aos',
    kind: 'component',
    component: ProjectHubSite,
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
    id: 'workday',
    title: 'Workday',
    domain: 'workday.aos',
    kind: 'component',
    component: WorkdaySite,
  },

  {
    id: 'adobe-workfront',
    title: 'Adobe Workfront',
    domain: 'workfront.aos',
    kind: 'component',
    component: WorkfrontSite,
  },
  {
    id: 'project-hub',
    title: 'Project Hub',
    domain: 'projects.aos',
    kind: 'component',
    component: WorkfrontSite,
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

// URL pattern → site ID resolution
const URL_RULES: { pattern: RegExp; siteId: SiteId }[] = [
  { pattern: /linkedin\.com/i,              siteId: 'linkedin' },
  { pattern: /workday\./i,                  siteId: 'workday' },
  { pattern: /handbook\.|it\.|hr\./i,       siteId: 'workday' },   // company internal links → workday dashboard
  { pattern: /workfront\./i,                siteId: 'workfront' },
  { pattern: /radar\.apple\./i,             siteId: 'radar' },
  { pattern: /buganizer\.|b\.corp\.google/i, siteId: 'buganizer' },
  { pattern: /projectsail\.|senatus\./i,    siteId: 'project-sail' },
  { pattern: /samsung.*portal|cognitivv/i,  siteId: 'samsung-portal' },
  { pattern: /drive\.aos/i,                 siteId: 'sanctum-web' },
  // Meeting tool links → open in new tab (handled separately)
  { pattern: /zoom\.us|teams\.microsoft|meet\.google|join\.skype/i, siteId: 'workday' }, // fallback
];

function resolveUrl(url: string): SiteId | null {
  for (const rule of URL_RULES) {
    if (rule.pattern.test(url)) return rule.siteId;
  }
  return null;
}

const BOOKMARKS: { label: string; url: string; siteId: SiteId }[] = [
  { label: 'LinkedIn',        url: 'https://linkedin.com',                siteId: 'linkedin' },
  { label: 'Workday',         url: 'https://workday.company.io',          siteId: 'workday' },
  { label: 'Workfront',       url: 'https://app.workfront.com',           siteId: 'workfront' },
  { label: 'Radar',           url: 'https://radar.apple.com',             siteId: 'radar' },
  { label: 'Buganizer',       url: 'https://b.corp.google.com',           siteId: 'buganizer' },
  { label: 'Project SAIL',    url: 'https://projectsail.jpmorgan.com',    siteId: 'project-sail' },
  { label: 'Samsung Portal',  url: 'https://portal.samsung-dev.net',      siteId: 'samsung-portal' },
];

export function SafariApp() {
  const [activeSiteId, setActiveSiteId] = useState<SiteId>(SITES[0].id);
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
      {/* Toolbar */}
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
