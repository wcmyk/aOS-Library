import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { LinkedInSite } from './sites/LinkedInSite';
import { WorkdaySite } from './sites/WorkdaySite';
import { ProjectHubSite } from './sites/ProjectHubSite';
import { WorkfrontSite } from './sites/WorkfrontSite';
import { RadarSite } from './sites/RadarSite';
import { BuganizerSite } from './sites/BuganizerSite';
import { ProjectSailSite } from './sites/ProjectSailSite';
import { CoLabSite } from './sites/CoLabSite';
import { SamsungPortalSite } from './sites/SamsungPortalSite';
import { useSafariStore } from '../../state/useSafariStore';
import { useCompanyStore } from '../../state/useCompanyStore';

type SiteId = 'linkedin' | 'workday' | 'workfront' | 'radar' | 'buganizer' | 'project-sail' | 'project-hub' | 'colab' | 'samsung-portal' | 'company-site';

type SiteEntry = { id: SiteId; title: string; domain: string; component: ComponentType };

function CompanySite() {
  const currentUrl = useSafariStore((s) => s.currentUrl);
  const companies = useCompanyStore((s) => s.companies);
  const host = currentUrl.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
  const company = companies.find((c) => host.includes(c.domain.toLowerCase()) || host.includes(c.name.toLowerCase().replace(/\s+/g, '')));

  if (!company) return <div style={{ padding: 24 }}>Company website not found.</div>;

  return (
    <div style={{ minHeight: '100%', background: '#f8fafc', color: '#0f172a' }}>
      <header style={{ background: company.color, color: 'white', padding: '14px 20px' }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{company.name}</div>
        <div style={{ fontSize: 13, opacity: 0.9 }}>{company.industry}</div>
      </header>
      <main style={{ padding: 18, display: 'grid', gap: 12 }}>
        <Section title="About">{company.name} operates in {company.industry} with a company culture focused on delivery and quality.</Section>
        <Section title="Careers">{company.careersSummary} Current departments include Engineering, Product, Finance, and Operations.</Section>
        <Section title="Products / Services">This organization delivers enterprise-grade products and services aligned to its sector.</Section>
        <Section title="Contact">Support: support@{company.domain} · Executive office: execoffice@{company.domain}</Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}><h3 style={{ marginTop: 0 }}>{title}</h3><p style={{ marginBottom: 0 }}>{children}</p></section>;
}

const CORE_SITES: SiteEntry[] = [
  { id: 'linkedin', title: 'LinkedIn', domain: 'linkedin.com', component: LinkedInSite },
  { id: 'workday', title: 'Workday', domain: 'workday.company.io', component: WorkdaySite },
  { id: 'workfront', title: 'Adobe Workfront', domain: 'app.workfront.com', component: WorkfrontSite },
  { id: 'radar', title: 'Radar', domain: 'radar.apple.com', component: RadarSite },
  { id: 'buganizer', title: 'Buganizer', domain: 'b.corp.google.com', component: BuganizerSite },
  { id: 'project-sail', title: 'Project SAIL', domain: 'projectsail.jpmorgan.com', component: ProjectSailSite },
  { id: 'project-hub', title: 'Project Hub', domain: 'projects.aos', component: ProjectHubSite },
  { id: 'colab', title: 'CoLab', domain: 'colab.aos', component: CoLabSite },
  { id: 'samsung-portal', title: 'Samsung PLCM Portal', domain: 'portal.samsung-dev.net', component: SamsungPortalSite },
  { id: 'company-site', title: 'Company Site', domain: '.com', component: CompanySite },
];

export function SafariApp() {
  const [activeSiteId, setActiveSiteId] = useState<SiteId>('linkedin');
  const currentUrl = useSafariStore((s) => s.currentUrl);
  const navigate = useSafariStore((s) => s.navigate);
  const companies = useCompanyStore((s) => s.companies);

  const companyButtons = companies.slice(0, 10);

  const site = useMemo(() => CORE_SITES.find((s) => s.id === activeSiteId) ?? CORE_SITES[0], [activeSiteId]);

  useEffect(() => {
    const target = currentUrl.replace(/^https?:\/\//, '').toLowerCase();
    const matched = CORE_SITES.find((s) => target.includes(s.domain));
    if (matched) setActiveSiteId(matched.id);
    else if (companies.some((c) => target.includes(c.domain.toLowerCase()) || target.includes(c.name.toLowerCase()))) setActiveSiteId('company-site');
  }, [companies, currentUrl]);

  return (
    <div className="safari-shell">
      <div className="safari-toolbar">
        <div className="safari-dots"><span /><span /><span /></div>
        <input
          value={currentUrl}
          onChange={(e) => {
            const raw = e.target.value;
            const companyByName = companies.find((c) => c.name.toLowerCase() === raw.toLowerCase().trim());
            if (companyByName) navigate(`https://${companyByName.domain}`);
            else navigate(raw);
          }}
          className="safari-address"
        />
      </div>
      <div className="safari-layout">
        <aside className="safari-sidebar">
          {CORE_SITES.filter((s) => s.id !== 'company-site').map((s) => (
            <button key={s.id} type="button" className={s.id === activeSiteId ? 'active' : ''} onClick={() => { setActiveSiteId(s.id); navigate(`https://${s.domain}`); }}>
              <strong>{s.title}</strong><span>{s.domain}</span>
            </button>
          ))}
          <div style={{ padding: 8, fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Companies</div>
          {companyButtons.map((c) => (
            <button key={c.id} type="button" className={activeSiteId === 'company-site' && currentUrl.includes(c.domain) ? 'active' : ''} onClick={() => { setActiveSiteId('company-site'); navigate(`https://${c.domain}`); }}>
              <strong>{c.name}</strong><span>{c.domain}</span>
            </button>
          ))}
        </aside>
        <section className="safari-view safari-view-react">
          <site.component />
        </section>
      </div>
    </div>
  );
}
