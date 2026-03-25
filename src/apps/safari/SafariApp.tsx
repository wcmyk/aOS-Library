import { useEffect, useRef, useState, type ComponentType, type MouseEvent, type ReactNode } from 'react';
import { LinkedInSite } from './sites/LinkedInSite';
import { WorkdaySite } from './sites/WorkdaySite';
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

interface BrowserTab {
  id: string;
  title: string;
  url: string;
  siteId: SiteId;
  loading: boolean;
}

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
  { id: 'workfront',     title: 'Adobe Workfront',       domain: 'app.workfront.com',           component: WorkfrontSite },
  { id: 'radar',         title: 'Radar',                 domain: 'radar.apple.com',             component: RadarSite },
  { id: 'buganizer',     title: 'Buganizer',             domain: 'b.corp.google.com',           component: BuganizerSite },
  { id: 'project-sail',  title: 'Project SAIL',          domain: 'projectsail.jpmorgan.com',    component: ProjectSailSite },
  { id: 'project-hub',   title: 'Project Hub',           domain: 'projects.aos',                component: ProjectHubSite },
  { id: 'colab',         title: 'CoLab',                 domain: 'colab.aos',                   component: CoLabSite },
  { id: 'samsung-portal',title: 'Samsung PLCM',          domain: 'portal.samsung-dev.net',      component: SamsungPortalSite },
  { id: 'curcuit',       title: 'CIRCUTE',               domain: 'circute.aos',                 component: CurcuitSite },
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

function makeTab(title: string, url: string, siteId: SiteId): BrowserTab {
  return { id: crypto.randomUUID(), title, url, siteId, loading: false };
}

const INITIAL_TABS: BrowserTab[] = [
  makeTab('LinkedIn', 'https://linkedin.com', 'linkedin'),
];

export function SafariApp() {
  const [tabs, setTabs] = useState<BrowserTab[]>(INITIAL_TABS);
  const [activeTabId, setActiveTabId] = useState(INITIAL_TABS[0].id);
  const [addressBar, setAddressBar] = useState(INITIAL_TABS[0].url);
  const [editingAddress, setEditingAddress] = useState(false);
  const navigate = useSafariStore((s) => s.navigate);
  const companies = useCompanyStore((s) => s.companies);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  // Keep address bar in sync with active tab when not editing
  useEffect(() => {
    if (!editingAddress) setAddressBar(activeTab?.url ?? '');
  }, [activeTab?.url, editingAddress]);

  function switchTab(tabId: string) {
    setActiveTabId(tabId);
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) navigate(tab.url);
  }

  function openTab(url: string, siteId: SiteId, title: string) {
    // If tab with same siteId already open, switch to it
    const existing = tabs.find((t) => t.siteId === siteId && siteId !== 'new-tab');
    if (existing) {
      switchTab(existing.id);
      return;
    }
    const newTab: BrowserTab = { id: crypto.randomUUID(), title, url, siteId, loading: true };
    setTabs((current) => [...current, newTab]);
    setActiveTabId(newTab.id);
    navigate(url);
    // Simulate page load
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => {
      setTabs((current) => current.map((t) => (t.id === newTab.id ? { ...t, loading: false } : t)));
    }, 450);
  }

  function closeTab(tabId: string, e: MouseEvent) {
    e.stopPropagation();
    if (tabs.length === 1) return; // keep at least one tab
    const idx = tabs.findIndex((t) => t.id === tabId);
    const next = tabs[idx + 1] ?? tabs[idx - 1];
    setTabs((current) => current.filter((t) => t.id !== tabId));
    if (tabId === activeTabId && next) switchTab(next.id);
  }

  function newBlankTab() {
    const t = makeTab('New Tab', 'about:blank', 'new-tab');
    setTabs((current) => [...current, t]);
    setActiveTabId(t.id);
    setAddressBar('');
    setEditingAddress(true);
  }

  function navigateActiveTab(rawInput: string) {
    // Resolve company name shortcut
    const companyMatch = companies.find((c) => c.name.toLowerCase() === rawInput.toLowerCase().trim());
    const url = companyMatch
      ? `https://${companyMatch.domain}`
      : rawInput.startsWith('http')
        ? rawInput
        : `https://${rawInput}`;

    const siteId = resolveSiteId(url, companies);
    const siteEntry = CORE_SITES.find((s) => s.id === siteId);
    const title = companyMatch?.name ?? siteEntry?.title ?? url;

    // Update active tab
    setTabs((current) =>
      current.map((t) =>
        t.id === activeTabId ? { ...t, url, title, siteId, loading: true } : t
      )
    );
    navigate(url);
    setAddressBar(url);
    setEditingAddress(false);

    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => {
      setTabs((current) => current.map((t) => (t.id === activeTabId ? { ...t, loading: false } : t)));
    }, 450);
  }

  const SiteComponent = CORE_SITES.find((s) => s.id === activeTab?.siteId)?.component ?? NewTabPage;
  const companyBookmarks = companies.slice(0, 10);

  return (
    <div className="safari-shell" style={{ gap: 0 }}>
      {/* Toolbar */}
      <div className="safari-toolbar">
        <div className="safari-dots">
          <span /><span /><span />
        </div>
        <input
          className="safari-address"
          value={editingAddress ? addressBar : (activeTab?.url ?? '')}
          onFocus={() => { setEditingAddress(true); setAddressBar(activeTab?.url ?? ''); }}
          onBlur={() => setEditingAddress(false)}
          onChange={(e) => setAddressBar(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') navigateActiveTab(addressBar); }}
          placeholder="Search or enter URL"
          spellCheck={false}
        />
      </div>

      {/* Tab bar */}
      <div className="safari-tabbar">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`safari-tab${tab.id === activeTabId ? ' active' : ''}`}
            onClick={() => switchTab(tab.id)}
            title={tab.url}
          >
            {tab.loading ? (
              <span className="safari-tab-loading" />
            ) : (
              <span style={{ fontSize: 10, opacity: 0.6 }}>◉</span>
            )}
            <span className="safari-tab-title">{tab.title}</span>
            <button
              type="button"
              className="safari-tab-close"
              onClick={(e) => closeTab(tab.id, e)}
              title="Close tab"
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" className="safari-newtab-btn" onClick={newBlankTab} title="New tab">
          +
        </button>
      </div>

      {/* Main layout */}
      <div className="safari-layout">
        {/* Bookmarks sidebar */}
        <aside className="safari-sidebar">
          <div className="safari-section-label">Bookmarks</div>
          {CORE_SITES.filter((s) => s.id !== 'company-site' && s.id !== 'new-tab').map((s) => (
            <button
              key={s.id}
              type="button"
              className={activeTab?.siteId === s.id ? 'active' : ''}
              onClick={() => openTab(`https://${s.domain}`, s.id, s.title)}
            >
              <strong>{s.title}</strong>
              <span>{s.domain}</span>
            </button>
          ))}

          {companyBookmarks.length > 0 && (
            <>
              <div className="safari-section-label" style={{ marginTop: 6 }}>Companies</div>
              {companyBookmarks.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={activeTab?.siteId === 'company-site' && activeTab.url.includes(c.domain) ? 'active' : ''}
                  onClick={() => openTab(`https://${c.domain}`, 'company-site', c.name)}
                >
                  <strong>{c.name}</strong>
                  <span>{c.domain}</span>
                </button>
              ))}
            </>
          )}
        </aside>

        {/* Page content */}
        <section className="safari-view safari-view-react">
          {activeTab?.loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0f1218' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div className="safari-tab-loading" style={{ width: 22, height: 22, borderWidth: 2.5 }} />
                <div style={{ fontSize: 12, color: '#334155' }}>Loading…</div>
              </div>
            </div>
          ) : (
            <SiteComponent />
          )}
        </section>
      </div>
    </div>
  );
}
