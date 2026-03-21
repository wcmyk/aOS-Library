export type HiddenMaturityTier =
  | 'Startup'
  | 'Mid-Level'
  | 'Senior'
  | 'Veteran'
  | 'Pivotal'
  | 'Government'
  | 'Anchor';

export type RoleCredibility =
  | 'highly_credible_technical_initiator'
  | 'semi_technical_recommender'
  | 'low_authority_observer'
  | 'non_credible_initiator';

export type SolutionPathId =
  | 'accept_pain'
  | 'manual_process_hardening'
  | 'csv_governance'
  | 'lightweight_automation'
  | 'transactional_messaging_only'
  | 'crm_cleanup_first'
  | 'backend_foundation_first'
  | 'internal_engineering_solution'
  | 'delay_pending_readiness'
  | 'sfmc_exploration'
  | 'sfmc_implementation';

export type ReadinessDimension =
  | 'budget'
  | 'technical'
  | 'data'
  | 'governance'
  | 'stakeholder_alignment'
  | 'compliance'
  | 'implementation_ownership'
  | 'operational_maintenance';

export type ReadinessScore = 1 | 2 | 3 | 4 | 5;

export type JobOffer = {
  id: string;
  roleTitle: string;
  department: string;
  reportingManagerType: string;
  seniorityLevel: string;
  technicalExpectationLevel: 'low' | 'medium' | 'high' | 'very_high';
  playerFacingSummary: string;
  primarySystems: string[];
  expectedBusinessResponsibilities: string[];
  expectedTechnicalResponsibilities: string[];
  likelyStakeholders: string[];
  likelyIncidentExposure: string[];
  likelyDecisionMakingAuthority: string;
  expectedOwnership: string[];
  roleScope: {
    responsibilities: string[];
    systemAccess: string[];
    artifactsAccessibleByDefault: string[];
    managerExpectations: string[];
    escalationAuthority: string[];
    caseTypes: string[];
    evaluationFocus: string[];
    credibilityClass: RoleCredibility;
  };
};

export type MaturityProfile = {
  tier: HiddenMaturityTier;
  operationalMaturity: string;
  dataMaturity: string;
  marketingAutomationMaturity: string;
  likelySystemLandscape: string[];
  documentationQuality: string;
  namingConventionQuality: string;
  governanceQuality: string;
  typicalIncidentPatterns: string[];
  likelyArtifacts: string[];
  realisticFixes: string[];
  expectedPlayerWork: string[];
  realisticSolutionPaths: SolutionPathId[];
};

export type CompanyContext = {
  companyName: string;
  hiddenMaturityTier: HiddenMaturityTier;
  industry: string;
  businessModel: string;
  productsAndServices: string[];
  revenueMotion: string;
  geographicScope: string;
  majorCustomerSegments: string[];
  customerLifecycleModel: {
    customerTypes: string[];
    lifecycleStages: string[];
    majorCustomerEvents: string[];
    retentionModel: string;
    transactionalMoments: string[];
    marketingMoments: string[];
    supportInteractionsAffectingMessaging: string[];
  };
  internalOrganization: {
    teams: Array<{ name: string; responsibilities: string[] }>;
    typicalIncidentOpeners: string[];
    upstreamDataOwners: string[];
    campaignExecutionOwner: string;
    transactionalSystemOwners: string[];
    consentDecisionOwners: string[];
    launchSignoffOwners: string[];
  };
  systemLandscape: {
    crmSystems: string[];
    productAndServiceSystems: string[];
    supportSystems: string[];
    eventSystems: string[];
    warehouseAndReportingSystems: string[];
    sfmcFootprint: 'absent' | 'partial' | 'mature';
    processAutomationLevel: 'manual' | 'semi_automated' | 'fully_integrated';
    marketingDataIngressPatterns: string[];
  };
  dataReality: {
    primaryBusinessIdentifiers: string[];
    customerIdentifiers: string[];
    accountOrSubscriberIdentifiers: string[];
    operationalObjectIdentifiers: string[];
    commonProfileFields: string[];
    commonEventFields: string[];
    commonConsentFields: string[];
    namingConventions: string[];
    likelyDataQualityIssues: string[];
    exampleObjects: Array<{
      objectName: string;
      systemOfRecord: string;
      primaryKey: string;
      sampleFields: string[];
    }>;
  };
  namingAndOperationalConventions: {
    campaignPattern: string;
    journeyPattern: string;
    dataExtensionPattern: string;
    automationPattern: string;
    apiEventPattern: string;
    internalAbbreviations: string[];
    companyTerminology: string[];
  };
  organizationalFriction: {
    failurePoints: string[];
    crossTeamMisalignments: string[];
    documentationGaps: string[];
    qaLimitations: string[];
    governanceIssues: string[];
    approvalBottlenecks: string[];
    legacyDependencies: string[];
    operationalShortcuts: string[];
  };
  jobOffers: JobOffer[];
  hiddenReadinessScores: Record<ReadinessDimension, ReadinessScore>;
};

export type SolutionPath = {
  id: SolutionPathId;
  label: string;
  bestFitCompanies: string[];
  businessSymptoms: string[];
  supportingObjections: string[];
  tradeoffs: string[];
  whenMoreRealisticThanSfmc: string[];
  alignedManagerResponses: string[];
};

export type ArtifactDefinition = {
  artifactType: string;
  description: string;
  reveals: string[];
  reliabilityProfile: string;
  availability: 'always' | 'common' | 'maturity_dependent' | 'rare';
  likelyTiers: HiddenMaturityTier[];
  likelyRoles: string[];
};

export const hiddenMaturityFramework: MaturityProfile[] = [
  {
    tier: 'Startup',
    operationalMaturity: 'Operator knowledge lives in people, inboxes, and spreadsheets instead of stable process maps.',
    dataMaturity: 'Identifiers are inconsistent, exports are hand-joined, and historical backfills are patchy.',
    marketingAutomationMaturity: 'Manual sends, lightweight tools, or an early partial implementation dominate.',
    likelySystemLandscape: ['basic CRM', 'shared spreadsheets', 'CSV uploads', 'help desk', 'possible ESP or no centralized platform'],
    documentationQuality: 'Sparse, ad hoc, and often outdated within weeks.',
    namingConventionQuality: 'Loose naming with team-specific shortcuts and collisions.',
    governanceQuality: 'Weak governance, fast decisions, and little formal approval discipline.',
    typicalIncidentPatterns: ['wrong audience from CSV misuse', 'duplicate sends', 'broken import mapping', 'manual suppression misses'],
    likelyArtifacts: ['spreadsheet export', 'manual CSV', 'Slack or Teams chat', 'basic ticket', 'tribal knowledge notes'],
    realisticFixes: ['tighten spreadsheet process', 'introduce naming standards', 'add QA checklist', 'delay platform expansion'],
    expectedPlayerWork: ['triage operational pain', 'document process', 'clean source fields', 'recommend realistic small steps'],
    realisticSolutionPaths: ['accept_pain', 'manual_process_hardening', 'csv_governance', 'lightweight_automation', 'crm_cleanup_first'],
  },
  {
    tier: 'Mid-Level',
    operationalMaturity: 'Core workflows exist but rely on key individuals and inconsistent handoffs.',
    dataMaturity: 'Some canonical fields exist, but sync gaps and uneven ownership create recurring drift.',
    marketingAutomationMaturity: 'Partially integrated automation with uneven campaign discipline and fragile workarounds.',
    likelySystemLandscape: ['CRM', 'ticketing', 'basic warehouse', 'mixed manual uploads', 'entry or partial automation platform'],
    documentationQuality: 'Usable in spots, missing around edge cases and legacy jobs.',
    namingConventionQuality: 'Documented in theory, inconsistently followed in practice.',
    governanceQuality: 'Approvals exist, but they are bypassed under deadline pressure.',
    typicalIncidentPatterns: ['field sync mismatch', 'journey entry criteria drift', 'consent timing gaps', 'manual file dependency failures'],
    likelyArtifacts: ['ticket', 'journey summary', 'SQL snippet', 'spreadsheet export', 'email thread'],
    realisticFixes: ['repair source mappings', 'formalize intake', 'stabilize data contracts', 'add lightweight monitoring'],
    expectedPlayerWork: ['investigate evidence across systems', 'propose sequencing', 'separate immediate fix from foundational work'],
    realisticSolutionPaths: ['manual_process_hardening', 'csv_governance', 'lightweight_automation', 'crm_cleanup_first', 'backend_foundation_first', 'sfmc_exploration'],
  },
  {
    tier: 'Senior',
    operationalMaturity: 'Established operating model with repeatable launches, but still imperfect at the seams.',
    dataMaturity: 'Shared identifiers and warehouse reporting exist, though upstream ownership is not always clean.',
    marketingAutomationMaturity: 'Meaningful automation footprint with production dependencies and non-trivial technical debt.',
    likelySystemLandscape: ['CRM', 'support platform', 'warehouse', 'product events', 'integration middleware', 'partial or mature automation platform'],
    documentationQuality: 'Good for core processes, thin around exceptions, inherited legacy components, and emergency fixes.',
    namingConventionQuality: 'Mostly standardized with legacy holdouts.',
    governanceQuality: 'Moderate governance with documented approvals and known exception paths.',
    typicalIncidentPatterns: ['cross-system identifier mismatch', 'stale suppression logic', 'launch sequencing failure', 'partial API retry issues'],
    likelyArtifacts: ['formal ticket', 'config summary', 'send log excerpt', 'mapping document', 'launch checklist'],
    realisticFixes: ['repair integration contract', 'resequence automation', 'adjust source-of-truth ownership', 'refactor brittle jobs'],
    expectedPlayerWork: ['root cause analysis', 'blast-radius assessment', 'practical remediation planning', 'cross-functional escalation'],
    realisticSolutionPaths: ['crm_cleanup_first', 'backend_foundation_first', 'internal_engineering_solution', 'sfmc_exploration', 'sfmc_implementation'],
  },
  {
    tier: 'Veteran',
    operationalMaturity: 'Mature operations exist, but they are burdened by legacy estates and historical exceptions.',
    dataMaturity: 'Rich historical data with overlapping models, duplicated objects, and merger-era inconsistencies.',
    marketingAutomationMaturity: 'Powerful automation stack with accumulated debt, duplicated journeys, and long-lived dependencies.',
    likelySystemLandscape: ['multiple CRMs or business units', 'warehouse', 'legacy ETL', 'service platform', 'entrenched automation stack'],
    documentationQuality: 'Extensive but fragmented across eras, teams, and file stores.',
    namingConventionQuality: 'Strong in new work, inconsistent in inherited assets.',
    governanceQuality: 'Formal governance, but exceptions have compounded over time.',
    typicalIncidentPatterns: ['legacy dependency regression', 'business-unit conflict', 'shared suppression collision', 'orphaned automation failure'],
    likelyArtifacts: ['runbook', 'legacy spec', 'BU config export', 'approval thread', 'incident timeline'],
    realisticFixes: ['contain blast radius', 'decommission legacy path', 'introduce ownership matrix', 'phase migration instead of full rebuild'],
    expectedPlayerWork: ['trace historical dependencies', 'navigate political ownership', 'choose practical modernization path'],
    realisticSolutionPaths: ['crm_cleanup_first', 'backend_foundation_first', 'internal_engineering_solution', 'delay_pending_readiness', 'sfmc_implementation'],
  },
  {
    tier: 'Pivotal',
    operationalMaturity: 'High-tempo digital operations where revenue and product telemetry drive daily prioritization.',
    dataMaturity: 'Event-heavy and analytics-forward, but sensitive to latency, experimentation conflicts, and growth hacks.',
    marketingAutomationMaturity: 'Advanced orchestration is possible, but every change is judged against speed and ROI.',
    likelySystemLandscape: ['product analytics', 'CDP or event bus', 'warehouse', 'CRM', 'real-time messaging services'],
    documentationQuality: 'Strong in engineering-owned surfaces, thinner in ad hoc growth workflows.',
    namingConventionQuality: 'Generally strong because scale requires it.',
    governanceQuality: 'Focused on revenue risk, data access, and experiment hygiene more than committee approvals.',
    typicalIncidentPatterns: ['event schema drift', 'real-time trigger duplication', 'rate-limit failures', 'mis-prioritized lifecycle orchestration'],
    likelyArtifacts: ['event payload', 'monitoring alert', 'experiment note', 'SWE intake', 'postmortem excerpt'],
    realisticFixes: ['stabilize event contracts', 'route to transactional channel only', 'add observability', 'sequence platform work behind data contracts'],
    expectedPlayerWork: ['reason about event flows', 'protect revenue moments', 'balance speed with maintainability'],
    realisticSolutionPaths: ['transactional_messaging_only', 'backend_foundation_first', 'internal_engineering_solution', 'sfmc_exploration', 'sfmc_implementation'],
  },
  {
    tier: 'Government',
    operationalMaturity: 'Structured, approval-heavy operations with rigid process and long change cycles.',
    dataMaturity: 'Constrained by compliance, legacy records, and strict sharing controls.',
    marketingAutomationMaturity: 'Usually limited, tightly scoped, and heavily reviewed.',
    likelySystemLandscape: ['legacy CRM', 'case management', 'records systems', 'security review queue', 'limited automation tooling'],
    documentationQuality: 'High volume of documentation, but hard to navigate and frequently procedural.',
    namingConventionQuality: 'Strong where mandated by policy.',
    governanceQuality: 'Very high governance with formal approvals, security review, and auditability.',
    typicalIncidentPatterns: ['approval delay', 'consent ambiguity', 'policy-driven suppression issue', 'legacy extract timing failure'],
    likelyArtifacts: ['approval memo', 'security questionnaire', 'launch signoff', 'records mapping doc', 'service ticket'],
    realisticFixes: ['document policy interpretation', 'tighten extracts', 'limit scope', 'delay change pending review'],
    expectedPlayerWork: ['justify every change', 'surface compliance impact', 'recommend narrower safe options'],
    realisticSolutionPaths: ['accept_pain', 'manual_process_hardening', 'transactional_messaging_only', 'delay_pending_readiness', 'backend_foundation_first'],
  },
  {
    tier: 'Anchor',
    operationalMaturity: 'Enterprise-scale operating model with specialization, strict governance, and high blast-radius awareness.',
    dataMaturity: 'Large, governed data estate with multiple mastered identifiers and formal stewardship.',
    marketingAutomationMaturity: 'Sophisticated cross-channel capability with deep platform ownership and integration complexity.',
    likelySystemLandscape: ['multiple business units', 'enterprise CRM', 'warehouse and lakehouse', 'identity services', 'mature automation platform', 'formal middleware'],
    documentationQuality: 'Comprehensive for supported flows, with governance repositories and change records.',
    namingConventionQuality: 'Strict standards enforced through review.',
    governanceQuality: 'High governance, architecture review, security review, and release discipline.',
    typicalIncidentPatterns: ['enterprise dependency break', 'global suppression impact', 'cross-BU schema conflict', 'regional compliance variance'],
    likelyArtifacts: ['architecture review', 'BU inventory', 'formal runbook', 'launch approval pack', 'monitoring and send logs'],
    realisticFixes: ['targeted remediation with rollback plan', 'architecture-backed redesign', 'ownership realignment', 'phased implementation'],
    expectedPlayerWork: ['work across governance forums', 'distinguish local vs enterprise change', 'justify long-term architecture decisions'],
    realisticSolutionPaths: ['backend_foundation_first', 'internal_engineering_solution', 'delay_pending_readiness', 'sfmc_exploration', 'sfmc_implementation'],
  },
];

export const solutionPathFramework: SolutionPath[] = [
  {
    id: 'accept_pain',
    label: 'Do nothing / accept temporary operational pain',
    bestFitCompanies: ['cash-constrained startups', 'regulated orgs facing freeze periods', 'teams with low case frequency'],
    businessSymptoms: ['issue is intermittent', 'blast radius is low', 'workaround cost is currently tolerable'],
    supportingObjections: ['no owner', 'no budget', 'current quarter priorities are elsewhere'],
    tradeoffs: ['pain persists', 'manual effort continues', 'future incidents remain likely'],
    whenMoreRealisticThanSfmc: ['platform discussions would outpace current staff and budget', 'root issue is not messaging-platform related'],
    alignedManagerResponses: ['acknowledge the gap', 'ask for a temporary runbook', 'defer larger investment to planning cycle'],
  },
  {
    id: 'manual_process_hardening',
    label: 'Manual process hardening',
    bestFitCompanies: ['Startup', 'Mid-Level', 'Government process-bound teams'],
    businessSymptoms: ['errors come from handoff mistakes', 'there is no stable checklist', 'few people know the real process'],
    supportingObjections: ['automation would codify a broken process', 'data is not stable enough yet'],
    tradeoffs: ['slower scaling', 'continued human dependency', 'limited observability'],
    whenMoreRealisticThanSfmc: ['headcount and process discipline are missing', 'root cause is launch process rather than platform depth'],
    alignedManagerResponses: ['request SOPs', 'assign owners', 'add QA and sign-off checkpoints'],
  },
  {
    id: 'csv_governance',
    label: 'Spreadsheet and CSV governance improvements',
    bestFitCompanies: ['Startup or Mid-Level teams still driven by exports'],
    businessSymptoms: ['wrong audience selection', 'column drift', 'manual dedupe errors', 'last-minute file swaps'],
    supportingObjections: ['data does not enter through APIs yet', 'teams still depend on analysts and marketers sharing files'],
    tradeoffs: ['manual work remains', 'controls are brittle', 'auditing is limited'],
    whenMoreRealisticThanSfmc: ['file discipline is the main failure mode and platform spend would not fix the source issue'],
    alignedManagerResponses: ['standardize templates', 'lock column dictionaries', 'require file validation before send'],
  },
  {
    id: 'lightweight_automation',
    label: 'Lightweight marketing automation platform',
    bestFitCompanies: ['growing teams with moderate send volume and simple lifecycle needs'],
    businessSymptoms: ['basic nurture demand', 'need for scheduled sends', 'limited integration complexity'],
    supportingObjections: ['full enterprise tooling is overkill', 'team lacks platform owner'],
    tradeoffs: ['future migration risk', 'less deep customization', 'event handling may remain limited'],
    whenMoreRealisticThanSfmc: ['company needs operational relief, not enterprise orchestration'],
    alignedManagerResponses: ['compare cost tiers', 'ask about admin burden', 'prioritize speed to value'],
  },
  {
    id: 'transactional_messaging_only',
    label: 'Transactional-only messaging solution',
    bestFitCompanies: ['product-led or regulated orgs focused on receipts, alerts, and service messages'],
    businessSymptoms: ['core pain is around operational notifications', 'marketing orchestration is immature or risky'],
    supportingObjections: ['promotional use cases are not approved', 'backend events matter more than campaign design'],
    tradeoffs: ['marketing remains limited', 'cross-channel orchestration is deferred'],
    whenMoreRealisticThanSfmc: ['company only needs reliable service messaging and lacks broader lifecycle readiness'],
    alignedManagerResponses: ['scope narrowly', 'prioritize uptime', 'require engineering and security review'],
  },
  {
    id: 'crm_cleanup_first',
    label: 'CRM cleanup or CRM-first approach',
    bestFitCompanies: ['teams with duplicate contact records, weak ownership, or unclear audience logic'],
    businessSymptoms: ['segment logic is inconsistent', 'contact identifiers collide', 'sales and marketing disagree on status'],
    supportingObjections: ['automation will amplify dirty data', 'consent cannot be trusted'],
    tradeoffs: ['slower visible progress', 'frustrating for teams wanting immediate campaigns'],
    whenMoreRealisticThanSfmc: ['source-of-truth quality is the gating issue'],
    alignedManagerResponses: ['ask who owns fields', 'fund dedupe work', 'sequence messaging after CRM cleanup'],
  },
  {
    id: 'backend_foundation_first',
    label: 'Backend/data foundation work before platform adoption',
    bestFitCompanies: ['Senior+', 'Pivotal', 'Anchor', 'Mid-Level firms with real scale but weak data contracts'],
    businessSymptoms: ['events are missing or unstable', 'APIs are not production-ready', 'ownership is unclear'],
    supportingObjections: ['platform purchase will not create clean contracts', 'integration support is absent'],
    tradeoffs: ['delayed business-facing launch', 'heavier engineering dependency'],
    whenMoreRealisticThanSfmc: ['the company lacks the infrastructure needed for safe orchestration'],
    alignedManagerResponses: ['loop in engineering', 'request sequencing plan', 'fund foundational instrumentation first'],
  },
  {
    id: 'internal_engineering_solution',
    label: 'Internal engineering-built solution',
    bestFitCompanies: ['Pivotal and Anchor companies with strong engineering and event architecture'],
    businessSymptoms: ['custom logic is central', 'real-time constraints are strict', 'existing internal platforms already exist'],
    supportingObjections: ['vendor tool would create latency, inflexibility, or governance duplication'],
    tradeoffs: ['higher maintenance burden', 'roadmap depends on engineering priorities'],
    whenMoreRealisticThanSfmc: ['the business is already optimized around internal product systems'],
    alignedManagerResponses: ['ask for staffing plan', 'compare build vs buy', 'require SLA and support ownership'],
  },
  {
    id: 'delay_pending_readiness',
    label: 'Delayed implementation pending budget, staffing, or governance',
    bestFitCompanies: ['Veteran, Government, or Anchor firms in planning or review bottlenecks'],
    businessSymptoms: ['initiative interest exists but no clear owner or funding model'],
    supportingObjections: ['security review backlog', 'reorg', 'budget cycle timing'],
    tradeoffs: ['pain lasts longer', 'trust may erode', 'shadow processes may grow'],
    whenMoreRealisticThanSfmc: ['the idea is directionally right but the organization cannot absorb it now'],
    alignedManagerResponses: ['document prerequisites', 'schedule next review gate', 'redirect to interim mitigation'],
  },
  {
    id: 'sfmc_exploration',
    label: 'SFMC exploration',
    bestFitCompanies: ['Senior to Anchor firms with growing lifecycle ambition and partial readiness'],
    businessSymptoms: ['multi-step lifecycle needs are increasing', 'existing tools are straining', 'cross-channel governance is needed'],
    supportingObjections: ['team needs proof of ownership, cost model, and data design first'],
    tradeoffs: ['discovery work before value', 'risk of platform-first thinking'],
    whenMoreRealisticThanSfmc: ['the company may be ready soon, but discovery and sequencing still matter'],
    alignedManagerResponses: ['ask for phased business case', 'request integration map', 'involve architecture early'],
  },
  {
    id: 'sfmc_implementation',
    label: 'SFMC implementation',
    bestFitCompanies: ['Senior, Veteran, Pivotal, or Anchor firms with sufficient readiness and ownership'],
    businessSymptoms: ['complex lifecycle orchestration', 'cross-channel governance needs', 'high volume and segmentation complexity'],
    supportingObjections: ['requires strong ownership, data contracts, compliance model, and maintenance plan'],
    tradeoffs: ['cost', 'implementation complexity', 'ongoing admin and technical debt if poorly governed'],
    whenMoreRealisticThanSfmc: ['business scale, readiness, and use cases justify enterprise automation'],
    alignedManagerResponses: ['validate ROI', 'ask about security and implementation sequencing', 'push for operating model clarity'],
  },
];

export const simulatorCompanyContext: CompanyContext = {
  companyName: 'Northbeam HomeProtect',
  hiddenMaturityTier: 'Senior',
  industry: 'Home warranty and residential protection services',
  businessModel: 'B2C and channel-partner home service plans sold directly and through real-estate and mortgage partners.',
  productsAndServices: [
    'Essential Systems Plan',
    'Whole Home Shield Plan',
    'Seller Coverage Extension',
    'HVAC add-on rider',
    'Emergency dispatch and contractor coordination',
  ],
  revenueMotion: 'Lead-generation, partner referral, quote-to-purchase conversion, annual renewal, add-on upsell, and service retention.',
  geographicScope: 'United States, with strongest density in Sun Belt and Mid-Atlantic markets.',
  majorCustomerSegments: [
    'first-time homeowners',
    'seller-closing customers',
    'renewing policy holders',
    'real-estate agent referral customers',
    'mortgage-channel bundled customers',
  ],
  customerLifecycleModel: {
    customerTypes: ['direct purchaser', 'partner referral purchaser', 'renewing member', 'lapsed member', 'claim-heavy member'],
    lifecycleStages: ['lead', 'quoted', 'purchased', 'active', 'claim_open', 'renewal_due', 'renewed', 'lapsed', 'winback'],
    majorCustomerEvents: ['quote_started', 'quote_submitted', 'policy_purchased', 'policy_activated', 'claim_opened', 'technician_assigned', 'claim_closed', 'renewal_notice_sent', 'policy_renewed', 'policy_canceled'],
    retentionModel: 'Annual renewal with monthly and annual payment plans, retention outreach influenced by claim history and service satisfaction.',
    transactionalMoments: ['purchase confirmation', 'payment failure notice', 'claim status update', 'technician scheduling notice', 'renewal reminder', 'cancellation confirmation'],
    marketingMoments: ['quote abandonment', 'welcome onboarding', 'seasonal add-on upsell', 'renewal nurture', 'winback after lapse', 'partner referral nurture'],
    supportInteractionsAffectingMessaging: ['open claim escalations suppress upsell', 'payment disputes block renewal messaging', 'complaint flags pause non-essential outreach', 'state-specific do-not-email rules override campaign eligibility'],
  },
  internalOrganization: {
    teams: [
      { name: 'Lifecycle Marketing', responsibilities: ['campaign calendar', 'renewal and winback messaging', 'audience requests', 'partner nurture briefs'] },
      { name: 'Marketing Operations', responsibilities: ['audience building', 'platform QA', 'send scheduling', 'campaign intake', 'taxonomy standards'] },
      { name: 'CRM Operations', responsibilities: ['Salesforce field governance', 'dedupe monitoring', 'lead-to-policy status alignment', 'partner assignment rules'] },
      { name: 'Customer Platform Engineering', responsibilities: ['event pipelines', 'API integrations', 'claims and policy event publishing', 'middleware jobs'] },
      { name: 'Policy Administration', responsibilities: ['policy records', 'billing state changes', 'renewal dates', 'coverage updates'] },
      { name: 'Claims Operations', responsibilities: ['claim lifecycle', 'technician dispatch status', 'service recovery flags'] },
      { name: 'Member Care', responsibilities: ['customer complaints', 'suppression requests', 'manual case outreach'] },
      { name: 'Legal & Privacy', responsibilities: ['consent policy', 'channel restrictions', 'state compliance rules'] },
      { name: 'Finance', responsibilities: ['budget approvals', 'vendor review', 'ROI expectations'] },
    ],
    typicalIncidentOpeners: ['Marketing Operations', 'Lifecycle Marketing', 'Member Care', 'Claims Operations', 'Customer Platform Engineering'],
    upstreamDataOwners: ['CRM Operations', 'Policy Administration', 'Customer Platform Engineering', 'Claims Operations'],
    campaignExecutionOwner: 'Marketing Operations',
    transactionalSystemOwners: ['Policy Administration', 'Claims Operations', 'Customer Platform Engineering'],
    consentDecisionOwners: ['Legal & Privacy', 'CRM Operations'],
    launchSignoffOwners: ['Lifecycle Marketing', 'Marketing Operations', 'Legal & Privacy', 'Analytics for major renewals'],
  },
  systemLandscape: {
    crmSystems: ['Salesforce Sales Cloud for leads and partner accounts', 'Salesforce Service Cloud for complaint cases and escalation flags'],
    productAndServiceSystems: ['ShieldCore policy administration platform', 'ClaimTrack dispatch console', 'PartnerQuote portal'],
    supportSystems: ['Zendesk for member care ticketing', 'Talkdesk disposition exports'],
    eventSystems: ['AWS event bridge for policy and claim events', 'Segment stream for web quote activity'],
    warehouseAndReportingSystems: ['Snowflake analytics warehouse', 'Looker lifecycle dashboards'],
    sfmcFootprint: 'partial',
    processAutomationLevel: 'semi_automated',
    marketingDataIngressPatterns: [
      'nightly Salesforce contact and policy sync into marketing audiences',
      'hourly claim and billing delta files through middleware',
      'real-time quote_started and quote_submitted events from Segment into warehouse and alerting',
      'manual partner suppression CSVs during high-risk launches',
    ],
  },
  dataReality: {
    primaryBusinessIdentifiers: ['policy_id', 'claim_id', 'partner_agency_id'],
    customerIdentifiers: ['crm_contact_id', 'person_account_id', 'email_address', 'mobile_e164'],
    accountOrSubscriberIdentifiers: ['subscriber_key', 'household_id', 'member_care_case_id'],
    operationalObjectIdentifiers: ['quote_id', 'billing_schedule_id', 'dispatch_job_id', 'renewal_batch_id'],
    commonProfileFields: ['first_name', 'last_name', 'state_code', 'property_zip', 'home_close_date', 'plan_code', 'payment_plan', 'policy_status', 'renewal_date', 'claim_count_12m', 'partner_channel'],
    commonEventFields: ['event_name', 'event_timestamp_utc', 'policy_id', 'claim_id', 'quote_id', 'dispatch_status', 'billing_status', 'source_system', 'event_version'],
    commonConsentFields: ['email_opt_in_status', 'email_opt_in_source', 'opt_in_timestamp_utc', 'state_solicitation_restriction', 'suppression_reason_code', 'complaint_hold_flag', 'transactional_only_flag'],
    namingConventions: ['primary keys end in _id', 'booleans end in _flag', 'timestamps end in _utc', 'batch extracts use nbhp_<domain>_<yyyymmdd>.csv'],
    likelyDataQualityIssues: [
      'subscriber_key sometimes aligns to crm_contact_id and sometimes to person_account_id in older audiences',
      'partner_channel values vary between ShieldCore and Salesforce',
      'claim_opened events can arrive before updated policy_status sync finishes',
      'state restriction flags are reliable in Salesforce but delayed in some warehouse-derived exports',
    ],
    exampleObjects: [
      {
        objectName: 'policy_holder_profile',
        systemOfRecord: 'Salesforce + ShieldCore consolidated audience layer',
        primaryKey: 'subscriber_key',
        sampleFields: ['subscriber_key', 'crm_contact_id', 'person_account_id', 'policy_id', 'plan_code', 'policy_status', 'renewal_date', 'property_zip', 'claim_count_12m', 'email_opt_in_status', 'complaint_hold_flag'],
      },
      {
        objectName: 'policy_transaction',
        systemOfRecord: 'ShieldCore',
        primaryKey: 'policy_id',
        sampleFields: ['policy_id', 'quote_id', 'purchase_date_utc', 'activation_date_utc', 'billing_schedule_id', 'payment_plan', 'premium_amount', 'policy_status', 'partner_agency_id'],
      },
      {
        objectName: 'claim_event',
        systemOfRecord: 'ClaimTrack',
        primaryKey: 'claim_id',
        sampleFields: ['claim_id', 'policy_id', 'claim_open_date_utc', 'claim_status', 'dispatch_job_id', 'service_category', 'technician_region', 'member_sentiment_code', 'escalation_flag'],
      },
      {
        objectName: 'quote_activity_event',
        systemOfRecord: 'Segment',
        primaryKey: 'quote_id',
        sampleFields: ['quote_id', 'event_name', 'event_timestamp_utc', 'session_id', 'utm_channel', 'utm_campaign', 'property_state', 'estimated_home_age', 'lead_source_detail'],
      },
    ],
  },
  namingAndOperationalConventions: {
    campaignPattern: 'NBH_<channel>_<program>_<audience>_<fiscal_qtr>',
    journeyPattern: 'JRN_<domain>_<trigger>_<version>',
    dataExtensionPattern: 'DE_<domain>_<entity>_<purpose>_<grain>',
    automationPattern: 'AUT_<domain>_<cadence>_<action>',
    apiEventPattern: 'nbhp.<domain>.<event_name>.v<version>',
    internalAbbreviations: ['NBHP', 'PA = Policy Admin', 'MOPs', 'LCM', 'MCare', 'COF = customer out for service', 'RNL = renewal'],
    companyTerminology: ['save board', 'claim-heavy household', 'partner-cohort send', 'service recovery hold', 'RNL wave', 'seller-to-owner conversion'],
  },
  organizationalFriction: {
    failurePoints: ['policy status changes lag campaign eligibility', 'claims escalations are not always reflected before scheduled sends', 'partner exclusions arrive late as CSV files', 'nightly sync jobs blur root cause ownership'],
    crossTeamMisalignments: ['Lifecycle Marketing optimizes conversion while Member Care wants conservative suppression during service issues', 'CRM Operations wants field discipline but Policy Admin prioritizes speed', 'engineering thinks warehouse fixes are enough while MOPs needs audience-safe source data'],
    documentationGaps: ['legacy subscriber_key rationale is poorly documented', 'claim suppression logic lives partly in SQL comments and partly in a legal memo', 'partner referral lifecycle map is outdated'],
    qaLimitations: ['limited end-to-end test coverage for combined policy-plus-claim scenarios', 'regional QA often uses production-derived samples without edge-case coverage'],
    governanceIssues: ['older journeys do not all follow current naming standards', 'manual override audiences are sometimes approved in chat but not logged in intake'],
    approvalBottlenecks: ['Legal review slows state-specific launch changes', 'Finance scrutinizes new platform spend', 'Engineering intake competes with product roadmap work'],
    legacyDependencies: ['older renewal audiences still depend on warehouse extracts before Salesforce updates complete', 'claim suppression relies on a middleware transformation maintained by one engineer'],
    operationalShortcuts: ['last-minute suppression CSV uploads', 'manual audience exclusions copied from Zendesk tags', 'temporary SQL patches that survive for months'],
  },
  hiddenReadinessScores: {
    budget: 3,
    technical: 3,
    data: 3,
    governance: 3,
    stakeholder_alignment: 2,
    compliance: 4,
    implementation_ownership: 3,
    operational_maintenance: 3,
  },
  jobOffers: [
    {
      id: 'offer_lcm_coordinator',
      roleTitle: 'Lifecycle Marketing Coordinator',
      department: 'Lifecycle Marketing',
      reportingManagerType: 'Lifecycle Marketing Manager',
      seniorityLevel: 'junior',
      technicalExpectationLevel: 'low',
      playerFacingSummary: 'Own campaign briefs, proofing coordination, and basic audience intake follow-up for renewal and winback programs.',
      primarySystems: ['Work management board', 'creative proofing tools', 'campaign calendar', 'basic CRM dashboards'],
      expectedBusinessResponsibilities: ['coordinate launch inputs', 'track offer approvals', 'monitor campaign requests', 'surface stakeholder blockers'],
      expectedTechnicalResponsibilities: ['spot obvious audience or proofing discrepancies', 'provide clean business context in tickets'],
      likelyStakeholders: ['Lifecycle Marketing', 'Marketing Operations', 'Creative', 'Analytics'],
      likelyIncidentExposure: ['missing launch asset', 'wrong business context in intake', 'late suppression request', 'customer complaint escalation summaries'],
      likelyDecisionMakingAuthority: 'Can recommend process adjustments and raise concerns, but does not own technical implementation choices.',
      expectedOwnership: ['launch coordination', 'brief hygiene', 'issue escalation support'],
      roleScope: {
        responsibilities: ['collect evidence from briefs and stakeholder notes', 'flag customer-impacting issues', 'keep launch details consistent'],
        systemAccess: ['read access to campaign plans', 'limited dashboard visibility', 'complaint excerpts routed by manager'],
        artifactsAccessibleByDefault: ['ticket', 'Teams chat', 'email thread', 'launch checklist', 'QA note'],
        managerExpectations: ['be organized', 'recognize when issue is beyond role depth', 'avoid overconfident technical claims'],
        escalationAuthority: ['can escalate to manager', 'can request MOPs review'],
        caseTypes: ['launch coordination issue', 'stakeholder confusion', 'complaint triage'],
        evaluationFocus: ['sound judgment', 'evidence gathering', 'appropriate escalation', 'business context clarity'],
        credibilityClass: 'low_authority_observer',
      },
    },
    {
      id: 'offer_crm_ops_specialist',
      roleTitle: 'CRM Operations Specialist',
      department: 'CRM Operations',
      reportingManagerType: 'Director of Revenue Operations',
      seniorityLevel: 'mid',
      technicalExpectationLevel: 'medium',
      playerFacingSummary: 'Own field hygiene, audience eligibility dependencies, and CRM-to-downstream troubleshooting.',
      primarySystems: ['Salesforce', 'Snowflake dashboards', 'field mapping docs', 'ticket queue'],
      expectedBusinessResponsibilities: ['maintain reliable customer status data', 'partner with Marketing Operations on segmentation readiness', 'clarify field ownership'],
      expectedTechnicalResponsibilities: ['debug field mapping issues', 'assess identifier quality', 'recommend CRM-first fixes'],
      likelyStakeholders: ['Marketing Operations', 'Lifecycle Marketing', 'Policy Administration', 'Legal & Privacy'],
      likelyIncidentExposure: ['field sync drift', 'duplicate contact logic', 'consent flag mismatch', 'renewal status eligibility errors'],
      likelyDecisionMakingAuthority: 'Can credibly recommend source-data and mapping changes, but larger platform commitments still need management sponsorship.',
      expectedOwnership: ['data quality investigations', 'mapping corrections', 'CRM governance proposals'],
      roleScope: {
        responsibilities: ['investigate upstream data defects', 'trace ownership across Salesforce and policy systems', 'recommend safer audience logic'],
        systemAccess: ['Salesforce admin-lite access', 'warehouse dashboards', 'mapping documents', 'support case summaries'],
        artifactsAccessibleByDefault: ['ticket', 'CRM field mapping document', 'spreadsheet export', 'SQL excerpt', 'complaint email'],
        managerExpectations: ['separate source issue from downstream symptom', 'protect consent integrity', 'justify changes with evidence'],
        escalationAuthority: ['can engage MOPs and Policy Admin leads', 'can request engineering intake for system defects'],
        caseTypes: ['data integrity incident', 'consent mismatch', 'eligibility drift', 'implementation sequencing recommendation'],
        evaluationFocus: ['root cause accuracy', 'system ownership clarity', 'solution realism', 'safe remediation'],
        credibilityClass: 'semi_technical_recommender',
      },
    },
    {
      id: 'offer_mops_engineer',
      roleTitle: 'Marketing Operations Engineer',
      department: 'Marketing Operations',
      reportingManagerType: 'Senior Manager, Marketing Technology',
      seniorityLevel: 'senior_individual_contributor',
      technicalExpectationLevel: 'high',
      playerFacingSummary: 'Own audience pipelines, launch QA, platform troubleshooting, and marketing-system integration recommendations.',
      primarySystems: ['marketing automation platform footprint', 'Salesforce', 'Snowflake', 'middleware job logs', 'send and suppression logs'],
      expectedBusinessResponsibilities: ['keep campaigns and lifecycle operations stable', 'translate business goals into executable configurations', 'reduce launch risk'],
      expectedTechnicalResponsibilities: ['diagnose integration issues', 'assess platform fit', 'design practical remediation and rollout steps'],
      likelyStakeholders: ['Lifecycle Marketing', 'CRM Operations', 'Customer Platform Engineering', 'Legal & Privacy', 'Analytics'],
      likelyIncidentExposure: ['journey entry failures', 'suppression defects', 'identifier mismatches', 'send audience contamination', 'implementation feasibility discussions'],
      likelyDecisionMakingAuthority: 'Can credibly recommend technical sequencing, smaller-scope tooling, or enterprise platform exploration; spending still requires leadership approval.',
      expectedOwnership: ['investigation', 'launch remediation', 'technical recommendation memos', 'implementation intake drafts'],
      roleScope: {
        responsibilities: ['analyze evidence across systems', 'define immediate and long-term fixes', 'assess whether platform expansion is realistic'],
        systemAccess: ['platform config summaries', 'job logs', 'warehouse outputs', 'mapping documents', 'launch approvals'],
        artifactsAccessibleByDefault: ['ticket', 'send log summary', 'journey configuration summary', 'SQL excerpt', 'API payload sample', 'launch checklist'],
        managerExpectations: ['think in tradeoffs', 'avoid assuming new tooling solves bad data', 'recommend realistic next steps'],
        escalationAuthority: ['can escalate to engineering manager', 'can request architecture review through manager', 'can brief finance and security questions with leadership support'],
        caseTypes: ['production incident', 'launch blocker', 'integration debugging', 'platform recommendation'],
        evaluationFocus: ['diagnosis quality', 'blast-radius judgment', 'solution realism', 'role-appropriate leadership'],
        credibilityClass: 'highly_credible_technical_initiator',
      },
    },
    {
      id: 'offer_customer_data_architect',
      roleTitle: 'Customer Data & Messaging Architect',
      department: 'Customer Platform Engineering',
      reportingManagerType: 'Director of Customer Platform',
      seniorityLevel: 'principal',
      technicalExpectationLevel: 'very_high',
      playerFacingSummary: 'Shape event contracts, messaging architecture, platform sequencing, and long-term data design across lifecycle systems.',
      primarySystems: ['event bridge', 'warehouse', 'CRM', 'integration middleware', 'architecture review process'],
      expectedBusinessResponsibilities: ['align system choices to business scale and operating model', 'protect reliability and compliance risk'],
      expectedTechnicalResponsibilities: ['evaluate build-vs-buy', 'sequence backend foundation work', 'define integration ownership'],
      likelyStakeholders: ['Marketing Technology leadership', 'Engineering leaders', 'Legal & Privacy', 'Finance', 'Analytics'],
      likelyIncidentExposure: ['cross-system architecture gaps', 'readiness and ownership disputes', 'high-blast-radius incident retrospectives', 'platform adoption debates'],
      likelyDecisionMakingAuthority: 'High influence on architecture direction and implementation sequencing, but budget and executive sponsorship still govern commitments.',
      expectedOwnership: ['architecture recommendations', 'cross-team decision memos', 'technical intake and review'],
      roleScope: {
        responsibilities: ['identify structural blockers', 'frame realistic solution paths', 'quantify implementation dependencies'],
        systemAccess: ['architecture artifacts', 'event schemas', 'integration docs', 'incident reviews', 'financial assumptions'],
        artifactsAccessibleByDefault: ['architecture review request', 'API payload sample', 'incident timeline', 'field mapping document', 'SWE intake note'],
        managerExpectations: ['be precise about prerequisites', 'choose proportional solutions', 'balance speed, safety, and ownership'],
        escalationAuthority: ['can pull in senior engineering and architecture stakeholders', 'can trigger finance and security review for serious proposals'],
        caseTypes: ['architecture review', 'platform adoption evaluation', 'systemic incident analysis', 'ownership redesign'],
        evaluationFocus: ['solution fit', 'organizational realism', 'risk management', 'sequencing quality'],
        credibilityClass: 'highly_credible_technical_initiator',
      },
    },
  ],
};

export const hiddenRankAssignmentRules = {
  principle: 'The simulator infers maturity from structural signals, not from brand prestige alone.',
  deterministicHeuristics: [
    'Company size under 200, single-region footprint, weak engineering bench, spreadsheet-heavy execution, and minimal governance strongly bias toward Startup.',
    'Growing firms with 200 to 1,500 employees, some systems in place, inconsistent ownership, and partial automation bias toward Mid-Level.',
    'Established multistate or multi-region firms with named operations teams, real CRM ownership, and repeatable launch processes bias toward Senior.',
    'Older companies with multiple legacy systems, merger debt, and broad but inconsistent documentation bias toward Veteran.',
    'Digital-first firms with high event volume, strong engineering, and revenue-sensitive real-time workflows bias toward Pivotal.',
    'Public-sector or quasi-public organizations with heavy approvals, compliance-first change control, and legacy constraints bias toward Government.',
    'Large enterprises with multiple BUs, formal architecture review, strict governance, and high-blast-radius system design bias toward Anchor.',
  ],
  inferenceFactors: [
    'company size',
    'industry',
    'ownership or funding structure',
    'geographic scale',
    'customer volume',
    'system maturity',
    'engineering presence',
    'operations maturity',
    'CRM maturity',
    'data governance',
    'compliance pressure',
    'marketing automation maturity',
    'documentation quality',
    'approval complexity',
  ],
  scoringGuide: {
    Startup: 'Low headcount, low governance, weak source-data discipline, mostly manual operations.',
    'Mid-Level': 'Moderate scale, uneven process maturity, mixed manual and integrated workflows.',
    Senior: 'Established systems, repeatable operations, still imperfect at cross-system seams.',
    Veteran: 'Mature estate plus legacy complexity and historical exceptions.',
    Pivotal: 'Strong engineering and event-driven product motions where revenue depends on technical speed.',
    Government: 'Regulated and approval-heavy operating model with constrained change management.',
    Anchor: 'Enterprise scale, formal governance, multi-system depth, high blast radius.',
  },
};

export const roleEligibilityRules = {
  highlyCredibleTechnicalInitiators: ['Marketing Operations Engineer', 'Customer Data & Messaging Architect'],
  semiTechnicalRecommenders: ['CRM Operations Specialist'],
  lowAuthorityObservers: ['Lifecycle Marketing Coordinator'],
  nonCredibleInitiatorsForPlatformCommitments: ['entry-level campaign coordinators', 'creative-only roles', 'purely non-technical marketing assistants'],
  managerResponseRules: [
    'High-credibility roles can introduce platform, integration, or architecture recommendations directly, but must still justify cost, ownership, and readiness.',
    'Semi-technical roles are heard on data hygiene, CRM sequencing, and operational feasibility, but large platform recommendations usually require sponsorship from marketing technology or engineering leadership.',
    'Low-authority roles can surface strong observations and collect evidence, but managers should redirect them toward escalation rather than treating them as final decision-makers on architecture.',
    'If a role lacks organizational credibility for a given proposal, the simulator should score well-reasoned escalation more highly than overconfident ownership claims.',
  ],
};

export const managerDispositionAndEscalationLogic = {
  managerVariables: [
    'budget_sensitivity',
    'technical_fluency',
    'urgency',
    'trust_in_player',
    'risk_tolerance',
    'implementation_appetite',
    'political_capital',
    'openness_to_vendors',
    'fear_of_compliance_or_security_exposure',
  ],
  behaviorRules: [
    'Manager responses are influenced by company maturity, readiness scores, accepted role credibility, and how proportional the proposed solution is.',
    'Startup managers default to cost, ownership, and practicality questions before entertaining enterprise tooling.',
    'Mid-Level and Senior managers may support deeper investigation, but still push on sequencing, budget, and who will maintain the solution.',
    'Government and Anchor managers heavily weight compliance, security review, and blast radius before approving change.',
    'If the player proposes SFMC or an equivalent platform, the simulator first checks accepted role credibility, readiness, and whether a lighter or earlier-stage option better fits the pain.',
    'If a Mid-Level-or-higher company lacks backend support, managers should frame that as an organizational maturity gap and ask whether data foundation work comes first.',
  ],
  startupSfmcQuestions: ['What would it cost?', 'Who would own it day to day?', 'Do we even have clean enough data?', 'Is there a smaller step before this?', 'What problem would this solve first?'],
  escalationPath: ['direct manager review', 'skip-level or director review', 'finance questions', 'security or privacy review', 'operations sign-off', 'software engineering intake', 'architecture review request'],
  outcomeTypes: ['approval', 'rejection', 'delay', 'redirect_to_alternative_solution', 'escalate_for_next_stage_review'],
};

export const communicationArtifactFlow = {
  formats: [
    'Teams message',
    'manager follow-up chat',
    'email thread',
    'forwarded email chain',
    'finance question list',
    'security review questionnaire',
    'software engineering intake note',
    'architecture review request',
    'launch approval note',
  ],
  maturityInfluence: [
    'Startup and Mid-Level companies rely more on chat excerpts, quick email chains, and spreadsheet attachments.',
    'Senior and Veteran companies add formal tickets, launch approvals, and more structured follow-up notes.',
    'Government and Anchor companies frequently include questionnaire-style approvals, architecture review records, and formal sign-off trails.',
  ],
};

export const simulationLoop = [
  'Receive intake for a ticket, complaint, launch issue, or production incident.',
  'Review persistent company context that the player would realistically know.',
  'Review accepted role context, including access, authority, and expectations.',
  'Open available evidence and note gaps, contradictions, or missing ownership.',
  'Investigate artifacts and separate symptoms from structural blockers.',
  'Identify likely root cause, contributing factors, and whether issue is upstream or downstream.',
  'Evaluate realistic next-step solution options against company maturity and readiness.',
  'Propose an immediate mitigation, long-term fix, and next-step solution path.',
  'Assess blast radius, business risk, consent/compliance impact, and organizational feasibility.',
  'Escalate if needed based on role authority, manager disposition, and risk profile.',
  'Receive resolution outcome and scored feedback tied to realism, evidence, and judgment.',
];

export const caseStructure = {
  fields: [
    'case_id',
    'title',
    'hidden_company_tier',
    'company_context_reference',
    'accepted_role_reference',
    'business_complaint',
    'severity',
    'business_context',
    'environment_context',
    'player_objective',
    'available_artifacts',
    'hidden_root_cause_or_structural_blocker',
    'acceptable_fixes',
    'acceptable_next_step_recommendations',
    'risks',
    'scoring_criteria',
    'success_conditions',
    'failure_conditions',
  ],
};

export const artifactSystem: ArtifactDefinition[] = [
  {
    artifactType: 'Jira-style ticket',
    description: 'Primary intake record describing business complaint, severity, and owner expectations.',
    reveals: ['reported symptom', 'business deadline', 'requester assumptions', 'initial severity'],
    reliabilityProfile: 'Useful but often incomplete; reporter may misstate technical cause.',
    availability: 'always',
    likelyTiers: ['Startup', 'Mid-Level', 'Senior', 'Veteran', 'Pivotal', 'Government', 'Anchor'],
    likelyRoles: ['all accepted roles'],
  },
  {
    artifactType: 'Slack or Teams message excerpt',
    description: 'Fast-moving chat evidence that captures urgency, confusion, or tribal knowledge.',
    reveals: ['timeline clues', 'stakeholder sentiment', 'hidden workarounds'],
    reliabilityProfile: 'High context value but noisy and emotionally biased.',
    availability: 'common',
    likelyTiers: ['Startup', 'Mid-Level', 'Senior', 'Veteran', 'Pivotal'],
    likelyRoles: ['Lifecycle Marketing Coordinator', 'CRM Operations Specialist', 'Marketing Operations Engineer'],
  },
  {
    artifactType: 'Email complaint',
    description: 'Customer or stakeholder complaint showing visible business impact.',
    reveals: ['customer harm', 'timing of bad send', 'language stakeholders use to describe the failure'],
    reliabilityProfile: 'Strong for impact, weak for technical causality.',
    availability: 'common',
    likelyTiers: ['Mid-Level', 'Senior', 'Veteran', 'Government', 'Anchor'],
    likelyRoles: ['Lifecycle Marketing Coordinator', 'CRM Operations Specialist', 'Marketing Operations Engineer'],
  },
  {
    artifactType: 'API payload sample',
    description: 'Representative event or request payload from an upstream or downstream integration.',
    reveals: ['field names', 'missing values', 'event timing', 'identifier structure', 'schema drift'],
    reliabilityProfile: 'Technically strong but may not represent all edge cases or retries.',
    availability: 'maturity_dependent',
    likelyTiers: ['Senior', 'Veteran', 'Pivotal', 'Anchor'],
    likelyRoles: ['Marketing Operations Engineer', 'Customer Data & Messaging Architect'],
  },
  {
    artifactType: 'Data Extension snapshot',
    description: 'Point-in-time audience table view showing selected fields and row patterns.',
    reveals: ['audience composition', 'null patterns', 'identifier inconsistencies', 'suppression logic gaps'],
    reliabilityProfile: 'Very useful but only reflects the captured moment and visible columns.',
    availability: 'maturity_dependent',
    likelyTiers: ['Mid-Level', 'Senior', 'Veteran', 'Anchor'],
    likelyRoles: ['Marketing Operations Engineer', 'Customer Data & Messaging Architect'],
  },
  {
    artifactType: 'Journey configuration summary',
    description: 'Human-readable export or screenshot-level summary of an orchestration path.',
    reveals: ['entry logic', 'decision split assumptions', 'send sequencing', 'exit criteria'],
    reliabilityProfile: 'Useful overview but may hide low-level script or data issues.',
    availability: 'maturity_dependent',
    likelyTiers: ['Mid-Level', 'Senior', 'Veteran', 'Anchor'],
    likelyRoles: ['Marketing Operations Engineer', 'Customer Data & Messaging Architect'],
  },
  {
    artifactType: 'SQL query excerpt',
    description: 'Partial query used to build an audience or operational extract.',
    reveals: ['join logic', 'filter assumptions', 'dependency on stale fields', 'missing exclusions'],
    reliabilityProfile: 'High diagnostic value, but snippets may omit critical CTEs or upstream transforms.',
    availability: 'common',
    likelyTiers: ['Mid-Level', 'Senior', 'Veteran', 'Pivotal', 'Anchor'],
    likelyRoles: ['CRM Operations Specialist', 'Marketing Operations Engineer', 'Customer Data & Messaging Architect'],
  },
  {
    artifactType: 'Send log summary',
    description: 'Operational output showing send counts, errors, or unexpected volume by job or audience.',
    reveals: ['blast radius', 'timing', 'unexpected population size', 'send failures'],
    reliabilityProfile: 'High for impact, moderate for root cause.',
    availability: 'maturity_dependent',
    likelyTiers: ['Senior', 'Veteran', 'Anchor'],
    likelyRoles: ['Marketing Operations Engineer', 'Customer Data & Messaging Architect'],
  },
  {
    artifactType: 'AMPscript snippet',
    description: 'Dynamic-content or personalization logic excerpt.',
    reveals: ['field dependency', 'null handling', 'rendering assumptions', 'content safety issues'],
    reliabilityProfile: 'Technically revealing but only relevant when platform sophistication supports it.',
    availability: 'rare',
    likelyTiers: ['Senior', 'Veteran', 'Anchor'],
    likelyRoles: ['Marketing Operations Engineer', 'Customer Data & Messaging Architect'],
  },
  {
    artifactType: 'QA note',
    description: 'Tester observations, known limitations, or sign-off caveats before a launch.',
    reveals: ['untested edge cases', 'accepted risks', 'human process shortcuts'],
    reliabilityProfile: 'Moderate; can be accurate or overly optimistic depending on test depth.',
    availability: 'common',
    likelyTiers: ['Startup', 'Mid-Level', 'Senior', 'Veteran', 'Government', 'Anchor'],
    likelyRoles: ['all accepted roles'],
  },
  {
    artifactType: 'Stakeholder message',
    description: 'A manager, partner owner, or support lead comment explaining business stakes.',
    reveals: ['political pressure', 'launch urgency', 'competing goals'],
    reliabilityProfile: 'High for context, low for technical accuracy.',
    availability: 'common',
    likelyTiers: ['Startup', 'Mid-Level', 'Senior', 'Veteran', 'Government', 'Anchor'],
    likelyRoles: ['all accepted roles'],
  },
  {
    artifactType: 'Incident timeline',
    description: 'Chronological summary of what happened and when.',
    reveals: ['sequence of failures', 'delayed detections', 'rollback timing'],
    reliabilityProfile: 'High when maintained formally; weaker in low-maturity companies.',
    availability: 'maturity_dependent',
    likelyTiers: ['Senior', 'Veteran', 'Pivotal', 'Government', 'Anchor'],
    likelyRoles: ['Marketing Operations Engineer', 'Customer Data & Messaging Architect'],
  },
  {
    artifactType: 'Platform warning or error output',
    description: 'System-generated message, job failure, or validation warning.',
    reveals: ['direct failure signal', 'component name', 'timing clues'],
    reliabilityProfile: 'Technically useful but can mislead if it reflects downstream symptoms only.',
    availability: 'maturity_dependent',
    likelyTiers: ['Mid-Level', 'Senior', 'Veteran', 'Pivotal', 'Anchor'],
    likelyRoles: ['CRM Operations Specialist', 'Marketing Operations Engineer', 'Customer Data & Messaging Architect'],
  },
  {
    artifactType: 'Spreadsheet export',
    description: 'Analyst-owned audience, exception, or reconciliation file.',
    reveals: ['manual overrides', 'column drift', 'source mismatch', 'naming inconsistency'],
    reliabilityProfile: 'Essential in lower-maturity environments but prone to hidden edits.',
    availability: 'common',
    likelyTiers: ['Startup', 'Mid-Level', 'Senior'],
    likelyRoles: ['Lifecycle Marketing Coordinator', 'CRM Operations Specialist', 'Marketing Operations Engineer'],
  },
  {
    artifactType: 'Manually maintained CSV',
    description: 'Ad hoc suppression, partner exclusion, or launch audience file handled outside primary systems.',
    reveals: ['process shortcuts', 'manual controls', 'data governance gaps'],
    reliabilityProfile: 'Useful but risky and frequently stale.',
    availability: 'maturity_dependent',
    likelyTiers: ['Startup', 'Mid-Level', 'Senior'],
    likelyRoles: ['Lifecycle Marketing Coordinator', 'CRM Operations Specialist', 'Marketing Operations Engineer'],
  },
  {
    artifactType: 'Launch checklist',
    description: 'Pre-flight execution checklist for campaign or transactional launch readiness.',
    reveals: ['required approvals', 'missing QA', 'known dependencies'],
    reliabilityProfile: 'Good for process accountability, not sufficient for technical proof on its own.',
    availability: 'common',
    likelyTiers: ['Mid-Level', 'Senior', 'Veteran', 'Government', 'Anchor'],
    likelyRoles: ['Lifecycle Marketing Coordinator', 'Marketing Operations Engineer'],
  },
  {
    artifactType: 'Approval note',
    description: 'Written sign-off from legal, privacy, finance, or launch stakeholders.',
    reveals: ['officially accepted scope', 'policy boundaries', 'who accepted risk'],
    reliabilityProfile: 'Reliable for governance context, not for root cause proof.',
    availability: 'maturity_dependent',
    likelyTiers: ['Senior', 'Veteran', 'Government', 'Anchor'],
    likelyRoles: ['Lifecycle Marketing Coordinator', 'Marketing Operations Engineer', 'Customer Data & Messaging Architect'],
  },
  {
    artifactType: 'CRM field mapping document',
    description: 'Reference showing field lineage, source ownership, and downstream usage.',
    reveals: ['system-of-record truth', 'mapping gaps', 'ownership assumptions'],
    reliabilityProfile: 'High value when current; dangerous when stale.',
    availability: 'common',
    likelyTiers: ['Mid-Level', 'Senior', 'Veteran', 'Government', 'Anchor'],
    likelyRoles: ['CRM Operations Specialist', 'Marketing Operations Engineer', 'Customer Data & Messaging Architect'],
  },
];

export const playerSubmissionFormat = {
  sections: [
    'suspected_root_cause',
    'supporting_evidence',
    'impacted_system_or_component',
    'recommended_immediate_fix',
    'recommended_long_term_fix',
    'recommended_next_step_solution_path',
    'sfmc_fit_assessment',
    'confidence_level',
    'blast_radius_or_risk_assessment',
    'escalation_recommendation',
    'prevention_recommendation',
    'assumptions_or_unknowns',
  ],
  sfmcFitValues: ['appropriate', 'inappropriate', 'premature', 'one_of_several_options'],
};

export const evaluationModel = {
  scoringDimensions: [
    'correctness_of_root_cause',
    'quality_of_evidence_used',
    'quality_and_safety_of_proposed_fix',
    'awareness_of_business_impact',
    'awareness_of_data_integrity_consent_compliance_and_operational_risk',
    'over_fixing_vs_under_fixing',
    'appropriate_escalation',
    'upstream_vs_downstream_responsibility_accuracy',
    'realism_of_next_solution_recommendation',
    'use_of_company_maturity_and_readiness',
    'fit_with_accepted_role_scope',
  ],
  partialCreditLogic: [
    'Technically correct but incomplete responses earn partial credit when they identify the main cause but miss key risks or sequencing.',
    'Wrong root cause but reasonable investigation earns credit for evidence use and judgment if the path was plausible.',
    'Correct diagnosis with a dangerous fix loses safety and risk points even if root-cause points are strong.',
    'Correct fix with poor evidence receives reduced confidence and investigation scoring.',
    'Strong immediate mitigation but weak long-term prevention scores better than an answer with no practical containment.',
    'Enterprise-grade solutions proposed in Startup settings are penalized when they ignore readiness, staffing, or ownership.',
    'Recommending SFMC when a lighter or earlier-stage solution is more realistic lowers realism scoring even if the platform could theoretically work.',
    'Rejecting SFMC appropriately because the company is not ready earns realism credit.',
    'Choosing the right solution class with weak justification earns moderate credit rather than full credit.',
    'An answer that is architecturally sound but unrealistic for the accepted role loses role-fit points unless paired with proper escalation framing.',
  ],
};

export const resolutionStates = {
  successful_resolution: 'Player identifies a viable cause, proposes a safe realistic fix, and fits the recommendation to company context and role scope.',
  partial_resolution: 'Player reduces immediate harm or identifies part of the issue, but leaves meaningful risk, ambiguity, or ownership unresolved.',
  unresolved: 'Player does not move the case forward enough to reduce uncertainty or business impact.',
  false_resolution: 'Player proposes a fix that appears plausible but does not address the true issue.',
  harmful_resolution: 'Player action or recommendation would increase customer, compliance, or operational risk.',
  escalation_required: 'The issue is recognized correctly, but the player lacks authority or access to finish without escalation.',
  time_exceeded_or_business_impact_worsened: 'Investigation stalls or takes the wrong direction while harm compounds.',
  technically_correct_but_organizationally_unrealistic_resolution: 'Answer is technically sophisticated but mismatched to budget, readiness, ownership, or role authority.',
  solution_recommendation_rejected_for_poor_fit: 'Player recommends a next-step path that leadership rejects because it is too advanced, too expensive, or poorly sequenced.',
  solution_recommendation_accepted_for_next_stage_review: 'Player frames a proportional recommendation strong enough for manager or cross-functional review, even if implementation is not immediate.',
};

export const uiStructure = {
  playerVisiblePanels: [
    'case overview',
    'company context panel',
    'accepted role panel',
    'artifact viewer',
    'investigation notes',
    'response submission panel',
    'feedback and evaluation panel',
    'score and progression display',
  ],
  visibilityRules: [
    'Company context panel shows what an employee in that role would realistically know, but never shows hidden maturity labels or readiness scores.',
    'Accepted role panel shows title, team, responsibilities, access, and manager expectations, but not hidden scoring formulas.',
    'Artifact viewer only exposes evidence allowed by maturity and role access rules.',
  ],
};

export const reusableCaseTemplate = `case:
  case_id: string
  title: string
  hidden_company_tier: Startup|Mid-Level|Senior|Veteran|Pivotal|Government|Anchor
  hidden_readiness_scores:
    budget: 1-5
    technical: 1-5
    data: 1-5
    governance: 1-5
    stakeholder_alignment: 1-5
    compliance: 1-5
    implementation_ownership: 1-5
    operational_maintenance: 1-5
  company_context_ref: northbeam_homeprotect
  accepted_role_ref: role_offer_id
  business_complaint:
    summary: string
    reported_by: string
    business_impact: string
    severity: low|medium|high|critical
  environment_context:
    systems_in_scope: [string]
    process_state: manual|semi_automated|fully_integrated
    active_constraints: [string]
  player_objective: string
  available_artifacts:
    - artifact_id: string
      artifact_type: string
      role_access: [role_offer_id]
      maturity_visible: [tier]
      summary: string
  hidden_truth:
    root_cause: string
    contributing_factors: [string]
    structural_blocker: string|null
    upstream_owner: string
    downstream_owner: string
  acceptable_fixes:
    immediate: [string]
    long_term: [string]
  acceptable_next_step_solution_paths:
    - accept_pain
    - manual_process_hardening
    - csv_governance
    - lightweight_automation
    - transactional_messaging_only
    - crm_cleanup_first
    - backend_foundation_first
    - internal_engineering_solution
    - delay_pending_readiness
    - sfmc_exploration
    - sfmc_implementation
  risks:
    customer: [string]
    compliance: [string]
    operational: [string]
    data_integrity: [string]
  scoring_dimensions:
    - root_cause_accuracy
    - evidence_quality
    - remediation_safety
    - business_realism
    - role_fit
    - escalation_quality
    - solution_path_fit
  escalation_outcomes:
    supported: [string]
    rejected: [string]
    redirected: [string]
`;

export const futurePhaseConstraints = [
  'Cases must support both technical failures and process failures.',
  'Artifacts must support misleading clues and incomplete evidence.',
  'Scoring must support partial truth rather than binary right-wrong grading.',
  'Multiple valid fixes may exist for the same case.',
  'Multiple valid next-step solution paths may exist for the same company and issue.',
  'Company maturity must silently shape realism, difficulty, artifact availability, and manager behavior.',
  'Data structures must remain company-specific rather than generic placeholders.',
  'Accepted role must shape access, expectations, authority, and evaluation.',
  'Future SFMC backend realism must plug into this foundation without replacing company context.',
  'AMPscript, journeys, Data Extensions, transactional systems, consent logic, and cross-functional incidents must inherit company context rather than become generic platform puzzles.',
  'The simulator must be able to model when SFMC is not yet the right recommendation.',
];

export const phase2Prompt = `Phase 2 only: build the Salesforce Marketing Cloud realism layer on top of the existing simulator foundation. Reuse the hidden maturity system, hidden readiness scores, accepted-role logic, Northbeam HomeProtect company context, artifact rules, and scoring framework from Phase 1. Do not rebuild the foundation. Instead define the SFMC-specific operating model for this company, including: ContactKey strategy options and tradeoffs; subscriber, contact, policy, and claim data modeling; Data Extension categories and grain rules; journey entry-source patterns; send classification concepts; suppression and consent handling; CRM and policy-system sync behavior; event and API ingestion patterns; common failure modes; realistic DE snapshots and payload shapes; and role-based access to those artifacts. Keep SFMC as one possible solution path, not the default answer, and preserve role- and maturity-sensitive realism. Do not generate a large case library yet—only build the modular technical layer that future cases will use.`;

export const simulatorFoundation = {
  simulatorPurpose:
    'Train players to diagnose marketing operations, CRM, lifecycle, integration, and cross-functional execution problems by recommending the most realistic next solution for the company they actually work in.',
  decisionPrinciple:
    'What is the most realistic next solution for this company, given its maturity, pain level, readiness, scale, and constraints?',
  hiddenMaturityFramework,
  hiddenRankAssignmentRules,
  companyContext: simulatorCompanyContext,
  solutionPathFramework,
  roleEligibilityRules,
  managerDispositionAndEscalationLogic,
  communicationArtifactFlow,
  simulationLoop,
  caseStructure,
  artifactSystem,
  playerSubmissionFormat,
  evaluationModel,
  resolutionStates,
  uiStructure,
  reusableCaseTemplate,
  futurePhaseConstraints,
  phase2Prompt,
};
