import { useState, useRef, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface CellData {
  value: string;
  formula?: string;
  displayValue?: string;
  format?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    alignment?: 'left' | 'center' | 'right';
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
  };
  mergedWith?: string; // Cell address it's merged with (e.g., "B2:C3")
  isMerged?: boolean; // If this cell is part of a merge
}

interface CellAddress {
  row: number;
  col: number;
}

// ============================================================================
// EXCEL FORMULA ENGINE
// ============================================================================

class FormulaEngine {
  cells: Map<string, CellData>;

  constructor(cells: Map<string, CellData>) {
    this.cells = cells;
  }

  // Convert column index to letter (0 -> A, 1 -> B, etc.)
  static colToLetter(col: number): string {
    let result = '';
    while (col >= 0) {
      result = String.fromCharCode(65 + (col % 26)) + result;
      col = Math.floor(col / 26) - 1;
    }
    return result;
  }

  // Convert letter to column index (A -> 0, B -> 1, etc.)
  static letterToCol(letter: string): number {
    let col = 0;
    for (let i = 0; i < letter.length; i++) {
      col = col * 26 + (letter.charCodeAt(i) - 64);
    }
    return col - 1;
  }

  // Get cell address as string (e.g., "A1")
  static getCellAddress(row: number, col: number): string {
    return `${this.colToLetter(col)}${row + 1}`;
  }

  // Parse cell address to row/col
  static parseCellAddress(address: string): CellAddress | null {
    const match = address.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    return {
      col: this.letterToCol(match[1]),
      row: parseInt(match[2]) - 1
    };
  }

  // Get cell value
  getCellValue(address: string): number | string {
    const cell = this.cells.get(address);
    if (!cell) return 0;

    if (cell.formula) {
      return this.evaluateFormula(cell.formula);
    }

    const num = parseFloat(cell.value);
    return isNaN(num) ? cell.value : num;
  }

  // Parse range (e.g., "A1:B5")
  parseRange(range: string): CellAddress[] {
    const [start, end] = range.split(':');
    const startAddr = FormulaEngine.parseCellAddress(start);
    const endAddr = FormulaEngine.parseCellAddress(end || start);

    if (!startAddr || !endAddr) return [];

    const cells: CellAddress[] = [];
    for (let row = startAddr.row; row <= endAddr.row; row++) {
      for (let col = startAddr.col; col <= endAddr.col; col++) {
        cells.push({ row, col });
      }
    }
    return cells;
  }

  // Get values from range
  getRangeValues(range: string): (number | string)[] {
    const addresses = this.parseRange(range);
    return addresses.map(addr => {
      const cellAddr = FormulaEngine.getCellAddress(addr.row, addr.col);
      return this.getCellValue(cellAddr);
    });
  }

  // Evaluate formula
  evaluateFormula(formula: string): number | string {
    try {
      // Remove leading =
      const expr = formula.startsWith('=') ? formula.substring(1) : formula;

      // Replace cell references with values
      let processedExpr = expr.replace(/([A-Z]+\d+):([A-Z]+\d+)/g, (match) => {
        return `RANGE("${match}")`;
      });

      processedExpr = processedExpr.replace(/([A-Z]+\d+)/g, (match) => {
        const value = this.getCellValue(match);
        return typeof value === 'number' ? value.toString() : `"${value}"`;
      });

      // Evaluate functions
      return this.evaluateFunctions(processedExpr);
    } catch (error) {
      return '#ERROR!';
    }
  }

  // Evaluate Excel functions
  evaluateFunctions(expr: string): number | string {
    // Math & Trig Functions
    expr = expr.replace(/SUM\(([^)]+)\)/g, (_, args) => {
      const values = this.parseArgs(args);
      return this.SUM(values).toString();
    });

    expr = expr.replace(/AVERAGE\(([^)]+)\)/g, (_, args) => {
      const values = this.parseArgs(args);
      return this.AVERAGE(values).toString();
    });

    expr = expr.replace(/COUNT\(([^)]+)\)/g, (_, args) => {
      const values = this.parseArgs(args);
      return this.COUNT(values).toString();
    });

    expr = expr.replace(/MAX\(([^)]+)\)/g, (_, args) => {
      const values = this.parseArgs(args);
      return this.MAX(values).toString();
    });

    expr = expr.replace(/MIN\(([^)]+)\)/g, (_, args) => {
      const values = this.parseArgs(args);
      return this.MIN(values).toString();
    });

    expr = expr.replace(/ROUND\(([^,]+),\s*(\d+)\)/g, (_, num, decimals) => {
      return this.ROUND(parseFloat(num), parseInt(decimals)).toString();
    });

    expr = expr.replace(/ABS\(([^)]+)\)/g, (_, num) => {
      return Math.abs(parseFloat(num)).toString();
    });

    expr = expr.replace(/SQRT\(([^)]+)\)/g, (_, num) => {
      return Math.sqrt(parseFloat(num)).toString();
    });

    expr = expr.replace(/POWER\(([^,]+),\s*([^)]+)\)/g, (_, base, exp) => {
      return Math.pow(parseFloat(base), parseFloat(exp)).toString();
    });

    // Logical Functions
    expr = expr.replace(/IF\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, (_, condition, trueVal, falseVal) => {
      const cond = this.evaluateCondition(condition);
      return cond ? trueVal : falseVal;
    });

    expr = expr.replace(/AND\(([^)]+)\)/g, (_, args) => {
      const conditions = args.split(',').map((c: string) => this.evaluateCondition(c.trim()));
      return conditions.every((c: boolean) => c).toString().toUpperCase();
    });

    expr = expr.replace(/OR\(([^)]+)\)/g, (_, args) => {
      const conditions = args.split(',').map((c: string) => this.evaluateCondition(c.trim()));
      return conditions.some((c: boolean) => c).toString().toUpperCase();
    });

    expr = expr.replace(/NOT\(([^)]+)\)/g, (_, condition) => {
      return (!this.evaluateCondition(condition)).toString().toUpperCase();
    });

    // Text Functions
    expr = expr.replace(/CONCATENATE\(([^)]+)\)/g, (_, args) => {
      const values = this.parseArgs(args);
      return `"${values.join('')}"`;
    });

    expr = expr.replace(/LEFT\("?([^,"]+)"?,\s*(\d+)\)/g, (_, text, count) => {
      const str = text.replace(/"/g, '');
      return `"${str.substring(0, parseInt(count))}"`;
    });

    expr = expr.replace(/RIGHT\("?([^,"]+)"?,\s*(\d+)\)/g, (_, text, count) => {
      const str = text.replace(/"/g, '');
      return `"${str.substring(str.length - parseInt(count))}"`;
    });

    expr = expr.replace(/LEN\("?([^)"]+)"?\)/g, (_, text) => {
      const str = text.replace(/"/g, '');
      return str.length.toString();
    });

    expr = expr.replace(/UPPER\("?([^)"]+)"?\)/g, (_, text) => {
      const str = text.replace(/"/g, '');
      return `"${str.toUpperCase()}"`;
    });

    expr = expr.replace(/LOWER\("?([^)"]+)"?\)/g, (_, text) => {
      const str = text.replace(/"/g, '');
      return `"${str.toLowerCase()}"`;
    });

    expr = expr.replace(/TRIM\("?([^)"]+)"?\)/g, (_, text) => {
      const str = text.replace(/"/g, '');
      return `"${str.trim()}"`;
    });

    // Date & Time Functions
    expr = expr.replace(/TODAY\(\)/g, () => {
      return `"${new Date().toLocaleDateString()}"`;
    });

    expr = expr.replace(/NOW\(\)/g, () => {
      return `"${new Date().toLocaleString()}"`;
    });

    expr = expr.replace(/YEAR\(\)/g, () => {
      return new Date().getFullYear().toString();
    });

    expr = expr.replace(/MONTH\(\)/g, () => {
      return (new Date().getMonth() + 1).toString();
    });

    expr = expr.replace(/DAY\(\)/g, () => {
      return new Date().getDate().toString();
    });

    // Statistical Functions
    expr = expr.replace(/MEDIAN\(([^)]+)\)/g, (_, args) => {
      const values = this.parseArgs(args);
      return this.MEDIAN(values).toString();
    });

    expr = expr.replace(/MODE\(([^)]+)\)/g, (_, args) => {
      const values = this.parseArgs(args);
      return this.MODE(values).toString();
    });

    expr = expr.replace(/STDEV\(([^)]+)\)/g, (_, args) => {
      const values = this.parseArgs(args);
      return this.STDEV(values).toString();
    });

    expr = expr.replace(/VAR\(([^)]+)\)/g, (_, args) => {
      const values = this.parseArgs(args);
      return this.VAR(values).toString();
    });

    // Financial Functions
    expr = expr.replace(/PMT\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, (_, rate, nper, pv) => {
      return this.PMT(parseFloat(rate), parseFloat(nper), parseFloat(pv)).toString();
    });

    expr = expr.replace(/FV\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, (_, rate, nper, pmt) => {
      return this.FV(parseFloat(rate), parseFloat(nper), parseFloat(pmt)).toString();
    });

    // Lookup Functions
    expr = expr.replace(/VLOOKUP\(([^,]+),\s*([^,]+),\s*([^,)]+)\)/g, (_, lookup, range, col) => {
      return this.VLOOKUP(lookup, range, parseInt(col)).toString();
    });

    // Handle RANGE function (internal)
    expr = expr.replace(/RANGE\("([^"]+)"\)/g, (_, range) => {
      const values = this.getRangeValues(range);
      return `[${values.join(',')}]`;
    });

    // Evaluate mathematical expressions
    try {
      // Remove quotes for final evaluation if it's a string
      if (expr.startsWith('"') && expr.endsWith('"')) {
        return expr.slice(1, -1);
      }

      // Safely evaluate mathematical expression
      const result = this.safeEval(expr);
      return result;
    } catch {
      return expr;
    }
  }

  // Parse function arguments
  parseArgs(args: string): any[] {
    if (args.startsWith('[') && args.endsWith(']')) {
      return args.slice(1, -1).split(',').map(v => parseFloat(v.trim()));
    }
    return args.split(',').map(arg => {
      const trimmed = arg.trim();
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return trimmed.slice(1, -1);
      }
      const num = parseFloat(trimmed);
      return isNaN(num) ? trimmed : num;
    });
  }

  // Safe eval for math expressions
  safeEval(expr: string): number {
    // Only allow numbers and basic operators
    const sanitized = expr.replace(/[^0-9+\-*/(). ]/g, '');
    return Function('"use strict"; return (' + sanitized + ')')();
  }

  // Evaluate condition for IF statements
  evaluateCondition(condition: string): boolean {
    try {
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
    } catch {
      return false;
    }
  }

  // ============================================================================
  // EXCEL FUNCTIONS IMPLEMENTATION
  // ============================================================================

  // Math & Trig Functions
  SUM(values: any[]): number {
    return values.reduce((sum, val) => {
      const num = typeof val === 'number' ? val : parseFloat(val);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }

  AVERAGE(values: any[]): number {
    const nums = values.filter(v => !isNaN(parseFloat(v)));
    return nums.length > 0 ? this.SUM(nums) / nums.length : 0;
  }

  COUNT(values: any[]): number {
    return values.filter(v => !isNaN(parseFloat(v))).length;
  }

  MAX(values: any[]): number {
    const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
    return nums.length > 0 ? Math.max(...nums) : 0;
  }

  MIN(values: any[]): number {
    const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
    return nums.length > 0 ? Math.min(...nums) : 0;
  }

  ROUND(num: number, decimals: number): number {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  // Statistical Functions
  MEDIAN(values: any[]): number {
    const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n)).sort((a, b) => a - b);
    if (nums.length === 0) return 0;
    const mid = Math.floor(nums.length / 2);
    return nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
  }

  MODE(values: any[]): number {
    const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
    const frequency: { [key: number]: number } = {};
    let maxFreq = 0;
    let mode = 0;

    nums.forEach(num => {
      frequency[num] = (frequency[num] || 0) + 1;
      if (frequency[num] > maxFreq) {
        maxFreq = frequency[num];
        mode = num;
      }
    });

    return mode;
  }

  STDEV(values: any[]): number {
    const avg = this.AVERAGE(values);
    const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
    const squareDiffs = nums.map(num => Math.pow(num - avg, 2));
    return Math.sqrt(this.SUM(squareDiffs) / nums.length);
  }

  VAR(values: any[]): number {
    const stdev = this.STDEV(values);
    return stdev * stdev;
  }

  // Financial Functions
  PMT(rate: number, nper: number, pv: number): number {
    if (rate === 0) return -pv / nper;
    return (rate * pv) / (1 - Math.pow(1 + rate, -nper));
  }

  FV(rate: number, nper: number, pmt: number): number {
    if (rate === 0) return -pmt * nper;
    return -pmt * (Math.pow(1 + rate, nper) - 1) / rate;
  }

  // Lookup Functions
  VLOOKUP(lookup: any, range: string, colIndex: number): any {
    const addresses = this.parseRange(range);
    const startCol = addresses[0].col;

    for (const addr of addresses) {
      if (addr.col === startCol) {
        const cellAddr = FormulaEngine.getCellAddress(addr.row, addr.col);
        const value = this.getCellValue(cellAddr);

        if (value === lookup) {
          const targetAddr = FormulaEngine.getCellAddress(addr.row, startCol + colIndex - 1);
          return this.getCellValue(targetAddr);
        }
      }
    }

    return '#N/A';
  }
}

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
  const [dragStart, setDragStart] = useState<CellAddress | null>(null);
  const [copiedRange, setCopiedRange] = useState<{ start: CellAddress; end: CellAddress } | null>(null);

  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Get cell data or create empty
  const getCell = (row: number, col: number): CellData => {
    const address = FormulaEngine.getCellAddress(row, col);
    return cells.get(address) || { value: '', displayValue: '' };
  };

  // Update cell data
  const updateCell = useCallback((row: number, col: number, data: Partial<CellData>) => {
    const address = FormulaEngine.getCellAddress(row, col);
    setCells(prev => {
      const newCells = new Map(prev);
      const existing = newCells.get(address) || { value: '', displayValue: '' };
      newCells.set(address, { ...existing, ...data });

      // Recalculate formulas
      const engine = new FormulaEngine(newCells);
      newCells.forEach((cell, addr) => {
        if (cell.formula) {
          const result = engine.evaluateFormula(cell.formula);
          cell.displayValue = result.toString();
        }
      });

      return newCells;
    });
  }, []);

  // Handle cell input
  const handleCellInput = (row: number, col: number, value: string) => {
    const isFormula = value.startsWith('=');

    if (isFormula) {
      const engine = new FormulaEngine(cells);
      const result = engine.evaluateFormula(value);
      updateCell(row, col, {
        value: value,
        formula: value,
        displayValue: result.toString()
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
      // Range selection
      setSelectionEnd({ row, col });
    } else {
      setSelectedCell({ row, col });
      setSelectionStart({ row, col });
      setSelectionEnd({ row, col });
      setEditingCell(null);

      const cell = getCell(row, col);
      setFormulaBarValue(cell.formula || cell.value);
    }
  };

  // Handle cell double-click for editing
  const handleCellDoubleClick = (row: number, col: number) => {
    setEditingCell({ row, col });
    const cell = getCell(row, col);

    // Focus the input
    setTimeout(() => {
      const address = FormulaEngine.getCellAddress(row, col);
      const input = inputRefs.current.get(address);
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  };

  // Handle mouse down for drag selection
  const handleMouseDown = (row: number, col: number, event: React.MouseEvent) => {
    if (event.button === 0) { // Left click
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
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  // Handle drag fill (auto-fill)
  const handleDragFillStart = (row: number, col: number) => {
    setDragStart({ row, col });
  };

  const handleDragFillEnd = (row: number, col: number) => {
    if (!dragStart) return;

    const startCell = getCell(dragStart.row, dragStart.col);

    // Auto-fill down
    if (row > dragStart.row && col === dragStart.col) {
      for (let r = dragStart.row + 1; r <= row; r++) {
        handleCellInput(r, col, startCell.value);
      }
    }

    // Auto-fill right
    if (col > dragStart.col && row === dragStart.row) {
      for (let c = dragStart.col + 1; c <= col; c++) {
        handleCellInput(row, c, startCell.value);
      }
    }

    setDragStart(null);
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        handlePaste();
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

          {/* Grid Container */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ position: 'relative', minWidth: 'fit-content' }}>
              {/* Column Headers */}
              <div style={{ display: 'flex', position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', zIndex: 10 }}>
                <div style={{ width: '50px', minWidth: '50px', height: '28px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.05)' }}></div>
                {Array.from({ length: 26 }, (_, i) => (
                  <div key={i} style={{ width: '100px', minWidth: '100px', height: '28px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600 }}>
                    {FormulaEngine.colToLetter(i)}
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
                    const address = FormulaEngine.getCellAddress(rowIndex, colIndex);

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
                          background: isSelected ? 'rgba(212, 160, 23, 0.2)' : 'transparent',
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
                          value={isEditing ? cell.value : (cell.displayValue || cell.value)}
                          onChange={(e) => {
                            if (isEditing) {
                              handleCellInput(rowIndex, colIndex, e.target.value);
                            }
                          }}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setEditingCell(null);
                              // Move to next row
                              setSelectedCell({ row: rowIndex + 1, col: colIndex });
                              setSelectionStart({ row: rowIndex + 1, col: colIndex });
                              setSelectionEnd({ row: rowIndex + 1, col: colIndex });
                            } else if (e.key === 'Tab') {
                              e.preventDefault();
                              setEditingCell(null);
                              // Move to next column
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
                              bottom: -2,
                              right: -2,
                              width: '6px',
                              height: '6px',
                              background: 'rgba(212, 160, 23, 1)',
                              cursor: 'crosshair',
                              zIndex: 10
                            }}
                            onMouseDown={() => handleDragFillStart(rowIndex, colIndex)}
                            onMouseUp={() => handleDragFillEnd(rowIndex, colIndex)}
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
            {selectedCell && `${FormulaEngine.getCellAddress(selectedCell.row, selectedCell.col)}`}
            {selectionStart && selectionEnd && (selectionStart.row !== selectionEnd.row || selectionStart.col !== selectionEnd.col) &&
              ` : ${FormulaEngine.getCellAddress(selectionStart.row, selectionStart.col)}:${FormulaEngine.getCellAddress(selectionEnd.row, selectionEnd.col)}`
            }
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
      </div>
    </div>
  );
}
