import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDriveStore } from '../../state/useDriveStore';

type ViewMode = 'home' | 'sheet';

const DEFAULT_ROWS = 50;
const DEFAULT_COLS = 16;
const MIN_COL_WIDTH = 80;

const toCol = (i: number) => {
  if (i < 26) return String.fromCharCode(65 + i);
  return String.fromCharCode(64 + Math.floor(i / 26)) + String.fromCharCode(65 + (i % 26));
};

const cellRef = (row: number, col: number) => `${toCol(col)}${row + 1}`;

function parseSheet(content: string): string[][] {
  const lines = content.split('\n').map((l) => l.split('\t'));
  return Array.from({ length: DEFAULT_ROWS }, (_, r) =>
    Array.from({ length: DEFAULT_COLS }, (_, c) => lines[r]?.[c] ?? ''),
  );
}

function serializeSheet(grid: string[][]): string {
  return grid.map((row) => row.join('\t')).join('\n');
}

// ── Safe arithmetic evaluator (replaces new Function()) ──────────────────────

function safeArith(expr: string): number {
  const tokens = expr.match(/[\d.]+|[+\-*/()]/g) ?? [];
  let pos = 0;
  const parseExpr = (): number => {
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
      left = op === '*' ? left * right : right !== 0 ? left / right : NaN;
    }
    return left;
  };
  const parseFactor = (): number => {
    if (tokens[pos] === '(') { pos++; const v = parseExpr(); pos++; return v; }
    return parseFloat(tokens[pos++] ?? 'NaN');
  };
  try { return parseExpr(); } catch { return NaN; }
}

// ── Formula evaluator (basic) ─────────────────────────────────────────────────

function evalFormula(formula: string, grid: string[][]): string {
  if (!formula.startsWith('=')) return formula;
  const expr = formula.slice(1).toUpperCase().trim();

  // Range helper: A1:B3 → array of values
  const parseRange = (range: string): number[] => {
    const m = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
    if (!m) return [];
    const [, c1, r1, c2, r2] = m;
    const col1 = c1.charCodeAt(0) - 65;
    const col2 = c2.charCodeAt(0) - 65;
    const row1 = parseInt(r1) - 1;
    const row2 = parseInt(r2) - 1;
    const vals: number[] = [];
    for (let r = row1; r <= row2; r++) {
      for (let c = col1; c <= col2; c++) {
        const v = parseFloat(grid[r]?.[c] ?? '');
        if (!isNaN(v)) vals.push(v);
      }
    }
    return vals;
  };

  // Single cell ref helper: A1 → value
  const parseCell = (ref: string): number => {
    const m = ref.match(/^([A-Z]+)(\d+)$/);
    if (!m) return NaN;
    const col = m[1].charCodeAt(0) - 65;
    const row = parseInt(m[2]) - 1;
    return parseFloat(grid[row]?.[col] ?? '') || 0;
  };

  try {
    // SUM
    const sumM = expr.match(/^SUM\(([^)]+)\)$/);
    if (sumM) {
      const vals = parseRange(sumM[1].trim());
      return String(vals.reduce((a, b) => a + b, 0));
    }
    // AVERAGE / AVG
    const avgM = expr.match(/^(AVERAGE|AVG)\(([^)]+)\)$/);
    if (avgM) {
      const vals = parseRange(avgM[2].trim());
      return vals.length ? String(vals.reduce((a, b) => a + b, 0) / vals.length) : '0';
    }
    // COUNT
    const cntM = expr.match(/^COUNT\(([^)]+)\)$/);
    if (cntM) return String(parseRange(cntM[1].trim()).length);
    // MAX
    const maxM = expr.match(/^MAX\(([^)]+)\)$/);
    if (maxM) return String(Math.max(...parseRange(maxM[1].trim())));
    // MIN
    const minM = expr.match(/^MIN\(([^)]+)\)$/);
    if (minM) return String(Math.min(...parseRange(minM[1].trim())));
    // IF
    const ifM = expr.match(/^IF\((.+),(.+),(.+)\)$/);
    if (ifM) {
      const cond = parseCell(ifM[1].trim());
      return cond ? ifM[2].trim() : ifM[3].trim();
    }
    // Simple arithmetic (replace cell refs with values, then evaluate safely)
    const arithExpr = expr.replace(/([A-Z]+\d+)/g, (ref) => String(parseCell(ref)));
    const result = safeArith(arithExpr);
    return !isNaN(result) ? String(Math.round(result * 1000) / 1000) : '#ERR';
  } catch {
    return '#ERR';
  }
}

// ── Cell type (bold, italic, align, color, bg) ────────────────────────────────

type CellFormat = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  color?: string;
  bg?: string;
  numFmt?: 'number' | 'currency' | 'percent' | 'text';
};

type SheetTab = { id: string; name: string };

// ── Workbook Sheet Component ──────────────────────────────────────────────────

function WorkbookSheet({
  sheetId, onBack,
}: { sheetId: string; onBack: () => void }) {
  const { documents, updateDocument } = useDriveStore();
  const doc = documents.find((d) => d.id === sheetId) ?? null;

  const [grid, setGrid] = useState<string[][]>(() => parseSheet(doc?.content ?? ''));
  const [formats, setFormats] = useState<Record<string, CellFormat>>({});
  const [selected, setSelected] = useState<{ row: number; col: number } | null>({ row: 0, col: 0 });
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [sheets, setSheets] = useState<SheetTab[]>([{ id: 'sheet1', name: 'Sheet1' }, { id: 'sheet2', name: 'Sheet2' }]);
  const [activeSheetTab, setActiveSheetTab] = useState('sheet1');
  const [colWidths, setColWidths] = useState<number[]>(Array(DEFAULT_COLS).fill(100));
  const [frozenCols, setFrozenCols] = useState(0);
  const [frozenRows, setFrozenRows] = useState(0);
  const [findQuery, setFindQuery] = useState('');
  const [showFind, setShowFind] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ row: number; col: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ row: number; col: number } | null>(null);
  const [colFilters, setColFilters] = useState<Record<number, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Keep grid synced to doc content when switching back
  useEffect(() => {
    if (doc) setGrid(parseSheet(doc.content));
  }, [doc?.id]);

  const save = useCallback((nextGrid: string[][]) => {
    if (!doc) return;
    updateDocument(doc.id, { content: serializeSheet(nextGrid) });
  }, [doc]);

  const displayValue = (row: number, col: number): string => {
    const raw = grid[row]?.[col] ?? '';
    if (raw.startsWith('=')) return evalFormula(raw, grid);
    return raw;
  };

  const selKey = (r: number, c: number) => `${r},${c}`;
  const fmt = (r: number, c: number): CellFormat => formats[selKey(r, c)] ?? {};

  const setFmt = (r: number, c: number, update: Partial<CellFormat>) => {
    setFormats((prev) => ({
      ...prev,
      [selKey(r, c)]: { ...prev[selKey(r, c)], ...update },
    }));
  };

  const applyFmtToSelected = (update: Partial<CellFormat>) => {
    if (!selected) return;
    const r1 = Math.min(selectionStart?.row ?? selected.row, selectionEnd?.row ?? selected.row);
    const r2 = Math.max(selectionStart?.row ?? selected.row, selectionEnd?.row ?? selected.row);
    const c1 = Math.min(selectionStart?.col ?? selected.col, selectionEnd?.col ?? selected.col);
    const c2 = Math.max(selectionStart?.col ?? selected.col, selectionEnd?.col ?? selected.col);
    const next = { ...formats };
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        next[selKey(r, c)] = { ...next[selKey(r, c)], ...update };
      }
    }
    setFormats(next);
  };

  const updateCell = (row: number, col: number, value: string) => {
    const next = grid.map((r) => [...r]);
    next[row][col] = value;
    setGrid(next);
    save(next);
  };

  const isInSelection = (r: number, c: number) => {
    if (!selectionStart || !selectionEnd) return false;
    const r1 = Math.min(selectionStart.row, selectionEnd.row);
    const r2 = Math.max(selectionStart.row, selectionEnd.row);
    const c1 = Math.min(selectionStart.col, selectionEnd.col);
    const c2 = Math.max(selectionStart.col, selectionEnd.col);
    return r >= r1 && r <= r2 && c >= c1 && c <= c2;
  };

  const stats = useMemo(() => {
    if (!selectionStart || !selectionEnd) {
      if (!selected) return null;
      const v = parseFloat(displayValue(selected.row, selected.col));
      if (isNaN(v)) return null;
      return { sum: v, avg: v, count: 1, min: v, max: v };
    }
    const r1 = Math.min(selectionStart.row, selectionEnd.row);
    const r2 = Math.max(selectionStart.row, selectionEnd.row);
    const c1 = Math.min(selectionStart.col, selectionEnd.col);
    const c2 = Math.max(selectionStart.col, selectionEnd.col);
    const vals: number[] = [];
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        const v = parseFloat(displayValue(r, c));
        if (!isNaN(v)) vals.push(v);
      }
    }
    if (vals.length === 0) return null;
    return {
      sum: vals.reduce((a, b) => a + b, 0),
      avg: vals.reduce((a, b) => a + b, 0) / vals.length,
      count: vals.length,
      min: Math.min(...vals),
      max: Math.max(...vals),
    };
  }, [selectionStart, selectionEnd, selected, grid]);

  const formatDisplay = (value: string, numFmt?: CellFormat['numFmt']): string => {
    const n = parseFloat(value);
    if (isNaN(n) || !numFmt || numFmt === 'text') return value;
    if (numFmt === 'currency') return `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    if (numFmt === 'percent') return `${(n * 100).toFixed(1)}%`;
    if (numFmt === 'number') return n.toLocaleString();
    return value;
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextCol = e.shiftKey ? Math.max(0, col - 1) : Math.min(DEFAULT_COLS - 1, col + 1);
      setSelected({ row, col: nextCol });
      setEditingCell(null);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setEditingCell(null);
      setSelected({ row: Math.min(DEFAULT_ROWS - 1, row + 1), col });
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    } else if (e.key === 'ArrowUp' && !editingCell) {
      e.preventDefault();
      setSelected({ row: Math.max(0, row - 1), col });
    } else if (e.key === 'ArrowDown' && !editingCell) {
      e.preventDefault();
      setSelected({ row: Math.min(DEFAULT_ROWS - 1, row + 1), col });
    } else if (e.key === 'ArrowLeft' && !editingCell) {
      e.preventDefault();
      setSelected({ row, col: Math.max(0, col - 1) });
    } else if (e.key === 'ArrowRight' && !editingCell) {
      e.preventDefault();
      setSelected({ row, col: Math.min(DEFAULT_COLS - 1, col + 1) });
    }
  };

  if (!doc) return null;

  const selRef = selected ? cellRef(selected.row, selected.col) : '';
  const selFmt = selected ? fmt(selected.row, selected.col) : {};

  return (
    <div className="axl-shell">
      {/* Title Bar */}
      <div className="axl-titlebar">
        <button type="button" className="axl-back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11 2L5 8l6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </button>
        <input
          className="axl-doc-title"
          value={doc.title}
          onChange={(e) => updateDocument(doc.id, { title: e.target.value })}
        />
        <div className="axl-titlebar-right">
          <span className="axl-saved-badge">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4.5" stroke="#4ade80" strokeWidth="1" />
              <path d="M3 5l1.5 1.5L7 3.5" stroke="#4ade80" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Synced to Sanctum
          </span>
          <button type="button" className="axl-share-btn">Share</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="axl-toolbar">
        {/* Format group */}
        <div className="axl-tb-group">
          <button type="button" className={`axl-tb-btn${selFmt.bold ? ' active' : ''}`} title="Bold" onClick={() => applyFmtToSelected({ bold: !selFmt.bold })}><strong>B</strong></button>
          <button type="button" className={`axl-tb-btn${selFmt.italic ? ' active' : ''}`} title="Italic" onClick={() => applyFmtToSelected({ italic: !selFmt.italic })}><em>I</em></button>
          <button type="button" className={`axl-tb-btn${selFmt.underline ? ' active' : ''}`} title="Underline" onClick={() => applyFmtToSelected({ underline: !selFmt.underline })}><u>U</u></button>
        </div>
        <div className="axl-tb-sep" />

        {/* Alignment */}
        <div className="axl-tb-group">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button key={a} type="button" className={`axl-tb-btn${selFmt.align === a ? ' active' : ''}`} title={`Align ${a}`} onClick={() => applyFmtToSelected({ align: a })}>
              {a === 'left' ? '⬅' : a === 'center' ? '↔' : '➡'}
            </button>
          ))}
        </div>
        <div className="axl-tb-sep" />

        {/* Number format */}
        <div className="axl-tb-group">
          <select className="axl-tb-select" value={selFmt.numFmt ?? 'text'} onChange={(e) => applyFmtToSelected({ numFmt: e.target.value as CellFormat['numFmt'] })}>
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="currency">$ Currency</option>
            <option value="percent">% Percent</option>
          </select>
        </div>
        <div className="axl-tb-sep" />

        {/* Cell colors */}
        <div className="axl-tb-group">
          <label className="axl-tb-label" title="Text Color">
            A
            <input type="color" style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
              onChange={(e) => applyFmtToSelected({ color: e.target.value })} />
          </label>
          <label className="axl-tb-label" title="Background Color" style={{ fontSize: 11 }}>
            🎨
            <input type="color" style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
              onChange={(e) => applyFmtToSelected({ bg: e.target.value })} />
          </label>
        </div>
        <div className="axl-tb-sep" />

        {/* Freeze */}
        <div className="axl-tb-group">
          <button type="button" className="axl-tb-btn" title="Freeze rows/cols" onClick={() => {
            setFrozenRows(selected?.row ?? 0);
            setFrozenCols(selected?.col ?? 0);
          }}>❄ Freeze</button>
          <button type="button" className="axl-tb-btn" onClick={() => { setFrozenRows(0); setFrozenCols(0); }}>Unfreeze</button>
        </div>
        <div className="axl-tb-sep" />

        {/* Utilities */}
        <div className="axl-tb-group">
          <button type="button" className="axl-tb-btn" title="Find (Ctrl+F)" onClick={() => setShowFind(true)}>🔍 Find</button>
          <button type="button" className="axl-tb-btn" title="Sort A→Z" onClick={() => {
            if (!selected) return;
            const col = selected.col;
            const next = [...grid];
            const dataRows = next.slice(frozenRows);
            dataRows.sort((a, b) => a[col].localeCompare(b[col]));
            const result = [...next.slice(0, frozenRows), ...dataRows];
            setGrid(result);
            save(result);
          }}>↑ Sort A→Z</button>
          <button type="button" className="axl-tb-btn" onClick={() => {
            if (!selected) return;
            const col = selected.col;
            const next = [...grid];
            const dataRows = next.slice(frozenRows);
            dataRows.sort((a, b) => b[col].localeCompare(a[col]));
            const result = [...next.slice(0, frozenRows), ...dataRows];
            setGrid(result);
            save(result);
          }}>↓ Sort Z→A</button>
        </div>
        <div className="axl-tb-sep" />

        {/* Add row/col */}
        <div className="axl-tb-group">
          <button type="button" className="axl-tb-btn" onClick={() => {
            const next = [...grid, Array(DEFAULT_COLS).fill('')];
            setGrid(next); save(next);
          }}>+ Row</button>
        </div>
      </div>

      {/* Find bar */}
      {showFind && (
        <div className="axl-findbar">
          <input
            className="axl-find-input"
            placeholder="Find in sheet..."
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            autoFocus
          />
          <button type="button" className="axl-tb-btn" onClick={() => setShowFind(false)}>✕</button>
        </div>
      )}

      {/* Formula Bar */}
      <div className="axl-formula-bar">
        <div className="axl-cell-ref">{selRef}</div>
        <div className="axl-formula-sep" />
        <span className="axl-fx-label">fx</span>
        <input
          ref={inputRef}
          className="axl-formula-input"
          value={selected ? (grid[selected.row]?.[selected.col] ?? '') : ''}
          onChange={(e) => {
            if (!selected) return;
            const next = grid.map((r) => [...r]);
            next[selected.row][selected.col] = e.target.value;
            setGrid(next);
          }}
          onBlur={() => { if (selected) save(grid); }}
          placeholder="Enter value or formula (=SUM, =AVG, =COUNT, =IF...)"
        />
      </div>

      {/* Grid */}
      <div
        className="axl-grid-wrap"
        ref={gridRef}
        onScroll={(e) => setScrollTop((e.currentTarget as HTMLDivElement).scrollTop)}
      >
        {(() => {
          const ROW_HEIGHT = 28;
          const OVERSCAN = 3;
          const viewportH = gridRef.current?.clientHeight ?? 480;
          const visStart = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
          const visEnd = Math.min(grid.length - 1, Math.ceil((scrollTop + viewportH) / ROW_HEIGHT) + OVERSCAN);
          const topSpacer = visStart * ROW_HEIGHT;
          const bottomSpacer = Math.max(0, (grid.length - visEnd - 1) * ROW_HEIGHT);

          return (
            <table className="axl-grid">
              <thead>
                <tr>
                  <th className="axl-corner-cell" />
                  {Array.from({ length: DEFAULT_COLS }, (_, c) => (
                    <th
                      key={c}
                      className={`axl-col-header${c < frozenCols ? ' frozen-col' : ''}`}
                      style={{ minWidth: colWidths[c], position: 'relative' }}
                    >
                      {toCol(c)}
                      <div
                        className="axl-col-resize"
                        onMouseDown={(e) => {
                          const startX = e.clientX;
                          const startW = colWidths[c];
                          const onMove = (ev: MouseEvent) => {
                            setColWidths((prev) => {
                              const next = [...prev];
                              next[c] = Math.max(MIN_COL_WIDTH, startW + ev.clientX - startX);
                              return next;
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
                {topSpacer > 0 && (
                  <tr><td colSpan={DEFAULT_COLS + 1} style={{ height: topSpacer, padding: 0, border: 'none' }} /></tr>
                )}
                {grid.slice(visStart, visEnd + 1).map((row, relIdx) => {
                  const rowIdx = visStart + relIdx;
                  if (Object.keys(colFilters).length > 0) {
                    const hidden = Object.entries(colFilters).some(
                      ([c, q]) => q && !row[parseInt(c)]?.toLowerCase().includes(q.toLowerCase())
                    );
                    if (hidden) return null;
                  }
                  return (
                    <tr key={rowIdx} className={rowIdx < frozenRows ? 'frozen-row' : ''}>
                      <th className="axl-row-header">{rowIdx + 1}</th>
                      {row.map((rawVal, colIdx) => {
                        const isSelected = selected?.row === rowIdx && selected?.col === colIdx;
                        const inSel = isInSelection(rowIdx, colIdx);
                        const isEditing = editingCell?.row === rowIdx && editingCell?.col === colIdx;
                        const cellFmt = fmt(rowIdx, colIdx);
                        const displayed = formatDisplay(displayValue(rowIdx, colIdx), cellFmt.numFmt);
                        const highlight = findQuery && displayed.toLowerCase().includes(findQuery.toLowerCase());

                        return (
                          <td
                            key={colIdx}
                            className={`axl-cell${isSelected ? ' selected' : ''}${inSel ? ' in-selection' : ''}${highlight ? ' found' : ''}${colIdx < frozenCols ? ' frozen-col' : ''}`}
                            style={{
                              fontWeight: cellFmt.bold ? 'bold' : undefined,
                              fontStyle: cellFmt.italic ? 'italic' : undefined,
                              textDecoration: cellFmt.underline ? 'underline' : undefined,
                              textAlign: cellFmt.align ?? 'left',
                              color: cellFmt.color,
                              background: cellFmt.bg,
                              minWidth: colWidths[colIdx],
                            }}
                            onClick={() => {
                              setSelected({ row: rowIdx, col: colIdx });
                              setSelectionStart({ row: rowIdx, col: colIdx });
                              setSelectionEnd({ row: rowIdx, col: colIdx });
                            }}
                            onMouseEnter={(e) => {
                              if (e.buttons === 1 && selectionStart) {
                                setSelectionEnd({ row: rowIdx, col: colIdx });
                              }
                            }}
                            onDoubleClick={() => setEditingCell({ row: rowIdx, col: colIdx })}
                            onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                            tabIndex={0}
                          >
                            {isEditing ? (
                              <input
                                className="axl-cell-input"
                                autoFocus
                                value={rawVal}
                                onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                                onBlur={() => setEditingCell(null)}
                                onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                              />
                            ) : (
                              displayed
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {bottomSpacer > 0 && (
                  <tr><td colSpan={DEFAULT_COLS + 1} style={{ height: bottomSpacer, padding: 0, border: 'none' }} /></tr>
                )}
              </tbody>
            </table>
          );
        })()}
      </div>

      {/* Sheet Tabs */}
      <div className="axl-sheet-tabs">
        {sheets.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`axl-sheet-tab${activeSheetTab === s.id ? ' active' : ''}`}
            onClick={() => setActiveSheetTab(s.id)}
            onDoubleClick={() => {
              const newName = prompt('Rename sheet:', s.name);
              if (newName) setSheets((prev) => prev.map((sh) => sh.id === s.id ? { ...sh, name: newName } : sh));
            }}
          >
            {s.name}
          </button>
        ))}
        <button
          type="button"
          className="axl-sheet-add"
          onClick={() => {
            const id = `sheet${sheets.length + 1}`;
            setSheets((prev) => [...prev, { id, name: `Sheet${sheets.length + 1}` }]);
            setActiveSheetTab(id);
          }}
        >
          +
        </button>
      </div>

      {/* Status Bar */}
      <div className="axl-statusbar">
        <span>
          {selected ? `${cellRef(selected.row, selected.col)} selected` : 'Ready'}
          {frozenRows > 0 || frozenCols > 0 ? ` · ❄ Frozen ${frozenRows}R×${frozenCols}C` : ''}
        </span>
        {stats && (
          <span className="axl-stats">
            <span>Sum: <strong>{stats.sum.toLocaleString(undefined, { maximumFractionDigits: 4 })}</strong></span>
            <span>Avg: <strong>{stats.avg.toFixed(2)}</strong></span>
            <span>Count: <strong>{stats.count}</strong></span>
            <span>Min: <strong>{stats.min}</strong></span>
            <span>Max: <strong>{stats.max}</strong></span>
          </span>
        )}
        <span>{DEFAULT_ROWS} rows × {DEFAULT_COLS} cols</span>
      </div>
    </div>
  );
}

// ── Home View ─────────────────────────────────────────────────────────────────

export function AccelApp() {
  const { documents, activeDocumentId, setActiveDocument, createSpreadsheet } = useDriveStore();
  const sheets = documents.filter((d) => d.type === 'spreadsheet');
  const [view, setView] = useState<ViewMode>('home');
  const [activeId, setActiveId] = useState<string | null>(activeDocumentId ?? sheets[0]?.id ?? null);

  useEffect(() => {
    if (!activeDocumentId) return;
    const exists = sheets.some((d) => d.id === activeDocumentId);
    if (exists) { setActiveId(activeDocumentId); setView('sheet'); }
  }, [activeDocumentId]);

  const createWorkbook = () => {
    const id = createSpreadsheet('Untitled Workbook');
    setActiveId(id);
    setView('sheet');
  };

  const openWorkbook = (id: string) => {
    setActiveDocument(id);
    setActiveId(id);
    setView('sheet');
  };

  if (view === 'sheet' && activeId) {
    return <WorkbookSheet sheetId={activeId} onBack={() => setView('home')} />;
  }

  const TEMPLATES = [
    { label: 'Budget Tracker', icon: '💰', desc: 'Income & expense tracking' },
    { label: 'Research Data', icon: '🔬', desc: 'Variables, observations, stats' },
    { label: 'Project Timeline', icon: '📅', desc: 'Gantt-style planning' },
    { label: 'Survey Results', icon: '📊', desc: 'Response tabulation' },
  ];

  return (
    <div className="accel-shell">
      <aside className="accel-sidebar">
        <div className="axl-brand">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect width="20" height="20" rx="4" fill="#217346" />
            <rect x="3" y="5" width="14" height="1.8" rx="0.5" fill="white" opacity="0.9" />
            <rect x="3" y="9" width="14" height="1.8" rx="0.5" fill="white" opacity="0.7" />
            <rect x="3" y="13" width="9" height="1.8" rx="0.5" fill="white" opacity="0.7" />
            <rect x="9.5" y="3" width="1.5" height="14" rx="0.5" fill="white" opacity="0.25" />
          </svg>
          <span className="axl-brand-name">Accel</span>
        </div>

        <button type="button" className="accel-primary" onClick={createWorkbook}>
          + New Workbook
        </button>

        <div className="axl-sidebar-section">Templates</div>
        {TEMPLATES.map((t) => (
          <button key={t.label} type="button" className="axl-template-item" onClick={createWorkbook}>
            <span>{t.icon}</span>
            <div>
              <div className="axl-template-name">{t.label}</div>
              <div className="axl-template-desc">{t.desc}</div>
            </div>
          </button>
        ))}

        <div className="axl-sidebar-section" style={{ marginTop: 8 }}>Capabilities</div>
        <div className="axl-capability-list">
          {['=SUM, =AVG, =COUNT', '=MIN, =MAX, =IF', 'Cell formatting', 'Sort & filter', 'Freeze panes', 'Multi-sheet tabs', 'Selection stats', 'Find in sheet'].map((c) => (
            <div key={c} className="axl-capability">✓ {c}</div>
          ))}
        </div>
      </aside>

      <section className="accel-home">
        <header className="accel-home-header">
          <div>
            <h3>Recent Workbooks</h3>
            <p>{sheets.length} workbook{sheets.length !== 1 ? 's' : ''}</p>
          </div>
        </header>

        {sheets.length === 0 ? (
          <div className="axl-empty">
            <div style={{ fontSize: 40 }}>📊</div>
            <div>No workbooks yet</div>
            <div style={{ fontSize: 12, color: '#8899b8', marginTop: 4 }}>Create a new workbook to get started.</div>
          </div>
        ) : (
          <div className="accel-home-grid">
            {sheets.map((sheet) => (
              <button key={sheet.id} type="button" className="accel-file-card" onClick={() => openWorkbook(sheet.id)}>
                <div className="axl-card-thumb">
                  <div className="axl-card-grid-preview">
                    {[...Array(4)].map((_, r) => (
                      <div key={r} className="axl-card-row">
                        {[...Array(5)].map((_, c) => (
                          <div key={c} className="axl-card-cell" />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="axl-card-meta">
                  <strong>{sheet.title}</strong>
                  <span>{sheet.owner} · {new Date(sheet.updatedAt).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
