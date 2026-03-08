import { useState, useMemo, useEffect } from 'react';
import { useMailStore, type JobMeta } from '../../../state/useMailStore';
import { useProfileStore } from '../../../state/useProfileStore';

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

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h >>> 0;
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

function getCompanyType(company: string): string {
  return company.split(' ').pop() ?? 'LLC';
}

function makeDomain(company: string): string {
  return company.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '') + '.io';
}

// ── Archetype (from company type) ─────────────────────────────────────────────

type Archetype = 'finance' | 'tech' | 'consulting' | 'startup';

function getArchetype(companyType: string): Archetype {
  if (['Capital','Partners','Advisory','Advisors'].includes(companyType)) return 'finance';
  if (['Technologies','Systems','Solutions','Analytics'].includes(companyType)) return 'tech';
  if (['Consulting'].includes(companyType)) return 'consulting';
  return 'startup'; // LLC, Group, Ventures
}

// ── Meeting link generation ───────────────────────────────────────────────────

type MeetingTool = 'zoom' | 'teams' | 'skype' | 'meet';

function assignMeetingTool(companyType: string): MeetingTool {
  if (['Capital','Partners','Advisory','Advisors'].includes(companyType)) return 'teams';
  if (['Technologies','Systems','Solutions','Analytics'].includes(companyType)) return 'zoom';
  if (['LLC','Group'].includes(companyType)) return 'skype';
  return 'meet'; // Consulting, Ventures
}

function generateMeetingLink(company: string, tool: MeetingTool): string {
  const h = strHash(company);
  if (tool === 'zoom') {
    const digits = String(h).padStart(10, '0').slice(0, 10);
    return `https://zoom.us/j/${digits}`;
  }
  if (tool === 'teams') {
    const hash = company.replace(/\s+/g, '-').toLowerCase().slice(0, 12) + h.toString(16).slice(0, 8);
    return `https://teams.microsoft.com/l/meetup-join/${hash}`;
  }
  if (tool === 'skype') {
    const code = (h % 0xffffff).toString(36).toUpperCase().padStart(8, '0');
    return `https://join.skype.com/${code}`;
  }
  // Google Meet: xxx-xxxx-xxx format
  const base = h.toString(36).padStart(11, 'a').slice(0, 11);
  return `https://meet.google.com/${base.slice(0,3)}-${base.slice(3,7)}-${base.slice(7,10)}`;
}

function meetingToolLabel(tool: MeetingTool): string {
  if (tool === 'zoom') return 'Zoom';
  if (tool === 'teams') return 'Microsoft Teams';
  if (tool === 'skype') return 'Skype';
  return 'Google Meet';
}

// ── Compensation extraction ───────────────────────────────────────────────────

function extractCompensation(salary: string): number {
  // e.g. "$110K–$145K" → average of 110000 and 145000
  const matches = salary.match(/\$(\d+)K/g) ?? [];
  if (matches.length === 0) return 120000;
  const values = matches.map((m) => parseInt(m.replace(/\$|K/g, ''), 10) * 1000);
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length / 1000) * 1000;
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

// ── Rich descriptions by (category, archetype) ────────────────────────────────

type DescPool = Record<Archetype, string[]>;

const JOB_DESCRIPTIONS: Record<string, DescPool> = {
  swe: {
    finance: [
      'Our engineering team builds the low-latency data infrastructure that powers trade execution and risk analytics across global markets. You will work in a highly regulated environment where correctness and reliability are non-negotiable. Prior experience with financial data systems or regulatory compliance tooling is strongly valued. We operate at the intersection of software engineering and quantitative finance.',
      'You will design and maintain the systems that process billions of dollars in transactions daily, with SLA requirements measured in microseconds. Our codebase spans C++, Java, and Python services running across co-located data centers. Engineers here are expected to understand both the software they write and the financial instruments it touches.',
      'Join a team responsible for the real-time position management and P&L calculation platform used by our trading desks. You will optimize critical path code, improve reliability during market hours, and contribute to the architecture of our next-generation risk engine. Attention to correctness, auditability, and performance is essential.',
    ],
    tech: [
      "We're scaling our core platform to serve 50M+ daily active users. You'll own full service delivery — from design doc to production — and contribute to our reliability and performance roadmap. We work in small, empowered teams with strong engineering leadership and minimal process overhead. Expect regular code review, oncall rotation, and a high bar for craft.",
      'Build the distributed systems that underpin our product at scale. You will work on microservices handling millions of requests per second, contribute to our internal developer tooling, and help set technical direction for your team. We value engineers who communicate clearly, ship incrementally, and care about operational health.',
      'Our backend infrastructure team owns the APIs, data pipelines, and storage systems that power every product surface. You will collaborate closely with product and data engineering teams, lead technical design reviews, and mentor junior engineers. We have a culture of technical rigor balanced with pragmatic delivery.',
    ],
    consulting: [
      'You will build custom software solutions delivered directly to enterprise clients across financial services, healthcare, and government. Engagements span 6–18 months and require strong communication skills alongside deep technical expertise. Our engineers regularly present to client stakeholders and must adapt quickly to new domains and legacy system constraints.',
      'Work on high-impact technology transformation projects where you will both architect solutions and write production code. Our engagements range from modernizing legacy banking platforms to building greenfield data products for regulated industries. You will be expected to lead technical workshops, produce solution designs, and mentor client developers.',
    ],
    startup: [
      "We move fast and own our stack end-to-end. As one of our first five engineers, you will make foundational architectural decisions that scale with our growth. We value pragmatism over perfection, but hold a high bar for what ships to customers. You'll wear multiple hats — backend, infrastructure, occasional frontend — and have a direct line to the founding team.",
      'This is a high-ownership role at a company that just closed its Series A. You will be building from near-scratch — choosing databases, defining service boundaries, establishing CI/CD practices, and shipping features that directly drive growth. Comfort with ambiguity and a bias toward action are essential.',
    ],
  },
  fullstack: {
    finance: [
      'Build the internal tools and client-facing dashboards used by analysts and portfolio managers to monitor positions, run reports, and interact with our data platform. You will work across a React frontend and Python/Node.js backend, with strong emphasis on data accuracy, audit trails, and access controls required by compliance.',
      'Develop and maintain the web interfaces that surface our risk analytics and trade blotter data to front-office users. Prior experience with financial data visualization — time series charts, P&L attribution grids — is highly valued. You will work closely with quant and trading desk stakeholders who have precise requirements and low tolerance for errors.',
    ],
    tech: [
      'Develop end-to-end features across our React frontend and Node.js/Python backend. You will own features from design to deployment, working in two-week sprints with a cross-functional team. Our stack is modern, our test coverage is strong, and we ship continuously. Expect real ownership and clear impact on user experience.',
      'Join our product engineering team and build the features our users depend on daily. You will collaborate with designers to translate high-fidelity mocks into polished, accessible React components, wire them to our GraphQL API, and optimize for performance on diverse devices. We care deeply about the quality of what we ship.',
    ],
    consulting: [
      'Collaborate with designers, product managers, and client stakeholders to build scalable web applications for enterprise customers. Engagements vary in scope — from greenfield SaaS builds to React migrations of legacy jQuery applications. Strong TypeScript and REST API design skills are required; experience with government or regulated industry clients is a plus.',
      'You will build full-stack web applications for clients undergoing digital transformation, often working within constrained environments with legacy backends. Clear communication, the ability to scope work accurately, and delivering on time are as important as technical skill here.',
    ],
    startup: [
      "Own the full product surface — from the React component library to the serverless API layer to the PostgreSQL schema. We are a lean team that moves fast, so you should be comfortable making decisions independently and asking for help when architecture trade-offs matter. You'll ship features weekly and see their impact in real user data.",
      'Build the product from early-stage to scale. You will establish our frontend architecture, define our API conventions, and implement features across the full stack. Prior experience at a startup or working closely with founders is valued. We offer significant equity and genuine technical ownership.',
    ],
  },
  aiml: {
    finance: [
      'Develop and deploy machine learning models for credit risk scoring, fraud detection, and alternative data signal generation. You will work with large proprietary financial datasets and strict data governance requirements. Model outputs directly influence lending decisions, so interpretability, stability, and regulatory defensibility are critical criteria alongside predictive performance.',
      'Build production ML systems for quantitative signal generation and factor model enhancement. You will collaborate with quant researchers to productionize research-stage models, build robust feature pipelines from raw market data, and maintain monitoring infrastructure that surfaces model degradation early.',
    ],
    tech: [
      'Research and develop machine learning models that power our core product recommendations and personalization layer. You will run experiments using our internal A/B platform, analyze results with a rigorous statistical lens, and collaborate with engineering to integrate winning models into production. We use PyTorch, Ray, and MLflow in our ML stack.',
      'Develop and deploy large-scale ML systems that operate at the intersection of real-time inference and batch model training. You will lead model design, manage dataset pipelines, write production Python, and contribute to our platform team efforts to reduce model deployment overhead across the organization.',
    ],
    consulting: [
      'Deliver applied ML engagements for clients across retail, financial services, and logistics. You will move from problem framing through EDA, model development, and deployment in cloud environments (AWS SageMaker, GCP Vertex). Strong communication skills are essential — you will present findings to non-technical executive stakeholders regularly.',
      'Work on client-facing ML projects where you are both researcher and engineer. Engagements include demand forecasting, NLP classification, and computer vision systems. You will manage client relationships, produce documentation, and build models that transition to client teams at engagement close.',
    ],
    startup: [
      'We are building the AI core of our product and you will help shape it from the ground up. You will design the model architecture, curate training data, implement evaluation pipelines, and iterate rapidly based on user feedback. There is no legacy system to work around — only the models you build.',
      'Own our ML platform from data ingestion to model serving. You will select tooling, establish MLOps practices, and build the models that differentiate our product. This role has a high degree of autonomy and direct exposure to product and business decisions.',
    ],
  },
  aiintegr: {
    finance: [
      'Lead the integration of LLM capabilities into our document processing, regulatory reporting, and client communication workflows. You will design extraction pipelines, build evaluation frameworks for financial accuracy, and work with compliance to ensure outputs meet regulatory standards. Prior experience with financial document NLP is a strong plus.',
      'Build AI-powered tools for our research analysts and portfolio managers — from earnings call summarization to news event classification to automated report generation. You will partner with front-office users to understand requirements, prototype rapidly, and harden solutions for production use in a regulated environment.',
    ],
    tech: [
      'Lead integration of large language model capabilities into our product suite. Design LLM orchestration layers, evaluation frameworks, and responsible AI guardrails. You will work with LangChain, custom retrieval infrastructure, and our internal API platform to bring AI-driven features from prototype to production at scale.',
      'Build agentic AI workflows using modern LLM frameworks. Partner with product and data science teams to identify use cases and bring AI-driven features from prototype to production. You will own prompt engineering, RAG pipeline design, and the reliability of AI-facing user experiences.',
    ],
    consulting: [
      'Deliver LLM integration projects for enterprise clients looking to automate document processing, customer service, and knowledge management. You will scope engagements, design solution architecture, build proof-of-concepts, and guide clients through deployment. Experience with Azure OpenAI, AWS Bedrock, or Google Vertex AI is valued.',
      'Help enterprise clients adopt generative AI responsibly. Engagements span use case discovery, vendor evaluation, pilot build, and production rollout. You will produce architecture documents, lead workshops, and write production code. Experience managing stakeholder expectations around AI limitations is essential.',
    ],
    startup: [
      "We are an AI-native company and every engineer contributes to how our LLM systems work. You will build the pipelines that turn user intent into model output — retrieval, reranking, prompt construction, and response evaluation. This is a hands-on role with direct product impact.",
      'Build and iterate on our core AI product features in a fast-moving startup environment. You will own LLM integrations end-to-end, from API selection and prompt design to latency optimization and output quality monitoring. We move quickly and expect engineers to make good judgment calls independently.',
    ],
  },
  devops: {
    finance: [
      'Manage and evolve the infrastructure that supports our trading systems, risk platforms, and client-facing applications across on-premise co-location and private cloud environments. You will own our deployment pipelines, secrets management, and compliance-driven access controls. Experience with high-availability financial infrastructure is strongly preferred.',
      'Own the reliability and observability of systems where downtime during market hours has direct financial impact. You will build runbooks, lead incident response, maintain DR procedures, and work with engineering teams to improve SLOs. Experience in regulated financial environments and knowledge of SOC 2 / PCI DSS controls is a plus.',
    ],
    tech: [
      'Manage and evolve our Kubernetes-based infrastructure across AWS and GCP. You will lead reliability improvements, reduce toil through automation, and own our incident response process. We measure success by SLO achievement and DORA metrics — you will have the tools and trust to improve both.',
      'Build the developer platform that enables 100+ engineers to ship safely and fast. Own CI/CD pipelines, infrastructure as code (Terraform), and observability tooling. You will partner closely with the engineering team to understand pain points and systematically eliminate toil.',
    ],
    consulting: [
      'Design and implement cloud infrastructure and DevOps practices for enterprise clients migrating to AWS, Azure, or GCP. Engagements include landing zone design, CI/CD pipeline implementation, Kubernetes cluster setup, and security hardening. Strong documentation and knowledge transfer skills are expected at engagement close.',
      'Help clients adopt modern DevOps and platform engineering practices. You will conduct infrastructure assessments, design target-state architectures, and implement solutions. Certifications in AWS or Azure are a plus. Prior experience delivering infrastructure projects to financial services or healthcare clients is valued.',
    ],
    startup: [
      'Build our cloud infrastructure from the early stages. You will set up our AWS environment, establish Kubernetes practices, implement CI/CD, and ensure we can ship reliably and securely as we grow from 5 to 50 engineers. Strong Terraform and observability skills are required.',
      'Own our entire infrastructure as the first dedicated DevOps hire. You will make architectural decisions, automate deployments, and build the operational foundation that the rest of the engineering team depends on. Expect broad scope, high impact, and direct collaboration with the CTO.',
    ],
  },
  quant: {
    finance: [
      'Develop and validate systematic trading strategies across equity, futures, and options markets. You will work with tick-level data, build backtesting frameworks, and collaborate with portfolio managers to implement and monitor live strategies. A strong background in statistics, time series analysis, and financial markets is required.',
      'Conduct quantitative research to identify alpha signals and improve our existing factor models. You will analyze large datasets, run rigorous statistical tests, and present findings in research notes reviewed by senior PMs. We value intellectual curiosity, skepticism about data-snooping, and a strong probabilistic intuition.',
    ],
    tech: [
      'Build the quantitative models that power our pricing and risk systems. You will work closely with engineering to productionize research-stage models and ensure they remain accurate, well-monitored, and robust to market regime changes. Experience combining strong mathematical foundations with solid software engineering practice is essential.',
      'Apply quantitative methods to product and business problems — from forecasting demand to optimizing pricing algorithms to building recommendation scores. You will work across large structured datasets, design experiments, and communicate findings to non-technical stakeholders.',
    ],
    consulting: [
      'Deliver quantitative modeling engagements for financial services clients including hedge funds, asset managers, and banks. Projects span factor model development, risk system design, and regulatory stress testing. Strong Python, statistical modeling, and client communication skills are required.',
      'Support quantitative research projects across risk management, portfolio optimization, and derivatives pricing for buy-side and sell-side clients. You will produce high-quality research documents and present findings to technically sophisticated client audiences.',
    ],
    startup: [
      'Build quantitative models from scratch in a data-driven company. You will own the full lifecycle — data sourcing, feature engineering, model development, backtesting, and production integration. The scope is broad and you will have real influence over research direction.',
      'Apply quantitative techniques to novel problem domains outside traditional finance. You will define the modeling approach, build prototypes, evaluate results, and productionize models that directly drive business outcomes. Prior experience in a non-traditional quant role is welcomed.',
    ],
  },
  quantfin: {
    finance: [
      'Price and risk-manage complex derivatives positions across rates, credit, and equity. Develop analytical models for structured products and contribute to model validation processes aligned with FRTB and other regulatory frameworks. You will work directly with trading desks and collaborate with model risk management on validation.',
      'Build quantitative models for fixed income products including government bonds, credit, ABS, and interest rate derivatives. Work with trading desks to improve pricing accuracy, hedging effectiveness, and risk attribution. Strong knowledge of term structure models (Hull-White, HJM, LMM) is required.',
    ],
    tech: [
      'Develop and maintain the pricing engines and risk libraries used across our financial products platform. You will implement derivatives pricing models in C++ and Python, optimize for speed and accuracy, and ensure correctness through rigorous model testing. Experience with financial mathematics is required; trading desk experience is a plus.',
      'Build quantitative finance tooling used by our internal trading and risk teams. You will implement pricing models, develop scenario analysis tools, and work with data engineers to ensure the accuracy of our market data pipelines. A hybrid of quant depth and engineering rigor is needed.',
    ],
    consulting: [
      'Deliver quantitative finance engagements including model validation, pricing system assessment, and regulatory capital analysis for tier-1 banks and asset managers. You will review model documentation, replicate model results independently, and produce comprehensive validation reports reviewed by senior quants and regulators.',
      'Support model risk management and quantitative finance consulting engagements. Projects span pricing model validation, CCAR/DFAST stress testing, and IFRS 9 impairment model review. Strong financial mathematics background and experience in regulated environments are required.',
    ],
    startup: [
      'Apply quantitative finance techniques to novel fintech or proptech problems. You will build pricing models, risk metrics, and portfolio analytics that underpin our product. Prior experience in a structured products or derivatives role is valued but appetite to apply those skills to a new domain matters more.',
      'Build the quantitative backbone of our financial product. You will design the pricing and risk framework from first principles, select appropriate models, and implement them with production-quality code. High ownership, broad scope, significant equity.',
    ],
  },
  insurance: {
    finance: [
      'Perform actuarial analyses for property and casualty pricing, reserving, and capital modeling. Support regulatory filings, rate change analyses, and communicate findings to senior leadership and regulators. Progress toward CAS Fellowship is expected; exam study support and paid exam time are provided.',
      'Develop and maintain pricing models for commercial lines insurance products. Collaborate with underwriters and claims teams to analyze loss experience, refine rating factors, and improve profitability. Proficiency in R or Python for actuarial workflows is required.',
    ],
    tech: [
      'Build the data and analytics infrastructure that powers our insurance pricing and risk assessment platform. You will work with actuarial teams to productionize pricing models, build monitoring dashboards, and improve the speed and accuracy of our rating engine. Insurance domain knowledge is a plus but not required.',
      'Apply data science and machine learning to insurance risk and claims prediction. You will develop models for loss frequency, severity, and fraud detection, working closely with actuaries to integrate statistical insights into the pricing workflow.',
    ],
    consulting: [
      'Deliver actuarial and insurance consulting engagements for P&C and life insurance clients. Projects span pricing reviews, reserve adequacy analysis, and reinsurance structure optimization. Exam progress and prior insurance industry experience are required.',
      'Support insurance transformation projects spanning pricing modernization, claims optimization, and regulatory compliance. You will combine actuarial knowledge with data science skills to deliver quantitative insights and implementation recommendations.',
    ],
    startup: [
      'Help build the actuarial and risk framework for an insurtech startup from the ground up. You will design pricing methodologies, establish reserve processes, and work directly with the CEO and underwriting team. CAS exam progress preferred; startup appetite required.',
      'Apply actuarial and data science skills to reinvent how insurance risk is priced. You will own our modeling process, from data exploration through model deployment, and help establish the regulatory and compliance framework as we scale.',
    ],
  },
  risk: {
    finance: [
      'Identify, measure, and monitor credit and market risk exposures across the trading book. Produce daily risk reports for senior management, contribute to stress testing and scenario analysis, and support regulatory reporting under Basel III/IV frameworks. Experience with VaR, sensitivities, and Greeks is expected.',
      'Support enterprise risk management initiatives including risk appetite framework development, key risk indicator reporting, and operational risk oversight across business units. You will work closely with front-office, finance, and compliance stakeholders and produce materials for board-level risk committees.',
    ],
    tech: [
      'Build and maintain risk analytics tooling for our financial platform. You will develop APIs that surface credit exposure, market risk metrics, and limit utilization to internal stakeholders. Experience with risk concepts (VaR, CVaR, credit exposure) combined with strong engineering skills is required.',
      'Apply data science to credit risk and fraud detection problems. You will build scoring models, design monitoring systems, and work with product and compliance teams to balance risk controls with user experience. Prior experience at a fintech or bank is valued.',
    ],
    consulting: [
      'Deliver risk management consulting engagements for banks, insurers, and asset managers. Projects span model validation, stress testing, and regulatory transformation (BCBS 239, ICAAP, ORSA). Strong quantitative skills and prior work in a regulated financial institution are required.',
      'Support credit risk, market risk, and operational risk projects for financial services clients. You will contribute to model development, validation, and documentation and interface directly with client risk management teams and regulators.',
    ],
    startup: [
      'Build the risk framework for a fintech company from scratch. You will design credit policies, monitor portfolio performance, and build the internal tools that give leadership real-time visibility into risk exposure. High autonomy, direct impact, significant equity.',
      'Apply risk management expertise to a new problem domain in a fast-moving company. You will establish risk measurement methodologies, produce regular risk reports, and advise the product team on risk-aware feature design.',
    ],
  },
  consulting: {
    finance: [
      'Deliver strategy and operations projects for financial services clients including tier-1 banks, asset managers, and insurance companies. You will lead workstreams, develop quantitative frameworks, and present findings to C-suite stakeholders. Prior financial services experience or an MBA from a top program is strongly preferred.',
      'Support M&A due diligence, post-merger integration, and strategic planning engagements for private equity-backed financial services companies. You will build financial models, synthesize market research, and produce board-ready deliverables under tight timelines.',
    ],
    tech: [
      'Work on technology strategy and digital transformation projects for large enterprise clients. Engagements span product strategy, technology vendor selection, and go-to-market planning for software and platform companies. Strong analytical skills and comfort with technology business models are required.',
      'Deliver technology consulting engagements for clients modernizing their software platforms, cloud infrastructure, or data capabilities. You will combine business strategy expertise with technology depth to produce actionable recommendations and implementation roadmaps.',
    ],
    consulting: [
      'Deliver strategy and operations projects for Fortune 500 clients in financial services and technology. Lead client workstreams, develop frameworks, and present findings to C-suite stakeholders. Strong structured problem-solving, communication, and slide-writing skills are required.',
      'Support client engagements spanning market entry, operational efficiency, and digital transformation. Synthesize complex data into clear recommendations and actionable roadmaps. Work in small, high-performing teams with senior exposure from day one.',
    ],
    startup: [
      'Build and sell boutique consulting services to mid-market companies. You will develop new client relationships, define engagement scope, deliver project work, and manage client expectations. Entrepreneurial drive and comfort with ambiguity are as important as consulting craft.',
      'Join a rapidly growing advisory firm and help build out our practice. You will contribute to client delivery, business development, and thought leadership. Prior consulting experience is required; an entrepreneurial orientation toward growing the firm is essential.',
    ],
  },
  analyst: {
    finance: [
      'Build and maintain quantitative models and dashboards that support investment decision-making across our portfolio management team. You will work with large financial datasets, ensure data integrity, and produce recurring and ad hoc analyses requested by senior analysts and PMs.',
      'Support our research and analytics team with financial modeling, sector analysis, and competitive benchmarking. You will build detailed financial models in Excel and Python, interpret earnings data, and contribute to investment memoranda and client presentations.',
    ],
    tech: [
      'Build and maintain dashboards, data pipelines, and reporting infrastructure to support business decisions across product, growth, and operations. Work with stakeholders to translate data into clear and actionable insights. Strong SQL, Python, and Tableau or Looker skills are required.',
      'Conduct in-depth quantitative analyses to support product and growth teams. Own end-to-end analytical projects from data collection and modeling through to executive presentation. You will define metrics, run experiments, and help the organization make better decisions with data.',
    ],
    consulting: [
      'Produce data-driven analyses and insights for client engagements across a range of industries. You will collect and structure data, build analytical models, and synthesize findings into clear client-facing documents. Strong Excel and PowerPoint skills are required; Python or R is a plus.',
      'Support management consulting engagements through rigorous quantitative and qualitative research. You will contribute to market sizing, benchmarking, and performance improvement analyses. Strong academic background and structured thinking are required.',
    ],
    startup: [
      'Be the first analytics hire at a fast-growing startup. You will build the data infrastructure, define our key metrics, create dashboards, and answer the questions that drive business decisions. Comfort with ambiguity and a bias toward action are required.',
      'Own analytics end-to-end in a lean, data-driven company. You will write SQL, build models, design experiments, and present insights directly to the founding team. Prior startup experience or demonstrated ability to work autonomously is strongly preferred.',
    ],
  },
};

// ── Requirements by (category, archetype) ─────────────────────────────────────

const JOB_REQUIREMENTS: Record<string, Partial<Record<Archetype, string[][]>>> = {
  swe: {
    finance: [
      ['3+ years of software engineering experience in a financial or trading environment','Proficiency in Java, C++, or Python','Familiarity with FIX protocol, market data feeds, or order management systems','Strong understanding of distributed systems and low-latency design','Regulatory experience (SOX, MiFID II) is a plus'],
      ['5+ years of backend engineering experience','Experience building high-availability, low-latency systems','Proficiency in Java or C++','Understanding of financial products and trading workflows','Knowledge of compliance and auditability requirements in regulated systems'],
    ],
    tech: [
      ['3+ years of software engineering experience','Proficiency in Python, Go, or Java','Experience with distributed systems and cloud infrastructure (AWS or GCP)','Strong CS fundamentals and system design skills','Experience with microservices and API design'],
      ['4+ years of backend engineering experience','Proficiency in Go, Rust, or Java','Experience with large-scale data pipelines and event-driven architectures','Strong oncall and incident response experience','Track record of improving system reliability'],
    ],
    consulting: [
      ['3+ years of software engineering experience','Experience building and delivering software for external clients','Strong communication and documentation skills','Proficiency in Python, Java, or C#','Experience with enterprise integration patterns and legacy system modernization'],
      ['5+ years of software engineering experience','Demonstrated ability to lead technical delivery on client engagements','Proficiency in cloud-based architectures (AWS, Azure, GCP)','Experience with regulated industries (finance, healthcare, government) is preferred'],
    ],
    startup: [
      ['2+ years of software engineering experience','Proficiency in Python, Go, or TypeScript','Comfort with ambiguity and a bias toward shipping','Experience making architectural decisions with limited guidance','Generalist engineering mindset — backend, infrastructure, occasional frontend'],
      ['3+ years of backend engineering experience','Experience building from scratch, not just maintaining existing systems','Strong ownership mentality','Proficiency in at least two backend languages','Experience at an early-stage startup is a strong plus'],
    ],
  },
};

// Fallback requirements for categories without archetype-specific pools
const FALLBACK_REQUIREMENTS: Record<string, string[]> = {
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

function pickDescription(category: string, archetype: Archetype, rng: () => number): string {
  const pool = JOB_DESCRIPTIONS[category]?.[archetype] ?? JOB_DESCRIPTIONS[category]?.['tech'] ?? JOB_DESCRIPTIONS['analyst']?.['tech'] ?? [];
  if (pool.length === 0) return 'Work on challenging problems in a collaborative and high-performing team environment.';
  return pick(pool, rng);
}

function pickRequirements(category: string, archetype: Archetype, rng: () => number): string[] {
  const archetypePool = JOB_REQUIREMENTS[category]?.[archetype];
  if (archetypePool && archetypePool.length > 0) {
    return pick(archetypePool, rng);
  }
  return FALLBACK_REQUIREMENTS[category] ?? FALLBACK_REQUIREMENTS['analyst'];
}

// ── Generate job listings ─────────────────────────────────────────────────────

type Job = {
  id: string;
  role: string;
  company: string;
  companyType: string;
  archetype: Archetype;
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
  meetingTool: MeetingTool;
  meetingLink: string;
  compensation: number;
};

function generateJobs(count: number): Job[] {
  const jobs: Job[] = [];
  for (let i = 0; i < count; i++) {
    const rng = seeded(i * 7919 + 31337);
    const category = pick(CATEGORIES, rng);
    const roles = ROLE_MAP[category] as readonly string[];
    const salaries = SALARY_RANGES[category];
    const company = makeCompany(rng);
    const companyType = getCompanyType(company);
    const archetype = getArchetype(companyType);
    const salary = pick(salaries, rng);
    const meetingTool = assignMeetingTool(companyType);
    jobs.push({
      id: `job-${i}`,
      role: pick([...roles], rng),
      company,
      companyType,
      archetype,
      domain: makeDomain(company),
      location: pick(LOCATIONS, rng),
      type: pick([...JOB_TYPES], rng),
      salary,
      category,
      categoryLabel: CATEGORY_LABELS[category],
      description: pickDescription(category, archetype, rng),
      requirements: pickRequirements(category, archetype, rng),
      recruiter: makeName(rng),
      postedDays: Math.floor(rng() * 30) + 1,
      meetingTool,
      meetingLink: generateMeetingLink(company, meetingTool),
      compensation: extractCompensation(salary),
    });
  }
  return jobs;
}

const ALL_JOBS = generateJobs(20);

// ── Manager name generation ───────────────────────────────────────────────────

function generateManagerName(jobId: string): string {
  const rng = seeded(strHash(jobId + 'mgr'));
  return makeName(rng);
}

// ── Feed posts ────────────────────────────────────────────────────────────────

const FEED_POSTS = [
  { id: 1, author: 'Priya Hartwell', headline: 'ML Engineer at Neurova IO', time: '2h', text: 'Spent the last month migrating our inference stack from Flask to a gRPC-based service. Latency dropped 40% and P99 improved significantly. Incremental refactoring with feature flags made this zero-downtime.' },
  { id: 2, author: 'Marcus Thornton', headline: 'Quantitative Researcher at Stratexus Capital', time: '5h', text: 'Published a note on our internal wiki about the practical differences between LASSO and Ridge regularization in factor model construction. The L1/L2 penalty choice matters more than most practitioners realize in regime-shift environments.' },
  { id: 3, author: 'Elena Vasquez', headline: 'Senior Software Engineer at Axenic Solutions', time: '1d', text: 'We shipped a new query planner for our internal analytics engine this week. The key insight was treating selectivity estimation as a learned problem rather than relying on static histograms. Postgres paper from 1994 still holds up remarkably well.' },
  { id: 4, author: 'Darius Chen', headline: 'DevOps Engineer at Dynexus Systems', time: '2d', text: 'Reminder that observability is not the same as monitoring. Monitoring tells you something is broken. Observability lets you understand why — even for failure modes you have never seen before. Cardinality in your metrics matters.' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPosted(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

// ── Company about blurbs ──────────────────────────────────────────────────────

const COMPANY_ABOUT: Record<Archetype, string[]> = {
  finance: [
    'A leading financial services firm with a track record of delivering exceptional returns for institutional and individual clients. We operate across asset management, investment banking, and risk advisory with offices in major financial centers worldwide.',
    'Founded on a commitment to disciplined investment and rigorous risk management, we serve pension funds, sovereign wealth funds, and family offices. Our culture values intellectual honesty, quantitative precision, and long-term thinking.',
  ],
  tech: [
    'A high-growth technology company building the infrastructure layer for the next generation of digital experiences. We are backed by top-tier venture capital and serve millions of users across 40+ countries.',
    'We develop cloud-native software solutions that help enterprise teams collaborate, ship faster, and scale securely. Our engineering culture prioritizes technical excellence, autonomy, and continuous learning.',
  ],
  consulting: [
    'A global management consulting firm advising Fortune 500 companies, governments, and nonprofits on their most critical strategic challenges. We combine deep industry expertise with rigorous analytical frameworks.',
    'Our advisory practice brings together specialists from finance, technology, and operations to deliver transformative outcomes for clients navigating complexity, regulation, and rapid market change.',
  ],
  startup: [
    'A venture-backed startup disrupting an established industry through technology and data-driven innovation. We move fast, take calculated risks, and give our team the autonomy to solve hard problems in novel ways.',
    'Early-stage company with a strong founding team, early customer traction, and a clear path to market leadership. We offer competitive equity, a lean team, and the rare opportunity to build something from scratch.',
  ],
};

function getCompanyAbout(archetype: Archetype, jobId: string): string {
  const pool = COMPANY_ABOUT[archetype];
  const rng = seeded(strHash(jobId + 'about'));
  return pick(pool, rng);
}

// ── Component ─────────────────────────────────────────────────────────────────

const JOBS_PER_PAGE = 8;

type LinkedInTab = 'feed' | 'jobs' | 'network' | 'profile';

export function LinkedInSite() {
  const { sendEmail } = useMailStore();
  const { acceptedJob, firstName, lastName } = useProfileStore();
  const [tab, setTab] = useState<LinkedInTab>('jobs');
  const [selectedJobId, setSelectedJobId] = useState<string>(ALL_JOBS[0].id);
  const [applyState, setApplyState] = useState<Record<string, 'idle' | 'applying' | 'applied'>>(() => {
    try { return JSON.parse(localStorage.getItem('li_apply_state') ?? '{}'); }
    catch { return {}; }
  });
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [connectState, setConnectState] = useState<Record<number, 'idle' | 'pending' | 'connected'>>({});
  const [messageTarget, setMessageTarget] = useState<number | null>(null);
  const [messageText, setMessageText] = useState<string>('');
  const [sentMessages, setSentMessages] = useState<Record<number, string[]>>({});

  useEffect(() => {
    localStorage.setItem('li_apply_state', JSON.stringify(applyState));
  }, [applyState]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [categoryFilter, typeFilter, searchQuery]);

  const selectedJob = ALL_JOBS.find((j) => j.id === selectedJobId) ?? ALL_JOBS[0];

  const filteredJobs = useMemo(() => ALL_JOBS.filter((j) => {
    if (categoryFilter !== 'all' && j.category !== categoryFilter) return false;
    if (typeFilter !== 'all' && j.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return j.role.toLowerCase().includes(q) ||
             j.company.toLowerCase().includes(q) ||
             j.category.toLowerCase().includes(q) ||
             j.categoryLabel.toLowerCase().includes(q) ||
             j.location.toLowerCase().includes(q);
    }
    return true;
  }), [categoryFilter, typeFilter, searchQuery]);

  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE);
  const pagedJobs = filteredJobs.slice(page * JOBS_PER_PAGE, (page + 1) * JOBS_PER_PAGE);

  const applyToJob = (job: Job) => {
    setApplyState((prev) => ({ ...prev, [job.id]: 'applying' }));
    setTimeout(() => {
      setApplyState((prev) => ({ ...prev, [job.id]: 'applied' }));
      const managerName = generateManagerName(job.id);
      const jobMeta: JobMeta = {
        jobId: job.id,
        company: job.company,
        role: job.role,
        domain: job.domain,
        recruiter: job.recruiter,
        salary: job.salary,
        category: job.category,
        stage: 'confirmation',
        meetingTool: job.meetingTool,
        meetingLink: job.meetingLink,
        managerName,
        compensation: job.compensation,
        location: job.location,
      };
      sendEmail({
        from: `${job.recruiter} — Talent Acquisition at ${job.company} <careers@${job.domain}>`,
        to: 'user@workspace.aos',
        subject: `Thank you for applying — ${job.role} at ${job.company}`,
        body: `
<p>Dear Applicant,</p>
<p>Thank you for applying for the <strong>${job.role}</strong> position at <strong>${job.company}</strong>. We appreciate your interest in joining our team.</p>
<p>Your application has been received and is currently under review by our talent acquisition team. We carefully evaluate each candidate's background, experience, and qualifications against the requirements of the role.</p>
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
        jobMeta,
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
        <input
          className="li-search"
          placeholder="Search jobs, companies, roles…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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
              <div className="li-job-scroll">
                {pagedJobs.length === 0 ? (
                  <div className="li-empty">No jobs match your filters.</div>
                ) : (
                  pagedJobs.map((job) => {
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
                        <div className="li-job-posted">{formatPosted(job.postedDays)}</div>
                      </button>
                    );
                  })
                )}
              </div>
              {totalPages > 1 && (
                <div className="li-pagination">
                  <button type="button" className="li-page-btn" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>‹ Prev</button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} type="button" className={`li-page-btn li-page-num${page === i ? ' active' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
                  ))}
                  <button type="button" className="li-page-btn" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>Next ›</button>
                </div>
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
                      <div className="li-detail-category">{job.categoryLabel} · {job.companyType}</div>
                      <div className="li-detail-posted">{formatPosted(job.postedDays)}</div>
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
                      <div className="li-detail-section-title">About {job.company}</div>
                      <p className="li-detail-text">{getCompanyAbout(job.archetype, job.id)}</p>
                      <div className="li-company-meta">
                        <span className="li-company-tag">{job.categoryLabel}</span>
                        <span className="li-company-tag">{job.companyType}</span>
                        <span className="li-company-tag">{job.domain}</span>
                      </div>
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
            <div className="li-network-header">
              <div className="li-network-title">People You May Know</div>
              <div className="li-network-stats">
                <span className="li-network-stat">{Object.values(connectState).filter(s => s === 'connected').length} connections</span>
                <span className="li-network-stat">{Object.values(connectState).filter(s => s === 'pending').length} pending</span>
              </div>
            </div>
            <div className="li-network-grid">
              {Array.from({ length: 9 }, (_, i) => {
                const rng = seeded(i * 4211 + 9973);
                const name = makeName(rng);
                const company = makeCompany(rng);
                const cat = pick(CATEGORIES, rng);
                const role = pick([...ROLE_MAP[cat]], rng);
                const cs = connectState[i] ?? 'idle';
                const mutuals = Math.floor(seeded(i * 11 + 7)() * 12) + 1;
                return (
                  <div key={i} className="li-person-card">
                    <div className="li-person-avatar" style={{background: `hsl(${(i * 47 + 200) % 360}deg 55% 38%)`}}>{name.charAt(0)}</div>
                    <div className="li-person-name">{name}</div>
                    <div className="li-person-role">{role}</div>
                    <div className="li-person-company">{company}</div>
                    <div className="li-person-mutual">{mutuals} mutual connection{mutuals !== 1 ? 's' : ''}</div>
                    <div className="li-person-actions">
                      {cs === 'idle' && (
                        <button type="button" className="li-connect-btn" onClick={() => setConnectState((p) => ({ ...p, [i]: 'pending' }))}>Connect</button>
                      )}
                      {cs === 'pending' && (
                        <button type="button" className="li-connect-btn li-connect-pending" onClick={() => setConnectState((p) => ({ ...p, [i]: 'idle' }))}>Pending ✓</button>
                      )}
                      {cs === 'connected' && (
                        <button type="button" className="li-connect-btn li-connect-done" onClick={() => setMessageTarget(i)}>Message</button>
                      )}
                      {cs !== 'connected' && cs !== 'idle' && (
                        <button type="button" className="li-follow-btn" onClick={() => setConnectState((p) => ({ ...p, [i]: 'connected' }))}>Accept</button>
                      )}
                      {cs === 'idle' && (
                        <button type="button" className="li-follow-btn" onClick={() => setConnectState((p) => ({ ...p, [i]: 'pending' }))}>Follow</button>
                      )}
                    </div>
                    {messageTarget === i && (
                      <div className="li-message-box">
                        <textarea
                          className="li-message-input"
                          placeholder={`Message ${name.split(' ')[0]}…`}
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          rows={3}
                        />
                        <div className="li-message-actions">
                          <button type="button" className="li-msg-send-btn" onClick={() => {
                            if (messageText.trim()) {
                              setSentMessages((p) => ({ ...p, [i]: [...(p[i] ?? []), messageText.trim()] }));
                              setMessageText('');
                              setMessageTarget(null);
                            }
                          }}>Send</button>
                          <button type="button" className="li-msg-cancel-btn" onClick={() => setMessageTarget(null)}>Cancel</button>
                        </div>
                      </div>
                    )}
                    {(sentMessages[i] ?? []).length > 0 && (
                      <div className="li-sent-badge">✓ Message sent</div>
                    )}
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
                <div className="li-profile-avatar">{firstName ? firstName.charAt(0).toUpperCase() : 'U'}</div>
                <div className="li-profile-info">
                  <div className="li-profile-name">{firstName && lastName ? `${firstName} ${lastName}` : 'Workspace User'}</div>
                  <div className="li-profile-headline">
                    {acceptedJob ? `${acceptedJob.role} · ${acceptedJob.company}` : 'Software Professional · aOS Workspace'}
                  </div>
                  <div className="li-profile-location">{acceptedJob?.location ?? 'Remote'}</div>
                  <div className="li-profile-email">{acceptedJob ? `${(firstName || 'user').toLowerCase()}.${(lastName || '').toLowerCase()}@${acceptedJob.domain}` : 'user@workspace.aos'}</div>
                </div>
              </div>
              <div className="li-profile-connections">
                <span className="li-profile-conn-count">{Object.values(connectState).filter(s => s === 'connected').length}</span>
                <span className="li-profile-conn-label"> connections</span>
              </div>
            </div>
            <div className="li-profile-section">
              <div className="li-profile-section-title">About</div>
              <p className="li-profile-about">Experienced professional working across software engineering, data, and analytical domains.{acceptedJob ? ` Currently ${acceptedJob.role} at ${acceptedJob.company}.` : ' Open to new opportunities in high-impact, fast-paced environments.'}</p>
            </div>
            <div className="li-profile-section">
              <div className="li-profile-section-title">Experience</div>
              {acceptedJob ? (
                <div className="li-exp-item li-exp-current">
                  <div className="li-exp-role">{acceptedJob.role}</div>
                  <div className="li-exp-company">{acceptedJob.company} · Full-time</div>
                  <div className="li-exp-location">{acceptedJob.location}</div>
                  <div className="li-exp-date">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} — Present</div>
                  <div className="li-exp-salary">{acceptedJob.salary}</div>
                </div>
              ) : (
                <div className="li-exp-item">
                  <div className="li-exp-role">Software Engineer</div>
                  <div className="li-exp-company">aOS Workspace · Full-time</div>
                  <div className="li-exp-date">Jan 2023 — Present</div>
                </div>
              )}
            </div>
            {acceptedJob && (
              <div className="li-profile-section">
                <div className="li-profile-section-title">Skills</div>
                <div className="li-skills-list">
                  {['Problem Solving','Communication','Collaboration','Leadership','Adaptability'].map((s) => (
                    <span key={s} className="li-skill-tag">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Exported helpers for ATS pipeline ────────────────────────────────────────

export { meetingToolLabel };
