import { useRef, useState, type ComponentType, type ReactNode } from 'react';
import { LinkedInSite } from './sites/LinkedInSite';
import { WorkdaySite } from './sites/WorkdaySite';
import { AdpSite } from './sites/AdpSite';
import { GmailSite } from './sites/GmailSite';
import { GoogleSite } from './sites/GoogleSite';
import { ProjectHubSite } from './sites/ProjectHubSite';
import { WorkfrontSite } from './sites/WorkfrontSite';
import { RadarSite } from './sites/RadarSite';
import { BuganizerSite } from './sites/BuganizerSite';
import { ProjectSailSite } from './sites/ProjectSailSite';
import { CoLabSite } from './sites/CoLabSite';
import { SamsungPortalSite } from './sites/SamsungPortalSite';
import { CurcuitSite } from './sites/CurcuitSite';
import { useSafariStore } from '../../state/useSafariStore';
import { useCompanyStore } from '../../state/useCompanyStore';

type SiteId =
  | 'linkedin'
  | 'workday'
  | 'adp'
  | 'gmail'
  | 'google'
  | 'workfront'
  | 'radar'
  | 'buganizer'
  | 'project-sail'
  | 'project-hub'
  | 'colab'
  | 'samsung-portal'
  | 'curcuit'
  | 'company-site'
  | 'new-tab';

type SiteEntry = { id: SiteId; title: string; domain: string; component: ComponentType; favicon?: string };

function NewTabPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0f1218', color: '#64748b', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 32, opacity: 0.3 }}>⊕</div>
      <div style={{ fontSize: 13 }}>New Tab</div>
    </div>
  );
}

function CompanySite() {
  const currentUrl = useSafariStore((s) => s.currentUrl);
  const companies = useCompanyStore((s) => s.companies);
  const host = currentUrl.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
  const company = companies.find(
    (c) => host.includes(c.domain.toLowerCase()) || host.includes(c.name.toLowerCase().replace(/\s+/g, ''))
  );
  if (!company) return <div style={{ padding: 24 }}>Company website not found.</div>;
  return (
    <div style={{ minHeight: '100%', background: '#f8fafc', color: '#0f172a' }}>
      <header style={{ background: company.color, color: 'white', padding: '14px 20px' }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{company.name}</div>
        <div style={{ fontSize: 13, opacity: 0.9 }}>{company.industry}</div>
      </header>
      <main style={{ padding: 18, display: 'grid', gap: 12 }}>
        <Section title="About">{company.name} operates in {company.industry} with a culture focused on delivery and quality.</Section>
        <Section title="Careers">{company.careersSummary} Departments include Engineering, Product, Finance, and Operations.</Section>
        <Section title="Products / Services">Enterprise-grade products and services aligned to the sector.</Section>
        <Section title="Contact">support@{company.domain} · execoffice@{company.domain}</Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ marginBottom: 0 }}>{children}</p>
    </section>
  );
}

const CORE_SITES: SiteEntry[] = [
  { id: 'linkedin',      title: 'LinkedIn',              domain: 'linkedin.com',               component: LinkedInSite },
  { id: 'workday',       title: 'Workday',               domain: 'workday.company.io',          component: WorkdaySite },
  { id: 'adp',           title: 'myADP',                 domain: 'my.adp.com',                  component: AdpSite },
  { id: 'gmail',         title: 'Gmail',                 domain: 'mail.google.com',             component: GmailSite },
  { id: 'workfront',     title: 'Adobe Workfront',       domain: 'app.workfront.com',           component: WorkfrontSite },
  { id: 'radar',         title: 'Radar',                 domain: 'radar.apple.com',             component: RadarSite },
  { id: 'buganizer',     title: 'Buganizer',             domain: 'b.corp.google.com',           component: BuganizerSite },
  { id: 'project-sail',  title: 'Project SAIL',          domain: 'projectsail.jpmorgan.com',    component: ProjectSailSite },
  { id: 'project-hub',   title: 'Project Hub',           domain: 'projects.aos',                component: ProjectHubSite },
  { id: 'colab',         title: 'CoLab',                 domain: 'colab.aos',                   component: CoLabSite },
  { id: 'samsung-portal',title: 'Samsung PLCM',          domain: 'portal.samsung-dev.net',      component: SamsungPortalSite },
  { id: 'curcuit',       title: 'CIRCUTE',               domain: 'circute.aos',                 component: CurcuitSite },
  { id: 'google',        title: 'Google',                domain: 'google.com',                  component: GoogleSite },
  { id: 'company-site',  title: 'Company',               domain: '.com',                        component: CompanySite },
  { id: 'new-tab',       title: 'New Tab',               domain: '',                            component: NewTabPage },
];

function resolveSiteId(url: string, companies: { domain: string; name: string }[]): SiteId {
  const target = url.replace(/^https?:\/\//, '').toLowerCase();
  const matched = CORE_SITES.find((s) => s.domain && target.includes(s.domain));
  if (matched) return matched.id;
  if (companies.some((c) => target.includes(c.domain.toLowerCase()) || target.includes(c.name.toLowerCase()))) {
    return 'company-site';
  }
  return 'new-tab';
}

// ─── Bookmark homepage grid ────────────────────────────────────────────────────

const FAVICON_COLORS: Record<string, string> = {
  linkedin: '#0a66c2', workday: '#f38b00', adp: '#d0271d', gmail: '#ea4335', google: '#4285f4', workfront: '#e8232a',
  radar: '#0071e3', buganizer: '#34a853', 'project-sail': '#003087',
  'project-hub': '#6366f1', colab: '#5b5fc7', 'samsung-portal': '#1428a0',
  curcuit: '#7dd3fc',
};

function FaviconSVG({ siteId, size = 28 }: { siteId: string; size?: number }) {
  const color = FAVICON_COLORS[siteId] ?? '#475569';
  const letter = (siteId.charAt(0) ?? 'W').toUpperCase();
  return (
    <svg width={size} height={size} viewBox="0 0 28 28">
      <rect width="28" height="28" rx="6" fill={color} />
      <text x="14" y="19.5" textAnchor="middle" fontSize="13" fontWeight="700"
        fill="white" fontFamily="SF Pro Display, Inter, sans-serif">{letter}</text>
    </svg>
  );
}

function BookmarksPage({ onNavigate }: { onNavigate: (url: string, siteId: SiteId, title: string) => void }) {
  const companies = useCompanyStore((s) => s.companies);
  const companyBookmarks = companies.slice(0, 8);
  const coreSites = CORE_SITES.filter((s) => s.id !== 'company-site' && s.id !== 'new-tab');

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#0a1220', padding: '40px 32px' }}>
      {/* Search prompt */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <svg width="44" height="44" viewBox="0 0 44 44" style={{ marginBottom: 12 }}>
          <circle cx="22" cy="22" r="21" fill="none" stroke="rgba(125,211,252,0.3)" strokeWidth="1.5" />
          <path d="M14 22 Q22 10 30 22 Q22 34 14 22Z" fill="none" stroke="rgba(125,211,252,0.5)" strokeWidth="1.5" />
          <ellipse cx="22" cy="22" rx="5" ry="21" fill="none" stroke="rgba(125,211,252,0.3)" strokeWidth="1" />
        </svg>
        <div style={{ fontSize: 13, color: '#64748b' }}>Type a URL or site name in the address bar to navigate</div>
      </div>

      {/* Core bookmarks */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
          Bookmarks
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {coreSites.map((s) => (
            <button
              key={s.id}
              onClick={() => onNavigate(`https://${s.domain}`, s.id, s.title)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: '18px 12px', background: 'rgba(15,25,45,0.9)',
                border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12,
                cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(125,211,252,0.35)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(20,40,70,0.9)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(148,163,184,0.12)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(15,25,45,0.9)'; }}
            >
              <FaviconSVG siteId={s.id} />
              <div style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', textAlign: 'center' }}>{s.title}</div>
              <div style={{ fontSize: 10, color: '#475569', textAlign: 'center' }}>{s.domain}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Company bookmarks */}
      {companyBookmarks.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
            Companies
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {companyBookmarks.map((c) => (
              <button
                key={c.id}
                onClick={() => onNavigate(`https://${c.domain}`, 'company-site', c.name)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '18px 12px', background: 'rgba(15,25,45,0.9)',
                  border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12,
                  cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(125,211,252,0.35)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(20,40,70,0.9)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(148,163,184,0.12)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(15,25,45,0.9)'; }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28">
                  <rect width="28" height="28" rx="6" fill={c.color ?? '#334155'} />
                  <text x="14" y="19.5" textAnchor="middle" fontSize="11" fontWeight="700"
                    fill="white" fontFamily="SF Pro Display, Inter, sans-serif">
                    {c.name.slice(0, 2).toUpperCase()}
                  </text>
                </svg>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', textAlign: 'center' }}>{c.name}</div>
                <div style={{ fontSize: 10, color: '#475569', textAlign: 'center' }}>{c.domain}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Browser Shell ────────────────────────────────────────────────────────

export function SafariApp() {
  // Current page state — null means "show bookmarks homepage"
  const [currentPage, setCurrentPage] = useState<{ url: string; siteId: SiteId; title: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [addressBar, setAddressBar] = useState('');
  const [editingAddress, setEditingAddress] = useState(false);
  const navigate = useSafariStore((s) => s.navigate);
  const companies = useCompanyStore((s) => s.companies);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function goHome() {
    setCurrentPage(null);
    setAddressBar('');
    setEditingAddress(false);
  }

  function openPage(url: string, siteId: SiteId, title: string) {
    setLoading(true);
    setCurrentPage({ url, siteId, title });
    setAddressBar(url);
    setEditingAddress(false);
    navigate(url);
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => setLoading(false), 420);
  }

  function handleNavigate(rawInput: string) {
    if (!rawInput.trim()) { goHome(); return; }
    const companyMatch = companies.find((c) => c.name.toLowerCase() === rawInput.toLowerCase().trim());
    const url = companyMatch
      ? `https://${companyMatch.domain}`
      : rawInput.startsWith('http') ? rawInput : `https://${rawInput}`;
    const siteId = resolveSiteId(url, companies);
    const siteEntry = CORE_SITES.find((s) => s.id === siteId);
    openPage(url, siteId, companyMatch?.name ?? siteEntry?.title ?? url);
  }

  const SiteComponent = currentPage
    ? (CORE_SITES.find((s) => s.id === currentPage.siteId)?.component ?? NewTabPage)
    : null;

  return (
    <div className="safari-shell" style={{ gap: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Toolbar ── */}
      <div className="safari-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', flexShrink: 0 }}>
        <div className="safari-dots"><span /><span /><span /></div>

        {/* Back to home button */}
        <button
          type="button"
          onClick={goHome}
          title="Bookmarks"
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
            color: currentPage ? '#7dd3fc' : '#334155', borderRadius: 6,
            display: 'flex', alignItems: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 5.5L8 2l6 3.5V14H2V5.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            <rect x="5.5" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>

        {/* Back button (only when a page is loaded) */}
        {currentPage && (
          <button
            type="button"
            onClick={goHome}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: '#94a3b8', borderRadius: 6 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {/* Address bar */}
        <input
          className="safari-address"
          style={{ flex: 1 }}
          value={editingAddress ? addressBar : (currentPage?.url ?? '')}
          onFocus={() => { setEditingAddress(true); setAddressBar(currentPage?.url ?? ''); }}
          onBlur={() => setEditingAddress(false)}
          onChange={(e) => setAddressBar(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate(addressBar); if (e.key === 'Escape') { setEditingAddress(false); } }}
          placeholder="Search bookmarks or enter a URL"
          spellCheck={false}
        />

        {/* Loading indicator */}
        {loading && <span className="safari-tab-loading" style={{ width: 14, height: 14, flexShrink: 0 }} />}
      </div>

      {/* ── Main layout ── */}
      <div className="safari-layout" style={{ flex: 1, minHeight: 0 }}>
        {/* Bookmarks sidebar */}
        <aside className="safari-sidebar">
          <div className="safari-section-label">Bookmarks</div>
          {CORE_SITES.filter((s) => s.id !== 'company-site' && s.id !== 'new-tab').map((s) => (
            <button
              key={s.id}
              type="button"
              className={currentPage?.siteId === s.id ? 'active' : ''}
              onClick={() => openPage(`https://${s.domain}`, s.id, s.title)}
            >
              <strong>{s.title}</strong>
              <span>{s.domain}</span>
            </button>
          ))}

          {companies.slice(0, 10).length > 0 && (
            <>
              <div className="safari-section-label" style={{ marginTop: 6 }}>Companies</div>
              {companies.slice(0, 10).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={currentPage?.siteId === 'company-site' && currentPage.url.includes(c.domain) ? 'active' : ''}
                  onClick={() => openPage(`https://${c.domain}`, 'company-site', c.name)}
                >
                  <strong>{c.name}</strong>
                  <span>{c.domain}</span>
                </button>
              ))}
            </>
          )}
        </aside>

        {/* Page content */}
        <section className="safari-view safari-view-react" style={{ flex: 1, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0f1218' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div className="safari-tab-loading" style={{ width: 22, height: 22, borderWidth: 2.5 }} />
                <div style={{ fontSize: 12, color: '#334155' }}>Loading…</div>
              </div>
            </div>
          ) : currentPage && SiteComponent ? (
            <SiteComponent />
          ) : (
            <BookmarksPage onNavigate={openPage} />
          )}
        </section>
      </div>
    </div>
  );
}
