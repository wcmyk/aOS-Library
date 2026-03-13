# AoS Accel Enterprise Spreadsheet Redesign Plan

## 1) UI/UX redesign proposal

### Product framing
Accel is treated as a desktop-class AoS productivity program, not a table widget. The redesigned shell has:
- title and workspace metadata region
- enterprise command ribbon
- structured formula bar with address/name box
- high-density spreadsheet work surface with frozen headers
- workbook tabs + status footer
- optional side intelligence panel for live context

### Spreadsheet ergonomics
- workbook/worksheet mental model with persistent active sheet
- single-cell and range selection with drag extension
- inline editing and formula-bar editing
- keyboard-first navigation
- context menu operations for cell workflows
- explicit active, selected, in-range, editing, and frozen states

## 2) Technical architecture (preferred stack aligned)

### Layered architecture
1. **AoS application shell layer**
   - window framing, launch routing, title metadata, host integration
2. **Spreadsheet state layer**
   - workbook model, sheet model, selection model, revision history model
3. **Formula engine layer**
   - expression parsing, range function support, reference resolution, cycle guard
4. **Rendering and performance layer**
   - row/column windowing, sticky frozen panes, resize systems
5. **Design-system layer**
   - luminous glass tokens, interaction tokens, component anatomy patterns

### Stack direction
- Vite + React + TypeScript as primary runtime foundation
- Tailwind + shadcn/ui + Radix for production-grade primitives (command/menu/dialog) in the next hardening pass
- Motion for panel and state transition choreography in the next hardening pass
- TanStack Virtual for formal row/column virtualization upgrade
- HyperFormula for enterprise formula breadth and dependency graph evaluation

## 3) Major library and subsystem justification
- **React/TypeScript**: strict contracts for workbook persistence and predictable shell integration
- **Tailwind + token strategy**: faster iteration and consistent spacing/visual rules at scale
- **Radix primitives**: accessible menus/dialogs/popovers while retaining full AoS visual ownership
- **Motion**: restrained micro-interactions and state continuity without animation noise
- **TanStack Virtual**: robust scale path for very large sheets with reduced render pressure
- **HyperFormula**: high-confidence expansion path to Excel-class formula support

## 4) Component map

### Reusable primitives
- `GlassPanel`
- `CommandButton`
- `TokenInput`
- `ContextMenuSurface`
- `StatusMetric`
- `SelectionBadge`

### Spreadsheet components
- `WorkbookSurface`
- `WorkbookTitleBar`
- `RibbonBar`
- `FormulaBar`
- `SheetViewport`
- `ColumnHeaderCell`
- `RowHeaderCell`
- `GridCell`
- `InlineCellEditor`
- `WorkbookTabs`
- `StatusFooter`

## 5) Luminous glass visual system specification

### Surface language
- layered optical glass panels with restrained diffusion
- thin luminous strokes and soft edge highlights
- gentle atmospheric glow, no neon effects
- high-contrast text on translucent backgrounds

### Token groups
- blur tiers (nested controls, main shell, overlays)
- opacity tiers for shell/ribbon/workspace/panel surfaces
- border highlight tokens (outer stroke + inset light)
- elevation tokens (ambient shadow + inset optical cues)
- focus/selection tokens for keyboard and cell states

### Interaction states
- hover: subtle luminosity increase + stroke lift
- active: compact depth response
- selected: clear focus outline + fill shift
- editing: strict local emphasis with minimal visual distraction

## 6) Performance plan
- viewport row/column windowing to limit cell render volume
- immutable but localized updates per active sheet
- revision stack capped to bound memory growth
- frozen panes rendered with sticky strategy for predictable layout
- controlled blur regions to avoid expensive full-surface repaints
- migrate to TanStack Virtual and memoized cells for larger datasets
- migrate to HyperFormula cached dependency graph for formula scaling

## 7) Phased implementation roadmap

### Phase 1: premium shell + workbook core
- luminous shell, formula bar, workbook tabs, frozen panes, resize controls
- workbook persistence model with compatibility fallback

### Phase 2: spreadsheet fundamentals hardening
- richer keyboard matrix, copy/cut/paste reliability, fill semantics, undo/redo maturity
- right-click command expansion and validation patterns

### Phase 3: enterprise analysis workflows
- filter/sort panels, data validation rules, named ranges, structured formatting
- command palette and advanced navigation affordances

### Phase 4: platform scale and extensibility
- TanStack Virtual row/column virtualization
- HyperFormula integration for broad formula parity
- hooks for charting, automation, and workflow scripting

## 8) Production-ready build strategy
- strict type checks and production builds in CI
- workbook schema versioning with migration guardrails
- incremental feature flags for formula/virtualization engine swaps
- regression tests for keyboard flow, formulas, and sheet persistence
- visual regression snapshots for shell and grid state surfaces
