import { useState, useMemo, useEffect } from 'react';
import { useMailStore, type JobMeta } from '../../../state/useMailStore';
import { useProfileStore } from '../../../state/useProfileStore';
import { CompanyLogo, getCompanyBanner, getBrandColor } from '../../../data/brands';
import { buildPerson, buildProfileExtras, personPhoto, type Person } from '../../../data/people';
import './linkedin.css';

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

const COMPANY_POOL = [
  '3M Company','AbbVie Inc.','Activision Publishing, Inc.','Adobe Inc.','AECOM','Airbnb, Inc.','Alcoa Corp.','Amgen Inc.','Applied Materials, Inc.','Arrow Electronics, Inc.','Assurant, Inc.','AT&T, Services Inc.','Bank of America, N.A.','Becton, Dickinson and Company','Biogen MA Inc.','BlackRock, Inc.','Booz Allen Hamilton, Inc.','BorgWarner Inc.','Bristol-Myers Squibb Company','Cardinal Health, Inc.','CarMax Enterprise Services, LLC','Caterpillar Inc.','Charles Schwab & Co., Inc.','Chevron U.S.A. Inc.','Citibank, N.A.','Cognizant Worldwide Limited','Comcast Cable Communications Management, LLC','ConocoPhillips Company','DaVita Inc.','Dell USA L.P.','Disney Worldwide Services, Inc.','DXC Technology Services LLC','eBay Inc.','Equinix, Inc.','ExxonMobil Global Services Company','Federal National Mortgage Association','FedEx Corporate Services, Inc.','Fiserv Solutions, LLC','General Electric Company','Hewlett Packard Enterprise Company','Home Depot Store Support, Inc.','HP Inc.','Humana, Inc.','International Business Machines Corporation','Intuit Inc.','IQVIA Inc.','JP Morgan','Jabil, Inc.','KeyBank N.A.','Leidos, Inc.','LPL Financial LLC','M&T Bank','Marathon Petroleum Company LP','Marsh & McLennan Companies, Inc.','META','Google','Anthropic','OpenAI','Morgan Stanley','Netflix','NVIDIA','Apple','SAMSUNG','BMW Group','Mercedes-Benz Group','Ford Motor Company','General Motors','Tesla, Inc.','Amazon','Amazon Web Services (AWS)','McKinsey & Company','Bain & Company','Boston Consulting Group (BCG)','Microsoft','Deloitte','Target','Walmart','Costco Wholesale','Best Buy','Kroger','CVS Health','Walgreens','Lowe\'s','Starbucks',
];

function makeCompany(rng: () => number): string {
  return pick(COMPANY_POOL, rng);
}

function getCompanyType(company: string): string {
  const c = company.toLowerCase();
  if (/bank|capital|financial|morgan|blackrock|schwab|citibank/.test(c)) return 'Capital';
  if (/consult|booz allen|aec|mckinsey|bain|boston consulting|deloitte/.test(c)) return 'Consulting';
  if (/inc|technology|google|meta|openai|anthropic|nvidia|apple|samsung|ibm|adobe|amazon|microsoft/.test(c)) return 'Technologies';
  return 'Group';
}

function makeDomain(company: string): string {
  const base = company.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').slice(0,2).join('');
  return `${base}.com`;
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
  const matches = salary.match(/\$(\d+)K/g) ?? [];
  if (matches.length === 0) return 120000;
  const values = matches.map((m) => parseInt(m.replace(/\$|K/g, ''), 10) * 1000);
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length / 1000) * 1000;
}

// ── Role algorithm ────────────────────────────────────────────────────────────

type RoleCategory = keyof typeof ROLE_MAP;

const ROLE_MAP = {
  swe:       ['Software Engineer','Senior Software Engineer','Staff Engineer','Principal Engineer','Backend Engineer','Systems Engineer','API Engineer','Distributed Systems Engineer'],
  fullstack: ['Full Stack Developer','Full Stack Engineer','Senior Full Stack Engineer','Software Development Engineer'],
  aiml:      ['ML Engineer','Applied ML Scientist','AI Research Engineer','ML Platform Engineer','Senior ML Engineer','Research Scientist'],
  aiintegr:  ['AI Integration Engineer','LLM Systems Engineer','AI Solutions Architect','Generative AI Engineer','AI Product Engineer'],
  devops:    ['DevOps Engineer','Site Reliability Engineer','Platform Engineer','Infrastructure Engineer','Cloud Engineer','MLOps Engineer'],
  quant:     ['Quantitative Analyst','Quantitative Developer','Algorithmic Trading Engineer','Quant Researcher','Quant Strategist','Systematic Trader'],
  quantfin:  ['Quantitative Finance Analyst','Fixed Income Analyst','Derivatives Pricing Analyst','Structured Products Analyst','Rates Analyst','Equity Quant Analyst'],
  insurance: ['Actuarial Analyst','Insurance Risk Analyst','Underwriting Analyst','Claims Analyst','Reinsurance Analyst','Property Risk Analyst'],
  risk:      ['Risk Analyst','Credit Risk Analyst','Market Risk Analyst','Enterprise Risk Manager','Operational Risk Analyst','Model Risk Analyst'],
  consulting:['Strategy Consultant','Management Consultant','Technology Consultant','Business Analyst','Associate Consultant','Senior Analyst','Salesforce Consultant','SFMC Engineer'],
  analyst:   ['Data Analyst','Financial Analyst','Senior Financial Analyst','FP&A Analyst','Treasury Analyst','Accounting Analyst','Business Intelligence Analyst','Research Analyst','Pricing Analyst','Revenue Analyst'],
  financebiz:['Accounting Analyst','Staff Accountant','Senior Accountant','Accounting Manager','Financial Analyst','Senior Financial Analyst','FP&A Analyst','FP&A Manager','Finance Manager','Corporate Finance Analyst','Treasury Analyst','Treasury Manager','Cash Management Analyst','Risk Analyst','Enterprise Risk Analyst','Credit Risk Analyst','Market Risk Analyst','Operational Risk Analyst','Compliance Analyst','Internal Audit Analyst','Auditor','Fraud Analyst','Fraud Operations Analyst','Fraud Risk Analyst','AML Analyst','KYC Analyst','Underwriting Analyst','Pricing Analyst','Revenue Analyst','Billing Analyst','Payroll Analyst','Compensation Analyst','Benefits Analyst','Procurement Analyst','Cost Analyst','Budget Analyst','Investor Relations Analyst','Business Analyst','Strategy Analyst','Operations Analyst','Business Operations Analyst','Sales Operations Analyst','Go-To-Market Analyst','GTM Analyst','Revenue Operations Analyst','Deal Desk Analyst','Commercial Analyst','Data Analyst (Finance)','Reporting Analyst','Product Analyst','Trust & Safety Analyst','Controls Analyst','SOX Analyst','Model Risk Analyst','BI Analyst'],
} as const;

const CATEGORIES = Object.keys(ROLE_MAP) as RoleCategory[];

const CATEGORY_LABELS: Record<string, string> = {
  swe: 'Software Engineering', fullstack: 'Full Stack', aiml: 'AI / ML',
  aiintegr: 'AI Integration', devops: 'DevOps / Infrastructure',
  quant: 'Quantitative Research', quantfin: 'Quantitative Finance',
  insurance: 'Insurance & Actuarial', risk: 'Risk Management',
  consulting: 'Consulting', analyst: 'Analytics', financebiz: 'Finance, Risk & Operations',
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
  financebiz:['$70K–$95K','$90K–$125K','$110K–$155K','$130K–$190K'],
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
  applicants: number;
  easyApply: boolean;
};

function generateJobs(count: number, start = 0): Job[] {
  const jobs: Job[] = [];
  for (let i = start; i < start + count; i++) {
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
      applicants: Math.floor(rng() * 180) + 12,
      easyApply: rng() > 0.25,
    });
  }
  return jobs;
}

const INITIAL_JOB_BATCH = 40;
const PAGE_SIZE = 10;

// ── Manager name generation ───────────────────────────────────────────────────

function generateManagerName(jobId: string): string {
  const rng = seeded(strHash(jobId + 'mgr'));
  return makeName(rng);
}

// ── Feed posts ────────────────────────────────────────────────────────────────

type FeedPost = {
  id: number;
  author: string;
  headline?: string;
  time: string;
  text: string;
  company?: string;        // if set, post is by a company page — logo tile shown
  banner?: boolean;        // show the company hero banner as post media
  promoted?: boolean;
  followers?: string;
  reactions: number;
  comments: number;
  reposts: number;
};

const REAL_FEED_POSTS: FeedPost[] = [
  { id: 1, author: 'Google', company: 'Google', banner: true, followers: '35,882,401 followers', promoted: true, time: '4h', reactions: 14832, comments: 512, reposts: 1204,
    text: 'Life at Google means working on products that reach billions. Our university graduate roles for Software Engineering, Data Science, and Product are now open across Mountain View, NYC, and Seattle. Explore #LifeAtGoogle and apply through the Jobs tab.' },
  { id: 2, author: 'Priya Hartwell', headline: 'ML Engineer at Google', time: '2h', reactions: 341, comments: 28, reposts: 12,
    text: 'Spent the last month migrating our inference stack from Flask to a gRPC-based service. Latency dropped 40% and P99 improved significantly. Incremental refactoring with feature flags made this zero-downtime. Happy to share the design doc template we used — DM me.' },
  { id: 3, author: 'McKinsey & Company', company: 'McKinsey & Company', banner: true, followers: '5,204,977 followers', time: '6h', reactions: 8210, comments: 194, reposts: 967,
    text: 'What distinguishes the leaders of the next decade? Our latest research on organizational resilience draws on interviews with 1,200 executives across 17 industries. Business Analyst and Associate roles for the class of 2026 are open now — application deadline is approaching.' },
  { id: 4, author: 'Marcus Thornton', headline: 'Quantitative Researcher at JP Morgan', time: '5h', reactions: 187, comments: 41, reposts: 8,
    text: 'Published a note on our internal wiki about the practical differences between LASSO and Ridge regularization in factor model construction. The L1/L2 penalty choice matters more than most practitioners realize in regime-shift environments.' },
  { id: 5, author: 'Apple', company: 'Apple', banner: true, followers: '18,553,220 followers', time: '1d', reactions: 22409, comments: 831, reposts: 2650,
    text: 'At Apple, we believe the best work happens when brilliant people are given the space to do the best work of their lives. Hardware, software, services, and silicon — explore engineering opportunities across Cupertino and Austin.' },
  { id: 6, author: 'Elena Vasquez', headline: 'Senior Software Engineer at Amazon Web Services (AWS)', time: '1d', reactions: 529, comments: 63, reposts: 21,
    text: 'We shipped a new query planner for our internal analytics engine this week. The key insight was treating selectivity estimation as a learned problem rather than relying on static histograms. The Postgres paper from 1994 still holds up remarkably well.' },
  { id: 7, author: 'Amazon', company: 'Amazon', banner: true, followers: '31,027,554 followers', promoted: true, time: '2d', reactions: 10233, comments: 402, reposts: 780,
    text: "Day 1 thinking never stops. Amazon and AWS are hiring Software Development Engineers, Solutions Architects, and Operations leaders across 40+ US locations. Bring your builder mindset." },
  { id: 8, author: 'Darius Chen', headline: 'DevOps Engineer at Boston Consulting Group (BCG)', time: '2d', reactions: 264, comments: 19, reposts: 6,
    text: 'Reminder that observability is not the same as monitoring. Monitoring tells you something is broken. Observability lets you understand why — even for failure modes you have never seen before. Cardinality in your metrics matters.' },
  { id: 9, author: 'Bain & Company', company: 'Bain & Company', banner: true, followers: '2,881,730 followers', time: '3d', reactions: 5107, comments: 156, reposts: 433,
    text: 'Results, not reports. For the 21st consecutive year, Bain has been ranked one of the best places to work. Our Associate Consultant Intern and full-time ACI applications are now open — join a team that measures success by client outcomes.' },
  { id: 10, author: 'Polymarket', company: 'Polymarket', followers: '412,806 followers', promoted: true, time: '3d', reactions: 3288, comments: 97, reposts: 214,
    text: 'Proud sponsor of the aOS Workforce Readiness Simulation. Markets are the best forecasters — will tech hiring beat expectations this quarter? Trade what you believe.' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPosted(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

function salaryPerYear(salary: string): string {
  return salary.replace(/\$(\d+)K/g, '$$$1K/yr').replace('–', ' - ');
}

// ── Company about blurbs ──────────────────────────────────────────────────────

const COMPANY_ABOUT: Record<Archetype, string[]> = {
  finance: [
    'A leading financial services firm with a track record of delivering exceptional returns for institutional and individual clients. We operate across asset management, investment banking, and risk advisory with offices in major financial centers worldwide.',
    'Founded on a commitment to disciplined investment and rigorous risk management, we serve pension funds, sovereign wealth funds, and family offices. Our culture values intellectual honesty, quantitative precision, and long-term thinking.',
  ],
  tech: [
    'A high-growth technology company building the infrastructure layer for the next generation of digital experiences. We serve millions of users worldwide and hold a high bar for engineering craft, autonomy, and impact.',
    'We develop software platforms that help people and enterprise teams collaborate, ship faster, and scale securely. Our engineering culture prioritizes technical excellence, autonomy, and continuous learning.',
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

function companyFollowers(company: string): string {
  const h = strHash(company);
  const n = 80000 + (h % 12000000);
  return `${n.toLocaleString()} followers`;
}

// ── SVG icons (LinkedIn glyph set) ────────────────────────────────────────────

function IconHome({ active }: { active?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#191919' : '#666'}>
      <path d="M23 9v2h-2v7a3 3 0 0 1-3 3h-4v-6h-4v6H6a3 3 0 0 1-3-3v-7H1V9l11-7 5 3.18V2h3v5.09z" />
    </svg>
  );
}
function IconNetwork({ active }: { active?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#191919' : '#666'}>
      <path d="M12 16v6H3v-6a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3zm5.5-3A3.5 3.5 0 1 0 14 9.5a3.5 3.5 0 0 0 3.5 3.5zm1 2h-2a2.5 2.5 0 0 0-2.5 2.5V22h7v-4.5a2.5 2.5 0 0 0-2.5-2.5zM7.5 2A4.5 4.5 0 1 0 12 6.5 4.49 4.49 0 0 0 7.5 2z" />
    </svg>
  );
}
function IconJobs({ active }: { active?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#191919' : '#666'}>
      <path d="M17 6V5a3 3 0 0 0-3-3h-4a3 3 0 0 0-3 3v1H2v4a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V6zM9 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9zm10 9a4 4 0 0 0 3-1.38V17a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-4.38A4 4 0 0 0 5 14z" />
    </svg>
  );
}
function IconMessaging({ active }: { active?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#191919' : '#666'}>
      <path d="M16 4H8a7 7 0 0 0 0 14h4v4l8.16-5.39A6.78 6.78 0 0 0 23 11a7 7 0 0 0-7-7zm-8 8.25A1.25 1.25 0 1 1 9.25 11 1.25 1.25 0 0 1 8 12.25zm4 0A1.25 1.25 0 1 1 13.25 11 1.25 1.25 0 0 1 12 12.25zm4 0A1.25 1.25 0 1 1 17.25 11 1.25 1.25 0 0 1 16 12.25z" />
    </svg>
  );
}
function IconBell({ active }: { active?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#191919' : '#666'}>
      <path d="M22 19h-8.28a2 2 0 1 1-3.44 0H2v-1a4.52 4.52 0 0 1 1.17-2.83l1-1.17h15.7l1 1.17A4.42 4.42 0 0 1 22 18zM18.21 7.44A6.27 6.27 0 0 0 12 2a6.27 6.27 0 0 0-6.21 5.44L5 13h14z" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#666">
      <path d="M21.41 18.59l-5.27-5.28A6.83 6.83 0 0 0 17 10a7 7 0 1 0-7 7 6.83 6.83 0 0 0 3.31-.86l5.28 5.27a2 2 0 0 0 2.82-2.82zM5 10a5 5 0 1 1 5 5 5 5 0 0 1-5-5z" />
    </svg>
  );
}
function LinkedInBug({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34">
      <rect width="34" height="34" rx="3.4" fill="#0a66c2" />
      <path d="M8.4 13.3h3.7V26H8.4zM10.2 7.5a2.15 2.15 0 1 1 0 4.3 2.15 2.15 0 0 1 0-4.3zM14.6 13.3h3.55v1.74h.05c.5-.94 1.7-1.93 3.51-1.93 3.76 0 4.45 2.47 4.45 5.69V26h-3.7v-6.4c0-1.53-.03-3.5-2.13-3.5-2.13 0-2.46 1.66-2.46 3.38V26h-3.7z" fill="#fff" />
    </svg>
  );
}
function VerifiedShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginLeft: 4, verticalAlign: -2 }}>
      <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5z" fill="#0a66c2" />
      <path d="M10.5 15.6 7.4 12.5l1.4-1.4 1.7 1.7 4.7-4.7 1.4 1.4z" fill="#fff" />
    </svg>
  );
}

const REACTION_LIKE = (
  <svg width="16" height="16" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="8" fill="#378fe9" />
    <path d="M11.9 7.07a.9.9 0 0 0-.9-.9H8.98l.3-1.45a1.05 1.05 0 0 0-.79-1.25 1 1 0 0 0-1.13.52L5.9 6.62H4.6v4.78h5.5a.9.9 0 0 0 .88-.72l.9-3.2a.9.9 0 0 0 .02-.41z" fill="#fff" transform="translate(0.4,0.3) scale(0.98)" />
  </svg>
);
const REACTION_HEART = (
  <svg width="16" height="16" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="8" fill="#df704d" />
    <path d="M8 12.5S3.5 9.6 3.5 6.8A2.3 2.3 0 0 1 8 6a2.3 2.3 0 0 1 4.5.8C12.5 9.6 8 12.5 8 12.5z" fill="#fff" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

type LinkedInTab = 'feed' | 'network' | 'jobs' | 'messaging' | 'notifications' | 'profile';

const NAV_ITEMS: Array<{ key: LinkedInTab; label: string; icon: (a: boolean) => JSX.Element }> = [
  { key: 'feed', label: 'Home', icon: (a) => <IconHome active={a} /> },
  { key: 'network', label: 'My Network', icon: (a) => <IconNetwork active={a} /> },
  { key: 'jobs', label: 'Jobs', icon: (a) => <IconJobs active={a} /> },
  { key: 'messaging', label: 'Messaging', icon: (a) => <IconMessaging active={a} /> },
  { key: 'notifications', label: 'Notifications', icon: (a) => <IconBell active={a} /> },
];

export function LinkedInSite() {
  const { sendEmail } = useMailStore();
  const { fullName, preferredEmail, roleHeadline, location } = useProfileStore();
  const emails = useMailStore((s) => s.emails);
  const acceptedJob = useMemo(() => emails.find((e) => e.jobMeta?.stage === 'onboarding')?.jobMeta, [emails]);
  const [tab, setTab] = useState<LinkedInTab>('feed');
  const [jobs, setJobs] = useState<Job[]>(() => generateJobs(INITIAL_JOB_BATCH));
  const [selectedJobId, setSelectedJobId] = useState<string>('job-0');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [applyState, setApplyState] = useState<Record<string, 'idle' | 'applying' | 'applied'>>(() => {
    try { return JSON.parse(localStorage.getItem('li_apply_state') ?? '{}'); }
    catch { return {}; }
  });
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [connectState, setConnectState] = useState<Record<number, 'idle' | 'pending' | 'connected'>>({});
  const [messageTarget, setMessageTarget] = useState<number | null>(null);
  const [messageText, setMessageText] = useState<string>('');
  const [sentMessages, setSentMessages] = useState<Record<number, string[]>>({});
  const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({});
  const [viewPerson, setViewPerson] = useState<Person | null>(null);

  useEffect(() => {
    localStorage.setItem('li_apply_state', JSON.stringify(applyState));
  }, [applyState]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? jobs[0] ?? null;

  const filteredJobs = useMemo(() => jobs.filter((j) => {
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
  }), [jobs, categoryFilter, typeFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));

  const ensureJobsForPage = (page: number) => {
    const requiredCount = page * PAGE_SIZE;
    setJobs((prev) => {
      if (prev.length >= requiredCount) return prev;
      const additional = generateJobs(requiredCount - prev.length, prev.length);
      return [...prev, ...additional];
    });
  };

  const pagedJobs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredJobs.slice(start, start + PAGE_SIZE);
  }, [filteredJobs, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, typeFilter, searchQuery]);

  useEffect(() => {
    if (pagedJobs.length > 0 && !pagedJobs.find((j) => j.id === selectedJobId)) {
      setSelectedJobId(pagedJobs[0].id);
    }
  }, [pagedJobs, selectedJobId]);

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
        employmentType: job.type,
      };
      sendEmail({
        from: `${job.recruiter} — Talent Acquisition at ${job.company} <careers@${job.domain}>`,
        to: preferredEmail,
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

  const initials = (fullName[0] ?? 'U').toUpperCase();
  const myHeadline = acceptedJob ? `${acceptedJob.role} at ${acceptedJob.company}` : roleHeadline;

  // ── Sub-renders ─────────────────────────────────────────────────────────────

  const renderIdentityCard = () => (
    <div className="lk-card lk-identity-card">
      <div className="lk-identity-banner" style={acceptedJob && getCompanyBanner(acceptedJob.company) ? { backgroundImage: `url(${getCompanyBanner(acceptedJob.company)})` } : undefined} />
      <div className="lk-identity-avatar">{initials}</div>
      <div className="lk-identity-name">{fullName}<VerifiedShield /></div>
      <div className="lk-identity-headline">{myHeadline}</div>
      <div className="lk-identity-location">{location}</div>
      {acceptedJob && (
        <div className="lk-identity-company">
          <CompanyLogo company={acceptedJob.company} size={18} /> {acceptedJob.company}
        </div>
      )}
      <div className="lk-identity-divider" />
      <button type="button" className="lk-identity-stat"><span>Profile viewers</span><strong>127</strong></button>
      <button type="button" className="lk-identity-stat"><span>Post impressions</span><strong>1,438</strong></button>
      <div className="lk-identity-divider" />
      <button type="button" className="lk-identity-premium"><span className="lk-premium-square" /> Try Premium for $0</button>
      <div className="lk-identity-divider" />
      <button type="button" className="lk-identity-link"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M7 4h10v16l-5-3.5L7 20z"/></svg> Saved items</button>
      <button type="button" className="lk-identity-link"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 6a3 3 0 0 1 0 5.6M16.5 13.6A5.5 5.5 0 0 1 20.5 19"/></svg> Groups</button>
      <button type="button" className="lk-identity-link"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4.5 5.5h13v14h-13z"/><path d="M17.5 9h2v9a1.5 1.5 0 0 1-1.5 1.5h-13"/><path d="M7 9h8M7 12.5h8M7 16h5"/></svg> Newsletters</button>
      <button type="button" className="lk-identity-link"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="5.5" width="16" height="14.5" rx="1.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg> Events</button>
    </div>
  );

  const renderFeed = () => (
    <div className="lk-page lk-feed-layout">
      <aside className="lk-rail-left">{renderIdentityCard()}</aside>

      <main className="lk-feed-main">
        <div className="lk-card lk-composer">
          <div className="lk-composer-row">
            <div className="lk-avatar-circle lk-avatar-40">{initials}</div>
            <button type="button" className="lk-composer-input">Start a post</button>
          </div>
          <div className="lk-composer-actions">
            <button type="button"><span className="lk-media-ic" style={{ color: '#378fe9' }}>▣</span> Media</button>
            <button type="button"><span className="lk-media-ic" style={{ color: '#c37d16' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="5.5" width="16" height="14.5" rx="1.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg></span> Event</button>
            <button type="button"><span className="lk-media-ic" style={{ color: '#e06847' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 20h4L20 8l-4-4L4 16z"/><path d="m14 6 4 4"/></svg></span> Write article</button>
          </div>
        </div>

        <div className="lk-feed-sort"><span className="lk-feed-sort-line" /><span>Sort by: <strong>Top ▾</strong></span></div>

        {REAL_FEED_POSTS.map((post) => {
          const liked = likedPosts[post.id];
          const banner = post.company ? getCompanyBanner(post.company) : undefined;
          return (
            <article key={post.id} className="lk-card lk-post">
              <div className="lk-post-header">
                {post.company ? (
                  <CompanyLogo company={post.company} size={48} />
                ) : (
                  <button type="button" className="lk-photo-btn" onClick={() => setViewPerson(buildPerson(post.author, post.headline?.split(' at ')[0] ?? 'Professional', post.headline?.split(' at ')[1] ?? 'aOS'))}>
                    <img className="lk-photo lk-avatar-48" src={personPhoto(post.author)} alt="" />
                  </button>
                )}
                <div className="lk-post-id">
                  <div className="lk-post-author">{post.author}{post.company && <VerifiedShield />} {!post.company && <span className="lk-post-degree">· 3rd+</span>}</div>
                  <div className="lk-post-headline">{post.company ? post.followers : post.headline}</div>
                  <div className="lk-post-time">{post.promoted ? 'Promoted' : `${post.time} · `}{!post.promoted && <span title="Public"></span>}</div>
                </div>
                <button type="button" className="lk-post-more">⋯</button>
                {post.company && <button type="button" className="lk-post-follow">+ Follow</button>}
              </div>
              <p className="lk-post-text">{post.text}</p>
              {banner && post.banner && (
                <div className="lk-post-media" style={{ backgroundImage: `url(${banner})` }}>
                  <div className="lk-post-media-logo"><CompanyLogo company={post.company!} size={64} /></div>
                </div>
              )}
              <div className="lk-post-social">
                <span className="lk-post-reactions">{REACTION_LIKE}{REACTION_HEART}<span>{formatCount(post.reactions + (liked ? 1 : 0))}</span></span>
                <span className="lk-post-counts">{post.comments} comments · {post.reposts} reposts</span>
              </div>
              <div className="lk-post-actions">
                <button type="button" className={liked ? 'lk-liked' : ''} onClick={() => setLikedPosts((p) => ({ ...p, [post.id]: !p[post.id] }))}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? '#0a66c2' : '#666'}><path d="M19.46 11l-3.91-3.91a7 7 0 0 1-1.69-2.74l-.49-1.47A2.76 2.76 0 0 0 10.76 1 2.75 2.75 0 0 0 8 3.74v1.12a9.19 9.19 0 0 0 .46 2.85L8.89 9H4.12A2.12 2.12 0 0 0 2 11.12a2.16 2.16 0 0 0 .92 1.76A2.11 2.11 0 0 0 2 14.62a2.14 2.14 0 0 0 1.28 2 2 2 0 0 0-.32 1.11 2.12 2.12 0 0 0 1.83 2.1 2.1 2.1 0 0 0 0 .41A2.12 2.12 0 0 0 6.9 22h7.28a7.49 7.49 0 0 0 7.31-5.76l.5-2.16A4.24 4.24 0 0 0 19.46 11z" /></svg>
                  Like
                </button>
                <button type="button">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#666"><path d="M7 9h10v1H7zm0 4h7v-1H7zm16-2a6.78 6.78 0 0 1-2.84 5.61L12 22v-4H8A7 7 0 0 1 8 4h8a7 7 0 0 1 7 7z" /></svg>
                  Comment
                </button>
                <button type="button">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#666"><path d="M13.96 5H6c-.55 0-1 .45-1 1v10H3V6c0-1.66 1.34-3 3-3h7.96L12 .91 13.41-.5 18.9 5l-5.49 5.5L12 9.09zM10.04 19H18c.55 0 1-.45 1-1V8h2v10c0 1.66-1.34 3-3 3h-7.96L12 23.09 10.59 24.5 5.1 19l5.49-5.5L12 14.91z" /></svg>
                  Repost
                </button>
                <button type="button">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#666"><path d="M21 3L0 10l7.66 4.26L16 8l-6.26 8.34L14 24l7-21z" /></svg>
                  Send
                </button>
              </div>
            </article>
          );
        })}
      </main>

      <aside className="lk-rail-right">
        <div className="lk-card lk-news">
          <div className="lk-news-title">LinkedIn News <span>ⓘ</span></div>
          <ul className="lk-news-list">
            <li><strong>Tech hiring rebounds in Q3</strong><span>5h ago · 12,847 readers</span></li>
            <li><strong>Consulting giants expand AI arms</strong><span>7h ago · 8,112 readers</span></li>
            <li><strong>New grads: skills over pedigree</strong><span>1d ago · 24,631 readers</span></li>
            <li><strong>Return-to-office reaches steady state</strong><span>1d ago · 6,904 readers</span></li>
            <li><strong>The rise of the AI engineer</strong><span>2d ago · 31,552 readers</span></li>
          </ul>
          <button type="button" className="lk-news-more">Show more ▾</button>
        </div>
        <div className="lk-card lk-promo">
          <div className="lk-promo-label">Ad ···</div>
          <div className="lk-promo-body">
            <div className="lk-promo-logos">
              <div className="lk-avatar-circle lk-avatar-48">{initials}</div>
              <CompanyLogo company="Google" size={48} />
            </div>
            <p>{fullName.split(' ')[0]}, you're following Google. See their open roles.</p>
            <button type="button" className="lk-btn-outline" onClick={() => { setSearchQuery('Google'); setTab('jobs'); }}>See jobs</button>
          </div>
        </div>
        <footer className="lk-footer">
          <nav>About · Accessibility · Help Center · Privacy &amp; Terms · Ad Choices · Advertising · Business Services · Get the LinkedIn app</nav>
          <div className="lk-footer-brand"><LinkedInBug size={14} /> LinkedIn Corporation © {new Date().getFullYear()}</div>
        </footer>
      </aside>
    </div>
  );

  const renderJobs = () => (
    <div className="lk-page lk-jobs-page">
      <div className="lk-jobs-filterbar">
        <select className="lk-pill-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
        <select className="lk-pill-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">Job type</option>
          <option value="Full-time">Full-time</option>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Contract">Contract</option>
        </select>
        <span className="lk-pill-static">Easy Apply</span>
        <span className="lk-pill-static">Experience level</span>
        <span className="lk-pill-static">Date posted</span>
        <span className="lk-jobs-result-count">{filteredJobs.length} results</span>
      </div>

      <div className="lk-jobs-split">
        <div className="lk-jobs-listcol">
          <div className="lk-jobs-listhead">
            <strong>Top job picks for you</strong>
            <span>Based on your profile, preferences, and activity like applies, searches, and saves</span>
          </div>
          <div className="lk-jobs-list">
            {pagedJobs.length === 0 && <div className="lk-empty">No jobs match your filters.</div>}
            {pagedJobs.map((job) => {
              const state = applyState[job.id] ?? 'idle';
              return (
                <button key={job.id} type="button" className={`lk-job-row${selectedJobId === job.id ? ' active' : ''}`} onClick={() => setSelectedJobId(job.id)}>
                  <CompanyLogo company={job.company} size={48} />
                  <div className="lk-job-row-body">
                    <div className="lk-job-row-title">{job.role}</div>
                    <div className="lk-job-row-company">{job.company}</div>
                    <div className="lk-job-row-loc">{job.location} ({job.type})</div>
                    <div className="lk-job-row-foot">
                      {state === 'applied'
                        ? <span className="lk-job-applied">✓ Applied</span>
                        : job.easyApply
                          ? <span className="lk-easy-apply"><LinkedInBug size={14} /> Easy Apply</span>
                          : <span className="lk-job-posted">{formatPosted(job.postedDays)}</span>}
                    </div>
                  </div>
                  <span className="lk-job-row-x">✕</span>
                </button>
              );
            })}
          </div>
          <div className="lk-pagination">
            <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>‹</button>
            {Array.from({ length: Math.min(totalPages, 8) }, (_, idx) => {
              const pageNum = idx + 1;
              return (
                <button key={pageNum} type="button" className={pageNum === currentPage ? 'active' : ''}
                  onClick={() => { ensureJobsForPage(pageNum); setCurrentPage(pageNum); }}>
                  {pageNum}
                </button>
              );
            })}
            <button type="button" onClick={() => { const next = currentPage + 1; ensureJobsForPage(next); setCurrentPage(next); }}>›</button>
          </div>
        </div>

        <div className="lk-jobs-detail">
          {(() => {
            const job = selectedJob;
            if (!job) return <div className="lk-empty">No job selected.</div>;
            const state = applyState[job.id] ?? 'idle';
            const banner = getCompanyBanner(job.company);
            return (
              <>
                {banner && (
                  <div className="lk-detail-banner" style={{ backgroundImage: `url(${banner})` }} />
                )}
                <div className="lk-detail-inner">
                  <div className="lk-detail-companyrow">
                    <CompanyLogo company={job.company} size={32} />
                    <span className="lk-detail-companyname">{job.company}</span>
                  </div>
                  <h1 className="lk-detail-title">{job.role}</h1>
                  <div className="lk-detail-meta">
                    {job.location} · {formatPosted(job.postedDays)} · <span className="lk-detail-applicants">{job.applicants} applicants</span>
                  </div>
                  <div className="lk-detail-attrs">
                    <span className="lk-detail-attr"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="7" width="16" height="13" rx="1.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M4 12h16"/></svg> {job.type} · {salaryPerYear(job.salary)}</span>
                    <span className="lk-detail-attr"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M5 20V4.5h9V20M14 8.5h5V20M3.5 20h17"/><path d="M8 8h2.5M8 11.5h2.5M8 15h2.5"/></svg> {job.categoryLabel}</span>
                  </div>
                  <div className="lk-detail-actionrow">
                    <button type="button"
                      className={`lk-btn-primary${state !== 'idle' ? ' disabled' : ''}`}
                      onClick={() => state === 'idle' && applyToJob(job)}
                      disabled={state !== 'idle'}>
                      {state === 'idle' ? (job.easyApply ? <><LinkedInBug size={16} /> Easy Apply</> : 'Apply') : state === 'applying' ? 'Submitting…' : '✓ Applied'}
                    </button>
                    <button type="button" className="lk-btn-outline">Save</button>
                  </div>
                  {state === 'applied' && (
                    <div className="lk-applied-note">Application sent — a confirmation email is in your Outlook inbox. Reply <strong>ATS100</strong> to it to advance.</div>
                  )}

                  <section className="lk-detail-section">
                    <h2>About the job</h2>
                    <p>{job.description}</p>
                    <h3>Requirements</h3>
                    <ul>{job.requirements.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </section>

                  <section className="lk-detail-section lk-detail-companycard">
                    <div className="lk-detail-companyhead">
                      <CompanyLogo company={job.company} size={48} />
                      <div>
                        <div className="lk-detail-companyname">{job.company}</div>
                        <div className="lk-detail-followers">{companyFollowers(job.company)}</div>
                      </div>
                      <button type="button" className="lk-btn-outline">+ Follow</button>
                    </div>
                    <p>{getCompanyAbout(job.archetype, job.id)}</p>
                  </section>

                  <section className="lk-detail-section">
                    <h2>Meet the hiring team</h2>
                    <div className="lk-recruiter-row">
                      <button type="button" className="lk-photo-btn" onClick={() => setViewPerson(buildPerson(job.recruiter, 'Talent Acquisition', job.company))}>
                        <img className="lk-photo lk-avatar-48" src={personPhoto(job.recruiter)} alt="" />
                      </button>
                      <div>
                        <div className="lk-recruiter-name">{job.recruiter} <span className="lk-post-degree">· 3rd</span></div>
                        <div className="lk-recruiter-title">Talent Acquisition at {job.company}</div>
                      </div>
                      <button type="button" className="lk-btn-outline">Message</button>
                    </div>
                  </section>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );

  const renderNetwork = () => (
    <div className="lk-page lk-network-layout">
      <aside className="lk-rail-left">
        <div className="lk-card lk-manage-net">
          <div className="lk-manage-title">Manage my network</div>
          {[[<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 6a3 3 0 0 1 0 5.6M16.5 13.6A5.5 5.5 0 0 1 20.5 19"/></svg>,'Connections', String(Object.values(connectState).filter((s) => s === 'connected').length + 512)],
            [<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8.5" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>,'Following & followers','1,204'],
            [<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3.5" y="5" width="17" height="14" rx="1.5"/><circle cx="9" cy="11" r="2"/><path d="M6 16.5a3.2 3.2 0 0 1 6 0M15 9.5h3M15 13h3"/></svg>,'Groups','6'],
            [<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="5.5" width="16" height="14.5" rx="1.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg>,'Events','2'],
            [<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4.5 5.5h13v14h-13z"/><path d="M17.5 9h2v9a1.5 1.5 0 0 1-1.5 1.5h-13"/><path d="M7 9h8M7 12.5h8M7 16h5"/></svg>,'Newsletters','9'],
          ].map(([ic, label, count], mi) => (
            <button key={mi} type="button" className="lk-manage-row"><span>{ic} {label}</span><span className="lk-manage-count">{count}</span></button>
          ))}
        </div>
      </aside>
      <main className="lk-network-main">
        <div className="lk-card lk-invites">
          <div className="lk-invites-head"><span>Invitations ({Object.values(connectState).filter((s) => s === 'pending').length})</span><button type="button">See all</button></div>
        </div>
        <div className="lk-card lk-pymk">
          <div className="lk-pymk-head">People you may know from your industry</div>
          <div className="lk-pymk-grid">
            {Array.from({ length: 12 }, (_, i) => {
              const rng = seeded(i * 4211 + 9973);
              const name = makeName(rng);
              const company = makeCompany(rng);
              const cat = pick(CATEGORIES, rng);
              const role = pick([...ROLE_MAP[cat]], rng);
              const cs = connectState[i] ?? 'idle';
              const mutuals = Math.floor(seeded(i * 11 + 7)() * 12) + 1;
              const banner = getCompanyBanner(company);
              return (
                <div key={i} className="lk-person-card">
                  <div className="lk-person-cover" style={banner ? { backgroundImage: `url(${banner})` } : { background: `linear-gradient(135deg, hsl(${(i * 47 + 200) % 360}deg 45% 55%), hsl(${(i * 47 + 260) % 360}deg 45% 40%))` }} />
                  <button type="button" className="lk-photo-btn lk-person-photo-btn" onClick={() => setViewPerson(buildPerson(name, role, company))}>
                    <img className="lk-photo lk-person-photo" src={personPhoto(name)} alt="" />
                  </button>
                  <button type="button" className="lk-person-name lk-namelink" onClick={() => setViewPerson(buildPerson(name, role, company))}>{name}</button>
                  <div className="lk-person-role">{role}</div>
                  <div className="lk-person-companyrow"><CompanyLogo company={company} size={16} /><span>{company}</span></div>
                  <div className="lk-person-mutual"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 6a3 3 0 0 1 0 5.6M16.5 13.6A5.5 5.5 0 0 1 20.5 19"/></svg> {mutuals} mutual connection{mutuals !== 1 ? 's' : ''}</div>
                  {cs === 'idle' && <button type="button" className="lk-connect-pill" onClick={() => setConnectState((p) => ({ ...p, [i]: 'pending' }))}>Connect</button>}
                  {cs === 'pending' && <button type="button" className="lk-connect-pill lk-pending" onClick={() => setConnectState((p) => ({ ...p, [i]: 'connected' }))}>Pending</button>}
                  {cs === 'connected' && <button type="button" className="lk-connect-pill lk-done" onClick={() => setMessageTarget(i)}>Message</button>}
                  {messageTarget === i && (
                    <div className="lk-msg-box">
                      <textarea rows={3} placeholder={`Message ${name.split(' ')[0]}…`} value={messageText} onChange={(e) => setMessageText(e.target.value)} />
                      <div className="lk-msg-actions">
                        <button type="button" className="lk-btn-primary" onClick={() => {
                          if (messageText.trim()) {
                            setSentMessages((p) => ({ ...p, [i]: [...(p[i] ?? []), messageText.trim()] }));
                            setMessageText('');
                            setMessageTarget(null);
                          }
                        }}>Send</button>
                        <button type="button" className="lk-btn-outline" onClick={() => setMessageTarget(null)}>Cancel</button>
                      </div>
                    </div>
                  )}
                  {(sentMessages[i] ?? []).length > 0 && <div className="lk-sent-note">✓ Message sent</div>}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );

  const renderNotifications = () => (
    <div className="lk-page lk-notif-layout">
      <aside className="lk-rail-left">{renderIdentityCard()}</aside>
      <main className="lk-notif-main">
        <div className="lk-card">
          <div className="lk-notif-tabs">
            {['All', 'Jobs', 'My posts', 'Mentions'].map((t, i) => (
              <button key={t} type="button" className={i === 0 ? 'active' : ''}>{t}</button>
            ))}
          </div>
          {emails.filter((e) => e.jobMeta).slice(0, 8).map((e) => (
            <div key={e.id} className="lk-notif-row">
              <CompanyLogo company={e.jobMeta!.company} size={48} />
              <div className="lk-notif-body">
                <span><strong>{e.jobMeta!.company}</strong> — {e.subject}</span>
                <span className="lk-notif-time">{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          ))}
          {emails.filter((e) => e.jobMeta).length === 0 && (
            <div className="lk-notif-row">
              <div className="lk-avatar-circle lk-avatar-48" style={{ background: '#0a66c2' }}>in</div>
              <div className="lk-notif-body">
                <span>Welcome to LinkedIn. Apply to a job to start receiving recruiter updates here.</span>
                <span className="lk-notif-time">now</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );

  const renderMessaging = () => (
    <div className="lk-page lk-messaging-layout">
      <div className="lk-card lk-messaging-shell">
        <div className="lk-messaging-list">
          <div className="lk-messaging-head">Messaging</div>
          {Object.entries(sentMessages).length === 0 && (
            <div className="lk-messaging-empty">No conversations yet.<br />Connect with people in My Network and send a message.</div>
          )}
          {Object.entries(sentMessages).map(([idx, msgs]) => {
            const i = Number(idx);
            const rng = seeded(i * 4211 + 9973);
            const name = makeName(rng);
            return (
              <div key={idx} className="lk-conv-row">
                <img className="lk-photo lk-avatar-48" src={personPhoto(name)} alt="" />
                <div className="lk-conv-body">
                  <div className="lk-conv-name">{name}</div>
                  <div className="lk-conv-preview">You: {msgs[msgs.length - 1]}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="lk-messaging-detail">
          <div className="lk-messaging-placeholder">
            <IconMessaging />
            <p>Select a conversation to read messages.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => {
    const profileBanner = acceptedJob ? getCompanyBanner(acceptedJob.company) : undefined;
    return (
      <div className="lk-page lk-profile-layout">
        <main className="lk-profile-main">
          <div className="lk-card lk-profile-hero">
            <div className="lk-profile-banner" style={profileBanner ? { backgroundImage: `url(${profileBanner})` } : undefined} />
            <div className="lk-profile-avatar">{initials}</div>
            <div className="lk-profile-body">
              <div className="lk-profile-toprow">
                <div>
                  <h1 className="lk-profile-name">{fullName}<VerifiedShield /></h1>
                  <div className="lk-profile-headline">{myHeadline}</div>
                  <div className="lk-profile-loc">{location} · <button type="button" className="lk-linklike">Contact info</button></div>
                  <button type="button" className="lk-linklike lk-profile-conns">500+ connections</button>
                </div>
                {acceptedJob && (
                  <div className="lk-profile-orgs">
                    <div className="lk-profile-org"><CompanyLogo company={acceptedJob.company} size={24} /><span>{acceptedJob.company}</span></div>
                  </div>
                )}
              </div>
              <div className="lk-profile-btns">
                <button type="button" className="lk-btn-primary">Open to</button>
                <button type="button" className="lk-btn-outline">Add profile section</button>
                <button type="button" className="lk-btn-outline">Enhance profile</button>
                <button type="button" className="lk-btn-ghost">More</button>
              </div>
            </div>
          </div>

          <div className="lk-card lk-profile-section">
            <h2>Analytics</h2>
            <div className="lk-analytics-row">
              <div><strong>127</strong> profile views</div>
              <div><strong>1,438</strong> post impressions</div>
              <div><strong>36</strong> search appearances</div>
            </div>
          </div>

          <div className="lk-card lk-profile-section">
            <h2>About</h2>
            <p>Experienced professional working across software engineering, data, and analytical domains.{acceptedJob ? ` Currently ${acceptedJob.role} at ${acceptedJob.company}.` : ' Open to new opportunities in high-impact, fast-paced environments.'}</p>
          </div>

          <div className="lk-card lk-profile-section">
            <h2>Experience</h2>
            {acceptedJob ? (
              <div className="lk-exp-row">
                <CompanyLogo company={acceptedJob.company} size={48} />
                <div>
                  <div className="lk-exp-role">{acceptedJob.role}</div>
                  <div className="lk-exp-company">{acceptedJob.company} · Full-time</div>
                  <div className="lk-exp-dates">{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} – Present</div>
                  <div className="lk-exp-loc">{acceptedJob.location}</div>
                </div>
              </div>
            ) : (
              <div className="lk-exp-row">
                <CompanyLogo company="aOS Workspace" size={48} />
                <div>
                  <div className="lk-exp-role">Software Engineer</div>
                  <div className="lk-exp-company">aOS Workspace · Full-time</div>
                  <div className="lk-exp-dates">Jan 2023 – Present</div>
                </div>
              </div>
            )}
          </div>

          <div className="lk-card lk-profile-section">
            <h2>Skills</h2>
            <div className="lk-skills">
              {['Problem Solving','Communication','Python','SQL','Collaboration','Leadership','Adaptability'].map((s) => (
                <span key={s} className="lk-skill-pill">{s}</span>
              ))}
            </div>
          </div>
        </main>
        <aside className="lk-rail-right">
          <div className="lk-card lk-news">
            <div className="lk-news-title">People also viewed</div>
            <ul className="lk-people-viewed">
              {Array.from({ length: 5 }, (_, i) => {
                const rng = seeded(i * 631 + 41);
                const name = makeName(rng);
                const company = makeCompany(rng);
                return (
                  <li key={i}>
                    <img className="lk-photo lk-avatar-40" src={personPhoto(name)} alt="" />
                    <div>
                      <strong>{name}</strong>
                      <span>{pick([...ROLE_MAP.swe], rng)} at {company}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    );
  };

  // ── Shell ───────────────────────────────────────────────────────────────────

  return (
    <div className="lk-shell">
      <header className="lk-header">
        <div className="lk-header-inner">
          <div className="lk-header-left">
            <LinkedInBug />
            <div className="lk-searchwrap">
              <IconSearch />
              <input className="lk-search" placeholder="Search" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setTab('jobs')} />
            </div>
          </div>
          <nav className="lk-nav">
            {NAV_ITEMS.map((item) => (
              <button key={item.key} type="button" className={`lk-nav-item${tab === item.key ? ' active' : ''}`} onClick={() => setTab(item.key)}>
                <span className="lk-nav-icwrap">
                  {item.icon(tab === item.key)}
                  {item.key === 'notifications' && emails.filter((e) => e.jobMeta && !e.read).length > 0 && (
                    <span className="lk-nav-badge">{emails.filter((e) => e.jobMeta && !e.read).length}</span>
                  )}
                </span>
                <span className="lk-nav-label">{item.label}</span>
              </button>
            ))}
            <button type="button" className={`lk-nav-item${tab === 'profile' ? ' active' : ''}`} onClick={() => setTab('profile')}>
              <span className="lk-nav-icwrap"><span className="lk-avatar-circle lk-avatar-24">{initials}</span></span>
              <span className="lk-nav-label">Me ▾</span>
            </button>
          </nav>
        </div>
      </header>

      {viewPerson && <PersonProfileModal person={viewPerson} onClose={() => setViewPerson(null)} onView={(p) => setViewPerson(p)} />}

      <div className="lk-body">
        {tab === 'feed' && renderFeed()}
        {tab === 'jobs' && renderJobs()}
        {tab === 'network' && renderNetwork()}
        {tab === 'notifications' && renderNotifications()}
        {tab === 'messaging' && renderMessaging()}
        {tab === 'profile' && renderProfile()}
      </div>
    </div>
  );
}

// ── Person profile modal ─────────────────────────────────────────────────────

function PersonProfileModal({ person, onClose, onView }: { person: Person; onClose: () => void; onView: (p: Person) => void }) {
  const banner = getCompanyBanner(person.company);
  const extras = useMemo(() => buildProfileExtras(person), [person]);
  const [connected, setConnected] = useState(false);

  // Deterministic "People also viewed" rail — same person, same neighbors.
  const alsoViewed = useMemo(() => {
    const h = strHash(person.name);
    const rows: Person[] = [];
    for (let i = 0; i < 5; i++) {
      const first = FIRST_NAMES[(h + i * 7) % FIRST_NAMES.length];
      const last = LAST_NAMES[(h + i * 13) % LAST_NAMES.length];
      const name = `${first} ${last}`;
      if (name === person.name) continue;
      const roles = ['Software Engineer', 'Senior Product Manager', 'Data Analyst', 'Engagement Manager', 'Technical Recruiter'];
      rows.push(buildPerson(name, roles[(h + i) % roles.length], person.company));
    }
    return rows.slice(0, 4);
  }, [person]);

  return (
    <div className="lk-pp-overlay" onClick={onClose}>
      <div className="lk-pp lk-pp-full" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="lk-pp-close" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.8" fill="none"><path d="M3 3l10 10M13 3 3 13" /></svg>
        </button>
        <div className="lk-pp-columns">
          <div className="lk-pp-main">
            {/* Top card */}
            <div className="lk-pp-card">
              <div className="lk-pp-banner" style={banner ? { backgroundImage: `url(${banner})` } : undefined} />
              <img className="lk-pp-photo" src={person.photo} alt="" />
              <div className="lk-pp-body">
                <h2>{person.name}<VerifiedShield /></h2>
                <div className="lk-pp-headline">{person.headline}</div>
                <div className="lk-pp-meta">{person.location} · <span className="lk-pp-conns">Contact info</span></div>
                <div className="lk-pp-meta"><span className="lk-pp-conns">{person.connections} connections</span> · {extras.mutuals}</div>
                <div className="lk-pp-company-line">
                  <CompanyLogo company={person.company} size={20} /> {person.company}
                  <span className="lk-pp-dotsep" />
                  <CompanyLogo company={person.education.school} size={20} /> {person.education.school}
                </div>
                {person.openTo && <div className="lk-pp-opento">{person.openTo}</div>}
                <div className="lk-pp-btns">
                  <button type="button" className="lk-btn-primary" onClick={() => setConnected((c) => !c)}>
                    {connected ? 'Pending' : '+ Connect'}
                  </button>
                  <button type="button" className="lk-btn-outline">Message</button>
                  <button type="button" className="lk-btn-ghost">More</button>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="lk-pp-card lk-pp-section">
              <h3>About</h3>
              <p>{person.about}</p>
            </div>

            {/* Activity */}
            <div className="lk-pp-card lk-pp-section">
              <h3>Activity</h3>
              <div className="lk-pp-followers">{extras.followers} followers</div>
              {extras.posts.map((post, i) => (
                <div key={i} className="lk-pp-post">
                  <div className="lk-pp-post-head">
                    <img src={person.photo} alt="" />
                    <div>
                      <strong>{person.name}</strong> <span className="lk-pp-post-age">reposted this · {post.age}</span>
                    </div>
                  </div>
                  <p className="lk-pp-post-text">{post.text}</p>
                  <div className="lk-pp-post-stats">
                    <span className="lk-reaction-pills">
                      <span className="lk-reaction lk-reaction-like" />
                      <span className="lk-reaction lk-reaction-celebrate" />
                    </span>
                    {post.reactions} · {post.comments} comments
                  </div>
                </div>
              ))}
              <button type="button" className="lk-pp-showall">Show all posts</button>
            </div>

            {/* Experience */}
            <div className="lk-pp-card lk-pp-section">
              <h3>Experience</h3>
              {person.history.map((exp, i) => (
                <div key={exp.company + exp.role} className="lk-pp-exp">
                  <CompanyLogo company={exp.company} size={44} />
                  <div>
                    <strong>{exp.role}</strong>
                    <span>{exp.company} · Full-time</span>
                    <span className="lk-pp-dates">{exp.years}</span>
                    <span className="lk-pp-dates">{i === 0 ? person.location : 'Greater Chicago Area'}</span>
                    <p className="lk-pp-exp-desc">
                      {i === 0
                        ? `Leading day-to-day delivery as ${exp.role.toLowerCase()} — scoping work with partners, driving execution, and mentoring newer teammates.`
                        : 'Owned cross-team deliverables end to end and built the reporting the org still runs on.'}
                    </p>
                    {i === 0 && extras.skills.length > 0 && (
                      <span className="lk-pp-exp-skills"><strong>Skills:</strong> {extras.skills.slice(0, 3).map((s) => s.name).join(' · ')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Education */}
            <div className="lk-pp-card lk-pp-section">
              <h3>Education</h3>
              <div className="lk-pp-exp">
                <CompanyLogo company={person.education.school} size={44} />
                <div>
                  <strong>{person.education.school}</strong>
                  <span>{person.education.degree}</span>
                  <span className="lk-pp-dates">{person.education.years}</span>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="lk-pp-card lk-pp-section">
              <h3>Skills</h3>
              {extras.skills.map((skill) => (
                <div key={skill.name} className="lk-pp-skill">
                  <strong>{skill.name}</strong>
                  <span>{skill.endorsements} endorsements</span>
                </div>
              ))}
              <button type="button" className="lk-pp-showall">Show all {extras.skills.length + 9} skills</button>
            </div>

            {/* Interests */}
            <div className="lk-pp-card lk-pp-section">
              <h3>Interests</h3>
              <div className="lk-pp-interests">
                {extras.interests.map((it) => (
                  <div key={it} className="lk-pp-interest">
                    <CompanyLogo company={it} size={36} />
                    <div>
                      <strong>{it}</strong>
                      <span>{20 + (strHash(it) % 900)}K followers</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right rail */}
          <aside className="lk-pp-rail">
            <div className="lk-pp-card lk-pp-section">
              <h3>People also viewed</h3>
              {alsoViewed.map((p) => (
                <button key={p.name} type="button" className="lk-pp-also" onClick={() => onView(p)}>
                  <img src={p.photo} alt="" />
                  <div>
                    <strong>{p.name}</strong>
                    <span>{p.headline}</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ── Exported helpers for ATS pipeline ────────────────────────────────────────

export { meetingToolLabel };
