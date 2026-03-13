# AoS Accel Enterprise Spreadsheet Redesign Plan

## 1. UI/UX redesign proposal
- **Product shape**: a desktop-grade workbook application with a premium command ribbon, formula region, high-density grid workspace, workbook tabs, and status rail.
- **Interaction hierarchy**:
  1. Window title row for document metadata and collaboration state.
  2. Ribbon for formatting and workbook actions.
  3. Formula bar with name-box + expression editing.
  4. Spreadsheet body with sticky row and column headers.
  5. Sheet tabs and status insights in footer.
- **Behavior model**:
  - Workbook/sheet mental model with persistent active sheet.
  - Single-cell and drag-range selection behavior.
  - Inline editing and formula bar editing.
  - Column resizing and number formatting.
  - Formula evaluation with range support for SUM/AVG/MIN/MAX/COUNT.

## 2. Recommended architecture

### Layered system
1. **AoS shell layer**
   - Window frame integration, document routing, application launch surfaces.
2. **Spreadsheet domain state**
   - Workbook JSON model (`WorkbookModel`, `SheetModel`), selection state, active sheet state.
3. **Formula subsystem**
   - Cell reference parser + formula evaluator with range and expression support.
4. **Render subsystem**
   - Sticky headers + viewport row-windowing (overscan strategy in current implementation).
5. **Design system layer**
   - Glass tokens, command button patterns, formula bar anatomy, workbook tab patterns.

### Default stack direction (target state)
- **Foundation**: Vite + React + TypeScript (already in place).
- **Styling and primitives**: Tailwind + shadcn/Radix migration path for controlled enterprise components.
- **Motion layer**: Motion for panel transitions, command affordance, and focus choreography.
- **Virtualization layer**: TanStack Virtual for row and column virtualization at enterprise sheet scale.
- **Formula engine layer**: HyperFormula to expand from current formula subset to full dependency graph and advanced functions.

## 3. Library and subsystem justification
- **React + TypeScript**: strict state contracts for workbook and sheet models, predictable app-shell integration.
- **Tailwind + tokenized CSS strategy**: deterministic visual language with reusable glass/elevation tiers.
- **Radix primitives**: accessible context menus, dialogs, and command popovers with AoS styling control.
- **TanStack Virtual**: high-scale rendering safety without shipping monolithic grid UI.
- **HyperFormula**: robust spreadsheet computation and long-term formula parity strategy.

## 4. Component map

### Reusable platform primitives
- `GlassPanel`
- `CommandButton`
- `SegmentedControl`
- `FormulaInput`
- `ContextMenuSurface`
- `StatusMetric`

### Spreadsheet-specific components
- `WorkbookSurface`
- `WorkbookTitleBar`
- `RibbonBar`
- `FormulaRegion`
- `SheetGrid`
- `RowHeader`
- `ColumnHeader`
- `CellView`
- `InlineCellEditor`
- `WorkbookTabs`
- `WorkbookStatusFooter`

## 5. Visual system (glass specification)
- **Surface tokens**: low-noise navy glass surfaces with opacity ladder for frame, ribbon, and content levels.
- **Blur tiers**:
  - Tier 1: 12px for nested controls.
  - Tier 2: 20px for primary shells.
  - Tier 3: 24px for modal overlays.
- **Stroke language**: cool neutral border with light top-edge highlight.
- **Elevation**: soft atmospheric shadow + subtle inset highlight.
- **Typography**: compact, high-legibility, low-decorative enterprise text hierarchy.
- **State system**: explicit hover/active/selected/focus/editing states with clear border and fill deltas.

## 6. Performance plan
- Keep grid interactions responsive with viewport row-windowing and overscan.
- Minimize object churn through immutable but localized sheet updates.
- Avoid expensive paint regions; isolate blur panels and reduce animated properties.
- Move to TanStack Virtual + memoized cell rendering for large-sheet targets.
- Introduce formula dependency graph caching when HyperFormula is integrated.

## 7. Phased implementation roadmap
1. **Phase 1 – Core shell and workbook model**
   - Ship premium glass shell, workbook JSON format, formula bar, tabs, and column resizing.
2. **Phase 2 – Spreadsheet fundamentals hardening**
   - Keyboard navigation matrix, undo/redo stack, fill handle, clipboard semantics.
3. **Phase 3 – Enterprise tooling**
   - Context menus, validation rules, sorting/filtering panels, freeze panes, named ranges.
4. **Phase 4 – Platform scale and intelligence**
   - HyperFormula integration, TanStack Virtualization upgrades, chart and automation extensibility.

## 8. Production build strategy
- Maintain strict TypeScript checks in CI.
- Keep workbook format versioned (`version: 1`) for migration safety.
- Progressive enhancement path: retain backward compatibility for legacy tab-separated sheet payloads.
- Add visual regression snapshots for shell/ribbon/formula/grid states.
- Add interaction tests for formula accuracy, cell editing lifecycle, and multi-sheet persistence.
