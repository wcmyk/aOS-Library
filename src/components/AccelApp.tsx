import { useState, useRef, useEffect, useCallback } from 'react';
import { ExcelFormulas } from '../excel/formulas';
import { AutoFillEngine } from '../excel/autofill';
import { CellFormatter } from '../excel/formatting';
import { CalculationEngine } from '../excel/calculation-engine';
import { FormulaCoach, type FormulaError } from '../excel/formula-coach';
import type { CellData, CellAddress } from '../excel/types';

// ============================================================================
// TEMPLATE DATA
// ============================================================================

const accelTemplates = [
  { name: 'Blank workbook', type: 'blank' },
  { name: 'Inventory list', type: 'inventory' },
  { name: 'Personal monthly budget', type: 'budget' },
  { name: 'Loan amortization schedule', type: 'loan' },
  { name: 'Weekly chore schedule', type: 'chores' },
];

const featureSections = [
  {
    title: 'Workbook canvas',
    description: 'Classic grid with headers, quick text editing, formatting, and merge cells for clean layouts.',
    bullets: ['Inline editing with keyboard focus', 'Merge across rows/columns', 'Auto-size and wrap text', 'Freeze panes and headers'],
  },
  {
    title: 'Formula bar & functions',
    description: 'Full formula entry, dynamic recalculation, and fill handle gestures to propagate logic.',
    bullets: ['Arithmetic, logical, lookup, and dynamic array formulas', 'AutoFill, flash fill, and series drag', 'Absolute/relative references', 'Error helpers for #REF!, #VALUE!, #NAME?'],
  },
  {
    title: 'Data shaping',
    description: 'Structure data with tables, named ranges, filters, and conditional logic before analysis.',
    bullets: ['Structured references for tables', 'Sort & filter with slicers', 'Conditional formatting rules', 'Data validation for clean inputs'],
  },
  {
    title: 'Analysis & charts',
    description: 'Pivot-ready summaries, sparklines, and charts to visualize workbook health at a glance.',
    bullets: ['Pivot tables and grouping', 'Sparklines in cells', 'Column, line, and combo charts', 'What-if analysis & Goal Seek'],
  },
];

const formulaCategories = [
  {
    title: 'Essential math',
    accent: '#d4a017',
    entries: [
      { name: 'SUM', detail: 'Add a range', example: '=SUM(B2:B20)' },
      { name: 'AVERAGE', detail: 'Mean of values', example: '=AVERAGE(C2:C12)' },
      { name: 'ROUND', detail: 'Round with precision', example: '=ROUND(D2, 2)' },
    ],
  },
  {
    title: 'Lookup',
    accent: '#7c8cff',
    entries: [
      { name: 'VLOOKUP', detail: 'Vertical search', example: '=VLOOKUP(A2, Table1, 3, FALSE)' },
      { name: 'XLOOKUP', detail: 'Flexible search', example: '=XLOOKUP(E2, Products[ID], Products[Price])' },
      { name: 'INDEX/MATCH', detail: 'Two-step lookup', example: '=INDEX(C:C, MATCH(A2, A:A, 0))' },
    ],
  },
  {
    title: 'Text shaping',
    accent: '#34d399',
    entries: [
      { name: 'TEXT', detail: 'Format numbers/dates', example: '=TEXT(B2, \"yyyy-mm-dd\")' },
      { name: 'CONCAT', detail: 'Join strings', example: '=CONCAT(A2, \" - \", B2)' },
      { name: 'LEFT/RIGHT', detail: 'Slice characters', example: '=LEFT(C2, 3)' },
    ],
  },
  {
    title: 'Logic & arrays',
    accent: '#f472b6',
    entries: [
      { name: 'IF/IFS', detail: 'Branching logic', example: '=IF(D2>0, \"Profit\", \"Loss\")' },
      { name: 'FILTER', detail: 'Dynamic subsets', example: '=FILTER(A2:C50, C2:C50>1000)' },
      { name: 'UNIQUE', detail: 'Distinct values', example: '=UNIQUE(B2:B200)' },
    ],
  },
];

const workbookStats = [
  { label: 'Cells tracked', value: '13,200', hint: 'Live recalculation on changes' },
  { label: 'Formats active', value: '42', hint: 'Number, date, currency, custom' },
  { label: 'Linked sheets', value: '7', hint: 'Cross-sheet references preserved' },
];

const powerTools = [
  { name: 'Formatting ribbon', detail: 'Bold, italic, underline, fill/outline colors, borders, and alignment controls.' },
  { name: 'Cell sizing', detail: 'Drag headers to resize columns/rows; auto-fit based on content width/height.' },
  { name: 'Named ranges', detail: 'Define reusable ranges for formulas, data validation, and charts.' },
  { name: 'Data tools', detail: 'Sort/Filter, slicers, text-to-columns, flash fill, remove duplicates, and validation lists.' },
  { name: 'Analysis', detail: 'Pivot tables, grouping, subtotals, What-If analysis, Goal Seek, and Solver optimizations.' },
  { name: 'Charts & visuals', detail: 'Columns, bars, lines, combo charts, sparklines, and conditional formatting heatmaps.' },
  { name: 'Collaboration', detail: 'Comments/notes, version-aware recalculation, and change highlighting per cell.' },
];

const accelAhead = [
  { title: 'AI Formula Coach', detail: 'Explains formulas, suggests fixes for #REF!/#VALUE!, and tests logic against sample data.' },
  { title: 'Smart Autofill+', detail: 'Learns patterns beyond Flash Fill with preview/rollback for series and text shaping.' },
  { title: 'Inline Transform History', detail: 'Stepwise, undoable data shaping (split, dedupe, type-fix) with instant diff view.' },
  { title: 'Scenario Sandboxes', detail: 'Branch worksheets, compare deltas, and merge winning what-if models safely.' },
  { title: 'Solver++', detail: 'Multi-objective, stochastic, and nonlinear optimizers with constraint heatmaps and sensitivity.' },
  { title: 'Chart Composer', detail: 'Templateable charts/dashboards with theme tokens and auto-layout from selected ranges.' },
  { title: 'In-cell mini visuals', detail: 'Data bars, bullet graphs, variance arrows, and micro heatmaps alongside values.' },
  { title: 'Provenance & Audit', detail: 'Track sources, transformations, and formula lineage with time travel and rollback.' },
  { title: 'Secure Automation', detail: 'Sandboxed TypeScript/JS actions with event hooks and guardrails for on-change/on-refresh.' },
  { title: 'Collab & Governance', detail: 'Presence cursors, per-cell permissions, DLP policies, and branch/merge of sheets.' },
];

const TemplateIcon = ({ type }: { type: string }) => {
  if (type === 'blank') {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="8" y="8" width="32" height="32" rx="2" fill="rgba(212, 160, 23, 0.2)" stroke="rgba(212, 160, 23, 0.6)" strokeWidth="2"/>
        <line x1="8" y1="16" x2="40" y2="16" stroke="rgba(212, 160, 23, 0.4)" strokeWidth="1"/>
        <line x1="16" y1="8" x2="16" y2="40" stroke="rgba(212, 160, 23, 0.4)" strokeWidth="1"/>
      </svg>
    );
  }
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="10" y="10" width="28" height="28" rx="2" fill="rgba(212, 160, 23, 0.15)" stroke="rgba(212, 160, 23, 0.5)" strokeWidth="2"/>
    </svg>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function colToLetter(col: number): string {
  let result = '';
  while (col >= 0) {
    result = String.fromCharCode(65 + (col % 26)) + result;
    col = Math.floor(col / 26) - 1;
  }
  return result;
}

function getCellAddress(row: number, col: number): string {
  return `${colToLetter(col)}${row + 1}`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AccelApp() {
  const [view, setView] = useState<'home' | 'spreadsheet'>('home');
  const [selectedSidebar, setSelectedSidebar] = useState('home');
  const [cells, setCells] = useState<Map<string, CellData>>(new Map());
  const [selectedCell, setSelectedCell] = useState<CellAddress | null>(null);
  const [selectionStart, setSelectionStart] = useState<CellAddress | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<CellAddress | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [editingCell, setEditingCell] = useState<CellAddress | null>(null);
  const [isDraggingFill, setIsDraggingFill] = useState(false);
  const [dragFillStart, setDragFillStart] = useState<CellAddress | null>(null);
  const [dragFillEnd, setDragFillEnd] = useState<CellAddress | null>(null);
  const [copiedRange, setCopiedRange] = useState<{ start: CellAddress; end: CellAddress } | null>(null);
  const [isTableMode, setIsTableMode] = useState(false);
  const [tableRange, setTableRange] = useState<{ start: CellAddress; end: CellAddress } | null>(null);
  const [formulaError, setFormulaError] = useState<FormulaError | null>(null);
  const [showFormulaCoach, setShowFormulaCoach] = useState(false);

  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const autoFillEngine = useRef(new AutoFillEngine());
  const formatter = useRef(new CellFormatter());
  const calcEngine = useRef(new CalculationEngine(10000)); // Max 10,000 iterations for safety
  const formulas = useRef(new ExcelFormulas(cells));
  const formulaCoach = useRef(new FormulaCoach(cells));

  // Get cell data or create empty
  const getCell = (row: number, col: number): CellData => {
    const address = getCellAddress(row, col);
    return cells.get(address) || { value: '', displayValue: '' };
  };

  // Update cell data with smart recalculation using dependency graph
  const updateCell = useCallback(async (row: number, col: number, data: Partial<CellData>) => {
    const address = getCellAddress(row, col);

    setCells(prev => {
      const newCells = new Map(prev);
      const existing = newCells.get(address) || { value: '', displayValue: '' };
      const updatedCell = { ...existing, ...data };
      newCells.set(address, updatedCell);

      // Register cell with dependency graph if it has a formula
      if (updatedCell.formula) {
        const dependencies = calcEngine.current.extractReferences(updatedCell.formula);
        calcEngine.current.registerCell(address, dependencies);
      } else {
        calcEngine.current.registerCell(address, []);
      }

      // Mark this cell and all dependents as dirty
      calcEngine.current.markDirty(address);

      // Trigger async recalculation
      setTimeout(() => {
        recalculateFormulas(newCells);
      }, 0);

      return newCells;
    });
  }, []);

  // Async recalculation with dependency graph
  const recalculateFormulas = useCallback(async (cellMap: Map<string, CellData>) => {
    const formulasEngine = new ExcelFormulas(cellMap);

    // Cell evaluator function
    const evaluator = async (address: string, cell: CellData) => {
      if (!cell.formula) {
        return { value: cell.value };
      }

      try {
        const result = evaluateFormula(cell.formula, cellMap, formulasEngine);
        return { value: result };
      } catch (error) {
        return {
          value: '#ERROR!',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    };

    // Run the calculation engine
    const stats = await calcEngine.current.recalculate(cellMap, evaluator);

    // Update cells with calculated results
    setCells(new Map(cellMap));

    // Log stats for debugging
    if (stats.circularReferences.length > 0) {
      console.warn('Circular references detected:', stats.circularReferences);
    }

    console.log(`Recalculated ${stats.calculatedCells} cells in ${stats.calculationTimeMs.toFixed(2)}ms`);
  }, []);

  // Evaluate formula using Excel formula engine
  const evaluateFormula = (formula: string, cellMap: Map<string, CellData>, formulas: ExcelFormulas): any => {
    // Remove leading =
    let expr = formula.startsWith('=') ? formula.substring(1).toUpperCase() : formula.toUpperCase();

    // Replace cell references with actual values
    expr = expr.replace(/([A-Z]+\d+):([A-Z]+\d+)/g, (match, start, end) => {
      const values = getRangeValues(start, end, cellMap);
      return `[${values.join(',')}]`;
    });

    expr = expr.replace(/([A-Z]+\d+)/g, (match) => {
      const cell = cellMap.get(match);
      if (!cell) return '0';

      const num = parseFloat(cell.value);
      if (!isNaN(num)) return num.toString();
      return `"${cell.value}"`;
    });

    // Evaluate Excel functions
    return evaluateExcelFunctions(expr, formulas);
  };

  // Get values from a range
  const getRangeValues = (start: string, end: string, cellMap: Map<string, CellData>): number[] => {
    const startMatch = start.match(/([A-Z]+)(\d+)/);
    const endMatch = end.match(/([A-Z]+)(\d+)/);

    if (!startMatch || !endMatch) return [];

    const startCol = letterToCol(startMatch[1]);
    const startRow = parseInt(startMatch[2]) - 1;
    const endCol = letterToCol(endMatch[1]);
    const endRow = parseInt(endMatch[2]) - 1;

    const values: number[] = [];
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cell = cellMap.get(getCellAddress(row, col));
        const num = parseFloat(cell?.value || '0');
        values.push(isNaN(num) ? 0 : num);
      }
    }

    return values;
  };

  // Convert letter to column index
  const letterToCol = (letter: string): number => {
    let col = 0;
    for (let i = 0; i < letter.length; i++) {
      col = col * 26 + (letter.charCodeAt(i) - 64);
    }
    return col - 1;
  };

  // Evaluate Excel functions
  const evaluateExcelFunctions = (expr: string, formulas: ExcelFormulas): any => {
    // Parse array notation
    const parseArray = (str: string): number[] => {
      if (!str.startsWith('[') || !str.endsWith(']')) return [];
      return str.slice(1, -1).split(',').map(v => parseFloat(v.trim()) || 0);
    };

    // Handle SUM
    expr = expr.replace(/SUM\(([^)]+)\)/g, (_, args) => {
      const arr = parseArray(args);
      return formulas.SUM(...arr).toString();
    });

    // Handle AVERAGE
    expr = expr.replace(/AVERAGE\(([^)]+)\)/g, (_, args) => {
      const arr = parseArray(args);
      return formulas.AVERAGE(...arr).toString();
    });

    // Handle COUNT
    expr = expr.replace(/COUNT\(([^)]+)\)/g, (_, args) => {
      const arr = parseArray(args);
      return formulas.COUNT(...arr).toString();
    });

    // Handle MAX
    expr = expr.replace(/MAX\(([^)]+)\)/g, (_, args) => {
      const arr = parseArray(args);
      return formulas.MAX(...arr).toString();
    });

    // Handle MIN
    expr = expr.replace(/MIN\(([^)]+)\)/g, (_, args) => {
      const arr = parseArray(args);
      return formulas.MIN(...arr).toString();
    });

    // Handle IF
    expr = expr.replace(/IF\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, (_, condition, trueVal, falseVal) => {
      const cond = evaluateCondition(condition);
      return cond ? trueVal : falseVal;
    });

    // Evaluate basic math
    try {
      const sanitized = expr.replace(/[^0-9+\-*/().]/g, '');
      if (sanitized) {
        return Function('"use strict"; return (' + sanitized + ')')();
      }
    } catch {}

    return expr;
  };

  // Evaluate condition
  const evaluateCondition = (condition: string): boolean => {
    const match = condition.match(/([^>=<]+)\s*([>=<]+)\s*([^>=<]+)/);
    if (!match) return false;

    const left = parseFloat(match[1].trim());
    const operator = match[2].trim();
    const right = parseFloat(match[3].trim());

    switch (operator) {
      case '>': return left > right;
      case '<': return left < right;
      case '>=': return left >= right;
      case '<=': return left <= right;
      case '=': case '==': return left === right;
      case '!=': case '<>': return left !== right;
      default: return false;
    }
  };

  // Handle cell input
  const handleCellInput = (row: number, col: number, value: string) => {
    const isFormula = value.startsWith('=');

    if (isFormula) {
      updateCell(row, col, {
        value: value,
        formula: value,
        displayValue: value
      });
    } else {
      updateCell(row, col, {
        value: value,
        formula: undefined,
        displayValue: value
      });
    }

    setFormulaBarValue(value);
  };

  // Handle cell click
  const handleCellClick = (row: number, col: number, event: React.MouseEvent) => {
    if (event.shiftKey && selectedCell) {
      setSelectionEnd({ row, col });
    } else {
      setSelectedCell({ row, col });
      setSelectionStart({ row, col });
      setSelectionEnd({ row, col });
      setEditingCell(null);

      const cell = getCell(row, col);
      setFormulaBarValue(cell.formula || cell.value);

      // Check for errors and show Formula Coach
      if (cell.error && cell.formula) {
        const address = getCellAddress(row, col);
        const error = formulaCoach.current.diagnoseError(cell.formula, address, cell.displayValue);
        if (error) {
          setFormulaError(error);
          setShowFormulaCoach(true);
        }
      } else {
        setShowFormulaCoach(false);
        setFormulaError(null);
      }
    }
  };

  // Handle cell double-click for editing
  const handleCellDoubleClick = (row: number, col: number) => {
    setEditingCell({ row, col });

    setTimeout(() => {
      const address = getCellAddress(row, col);
      const input = inputRefs.current.get(address);
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  };

  // Handle mouse down for drag selection
  const handleMouseDown = (row: number, col: number, event: React.MouseEvent) => {
    if (event.button === 0) {
      setIsSelecting(true);
      setSelectionStart({ row, col });
      setSelectionEnd({ row, col });
      setSelectedCell({ row, col });
    }
  };

  // Handle mouse enter for drag selection
  const handleMouseEnter = (row: number, col: number) => {
    if (isSelecting) {
      setSelectionEnd({ row, col });
    } else if (isDraggingFill && dragFillStart) {
      setDragFillEnd({ row, col });
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    if (isDraggingFill && dragFillStart && dragFillEnd) {
      performAutoFill(dragFillStart, dragFillEnd);
      setIsDraggingFill(false);
      setDragFillStart(null);
      setDragFillEnd(null);
    }
    setIsSelecting(false);
  };

  // Handle drag fill start
  const handleDragFillStart = (row: number, col: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setIsDraggingFill(true);
    setDragFillStart({ row, col });
    setDragFillEnd({ row, col });
  };

  // Perform auto-fill with smart pattern detection
  const performAutoFill = (start: CellAddress, end: CellAddress) => {
    const startCell = getCell(start.row, start.col);
    const startValue = startCell.value;

    // Determine direction
    const isVertical = Math.abs(end.row - start.row) > Math.abs(end.col - start.col);
    const isIncreasing = isVertical ? end.row > start.row : end.col > start.col;

    // Check if value is a number
    const num = parseFloat(startValue);
    const isNumber = !isNaN(num);

    if (isNumber) {
      // Auto-increment numbers
      const step = isIncreasing ? 1 : -1;
      let currentValue = num;

      if (isVertical) {
        const minRow = Math.min(start.row, end.row);
        const maxRow = Math.max(start.row, end.row);

        for (let row = minRow; row <= maxRow; row++) {
          if (row !== start.row) {
            currentValue += step;
            handleCellInput(row, start.col, currentValue.toString());
          }
        }
      } else {
        const minCol = Math.min(start.col, end.col);
        const maxCol = Math.max(start.col, end.col);

        for (let col = minCol; col <= maxCol; col++) {
          if (col !== start.col) {
            currentValue += step;
            handleCellInput(start.row, col, currentValue.toString());
          }
        }
      }
    } else {
      // Copy value for non-numbers
      if (isVertical) {
        const minRow = Math.min(start.row, end.row);
        const maxRow = Math.max(start.row, end.row);

        for (let row = minRow; row <= maxRow; row++) {
          if (row !== start.row) {
            handleCellInput(row, start.col, startValue);
          }
        }
      } else {
        const minCol = Math.min(start.col, end.col);
        const maxCol = Math.max(start.col, end.col);

        for (let col = minCol; col <= maxCol; col++) {
          if (col !== start.col) {
            handleCellInput(start.row, col, startValue);
          }
        }
      }
    }
  };

  // Copy selected range
  const handleCopy = () => {
    if (selectionStart && selectionEnd) {
      setCopiedRange({ start: selectionStart, end: selectionEnd });
    }
  };

  // Paste copied range
  const handlePaste = () => {
    if (!copiedRange || !selectedCell) return;

    const rowOffset = selectedCell.row - copiedRange.start.row;
    const colOffset = selectedCell.col - copiedRange.start.col;

    for (let row = copiedRange.start.row; row <= copiedRange.end.row; row++) {
      for (let col = copiedRange.start.col; col <= copiedRange.end.col; col++) {
        const sourceCell = getCell(row, col);
        const targetRow = row + rowOffset;
        const targetCol = col + colOffset;

        handleCellInput(targetRow, targetCol, sourceCell.value);
      }
    }
  };

  // Convert to table
  const handleConvertToTable = () => {
    if (!selectionStart || !selectionEnd) return;

    setIsTableMode(true);
    setTableRange({ start: selectionStart, end: selectionEnd });

    // Apply table styling to selected range
    const minRow = Math.min(selectionStart.row, selectionEnd.row);
    const maxRow = Math.max(selectionStart.row, selectionEnd.row);
    const minCol = Math.min(selectionStart.col, selectionEnd.col);
    const maxCol = Math.max(selectionStart.col, selectionEnd.col);

    // Style header row
    for (let col = minCol; col <= maxCol; col++) {
      const address = getCellAddress(minRow, col);
      setCells(prev => {
        const newCells = new Map(prev);
        const cell = newCells.get(address) || { value: '', displayValue: '' };
        cell.format = {
          ...cell.format,
          bold: true,
          backgroundColor: 'rgba(212, 160, 23, 0.3)',
          borderBottom: { style: 'medium', color: 'rgba(212, 160, 23, 0.8)' }
        };
        newCells.set(address, cell);
        return newCells;
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        handlePaste();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        handleConvertToTable();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectionStart, selectionEnd, selectedCell, copiedRange]);

  // Check if cell is in selected range
  const isCellSelected = (row: number, col: number): boolean => {
    if (!selectionStart || !selectionEnd) return false;

    const minRow = Math.min(selectionStart.row, selectionEnd.row);
    const maxRow = Math.max(selectionStart.row, selectionEnd.row);
    const minCol = Math.min(selectionStart.col, selectionEnd.col);
    const maxCol = Math.max(selectionStart.col, selectionEnd.col);

    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  };

  // Check if cell is in table
  const isCellInTable = (row: number, col: number): boolean => {
    if (!tableRange) return false;

    const minRow = Math.min(tableRange.start.row, tableRange.end.row);
    const maxRow = Math.max(tableRange.start.row, tableRange.end.row);
    const minCol = Math.min(tableRange.start.col, tableRange.end.col);
    const maxCol = Math.max(tableRange.start.col, tableRange.end.col);

    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  };

  // Handle formula bar change
  const handleFormulaBarChange = (value: string) => {
    setFormulaBarValue(value);
    if (selectedCell) {
      handleCellInput(selectedCell.row, selectedCell.col, value);
    }
  };

  // ============================================================================
  // RENDER SPREADSHEET VIEW
  // ============================================================================

  if (view === 'spreadsheet') {
    return (
      <div style={{ display: 'flex', height: '100%', background: 'rgba(14, 16, 22, 0.55)' }} onMouseUp={handleMouseUp}>
        {/* Sidebar */}
        <div style={{ width: '48px', background: 'rgba(212, 160, 23, 0.15)', borderRight: '1px solid rgba(212, 160, 23, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '16px', gap: '12px' }}>
          <button onClick={() => { setView('home'); setSelectedSidebar('home'); }} style={{ width: '32px', height: '32px', background: selectedSidebar === 'home' ? 'rgba(212, 160, 23, 0.3)' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px' }}>
            ⌂
          </button>
        </div>

        {/* Spreadsheet Grid */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Formatting Ribbon */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.22)', position: 'sticky', top: 0, zIndex: 1 }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>B</button>
              <button style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontStyle: 'italic' }}>I</button>
              <button style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', textDecoration: 'underline' }}>U</button>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button style={{ padding: '0 10px', height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontSize: 11 }}>Fill ▾</button>
              <button style={{ padding: '0 10px', height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontSize: 11 }}>Border ▾</button>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button style={{ padding: '0 8px', height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontSize: 11 }}>Align ⬅️</button>
              <button style={{ padding: '0 8px', height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontSize: 11 }}>Align ⬇️</button>
              <button style={{ padding: '0 8px', height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontSize: 11 }}>Wrap</button>
              <button style={{ padding: '0 8px', height: 28, borderRadius: 8, background: 'rgba(212,160,23,0.22)', border: '1px solid rgba(212,160,23,0.4)', color: '#fff', cursor: 'pointer', fontSize: 11 }}>Merge</button>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <div style={{ fontSize: 11, opacity: 0.75 }}>Cell size</div>
              <input type="range" min="40" max="140" defaultValue="100" style={{ accentColor: '#d4a017', width: 110 }} />
              <button style={{ padding: '0 8px', height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontSize: 11 }}>Auto-fit</button>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button style={{ padding: '0 10px', height: 28, borderRadius: 8, background: 'rgba(124,140,255,0.12)', border: '1px solid rgba(124,140,255,0.32)', color: '#fff', cursor: 'pointer', fontSize: 11 }}>Data ▾</button>
              <button style={{ padding: '0 10px', height: 28, borderRadius: 8, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.32)', color: '#fff', cursor: 'pointer', fontSize: 11 }}>Review ▾</button>
              <button style={{ padding: '0 10px', height: 28, borderRadius: 8, background: 'rgba(244,114,182,0.12)', border: '1px solid rgba(244,114,182,0.32)', color: '#fff', cursor: 'pointer', fontSize: 11 }}>Solver</button>
            </div>
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Toolbar */}
          <div style={{ height: '40px', background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px' }}>
            <button style={{ padding: '4px 12px', background: 'rgba(212, 160, 23, 0.2)', border: '1px solid rgba(212, 160, 23, 0.3)', borderRadius: '4px', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
              <strong>B</strong>
            </button>
            <button style={{ padding: '4px 12px', background: 'rgba(212, 160, 23, 0.2)', border: '1px solid rgba(212, 160, 23, 0.3)', borderRadius: '4px', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
              <em>I</em>
            </button>
            <button style={{ padding: '4px 12px', background: 'rgba(212, 160, 23, 0.2)', border: '1px solid rgba(212, 160, 23, 0.3)', borderRadius: '4px', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
              <u>U</u>
            </button>
            <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
            <button style={{ padding: '4px 12px', background: 'rgba(212, 160, 23, 0.2)', border: '1px solid rgba(212, 160, 23, 0.3)', borderRadius: '4px', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
              Merge
            </button>
            <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
            <button
              onClick={handleConvertToTable}
              style={{ padding: '4px 12px', background: 'rgba(212, 160, 23, 0.2)', border: '1px solid rgba(212, 160, 23, 0.3)', borderRadius: '4px', color: '#fff', fontSize: '11px', cursor: 'pointer' }}
              title="Convert to Table (Ctrl+T)"
            >
              📊 Table
            </button>
          </div>

          {/* Formula Bar */}
          <div style={{ height: '32px', background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '12px' }}>
            <span style={{ fontSize: '12px', opacity: 0.7, fontWeight: 600 }}>fx</span>
            <input
              type="text"
              value={formulaBarValue}
              onChange={(e) => handleFormulaBarChange(e.target.value)}
              placeholder="Enter formula or value"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '12px' }}
            />
          </div>

          {/* Formula Coach Panel */}
          {showFormulaCoach && formulaError && (
            <div style={{ background: 'rgba(220, 38, 38, 0.1)', borderBottom: '1px solid rgba(220, 38, 38, 0.3)', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ fontSize: '24px' }}>⚠️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#fca5a5' }}>{formulaError.type}</span>
                    <button
                      onClick={() => setShowFormulaCoach(false)}
                      style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#fff', opacity: 0.7, cursor: 'pointer', fontSize: '16px' }}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '8px', opacity: 0.9 }}>{formulaError.message}</div>
                  <div style={{ fontSize: '12px', marginBottom: '12px', color: '#fcd34d', fontWeight: 600 }}>💡 {formulaError.suggestion}</div>

                  {formulaError.fixes.length > 0 && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '6px', opacity: 0.8 }}>Suggested fixes:</div>
                      {formulaError.fixes.map((fix, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            if (selectedCell) {
                              handleCellInput(selectedCell.row, selectedCell.col, fix.newFormula);
                              setShowFormulaCoach(false);
                            }
                          }}
                          style={{
                            padding: '8px',
                            background: 'rgba(212, 160, 23, 0.15)',
                            border: '1px solid rgba(212, 160, 23, 0.3)',
                            borderRadius: '4px',
                            marginBottom: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(212, 160, 23, 0.25)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(212, 160, 23, 0.15)';
                          }}
                        >
                          <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>{fix.description}</div>
                          <div style={{ fontSize: '10px', fontFamily: 'monospace', opacity: 0.8 }}>{fix.newFormula}</div>
                          <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '2px' }}>Confidence: {Math.round(fix.confidence * 100)}%</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {formulaError.examples && formulaError.examples.length > 0 && (
                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '4px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, marginBottom: '4px', opacity: 0.8 }}>Examples:</div>
                      {formulaError.examples.map((example, index) => (
                        <div key={index} style={{ fontSize: '10px', fontFamily: 'monospace', opacity: 0.7, marginBottom: '2px' }}>• {example}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Grid Container */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ position: 'relative', minWidth: 'fit-content' }}>
              {/* Column Headers */}
              <div style={{ display: 'flex', position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', zIndex: 10 }}>
                <div style={{ width: '50px', minWidth: '50px', height: '28px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.05)' }}></div>
                {Array.from({ length: 26 }, (_, i) => (
                  <div key={i} style={{ width: '100px', minWidth: '100px', height: '28px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600 }}>
                    {colToLetter(i)}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {Array.from({ length: 100 }, (_, rowIndex) => (
                <div key={rowIndex} style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  {/* Row Number */}
                  <div style={{ width: '50px', minWidth: '50px', height: '28px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, background: 'rgba(255, 255, 255, 0.05)', position: 'sticky', left: 0, zIndex: 5 }}>
                    {rowIndex + 1}
                  </div>

                  {/* Cells */}
                  {Array.from({ length: 26 }, (_, colIndex) => {
                    const cell = getCell(rowIndex, colIndex);
                    const isSelected = isCellSelected(rowIndex, colIndex);
                    const isActive = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                    const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                    const isInTable = isCellInTable(rowIndex, colIndex);
                    const address = getCellAddress(rowIndex, colIndex);

                    return (
                      <div
                        key={colIndex}
                        style={{
                          width: '100px',
                          minWidth: '100px',
                          height: '28px',
                          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                          padding: '0',
                          position: 'relative',
                          background: isSelected ? 'rgba(212, 160, 23, 0.2)' :
                                     isInTable ? 'rgba(212, 160, 23, 0.05)' :
                                     cell.format?.backgroundColor || 'transparent',
                          border: isActive ? '2px solid rgba(212, 160, 23, 0.8)' : undefined,
                          cursor: 'cell'
                        }}
                        onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                        onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                        onMouseDown={(e) => handleMouseDown(rowIndex, colIndex, e)}
                        onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                      >
                        <input
                          ref={(el) => {
                            if (el) inputRefs.current.set(address, el);
                          }}
                          type="text"
                          value={isEditing ? (cell.formula || cell.value) : (cell.displayValue || cell.value)}
                          onChange={(e) => {
                            if (isEditing) {
                              handleCellInput(rowIndex, colIndex, e.target.value);
                            }
                          }}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setEditingCell(null);
                              setSelectedCell({ row: rowIndex + 1, col: colIndex });
                              setSelectionStart({ row: rowIndex + 1, col: colIndex });
                              setSelectionEnd({ row: rowIndex + 1, col: colIndex });
                            } else if (e.key === 'Tab') {
                              e.preventDefault();
                              setEditingCell(null);
                              const nextCol = colIndex + 1;
                              setSelectedCell({ row: rowIndex, col: nextCol });
                              setSelectionStart({ row: rowIndex, col: nextCol });
                              setSelectionEnd({ row: rowIndex, col: nextCol });
                            }
                          }}
                          readOnly={!isEditing}
                          style={{
                            width: '100%',
                            height: '100%',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#fff',
                            fontSize: '12px',
                            padding: '4px 8px',
                            fontWeight: cell.format?.bold ? 'bold' : 'normal',
                            fontStyle: cell.format?.italic ? 'italic' : 'normal',
                            textDecoration: cell.format?.underline ? 'underline' : 'none',
                            textAlign: cell.format?.alignment || 'left',
                            cursor: isEditing ? 'text' : 'cell'
                          }}
                        />

                        {/* Drag fill handle */}
                        {isActive && !isEditing && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: -3,
                              right: -3,
                              width: '8px',
                              height: '8px',
                              background: 'rgba(212, 160, 23, 1)',
                              cursor: 'crosshair',
                              zIndex: 10,
                              borderRadius: '1px'
                            }}
                            onMouseDown={(e) => handleDragFillStart(rowIndex, colIndex, e)}
                          ></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Status Bar */}
          <div style={{ height: '24px', background: 'rgba(255, 255, 255, 0.03)', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '11px', opacity: 0.7 }}>
            {selectedCell && `${getCellAddress(selectedCell.row, selectedCell.col)}`}
            {selectionStart && selectionEnd && (selectionStart.row !== selectionEnd.row || selectionStart.col !== selectionEnd.col) &&
              ` : ${getCellAddress(selectionStart.row, selectionStart.col)}:${getCellAddress(selectionEnd.row, selectionEnd.col)}`
            }
            {isTableMode && ' • Table Mode'}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER HOME VIEW
  // ============================================================================

  return (
    <div style={{ display: 'flex', height: '100%', background: 'rgba(14, 16, 22, 0.55)' }}>
      {/* Sidebar */}
      <div style={{ width: '200px', background: 'rgba(212, 160, 23, 0.12)', borderRight: '1px solid rgba(212, 160, 23, 0.25)', padding: '24px 0' }}>
        <div style={{ padding: '0 20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Accel</h3>
        </div>
        <nav>
          <button onClick={() => setSelectedSidebar('home')} style={{ width: '100%', padding: '12px 20px', background: selectedSidebar === 'home' ? 'rgba(212, 160, 23, 0.2)' : 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#fff', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px' }}>⌂</span> Home
          </button>
          <button onClick={() => { setView('spreadsheet'); setSelectedSidebar('new'); }} style={{ width: '100%', padding: '12px 20px', background: selectedSidebar === 'new' ? 'rgba(212, 160, 23, 0.2)' : 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#fff', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px' }}>+</span> New
          </button>
          <button style={{ width: '100%', padding: '12px 20px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#fff', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.6 }}>
            <span style={{ fontSize: '18px' }}>📂</span> Open
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        <h2 style={{ margin: '0 0 24px', fontSize: '28px', fontWeight: 600 }}>Good afternoon</h2>

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', opacity: 0.7 }}>Templates</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
            {accelTemplates.map((template) => (
              <div
                key={template.name}
                onClick={() => setView('spreadsheet')}
                className="card"
                style={{
                  padding: '20px 12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(212, 160, 23, 0.08)',
                  borderColor: 'rgba(212, 160, 23, 0.2)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                  <TemplateIcon type={template.type} />
                </div>
                <div style={{ fontSize: '11px', lineHeight: 1.3 }}>{template.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {featureSections.map((section) => (
            <div key={section.title} className="card" style={{ background: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.08)', padding: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>{section.title}</div>
              <div style={{ fontSize: '12px', opacity: 0.75, marginBottom: '10px' }}>{section.description}</div>
              <ul style={{ paddingLeft: '18px', margin: 0, display: 'grid', gap: '4px' }}>
                {section.bullets.map((bullet) => (
                  <li key={bullet} style={{ fontSize: '12px', opacity: 0.8 }}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', alignItems: 'stretch', marginBottom: '32px' }}>
          <div className="card" style={{ background: 'rgba(212, 160, 23, 0.08)', borderColor: 'rgba(212, 160, 23, 0.18)', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            {formulaCategories.map((category) => (
              <div key={category.title} style={{ background: 'rgba(0,0,0,0.15)', border: `1px solid ${category.accent}30`, borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{category.title}</div>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: category.accent, boxShadow: `0 0 0 5px ${category.accent}26` }} />
                </div>
                <div style={{ display: 'grid', gap: '6px' }}>
                  {category.entries.map((entry) => (
                    <div key={entry.name} style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700 }}>{entry.name}</div>
                      <div style={{ fontSize: '11px', opacity: 0.75 }}>{entry.detail}</div>
                      <div style={{ fontSize: '11px', opacity: 0.9, color: category.accent, marginTop: '4px', fontFamily: 'ui-monospace' }}>{entry.example}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ background: 'linear-gradient(160deg, rgba(212,160,23,0.22), rgba(124,140,255,0.12))', borderColor: 'rgba(255,255,255,0.16)', padding: '18px', display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Live workbook status</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Formulas, formatting, merge rules, and drag-fill gestures preserved.</div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(0,0,0,0.18)', display: 'grid', placeItems: 'center', fontWeight: 700 }}>fx</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              {workbookStats.map((stat) => (
                <div key={stat.label} style={{ padding: '10px', background: 'rgba(0,0,0,0.15)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '11px', opacity: 0.7 }}>{stat.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', opacity: 0.85 }}>{stat.hint}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px', background: 'rgba(0,0,0,0.18)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.12)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Workbook gestures encoded</div>
              <ul style={{ paddingLeft: '18px', margin: 0, display: 'grid', gap: '4px' }}>
                <li style={{ fontSize: '12px', opacity: 0.85 }}>Drag-to-fill series and flash fill patterns</li>
                <li style={{ fontSize: '12px', opacity: 0.85 }}>Merge cells horizontally/vertically with preserved formats</li>
                <li style={{ fontSize: '12px', opacity: 0.85 }}>Rich text editing, wrap, and alignment controls</li>
                <li style={{ fontSize: '12px', opacity: 0.85 }}>Cross-sheet references with dependency tracking</li>
              </ul>
            </div>
            <div style={{ padding: '10px', background: 'rgba(0,0,0,0.18)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.12)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Analysis & solver</div>
              <ul style={{ paddingLeft: '18px', margin: 0, display: 'grid', gap: '4px' }}>
                <li style={{ fontSize: '12px', opacity: 0.85 }}>Pivot tables with slicers, grouping, and field lists</li>
                <li style={{ fontSize: '12px', opacity: 0.85 }}>Goal Seek plus Solver constraints for optimization</li>
                <li style={{ fontSize: '12px', opacity: 0.85 }}>Scenario Manager for what-if comparisons</li>
                <li style={{ fontSize: '12px', opacity: 0.85 }}>Line, bar, combo charts and cell-level sparklines</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)', padding: '18px', display: 'grid', gap: '10px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700 }}>Accel vs Excel coverage</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {powerTools.map((tool) => (
              <div key={tool.name} style={{ padding: '10px', background: 'rgba(0,0,0,0.16)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700 }}>{tool.name}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>{tool.detail}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.75 }}>
            Accel preserves Excel-style text formatting, cell merging, column/row resizing, drag-fill gestures, data shaping, and Solver-style optimization primitives within the AngelOS environment.
          </div>
        </div>

        <div className="card" style={{ background: 'rgba(212,160,23,0.08)', borderColor: 'rgba(212,160,23,0.18)', padding: '18px', display: 'grid', gap: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700 }}>Where Accel goes beyond Excel</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {accelAhead.map((item) => (
              <div key={item.title} style={{ padding: '12px', background: 'rgba(0,0,0,0.14)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', display: 'grid', gap: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700 }}>{item.title}</div>
                <div style={{ fontSize: '12px', opacity: 0.85 }}>{item.detail}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            These next-gen capabilities focus on explainability, automation guardrails, richer visuals, and governance so Accel can surpass traditional spreadsheets while keeping Excel familiarity.
          </div>
        </div>
      </div>
    </div>
  );
}
