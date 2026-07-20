import { useRef, useState, type ComponentType, type ReactNode } from 'react';
import { LinkedInSite } from './sites/LinkedInSite';
import { WorkdaySite } from './sites/WorkdaySite';
import { AdpSite } from './sites/AdpSite';
import { GmailSite } from './sites/GmailSite';
import { GoogleSite } from './sites/GoogleSite';
import { ClaudeSite, ChatGptSite, GeminiSite } from './sites/AiAssistantSites';
import { AmazonSite } from './sites/AmazonSite';
import { GitHubSite, GitHubMark } from './sites/GitHubSite';
import { TurboTaxSite } from './sites/TurboTaxSite';
import { ProjectHubSite } from './sites/ProjectHubSite';
import { WorkfrontSite } from './sites/WorkfrontSite';
import { RadarSite } from './sites/RadarSite';
import { BuganizerSite } from './sites/BuganizerSite';
import { ProjectSailSite } from './sites/ProjectSailSite';
import { CoLabSite } from './sites/CoLabSite';
import { SamsungPortalSite } from './sites/SamsungPortalSite';
import { CurcuitSite } from './sites/CurcuitSite';
import { useSafariStore } from '../../state/useSafariStore';
import { CompanyLogo, GmailM, ClaudeSpark, ChatGptKnot, GeminiSpark, WorkdayLogo, AdpLogo, ChaseOctagon } from '../../data/brands';
import './safari.css';
import { useCompanyStore } from '../../state/useCompanyStore';

type SiteId =
  | 'linkedin'
  | 'workday'
  | 'adp'
  | 'gmail'
  | 'google'
  | 'claude'
  | 'chatgpt'
  | 'gemini'
  | 'amazon'
  | 'github'
  | 'turbotax'
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
  { id: 'amazon',        title: 'Amazon',                domain: 'amazon.com',                  component: AmazonSite },
  { id: 'github',        title: 'GitHub',                domain: 'github.com',                  component: GitHubSite },
  { id: 'turbotax',      title: 'TurboTax',              domain: 'turbotax.intuit.com',         component: TurboTaxSite },
  { id: 'claude',        title: 'Claude',                domain: 'claude.ai',                   component: ClaudeSite },
  { id: 'chatgpt',       title: 'ChatGPT',               domain: 'chatgpt.com',                 component: ChatGptSite },
  { id: 'gemini',        title: 'Gemini',                domain: 'gemini.google.com',           component: GeminiSite },
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
  linkedin: '#0a66c2', workday: '#f38b00', adp: '#d0271d', gmail: '#ea4335', google: '#4285f4', amazon: '#131921', claude: '#D97757', chatgpt: '#10a37f', gemini: '#4285F4', workfront: '#e8232a',
  radar: '#0071e3', buganizer: '#34a853', 'project-sail': '#003087',
  'project-hub': '#6366f1', colab: '#5b5fc7', 'samsung-portal': '#1428a0',
  curcuit: '#7dd3fc',
};

function SiteFavicon({ siteId, size = 28 }: { siteId: string; size?: number }) {
  const wrap = (child: ReactNode, bg = '#fff') => (
    <span style={{
      width: size, height: size, borderRadius: size * 0.22, background: bg,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
    }}>{child}</span>
  );
  switch (siteId) {
    case 'linkedin': return (
      <svg width={size} height={size} viewBox="0 0 34 34" style={{ flexShrink: 0 }}><rect width="34" height="34" rx="7" fill="#0a66c2" /><path d="M8.4 13.3h3.7V26H8.4zM10.2 7.5a2.15 2.15 0 1 1 0 4.3 2.15 2.15 0 0 1 0-4.3zM14.6 13.3h3.55v1.74h.05c.5-.94 1.7-1.93 3.51-1.93 3.76 0 4.45 2.47 4.45 5.69V26h-3.7v-6.4c0-1.53-.03-3.5-2.13-3.5-2.13 0-2.46 1.66-2.46 3.38V26h-3.7z" fill="#fff" /></svg>
    );
    case 'amazon': return wrap(
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 0.7 }}>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: size * 0.5, letterSpacing: '-0.05em', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>a</span>
        <svg width={size * 0.55} height={size * 0.16} viewBox="0 0 60 14"><path d="M2 3 C 18 13, 42 13, 56 5" fill="none" stroke="#FF9900" strokeWidth="4" strokeLinecap="round" /><path d="M56 5 l-5.5-2.2 M56 5 l-2 5.4" fill="none" stroke="#FF9900" strokeWidth="3.4" strokeLinecap="round" /></svg>
      </span>, '#131921');
    case 'github': return wrap(<GitHubMark size={size * 0.82} color="#fff" />, '#1f2328');
    case 'turbotax': return wrap(
      <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#d52b1e" /><path d="m9.5 16.5 4.5 4.5 8.5-9.5" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>, '#fff');
    case 'gmail': return wrap(<GmailM size={size * 0.78} />, '#fff');
    case 'google': return wrap(<svg width={size * 0.72} height={size * 0.72} viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>);
    case 'claude': return wrap(<ClaudeSpark size={size * 0.7} />, '#F0EEE6');
    case 'chatgpt': return wrap(<ChatGptKnot size={size * 0.7} color="#fff" />, '#000');
    case 'gemini': return wrap(<GeminiSpark size={size * 0.72} />, '#fff');
    case 'workday': return wrap(
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="#fff" opacity="0.16" />
        <path d="M7 12 l3.2 9 3-7.4 2.8 7.4 3-7.4 2.8 7.4 3.2-9" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>, '#F38B00');
    case 'adp': return wrap(<span style={{ color: '#fff', fontWeight: 800, fontStyle: 'italic', fontSize: size * 0.34, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>ADP</span>, '#d0271d');
    case 'radar': return wrap(<CompanyLogo company="Apple" size={size} />, '#000');
    case 'buganizer': return wrap(
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 32 32"><ellipse cx="16" cy="19" rx="8" ry="10" fill="#fff"/><circle cx="16" cy="8" r="5" fill="#fff"/><path d="M4 14 l6 3 M4 22 l6 1 M28 14 l-6 3 M28 22 l-6 1" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><path d="M12 15 v8 M16 14 v10 M20 15 v8" stroke="#34a853" strokeWidth="1.6"/></svg>, '#34a853');
    default: {
      const color = FAVICON_COLORS[siteId] ?? '#475569';
      const letter = (siteId.charAt(0) ?? 'W').toUpperCase();
      return (
        <svg width={size} height={size} viewBox="0 0 28 28" style={{ flexShrink: 0 }}>
          <rect width="28" height="28" rx="6" fill={color} />
          <text x="14" y="19.5" textAnchor="middle" fontSize="13" fontWeight="700" fill="white" fontFamily="SF Pro Display, Inter, sans-serif">{letter}</text>
        </svg>
      );
    }
  }
}

function StartPage({ onNavigate }: { onNavigate: (url: string, siteId: SiteId, title: string) => void }) {
  const companies = useCompanyStore((s) => s.companies);
  const coreSites = CORE_SITES.filter((s) => s.id !== 'company-site' && s.id !== 'new-tab');

  return (
    <div className="sf-start">
      <div className="sf-start-inner">
        <h2 className="sf-start-title">Favorites</h2>
        <div className="sf-fav-grid">
          {coreSites.map((site) => (
            <button key={site.id} type="button" className="sf-fav" onClick={() => onNavigate(`https://${site.domain}`, site.id, site.title)}>
              <span className="sf-fav-icon"><SiteFavicon siteId={site.id} size={44} /></span>
              <span className="sf-fav-label">{site.title}</span>
            </button>
          ))}
        </div>

        {companies.length > 0 && (
          <>
            <h2 className="sf-start-title">Frequently Visited</h2>
            <div className="sf-fav-grid">
              {companies.slice(0, 8).map((c) => (
                <button key={c.id} type="button" className="sf-fav" onClick={() => onNavigate(`https://${c.domain}`, 'company-site', c.name)}>
                  <span className="sf-fav-icon"><CompanyLogo company={c.name} size={44} /></span>
                  <span className="sf-fav-label">{c.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="sf-privacy-card">
          <div className="sf-privacy-head">
            <svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 2 4 5.5V11c0 4.9 3.4 9.5 8 10.7 4.6-1.2 8-5.8 8-10.7V5.5L12 2z" fill="#4d90f0"/><path d="M12 6.5a3.2 3.2 0 0 1 3.2 3.2c0 2.4-3.2 6-3.2 6s-3.2-3.6-3.2-6A3.2 3.2 0 0 1 12 6.5z" fill="#fff" opacity="0.9"/></svg>
            <strong>Privacy Report</strong>
          </div>
          <p>In the last seven days, Safari has prevented <strong>{47 + (companies.length * 3)}</strong> trackers from profiling you.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Browser Shell ────────────────────────────────────────────────────────

export function SafariApp() {
  // Current page state — null means "show the start page"
  const [currentPage, setCurrentPage] = useState<{ url: string; siteId: SiteId; title: string } | null>(null);
  const [history, setHistory] = useState<Array<{ url: string; siteId: SiteId; title: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [addressBar, setAddressBar] = useState('');
  const [editingAddress, setEditingAddress] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    if (currentPage) setHistory((h) => [...h.slice(-19), currentPage]);
    setCurrentPage({ url, siteId, title });
    setAddressBar(url);
    setEditingAddress(false);
    navigate(url);
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => setLoading(false), 420);
  }

  function goBack() {
    const prev = history[history.length - 1];
    if (prev) {
      setHistory((h) => h.slice(0, -1));
      setCurrentPage(prev);
      setAddressBar(prev.url);
      navigate(prev.url);
    } else {
      goHome();
    }
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

  const displayHost = currentPage ? currentPage.url.replace(/^https?:\/\//, '').split('/')[0] : '';

  return (
    <div className="sf-shell">
      {/* ── Safari unified toolbar ── */}
      <div className="sf-toolbar">
        <button type="button" className={`sf-tbtn ${sidebarOpen ? 'on' : ''}`} title="Show sidebar" onClick={() => setSidebarOpen((v) => !v)}>
          <svg width="17" height="15" viewBox="0 0 20 17"><rect x="0.75" y="0.75" width="18.5" height="15.5" rx="3.2" fill="none" stroke="currentColor" strokeWidth="1.5"/><line x1="7" y1="1" x2="7" y2="16" stroke="currentColor" strokeWidth="1.5"/><line x1="2.6" y1="4.4" x2="4.8" y2="4.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="2.6" y1="7.2" x2="4.8" y2="7.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
        </button>
        <div className="sf-nav-chevrons">
          <button type="button" className="sf-tbtn" title="Back" onClick={goBack} disabled={!currentPage}>
            <svg width="10" height="16" viewBox="0 0 10 16"><path d="M8.5 1.5 2 8l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button type="button" className="sf-tbtn" title="Forward" disabled>
            <svg width="10" height="16" viewBox="0 0 10 16"><path d="M1.5 1.5 8 8l-6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        <button type="button" className="sf-tbtn sf-shield" title="Privacy Report">
          <svg width="15" height="17" viewBox="0 0 24 26"><path d="M12 1 2 5v7c0 6.2 4.3 12 10 13.5C17.7 24 22 18.2 22 12V5L12 1z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
        </button>

        {/* Centered address capsule */}
        <div className="sf-address-wrap">
          <div className={`sf-address ${editingAddress ? 'editing' : ''}`} onClick={() => setEditingAddress(true)}>
            {!editingAddress && currentPage ? (
              <>
                <span className="sf-lock"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V8a3 3 0 0 0-6 0z"/></svg></span>
                <span className="sf-host">{displayHost}</span>
                <button type="button" className="sf-reload" title="Reload" onClick={(e) => { e.stopPropagation(); openPage(currentPage.url, currentPage.siteId, currentPage.title); }}>
                  <svg width="13" height="13" viewBox="0 0 16 16"><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 1v3.5H10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </button>
              </>
            ) : (
              <>
                <span className="sf-search-glass">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21.41 18.59l-5.27-5.28A6.83 6.83 0 0 0 17 10a7 7 0 1 0-7 7 6.83 6.83 0 0 0 3.31-.86l5.28 5.27a2 2 0 0 0 2.82-2.82zM5 10a5 5 0 1 1 5 5 5 5 0 0 1-5-5z"/></svg>
                </span>
                <input
                  autoFocus={editingAddress}
                  className="sf-address-input"
                  value={editingAddress ? addressBar : ''}
                  onFocus={() => { setEditingAddress(true); setAddressBar(currentPage?.url ?? ''); }}
                  onBlur={() => setTimeout(() => setEditingAddress(false), 120)}
                  onChange={(e) => setAddressBar(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate(addressBar); if (e.key === 'Escape') setEditingAddress(false); }}
                  placeholder="Search or enter website name"
                  spellCheck={false}
                />
              </>
            )}
            {loading && <span className="sf-loading" />}
          </div>
        </div>

        <button type="button" className="sf-tbtn" title="Share">
          <svg width="14" height="18" viewBox="0 0 18 24"><path d="M9 1v13M5 5l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 9H2v13h14V9h-2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
        <button type="button" className="sf-tbtn" title="New tab" onClick={goHome}>
          <svg width="14" height="14" viewBox="0 0 16 16"><path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
        <button type="button" className="sf-tbtn" title="Tab overview">
          <svg width="15" height="15" viewBox="0 0 18 18"><rect x="1" y="1" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="10" y="1" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="10" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="10" y="10" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
        </button>
      </div>

      {/* ── Main layout ── */}
      <div className="sf-layout">
        {sidebarOpen && (
          <aside className="sf-sidebar">
            <div className="sf-sidebar-label">Favorites</div>
            {CORE_SITES.filter((s) => s.id !== 'company-site' && s.id !== 'new-tab').map((site) => (
              <button
                key={site.id}
                type="button"
                className={`sf-sidebar-row ${currentPage?.siteId === site.id ? 'active' : ''}`}
                onClick={() => openPage(`https://${site.domain}`, site.id, site.title)}
              >
                <SiteFavicon siteId={site.id} size={20} />
                <span>{site.title}</span>
              </button>
            ))}
            {companies.length > 0 && <div className="sf-sidebar-label">Companies</div>}
            {companies.slice(0, 10).map((c) => (
              <button
                key={c.id}
                type="button"
                className={`sf-sidebar-row ${currentPage?.siteId === 'company-site' && currentPage.url.includes(c.domain) ? 'active' : ''}`}
                onClick={() => openPage(`https://${c.domain}`, 'company-site', c.name)}
              >
                <CompanyLogo company={c.name} size={20} />
                <span>{c.name}</span>
              </button>
            ))}
          </aside>
        )}

        <section className="sf-view safari-view-react">
          {loading ? (
            <div className="sf-loading-page"><span className="sf-loading sf-loading-lg" /></div>
          ) : currentPage && SiteComponent ? (
            <SiteComponent />
          ) : (
            <StartPage onNavigate={openPage} />
          )}
        </section>
      </div>
    </div>
  );
}
