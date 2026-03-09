# Enterprise Simulation Architecture

## 1) Account model
- Central store: `src/state/useCompanyStore.ts`.
- Core entities:
  - `CompanyDirectoryItem`: domain, archetype, branding, careers metadata.
  - `EmployerAccount`: employer-scoped identity (`employeeId`, `companyEmail`, credentials, title, manager, compensation, status).
  - Session state per surface: active Outlook mailbox, active Workday account, active CoLab account.
- Employer accounts are created through offer-acceptance automation (`ensureEmployerFromOffer`).

## 2) Promotion model
- Trigger: reply email containing `PROMOTION%` (extra `%` => additional steps).
- Engine: `applyPromotionCommand(companyEmail, percentCount, trigger)`.
- Inputs:
  - company archetype ladder
  - current title
  - percent count
- Outputs:
  - title transition
  - compensation update
  - `PromotionRecord` appended to history
- Guardrail: ladder ceiling stops before top executive-like tier; executive/board path is separate.

## 3) Company website registry
- Company registry is sourced from curated company records in `useCompanyStore`.
- Safari renders generic company pages from registry metadata (domain, industry, branding color, careers copy).
- Search/address behavior:
  - domain navigation (`https://company.com`)
  - direct company-name input mapping (`Company Name` -> domain)

## 4) Email generation logic
- On offer acceptance (`I ACCEPT`), Outlook creates employer account using:
  - company + role + manager + compensation + location
  - deterministic email formatting with conflict fallback
- Email format strategy:
  - `firstname.lastname@domain`
  - fallbacks: `flastname@domain`, `firstnamelastname@domain`, `lastname.firstname@domain`
  - numeric suffix if collisions occur.

## 5) Extending companies
1. Add company metadata in the company registry source.
2. Ensure domain and archetype are defined.
3. Optionally customize careers summary and brand color.
4. Company becomes available to Safari website rendering and account provisioning.

## 6) Extending promotion ladders
1. Add/adjust archetype ladder in `LADDERS`.
2. Keep non-executive terminal role at end-1 to preserve executive guardrail.
3. Tune compensation band in `salaryBump`.

## 7) Extending store apps
1. Add app metadata in `src/data/apps.ts`.
2. Add Virtue listing in `src/data/virtue/catalog.ts`.
3. Add lazy loader and window render branch in `src/App.tsx`.

## 8) IDE language support growth path
- Current PyCharm simulation supports tabbed project explorer and code panels.
- To add language support:
  1. Add tokenizer/highlighter map per extension.
  2. Add diagnostics pass (basic parse checks).
  3. Add run-config abstraction for language-specific commands.
