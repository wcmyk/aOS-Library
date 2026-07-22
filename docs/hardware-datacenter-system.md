# aOS Technology Manufacturing & Data-Center Infrastructure System
## Game Design + Implementation Document

Status: Design approved for phased implementation. Phase 1 code ships with this document
(see §26 Roadmap and the `Implemented in Phase 1` callouts throughout).

This document specifies a complete computer-hardware, technology-manufacturing, and
data-center infrastructure system for aOS, integrated with the systems that already
exist in this repository:

| Existing system | Where it lives today | Role in this feature |
|---|---|---|
| Amazon marketplace | `src/apps/safari/sites/AmazonSite.tsx`, `src/data/amazonCatalog.ts` | Retail component purchasing (BOM → cart → checkout) |
| Chase banking | `src/apps/banking/BankingApp.tsx` (derives from `useWalletStore` + `useDevStore`) | All money movement, financing |
| Wallet ledger | `src/state/useWalletStore.ts` (`WalletOrder`) | Cross-app purchase ledger; every hardware spend becomes a bank transaction |
| Workday / hiring pipeline | `LinkedInSite.tsx` → `OutlookApp.tsx` (`JobMeta` stages) → `useCompanyStore.ensureEmployerFromOffer` → `WorkdaySite.tsx`, `useHcmStore` | Recruiting technicians/engineers; org structure; payroll |
| Real estate | `src/apps/realtor/RealtorApp.tsx` (HomeFind), `src/apps/rentcafe/RentCafeApp.tsx`, `src/apps/spacey/SpaceyApp.tsx` | Property search/lease/purchase for workshops, warehouses, data-center sites |
| Inventory | `src/state/useCircuitLabStore.ts` + `src/apps/inventory/InventoryApp.tsx` | Pattern for stock/consume; extended with per-location hardware inventory |
| Project management | `src/apps/workhub/WorkHubApp.tsx` (`useWorkHubStore`, `Project.budgetUSD`) | UI/model template for project tracking |
| Company registry | `src/data/companies.ts` (`REAL_COMPANIES` incl. NVIDIA, Dell, HPE, Equinix, Samsung) | Supplier identities for wholesale contracts |
| People simulation | `src/data/people.ts` (`buildPerson`, `personPhoto`) | Applicant/engineer NPC generation |
| Notifications | `src/state/useNotifyStore.ts` | Delivery, incident, and milestone alerts |
| Window shell | `src/data/apps.ts` + `src/App.tsx` + `useShellStore.openWindow` | New "Forge" app registration; deep links between apps |

The feature's front door is a new desktop app — **Forge (Technology Projects)** — plus
surgical extensions to the apps above. Nothing here duplicates an existing system; every
requirement in a project deep-links to the app that already owns that domain.

---

## 1. Core Design Philosophy

1. **Hardware is an engineering ecosystem, not an upgrade tree.** Every buildable thing —
   a $700 budget PC or a 40 MW AI campus — is the same data shape: a `HardwareBlueprint`
   realized through a `ComputingProject` that consumes components, labor, space, power,
   and money. Scale changes the numbers and the risks, never the mechanic.
2. **No forced goals.** The game never tells the player to build a data center. Projects
   are player-initiated; the only gates are physics (power, heat, space), economics
   (capital, cash flow), organizations (skills, headcount), and relationships (supplier
   trust). Progression stages (§19) are descriptive, not level locks.
3. **Reuse, never duplicate.** "Hire a network engineer" opens the LinkedIn/Outlook/Workday
   pipeline that already exists. "Buy 8 GPUs" opens Amazon. "Find a warehouse" opens
   HomeFind. Forge is a dashboard and design studio that *reads* shared stores; it owns
   only the domain state no other app owns (blueprints, projects, facilities, contracts).
4. **Employees are people, not percentage bonuses.** Every assigned employee contributes
   through their specific skill vector, and their weaknesses create specific failure
   modes (§8.4): a weak thermal engineer under-specs cooling and the cluster throttles;
   a green technician has a real probability of cracking a $2,300 GPU during install.
5. **Everything settles to the bank.** All spending emits `WalletOrder`s (or `useDevStore`
   transfers/charges) so the Chase app shows the true cost of the player's ambitions,
   and all revenue lands as deposits. There is no separate "game money."

### 1.1 The Complete Gameplay Loop (Deliverable #1)

```
IDENTIFY NEED ─► DEFINE WORKLOAD ─► SET BUDGET ─► DESIGN (blueprint)
      ▲                                               │
      │                                               ▼
   OPERATE ◄─ LAUNCH ◄─ TEST/REVISE ◄─ ASSEMBLE ◄─ ACQUIRE
   │  │  │                                 ▲        │ components (Amazon / wholesale / salvage / fab)
   │  │  └─ sell / rent capacity / use     │        │ people (LinkedIn → Outlook → Workday)
   │  └──── maintain, repair, expand       │        │ property (HomeFind / RentCafe / Spacey)
   └─────── revenue → Chase → next need    │        │ money (Chase / loans / investors)
                                           └────────┘ construction (new Buildout system, §11)
```

Each arrow is a concrete store action defined in §29 (API). The loop is identical at all
scales; only the acquisition mix changes (retail → wholesale → direct contracts → internal
manufacturing).

---

## 2. Computing Project Types

`ComputingProject.kind` is an open enum. Types differ only in their default requirement
templates (§13.2) — the state machine (§29.4) is shared.

**Personal** (`pc.*`): budget PC, office PC, gaming PC, streaming PC, editing/3D/dev/
scientific workstation, compact PC, luxury PC, overclocked enthusiast PC.
Requires: a location with a `workbench` feature (any Home works), 1 builder (player or
technician), retail parts. Typical capital: $500–$12,000.

**Commercial hardware** (`biz.*`): prebuilt product line, business fleet, school contract,
workstation line, server manufacturing, consulting, repair shop, component reselling,
enterprise contractor. Requires: company entity, workshop/warehouse property, technicians
+ QA, distributor-tier supply, Amazon seller listings (§4.6). Capital: $30k–$5M.

**Infrastructure** (`infra.*`): server closet, office server room, dev lab, render farm,
AI inference cluster, AI training cluster, research supercomputer, mining facility,
private DC, colocation, cloud DC, hyperscale AI DC, distributed edge network.
Requires: industrial property, construction (§11), engineering org (§9), utility
agreements, direct supplier contracts for accelerators (§5). Capital: $80k–$2B+.

Every template sets: default priorities, required property features, required roles,
default BOM skeleton, risk profile, and revenue options. Full template table in §13.2.

---

## 3. Gaming PC Design System (Deliverable #3)

> **Implemented in Phase 1:** `src/data/hardwareCatalog.ts` (component models),
> `src/data/hardwareEngine.ts` (all formulas below), Forge → Designer tab.

### 3.1 Component slots

A `HardwareBlueprint` has slots: `cpu`, `gpu` (0–8 for workstations/servers), `motherboard`,
`ram` (1–8 sticks), `storage` (1–12 drives), `psu`, `cooling`, `case`, `caseFans` (0–10),
`network` (onboard/NIC), `os`, plus peripheral/monitor references (cosmetic + cost only).
Server blueprints add `bmc`, `railKit`, `psu2` (redundant). Each slot is filled by a
`ComponentModel` id from the catalog (§28.2).

### 3.2 ComponentModel stats that drive the simulation

| Category | Stats used by the engine |
|---|---|
| CPU | `cores`, `boostGhz`, `ipc` (0–150 index), `tdpW`, `socket`, `gen` |
| GPU | `vramGB`, `fp32Tflops`, `tensorTflops`, `tdpW`, `lengthMm`, `pcieGen`, `nvlink?` |
| Motherboard | `socket`, `chipsetTier` (1–3), `ramType` (DDR4/DDR5), `ramSlots`, `maxRamGhz`, `pcieSlots`, `formFactor` |
| RAM | `capacityGB`, `ramType`, `speedGhz`, `ecc?` |
| Storage | `capacityTB`, `kind` (nvme/sata/hdd), `readMBs`, `enduranceTBW` |
| PSU | `watts`, `efficiencyTier` (80+ Bronze=0.85 … Titanium=0.94), `modular?` |
| Cooling | `kind` (air/aio240/aio360/custom-loop/rack-liquid), `coolingW` (dissipation), `noiseDb` |
| Case | `formFactorMax`, `gpuMaxMm`, `airflowScore` (0–100), `fanMounts` |
| All | `priceUSD`, `mtbfHours`, `condition` multipliers (§4.3), `wholesaleTier` (§5), `tier` (`budget|consumer|enthusiast|professional|enterprise|prototype`) |

### 3.3 Compatibility rules (hard failures)

The engine returns `errors[]` (blocks assembly) and `warnings[]`:

- `cpu.socket !== mobo.socket` → error `SOCKET_MISMATCH`
- `ram.ramType !== mobo.ramType` → error `RAM_TYPE`
- ram sticks > `mobo.ramSlots` → error `RAM_SLOTS`
- `gpu.lengthMm > case.gpuMaxMm` → error `GPU_CLEARANCE`
- `mobo.formFactor` larger than `case.formFactorMax` → error `FORM_FACTOR`
- cooler kind `aio360` in case with < 3 fan mounts → warning `RADIATOR_FIT`
- `psuLoad > psu.watts` → error `PSU_OVERLOAD`; > 80% → warning `PSU_HEADROOM`
- `ram.speedGhz > mobo.maxRamGhz` → warning `RAM_DOWNCLOCK` (memory score uses mobo cap)
- no storage / no cpu / no psu … → error `MISSING_<SLOT>`
- ECC RAM on consumer chipset → warning `ECC_UNSUPPORTED` (runs non-ECC)

### 3.4 Performance & bottleneck model

Subsystem scores (0–1000 scale):

```
cpuScore  = ipc × (0.55×boostGhz + 0.45×ln(1+cores)×1.9)
gpuScore  = fp32Tflops × 9 + vramGB × 2            (gaming)
aiScore   = tensorTflops × 1.6 + min(vramGB,80)×5  (AI workloads; ×0.6 if no nvlink for multi-GPU)
memScore  = min(capacity factor, bandwidth) where
            capacityFactor = 1000×min(1, totalGB / workload.ramNeedGB)
            bandwidth      = effSpeedGhz × channels × 210
stoScore  = nvme: 6+readMBs/14 | sata: 380 | hdd: 120  (index vs workload.ioNeed)
```

Workload demand vectors (`WORKLOADS` table in `hardwareEngine.ts`) weight each subsystem,
e.g. `gaming-1440p = {cpu:0.9, gpu:1.25, mem:0.6, sto:0.35, ramNeedGB:16}`,
`ai-training = {cpu:0.5, gpu(ai):1.6, mem:1.0, sto:0.9, ramNeedGB:64}`.

```
effective[s]   = subsystemScore[s] / demand[s]
workloadScore  = harmonicMean(effective[]) × thermalFactor × psuFactor
bottleneck     = argmin(effective[])                       // named: CPU/GPU/MEMORY/STORAGE/THERMAL/POWER
balancePenalty = min(effective)/max(effective)             // <0.55 ⇒ "unbalanced build" warning
fpsEstimate    = workloadScore × workload.fpsPerPoint      // gaming workloads only
```

### 3.5 Thermal, power, noise, reliability, lifespan

```
heatW          = Σ tdpW × loadProfile (CPU 0.95, GPU 1.0, rest 0.1×)
airflowBonus   = case.airflowScore/100 × 60W + caseFans × 15W
thermalMargin  = cooling.coolingW + airflowBonus − heatW
thermalFactor  = margin ≥ 0 ? 1.0 : max(0.6, 1 + margin/heatW × 0.9)   // throttling
psuLoad        = heatW × 1.18 (transient)   ; psuFactor = load ≤ 0.8×watts ? 1 : 0.93
noiseDb        = 10×log10( Σ 10^(source_i/10) ) + (thermalMargin<50 ? +4 : 0)
                 sources: cooler.noiseDb, fans 24dB each, psu 20dB (fanless 0), gpu 28–41 by tdp
annualFailPct  = 1 − Π_i (1 − 8760/mtbf_i × cond_i)   // cond: new 1.0, refurb 1.35, used 1.9, salvage 2.6
lifespanYears  = 6 × min(1.25, 1000/Σstress) × conditionFloor    // stress ↑ with throttling & OC
resaleValue    = Σ price_i × 0.62 × 0.82^ageYears × conditionMult
upgradeScore   = free ram slots×8 + free pcie×10 + psuHeadroom%×0.5 + (case ≥ ATX ? 15 : 0)
assemblyDifficulty = base 20 + customLoop 35 + multiGPU 12/gpu + SFF case 18 + server 25   (0–100)
```

### 3.6 Priorities and assisted design

The player picks up to 3 priorities (gaming, latency, 4K, streaming, AI, dev, editing,
rendering, efficiency, quiet, reliability, aesthetics, upgradeability, portability, low
mfg cost). Priorities re-weight the recommendation optimizer:
`utility = Σ priorityWeight_p × normalizedMetric_p − λ × cost` with budget as a hard cap.
In Assisted Mode (§27) an assigned engineer runs the optimizer; the quality of the
result depends on their `skills.design` (§8.4): the optimizer samples `3 + design/20`
candidate builds and keeps the best, so a weak engineer ships a feasible-but-mediocre pick.

---

## 4. Amazon Marketplace Integration (Deliverable #6)

The Amazon storefront already sells `dept: 'components'` hardware (`cpu`, `gpu-ai`, `ram`,
`ssd`, `motherboard`, `psu`, `pc-case`, `cpu-cooler`, `chips`, `wafer`, `monitor`, …) but a
purchase today only writes a `WalletOrder` — nothing enters inventory. The integration:

### 4.1 Catalog bridge
Every retail-visible `ComponentModel` in `hardwareCatalog.ts` carries `amazonListing`:
`{ price (≈1.12–1.30× wholesale base), condition variants, delivery ('Tomorrow' | '2-day' | date), sellerId, prime }`.
`AmazonSite.tsx` gains a **"PC Components" storefront section** generated from the catalog
(same `Product` local shape via an adapter `toAmazonProduct(model, condition)`), replacing
none of the existing inline SKUs — the old flavor items stay.

Listing fields shown: price, seller, condition, brand, headline stats (from the stat table
§3.2), warranty months, delivery, seller rating, return window, qty available,
compatibility line ("LGA-1851 · DDR5 · 360mm GPU max"), and — for used/refurb/marketplace
sellers — `counterfeitRiskPct` and `doaRiskPct` badges (§21.4 rolls them on receipt).

### 4.2 BOM → cart handoff
Forge Designer's "Buy on Amazon" serializes the blueprint's bill of materials to
`useTechStore.pendingCart`, calls `useShellStore.openWindow('safari')` and navigates to
`amazon.com/forge-cart`. AmazonSite reads `pendingCart`, pre-fills its local cart, and lets
the player swap each line for cheaper/faster/used/refurb alternatives (same
`ComponentModel`, different `condition`/seller). **Implemented in Phase 1** as a direct
in-Forge checkout that emits the same `WalletOrder` (desc `AMAZON.COM*FORGE-<id>`) so
Chase reflects it; the Safari cart handoff is Phase 2 UI polish.

### 4.3 Checkout → shipment → inventory (the missing link)
On placing an order containing hardware items, in addition to `addOrder(walletOrder)`:

```
techStore.createShipment({
  orderId, source: 'amazon', destinationId: <selected owned/leased PropertyId>,
  lines: [{modelId, condition, qty, unitPrice}],
  etaAt: now + deliveryDays×86400s, status: 'in-transit'
})
```

Shipments resolve lazily (no game clock exists — §29.6): any store read runs
`settleDueShipments()` which moves due shipments into `inventory[destinationId]` as
`InventoryLot { modelId, condition, qty, state: 'spare', warrantyUntil, lotId }`, rolls
DOA/counterfeit/damage risks per line, and pushes a `useNotifyStore` banner
("📦 4 packages delivered to Home — 1 item arrived damaged").

### 4.4 What Amazon is for
Retail = fast, always available, expensive, qty-capped (≤10/line, ≤ $40k/order before the
account gets flagged for business verification → deep-link to wholesale §5). Emergency
replacements ship same-day at +25%. Used/refurb save 20–45% with the risk table in §3.5.

### 4.5 Seller reputation & returns
Sellers are `Manufacturer` or marketplace resellers with `reputation` 1–5. Return policy:
30 days retail-new, 14 refurb, none used-as-is. A return creates a reverse shipment and a
`WalletOrder` refund line at 100%/85%/0%.

### 4.6 Selling on Amazon (player as seller)
A player company with a completed product blueprint can create listings:
`createSellerListing({ blueprintId, price, stockFromLocationId })`. Simulated consumer
demand per tick-on-read: `unitsSold = marketSize × priceCompetitiveness^1.6 × reviewScore × brandAwareness`,
bounded by stock. Each sale consumes a finished-goods `InventoryLot`, credits checking via
a `WalletOrder`-style deposit (negative-total order rendered as income; Phase 3 adds a
proper `RevenueEvent` in `useTechStore` that Banking reads), and can spawn warranty
claims (rate = build `annualFailPct` × 0.6) that create repair `MaintenanceTask`s.

---

## 5. Direct Manufacturer & Wholesale Purchasing (Deliverables #7, #8)

A new Safari site — **"Meridian Supply" (b2b.meridian.aos)** — is the B2B portal, listed in
`CORE_SITES` next to Amazon/CIRCUTE. It fronts every `Manufacturer` with a wholesale program.

### 5.1 Suppliers
Seeded from `src/data/companies.ts` (NVIDIA, AMD, Intel, Samsung, Micron, SK hynix, TSMC,
Western Digital, Seagate, Supermicro, Dell, HPE, Cisco, Broadcom, Arista, Vertiv,
Schneider Electric already exist or are added there), plus fictional houses (Aurora
Silicon, Kestrel Memory, Northgrid Power) for worldbuilding freedom. Each `Manufacturer`:
`{ id, companyRef, productLines: ComponentModel[], tiers, allocationPolicy, regions, minAccountSpend }`.

### 5.2 Product classes (NVIDIA-style)
`ComponentModel.wholesaleTier ∈ { consumer, pro-workstation, datacenter-gpu, ai-accelerator,
networking, interconnect, server-platform, devkit, support-package }`. Consumer tiers are
open to any verified business; `datacenter-gpu` and above require an active
`SupplierContract` with allocation (§5.4). Complete systems (baseboards, 8-GPU servers,
preconfigured racks, switches, interconnects, support) are ComponentModels too — the
make-or-buy lever (§26) is just "which SKU level you order at."

### 5.3 Contract lifecycle

```
draft → submitted → underReview → [rejected | counterOffer | approved]
counterOffer ⇄ playerCounter (≤3 rounds) → approved | abandoned
approved → active → { fulfilled | breached | terminated | renewed }
```

An application (`SupplierContractRequest`) carries: company identity, intended project,
model + qty, delivery site, facility readiness % (from the target property's construction
state), technical team summary (count of relevant engineers), funding proof (Chase
balance + approved credit), requested schedule, support needs.

### 5.4 Supplier decision model (the "NVIDIA responds" formula)

```
trust           = relationship score, §6 (0–100)
readiness       = 0.25 + 0.75 × facilityReadiness            // site % complete
teamFactor      = min(1, relevantEngineers / ceil(qty/500))
fundsFactor     = min(1, liquidFunds / (0.35 × contractValue))
scaleFit        = qty ≤ tierCap(trust) ? 1 : tierCap/qty
supply          = global supplyIndex for the model (0.3 crunch – 1.2 glut)

approvalScore   = 100 × trust/100 × readiness × teamFactor × fundsFactor × min(1, scaleFit×supply)
grantedQty      = round(qty × min(1, scaleFit × supply) )
```

Response bands: `≥70` full approval; `45–69` partial allocation (grantedQty, staged
batches) **or** delayed allocation (+1–2 quarters); `30–44` counter: alternative product
(previous-gen or distributor referral), upfront-payment %, mandatory support contract,
proof-of-readiness request, or forecast obligation; `<30` rejection with stated reason
("facility not ready", "no order history — start with our distributor program").
`tierCap(trust)`: <40 → 64 units, 40–59 → 512, 60–79 → 4,096, 80+ → 32,768/quarter.

### 5.5 Negotiable terms
unitPrice (band: list × [0.62 + 0.38×(1 − trust/130)] … list), totalQty, batch schedule,
payment terms (prepay-100 / 50-50 / net-30 / net-60), warranty (1–5 yr), support tier,
advance-replacement units %, training seats, networking bundle discount, future-allocation
option, contract length. Assigned negotiators matter: effective trust for the pricing band
= `trust + procurementSkill×0.15 + lawyerSkill×0.08 − supplierNegotiatorSkill×0.1`.
Manual negotiation UI is a 3-round counter-offer exchange with the supplier's utility
function scoring each package; delegation runs the same exchange automatically.

### 5.6 Obligations & enforcement
Active contracts create scheduled `PurchaseOrder`s per batch. Missing a committed batch
payment: −8 trust, late fee 2%/mo; canceling a non-refundable commitment forfeits the
deposit (20–30%); reselling `authorizedUse: internal` units to the used market: −25 trust
and possible blacklist (`trust < 15` → supplier refuses new contracts for 180 days).

---

## 6. Supplier Relationship System

Per-manufacturer score, persisted in `useTechStore.supplierRelations[manufacturerId]`:

```
trust = clamp(0, 100,
    22                                        // stranger baseline after verification
  + 26 × log10(1 + lifetimeSpend/100_000)     // volume
  + 18 × onTimePaymentRate                    // payment reliability (rolling 12 orders)
  + 8  × forecastAccuracy                     // |forecast−actual| ≤ 15% counts as accurate
  + 6  × contractCompletionRate
  + strategic bonuses (exclusivity +5, joint R&D +6, multi-year commit +4)
  − 8 × disputes − 12 × unauthorizedResaleEvents − 5 × recentCancellations
  − returnRatePenalty (returns > 6% of units: −0.5/pt) )
```

Unlocks by band — **20–39:** prepay only, small allocations, list price. **40–59:** net-30,
distributor pricing (−12–18%), 512-unit cap. **60–79:** net-60, priority allocation,
early-access previews, custom configs, assigned account rep (a `Person` the player can
email in Outlook), −20–28% pricing. **80+:** strategic partner — launch allocations,
joint research projects (§9), capacity reservations, engineering support on incidents
(cuts §25 incident MTTR by 30%). Below 20: blacklist risk as §5.6.

---

## 7. Purchase Paths (per required component)

The Forge BOM panel shows every acquisition path with live numbers so convenience vs.
cost vs. risk vs. independence is a real decision:

| Path | Price vs. base | Lead time | Risk / constraint |
|---|---|---|---|
| Retail (Amazon) | ×1.12–1.30 | 1–3 days | qty caps, flagged >$40k |
| Used market | ×0.55–0.80 | 2–5 days | condition ×1.9 failure, no warranty, counterfeit 3% |
| Wholesale distributor | ×0.85–0.95 | 1–3 weeks | MOQ 10–100, business verification |
| Direct manufacturer | ×0.62–0.85 | 4–26 weeks | contract, MOQ, allocation, commitments (§5) |
| Salvage | teardown labor only | immediate | recovered from decommissioned systems; condition `salvage` |
| Internal manufacturing | unit cost = fab BOM + labor + yield loss | after factory buildout | requires factory property + mfg engineers + IP (Phase 5) |
| Custom mfg contract | ×0.9–1.4 of internal | 8–20 weeks | contractee IP terms, min volume |
| Research prototype | R&D budget burn | 1–3 quarters | performance/reliability sampled from a distribution; may fail |

---

## 8. Workday Hiring Integration (Deliverable #9)

Hiring reuses the existing pipeline end-to-end: **LinkedIn posting → applicants →
Outlook-staged interviews (`JobMeta.stage`: confirmation → phone-screen → director →
panel → offer → onboarding) → offer acceptance → Workday record.** The difference:
the *player* is now the employer.

### 8.1 Employer-side postings
`LinkedInSite.tsx` gains an "Talent Hub / Post a job" panel bound to
`useTechStore.jobPostings`. A `TechJobPosting` = `{ id, role: TechRole, companyId(player),
locationId, salaryBand, requiredSkills: Partial<SkillVector>, minYears, posting copy,
postedAt, state: open|closed }`. The 33 roles from the spec (PC technician … compliance
officer) are a `TechRole` union with per-role skill templates and salary bands
(`ROLE_CATALOG` in `src/data/techRoles.ts`, Phase 2).

### 8.2 Applicant generation
Applicants are generated deterministically with `buildPerson()` from `src/data/people.ts`
(portrait, history, school) plus a hardware-domain `SkillVector`:

```
SkillVector = { assembly, design, thermal, electrical, network, firmware, security,
                aiInfra, procurement, legal, projectMgmt, construction, operations }   // each 0–100
applicantSkill_k = clamp(5, 99, roleTemplate_k × N(0.75 + salaryFactor×0.4, 0.18) )
applicantsPerWeek = 2 + salaryPercentile×6 + companyReputation×3   (senior roles ×0.4)
```

Underpaying attracts weak vectors; famous companies (reputation from shipped products
and operating facilities) attract stronger ones.

### 8.3 Pipeline stages
Résumé review shows claimed skills (true value ± up to 25 noise). Each interview stage
narrows the noise: phone screen ±18, technical assessment ±8 (assessments cost $250 and
an interviewer-hour), panel ±5, references ±4 with a 10% chance of surfacing a red flag
(`reliability −20`). Offers negotiate salary (applicant reservation = band × skill/75);
accepted offers call `ensureEmployerFromOffer`-equivalent for NPCs:
`techStore.hireEmployee(applicant, postingId)` creating a `TechEmployee` that also
syncs into `useHcmStore` (`Employee` + payroll stubs) so Workday/HCM shows them, and
their salaries flow into the monthly OpEx ledger (§22).

### 8.4 Employees have specific effects (not % bonuses)
Each project task type reads *specific* skills of the *specific* assignees:

- Assembly time: `baseMin × (1.9 − assembly/100) × (1 + difficulty/150)`; damage
  probability per expensive component handled: `2.2% × (1.6 − assembly/100) × fragility`.
  A damaged lot becomes `condition: damaged` (repairable at cost) — a rookie really can
  crack a $2,300 GPU.
- Design: optimizer candidate count = `3 + design/20` (§3.6); a designer with
  `thermal < 40` systematically under-specs cooling by 10–20% → builds pass design review
  but throttle in testing (§15 step 12).
- Procurement: pricing-band shift and MOQ waivers (§5.5); a `procurement ≥ 70` manager
  auto-detects counterfeit listings.
- Project manager: inter-phase dead time = `9 days × (1.5 − projectMgmt/100)`; without a
  PM on projects >$250k, every phase gains +25% duration and risk events +1.
- Network engineer: cluster `networkEfficiency = 0.7 + 0.3×network/100` multiplies
  multi-node workload throughput (§17).
- Security engineer on staff: cyberattack incident probability ×`(1 − security/140)`.
- Operations manager: incident MTTR ×`(1.45 − operations/100)`, staff fatigue events −60%.

### 8.5 Assignment
Employees are assigned to a location + department + project via Forge (mirrors into HCM
`department` string). An employee can hold one full-time assignment; over-assignment
drops morale 8/week → attrition risk `= (40 − morale)×0.3%/week`.

---

## 9. Engineering Organization

Departments are first-class in `useTechStore.departments`: `{ id, name, kind (18 kinds
from spec), leadEmployeeId, memberIds, budgetMonthly, locationId, projectIds }`. Derived
per department: productivity (= mean relevant skill × morale factor × workload factor),
knowledge (grows +1/project-phase completed, caps skill noise on future estimates), and
a communication matrix: departments sharing a location or a PM get `commFactor 1.0`,
otherwise 0.85 (cross-site) — multiplies multi-department phase durations.
Cross-department requirements are encoded in project templates: e.g. `infra.ai-training`
requires systems-architecture (sizing), procurement (accelerators), real-estate/legal
(site), construction, electrical, thermal, network, ai-infra, security, operations — each
mapped to phase gates in §13.3.

---

## 10. Real-Estate Integration (Deliverable #11)

HomeFind (`RealtorApp.tsx`) is extended with a **Commercial & Industrial** tab. `Listing`
gains optional facility fields (all optional so existing residential data is untouched):

```
zoning: residential|commercial|industrial|datacenter,   powerKw: number,
powerExpandableKw, fiber: none|copper|fiber|carrier-hotel, waterGpm,
energyPricePerKwh, taxRatePct, floorLoadPsf, ceilingFt, loadingDocks,
expansionAcres, climateZone: cold|temperate|hot|desert, floodRisk 0–3,
distanceToSubstationMi, seismicZone, county permit friction 1–5
```

~30 new commercial seeds (garage → shop → office → warehouse → industrial → lab →
factory → server facility → existing DC → land → campus). Search filters on every field.
Purchasing/leasing becomes real: "Buy" runs a Chase-integrated settlement — cash
(`WalletOrder`, kind checking) or commercial mortgage (§22 financing; creates a
`Loan` with monthly debits). The deed lands in `useTechStore.properties` as an owned
`Facility { propertyRef, upgrades[], readiness, rooms[], inventory }`. Leases create
recurring monthly charges via the `subscriptionCharges` pattern in `useDevStore`.
Spacey remains the quick path for renting storage/warehouse space without purchase.

### 10.1 Suitability rule
Every project template declares `propertyNeeds` (min sqft, zoning set, min powerKw, fiber
tier, floor load, …). Forge's requirement card shows ✓/✗ per owned property and deep-links
to HomeFind with filters pre-applied. A gaming PC needs any Home; an AI DC needs
industrial/datacenter zoning, `powerKw ≥ ITload×PUE×1.2`, fiber, and expansion room.

---

## 11. Property Modification & Construction (Deliverable #12)

New subsystem (nothing exists today): **Buildout**, surfaced inside Forge (Facilities tab)
and reusing contractors as suppliers. An upgrade = `PropertyUpgrade { kind (24 kinds:
electrical-circuits, hv-connection, generators, battery, solar, hvac, liquid-cooling,
raised-floor, fire-suppression, clean-room, secure-storage, loading-dock, server-room,
fiber, network-room, security, offices, lab, assembly-area, testing-room, warehouse-fit,
repair-stations, mfg-line, substation), sizeUnits, state, cost, durationDays }`.

```
cost      = kindBase$/unit × sizeUnits × regionFactor × (1 + permitFriction×0.06)
duration  = kindBaseDays × sizeUnits^0.62 × crewFactor × permitDelay
state:    planned → permitApplied → permitted → contracted → underConstruction
          → inspection → [passed → complete | failed → rework(+15% cost)]
```

Permits take `permitFriction × N(9,3)` days; datacenter zoning variance possible but slow.
Construction consumes: a construction plan (architect/engineer-hours), a contractor
(external company at cost ×1.0, or internal construction dept at ×0.8 with mgmt burden),
materials (POs through the same shipment system), inspections. Progress accrues
timestamp-lazily like everything else. Facility `readiness` = weighted completion of
upgrades required by the project template — the same number suppliers check (§5.4).

## 12. Property Suitability Analysis (feasibility studies)

`orderFeasibilityStudy(listingId, projectId)` costs $2k (small) – $250k (campus, external
firm) and `N(5,2)`–`N(45,10)` days. Output: `FeasibilityReport` estimating max electrical
load, cooling potential (climate-adjusted), network quality, expansion capacity,
renovation cost ±err, construction time ±err, staffing accessibility, logistics score,
environmental & regulatory risk, max rack capacity, est. OpEx, downtime risk.
Accuracy: `err = ±(28% − 0.22×engineerSkill%)`. Skipping the study leaves the *hidden true
values* unknown — the listing's advertised `powerKw` can be off by ±35%, zoning surprises
(8% of un-studied industrial listings prohibit DC use), flood/noise/expansion traps as
listed in the spec. Discovered-too-late problems become change orders at 1.4× cost.

---

## 13. Project Planning Interface — the Forge app (Deliverable #5, #20)

> **Implemented in Phase 1:** app id `forge`, registered in `src/data/apps.ts` +
> `src/App.tsx`; tabs Projects / Designer / Inventory / Suppliers.

### 13.1 Screens
1. **Projects dashboard** — cards with phase chip, readiness %, burn, blockers. New-project
   wizard: name, type, purpose, budget, target perf, target date, property, funding source,
   ownership (personal | company | new subsidiary), internal vs. commercial use.
2. **Designer** — slot pickers, live analysis panel (errors/warnings, per-workload scores +
   bottleneck, wattage, noise, reliability, cost vs. budget), save-as-blueprint, versioning.
3. **Requirements board** — generated from the template: each unmet requirement is a card
   with a deep link: Hire → LinkedIn Talent Hub; Property → HomeFind (filtered); Buy retail →
   Amazon; Allocation → Meridian Supply; Financing → Chase loan desk; Construction → Buildout;
   Utility agreement → Buildout/negotiations. Cards flip to ✓ automatically via store
   subscriptions — the "one connected ecosystem" behavior of §28 of the request.
4. **Facilities** — owned properties, upgrades, layout editor (Phase 4, §24), inventory.
5. **Suppliers** — relationship scores, contracts, negotiation threads.
6. **Operations** — per-facility live board (Phase 4): utilization, power, incidents, tasks.

### 13.2 Project templates (excerpt)

| Template | Property needs | Roles (min) | Capital band | Key risks |
|---|---|---|---|---|
| pc.gaming | home workbench | 0 (player) | $0.6–5k | DOA part, damage |
| biz.prebuilt-line | workshop ≥1.2k sqft | 2 tech, 1 QA, 1 proc | $40–250k | demand, warranty |
| infra.server-room | office, 30kW, fiber | 1 server eng, 1 netops | $80–400k | cooling, downtime |
| infra.ai-training | industrial ≥40k sqft, MW-class, fiber, water | 9 depts (§9) | $30M–2B | allocation, thermal, cash flow |

### 13.3 Phase gates (state machine, all projects)
`concept → design → planning(requirements) → procurement → buildout → assembly →
integration → testing → launch → operating → (expansion | decommission)`; guard on each
transition = requirement predicates (design approved, funds committed, facility readiness ≥
threshold, staff assigned, BOM ≥95% delivered, tests passed). Failed tests loop back to
design/assembly with a revision entry in the blueprint version history.

## 14. Saved Designs & Bills of Materials

`HardwareBlueprint { id, name, version, history[], kind: pc|server|rack|cluster|dc-module,
slots, approvedAlternates: modelId[][], assemblySteps[], softwareConfig[], testPlan[],
engineerReqs, buildTimeMin, powerW, coolingW, perf snapshot, reliability, estCost }`.
Alternates power substitution: when a BOM line is out of stock/allocated, the panel
recommends the nearest alternate and diffs performance/compat ("−4% gaming, +DDR5 required").
Racks/clusters compose blueprints recursively (a rack blueprint references a server
blueprint × N + switch + PDU + cooling lines) — one mechanism from PC to hyperscale.

---

## 15. Example Flow: High-End Gaming PC (Deliverable #28-30 example 1)

1–2. New project (pc.gaming), priorities 4K + quiet, budget $4,500, target 4K/120.
3. Assisted recommendation (or manual): Ryzen-class 16-core, RTX-class 24GB, DDR5-6000
   2×32GB, 2TB NVMe, 1000W Platinum, 360 AIO, airflow case.
4–5. Player swaps PSU to cheaper Gold → warning `PSU_HEADROOM 84%`. BOM totals $4,310.
6. Buy on Amazon: GPU refurb option saves $410 (DOA risk 2.8% shown) — player declines.
7. Shipment ETA 2 days → Home inventory; Chase shows `AMAZON.COM*FORGE-K3` −$4,310.
8. Assembly: player (assembly 35) est. 6.2h, damage risk 1.9%/handling — or hire a
   technician. First power-on roll: pass.
9–11. OS + drivers (softwareConfig), benchmark: 4K score 96/120 fps — bottleneck: GPU.
12. Stability test surfaces `THERMAL`: case fans ×2 insufficient, CPU 96°C → revision:
    +3 fans, re-test pass at 87 dBA→? no: noise 41→44 dB, still "quiet-ish".
13–14. Project → operating. Options: keep (adds a usable PC object at Home), sell used
    (resale formula), or "Save as product blueprint v1" seeding a future business.

## 16. Example Flow: PC Manufacturing Business

Company entity (ownership: new subsidiary) → product blueprint from §15 v2 (cost-reduced
alternates) → lease 2,400 sqft workshop via HomeFind/RentCafe ($3,900/mo recurring) →
hire 2 assembly technicians + QA via Talent Hub → distributor accounts (Meridian: CPU/GPU
MOQ 25, −14%) → inventory 25 units of parts (2 shipments, 1 delayed by port congestion
+6 days) → prototypes ×2 → benchmark → QC standard (test plan: 2h burn-in; skipping
raises warranty claims 2.4×) → price $2,999 (cost $2,180) → `createSellerListing` →
demand sim sells 9/wk at reviews 4.6 → warranty claims ~1.1%/yr → v3 blueprint from
feedback. Scaling to 40/wk forces distributor→direct contracts (Intel/NVIDIA consumer
tier) and a bigger warehouse — naturally, because MOQ economics and lead times bite.

## 17. Example Flow: AI Data Center (Deliverable #5, #28)

Purpose: rent GPU capacity. Sizing calculator (Forge wizard):

```
targetGpus=2048 → racks = ceil(2048 / 8 gpu/server / 4 srv/rack) = 64 AI racks
ITkW = racks × 44kW = 2.8MW ; PUE liquid = 1.15 → grid 3.3MW
storagePB = gpus × 1.5TB = 3PB ; fabric: rail-optimized, 64×2 switches
building ≥ 42k sqft ; staff: 24 ops + 9 dept leads ; capex ≈ $92M ; opex ≈ $640k/mo
```

Steps (all deep-linked): subsidiary → planning team hires → feasibility studies on 3
sites → financing: $60M equipment loan + $25M investor round (§22) → land purchase
($4.2M) → architects → Buildout: substation, liquid cooling, fiber (9 upgrade lines,
~11 months simulated) → NVIDIA-style application (§18 example below) → server/network/
cooling POs → construction gates → ops hires → rack install (assembly tasks × 64) →
network config (netEng skill → efficiency) → cluster software → load test (thermal
incident: 4 racks throttle; fix: CDU rebalance) → launch → sell capacity (§23) →
operate/expand. Milestones fire cinematic showcase assets (§31.11).

## 18. Example: Wholesale NVIDIA-Style Purchase Negotiation

Player request: AX-9000 accelerators ×2,048, site readiness 74%, team 11 relevant
engineers, funds $61M liquid vs. $71.7M contract. Engine: trust 58, readiness 0.805,
team min(1, 11/ceil(2048/500)=5→1), funds min(1, 61/25.1)=1, scaleFit 512/2048=0.25,
supply 0.6 (crunch) → approvalScore ≈ 58×0.805×1×1×min(1,0.15)... → band 45–69 →
**partial**: 768 units in 3 batches over 2 quarters, $32.9k/unit (list $35k), 50% deposit,
mandatory Meridian support contract $1.8M/yr, forecast obligation ±15%, option on 1,280
more next quarter at trust ≥65. Player counters batch schedule + warranty 3yr; supplier
accepts (procurement manager skill 72 shifted the band). Declining and buying previous-gen
UX-8000 at 512 units net-30 is the alternative the UI presents side-by-side.

## 19. Infrastructure Scaling (Deliverable #19)

Stages 1–8 (personal builder → hyperscale) are **labels computed from state**, shown on
the player profile — never gates. Larger projects demand more capital (banking), power
(property), trust (suppliers), people (hiring), and experience (org knowledge §9), which
is the only progression mechanism. The template table (§13.2) encodes the natural ramps.

## 20. Assembly Workflows

Assembly = ordered `assemblySteps` from the blueprint (PC: 16 steps case-prep → stability;
rack: 11 steps rack-prep → failure-testing). Each step: minutes, required skill, damage
risk, tools. Execution modes: player-manual (interactive checklist), assigned employees
(parallel by step dependencies), assembly line (factory upgrade; throughput = stations ×
shift hours / unit time), outsourced (cost ×1.25, no damage risk to player staff).
Server/rack steps include PDU wiring, cabling (cable-length from layout §24), BMC/cluster
config gated on firmware/network skills, then load + failure testing.

## 21. Inventory & Logistics (Deliverable #13)

> **Implemented in Phase 1:** per-location `InventoryLot`s + shipments in `useTechStore`.

`inventory: Record<locationId, InventoryLot[]>`, lot = `{ modelId, condition, qty, state:
spare|reserved|installed|damaged|returned|in-repair, warrantyUntil, lotId }`. Reservation
happens at project procurement; installation moves lots into the built `Asset`.
Shipments: `{ lines, source, destination, etaAt, status: processing|in-transit|customs|
delivered|damaged|lost }`. Large orders auto-split into batches. Disruption events roll
per shipment on settle: mfg delay 6%, port congestion 4%, transport breakdown 2%,
weather 2%, customs (international) 5%, shortage-reallocation 3%, damage 2.5%, wrong
items 1.5%, counterfeit (used/gray market only) 3%, theft 0.6% — probabilities shift
with supplier trust, insurance, and logistics-staff skill. Salvage: decommissioned
assets tear down into `salvage` lots (recover 40–70% of parts by tech skill).

## 22. Financial Integration (Deliverable #14)

All costs settle through existing rails: purchases → `WalletOrder`s; salaries → monthly
rollup mirrored into HCM paystubs and Chase debits; rent/utilities/insurance/support →
recurring charges via the `subscriptionCharges` pattern; construction → milestone POs.
**New primitive: `Loan`** (none exists in the repo): `{ principal, aprPct, termMonths,
kind: bank|equipment|mortgage|bond|investor, collateralRef, state }` — Chase gains a
"Loan Desk" panel; approval = f(income history, collateral, existing debt service).
Funding sources: cash, company cash, bank loan (8–11% APR), equipment financing (secured
by assets, 7%), commercial mortgage (6.5%), investor round (equity % of subsidiary),
bonds (Phase 5, requires rating), government contract advances, customer preorders,
supplier financing (trust ≥70), joint ventures. The wizard renders a full model:
capex, monthly opex, revenue curve, **break-even month, ROI, DSCR, cash-flow risk**
(`risk = P(minCashMonth < 0)` via 200-sample Monte Carlo over demand/incident draws).

## 23. Data-Center Revenue Models (Deliverable #17)

`CustomerContract { customerRef, kind: ai-training|inference|gpu-rental|cloud|storage|web|
game-hosting|enterprise|government|scientific|rendering|colocation|DR, capacityUnits,
pricePerUnitMo, slaPct, securityTier, termMonths, penalties }`. Demand pool generated
from `REAL_COMPANIES` + fictional startups; each prospect has requirements (SLA 99.5–
99.99%, compliance, hardware class, support). Fulfillable contracts appear in Forge's
Sales pipeline; sales staff close rate = f(price vs. market, reputation, sla fit).
Revenue accrues monthly to Chase; SLA breaches (from §25 incidents) pay penalties and
cut reputation. Internal use instead earns implicit value (e.g. Neural app training jobs
run "free" on owned capacity — cross-app flavor hook).

## 24. Data-Center Layout (Deliverable #15)

Grid-based room editor per facility (Phase 4): place racks (server/AI/storage/network),
CRAH/CDU units, PDUs, batteries, generators, transformers, fire suppression, control
room, security, corridors, loading, spares storage, offices. Effects:
`coolingEfficiency` = f(hot/cold aisle containment, CRAH proximity); `cableLength` =
Manhattan distance to network row (latency + cost); maintenance speed = corridor width;
failure propagation = adjacency (a fire/leak affects neighbors); expansion = free tiles.
Layout score feeds PUE: `PUE = base(coolingKind) + layoutPenalty(0…0.25) − containment(0.08)`.

## 25. Data-Center Operations (Deliverables #16, #18)

Operating facilities tick lazily (on read + notification sweeps): utilization from
contracts/workloads, power draw = ITkW×util×PUE → utility charge/mo, degradation
(component `wearPct` ↑ with temp & load), staff shifts (min staffing = racks/8 per shift;
understaffed → MTTR ×1.8), maintenance tasks (preventive cuts failure rate 40%), spares
consumption, security posture. **Incidents** roll per facility-month with base rates
modified by design/staff: GPU failure (per-GPU AFR 1.2–9%), RAM corruption, cooling
failure (×0.4 with N+1), power interruption (×0.25 with generators+battery), generator
start-fail 8%, network outage, cyberattack (§8.4), fire (suppression cuts damage 85%),
water leak (liquid cooling only), operator error (fatigue-linked), bad firmware from
supplier, overheat (climate + layout), demand spike. Each incident: downtime roll →
SLA penalties → repair tasks consuming spares → post-mortem knowledge (+org knowledge,
reduces repeat probability 25%).

## 26. Make-or-Buy Decisions

Every capability has at least two acquisition routes priced by the same engines
(retail/wholesale/direct/outsource/internal/license/proprietary/lease-cloud/build-DC/
buy-DC/colo). Forge's compare view shows NPV over a horizon the player picks, plus
non-financial axes (control, dependency, speed, risk) — e.g. renting cloud capacity is
instant with zero capex but 2.6× the 5-year cost and allocation dependency; building is
slow, capital-heavy, and yours. No option is flagged "correct."

## 27. Player Assistance Levels

Same simulation, three lenses: **Assisted** (goal + budget → engineers produce design,
BOM, staffing, property shortlist, supplier plan; player approves), **Standard** (player
picks majors, specialists fill minors), **Expert** (every slot, contract clause, layout
tile, test standard, ops policy). Toggle per project; assisted quality depends on staff
skills (§8.4) — it reduces cognitive load, never simulation fidelity.

## 28. Unified Interface Flow

The request's §28 example is exactly §13.1 screen 3: an AI-DC project's requirement board
initially shows six red cards (property, 6 roles, funding gap, no accelerator supplier,
no construction plan, no utility agreement); each deep-links via
`useShellStore.openWindow(...)` + target-app prefilter state in `useTechStore.crossAppIntents`;
completion flips cards via store subscriptions; the phase gate (§13.3) advances when all
guards pass. No system is duplicated — Forge only orchestrates.

---

# Technical Implementation (Deliverables #21–#27)

## 29. Architecture

### 29.1 Entity model (TypeScript, in `src/types/hardware.ts` — Phase 1 ships the core)

```
ComponentModel      catalog SKU + stats (§3.2) + amazonListing + wholesaleTier
InventoryLot        physical stock at a location (modelId, condition, qty, state)
HardwareBlueprint   reusable design (slots, alternates, steps, tests, versions)
ComputingProject    the central aggregate: kind, phase, budget, links to everything
Asset               a built thing (pc | server | rack | cluster | facility-system):
                    blueprintId, locationId, installedLots, wearPct, status
Manufacturer        supplier identity (ref → companies.ts) + programs + inventory index
SupplierRelation    per-manufacturer trust ledger (events[], derived trust)
SupplierContract    negotiated terms + batch schedule + obligations
PurchaseOrder       one order (retail or contract batch) → Shipment(s)
Shipment            lines, source, destinationId, etaAt, status, disruptions[]
TechJobPosting      employer-side posting (role, skills, band)
TechEmployee        person + SkillVector + assignment + morale + salary (synced to HCM)
Department          org unit (§9)
Facility            owned/leased property + upgrades + rooms/layout + readiness
PropertyUpgrade     construction line item (§11 state machine)
FeasibilityReport   §12 output with error bars
Workload            a demand placed on assets (gaming, training job, hosted service)
CustomerContract    §23 revenue agreement
MaintenanceTask     scheduled/corrective work orders
Incident            §25 events with impact + resolution
Loan                §22 financing primitive
RevenueEvent        income entries Banking renders (mirror of WalletOrder for credits)
```

### 29.2 Stores & ownership (who owns what)

- **`useTechStore` (new, persisted `aos-tech-store-v1`)** owns: blueprints, projects,
  assets, facilities/upgrades, inventory+shipments, suppliers/contracts/POs, tech
  employees/departments/postings, customer contracts, incidents, loans, revenue events,
  `crossAppIntents`, `pendingCart`.
- Existing stores keep their domains: money display (`useWalletStore`/`useDevStore` →
  Banking), HR records (`useHcmStore` sync), mail (`useMailStore` for supplier/agent
  correspondence), windows (`useShellStore`), notifications (`useNotifyStore`).
- Integration is **unidirectional writes + reactive reads**: Forge writes WalletOrders;
  Banking derives. Forge writes HCM employees; Workday renders. Amazon reads
  `pendingCart`; Forge subscribes to wallet orders it initiated. No store imports Forge
  state except through exported selectors in `src/state/useTechStore.ts` — keeps the
  dependency graph acyclic.

### 29.3 Event flows (representative)

```
BOM purchase:  Forge.orderBom() ─► useWalletStore.addOrder (Chase txn)
                                ├► techStore.createShipment (eta)
                                └► notify "order placed"
   read-time:  settleDueShipments() ─► inventory lots + DOA/damage rolls ─► notify
Hire:          TalentHub.post ─► applicants(gen) ─► Outlook interview thread (JobMeta-style)
               ─► techStore.hireEmployee ─► hcm.syncEmployee + payroll charge schedule
Contract:      MeridianSite.submit ─► supplierDecision() ─► counterOffer thread (Outlook)
               ─► activateContract ─► scheduled POs ─► shipments (batches)
Ops sweep:     any Forge/Banking open ─► accrueOperations(nowTs): utility & payroll
               charges, revenue events, incident rolls, degradation, task generation
```

### 29.4 Project state machine

```
concept ─► design ─► planning ─► procurement ─► buildout ─► assembly ─► integration
   ─► testing ─┬► launch ─► operating ─► expansion*/decommission
               └► (fail) back to design|assembly with revision++
Guards: design.errors=0 · funding committed ≥ estCost×0.9 · facility.readiness ≥ tmpl.min
        · staffing filled · BOM delivered ≥95% · testPlan pass
```

PurchaseOrder: `draft→placed→confirmed→manufacturing→shipped→(customs)→delivered→received|damaged|disputed`.
Contract & upgrade machines in §5.3 / §11.

### 29.5 Save system
Zustand `persist` (localStorage `aos-tech-store-v1`) with `version` + `migrate`, custom
`merge` (seed fallback like Mail/Drive). All timestamps ISO; **no intervals** — every
time-dependent quantity is `f(lastSettledAt, now)` computed in `settle*()` reducers
(pattern proven by `subscriptionCharges`). Catalog data is code (not persisted) so saves
stay small; persisted objects reference `modelId`s. Cap ledgers (orders 100 — raise to
500 for business volume; incidents 200 with archival rollup).

### 29.6 Performance
Catalog lookups via `Record<id, ComponentModel>` maps; analysis engine is pure/memoized
(recompute only on slot change); ops sweeps batch by facility and clamp catch-up windows
to 90 simulated days per settle to bound work after long absences; heavy sim (Monte
Carlo cash-flow) runs in a `requestIdleCallback` and caches by input hash. Lazy-loaded
app chunk like every other app (`lazy(() => import('./apps/forge/ForgeApp'))`).

### 29.7 API surface (store actions, Phase-1 subset marked ✦)

```
Blueprints: saveBlueprint✦ · forkBlueprint · approveAlternate
Designer:   analyzeBlueprint✦ (pure, in hardwareEngine)
Projects:   createProject✦ · setProjectBlueprint✦ · advancePhase✦ · cancelProject
Procure:    orderBom✦(projectId, locationId, accountId, conditionChoices)
            settleDueShipments✦ · createSellerListing · submitContractRequest ·
            negotiateRound · activateContract
People:     createPosting · generateApplicants · advanceInterview · hireEmployee ·
            assignEmployee✦(stub: player-as-builder) · setDepartment
Property:   registerFacility✦(from purchase/lease) · orderFeasibilityStudy ·
            planUpgrade · advanceUpgrade
Assembly:   startAssembly✦ · settleAssembly✦ (time-based completion + damage rolls)
Ops:        accrueOperations · resolveIncident · scheduleMaintenance
Finance:    requestLoan · settleRecurring (rent/salary/utility rollups)
```

## 30. Implementation Roadmap (Deliverable #26)

- **Phase 1 (this PR):** types, catalog (40+ models), analysis engine + formulas, Forge app
  (Projects/Designer/Inventory/Suppliers-preview), Amazon-priced BOM checkout → wallet →
  shipments → per-location inventory → assembly → operating PC asset. Proves every seam.
- **Phase 2:** Amazon storefront section from catalog + cart handoff; Talent Hub postings,
  applicant gen, interview threads, HCM sync; property commercial fields + purchase/lease
  settlement; feasibility studies.
- **Phase 3:** Meridian Supply site, supplier relations/contract negotiation, loans + Chase
  Loan Desk, seller listings + demand sim, warranty/returns.
- **Phase 4:** Buildout construction, facility layout editor, server/rack blueprints,
  operations sweeps, incidents, customer contracts, revenue.
- **Phase 5:** internal manufacturing/R&D prototypes, bonds/JVs, edge networks, hyperscale
  multi-site, showcase cinematics.

## 31 (doc-local): Balancing appendix (Deliverable #27)

Key tunables collected in `src/data/hardwareBalance.ts` (Phase 2): retail markup 1.12–1.30;
wholesale bands §5.5; trust weights §6; disruption base rates §21; incident base rates
§25; AFR condition multipliers (1.0/1.35/1.9/2.6); demand elasticity 1.6; PUE table
(air 1.5, aio-assisted 1.35, liquid 1.15, immersion 1.08); electricity $0.055–0.19/kWh by
region; salary bands per role; construction $/sqft (office fit 90, server room 480, DC
shell 900, substation 2.5M/10MW). Every formula in this doc cites its constants from
that module so balance passes don't touch logic.

---

# Higgsfield Asset Generation Plan (Request §31; Deliverables §31.19)

The game renders in a 2.5D "product-render" UI style (React DOM + images), so Higgsfield
output is primarily **high-quality 2D renders + image-to-3D GLB for placeable objects**
(Higgsfield `generate_image` → `generate_3d`). Rules of engagement:

- **Generate** when: seen up close, represents a major purchase/achievement, appears in a
  marketplace listing, placed in a player facility, distinguishes quality tiers, is a
  player-designed showcase, or is a cinematic milestone (§31.11 triggers of the request).
- **Do not generate** for icons, controls, charts, text, readouts, or anything procedural
  (cable routing overlays, rack-population diagrams, layout grids are drawn in SVG).
- **Reuse first**: check `assets/registry.json` for base model / recolor / modular /
  material / damage / scale variants before any new generation (request §31.17). One
  modular kit beats N one-offs — all kits below are variant-parameterized.

### A. Pipelines

**Real-Time Modular Pipeline (in-game):** the game composes visuals from kit pieces —
case shell + panel + cooling module + GPU body + lighting overlay — chosen by blueprint
slots and quality tier. Used for gameplay, inventory, assembly, placement, repair.
**Higgsfield Showcase Pipeline:** on milestone events (product launch, luxury build, DC
opening) the game builds a prompt from the blueprint (case, materials, cooling, lighting,
branding, tier, wear) and requests a cinematic render; stored as a supplement, never a
replacement for the modular model. Player branding (name, logo, colors, product line,
model number, theme, tier) is injected at prompt-build time and composited as decals for
the modular pipeline — never baked into reusable base assets.

**Character pipeline:** applicant/employee portraits continue to use the existing
deterministic `personPhoto()` pools — consistent across LinkedIn/Workday/team screens.
Higgsfield is used only for *environments* (offices, labs, interview rooms) and
recruitment-campaign hero images, avoiding identity inconsistency.

**Multi-view / image-to-3D workflow (§31.15):** for each placeable asset: 7 consistent
views (front, rear, L, R, top, ¾ front, ¾ rear), orthographic where required, neutral
`#f4f5f7` background, identical lighting (soft 3-point studio), no perspective
distortion; detachable parts rendered separately; then `generate_3d` per part; QC pass
checks silhouette match; failures re-queue with tightened negative prompts.

### B. Naming, folders, metadata (§31.16–31.17)

```
public/assets/forge/<domain>/<kit>/<asset-id>__<variant>__<view>.webp
models/forge/<kit>/<asset-id>__<variant>.glb
Domains: pc | component | server | rack | dc | property | construction | wholesale | office | showcase
asset-id: kebab-case, e.g. case-midtower-airflow ; variants: new|used|refurb|damaged|
budget|consumer|enthusiast|pro|enterprise|proto|lux ; views: f|r|l|rt|top|q34f|q34r|hero
```

Registry entry (stored in `assets/registry.json`, schema `AssetMeta` in
`src/types/hardware.ts` Phase 2): id, name, category, prompt, generatedAt, sourceImage,
modelPath, texturePaths, materials, dimensionsMm, polyBudget, lods, collision, animation,
attachPoints[], usedByProductIds/propertyIds/blueprintIds, qualityVariants, damageVariants,
marketplaceRender, thumbnail, license, approval, replacementHistory.
Budgets: hero renders 2048², marketplace 1024² + 256 thumb; GLB ≤ 30k tris (props ≤ 8k),
LOD1 50%, LOD2 15%; collision = convex hull (racks: box); animation only where listed
(fans spin, rack doors, status LEDs via emissive maps).

### C. Asset inventory & priority backlog (P0 exists · P1 placeholder · P2 core · P3 showcase · P4 cinematic)

| # | Kit / asset | Domain | P | 2D/3D | Variants | Where seen |
|---|---|---|---|---|---|---|
| 1 | PC case kit (shells: mid-tower airflow, SFF, open-frame, lux glass, industrial 4U) | pc | 2 | both | tiers ×5, damage ×3, panel on/off | Designer, inventory, home |
| 2 | Component kit: GPU bodies ×4, CPU box, RAM sticks ×3, mobo ×3, PSU ×2, AIO/air coolers ×3, fans ×2 | component | 2 | both | new/used/refurb/damaged; tier styling | Amazon listings, BOM, assembly |
| 3 | Marketplace render standard (framing/lighting spec + background plate) | component | 2 | 2D | — | every listing |
| 4 | Finished-build showcase (prompt-assembled from blueprint) | showcase | 3 | 2D | per-build | launches, portfolio, listings |
| 5 | Server kit: 1U/2U compute, 4U GPU server, storage node, switch, PDU, cable panel, CDU, blank | server | 2 | both | enterprise/proto; front/rear | racks, POs, wholesale |
| 6 | Rack kit: empty rack, doors, populated states (empty/partial/full), status overlays (procedural LEDs) | rack | 2 | both | operational/overheat/maintenance/damaged | facilities, ops board |
| 7 | Wholesale freight kit: GPU pallet, CPU trays, accelerator crate, server pallet, branded rack crate, secure case | wholesale | 2 | 2D | supplier-branded via decal | Meridian orders, deliveries |
| 8 | Property exteriors kit: garage, workshop, office, warehouse, industrial, lab, factory, server facility, small DC, large DC, campus, land, substation | property | 2 | 2D | day/night, empty/renovated/damaged/expanded | HomeFind listings, Facilities |
| 9 | Warehouse-evolution interior set (same building: empty → assembly shop → test lab → server room → DC space) | property | 2 | 2D | 5 stages | Facilities, construction |
| 10 | Construction kit: excavator, crane, steel framing, raised floor, cable tray, conduit, transformer, generator, battery room, dock, fencing, site office, unfinished interior | construction | 2 | 2D (equip 3D) | stage ×10 (§31.8) | Buildout progress |
| 11 | DC interior kit: data hall, hot/cold containment aisles, liquid AI racks row, cooling tower, chiller, control room/NOC, security checkpoint, fire suppression, loading bay, spares room, fiber room, rooftop plant | dc | 2 | both (halls 2D) | air/liquid/container/underground/desert/cold themes | Facilities, ops |
| 12 | Office/hiring environments: engineering office, interview room, HW test lab, assembly floor, DC control room, onboarding scene, dept headers | office | 2 | 2D | day/night | Talent Hub, Workday, CoLab |
| 13 | Milestone cinematics: first accelerator delivery, first rack, cluster startup (blue glow hall), grand opening, full capacity, emergency shutdown, outage recovery, expansion | showcase | 4 | 2D | per-milestone | completion screens, news feed, loading |
| 14 | Brand decal system (logo plate, case badge, bezel strip, crate stencil, signage) | showcase | 2 | 2D overlays | player colors | everywhere branding shows |
| 15 | UI hero graphics (Forge dashboard header, Meridian header) | office | 3 | 2D | light/dark | app headers |
| 16 | Forge app icon | office | 1→2 | 2D | — | Dock (Phase 1 ships inline SVG) |

Sort order for generation = gameplay importance → visibility → reuse → difficulty →
cost → modularity → dependency, i.e. rows 1–3, 5–6 first (core loop), then 8–9 (property),
7, 10–12, then showcase/cinematics last (14 is needed before 4/13).

### D. Production-ready prompts (kit masters — every backlog asset derives from its kit master with the bracketed parameters swapped; §31.14 fields included)

**[HIGGSFIELD ASSET REQUIRED] `case-midtower-airflow` — kit 1 master**
Purpose: modular PC case shell (Designer/inventory/home placement). 3D via image-to-3D;
~46×23×46 cm. Prompt:
"Create a hyperrealistic AAA-quality 3D game asset of a mid-tower ATX PC case with a
high-airflow mesh front panel, tempered-glass left side panel rendered separately, black
powder-coated SECC steel body, 46cm tall × 23cm wide × 46cm deep, physically accurate
proportions, isolated and centered on a neutral light-gray studio background, clear
three-quarter front angle, soft three-point studio lighting, realistic PBR materials
(brushed steel, matte polymer, glass with light transmission), strong silhouette, clean
panel seams, visible front I/O detail, removable side/front panels as separate modular
parts, empty interior with standard motherboard tray and PSU shroud, suitable for
image-to-3D conversion and Unity/Unreal import. Variants: [budget: plain steel no glass |
enthusiast: RGB fan ring accents | luxury: silver aluminum + etched glass | damaged:
dented panel, dust, missing thumbscrew]. No people, no hands, no unrelated props, no
floating pieces, no text or logos, no distorted geometry, no exaggerated proportions,
no concept-art background, no cinematic environment."

**[HIGGSFIELD ASSET REQUIRED] `gpu-body-flagship` — kit 2 master (component family)**
Purpose: GPU visual for listings/BOM/assembly; 2D marketplace + 3D module. 31×13×6 cm.
Prompt: "Create a hyperrealistic AAA-quality 3D game asset of a flagship consumer
graphics card, triple-fan open-shroud cooler, 31cm long, matte gunmetal shroud with
subtle silver accents, exposed heatpipes at the tail, backplate with vent cutouts,
PCIe connector and 16-pin power connector accurately placed, isolated, centered,
three-quarter front view, neutral light-gray background, studio lighting, PBR materials
(die-cast aluminum, matte polymer, nickel heatpipes), strong silhouette, separate parts:
shroud, fans ×3 (spin animation), backplate, PCB. Variants: [new pristine | used: light
dust and scuffed backplate | refurbished: clean but matte-worn | damaged: bent fin stack,
cracked fan blade, scorched power connector | enterprise: blower-style silver, no fans
visible, passive heatsink | prototype: bare PCB, exposed VRMs, temporary wiring]. Suitable
for image-to-3D and Unity/Unreal. No people, no hands, no brand text, no floating parts,
no distorted geometry, no concept-art background."

**[HIGGSFIELD ASSET REQUIRED] `marketplace-render-standard` — kit 3**
Purpose: the visual standard every listing render must match (consumer/pro/server/
construction/networking/cooling/tools/facility classes). 2D only. Prompt template:
"Professional e-commerce product photograph of [PRODUCT], centered on a seamless white
background (#ffffff), soft shadow directly beneath, 3/4 front hero angle plus orthographic
front/rear/side/top set, consistent 85mm-equivalent perspective, high-key studio lighting,
color-accurate, no props, no people, no text overlays, no watermarks, no reflections other
than natural material response, 1024×1024, product fills 78% of frame." Condition variants
append: "[shows light wear and dust | refurbished-clean with faint scuffs | visibly
damaged: EXPLICIT defect list from gameplay state]."

**[HIGGSFIELD ASSET REQUIRED] `server-4u-gpu` — kit 5 master**
Purpose: AI server for racks/POs/wholesale. 3D; 17.8×44.8×80 cm (4U). Prompt: "Create a
hyperrealistic AAA-quality 3D game asset of a 4U rack-mount AI GPU server, matte black
steel chassis, front panel with dense hexagonal vents, ears with rack screws, subtle
status LEDs (separate emissive layer), rear view variant showing 8 GPU exhaust grilles,
redundant PSU bays and network ports, 44.8cm wide × 17.8cm tall × 80cm deep, isolated,
centered, orthographic front and rear views plus three-quarter, neutral background,
studio lighting, PBR (powder-coated steel, anodized aluminum ears), modular parts: chassis,
front bezel, rail kit, PSU modules ×2. Variants: [enterprise standard | liquid-cooled:
front quick-disconnect manifolds and hoses | maintenance: bezel removed, sleds partially
extended | damaged: scorched rear grille]. Image-to-3D suitable, Unity/Unreal ready. No
people, no text, no cables unless specified, no floating pieces, no concept background."

**[HIGGSFIELD ASSET REQUIRED] `rack-42u-modular` — kit 6 master**
Purpose: the single rack model all configurations reuse (populated procedurally from kit-5
units). 3D; 200×60×120 cm. Prompt: "Create a hyperrealistic AAA-quality 3D game asset of
an empty 42U server rack enclosure, black steel frame, perforated front door rendered as
a separate hinged part (open/closed animation), removable side panels, visible numbered
mounting rails, cable-management fingers at rear, casters and leveling feet, 200cm tall ×
60cm wide × 120cm deep, isolated, centered, three-quarter front angle plus orthographic
front, neutral light-gray background, studio lighting, PBR powder-coated steel, strong
silhouette, empty interior ready for modular 1U–4U units. Variants: [standard | AI-liquid:
rear manifold column and hose bundle | damaged: bent door mesh, water-stain streaks |
secure: solid locking door with keypad]. Image-to-3D suitable. No servers inside, no
people, no text, no floating pieces, no concept background."

**[HIGGSFIELD ASSET REQUIRED] `freight-gpu-pallet` — kit 7 master**
Purpose: wholesale deliveries must feel different from retail boxes. 2D. Prompt:
"Professional warehouse photograph of a shrink-wrapped shipping pallet stacked with
uniform matte-black GPU retail boxes, heavy-duty wooden pallet, steel banding, corner
protectors, a blank white shipping label panel (no text), neutral concrete warehouse
floor, soft overhead industrial lighting, 3/4 angle, shallow depth of field, photoreal,
no people, no forklifts, no brand logos, no readable text. Variants: [sealed accelerator
crate: olive military-style plywood crate with foam-lined open-lid variant | server
pallet: 4U chassis stack | secure transport case: black Pelican-style case with foam
cutouts holding accelerator modules]."

**[HIGGSFIELD ASSET REQUIRED] `property-warehouse-evolution` — kits 8–9 master**
Purpose: HomeFind listing + facility progression (same building through 5 stages).
2D set. Prompt: "Wide-angle architectural photograph of a single-story 40,000 sq ft
concrete tilt-up warehouse, light gray walls, blue accent stripe, roll-up loading doors,
small office entrance, parking apron, overcast neutral sky, eye-level 3/4 exterior view,
photoreal, consistent camera position across all variants. Interior variant series from
the SAME viewpoint: [1 empty concrete shell, skylights | 2 assembly workshop: workbenches,
ESD mats, shelving | 3 test lab: benches with diagnostic rigs, cage storage | 4 small
server room build-out: glass-walled white room, two rack rows, overhead tray | 5 data-hall
fit-out: contained aisle, CRAH units, raised floor]. Exterior condition variants: [night
with wall-pack lighting | renovated: new cladding and generator yard | damaged: weathered,
boarded window]. No people, no vehicles, no signage text."

**[HIGGSFIELD ASSET REQUIRED] `dc-hall-liquid-ai` — kit 11 master**
Purpose: endgame data-hall environment (ops board hero, showcase base). 2D. Prompt:
"Photorealistic interior of a modern liquid-cooled AI data hall, long symmetrical aisle
of black 42U racks with blue coolant manifolds and orange quick-disconnect hoses, sealed
hot-aisle containment with glass doors, white raised floor, overhead busway and cable
tray, cool white lighting with subtle blue status-LED glow, one-point perspective down
the aisle, clean, no people, no text, photoreal, 2048×1152. Theme variants: [air-cooled:
grated floor tiles, no hoses | containerized: corrugated module walls | underground:
rock-faced walls | desert campus exterior sibling | cold-climate: frost-lit exterior
sibling]. State variants: [operational blue | high-load amber glow | overheating: red
status wash and heat shimmer | maintenance: open rack, service cart | water-leak: wet
floor sheen and caution zone]."

**[HIGGSFIELD ASSET REQUIRED] `cinematic-cluster-startup` — kit 13 master**
Purpose: milestone reveal ("first full-cluster startup"). 2D cinematic, 2048×1152.
Prompt: "Cinematic wide shot inside a hyperscale AI data hall at the moment of first
power-on: rows of dark racks igniting with cascading blue LED waves receding into the
distance, faint volumetric haze, dramatic low-key lighting with cool rim light, slight
low-angle hero perspective, photoreal, awe-inspiring scale, no people, no text, no UI.
Sibling milestones swap the moment: [first accelerator crate opening under warehouse
spotlights | crane lifting a branded rack crate at dawn on a construction site | grand
opening: exterior at dusk, illuminated (blank) signage | emergency shutdown: hall in red
emergency lighting | recovery: half-lit hall returning to blue]."

**[HIGGSFIELD ASSET REQUIRED] `office-hw-test-lab` — kit 12 master**
Purpose: Talent Hub/Workday environment headers. 2D. Prompt: "Photorealistic interior of
a hardware testing laboratory, rows of white ESD workbenches with open PC test rigs,
oscilloscopes and thermal cameras, component drawers, anti-static flooring, bright even
lighting, 3/4 room view, clean modern-industrial style, no people, no readable text.
Variants: [engineering office: desks and monitor walls | interview room: glass wall,
table for two | assembly floor: conveyor of open cases | DC control room/NOC: curved
monitor wall with abstract (non-textual) dashboards, dark ambience | onboarding scene:
bright lobby with (blank) welcome screen]."

Remaining backlog rows (10, 14, 15, 16) derive similarly; row 14 (brand decals) is
generated as flat alpha overlays ("minimal vector-style logo plate, transparent
background") and composited at runtime with player colors — the only asset class with
transparent-background output required.

### E. Phase alignment (do not defer assets)
Phase 1 ships with SVG/CSS placeholders (P1) already in code; each later phase's
definition-of-done includes its kit rows: Phase 2 → kits 2, 3, 8, 12; Phase 3 → kits 7,
14, 15; Phase 4 → kits 1, 5, 6, 9, 10, 11; Phase 5 → kits 4, 13. Generation requests go
through the Higgsfield MCP (`generate_image`, then `generate_3d` for placeables) and are
recorded in `assets/registry.json` on approval.
