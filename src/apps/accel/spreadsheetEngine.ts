export type CellFormat = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  numberFormat?: 'general' | 'number' | 'currency' | 'percent';
};

export type SheetModel = {
  id: string;
  name: string;
  rowCount: number;
  colCount: number;
  frozenRows: number;
  frozenCols: number;
  grid: string[][];
  formats: Record<string, CellFormat>;
  columnWidths: number[];
  rowHeights: number[];
};

export type WorkbookModel = {
  version: 2;
  activeSheetId: string;
  sheets: SheetModel[];
};

export type Point = { row: number; col: number };

export const DEFAULT_ROWS = 300;
export const DEFAULT_COLS = 40;
export const DEFAULT_COL_WIDTH = 126;
export const DEFAULT_ROW_HEIGHT = 30;

export const toColumnLabel = (index: number) => {
  let label = '';
  let i = index;
  while (i >= 0) {
    label = String.fromCharCode((i % 26) + 65) + label;
    i = Math.floor(i / 26) - 1;
  }
  return label;
};

export const cellRef = (row: number, col: number) => `${toColumnLabel(col)}${row + 1}`;
export const cellKey = (row: number, col: number) => `${row},${col}`;

export const createEmptyGrid = (rowCount: number, colCount: number) =>
  Array.from({ length: rowCount }, () => Array.from({ length: colCount }, () => ''));

export const createSheet = (id: string, name: string): SheetModel => ({
  id,
  name,
  rowCount: DEFAULT_ROWS,
  colCount: DEFAULT_COLS,
  frozenRows: 1,
  frozenCols: 1,
  grid: createEmptyGrid(DEFAULT_ROWS, DEFAULT_COLS),
  formats: {},
  columnWidths: Array.from({ length: DEFAULT_COLS }, () => DEFAULT_COL_WIDTH),
  rowHeights: Array.from({ length: DEFAULT_ROWS }, () => DEFAULT_ROW_HEIGHT),
});

const parseLegacySheet = (content: string): WorkbookModel => {
  const rows = content.split('\n').map((line) => line.split('\t'));
  const rowCount = Math.max(DEFAULT_ROWS, rows.length + 20);
  const colCount = Math.max(DEFAULT_COLS, Math.max(...rows.map((r) => r.length), DEFAULT_COLS));
  const sheet: SheetModel = {
    ...createSheet('sheet-1', 'Sheet 1'),
    rowCount,
    colCount,
    grid: createEmptyGrid(rowCount, colCount),
    columnWidths: Array.from({ length: colCount }, () => DEFAULT_COL_WIDTH),
    rowHeights: Array.from({ length: rowCount }, () => DEFAULT_ROW_HEIGHT),
  };

  rows.forEach((row, r) => row.forEach((value, c) => {
    if (r < rowCount && c < colCount) sheet.grid[r][c] = value;
  }));

  return { version: 2, activeSheetId: sheet.id, sheets: [sheet] };
};

const coerceVersion1 = (payload: {
  activeSheetId: string;
  sheets: Array<{
    id: string;
    name: string;
    rowCount: number;
    colCount: number;
    grid: string[][];
    formats?: Record<string, CellFormat>;
    columnWidths?: number[];
  }>;
}): WorkbookModel => ({
  version: 2,
  activeSheetId: payload.activeSheetId,
  sheets: payload.sheets.map((sheet) => ({
    id: sheet.id,
    name: sheet.name,
    rowCount: sheet.rowCount,
    colCount: sheet.colCount,
    frozenRows: 1,
    frozenCols: 1,
    grid: sheet.grid,
    formats: sheet.formats ?? {},
    columnWidths: sheet.columnWidths ?? Array.from({ length: sheet.colCount }, () => DEFAULT_COL_WIDTH),
    rowHeights: Array.from({ length: sheet.rowCount }, () => DEFAULT_ROW_HEIGHT),
  })),
});

export const parseWorkbook = (content: string): WorkbookModel => {
  try {
    const parsed = JSON.parse(content) as WorkbookModel | { version: 1; activeSheetId: string; sheets: WorkbookModel['sheets'] };
    if ((parsed as WorkbookModel).version === 2 && Array.isArray((parsed as WorkbookModel).sheets)) {
      return parsed as WorkbookModel;
    }
    if ((parsed as { version: 1 }).version === 1 && Array.isArray((parsed as { version: 1; sheets: unknown[] }).sheets)) {
      return coerceVersion1(parsed as { version: 1; activeSheetId: string; sheets: WorkbookModel['sheets'] });
    }
  } catch {
    // fallback
  }
  return parseLegacySheet(content);
};

export const serializeWorkbook = (workbook: WorkbookModel) => JSON.stringify(workbook);

const parseCellReference = (token: string): Point | null => {
  const match = token.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  const [, letters, digits] = match;
  let col = 0;
  for (let i = 0; i < letters.length; i++) col = col * 26 + (letters.charCodeAt(i) - 64);
  return { row: Number(digits) - 1, col: col - 1 };
};

type ExprTokens = string[];

const tokenizeMath = (input: string): ExprTokens => input.match(/[A-Z]+\d+|\d+(?:\.\d+)?|[()+\-*/]/g) ?? [];

const safeArithmetic = (tokens: ExprTokens): number => {
  let pos = 0;

  const parseExpression = (): number => {
    let left = parseTerm();
    while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
      const op = tokens[pos++];
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  };

  const parseTerm = (): number => {
    let left = parseFactor();
    while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
      const op = tokens[pos++];
      const right = parseFactor();
      left = op === '*' ? left * right : right === 0 ? Number.NaN : left / right;
    }
    return left;
  };

  const parseFactor = (): number => {
    if (tokens[pos] === '(') {
      pos += 1;
      const value = parseExpression();
      if (tokens[pos] === ')') pos += 1;
      return value;
    }
    const num = Number(tokens[pos]);
    pos += 1;
    return Number.isFinite(num) ? num : Number.NaN;
  };

  return parseExpression();
};

const numericCell = (sheet: SheetModel, row: number, col: number, visited: Set<string>): number => {
  if (row < 0 || col < 0 || row >= sheet.rowCount || col >= sheet.colCount) return 0;
  const key = `${row}:${col}`;
  if (visited.has(key)) return 0;
  const raw = sheet.grid[row]?.[col] ?? '';
  if (!raw.startsWith('=')) {
    const direct = Number(raw);
    return Number.isFinite(direct) ? direct : 0;
  }
  visited.add(key);
  const value = evaluateFormula(raw, sheet, visited);
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const evaluateFormula = (raw: string, sheet: SheetModel, visited = new Set<string>()): string => {
  if (!raw.startsWith('=')) return raw;
  const source = raw.slice(1).trim().toUpperCase();

  const rangeFunction = source.match(/^(SUM|AVG|AVERAGE|MIN|MAX|COUNT)\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
  if (rangeFunction) {
    const [, fn, startToken, endToken] = rangeFunction;
    const start = parseCellReference(startToken);
    const end = parseCellReference(endToken);
    if (!start || !end) return '#ERR';
    const r1 = Math.min(start.row, end.row);
    const r2 = Math.max(start.row, end.row);
    const c1 = Math.min(start.col, end.col);
    const c2 = Math.max(start.col, end.col);
    const values: number[] = [];
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) values.push(numericCell(sheet, r, c, new Set(visited)));
    }
    if (fn === 'COUNT') return String(values.filter((v) => Number.isFinite(v)).length);
    if (!values.length) return '0';
    if (fn === 'SUM') return String(values.reduce((acc, v) => acc + v, 0));
    if (fn === 'AVG' || fn === 'AVERAGE') return String(values.reduce((acc, v) => acc + v, 0) / values.length);
    if (fn === 'MIN') return String(Math.min(...values));
    if (fn === 'MAX') return String(Math.max(...values));
  }

  const expression = tokenizeMath(source).map((token) => {
    if (/^[A-Z]+\d+$/.test(token)) {
      const ref = parseCellReference(token);
      return ref ? String(numericCell(sheet, ref.row, ref.col, new Set(visited))) : '0';
    }
    return token;
  });
  if (!expression.length) return '#ERR';
  const result = safeArithmetic(expression);
  return Number.isFinite(result) ? String(Math.round(result * 10000) / 10000) : '#ERR';
};

export const formatDisplayValue = (raw: string, sheet: SheetModel, format?: CellFormat) => {
  const resolved = raw.startsWith('=') ? evaluateFormula(raw, sheet) : raw;
  if (resolved === '#ERR') return resolved;
  const num = Number(resolved);
  if (!Number.isFinite(num) || !format?.numberFormat || format.numberFormat === 'general') return resolved;
  if (format.numberFormat === 'number') return num.toLocaleString();
  if (format.numberFormat === 'currency') return num.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  if (format.numberFormat === 'percent') return `${(num * 100).toFixed(2)}%`;
  return resolved;
};

export const clampPoint = (point: Point, sheet: SheetModel): Point => ({
  row: Math.max(0, Math.min(sheet.rowCount - 1, point.row)),
  col: Math.max(0, Math.min(sheet.colCount - 1, point.col)),
});

export const isInSelection = (cell: Point, start: Point | null, end: Point | null) => {
  if (!start || !end) return false;
  const r1 = Math.min(start.row, end.row);
  const r2 = Math.max(start.row, end.row);
  const c1 = Math.min(start.col, end.col);
  const c2 = Math.max(start.col, end.col);
  return cell.row >= r1 && cell.row <= r2 && cell.col >= c1 && cell.col <= c2;
};
