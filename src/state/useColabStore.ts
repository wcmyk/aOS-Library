import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ColabMessage = {
  id: string;
  from: 'user' | 'manager' | 'system';
  text: string;
  time: string;
  channel: string;
};

type ColabStore = {
  messages: Record<string, ColabMessage[]>;
  typing: Record<string, boolean>;
  addMessage: (channel: string, msg: Omit<ColabMessage, 'id'>) => void;
  setTyping: (channel: string, val: boolean) => void;
};

export const useColabStore = create<ColabStore>()(
  persist(
    (set) => ({
      messages: {},
      typing: {},
      addMessage: (channel, msg) =>
        set((state) => {
          const prev = state.messages[channel] ?? [];
          const full: ColabMessage = { ...msg, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
          return { messages: { ...state.messages, [channel]: [...prev, full] } };
        }),
      setTyping: (channel, val) =>
        set((state) => ({ typing: { ...state.typing, [channel]: val } })),
    }),
    { name: 'aos-colab-store' }
  )
);

// ── Topic detection ────────────────────────────────────────────────────────────

type Topic = 'greeting' | 'culture' | 'tech-stack' | 'projects' | 'career' |
             'compensation' | 'benefits' | 'schedule' | 'team' | 'onboarding' |
             'performance' | 'tools' | 'management' | 'general';

function detectTopic(msg: string): Topic {
  const s = msg.toLowerCase();
  if (/\b(hi|hello|hey|morning|afternoon|evening|what'?s up|howdy)\b/.test(s)) return 'greeting';
  if (/\b(culture|values|environment|vibe|work.?life|balance|feel like|atmosphere|morale)\b/.test(s)) return 'culture';
  if (/\b(tech|stack|language|framework|tool|platform|coding|code|language|python|java|go|rust|typescript|aws|azure|gcp)\b/.test(s)) return 'tech-stack';
  if (/\b(project|sprint|backlog|milestone|deadline|ship|release|feature|quarter|q[1-4]|roadmap|working on)\b/.test(s)) return 'projects';
  if (/\b(grow|promot|career|ladder|senior|advance|path|goal|level|promo|next step|title|staff|principal)\b/.test(s)) return 'career';
  if (/\b(salary|comp|compensation|bonus|equity|rsu|pay|raise|increase|money|package|total)\b/.test(s)) return 'compensation';
  if (/\b(benefit|health|dental|vision|pto|vacation|401k|time off|holiday|leave|insurance|parental)\b/.test(s)) return 'benefits';
  if (/\b(hours|schedule|remote|wfh|flexible|standup|meeting|sync|hybrid|office|9.?to.?5|core hours|async)\b/.test(s)) return 'schedule';
  if (/\b(team|colleague|peer|engineer|who (else|is|are)|how many|size|org|people)\b/.test(s)) return 'team';
  if (/\b(first day|start|onboard|week one|begin|new here|getting started|setup|equipment|laptop|access)\b/.test(s)) return 'onboarding';
  if (/\b(review|performance|feedback|eval|rating|assess|score|goal|okr|pip)\b/.test(s)) return 'performance';
  if (/\b(jira|workfront|slack|teams|github|figma|deploy|ci|cd|radar|buganizer|project.?sail|monday|asana|notion|confluence)\b/.test(s)) return 'tools';
  if (/\b(manage|manage(ment|r)|direct|report|1.?on.?1|mentor|leadership|style|micro|delegate)\b/.test(s)) return 'management';
  return 'general';
}

// ── Company knowledge map ──────────────────────────────────────────────────────

type Knowledge = Partial<Record<Topic, string>>;

const COMPANY_KNOWLEDGE: Record<string, Knowledge> = {
  'google.com': {
    greeting: "Hey, welcome! Really glad to have you on the team. If you have any questions as you're getting settled in, my inbox is always open.",
    culture: "Google has a genuinely open, data-driven culture with a high bar for intellectual honesty. Most decisions are defended with data in design docs. We have TGIF all-hands every Friday where leadership takes unfiltered questions. OKRs run quarterly — each of us sets aspirational goals we expect to hit 70% of. There's significant autonomy here once you ramp, and people are generally direct and curious.",
    'tech-stack': "Our main languages are Python, Go, C++, and Java. We use internal systems for most things — Borg for compute (similar to Kubernetes), Spanner for globally distributed SQL, BigQuery for analytics, Buganizer for issue tracking, and Critique for code review. For ML work the primary frameworks are TensorFlow and JAX. Tooling access gets provisioned your first week via go/setup.",
    projects: "Right now the team is heads-down on three things: a major reliability improvement to our data ingestion pipeline (SLO target is 99.95% and we're at 99.7%), a refactor of our recommendation serving layer to reduce P99 latency, and a new feature flagging system we're building to replace our legacy experiment framework. You'll get a design doc walkthrough your first week.",
    career: "The leveling ladder goes SWE I (L3) → L4 → L5 (Senior) → L6 (Staff) → L7 (Senior Staff) → L8 (Principal) → L9+ (Distinguished). Promotions require a promo packet — peers and leads write detailed evidence on the ladder criteria. I'll start working on your first packet with you around the 9-month mark. L5 is usually 2-4 years from L4 depending on impact.",
    compensation: "Total comp at your level includes base, annual equity refresh (RSU vesting 4-year cliff/monthly thereafter), and a target performance bonus (~15-25% depending on band). Comp adjustments happen annually in Q1. If you ever feel market is off, raise it — we take market corrections seriously here.",
    benefits: "The benefits package is genuinely excellent: $5K learning budget annually, on-site meals and micro-kitchens (on-campus), $500/month remote work stipend, comprehensive medical/dental/vision at low cost, 18 weeks paid parental leave, and 401k with strong match. Full details at go/benefits.",
    schedule: "We expect 3 days in office (Monday, Wednesday, Thursday by team norm) but it's flexible outside of those days. Core hours for synchronous work are 10am–4pm PT. Standups are async — we post updates in the team channel daily. No expectation to respond to Slack outside working hours.",
    team: "Our immediate team is 7 engineers: 2 L5s, 3 L4s (including you), 1 L6 tech lead (that's me), and 1 L3 who joined last quarter. We work closely with a product team of 2 PMs and 3 designers. Oncall rotation is shared — you'll shadow for your first 3 months before going solo.",
    onboarding: "First day: pick up your equipment from IT (MacBook Pro, monitors, peripherals), get Prodaccess provisioned for our internal systems, and join the team Standup at 11am. I'll set up our first 1:1 for Wednesday. First two weeks are ramp-only — no sprints, just docs, code reading, and pairing. You'll do your first PR review by end of week 2.",
    performance: "We run a formal perf cycle twice a year (February and August). You self-assess, peers write structured feedback, and leads calibrate across levels. Ratings are: Needs Improvement, Meets Expectations, Exceeds Expectations, Superb, and Outstanding. About 10% of folks hit Exceeds or above in a given cycle. I'll give you real-time feedback throughout the year so perf is never a surprise.",
    tools: "Day-to-day: Buganizer for task/issue tracking, Critique for code review (similar to GitHub PRs but internal), Piper for source control (monorepo), Borg/Kubernetes for compute, Spanner for database, Figma for design handoffs. For communication we use Google Chat (internal Spaces). For docs it's Google Docs, obviously.",
    management: "My style is coaching-first and async-first. I run weekly 1:1s — you own the agenda, I provide context and unblock. I write detailed promotion rationale because I believe advocacy is a core part of the manager role. I will never surprise you with negative feedback in a perf review — if something is off, you'll hear it from me directly in the week it happens.",
  },
  'meta.com': {
    greeting: "Hey, welcome to the team! Excited to have you here. Drop your intro in the team Workspace group and let's find time for our first 1:1 this week.",
    culture: "Meta operates on a strong impact-first culture. The mantra is 'move fast with stable infrastructure' — we've evolved from move fast and break things. People are direct, feedback is frequent, and visibility into what you ship is very high. We measure everything. Ratings are strongly tied to the scope and magnitude of your impact, not hours worked.",
    'tech-stack': "Depending on your team, you'll primarily use Python and Hack (Meta's PHP-derived language) for backend, React and React Native on the client side. PyTorch is the ML framework of choice. Data infra runs on Presto/Hive on top of Hadoop, with Scuba for real-time analytics. We use Phabricator for code review and Tasks for project tracking. Your stack may vary by org.",
    projects: "Q2 we're focused on reducing recommendation latency by 15% through a model compression initiative, shipping a new feed ranking signal that's showing strong offline gains, and completing a migration from an aging internal data pipeline to our modern streaming system. I'll walk you through the roadmap on your second day.",
    career: "Levels are E3 (new grad) → E4 → E5 (Senior) → E6 (Staff) → E7 (Senior Staff). Promotions require a calibrated packet reviewed by a committee. E5 to E6 is a meaningful scope jump — you're expected to drive multi-team impact. I'll set expectations clearly from the start and work backwards from your target level.",
    schedule: "We're hybrid: 3 days in office expectation with flexibility on which days outside team sync days. Core hours are 10am–4pm your local time. We use Workplace (internal Meta social/comms platform) and Messenger heavily for async communication. No one is expected to be on nights or weekends unless oncall.",
    tools: "Phabricator (Phab) for code review, Tasks for project management, Workplace for internal social/announcements, Hive/Presto for data queries, Scuba for live metrics. Oncall uses OpsGenie. For design it's Figma.",
    management: "I run weekly 1:1s with a shared doc — you add agenda items throughout the week. I prefer async updates on status and use 1:1 time for growth conversations and unblocking. Feedback is delivered frequently and directly — you'll never wonder where you stand with me.",
  },
  'apple.com': {
    greeting: "Welcome to the team. Things are going to move quickly, so get your gear set up and let's sync tomorrow to go through your ramp plan.",
    culture: "Apple's culture is defined by secrecy, craft, and obsessive attention to detail. Very little information crosses team boundaries — even within Apple, you may not know what adjacent teams are building. The bar for quality is extraordinarily high. We ship when it's right, not when it's fast. DRI (Directly Responsible Individual) is a core concept — one person owns every deliverable.",
    'tech-stack': "Primarily Swift and Objective-C for Apple platform development, C++ for performance-critical subsystems, Python for tooling and ML workflows. We use Radar (internal bug tracker), Xcode naturally, and internal CI infrastructure. For ML work the frameworks are Core ML and Create ML alongside PyTorch. Source control is through internal systems similar to Git with Gerrit-style review.",
    projects: "I can't share detailed roadmap specifics — confidentiality is taken seriously. What I can say is our team is working on core platform infrastructure with meaningful impact across the OS stack. You'll get project context after signing additional NDAs for specific programs.",
    career: "Apple levels run ICT2–ICT6 for individual contributors, with Distinguished Engineer above that. Promotions are manager-initiated and calibrated cross-functionally. The bar is high and deliberate — we're looking for sustained performance at the next level before promoting. I'll be explicit about what demonstration at the next level looks like for you.",
    schedule: "We're office-first — your role expects 4-5 days in Cupertino. Some roles have limited hybrid flexibility, but engineering teams are primarily on-site. Core collaboration happens 9am–6pm PT. The campus environment is designed for in-person collaboration and we lean into it.",
    tools: "Radar for bug tracking and project items, Xcode + internal build systems, internal wiki (Confluence-like), Slack for team communication, Quip for documents. Your IT onboarding will walk you through provisioning.",
    management: "My approach is direct and detail-oriented — in the Apple spirit. I'll review your work closely in your first 6 months and give specific feedback. As you demonstrate independence, I'll step back. I expect you to own your deliverables completely and communicate blockers early. We operate with a high trust, high accountability model.",
  },
  'jpmorgan.com': {
    greeting: "Welcome to JPMorgan. Your first few days will be structured through our onboarding program — we'll connect at your end-of-week check-in to see how things are going.",
    culture: "JPMC has a demanding, high-performance banking culture with a strong technology transformation mandate under the CTO office. Teams are driven by results, regulatory discipline, and client impact. There's significant investment in modernizing our tech stack and building best-in-class engineering capabilities. The environment is professional and fast-paced — expectations are high from day one.",
    'tech-stack': "Depending on your team: Java is the dominant backend language, Python for data science and automation, Kotlin for newer services. We use the Athena data platform for analytics, Hadoop/Spark for large-scale data processing, and internal risk management systems. Project SAIL manages our delivery lifecycle. The Senatus AI toolkit assists in code documentation and pattern detection. React for frontend.",
    projects: "Your team's current priorities are aligned with our Q2 delivery plan in Project SAIL. The key workstreams are: modernizing our position management API to reduce latency for trade confirmation flows, a compliance automation initiative tied to our CCAR regulatory cycle, and a data lineage project to satisfy BCBS 239 requirements. You'll get your project briefs after system access is provisioned.",
    career: "Our engineering ladder runs Associate → Vice President → Executive Director → Managing Director → Partner. Titles matter here — MD promotions are highly selective and require demonstrated business impact alongside technical depth. Senior VPs typically have 5-8 years in-house. I'll map your current experience to our band structure in our first formal 1:1.",
    compensation: "All compensation details were laid out in your offer letter. Annual bonuses are determined by firm performance, business unit performance, and individual contribution — the three-bucket model. Reviews happen in December with payouts in January. Equity (RSUs) vests over 3 years for your band.",
    benefits: "Medical/dental/vision with very competitive coverage and low employee contribution. JPMorgan's 401k match is one of the best in financial services. Parental leave at 16 weeks for primary caregivers. On-site health centers at major campus locations. See the HR portal for full details — access is provisioned on day one.",
    schedule: "We're office-first — 5 days in office is the expectation for most roles. Flexibility exists on a case-by-case basis for senior contributors but is not the norm. Core hours align with market hours (8am–5pm ET for NYC). Standups are brief, daily, and expected to be attended in-person.",
    team: "Your immediate team is part of the broader CTO Technology organization. Team sizes vary — your squad is 6 engineers reporting to me, embedded within a larger platform group of ~30. We work closely with product owners, risk management, and the compliance tech team.",
    tools: "Project SAIL for delivery tracking and sprint management, JIRA for task-level tracking, Confluence for documentation, GitHub Enterprise for source control, Jenkins for CI/CD. Communication is through Microsoft Teams — you'll get your Teams access provisioned day one.",
    management: "I run structured 1:1s weekly with a standard template: status, blockers, career. I value clear written communication — updates in Project SAIL should be current at all times. I give direct feedback in real-time, not buffered. If something is going wrong, you'll hear from me that day, not at review time.",
  },
  'anthropic.com': {
    greeting: "Hey, so glad you're here. The first few weeks are intentionally unstructured — explore, read, ask questions. Let's grab a sync tomorrow to map out your ramp.",
    culture: "Anthropic is a safety-first AI research lab that genuinely believes it may be building one of the most transformative and dangerous technologies in human history — and proceeds anyway because it believes safety-focused labs should be at the frontier. The culture is intellectually rigorous, collaborative, and unusually honest about uncertainty. People are expected to think for themselves, disagree openly, and change their minds when the evidence changes.",
    'tech-stack': "Python is universal. JAX and PyTorch for ML research and training. Most infrastructure runs on AWS. Claude API of course. TypeScript/React for product surfaces. Internal tooling is a mix of custom and off-the-shelf. We move fast on tooling — if something doesn't exist and you need it, build it.",
    projects: "Research and product priorities are set collaboratively in roadmap sessions. Current focus areas span: interpretability research into how models reason, constitutional AI and RLHF improvements, infrastructure for faster training iteration, and the Claude product surface. Your onboarding will include deep-dives with the relevant teams.",
    career: "Anthropic is still young enough that leveling is less formal than at a Google or Meta. The expectation is that you grow into senior technical leadership over your first 18 months. Promotion criteria emphasize: technical contribution, safety thinking integration, and mentorship of others. There are no fixed level timelines.",
    schedule: "Flexible hybrid — most people come in 2-3 days/week by choice. Research teams tend to cluster on certain days. No expectation to be online outside working hours except for critical incidents. We use Slack and async documentation heavily. Core hours exist informally (10am–4pm PT) but not enforced.",
    tools: "Slack, Notion, Linear for project tracking, GitHub for source control, internal experiment tracking systems. For ML runs: internal training cluster with custom orchestration. Claude API for testing and evaluation pipelines obviously.",
    management: "My approach is very hands-off once you've ramped. I set direction and check in weekly, but I expect you to own your work end-to-end. I'll give you feedback directly and expect the same from you. The culture here rewards pushing back when you disagree — I mean that genuinely.",
  },
  'openai.com': {
    greeting: "Welcome! Things move very fast here — that's intentional. Let's get you oriented quickly. I've set up an intro call for tomorrow.",
    culture: "OpenAI is mission-driven — the mission is ensuring AGI benefits all of humanity — and the culture reflects the weight of that. People work hard, move fast, and take the safety and capability research seriously. There's a strong intellectual culture and expectation of self-direction. The company is growing rapidly which means both opportunity and occasional organizational churn.",
    'tech-stack': "Python throughout. PyTorch as primary ML framework. Azure is our primary cloud. Kubernetes for orchestration. Triton for custom kernel development. Internal tooling for experiment tracking, evaluation, and model serving. TypeScript/React for product surfaces. You'll interface with the OpenAI API extensively.",
    projects: "Current priorities span model capability improvements, infrastructure scaling, API platform reliability, and safety research. Your role's specific workstream will be mapped in your ramp plan. Expect to be working on things that matter and move quickly.",
    career: "OpenAI is growing fast so career paths are actively being defined. Strong performers get increasing scope quickly. There's real opportunity to have outsized influence if you're good. Leveling is tied to impact and technical quality — I'll give you a clear picture of what the next level looks like in our first 1:1.",
    schedule: "We're hybrid with in-office expectations typically 3 days/week. The pace is fast so async communication via Slack matters. People are responsive during work hours; nights and weekends are generally your own unless there's an incident.",
    tools: "Linear for project/task management, GitHub for code, Slack for communication, Notion for docs, internal experiment tracking for research. Azure Portal and Azure DevOps for infrastructure work.",
    management: "Direct, fast-moving, and feedback-forward. I give feedback in real-time, not cached. I expect you to own your work and raise blockers early. 1:1s are weekly and you own the agenda. The culture here rewards intellectual honesty over comfort — I'll model that and expect it.",
  },
  'nvidia.com': {
    greeting: "Welcome! GPU computing at scale is what we do — and you'll feel the intensity of that from day one. Let me walk you through your first week plan.",
    culture: "NVIDIA is engineering-excellence-first with a founder-led culture that's intensely focused on GPU computing leadership. The pace is demanding. Jensen Huang sets an extremely high bar and it permeates every level. People are deeply technical and take performance seriously. Collaboration across hardware, software, and AI teams is frequent and necessary.",
    'tech-stack': "CUDA C++ for GPU compute kernels, Python for tooling and ML, C++ for systems, Triton for ML compiler work, TensorRT for inference optimization, cuDNN for deep learning primitives. PyTorch is the ML framework of choice. Infrastructure runs on our own DGX and HGX systems. MLPerf benchmarks are taken very seriously here.",
    projects: "Our team's Q2 focus is on the next-gen inference optimization stack, improving throughput for transformer architectures by 30%+, and contributing to the CUDA toolchain for our upcoming architecture. I can share more specifics after access provisioning.",
    career: "IC ladder: L1–L5 for engineering, with L5+ being very senior principal or distinguished levels. Promotions are driven by sustained technical impact and external recognition (papers, benchmarks, customer impact). NVIDIA rewards depth — if you're the world's best at something, that's valued here.",
    schedule: "Office-first culture — 4-5 days on-site is the expectation for engineering teams. Santa Clara campus has strong facilities. Hours are flexible in timing but the expectation is full-time intensity. Oncall for critical infrastructure teams is compensated.",
    tools: "Jira for project tracking, GitHub Enterprise for source control, Jenkins/Gitlab CI for build systems, internal benchmark tracking, custom profiling and debugging tools specific to CUDA development.",
    management: "Technically deep management style — I'll review your code and architecture decisions closely. I expect high quality and will give specific technical feedback. 1:1s are weekly; you can raise anything. The bar is high but so is the support.",
  },
  'netflix.com': {
    greeting: "Welcome to Netflix. Keeper test culture is real — and so is the freedom and responsibility it implies. Let's connect tomorrow to walk through how our team operates.",
    culture: "Netflix operates on a high-talent-density, freedom-and-responsibility model. There are no vacation policies, no approval chains for most decisions, and no micromanagement. Adults are hired and treated as such. The tradeoff is the bar for performance is high and sustained — the keeper test is not hypothetical. Context is shared openly; control is minimal.",
    'tech-stack': "Java and Kotlin for backend microservices, Python for data science and ML, Spinnaker (which we open-sourced) for deployment, AWS for all infrastructure, Apache Kafka for event streaming, Cassandra for distributed storage, Conductor for workflow orchestration, Flink for stream processing. Data infra runs on Spark/Iceberg/Hive on S3.",
    projects: "Current team focus: improving our recommendation engine's offline-to-online gap metrics, reducing infrastructure cost for our A/B testing platform by 20%, and building a new quality-of-experience metric pipeline. You'll be brought up to speed on specifics your first week.",
    career: "Netflix doesn't have formal levels in the traditional sense. You're evaluated on impact and fit for the role. Titles are Senior Engineer for most engineering roles. Compensation is top-of-market by design — we pay the top of the market for each role. If you're performing, comp follows.",
    benefits: "Unlimited PTO (we mean it — people actually take it), generous parental leave, top-tier health coverage, 401k, home office stipend. Netflix does not have a stock vesting cliff — RSUs grant quarterly. The compensation philosophy is cash-heavy at the senior levels.",
    schedule: "No core hours policy — work when it's effective for you. Async-first communication via Slack. Meetings are kept minimal and require pre-reads. In-office expectations vary by team — confirm your specific arrangement with HR.",
    tools: "Jira for project tracking, Confluence for docs, GitHub for source control, Spinnaker for deployment, PagerDuty for oncall, Grafana/Atlas for metrics, custom internal tooling for experiment analysis.",
    management: "I won't tell you how to do your job. I'll give you context on what we're trying to achieve and let you figure out the best way to get there. Feedback is direct and immediate. 1:1s are weekly and you should use them to discuss your work and your career. I want to know when something isn't working before it becomes a problem.",
  },
  'samsung.com': {
    greeting: "Welcome to Samsung. The scale of what we build is remarkable — you'll see that immediately. Your access cards and laptop should be ready at the desk. Let's connect this afternoon.",
    culture: "Samsung is a global engineering-at-scale culture with Korean corporate roots. Speed, precision, and hardware-software integration mastery are core values. There is a strong hierarchy and project lifecycle discipline. Our CognitiV system uses ML to optimize project timelines across teams. Cross-time-zone collaboration with Seoul, Suwon, and Vietnam teams is a regular part of engineering work.",
    'tech-stack': "C and C++ for hardware-adjacent software, Java for platform layers, Python for tooling and AI work, Tizen OS for IoT/wearables, Android/AOSP for mobile, Exynos chip firmware for SoC team. Our internal Project Life Cycle Management Portal tracks all work. CognitiV Network Operations Suite monitors and predicts delivery timelines.",
    projects: "Our team's current sprint is tracked in the Samsung Portal. Active initiatives include a power management optimization for our next mobile platform, firmware stability work across device variants, and a data pipeline for our CognitiV AI prediction system. Sprint reviews happen every two weeks with KPI reporting to the Seoul engineering leadership.",
    career: "Samsung career progression in the US engineering org follows a band system from P1 through P5 for ICs, with Sr. Principal and Fellow levels above that. Promotions require a nomination process with performance history and project impact documentation. Strong technical contributors can move quickly in the current AI/mobile build-out.",
    schedule: "Office-first — 4-5 days in office expectation. Core hours are 9am–6pm with team syncs at 8am for Korea alignment calls (twice weekly). Hybrid flexibility exists for some roles at senior levels.",
    tools: "Samsung Portal (internal PLCM) for project lifecycle management, CognitiV for ML-powered timeline prediction, Jira for task-level tracking in some orgs, GitHub Enterprise for source control, Microsoft Teams for communication (global teams), Confluence for documentation.",
    management: "I run structured weekly 1:1s and expect written status updates in the Portal before Monday each week. I value clear communication and minimal surprises on timelines. Feedback is direct — the culture here is not to sugarcoat technical or delivery issues. I will advocate for you in calibration meetings if your work merits it.",
  },
};

// ── Archetype fallback responses ──────────────────────────────────────────────

const ARCHETYPE_KNOWLEDGE: Record<string, Knowledge> = {
  finance: {
    greeting: "Welcome to the team. I've set up a structured onboarding plan for your first two weeks — you'll meet with each key stakeholder in your first five days.",
    culture: "The culture here is performance-driven and client-centric. We hold a high standard for accuracy and communication. Regulatory compliance is a core part of everything we do, not an afterthought. People are direct and expect you to ask questions when something isn't clear.",
    'tech-stack': "Python is the primary language for analysis and automation. Java or C++ for performance-critical systems depending on the team. We use Bloomberg extensively for market data, SQL-based warehouses for reporting, and internal risk management systems. Your stack access will be provisioned through IT on your first day.",
    projects: "The team's current priorities are tied to our Q2 delivery commitments. I'll walk you through the project board in our first 1:1. Key themes: regulatory reporting uplift, client analytics improvements, and internal tooling to reduce manual processes.",
    career: "Career progression in finance organizations tends to be clearly laddered. At this firm, advancement requires demonstrated technical impact, client feedback, and mentor endorsement. I'll give you explicit milestones to target in your first 90-day plan.",
    schedule: "The expectation is office-presence five days a week. Market hours create natural anchors for the day — generally 8am–5:30pm. Senior flexibility increases over time. We respect time outside working hours.",
    tools: "Bloomberg Terminal for market data, internal project tracking system, Confluence for documentation, Microsoft Teams for communication, Excel/Python for analysis, and our risk management platform. Your IT access list was sent to your company email.",
    management: "Weekly 1:1s, structured agenda, direct feedback. I operate with transparency — you'll always know where you stand. I expect written updates before our weekly meeting so we can use that time for real conversation.",
  },
  tech: {
    greeting: "Hey, welcome! Really glad to have you here. No structured ramp — just start exploring the codebase, ask questions in Slack, and let's meet tomorrow for context.",
    culture: "Engineering-first culture with high autonomy and a bias toward shipping. We use data to make decisions and expect engineers to own the full lifecycle of their work — from scoping to production to monitoring. The bar for quality is high but so is the speed.",
    'tech-stack': "Depends on the team, but broadly: Python or Go for backend, React/TypeScript for frontend, Kubernetes on a major cloud provider (AWS/GCP/Azure), Kafka for streaming, Postgres or a distributed SQL system for storage, Terraform for infra. You'll get a full runbook on your specific stack after access provisioning.",
    projects: "Current sprint focus is on reliability improvements and new feature velocity. I'll do a roadmap walkthrough in our second 1:1. Key themes: service latency reduction, CI/CD improvements, and one new product feature shipping this quarter.",
    career: "Levels range from engineer to senior engineer to staff and beyond. Promo timelines depend entirely on impact. I'll give you clear expectations for what the next level requires within your first month. Strong performers at this company tend to move quickly.",
    schedule: "Hybrid — typically 2-3 days in office by team convention, fully flexible on timing. Core hours for synchronous work are 10am–4pm. Async-first for status updates. No expectation to be available nights or weekends.",
    tools: "Jira or Linear for task tracking, GitHub for source control, Slack for communication, Figma for design, Grafana for monitoring, PagerDuty for oncall. Full access provisioned on day one.",
    management: "Coaching-first approach. Weekly 1:1s, you own the agenda. I'll remove blockers and give context, you own execution. Real-time feedback on work — I won't save critique for a quarterly review.",
  },
  consulting: {
    greeting: "Welcome. Your first engagement is already being scoped — let's meet this afternoon to discuss your onboarding and client assignment.",
    culture: "Consulting culture rewards structured thinking, clear communication, and client-first orientation. People here are sharp, work hard, and take ownership of their deliverables. The model is project-based — you'll move between clients and problem domains regularly, which requires adaptability.",
    'tech-stack': "Varies by engagement. Common tools: Python and R for analysis, SQL for data work, Excel and PowerPoint for deliverables, Tableau or Power BI for visualization. Technical consulting roles may involve specific client technology environments. We match your skills to the right engagement type.",
    projects: "Your first engagement assignment will be confirmed in your first week. Engagements typically span 3-18 months. Current pipeline includes work in financial services transformation, data analytics strategy, and digital operations. You'll be matched based on skills and availability.",
    career: "The ladder runs: Analyst → Consultant → Senior Consultant → Manager → Senior Manager → Principal → Partner. Promotion to Manager is typically a 3-4 year track from Analyst, faster with exceptional performance. Client feedback and leadership assessment both factor heavily into promotion decisions.",
    schedule: "Consulting hours are engagement-dependent. Client travel can range from minimal to 4 days/week depending on client location and phase. Delivery periods near milestones involve longer hours. Work-life balance is better between engagements.",
    tools: "Adobe Workfront or client-specific PM tools for delivery tracking, Microsoft Office Suite, Slack or Teams for internal communication, Tableau/Power BI for analytics deliverables. Client systems accessed as needed under NDA.",
    management: "Project-based management model. Your engagement lead manages day-to-day, I manage your overall career and staffing. Feedback happens continuously during engagements and formally at mid-year and year-end reviews.",
  },
  startup: {
    greeting: "Hey! So glad you're here. We move fast — by end of week two I expect you to have shipped something. Let's grab lunch today and I'll give you the full lay of the land.",
    culture: "High ownership, low bureaucracy. We expect everyone to make good decisions with limited information and to communicate proactively when something isn't working. The team is small so every contribution is visible and meaningful. We're building something people genuinely want, and that keeps the energy high.",
    'tech-stack': "Probably TypeScript/Python/Go depending on your team, deployed to AWS or GCP, Postgres for storage, Redis for caching, Kafka if we're doing streams. GitHub, Terraform, Docker. If something is missing that you need, you can propose and adopt it — we don't have legacy lock-in.",
    projects: "Right now we're focused on three things: shipping the v2 of our core product surface, migrating our data infrastructure to something scalable, and building the reliability foundation before our Series B growth. You'll own a real piece of this from week one.",
    career: "We're early enough that career paths are what you make them. Strong contributors get equity refreshes and title progression. I'd rather you build something important and get promoted into a title than hold a title without the substance behind it.",
    schedule: "Flexible. Ship when it's done. We have a team standup at 10am and that's the only fixed meeting. Core collaboration happens async in Slack. The founding team is usually around — if you need context, ask.",
    tools: "Linear for project tracking, GitHub, Slack, Notion for docs. That's mostly it. We keep tooling minimal.",
    management: "Direct and fast. I give feedback in the moment. Weekly 1:1s are mostly me unblocking you and you telling me what you need. If something is going wrong I'd rather know today than next sprint.",
  },
  industrial: {
    greeting: "Welcome aboard. Your workstation and system access should be ready today. I've scheduled your plant/site orientation for tomorrow morning.",
    culture: "Operational excellence and process discipline define our culture. Safety is always the first priority — no deliverable is worth cutting safety corners. Engineering decisions are thorough and documented. We move deliberately because mistakes at our scale are costly.",
    'tech-stack': "Depends on function: Python for analytics and automation, SAP for ERP, SCADA/DCS systems for operations, MATLAB for engineering simulation, GIS tools for location-based work. Azure or AWS for cloud workloads. Your specific stack will be outlined in your role brief.",
    projects: "Current team priorities include a process optimization initiative expected to reduce operational costs by 8%, a compliance-driven data lineage project, and a digital twin pilot for one of our production facilities. I'll walk you through the project board in our first 1:1.",
    career: "Progression is clear and documented. Engineer → Senior Engineer → Principal Engineer → Technical Fellow, with management tracks parallel. Promotions require documented project impact and peer endorsement. Review cycles are annual with mid-year check-ins.",
    schedule: "Office or site-based role — typically 5 days on-site or plant. Core operational hours apply. Some flexibility for office-function roles. Overtime is compensated per policy.",
    tools: "SAP for enterprise functions, Microsoft Teams for communication, Workfront or similar PM tool for project tracking, Confluence for documentation, Tableau or Power BI for analytics reporting.",
    management: "Structured approach — weekly 1:1s with agenda, formal performance reviews twice annually. I give direct feedback and expect the same. Safety concerns are always raised immediately.",
  },
  healthcare: {
    greeting: "Welcome. Healthcare organizations have additional compliance onboarding — your HIPAA training is scheduled for day two. Let's connect this afternoon to walk through your first 30 days.",
    culture: "Patient outcomes drive everything. Regulatory compliance is non-negotiable — mistakes in healthcare have real human consequences. The culture values rigor, cross-functional collaboration with clinical teams, and evidence-based decision-making. We move carefully and document thoroughly.",
    'tech-stack': "Python and R for clinical data science, SAS for regulatory analytics, SQL for data access, Veeva for clinical document management, LIMS for laboratory systems, AWS or Azure for cloud workloads. Specific tools vary by function. HIPAA and FDA 21 CFR Part 11 compliance governs how we handle data.",
    projects: "Current team initiatives span: a clinical data quality improvement project to reduce source data discrepancy rates, an automation effort for regulatory submission preparation, and a new analytics dashboard for trial enrollment tracking. You'll get a detailed brief after system access is established.",
    career: "Healthcare organizations have well-defined career ladders from individual contributor to senior specialist to management. Scientific roles may lead to medical director tracks. Technical roles ladder through engineering levels. Promotions require sustained performance and peer endorsement.",
    schedule: "Standard business hours with some flexibility depending on your role. Clinical operations roles may have more rigid schedules tied to study timelines. Remote flexibility varies — some functions are office-required for regulatory reasons.",
    tools: "Veeva Vault for document management, Medidata or Oracle Clinical for trial management, Workfront for project tracking, Teams for communication, Tableau for analytics, SAP for finance/supply chain.",
    management: "Detail-oriented and process-driven management style appropriate for our regulated environment. Weekly 1:1s with formal documentation. Feedback is direct and documented. Any compliance concerns are escalated immediately.",
  },
};

export function generateManagerResponse(
  message: string,
  domain: string,
  _role: string,
  managerName: string,
  archetype: string
): string {
  const topic = detectTopic(message);
  const companyKnowledge = COMPANY_KNOWLEDGE[domain];
  const archetypeKnowledge = ARCHETYPE_KNOWLEDGE[archetype] ?? ARCHETYPE_KNOWLEDGE['tech'];

  const response = companyKnowledge?.[topic] ?? archetypeKnowledge[topic] ?? archetypeKnowledge['general'] ??
    "Good question. Let me think about the best way to address that. Can we put it on the agenda for our next 1:1 so I can give you a thorough answer?";

  // Occasionally personalize with manager name
  const personalizations = [
    response,
    response,
    response,
    `${response.replace(/^(Hey|Hi|Welcome)[,.]?\s*/i, '')}`.trim() || response,
  ];

  void managerName; // used for personalization elsewhere
  return personalizations[Math.floor(Math.random() * personalizations.length)];
}
