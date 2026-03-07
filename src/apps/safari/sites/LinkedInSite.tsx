import { useState, useMemo } from 'react';
import { useMailStore } from '../../../state/useMailStore';

// ── Seeded random ─────────────────────────────────────────────────────────────

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ── Name algorithm ────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Marcus','Elena','Julian','Sophia','Kieran','Priya','Devon','Nadia',
  'Ethan','Cassandra','Rohan','Isabelle','Theo','Mei','Malik','Serena',
  'Cade','Yuna','Levi','Anastasia','Omar','Vivienne','Flynn','Leila',
  'Ashton','Zara','Darius','Iris','Remy','Naomi','Colton','Ingrid',
  'Rafael','Amara','Pierce','Solen','Brennan','Lyra','Cyrus','Wren',
];

const LAST_NAMES = [
  'Hartwell','Chen','Vasquez','Nakamura','Whitfield','Okafor','Patel',
  'Dumont','Reyes','Bergmann','Wolfe','Tanaka','Calloway','Erikson',
  'Mensah','Thornton','Delacroix','Kimura','Osei','Harrington',
  'Stroud','Okoro','Voss','Aldridge','Iyer','Fontaine','Brandt',
  'Adeyemi','Castillo','Lindqvist','Moran','Nakashima','Ferreira',
];

function makeName(rng: () => number) {
  return `${pick(FIRST_NAMES, rng)} ${pick(LAST_NAMES, rng)}`;
}

// ── Company name algorithm ────────────────────────────────────────────────────

const C_PREFIX  = ['Fin','Ax','Neu','Dyn','Cal','Vor','Clar','Apex','Xen','Ven','Lux','Strat','Nav','Bex','Omni','Kine','Quor','Pell','Sev','Arc','Vect','Prox','Onyx','Zeph'];
const C_CORE    = ['ec','en','al','ic','ix','ar','os','um','on','ev','ex','id','iq','ov','ur','an','em'];
const C_SUFFIX  = ['a','is','us','io','ax','ix','al','ys','ia','ux'];
const C_TYPE    = ['LLC','Group','Partners','Capital','Solutions','Technologies','Advisory','Consulting','Systems','Ventures','Analytics','Advisors'];

function makeCompany(rng: () => number): string {
  const name = pick(C_PREFIX, rng) + pick(C_CORE, rng) + pick(C_SUFFIX, rng);
  const type = pick(C_TYPE, rng);
  return `${name} ${type}`;
}

function makeDomain(company: string): string {
  return company.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '') + '.io';
}

// ── Role algorithm ────────────────────────────────────────────────────────────

type RoleCategory = keyof typeof ROLE_MAP;

const ROLE_MAP = {
  swe:       ['Software Engineer','Senior Software Engineer','Staff Engineer','Principal Engineer','Backend Engineer','Systems Engineer'],
  fullstack: ['Full Stack Developer','Full Stack Engineer','Senior Full Stack Engineer','Software Development Engineer'],
  aiml:      ['ML Engineer','Applied ML Scientist','AI Research Engineer','ML Platform Engineer','Senior ML Engineer','Research Scientist'],
  aiintegr:  ['AI Integration Engineer','LLM Systems Engineer','AI Solutions Architect','Generative AI Engineer','AI Product Engineer'],
  devops:    ['DevOps Engineer','Site Reliability Engineer','Platform Engineer','Infrastructure Engineer','Cloud Engineer','MLOps Engineer'],
  quant:     ['Quantitative Analyst','Quantitative Developer','Algorithmic Trading Engineer','Quant Researcher','Quant Strategist','Systematic Trader'],
  quantfin:  ['Quantitative Finance Analyst','Fixed Income Analyst','Derivatives Pricing Analyst','Structured Products Analyst','Rates Analyst','Equity Quant Analyst'],
  insurance: ['Actuarial Analyst','Insurance Risk Analyst','Underwriting Analyst','Claims Analyst','Reinsurance Analyst','Property Risk Analyst'],
  risk:      ['Risk Analyst','Credit Risk Analyst','Market Risk Analyst','Enterprise Risk Manager','Operational Risk Analyst','Model Risk Analyst'],
  consulting:['Strategy Consultant','Management Consultant','Technology Consultant','Business Analyst','Associate Consultant','Senior Analyst'],
  analyst:   ['Data Analyst','Financial Analyst','Operations Research Analyst','Business Intelligence Analyst','Research Analyst','Pricing Analyst'],
} as const;

const CATEGORIES = Object.keys(ROLE_MAP) as RoleCategory[];

const CATEGORY_LABELS: Record<string, string> = {
  swe: 'Software Engineering', fullstack: 'Full Stack', aiml: 'AI / ML',
  aiintegr: 'AI Integration', devops: 'DevOps / Infrastructure',
  quant: 'Quantitative Research', quantfin: 'Quantitative Finance',
  insurance: 'Insurance & Actuarial', risk: 'Risk Management',
  consulting: 'Consulting', analyst: 'Analytics',
};

const LOCATIONS = [
  'New York, NY','San Francisco, CA','Chicago, IL','Boston, MA','Austin, TX',
  'Seattle, WA','Remote','Atlanta, GA','Denver, CO','Miami, FL',
  'Los Angeles, CA','Washington, DC','Charlotte, NC','Dallas, TX','Minneapolis, MN',
];

const JOB_TYPES = ['Full-time','Full-time','Full-time','Remote','Hybrid','Contract'] as const;

const SALARY_RANGES: Record<string, string[]> = {
  swe:       ['$110K–$145K','$140K–$185K','$170K–$220K','$200K–$260K'],
  fullstack: ['$100K–$135K','$130K–$170K','$155K–$200K'],
  aiml:      ['$145K–$190K','$175K–$230K','$200K–$270K','$220K–$300K'],
  aiintegr:  ['$135K–$175K','$160K–$210K','$185K–$240K'],
  devops:    ['$115K–$150K','$140K–$185K','$160K–$205K'],
  quant:     ['$130K–$175K','$160K–$220K','$200K–$280K','$250K–$350K'],
  quantfin:  ['$120K–$165K','$150K–$200K','$180K–$245K','$220K–$320K'],
  insurance: ['$65K–$90K','$80K–$110K','$95K–$130K'],
  risk:      ['$75K–$105K','$95K–$130K','$115K–$155K'],
  consulting:['$85K–$120K','$105K–$145K','$130K–$175K'],
  analyst:   ['$65K–$90K','$80K–$115K','$95K–$130K'],
};

const JOB_DESCRIPTIONS: Record<string, string[]> = {
  swe: [
    'Design, develop, and maintain scalable backend services and internal APIs serving millions of daily requests. You will work closely with product and infrastructure teams to ship high-quality, well-tested code.',
    'Build and maintain distributed systems that power our core platform. You will contribute to architecture decisions, code reviews, and technical roadmap planning in a collaborative engineering culture.',
  ],
  fullstack: [
    'Develop end-to-end features across our React frontend and Node.js/Python backend. You will own features from design to deployment, working in two-week sprints with a cross-functional team.',
    'Collaborate with designers and product managers to build user-facing features and internal tooling. Strong emphasis on TypeScript, REST API design, and database optimization.',
  ],
  aiml: [
    'Develop and deploy machine learning models for production inference pipelines. Work on model evaluation, feature engineering, and monitoring at scale using PyTorch and MLflow.',
    'Research and implement novel ML approaches to improve our core product recommendations. You will run experiments, analyze results, and collaborate with engineering to integrate models into production.',
  ],
  aiintegr: [
    'Lead integration of large language model capabilities into our product suite. Design LLM orchestration layers, evaluation frameworks, and responsible AI guardrails.',
    'Build agentic AI workflows using modern LLM frameworks. Partner with product and data science teams to identify use cases and bring AI-driven features from prototype to production.',
  ],
  devops: [
    'Manage and evolve our Kubernetes-based infrastructure across AWS and GCP. You will lead reliability improvements, reduce toil through automation, and own our incident response process.',
    'Build the developer platform that enables 100+ engineers to ship safely and fast. Own CI/CD pipelines, infrastructure as code (Terraform), and observability tooling.',
  ],
  quant: [
    'Develop and validate systematic trading strategies using statistical and machine learning methods. Work with large tick datasets and contribute to the full research-to-production pipeline.',
    'Conduct quantitative research to identify alpha signals across equity and derivatives markets. Collaborate with portfolio managers and engineers to implement and backtest strategies.',
  ],
  quantfin: [
    'Price and risk-manage complex derivatives positions. Develop analytical models for structured products and contribute to model validation processes aligned with regulatory requirements.',
    'Build quantitative models for fixed income products including rates, credit, and securitized assets. Work with trading desks to improve pricing accuracy and hedging effectiveness.',
  ],
  insurance: [
    'Perform actuarial analyses for property and casualty pricing, reserving, and capital modeling. Support regulatory filings and communicate findings to senior leadership.',
    'Develop and maintain pricing models for commercial lines insurance products. Collaborate with underwriters and claims teams to refine loss experience and improve profitability.',
  ],
  risk: [
    'Identify, measure, and monitor credit and market risk exposures across the trading book. Produce daily risk reports and contribute to stress testing and scenario analysis.',
    'Support enterprise risk management initiatives including risk appetite frameworks, key risk indicators, and model risk oversight across business units.',
  ],
  consulting: [
    'Deliver strategy and operations projects for Fortune 500 clients in financial services and technology. Lead client workstreams, develop frameworks, and present findings to C-suite stakeholders.',
    'Support client engagements spanning market entry, operational efficiency, and digital transformation. Synthesize complex data into clear recommendations and actionable roadmaps.',
  ],
  analyst: [
    'Build and maintain dashboards, data pipelines, and reporting infrastructure to support business decisions. Work with stakeholders to translate data into clear and actionable insights.',
    'Conduct in-depth quantitative analyses to support product and growth teams. Own end-to-end analytical projects from data collection and modeling through to executive presentation.',
  ],
};

const REQUIREMENTS: Record<string, string[]> = {
  swe:       ['3+ years of software engineering experience','Proficiency in Python, Go, or Java','Experience with distributed systems and cloud infrastructure','Strong CS fundamentals'],
  fullstack: ['2+ years of full stack development experience','Proficiency in React and TypeScript','Experience with RESTful APIs and SQL databases','Familiarity with CI/CD practices'],
  aiml:      ['2+ years of ML engineering or research experience','Proficiency in Python and PyTorch or TensorFlow','Experience with model deployment and monitoring','Strong understanding of statistics and ML theory'],
  aiintegr:  ['Experience building LLM-powered applications','Familiarity with LangChain, LlamaIndex, or similar frameworks','Strong Python skills and API integration experience','Understanding of prompt engineering and RAG patterns'],
  devops:    ['3+ years of DevOps or SRE experience','Proficiency in Kubernetes, Terraform, and CI/CD tooling','Experience with AWS, GCP, or Azure','Strong scripting skills (Bash, Python)'],
  quant:     ['MS or PhD in mathematics, statistics, physics, or computer science','Experience with backtesting frameworks and time series analysis','Proficiency in Python and SQL','Strong probability and statistical inference background'],
  quantfin:  ['Experience with derivatives pricing models (Black-Scholes, HJM, etc.)','Proficiency in Python or C++','Strong financial mathematics background','Knowledge of fixed income or equity derivatives markets'],
  insurance: ['Actuarial exam progress (CAS or SOA preferred)','Experience with pricing or reserving in P&C or Life insurance','Proficiency in R, Python, or SAS','Strong statistical modeling background'],
  risk:      ['2+ years in risk management or quantitative finance','Proficiency in Excel, Python, or R','Knowledge of Basel III/IV or Dodd-Frank regulations','Experience with VaR, stress testing, or scenario analysis'],
  consulting:['Outstanding analytical and problem-solving skills','Strong communication and slide-writing abilities','Experience in strategy, finance, or operations','MBA or top-tier undergraduate degree preferred'],
  analyst:   ['2+ years of analytical experience','Proficiency in SQL and Python or R','Experience with BI tools such as Tableau, Looker, or Power BI','Strong attention to detail and data quality mindset'],
};

// ── Generate job listings ─────────────────────────────────────────────────────

type Job = {
  id: string;
  role: string;
  company: string;
  domain: string;
  location: string;
  type: string;
  salary: string;
  category: RoleCategory;
  categoryLabel: string;
  description: string;
  requirements: string[];
  recruiter: string;
  postedDays: number;
};

function generateJobs(count: number): Job[] {
  const jobs: Job[] = [];
  for (let i = 0; i < count; i++) {
    const rng = seeded(i * 7919 + 31337);
    const category = pick(CATEGORIES, rng);
    const roles = ROLE_MAP[category] as readonly string[];
    const salaries = SALARY_RANGES[category];
    const descs = JOB_DESCRIPTIONS[category] ?? JOB_DESCRIPTIONS.analyst;
    const reqs = REQUIREMENTS[category] ?? REQUIREMENTS.analyst;
    const company = makeCompany(rng);
    jobs.push({
      id: `job-${i}`,
      role: pick([...roles], rng),
      company,
      domain: makeDomain(company),
      location: pick(LOCATIONS, rng),
      type: pick([...JOB_TYPES], rng),
      salary: pick(salaries, rng),
      category,
      categoryLabel: CATEGORY_LABELS[category],
      description: pick(descs, rng),
      requirements: reqs,
      recruiter: makeName(rng),
      postedDays: Math.floor(rng() * 30) + 1,
    });
  }
  return jobs;
}

const ALL_JOBS = generateJobs(20);

// ── Feed posts ────────────────────────────────────────────────────────────────

const FEED_POSTS = [
  { id: 1, author: 'Priya Hartwell', headline: 'ML Engineer at Neurova IO', time: '2h', text: 'Spent the last month migrating our inference stack from Flask to a gRPC-based service. Latency dropped 40% and P99 improved significantly. Incremental refactoring with feature flags made this zero-downtime.' },
  { id: 2, author: 'Marcus Thornton', headline: 'Quantitative Researcher at Stratexus Capital', time: '5h', text: 'Published a note on our internal wiki about the practical differences between LASSO and Ridge regularization in factor model construction. The L1/L2 penalty choice matters more than most practitioners realize in regime-shift environments.' },
  { id: 3, author: 'Elena Vasquez', headline: 'Senior Software Engineer at Axenic Solutions', time: '1d', text: 'We shipped a new query planner for our internal analytics engine this week. The key insight was treating selectivity estimation as a learned problem rather than relying on static histograms. Postgres paper from 1994 still holds up remarkably well.' },
  { id: 4, author: 'Darius Chen', headline: 'DevOps Engineer at Dynexus Systems', time: '2d', text: 'Reminder that observability is not the same as monitoring. Monitoring tells you something is broken. Observability lets you understand why — even for failure modes you have never seen before. Cardinality in your metrics matters.' },
];

// ── Component ─────────────────────────────────────────────────────────────────

type LinkedInTab = 'feed' | 'jobs' | 'network' | 'profile';

const APPLIED_KEY = 'li_applied_jobs';

export function LinkedInSite() {
  const { sendEmail } = useMailStore();
  const [tab, setTab] = useState<LinkedInTab>('jobs');
  const [selectedJobId, setSelectedJobId] = useState<string>(ALL_JOBS[0].id);
  const [applyState, setApplyState] = useState<Record<string, 'idle' | 'applying' | 'applied'>>({});
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const selectedJob = ALL_JOBS.find((j) => j.id === selectedJobId) ?? ALL_JOBS[0];

  const filteredJobs = useMemo(() => ALL_JOBS.filter((j) => {
    if (categoryFilter !== 'all' && j.category !== categoryFilter) return false;
    if (typeFilter !== 'all' && j.type !== typeFilter) return false;
    return true;
  }), [categoryFilter, typeFilter]);

  const applyToJob = (job: Job) => {
    setApplyState((prev) => ({ ...prev, [job.id]: 'applying' }));
    setTimeout(() => {
      setApplyState((prev) => ({ ...prev, [job.id]: 'applied' }));
      sendEmail({
        from: `${job.recruiter} — Talent Acquisition at ${job.company} <careers@${job.domain}>`,
        to: 'user@workspace.aos',
        subject: `Thank you for applying — ${job.role} at ${job.company}`,
        body: `
<p>Dear Applicant,</p>
<p>Thank you for applying for the <strong>${job.role}</strong> position at <strong>${job.company}</strong>. We appreciate your interest in joining our team.</p>
<p>Your application has been received and is currently under review by our talent team. We carefully evaluate each candidate's background, experience, and qualifications against the requirements of the role.</p>
<p>If your profile aligns with what we are looking for, a member of our recruiting team will reach out within <strong>5–10 business days</strong> to discuss next steps. In the meantime, feel free to explore more about ${job.company} and the work we do.</p>
<p>We appreciate your patience and will be in touch shortly.</p>
<br>
<p>Best regards,<br>
<strong>${job.recruiter}</strong><br>
Talent Acquisition, ${job.company}<br>
<span style="color:#666;font-size:13px">careers@${job.domain}</span></p>
        `.trim(),
        date: new Date().toISOString(),
        folder: 'inbox',
      });
    }, 900);
  };

  return (
    <div className="li-shell">
      {/* Header */}
      <header className="li-header">
        <div className="li-logo">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect width="22" height="22" rx="4" fill="#0a66c2" />
            <rect x="4" y="8" width="3" height="10" fill="white" />
            <circle cx="5.5" cy="5.5" r="2" fill="white" />
            <path d="M10 8h3v1.8c.6-1.1 2-1.8 3-1.8 2.5 0 4 1.5 4 4.5V18h-3v-5.2c0-1.4-.5-2.3-1.8-2.3-1.4 0-2.2.9-2.2 2.3V18h-3V8z" fill="white" />
          </svg>
          <span className="li-brand-name">LinkedIn</span>
        </div>
        <nav className="li-nav">
          {(['feed','jobs','network','profile'] as LinkedInTab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`li-nav-btn${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
        <div className="li-header-right">
          <span className="li-user-chip">user@workspace.aos</span>
        </div>
      </header>

      <div className="li-body">
        {/* ── Feed ── */}
        {tab === 'feed' && (
          <div className="li-feed">
            {FEED_POSTS.map((post) => (
              <div key={post.id} className="li-post">
                <div className="li-post-avatar">{post.author.charAt(0)}</div>
                <div className="li-post-content">
                  <div className="li-post-author">{post.author}</div>
                  <div className="li-post-headline">{post.headline}</div>
                  <div className="li-post-time">{post.time}</div>
                  <p className="li-post-text">{post.text}</p>
                  <div className="li-post-actions">
                    <button type="button" className="li-post-action-btn">Like</button>
                    <button type="button" className="li-post-action-btn">Comment</button>
                    <button type="button" className="li-post-action-btn">Share</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Jobs ── */}
        {tab === 'jobs' && (
          <div className="li-jobs-layout">
            {/* Filters */}
            <aside className="li-filters">
              <div className="li-filter-group">
                <label className="li-filter-label">Category</label>
                <select className="li-filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div className="li-filter-group">
                <label className="li-filter-label">Job Type</label>
                <select className="li-filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
              <div className="li-filter-count">{filteredJobs.length} results</div>
            </aside>

            {/* Job list */}
            <div className="li-job-list">
              {filteredJobs.length === 0 ? (
                <div className="li-empty">No jobs match your filters.</div>
              ) : (
                filteredJobs.map((job) => {
                  const state = applyState[job.id] ?? 'idle';
                  return (
                    <button
                      key={job.id}
                      type="button"
                      className={`li-job-card${selectedJobId === job.id ? ' active' : ''}`}
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      <div className="li-job-card-top">
                        <span className="li-job-role">{job.role}</span>
                        {state === 'applied' && <span className="li-applied-badge">Applied</span>}
                      </div>
                      <div className="li-job-company">{job.company}</div>
                      <div className="li-job-meta">
                        <span>{job.location}</span>
                        <span className="li-job-sep">·</span>
                        <span>{job.type}</span>
                      </div>
                      <div className="li-job-salary">{job.salary}</div>
                      <div className="li-job-posted">{job.postedDays}d ago</div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Job detail */}
            <div className="li-job-detail">
              {(() => {
                const job = selectedJob;
                const state = applyState[job.id] ?? 'idle';
                return (
                  <>
                    <div className="li-detail-header">
                      <div className="li-detail-role">{job.role}</div>
                      <div className="li-detail-company">{job.company}</div>
                      <div className="li-detail-meta-row">
                        <span>{job.location}</span>
                        <span className="li-job-sep">·</span>
                        <span>{job.type}</span>
                        <span className="li-job-sep">·</span>
                        <span>{job.salary}</span>
                      </div>
                      <div className="li-detail-category">{job.categoryLabel}</div>
                      <button
                        type="button"
                        className={`li-apply-btn${state === 'applying' ? ' loading' : ''}${state === 'applied' ? ' applied' : ''}`}
                        onClick={() => state === 'idle' && applyToJob(job)}
                        disabled={state !== 'idle'}
                      >
                        {state === 'idle' ? 'Apply Now' : state === 'applying' ? 'Submitting…' : 'Applied'}
                      </button>
                      {state === 'applied' && (
                        <p className="li-apply-note">A confirmation email has been sent to your Outlook inbox.</p>
                      )}
                    </div>
                    <div className="li-detail-section">
                      <div className="li-detail-section-title">About the role</div>
                      <p className="li-detail-text">{job.description}</p>
                    </div>
                    <div className="li-detail-section">
                      <div className="li-detail-section-title">Requirements</div>
                      <ul className="li-req-list">
                        {job.requirements.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                    <div className="li-detail-section">
                      <div className="li-detail-section-title">Recruiter</div>
                      <div className="li-recruiter">
                        <span className="li-recruiter-avatar">{job.recruiter.charAt(0)}</span>
                        <div>
                          <div className="li-recruiter-name">{job.recruiter}</div>
                          <div className="li-recruiter-title">Talent Acquisition, {job.company}</div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── Network ── */}
        {tab === 'network' && (
          <div className="li-network">
            <div className="li-network-title">People You May Know</div>
            <div className="li-network-grid">
              {Array.from({ length: 6 }, (_, i) => {
                const rng = seeded(i * 4211 + 9973);
                const name = makeName(rng);
                const company = makeCompany(rng);
                const cat = pick(CATEGORIES, rng);
                const role = pick([...ROLE_MAP[cat]], rng);
                return (
                  <div key={i} className="li-person-card">
                    <div className="li-person-avatar">{name.charAt(0)}</div>
                    <div className="li-person-name">{name}</div>
                    <div className="li-person-role">{role}</div>
                    <div className="li-person-company">{company}</div>
                    <button type="button" className="li-connect-btn">Connect</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Profile ── */}
        {tab === 'profile' && (
          <div className="li-profile">
            <div className="li-profile-card">
              <div className="li-profile-banner" />
              <div className="li-profile-main">
                <div className="li-profile-avatar">U</div>
                <div className="li-profile-info">
                  <div className="li-profile-name">Workspace User</div>
                  <div className="li-profile-headline">Software Professional · aOS Workspace</div>
                  <div className="li-profile-location">Remote</div>
                  <div className="li-profile-email">user@workspace.aos</div>
                </div>
              </div>
            </div>
            <div className="li-profile-section">
              <div className="li-profile-section-title">About</div>
              <p className="li-profile-about">Experienced professional working across software engineering, data, and analytical domains. Open to new opportunities in high-impact, fast-paced environments.</p>
            </div>
            <div className="li-profile-section">
              <div className="li-profile-section-title">Experience</div>
              <div className="li-exp-item">
                <div className="li-exp-role">Software Engineer</div>
                <div className="li-exp-company">aOS Workspace · Full-time</div>
                <div className="li-exp-date">Jan 2023 — Present</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
