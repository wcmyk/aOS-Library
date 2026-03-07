# AsterHCM Enterprise Architecture (Workday-in-Safari)

## High-level architecture
- **Frontend host**: existing AoS desktop shell (React + TypeScript + Vite).
- **HCM app surface**: Workday site in Safari (`WorkdaySite`) using modular feature panels.
- **State domain layer**: centralized HCM store (`useHcmStore`) as a backend-ready domain seam.
- **Workflow orchestration**: deterministic workflow methods in store (approval + status transitions + audit event writes).
- **Observability/audit**: immutable event append log for sensitive actions (comp, legal, payroll, leave).

## Core modules
- Core HR (employee profiles + employment lifecycle)
- Org Structure (legal entities, business units, departments, cost centers)
- Recruiting (requisitions, candidates, offers)
- Onboarding/Offboarding (tasks, packets, completion)
- Time & Attendance (timesheets, approvals)
- Leave Management (balances, requests, status)
- Payroll & Compensation (pay periods, payroll runs, comp records)
- Legal/Compliance Forms (templates, packets, completion)
- Calendar & Scheduling (HR deadlines + team schedule events)
- Workflow & Approvals (generic action inbox)
- Reporting/Analytics (headcount and approvals snapshots)

## Data model
Primary entities represented in the store:
- `HcmUser`, `Employee`, `OrgNode`, `Position`
- `JobRequisition`, `Candidate`, `Offer`
- `OnboardingTask`, `OffboardingTask`
- `Timesheet`, `TimeEntry`
- `LeaveBalance`, `LeaveRequest`
- `CompensationRecord`, `PayPeriod`, `PayrollRun`
- `LegalFormTemplate`, `LegalPacket`, `LegalDocument`
- `ApprovalRequest`, `CalendarEvent`, `Notification`, `AuditEvent`

## Role/permission matrix
- Employee: self-service profile/time/leave/forms + own tasks.
- Manager: direct-report visibility + leave/time approvals + comp proposals.
- HRBP: broad employee/recruiting/onboarding visibility and edits.
- Recruiter: requisition/candidate/offer management.
- Payroll Admin: payroll run + pay input + period lock operations.
- Finance Admin: budget/comp approvals + payroll cost oversight.
- Legal/Compliance Admin: legal template/packet/compliance oversight.
- Benefits Admin: enrollment and leave policy operations.
- IT Admin: provisioning task and status ops.
- Executive: aggregate read-only dashboards.
- Super Admin: full configuration and override access.

## Key workflows
1. Hiring Request → Employee Creation
2. Compensation Change
3. Time → Payroll
4. Leave Request
5. Legal Packet Completion
6. Termination / Offboarding

Each workflow writes state changes and appends immutable `AuditEvent` records.

## API design (target)
Planned REST domains (backend-ready seam):
- `GET /me`, `GET /roles`
- `GET/POST/PATCH /employees`
- `GET/POST/PATCH /requisitions`, `/candidates`, `/offers`
- `GET/POST/PATCH /timesheets`, `/time-entries`
- `GET/POST/PATCH /leave-requests`, `/leave-balances`
- `GET/POST/PATCH /comp-records`, `/payroll-runs`, `/pay-periods`
- `GET/POST/PATCH /legal-templates`, `/legal-packets`, `/legal-documents`
- `GET/POST/PATCH /approvals`
- `GET /analytics/*`
- `GET /audit-events`

## Frontend architecture
- `WorkdaySite` as enterprise shell within Safari.
- Module switcher + dense grid surfaces + right detail/action panels.
- Shared typed source of truth in `useHcmStore`.
- Workflow action buttons invoking domain methods.

## Backend architecture (target)
- API Gateway / BFF
- Auth + RBAC service
- HR Core service
- Recruiting service
- Payroll/Time processing service
- Document/Legal service
- Workflow/Approvals engine
- Notification service
- Reporting read models + analytics jobs

## Database schema (target outline)
- Multi-tenant keying (`tenant_id`) on domain tables.
- FK constraints across employee/org/position/requisition/time/payroll/legal.
- Versioned tables for comp + legal templates/docs.
- Audit append-only table with actor/action/entity snapshots.

## Implementation roadmap
- **MVP (now)**: frontend enterprise HCM module + typed data model + seeded workflows + audit trail.
- **V1**: API + Postgres schema + RBAC enforcement server-side + persistent events.
- **V2**: workflow builder, document generation, payroll calc engine, integrations.

## Initial code scaffolding (this iteration)
- `src/state/useHcmStore.ts`
- `src/apps/safari/sites/WorkdaySite.tsx`
- `src/styles.css` enterprise HCM style system additions

## Sample seed data
- Legal entities, departments, cost centers
- Active employees + managers
- Requisitions, candidates, offers
- Timesheets, leave balances, leave requests
- Payroll periods + runs
- Legal templates + packets
- Approval inbox and audit events

## Major risks and edge cases
- Payroll calculations require jurisdictional tax rule engines (future backend service).
- Legal packet compliance can become regionally complex (template version + conditional logic).
- Approval loops/escalations need robust SLA + delegate handling.
- Row-level permission correctness is critical for sensitive compensation/legal data.
- Event ordering/idempotency must be guaranteed once background jobs are introduced.
