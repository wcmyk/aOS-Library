import { useEffect, useRef, useState } from 'react';
import { LinkedInSite } from './sites/LinkedInSite';
import { WorkdaySite } from './sites/WorkdaySite';
import { WorkfrontSite } from './sites/WorkfrontSite';
import { RadarSite } from './sites/RadarSite';
import { BuganizerSite } from './sites/BuganizerSite';
import { ProjectSailSite } from './sites/ProjectSailSite';
import { SamsungPortalSite } from './sites/SamsungPortalSite';
import { useSafariStore } from '../../state/useSafariStore';

type SiteId = 'linkedin' | 'workday' | 'workfront' | 'radar' | 'buganizer' | 'project-sail' | 'samsung-portal' | 'sanctum-web';

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
  const { pendingUrl, clearPending } = useSafariStore();
  const [activeSiteId, setActiveSiteId] = useState<SiteId>('linkedin');
  const [addressInput, setAddressInput] = useState('https://linkedin.com');
  const inputRef = useRef<HTMLInputElement>(null);

  // Consume pending URL from other apps (e.g. Outlook)
  useEffect(() => {
    if (pendingUrl) {
      const resolved = resolveUrl(pendingUrl);
      if (resolved) {
        setActiveSiteId(resolved);
        setAddressInput(pendingUrl);
      }
      clearPending();
    }
  }, [pendingUrl, clearPending]);

  const site = SITES.find((s) => s.id === activeSiteId) ?? SITES[0];

  const navigateTo = (siteId: SiteId) => {
    setActiveSiteId(siteId);
    const found = SITES.find(s => s.id === siteId);
    if (found) setAddressInput(`https://${found.domain}`);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = addressInput.trim();
    const resolved = resolveUrl(url);
    if (resolved) {
      setActiveSiteId(resolved);
    }
    inputRef.current?.blur();
  };

  return (
    <div className="safari-shell">
      {/* Toolbar */}
      <div className="safari-toolbar">
        <div className="safari-dots"><span /><span /><span /></div>
        <div className="safari-nav-btns">
          <button type="button" className="safari-nav-btn" aria-label="Back">&#8249;</button>
          <button type="button" className="safari-nav-btn" aria-label="Forward">&#8250;</button>
        </div>
        <form onSubmit={handleAddressSubmit} style={{ flex: 1 }}>
          <input
            ref={inputRef}
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            className="safari-address"
            spellCheck={false}
            onFocus={(e) => e.target.select()}
          />
        </form>
      </div>

      {/* Bookmarks bar */}
      <div className="safari-bookmarks">
        {BOOKMARKS.map((b) => (
          <button
            key={b.siteId}
            type="button"
            className={`safari-bookmark-btn${activeSiteId === b.siteId ? ' active' : ''}`}
            onClick={() => navigateTo(b.siteId)}
          >
            {b.label}
          </button>
        ))}
      </div>

      <div className="safari-view safari-view-react">
        {site.kind === 'component'
          ? <site.component />
          : <iframe title={site.title} srcDoc={site.html} sandbox="allow-same-origin" />
        }
      </div>
    </div>
  );
}
