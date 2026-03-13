import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDriveStore } from '../../state/useDriveStore';

type ViewMode = 'home' | 'workbook';

type CellFormat = {
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  numberFormat?: 'general' | 'number' | 'currency' | 'percent';
};

type SheetModel = {
  id: string;
  name: string;
  rowCount: number;
  colCount: number;
  grid: string[][];
  formats: Record<string, CellFormat>;
  columnWidths: number[];
};

type WorkbookModel = {
  version: 1;
  activeSheetId: string;
  sheets: SheetModel[];
};

type Point = { row: number; col: number };

const DEFAULT_ROWS = 200;
const DEFAULT_COLS = 26;
const DEFAULT_COL_WIDTH = 120;
const MIN_COL_WIDTH = 76;
const ROW_HEIGHT = 30;
const OVERSCAN = 8;

const toColumnLabel = (index: number) => {
  let label = '';
  let i = index;
  while (i >= 0) {
    label = String.fromCharCode((i % 26) + 65) + label;
    i = Math.floor(i / 26) - 1;
  }
  return label;
};

const cellKey = (row: number, col: number) => `${row},${col}`;
const cellRef = (row: number, col: number) => `${toColumnLabel(col)}${row + 1}`;

const createEmptyGrid = (rowCount: number, colCount: number) =>
  Array.from({ length: rowCount }, () => Array.from({ length: colCount }, () => ''));

const parseLegacySheet = (content: string): WorkbookModel => {
  const rows = content.split('\n').map((line) => line.split('\t'));
  const rowCount = Math.max(DEFAULT_ROWS, rows.length + 20);
  const colCount = Math.max(DEFAULT_COLS, Math.max(...rows.map((r) => r.length), DEFAULT_COLS));
  const grid = createEmptyGrid(rowCount, colCount);
  rows.forEach((row, rIdx) => row.forEach((value, cIdx) => {
    if (rIdx < rowCount && cIdx < colCount) {
      grid[rIdx][cIdx] = value;
    }
  }));
  const firstSheet: SheetModel = {
    id: 'sheet-1',
    name: 'Sheet 1',
    rowCount,
    colCount,
    grid,
    formats: {},
    columnWidths: Array.from({ length: colCount }, () => DEFAULT_COL_WIDTH),
  };
  return { version: 1, activeSheetId: firstSheet.id, sheets: [firstSheet] };
};

const parseWorkbook = (content: string): WorkbookModel => {
  try {
    const parsed = JSON.parse(content) as WorkbookModel;
    if (parsed?.version === 1 && Array.isArray(parsed.sheets) && parsed.sheets.length > 0) {
      return parsed;
    }
  } catch {
    // legacy spreadsheet payload
  }
  return parseLegacySheet(content);
};

const serializeWorkbook = (workbook: WorkbookModel) => JSON.stringify(workbook);

const parseCellReference = (token: string): Point | null => {
  const match = token.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  const [, letters, digits] = match;
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return { row: Number(digits) - 1, col: col - 1 };
};

const getNumericCellValue = (sheet: SheetModel, row: number, col: number, visited = new Set<string>()): number => {
  if (row < 0 || row >= sheet.rowCount || col < 0 || col >= sheet.colCount) return 0;
  const key = `${row}:${col}`;
  if (visited.has(key)) return 0;
  const raw = sheet.grid[row]?.[col] ?? '';
  if (!raw.startsWith('=')) {
    const v = Number(raw);
    return Number.isFinite(v) ? v : 0;
  }
  visited.add(key);
  const computed = evaluateFormula(raw, sheet, visited);
  const numeric = Number(computed);
  return Number.isFinite(numeric) ? numeric : 0;
};

const evaluateFormula = (raw: string, sheet: SheetModel, visited = new Set<string>()): string => {
  if (!raw.startsWith('=')) return raw;
  const source = raw.slice(1).trim().toUpperCase();

  const rangeMatch = source.match(/^(SUM|AVG|AVERAGE|MIN|MAX|COUNT)\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
  if (rangeMatch) {
    const [, fnName, startToken, endToken] = rangeMatch;
    const start = parseCellReference(startToken);
    const end = parseCellReference(endToken);
    if (!start || !end) return '#ERR';

    const rStart = Math.min(start.row, end.row);
    const rEnd = Math.max(start.row, end.row);
    const cStart = Math.min(start.col, end.col);
    const cEnd = Math.max(start.col, end.col);

    const values: number[] = [];
    for (let r = rStart; r <= rEnd; r++) {
      for (let c = cStart; c <= cEnd; c++) {
        values.push(getNumericCellValue(sheet, r, c, new Set(visited)));
      }
    }

    if (fnName === 'COUNT') return String(values.filter((v) => Number.isFinite(v)).length);
    if (values.length === 0) return '0';
    if (fnName === 'SUM') return String(values.reduce((acc, v) => acc + v, 0));
    if (fnName === 'AVG' || fnName === 'AVERAGE') return String(values.reduce((acc, v) => acc + v, 0) / values.length);
    if (fnName === 'MIN') return String(Math.min(...values));
    if (fnName === 'MAX') return String(Math.max(...values));
  }

  const expr = source.replace(/([A-Z]+\d+)/g, (token) => {
    const ref = parseCellReference(token);
    if (!ref) return '0';
    return String(getNumericCellValue(sheet, ref.row, ref.col, new Set(visited)));
  });

  if (!/^[\d+\-*/().\s]+$/.test(expr)) return '#ERR';

  try {
    const result = Function(`"use strict"; return (${expr});`)();
    return Number.isFinite(result) ? String(result) : '#ERR';
  } catch {
    return '#ERR';
  }
};

const formatDisplayValue = (raw: string, sheet: SheetModel, format: CellFormat | undefined): string => {
  const resolved = raw.startsWith('=') ? evaluateFormula(raw, sheet) : raw;
  const num = Number(resolved);
  if (!Number.isFinite(num) || !format?.numberFormat || format.numberFormat === 'general') return resolved;
  if (format.numberFormat === 'number') return num.toLocaleString();
  if (format.numberFormat === 'currency') return num.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  if (format.numberFormat === 'percent') return `${(num * 100).toFixed(2)}%`;
  return resolved;
};

function WorkbookSurface({ docId, onClose }: { docId: string; onClose: () => void }) {
  const { documents, updateDocument } = useDriveStore();
  const doc = documents.find((item) => item.id === docId && item.type === 'spreadsheet') ?? null;
  const [workbook, setWorkbook] = useState<WorkbookModel>(() => parseWorkbook(doc?.content ?? ''));
  const [activeCell, setActiveCell] = useState<Point>({ row: 0, col: 0 });
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Point | null>(null);
  const [editingCell, setEditingCell] = useState<Point | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const gridWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!doc) return;
    setWorkbook(parseWorkbook(doc.content));
  }, [doc?.id]);

  const activeSheet = useMemo(
    () => workbook.sheets.find((sheet) => sheet.id === workbook.activeSheetId) ?? workbook.sheets[0],
    [workbook],
  );

  const saveWorkbook = useCallback((next: WorkbookModel) => {
    if (!doc) return;
    setWorkbook(next);
    updateDocument(doc.id, { content: serializeWorkbook(next) });
  }, [doc, updateDocument]);

  const updateActiveSheet = useCallback((mutator: (sheet: SheetModel) => SheetModel) => {
    const nextSheets = workbook.sheets.map((sheet) => (sheet.id === activeSheet.id ? mutator(sheet) : sheet));
    saveWorkbook({ ...workbook, sheets: nextSheets });
  }, [activeSheet.id, saveWorkbook, workbook]);

  const applyFormat = (update: Partial<CellFormat>) => {
    const anchor = selectionStart ?? activeCell;
    const focus = selectionEnd ?? activeCell;
    const r1 = Math.min(anchor.row, focus.row);
    const r2 = Math.max(anchor.row, focus.row);
    const c1 = Math.min(anchor.col, focus.col);
    const c2 = Math.max(anchor.col, focus.col);

    updateActiveSheet((sheet) => {
      const nextFormats = { ...sheet.formats };
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          const key = cellKey(r, c);
          nextFormats[key] = { ...nextFormats[key], ...update };
        }
      }
      return { ...sheet, formats: nextFormats };
    });
  };

  const updateCell = (row: number, col: number, value: string) => {
    updateActiveSheet((sheet) => {
      const nextGrid = sheet.grid.map((line) => [...line]);
      nextGrid[row][col] = value;
      return { ...sheet, grid: nextGrid };
    });
  };

  if (!doc || !activeSheet) return null;

  const selectedFormat = activeSheet.formats[cellKey(activeCell.row, activeCell.col)] ?? {};
  const viewportHeight = gridWrapRef.current?.clientHeight ?? 520;
  const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endRow = Math.min(activeSheet.rowCount - 1, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN);

  return (
    <div className="axl-premium-shell">
      <header className="axl-premium-titlebar">
        <button className="axl-icon-btn" type="button" onClick={onClose}>Back</button>
        <input
          className="axl-title-input"
          value={doc.title}
          onChange={(event) => updateDocument(doc.id, { title: event.target.value })}
        />
        <div className="axl-title-meta">Enterprise Workspace · Synced</div>
      </header>

      <section className="axl-command-ribbon">
        <div className="axl-ribbon-group">
          <button type="button" className={`axl-ribbon-btn${selectedFormat.bold ? ' is-active' : ''}`} onClick={() => applyFormat({ bold: !selectedFormat.bold })}>Bold</button>
          <button type="button" className={`axl-ribbon-btn${selectedFormat.italic ? ' is-active' : ''}`} onClick={() => applyFormat({ italic: !selectedFormat.italic })}>Italic</button>
          <button type="button" className={`axl-ribbon-btn${selectedFormat.align === 'left' ? ' is-active' : ''}`} onClick={() => applyFormat({ align: 'left' })}>Left</button>
          <button type="button" className={`axl-ribbon-btn${selectedFormat.align === 'center' ? ' is-active' : ''}`} onClick={() => applyFormat({ align: 'center' })}>Center</button>
          <button type="button" className={`axl-ribbon-btn${selectedFormat.align === 'right' ? ' is-active' : ''}`} onClick={() => applyFormat({ align: 'right' })}>Right</button>
        </div>
        <div className="axl-ribbon-group">
          <select
            className="axl-select"
            value={selectedFormat.numberFormat ?? 'general'}
            onChange={(event) => applyFormat({ numberFormat: event.target.value as CellFormat['numberFormat'] })}
          >
            <option value="general">General</option>
            <option value="number">Number</option>
            <option value="currency">Currency</option>
            <option value="percent">Percent</option>
          </select>
        </div>
      </section>

      <section className="axl-formula-region">
        <div className="axl-name-box">{cellRef(activeCell.row, activeCell.col)}</div>
        <div className="axl-fx-pill">fx</div>
        <input
          className="axl-formula-input-premium"
          value={activeSheet.grid[activeCell.row]?.[activeCell.col] ?? ''}
          onChange={(event) => updateCell(activeCell.row, activeCell.col, event.target.value)}
        />
      </section>

      <div className="axl-grid-container" ref={gridWrapRef} onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
        <table className="axl-grid-premium">
          <thead>
            <tr>
              <th className="axl-corner" />
              {Array.from({ length: activeSheet.colCount }, (_, col) => (
                <th key={col} className="axl-col-head" style={{ minWidth: activeSheet.columnWidths[col] }}>
                  {toColumnLabel(col)}
                  <div
                    className="axl-col-resizer"
                    onMouseDown={(event) => {
                      const startX = event.clientX;
                      const startW = activeSheet.columnWidths[col];
                      const onMove = (moveEvent: MouseEvent) => {
                        updateActiveSheet((sheet) => {
                          const nextWidths = [...sheet.columnWidths];
                          nextWidths[col] = Math.max(MIN_COL_WIDTH, startW + moveEvent.clientX - startX);
                          return { ...sheet, columnWidths: nextWidths };
                        });
                      };
                      const onUp = () => {
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                      };
                      window.addEventListener('mousemove', onMove);
                      window.addEventListener('mouseup', onUp);
                    }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: startRow }, (_, i) => (
              <tr key={`spacer-${i}`} style={{ display: 'none' }} />
            ))}
            {activeSheet.grid.slice(startRow, endRow + 1).map((row, relativeRow) => {
              const rowIndex = startRow + relativeRow;
              return (
                <tr key={rowIndex} style={{ height: ROW_HEIGHT }}>
                  <th className="axl-row-head">{rowIndex + 1}</th>
                  {row.map((rawValue, colIndex) => {
                    const selected = activeCell.row === rowIndex && activeCell.col === colIndex;
                    const fmt = activeSheet.formats[cellKey(rowIndex, colIndex)];
                    return (
                      <td
                        key={colIndex}
                        className={`axl-cell-premium${selected ? ' is-selected' : ''}`}
                        style={{
                          minWidth: activeSheet.columnWidths[colIndex],
                          fontWeight: fmt?.bold ? 650 : 450,
                          fontStyle: fmt?.italic ? 'italic' : 'normal',
                          textAlign: fmt?.align ?? 'left',
                        }}
                        onClick={() => {
                          setActiveCell({ row: rowIndex, col: colIndex });
                          setSelectionStart({ row: rowIndex, col: colIndex });
                          setSelectionEnd({ row: rowIndex, col: colIndex });
                        }}
                        onDoubleClick={() => setEditingCell({ row: rowIndex, col: colIndex })}
                        onMouseEnter={(event) => {
                          if (event.buttons === 1 && selectionStart) {
                            setSelectionEnd({ row: rowIndex, col: colIndex });
                          }
                        }}
                      >
                        {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                          <input
                            className="axl-inline-editor"
                            autoFocus
                            value={rawValue}
                            onChange={(event) => updateCell(rowIndex, colIndex, event.target.value)}
                            onBlur={() => setEditingCell(null)}
                          />
                        ) : (
                          formatDisplayValue(rawValue, activeSheet, fmt)
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="axl-sheet-footer">
        <div className="axl-tabs">
          {workbook.sheets.map((sheet) => (
            <button
              key={sheet.id}
              type="button"
              className={`axl-tab${workbook.activeSheetId === sheet.id ? ' is-active' : ''}`}
              onClick={() => saveWorkbook({ ...workbook, activeSheetId: sheet.id })}
            >
              {sheet.name}
            </button>
          ))}
          <button
            type="button"
            className="axl-tab-add"
            onClick={() => {
              const id = `sheet-${workbook.sheets.length + 1}`;
              const nextSheet: SheetModel = {
                id,
                name: `Sheet ${workbook.sheets.length + 1}`,
                rowCount: DEFAULT_ROWS,
                colCount: DEFAULT_COLS,
                grid: createEmptyGrid(DEFAULT_ROWS, DEFAULT_COLS),
                formats: {},
                columnWidths: Array.from({ length: DEFAULT_COLS }, () => DEFAULT_COL_WIDTH),
              };
              saveWorkbook({ ...workbook, sheets: [...workbook.sheets, nextSheet], activeSheetId: id });
            }}
          >
            New Sheet
          </button>
        </div>
        <div>{activeSheet.rowCount} rows × {activeSheet.colCount} columns</div>
      </footer>
    </div>
  );
}

export function AccelApp() {
  const { documents, activeDocumentId, setActiveDocument, createSpreadsheet } = useDriveStore();
  const spreadsheets = documents.filter((doc) => doc.type === 'spreadsheet');
  const [view, setView] = useState<ViewMode>('home');
  const [currentId, setCurrentId] = useState<string | null>(activeDocumentId ?? spreadsheets[0]?.id ?? null);

  useEffect(() => {
    if (activeDocumentId && spreadsheets.some((sheet) => sheet.id === activeDocumentId)) {
      setCurrentId(activeDocumentId);
      setView('workbook');
    }
  }, [activeDocumentId, spreadsheets]);

  if (view === 'workbook' && currentId) {
    return <WorkbookSurface docId={currentId} onClose={() => setView('home')} />;
  }

  return (
    <div className="axl-home-shell">
      <aside className="axl-home-nav">
        <div className="axl-brand-block">
          <div className="axl-brand-title">Accel Enterprise Grid</div>
          <p>Precision modeling workspace for analysis, forecasting, and operational planning.</p>
        </div>
        <button
          className="axl-primary-cta"
          type="button"
          onClick={() => {
            const id = createSpreadsheet('Untitled Enterprise Workbook');
            setCurrentId(id);
            setView('workbook');
          }}
        >
          Create Workbook
        </button>
      </aside>

      <main className="axl-home-canvas">
        <header>
          <h3>Workbook Hub</h3>
          <p>{spreadsheets.length} workbook records</p>
        </header>
        <div className="axl-home-grid-premium">
          {spreadsheets.map((sheet) => (
            <button
              key={sheet.id}
              type="button"
              className="axl-workbook-card"
              onClick={() => {
                setActiveDocument(sheet.id);
                setCurrentId(sheet.id);
                setView('workbook');
              }}
            >
              <div className="axl-workbook-preview" />
              <strong>{sheet.title}</strong>
              <span>{sheet.owner} · {new Date(sheet.updatedAt).toLocaleString()}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
