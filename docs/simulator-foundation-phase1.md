# 1. Simulator Purpose

The simulator is designed to model the day-to-day work of people operating inside a real company where marketing operations, lifecycle operations, CRM data, support escalations, and integration issues overlap. It is not a trivia engine and it is not an SFMC-only sandbox. Its purpose is to train judgment under realistic organizational constraints: incomplete evidence, messy ownership, imperfect data, role-dependent access, and managers who care about risk, budget, readiness, and business impact.

The simulator trains a blended skill set:
- marketing operations troubleshooting;
- lifecycle operations reasoning;
- CRM data and field-governance analysis;
- integration debugging and implementation sequencing;
- escalation judgment;
- process design and operational risk assessment;
- platform-fit evaluation, including when Salesforce Marketing Cloud is the wrong answer or only one of several viable paths.

The work being simulated includes launch support, incident handling, campaign operations, CRM cleanup, consent-related judgment, implementation planning, platform recommendation, and cross-functional technical troubleshooting. The core evaluation question is whether the player can recommend the most realistic next solution for the company they actually work in, rather than simply naming the most sophisticated system.

# 2. Player Role Offer and Acceptance Framework

The simulator begins with company-specific job offers rather than a fixed player role. The accepted offer determines the player’s perspective and scope inside the company.

Accepted role affects:
- daily responsibilities;
- seniority and expected independence;
- required technical depth;
- system and artifact access;
- stakeholder trust and credibility;
- authority to recommend or implement change;
- inclusion in technical, operational, or strategic discussions;
- case types assigned;
- scoring expectations.

Role bands supported by the foundation:
- non-technical marketing roles: strong on business context, weak on technical authority;
- semi-technical lifecycle or CRM operations roles: credible on data, fields, and operational fixes;
- highly technical implementation or integration roles: expected to diagnose systems and compare solution tradeoffs;
- strategic architecture or ownership roles: expected to reason about operating model, build-vs-buy, sequencing, and blast radius.

Manager behavior and scoring must honor role realism. A junior coordinator should be rewarded for clean evidence gathering and escalation, not judged as though they own deployments. A technical implementation role is expected to reason more deeply about integrations, platform fit, operational ownership, and sequencing.

# 3. Job Offer Metadata

Each company exposes one or more job offers. Each offer should include:
- role title;
- department;
- reporting manager type;
- seniority level;
- technical expectation level;
- primary systems involved;
- expected business responsibilities;
- expected technical responsibilities;
- likely stakeholders;
- likely incident exposure;
- likely decision-making authority;
- expected launch, maintenance, investigation, or implementation ownership.

The accepted offer becomes the player’s in-simulator role context and shapes artifact availability, case assignment, manager expectations, escalation paths, and solution-scoring thresholds.

# 4. Hidden Company Maturity Framework

The simulator uses a hidden maturity ranking that is never shown directly to the player. This rank silently drives realism, system complexity, governance style, incident patterns, and solution fit.

## Startup
- Manual operations dominate.
- Spreadsheet and CSV workflows are common.
- Identifiers are inconsistent.
- Governance is weak and naming is messy.
- SFMC may be absent or only partially started.
- Realistic fixes are process hardening, spreadsheet governance, and small-scope tooling.

## Mid-Level
- Some integration exists, but manual work remains common.
- Ownership is uneven and documentation is incomplete.
- Automation maturity is inconsistent across teams.
- Realistic fixes often focus on cleaning source fields, stabilizing handoffs, and sequencing better before larger tooling decisions.

## Senior
- Core systems and repeatable launch operations exist.
- Documentation and standards are mostly present but imperfect.
- Cross-system edge cases and partial technical debt still drive incidents.
- Realistic fixes often include integration repair, source-of-truth clarification, and targeted platform optimization.

## Veteran
- Mature operating model, but burdened by legacy complexity and inherited exceptions.
- Multiple generations of process, data, and tooling coexist.
- Realistic work includes dependency tracing, modernization sequencing, and legacy containment.

## Pivotal
- Highly digital, revenue-sensitive, event-driven environment.
- Engineering and telemetry matter heavily.
- Realistic work emphasizes event contracts, observability, real-time messaging fit, and ROI-sensitive platform choices.

## Government
- Approval-heavy, regulated, audit-focused, and legacy-constrained.
- Compliance and security questions can dominate over technical elegance.
- Realistic fixes are often narrower, slower, and more procedurally controlled.

## Anchor
- Enterprise-scale, multi-system, high-governance, high-blast-radius environment.
- Formal architecture and release controls are common.
- Realistic work includes scoped remediation, ownership clarity, and phased implementation rather than simplistic rebuilds.

# 5. Hidden Rank Assignment Rules

Maturity is assigned under the hood using a weighted inference model based on:
- company size;
- industry;
- ownership or funding structure;
- geographic scale;
- customer volume;
- system maturity;
- engineering presence;
- operations maturity;
- CRM maturity;
- data governance;
- compliance pressure;
- marketing automation maturity;
- documentation quality;
- approval complexity.

The rules should be deterministic enough that repeated generation of similar companies produces comparable behavior. The maturity label is hidden, but its downstream effects must be consistent.

# 6. Company Context

The persistent company for Phase 1 is **Northbeam HomeProtect**, a fictional U.S. home warranty company with a hidden **Senior** maturity tier.

## A. Core Company Profile
- company name: Northbeam HomeProtect;
- industry: home warranty and residential protection services;
- business model: direct-to-consumer plus partner referral sales through real-estate and mortgage channels;
- products/services: core home service plans, seller extensions, HVAC add-ons, emergency dispatch coordination;
- revenue motion: lead generation, quote conversion, annual renewal, add-on upsell, retention;
- geographic scope: U.S. national, strongest in Sun Belt and Mid-Atlantic regions;
- major customer segments: direct homeowners, seller-closing customers, renewal households, referral-channel customers.

## B. Customer and Lifecycle Model
- customer types: direct purchaser, partner referral purchaser, renewing member, lapsed member, claim-heavy member;
- lifecycle stages: lead, quoted, purchased, active, claim_open, renewal_due, renewed, lapsed, winback;
- major customer events: quote_started, quote_submitted, policy_purchased, claim_opened, technician_assigned, renewal_notice_sent, policy_renewed, policy_canceled;
- retention model: annual renewal with claim experience and service satisfaction affecting outreach;
- transactional moments: purchase confirmation, payment failure, claim status update, technician scheduling, renewal notice, cancellation confirmation;
- marketing moments: abandonment, onboarding, seasonal upsell, renewal nurture, winback, partner nurture;
- support interactions affecting messaging: complaint holds, disputes, open escalations, state-specific restrictions.

## C. Internal Organization
Primary interacting teams:
- Lifecycle Marketing;
- Marketing Operations;
- CRM Operations;
- Customer Platform Engineering;
- Policy Administration;
- Claims Operations;
- Member Care;
- Legal & Privacy;
- Finance.

Incident openers usually come from MOPs, Lifecycle Marketing, Member Care, Claims Operations, or engineering. Upstream data is owned jointly across CRM Operations, Policy Administration, Customer Platform Engineering, and Claims Operations. Campaign execution is owned by Marketing Operations. Consent decisions sit with Legal & Privacy plus CRM Operations. Launch sign-off usually includes Lifecycle Marketing, Marketing Operations, and Legal & Privacy.

## D. System Landscape
- CRM/source of truth: Salesforce Sales Cloud and Service Cloud;
- product/service systems: ShieldCore policy administration, ClaimTrack dispatch, PartnerQuote portal;
- support systems: Zendesk, Talkdesk exports;
- event-producing systems: AWS event bridge, Segment quote stream;
- reporting systems: Snowflake and Looker;
- SFMC status: partial footprint, not universal and not assumed as default;
- process state: semi-automated;
- marketing data ingress: nightly CRM/policy syncs, hourly operational deltas, real-time quote events, occasional manual partner suppression CSVs.

## E. Data Reality
Primary identifiers and objects are company-specific:
- business identifiers: `policy_id`, `claim_id`, `partner_agency_id`;
- customer identifiers: `crm_contact_id`, `person_account_id`, `email_address`, `mobile_e164`;
- messaging/account identifiers: `subscriber_key`, `household_id`, `member_care_case_id`;
- operational objects: `quote_id`, `billing_schedule_id`, `dispatch_job_id`, `renewal_batch_id`.

Common fields include plan, status, payment, claim, property, and consent details. Example objects include:
- `policy_holder_profile`;
- `policy_transaction`;
- `claim_event`;
- `quote_activity_event`.

Likely data-quality issues include inconsistent `subscriber_key` lineage, lagging policy-status updates, inconsistent partner-channel values, and timing gaps between claim events and audience eligibility.

## F. Naming and Operational Conventions
Examples:
- campaign: `NBH_<channel>_<program>_<audience>_<fiscal_qtr>`;
- journey: `JRN_<domain>_<trigger>_<version>`;
- Data Extension: `DE_<domain>_<entity>_<purpose>_<grain>`;
- automation: `AUT_<domain>_<cadence>_<action>`;
- API event: `nbhp.<domain>.<event_name>.v<version>`.

Internal abbreviations include `NBHP`, `MOPs`, `LCM`, `MCare`, `RNL`, and `PA`. Stakeholders also use internal terms such as “save board,” “service recovery hold,” and “partner-cohort send.”

## G. Organizational Friction
Typical failure points include lagging policy status, stale claim suppression, late partner exclusions, and ambiguous nightly sync ownership. Misalignment often appears between conversion-minded lifecycle teams and conservative support or legal teams. Documentation gaps exist around subscriber-key history and suppression logic. QA is imperfect, governance exceptions are common, and manual shortcuts frequently survive longer than intended.

# 7. Alternative Solution Path Framework

The simulator should evaluate multiple hidden next-step solution classes rather than defaulting to SFMC.

Supported solution paths:
- do nothing / accept temporary pain;
- manual process hardening;
- spreadsheet and CSV governance improvements;
- lightweight marketing automation platform;
- transactional-only messaging solution;
- CRM cleanup or CRM-first approach;
- backend/data foundation work before platform adoption;
- internal engineering-built solution;
- delayed implementation pending budget, staffing, or governance;
- SFMC exploration;
- SFMC implementation.

Each path should define:
- which company conditions make it likely;
- which symptoms point toward it;
- what objections support it;
- what tradeoffs it has;
- when it is more realistic than SFMC;
- what manager response patterns align with it.

Hidden decision principle:
**What is the most realistic next solution for this company, given its maturity, pain level, readiness, scale, and constraints?**

# 8. Readiness Scoring Model

Readiness is separate from maturity and is also hidden from the player. The simulator should score at least these dimensions:
- budget readiness;
- technical readiness;
- data readiness;
- governance readiness;
- stakeholder alignment;
- compliance readiness;
- implementation ownership readiness;
- operational maintenance readiness.

A large company can still be unready. A smaller company can still be ready for a narrow or lightweight solution.

# 9. Role Eligibility Rules

Roles should have hidden credibility classes for initiating technical improvement discussions.

- highly credible technical initiators: senior marketing-technology, implementation, integration, or architecture roles;
- semi-technical recommenders: CRM ops or lifecycle ops roles with field and process ownership;
- low-authority observers: junior coordinators or campaign operators;
- non-credible initiators for some implementation decisions: roles with no technical ownership or no authority to sponsor system change.

Manager response should vary based on that credibility. A strong observer may get credit for escalation, while an architect-level answer from a junior coordinator should be marked as unrealistic unless framed as a recommendation routed through proper channels.

# 10. Manager Disposition and Escalation Logic

Manager behavior should depend on:
- budget sensitivity;
- technical fluency;
- urgency;
- trust in player;
- risk tolerance;
- implementation appetite;
- political capital;
- openness to vendors;
- fear of compliance or security exposure.

Special handling:
- Startup: if the player raises SFMC or similar platform questions, first test role credibility, company readiness, and whether a smaller solution is more realistic;
- Mid-Level and above without strong backend support: managers should focus on cost, ownership, sequencing, and whether data foundation work must precede platform choice.

Escalation paths may include:
- direct manager review;
- manager’s manager;
- finance;
- security or privacy review;
- operations review;
- SWE intake;
- architecture review.

Possible outcomes: approval, rejection, delay, redirect to non-SFMC path, or escalation for next-stage review.

# 11. Communication Artifact Flow

Case communications may include:
- Teams messages;
- manager follow-up chats;
- email threads and forwards;
- finance questions;
- security review questions;
- SWE intake notes;
- architecture review requests;
- launch approval notes.

Maturity affects artifact style. Lower-maturity companies rely more on chat, inboxes, and spreadsheet attachments. Higher-maturity companies add formal review notes, approval records, and structured intake trails.

# 12. Simulation Loop

Each case should follow a realistic troubleshooting loop:
1. intake of a ticket, complaint, launch issue, or production incident;
2. review of company context;
3. review of accepted role context;
4. review of available evidence;
5. investigation of artifacts;
6. identification of likely root cause or structural problem;
7. evaluation of realistic next-step solution options;
8. proposal of technical or process fix;
9. blast-radius and risk assessment;
10. escalation decision if needed;
11. final resolution outcome.

This should feel like real operational work, not a quiz.

# 13. Case Structure

Each case should include:
- case ID;
- title;
- hidden company tier;
- company context reference;
- accepted role reference;
- business complaint;
- severity;
- business context;
- environment context;
- player objective;
- available artifacts;
- hidden root cause or structural blocker;
- acceptable fixes;
- acceptable next-step recommendations;
- risks;
- scoring criteria;
- success conditions;
- failure conditions.

Phase 1 defines the template only, not actual scenario content.

# 14. Artifact System

Evidence types supported by the foundation include:
- Jira-style ticket;
- Slack or Teams excerpt;
- email complaint;
- API payload sample;
- Data Extension snapshot;
- Journey configuration summary;
- SQL query excerpt;
- send log summary;
- AMPscript snippet;
- QA note;
- stakeholder message;
- incident timeline;
- platform warning or error output;
- spreadsheet export;
- manually maintained CSV;
- launch checklist;
- approval note;
- CRM field mapping document.

Each artifact type should define:
- what it is;
- what it can reveal;
- how reliable or misleading it may be;
- whether it is always available or maturity-dependent;
- which maturity tiers are most likely to use it;
- which accepted roles are most likely to access it.

Spreadsheet and CSV artifacts should be common in Startup and Mid-Level contexts. Formal config summaries, runbooks, approvals, and architecture artifacts should appear more often in Anchor or Government contexts.

# 15. Player Submission Format

Player responses should be structured and operationally realistic. Required sections:
- suspected root cause;
- supporting evidence;
- impacted system or component;
- recommended immediate fix;
- recommended long-term fix;
- recommended next-step solution path;
- whether SFMC is appropriate, inappropriate, premature, or one of several options;
- confidence level;
- blast radius or risk assessment;
- whether escalation is recommended;
- prevention recommendation;
- assumptions or unknowns.

# 16. Evaluation Model

The simulator should score:
- root-cause correctness;
- evidence quality;
- safety and quality of proposed fix;
- business-impact awareness;
- awareness of data integrity, consent, compliance, and operational risk;
- over-fixing vs under-fixing;
- escalation quality;
- upstream vs downstream ownership judgment;
- realism of next-step solution recommendation;
- maturity and readiness awareness;
- fit with accepted role authority.

Partial-credit distinctions should include:
- technically correct but incomplete;
- wrong root cause but reasonable investigation;
- correct diagnosis but dangerous fix;
- correct fix but weak evidence;
- strong immediate mitigation but weak prevention;
- enterprise-grade answer proposed in a Startup environment;
- recommending SFMC when a lighter path is more realistic;
- rejecting SFMC appropriately because the company is not ready;
- choosing the right solution class with weak justification;
- giving a sound architect answer that is unrealistic for the accepted role.

# 17. Resolution States

Supported end states:
- successful resolution;
- partial resolution;
- unresolved;
- false resolution;
- harmful resolution;
- escalation required;
- time exceeded or business impact worsened;
- technically correct but organizationally unrealistic resolution;
- solution recommendation rejected for poor fit;
- solution recommendation accepted for next-stage review.

These states distinguish technical correctness from practical realism and organizational fit.

# 18. UI Structure

Minimum player-facing UI sections:
- case overview;
- company context panel;
- accepted role panel;
- artifact viewer;
- investigation notes;
- response submission panel;
- feedback and evaluation panel;
- score and progression display.

The company context panel should expose realistic employee knowledge without revealing hidden maturity labels or readiness scores. The role panel should show scope, access, expectations, and manager context without exposing hidden scoring logic.

# 19. Reusable Case Template

Use a compact implementation-friendly schema that supports:
- hidden maturity tier;
- hidden readiness scores;
- persistent company context;
- accepted role context;
- maturity-sensitive artifact availability;
- role-sensitive artifact access;
- hidden root cause or structural blocker;
- multiple acceptable fixes;
- multiple acceptable next-step solution paths;
- scoring dimensions;
- escalation outcomes.

Phase 1 includes a reusable YAML-like template in code so future phases can instantiate cases without changing the underlying architecture.

# 20. Future-Phase Constraints

Future phases must preserve these rules:
- support both technical and process failures;
- allow misleading clues and partial truth in artifacts;
- support partial-credit scoring;
- allow multiple valid fixes;
- allow multiple valid next-step solution paths;
- let maturity silently shape realism and difficulty;
- keep company-specific data structures;
- let accepted role shape access, expectations, and evaluation;
- plug future SFMC backend realism cleanly into the same foundation;
- ensure AMPscript, journeys, DEs, transactional systems, consent logic, and cross-functional incidents inherit company context;
- support cases where SFMC is not yet the right recommendation.

# 21. Phase 2 Prompt

```text
Phase 2 only: build the Salesforce Marketing Cloud realism layer on top of the existing simulator foundation. Reuse the hidden maturity system, hidden readiness scores, accepted-role logic, Northbeam HomeProtect company context, artifact rules, and scoring framework from Phase 1. Do not rebuild the foundation. Instead define the SFMC-specific operating model for this company, including: ContactKey strategy options and tradeoffs; subscriber, contact, policy, and claim data modeling; Data Extension categories and grain rules; journey entry-source patterns; send classification concepts; suppression and consent handling; CRM and policy-system sync behavior; event and API ingestion patterns; common failure modes; realistic DE snapshots and payload shapes; and role-based access to those artifacts. Keep SFMC as one possible solution path, not the default answer, and preserve role- and maturity-sensitive realism. Do not generate a large case library yet—only build the modular technical layer that future cases will use.
```
