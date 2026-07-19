import type { EmployerAccount } from '../../state/useCompanyStore';

// Role-based work assignments: realistic deliverables with deadlines, priority,
// and complexity, generated deterministically per employer account and surfaced
// in the Workday inbox (with countdown pressure) and Outlook.

export type TaskComplexity = 'Starter' | 'Moderate' | 'Complex' | 'Critical';

export type RoleTask = {
  id: string;
  title: string;
  brief: string;
  deliverable: string;
  stakeholder: string;      // requester title
  complexity: TaskComplexity;
  estHours: number;
  dueAt: number;            // epoch ms
  tags: string[];
};

type TaskTemplate = {
  title: string;
  brief: string;
  deliverable: string;
  stakeholder: string;
  complexity: TaskComplexity;
  estHours: number;
  dueOffsetHours: number;
  tags: string[];
};

const SWE: TaskTemplate[] = [
  { title: 'Fix flaky checkout integration test', brief: 'The checkout-service integration suite fails ~1 in 8 runs on CI with a socket timeout in test_payment_capture. Reproduce locally with the stress runner, identify the race between the mock payment gateway and the retry middleware, and land a deterministic fix. Do not raise the timeout — find the root cause.', deliverable: 'PR with the fix, a one-paragraph root-cause note in the description, and 50 consecutive green stress runs attached.', stakeholder: 'Engineering Manager', complexity: 'Moderate', estHours: 6, dueOffsetHours: 30, tags: ['CI', 'testing', 'backend'] },
  { title: 'Implement per-tenant rate limiting on the public API', brief: 'Product committed to per-tenant rate limits for the v2 public API. Design a token-bucket limiter backed by Redis with burst allowance, per-plan quotas (free: 60 rpm, pro: 600 rpm, enterprise: custom), and 429 responses with Retry-After. Must add <2ms p99 overhead.', deliverable: 'Design doc (1-2 pages) reviewed by the team, implementation PR behind a feature flag, and a load-test report.', stakeholder: 'Staff Engineer', complexity: 'Complex', estHours: 20, dueOffsetHours: 96, tags: ['API', 'infra', 'design'] },
  { title: 'Sev-2 postmortem: elevated 500s on search', brief: 'Yesterday 14:05–14:41 UTC search returned elevated 500s (peak 3.2%). The on-call mitigated by rolling back deploy 2025.07.18-3. You own the postmortem: build the timeline from PagerDuty and Grafana, identify the trigger and the defense-in-depth gaps, and propose action items with owners.', deliverable: 'Blameless postmortem doc circulated to eng-all, with at least 4 action items filed as tickets.', stakeholder: 'Director of Engineering', complexity: 'Moderate', estHours: 5, dueOffsetHours: 22, tags: ['incident', 'reliability'] },
  { title: 'Review: migration PR touching 40 files', brief: "A teammate's PR migrates the notification service from callbacks to async/await across 40 files. Review for correctness (swallowed rejections, missing awaits in hot paths), API compatibility, and test coverage. The author is blocked on you to make the release train.", deliverable: 'Completed review with line comments; approve or request changes with concrete reasons.', stakeholder: 'Senior Engineer (peer)', complexity: 'Starter', estHours: 3, dueOffsetHours: 8, tags: ['code review', 'urgent'] },
  { title: 'Reduce cold-start latency of the image service', brief: 'Cold starts on the image-resize Lambda hit 2.8s p95, blowing the 800ms SLO for first-load thumbnails. Profile init, evaluate provisioned concurrency vs. slimming the bundle (currently 210MB with sharp + three unused SDKs), and ship the best option within budget.', deliverable: 'Before/after p95 traces and a PR; SLO dashboard green for 48h.', stakeholder: 'Platform Lead', complexity: 'Complex', estHours: 14, dueOffsetHours: 120, tags: ['performance', 'serverless'] },
];

const CONSULTING: TaskTemplate[] = [
  { title: 'Market sizing: US home-EV-charger installation', brief: 'The client (a national electrical contractor) is considering entering residential EV charger installation. Build a top-down and bottom-up TAM/SAM/SOM for the US market with 5-year projection, state-level breakdown for the top 10 states, and sensitivity to federal incentive scenarios.', deliverable: 'Excel model with documented assumptions + 5-slide summary for the partner read-out.', stakeholder: 'Engagement Manager', complexity: 'Complex', estHours: 16, dueOffsetHours: 72, tags: ['modeling', 'client-ready'] },
  { title: 'Client steering-committee deck — Week 3', brief: 'Draft the Week 3 SteerCo deck for the cost-transformation engagement: progress vs. plan, the two workstreams at risk (procurement savings tracking 60% of target; IT rationalization blocked on inventory data), decisions needed from the CFO, and next-week plan. Partner reviews at 7:30am — no second draft window.', deliverable: '12-15 slide deck in client template, storylined, QC-clean (titles read as a narrative).', stakeholder: 'Partner', complexity: 'Moderate', estHours: 8, dueOffsetHours: 18, tags: ['deck', 'urgent', 'SteerCo'] },
  { title: 'Expert interview guide + 3 interviews', brief: 'For the diligence sprint on a warehouse-automation target, prepare an interview guide (competitive moat, switching costs, pricing pressure, integration risk) and run 3 expert calls from the GLG list. Synthesize contrarian signals — the deal team suspects the pipeline is overstated.', deliverable: 'Interview guide + 1-page synthesis per call + red-flag summary.', stakeholder: 'Principal', complexity: 'Moderate', estHours: 10, dueOffsetHours: 48, tags: ['diligence', 'primary research'] },
  { title: 'Benchmark: SG&A ratios for 8 peers', brief: "Pull SG&A as % of revenue for 8 named competitors from 10-Ks for the last 3 fiscal years, normalize for one-offs (restructuring charges, litigation), and produce a quartile view showing where the client's 24.1% sits.", deliverable: 'Benchmark table + waterfall of the gap to median, footnoted to filings.', stakeholder: 'Engagement Manager', complexity: 'Starter', estHours: 5, dueOffsetHours: 26, tags: ['benchmarking', 'analysis'] },
];

const ANALYST: TaskTemplate[] = [
  { title: 'Weekly KPI pack — due before Monday leadership sync', brief: 'Refresh the weekly business review pack: revenue vs. plan, activation funnel, retention cohorts, and top-3 anomaly callouts. The pipeline job that feeds the retention table failed Saturday — re-run it and validate row counts before publishing.', deliverable: 'Published dashboard + 1-page narrative of what changed and why.', stakeholder: 'Head of Analytics', complexity: 'Starter', estHours: 4, dueOffsetHours: 16, tags: ['reporting', 'urgent'] },
  { title: 'Churn driver deep-dive', brief: 'Logo churn in the SMB segment rose from 2.1% to 3.4% monthly over two quarters. Decompose by acquisition channel, plan tier, support-ticket volume, and feature adoption. Build a simple logistic model to rank drivers and validate the top driver with a cohort cut.', deliverable: 'Analysis doc with methodology, ranked drivers, and 3 recommended interventions.', stakeholder: 'VP of Growth', complexity: 'Complex', estHours: 18, dueOffsetHours: 96, tags: ['SQL', 'modeling'] },
  { title: 'Instrument the new onboarding flow', brief: 'Product ships a redesigned onboarding flow Thursday. Define the event schema (step_viewed, step_completed, drop_reason), review it with engineering, and build the funnel dashboard so there is zero data gap at launch.', deliverable: 'Tracking plan doc + live dashboard with launch-day annotation.', stakeholder: 'Product Manager', complexity: 'Moderate', estHours: 7, dueOffsetHours: 40, tags: ['instrumentation', 'launch'] },
];

const FINANCE: TaskTemplate[] = [
  { title: 'Monthly close: accrual reconciliation', brief: 'Day-3 of close. Reconcile the marketing and cloud-infrastructure accrual accounts: tie POs to invoices received, true-up the estimate for un-invoiced AWS usage, and clear the $48k unexplained variance in account 2205 before the controller sign-off.', deliverable: 'Reconciliation workbook with tie-outs and journal entries posted.', stakeholder: 'Controller', complexity: 'Moderate', estHours: 8, dueOffsetHours: 20, tags: ['close', 'urgent'] },
  { title: 'Q3 reforecast — opex walk', brief: 'Build the Q3 reforecast opex walk from the Q2 exit run-rate: headcount adds by department (from the approved req list), merit cycle impact, vendor renewals >$50k, and FX. Flag any department tracking >5% over plan with a one-line driver.', deliverable: 'Reforecast model tab + variance walk slide for the CFO.', stakeholder: 'FP&A Manager', complexity: 'Complex', estHours: 12, dueOffsetHours: 60, tags: ['forecast', 'modeling'] },
  { title: 'Fraud alert triage queue', brief: 'The rules engine flagged 37 transactions overnight (velocity + geo-mismatch rules). Work the queue: clear false positives, escalate confirmed fraud to the bank within the 24h SLA window, and note rule-tuning suggestions for the two rules generating >60% of false positives.', deliverable: 'Cleared queue + escalation forms + rule-tuning memo.', stakeholder: 'Risk Operations Lead', complexity: 'Starter', estHours: 4, dueOffsetHours: 12, tags: ['risk', 'SLA'] },
];

const AIML: TaskTemplate[] = [
  { title: 'Ship reranker A/B to 5% traffic', brief: 'The new cross-encoder reranker beat baseline by +3.1% NDCG@10 offline. Wire it behind the experiment flag, define guardrail metrics (p95 latency <120ms, zero-result rate), and launch to 5% with a rollback trigger.', deliverable: 'Experiment live + launch doc with success/guardrail criteria.', stakeholder: 'ML Lead', complexity: 'Moderate', estHours: 9, dueOffsetHours: 48, tags: ['experiment', 'ranking'] },
  { title: 'Root-cause the training loss spike', brief: 'Nightly finetune run 412 diverged at step 18k (loss 2.1 → 9.7). Bisect: bad data shard vs. LR schedule change vs. the new packing logic merged Tuesday. Reproduce on a small slice and add an alert so divergence pages within 30 minutes.', deliverable: 'RCA note + fix + monitoring alert merged.', stakeholder: 'Research Engineer (peer)', complexity: 'Complex', estHours: 12, dueOffsetHours: 36, tags: ['training', 'debugging'] },
  { title: 'Label quality audit for the eval set', brief: 'Before the quarterly model report, audit 300 sampled labels in the intent-classification eval set (suspected drift after the taxonomy change). Measure inter-annotator agreement, fix systematic errors, and version the corrected set.', deliverable: 'Audit report with agreement stats + eval-set v2 checked in.', stakeholder: 'Applied Science Manager', complexity: 'Starter', estHours: 6, dueOffsetHours: 72, tags: ['evaluation', 'data quality'] },
];

const DEVOPS: TaskTemplate[] = [
  { title: 'Rotate expiring TLS certs — prod gateway', brief: 'The wildcard cert for the API gateway expires in 6 days. Rotate via the new ACM automation, verify SAN coverage for the three legacy subdomains, and confirm zero-downtime swap in staging first. Update the runbook while you are in there.', deliverable: 'Rotated certs, staging + prod verification screenshots, updated runbook.', stakeholder: 'SRE Lead', complexity: 'Starter', estHours: 3, dueOffsetHours: 24, tags: ['security', 'deadline-hard'] },
  { title: 'Cut compute spend 15% without SLO impact', brief: 'Cloud bill is 22% over budget. Identify savings: right-size the 3 largest node groups (CPU p95 <30%), move batch workloads to spot with checkpointing, and kill zombie environments older than 30 days. Model the SLO risk for each change.', deliverable: 'Savings plan with $ impact per line, first two changes shipped.', stakeholder: 'VP Infrastructure', complexity: 'Complex', estHours: 16, dueOffsetHours: 120, tags: ['cost', 'kubernetes'] },
  { title: 'Postmortem action item: DB failover drill', brief: 'From last month\'s incident review: run a controlled failover drill on the orders database replica pair in staging, measure actual RTO vs. the documented 90s, and fix the stale DNS TTL issue if it reproduces.', deliverable: 'Drill report with measured RTO + fixes merged.', stakeholder: 'Engineering Manager', complexity: 'Moderate', estHours: 6, dueOffsetHours: 72, tags: ['reliability', 'drill'] },
];

const QUANT: TaskTemplate[] = [
  { title: 'Validate the new momentum signal', brief: 'Research handed off a cross-sectional momentum signal (12-1 with sector neutralization). Run the validation battery: IC decay, turnover, capacity at $500M, factor crowding vs. Barra momentum, and 2008/2020 regime behavior. Kill it if net-of-cost Sharpe <0.4.', deliverable: 'Validation note with go/no-go recommendation for the PM meeting.', stakeholder: 'Portfolio Manager', complexity: 'Complex', estHours: 15, dueOffsetHours: 72, tags: ['research', 'backtest'] },
  { title: 'Fix the overnight P&L attribution break', brief: 'This morning\'s attribution shows a $340k unexplained residual in the rates book. Trace it: new swaption trades booked late Friday are missing vol surface marks. Rebook with correct marks and add a completeness check to the EOD job.', deliverable: 'Corrected attribution + validation check merged before tomorrow\'s run.', stakeholder: 'Desk Head', complexity: 'Moderate', estHours: 6, dueOffsetHours: 14, tags: ['P&L', 'urgent'] },
];

const RISK_INS: TaskTemplate[] = [
  { title: 'Quarterly stress-test pack', brief: 'Run the four board scenarios (rates +300bp, credit spread blowout, housing -20%, combined) through the portfolio engine, reconcile to last quarter\'s results, and draft the risk-committee summary flagging any limit breaches.', deliverable: 'Stress pack + limit-breach memo for the CRO.', stakeholder: 'Head of Market Risk', complexity: 'Complex', estHours: 14, dueOffsetHours: 96, tags: ['stress testing', 'committee'] },
  { title: 'Underwriting referral: fleet policy', brief: 'A commercial auto fleet renewal (142 vehicles, 3 at-fault losses last term) breached the auto-bind threshold. Review loss runs, telematics adoption, and driver-turnover data; price the renewal with an appropriate schedule modifier and document your rationale.', deliverable: 'Referral decision with pricing worksheet and rationale.', stakeholder: 'Senior Underwriter', complexity: 'Moderate', estHours: 5, dueOffsetHours: 28, tags: ['underwriting', 'pricing'] },
];

const POOLS: Record<string, TaskTemplate[]> = {
  swe: SWE, fullstack: SWE, devops: DEVOPS,
  aiml: AIML, aiintegr: AIML,
  consulting: CONSULTING,
  analyst: ANALYST, financebiz: FINANCE,
  quant: QUANT, quantfin: QUANT,
  risk: RISK_INS, insurance: RISK_INS,
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

// Deterministic per-account assignment set. Deadlines are anchored to the
// account start date's week so they stay stable across reloads but still feel
// live: a mix of overdue-risk (<24h), near (2-3d), and planning-horizon items.
export function generateRoleTasks(account: EmployerAccount, now = Date.now()): RoleTask[] {
  const pool = POOLS[account.department] ?? POOLS[account.department.toLowerCase()] ?? SWE;
  const h = hash(account.id + account.companyName);
  const count = Math.min(pool.length, 5);
  const tasks: RoleTask[] = [];
  // anchor deadlines to "today" boundaries so countdowns are meaningful
  const dayStart = new Date(now);
  dayStart.setHours(9, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const t = pool[(h + i) % pool.length];
    const jitterH = ((h >> (i * 3)) % 5) - 2;
    const dueAt = dayStart.getTime() + (t.dueOffsetHours + jitterH) * 3600_000;
    tasks.push({
      id: `task-${account.id}-${i}`,
      title: t.title,
      brief: t.brief,
      deliverable: t.deliverable,
      stakeholder: t.stakeholder,
      complexity: t.complexity,
      estHours: t.estHours,
      dueAt,
      tags: t.tags,
    });
  }
  return tasks.sort((a, b) => a.dueAt - b.dueAt);
}

export type TaskState = { status: 'open' | 'submitted' | 'completed'; submittedAt?: number; note?: string };

const LS_KEY = 'aos_role_task_state';

export function loadTaskStates(): Record<string, TaskState> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}'); } catch { return {}; }
}

export function saveTaskStates(states: Record<string, TaskState>): void {
  localStorage.setItem(LS_KEY, JSON.stringify(states));
}

export function formatCountdown(dueAt: number, now = Date.now()): { label: string; tone: 'overdue' | 'urgent' | 'soon' | 'ok' } {
  const ms = dueAt - now;
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600_000);
  const m = Math.floor((abs % 3600_000) / 60_000);
  const d = Math.floor(h / 24);
  const label = d >= 1 ? `${d}d ${h % 24}h` : h >= 1 ? `${h}h ${m}m` : `${m}m`;
  if (ms < 0) return { label: `Overdue by ${label}`, tone: 'overdue' };
  if (ms < 24 * 3600_000) return { label: `Due in ${label}`, tone: 'urgent' };
  if (ms < 72 * 3600_000) return { label: `Due in ${label}`, tone: 'soon' };
  return { label: `Due in ${label}`, tone: 'ok' };
}
