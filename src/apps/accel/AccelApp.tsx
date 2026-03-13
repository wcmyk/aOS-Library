import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useDriveStore } from '../../state/useDriveStore';
import {
  cellKey,
  cellRef,
  clampPoint,
  createSheet,
  DEFAULT_COLS,
  DEFAULT_COL_WIDTH,
  DEFAULT_ROWS,
  evaluateFormula,
  formatDisplayValue,
  isInSelection,
  parseWorkbook,
  serializeWorkbook,
  toColumnLabel,
  type Point,
  type SheetModel,
  type WorkbookModel,
  type CellFormat,
} from './spreadsheetEngine';

type ViewMode = 'home' | 'workbook';

type MenuState = {
  x: number;
  y: number;
  row: number;
  col: number;
} | null;

const ROW_OVERSCAN = 8;
const COL_OVERSCAN = 4;
const MIN_COL_WIDTH = 84;
const MIN_ROW_HEIGHT = 24;

function WorkbookSurface({ docId, onClose }: { docId: string; onClose: () => void }) {
  const { documents, updateDocument } = useDriveStore();
  const doc = documents.find((item) => item.id === docId && item.type === 'spreadsheet') ?? null;

  const [workbook, setWorkbook] = useState<WorkbookModel>(() => parseWorkbook(doc?.content ?? ''));
  const [history, setHistory] = useState<WorkbookModel[]>([]);
  const [future, setFuture] = useState<WorkbookModel[]>([]);
  const [activeCell, setActiveCell] = useState<Point>({ row: 1, col: 1 });
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Point | null>(null);
  const [editingCell, setEditingCell] = useState<Point | null>(null);
  const [menu, setMenu] = useState<MenuState>(null);
  const [scroll, setScroll] = useState({ top: 0, left: 0 });
  const [panelOpen, setPanelOpen] = useState(true);
  const [internalClipboard, setInternalClipboard] = useState('');
  const gridWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!doc) return;
    const parsed = parseWorkbook(doc.content);
    setWorkbook(parsed);
    setHistory([]);
    setFuture([]);
  }, [doc?.id]);

  useEffect(() => {
    const onGlobalClick = () => setMenu(null);
    window.addEventListener('click', onGlobalClick);
    return () => window.removeEventListener('click', onGlobalClick);
  }, []);

  const activeSheet = useMemo(
    () => workbook.sheets.find((sheet) => sheet.id === workbook.activeSheetId) ?? workbook.sheets[0],
    [workbook],
  );

  const commitWorkbook = (next: WorkbookModel, withHistory = true) => {
    if (!doc) return;
    if (withHistory) {
      setHistory((prev) => [...prev.slice(-49), workbook]);
      setFuture([]);
    }
    setWorkbook(next);
    updateDocument(doc.id, { content: serializeWorkbook(next) });
  };

  const updateActiveSheet = (mutator: (sheet: SheetModel) => SheetModel, withHistory = true) => {
    const nextSheets = workbook.sheets.map((sheet) => (sheet.id === activeSheet.id ? mutator(sheet) : sheet));
    commitWorkbook({ ...workbook, sheets: nextSheets }, withHistory);
  };

  const currentRaw = activeSheet.grid[activeCell.row]?.[activeCell.col] ?? '';
  const currentFormat = activeSheet.formats[cellKey(activeCell.row, activeCell.col)] ?? {};

  const applyFormat = (update: Partial<CellFormat>) => {
    const anchor = selectionStart ?? activeCell;
    const focus = selectionEnd ?? activeCell;
    const r1 = Math.min(anchor.row, focus.row);
    const r2 = Math.max(anchor.row, focus.row);
    const c1 = Math.min(anchor.col, focus.col);
    const c2 = Math.max(anchor.col, focus.col);

    updateActiveSheet((sheet) => {
      const formats = { ...sheet.formats };
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          const key = cellKey(r, c);
          formats[key] = { ...formats[key], ...update };
        }
      }
      return { ...sheet, formats };
    });
  };

  const writeCell = (row: number, col: number, value: string, withHistory = true) => {
    updateActiveSheet((sheet) => {
      const grid = sheet.grid.map((line) => [...line]);
      grid[row][col] = value;
      return { ...sheet, grid };
    }, withHistory);
  };

  const writeSelection = (value: string) => {
    const anchor = selectionStart ?? activeCell;
    const focus = selectionEnd ?? activeCell;
    const r1 = Math.min(anchor.row, focus.row);
    const r2 = Math.max(anchor.row, focus.row);
    const c1 = Math.min(anchor.col, focus.col);
    const c2 = Math.max(anchor.col, focus.col);
    updateActiveSheet((sheet) => {
      const grid = sheet.grid.map((line) => [...line]);
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) grid[r][c] = value;
      }
      return { ...sheet, grid };
    });
  };

  const copySelection = async (cut = false) => {
    const anchor = selectionStart ?? activeCell;
    const focus = selectionEnd ?? activeCell;
    const r1 = Math.min(anchor.row, focus.row);
    const r2 = Math.max(anchor.row, focus.row);
    const c1 = Math.min(anchor.col, focus.col);
    const c2 = Math.max(anchor.col, focus.col);

    const text = Array.from({ length: r2 - r1 + 1 }, (_, rOff) =>
      Array.from({ length: c2 - c1 + 1 }, (_, cOff) => activeSheet.grid[r1 + rOff][c1 + cOff] ?? '').join('\t'),
    ).join('\n');

    setInternalClipboard(text);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback to in-memory clipboard
    }

    if (cut) writeSelection('');
  };

  const pasteSelection = async () => {
    let text = internalClipboard;
    try {
      text = await navigator.clipboard.readText();
    } catch {
      // keep internal clipboard
    }
    if (!text) return;

    const rows = text.split('\n').map((line) => line.split('\t'));
    updateActiveSheet((sheet) => {
      const grid = sheet.grid.map((line) => [...line]);
      rows.forEach((row, rOff) => row.forEach((value, cOff) => {
        const r = activeCell.row + rOff;
        const c = activeCell.col + cOff;
        if (r < sheet.rowCount && c < sheet.colCount) grid[r][c] = value;
      }));
      return { ...sheet, grid };
    });
  };

  const sortSelectedColumn = (descending = false) => {
    const col = activeCell.col;
    updateActiveSheet((sheet) => {
      const grid = sheet.grid.map((line) => [...line]);
      const headRows = grid.slice(0, sheet.frozenRows);
      const bodyRows = grid.slice(sheet.frozenRows);
      bodyRows.sort((a, b) => (descending ? b[col].localeCompare(a[col]) : a[col].localeCompare(b[col])));
      return { ...sheet, grid: [...headRows, ...bodyRows] };
    });
  };

  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous || !doc) return;
    setHistory((prev) => prev.slice(0, -1));
    setFuture((prev) => [workbook, ...prev.slice(0, 49)]);
    setWorkbook(previous);
    updateDocument(doc.id, { content: serializeWorkbook(previous) });
  };

  const redo = () => {
    const next = future[0];
    if (!next || !doc) return;
    setFuture((prev) => prev.slice(1));
    setHistory((prev) => [...prev.slice(-49), workbook]);
    setWorkbook(next);
    updateDocument(doc.id, { content: serializeWorkbook(next) });
  };

  const onGridKeyDown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) redo(); else undo();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      copySelection(false);
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'x') {
      event.preventDefault();
      copySelection(true);
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
      event.preventDefault();
      pasteSelection();
      return;
    }

    if (editingCell) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      setEditingCell(activeCell);
      return;
    }

    if (event.key === 'Tab' || event.key.startsWith('Arrow')) {
      event.preventDefault();
      const next = { ...activeCell };
      if (event.key === 'Tab') next.col += event.shiftKey ? -1 : 1;
      if (event.key === 'ArrowUp') next.row -= 1;
      if (event.key === 'ArrowDown') next.row += 1;
      if (event.key === 'ArrowLeft') next.col -= 1;
      if (event.key === 'ArrowRight') next.col += 1;
      const clamped = clampPoint(next, activeSheet);
      setActiveCell(clamped);
      if (event.shiftKey) {
        if (!selectionStart) setSelectionStart(activeCell);
        setSelectionEnd(clamped);
      } else {
        setSelectionStart(clamped);
        setSelectionEnd(clamped);
      }
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      writeSelection('');
      return;
    }

    if (event.key.length === 1 && !event.altKey && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      writeCell(activeCell.row, activeCell.col, event.key);
      setEditingCell(activeCell);
    }
  };

  const viewportHeight = gridWrapRef.current?.clientHeight ?? 480;
  const viewportWidth = gridWrapRef.current?.clientWidth ?? 1100;

  const rowPrefix = useMemo(() => {
    const prefix = [0];
    for (let i = 0; i < activeSheet.rowCount; i++) prefix.push(prefix[i] + (activeSheet.rowHeights[i] ?? 30));
    return prefix;
  }, [activeSheet.rowHeights, activeSheet.rowCount]);

  const colPrefix = useMemo(() => {
    const prefix = [0];
    for (let i = 0; i < activeSheet.colCount; i++) prefix.push(prefix[i] + (activeSheet.columnWidths[i] ?? DEFAULT_COL_WIDTH));
    return prefix;
  }, [activeSheet.columnWidths, activeSheet.colCount]);

  const findIndexByOffset = (prefix: number[], offset: number) => {
    let low = 0;
    let high = prefix.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (prefix[mid] <= offset) low = mid + 1;
      else high = mid;
    }
    return Math.max(0, low - 1);
  };

  const startRow = Math.max(activeSheet.frozenRows, findIndexByOffset(rowPrefix, scroll.top) - ROW_OVERSCAN);
  const endRow = Math.min(activeSheet.rowCount - 1, findIndexByOffset(rowPrefix, scroll.top + viewportHeight) + ROW_OVERSCAN);
  const startCol = Math.max(activeSheet.frozenCols, findIndexByOffset(colPrefix, scroll.left) - COL_OVERSCAN);
  const endCol = Math.min(activeSheet.colCount - 1, findIndexByOffset(colPrefix, scroll.left + viewportWidth) + COL_OVERSCAN);

  const visibleRows = Array.from({ length: Math.max(0, endRow - startRow + 1) }, (_, idx) => idx + startRow);
  const visibleCols = Array.from({ length: Math.max(0, endCol - startCol + 1) }, (_, idx) => idx + startCol);
  const frozenRows = Array.from({ length: activeSheet.frozenRows }, (_, i) => i);
  const frozenCols = Array.from({ length: activeSheet.frozenCols }, (_, i) => i);

  const allCols = [...frozenCols, ...visibleCols.filter((c) => c >= activeSheet.frozenCols)];
  const allRows = [...frozenRows, ...visibleRows.filter((r) => r >= activeSheet.frozenRows)];

  if (!doc || !activeSheet) return null;

  return (
    <div className="axl-shell-lux" onKeyDown={onGridKeyDown} tabIndex={0}>
      <header className="axl-title-lux panel-glass">
        <div className="axl-title-actions">
          <button type="button" className="axl-btn" onClick={onClose}>Workspace</button>
          <input
            className="axl-input-title"
            value={doc.title}
            onChange={(event) => updateDocument(doc.id, { title: event.target.value })}
          />
        </div>
        <div className="axl-title-right">
          <button type="button" className="axl-btn" onClick={() => setPanelOpen((prev) => !prev)}>{panelOpen ? 'Hide Panel' : 'Show Panel'}</button>
          <span>Enterprise Compute Surface</span>
        </div>
      </header>

      <section className="axl-toolbar-lux panel-glass">
        <div className="axl-toolbar-group">
          <button type="button" className={`axl-btn${currentFormat.bold ? ' active' : ''}`} onClick={() => applyFormat({ bold: !currentFormat.bold })}>Bold</button>
          <button type="button" className={`axl-btn${currentFormat.italic ? ' active' : ''}`} onClick={() => applyFormat({ italic: !currentFormat.italic })}>Italic</button>
          <button type="button" className={`axl-btn${currentFormat.underline ? ' active' : ''}`} onClick={() => applyFormat({ underline: !currentFormat.underline })}>Underline</button>
        </div>
        <div className="axl-toolbar-group">
          <button type="button" className="axl-btn" onClick={undo} disabled={!history.length}>Undo</button>
          <button type="button" className="axl-btn" onClick={redo} disabled={!future.length}>Redo</button>
          <button type="button" className="axl-btn" onClick={() => sortSelectedColumn(false)}>Sort Asc</button>
          <button type="button" className="axl-btn" onClick={() => sortSelectedColumn(true)}>Sort Desc</button>
        </div>
        <div className="axl-toolbar-group">
          <label className="axl-range">Frozen rows
            <input
              type="number"
              min={0}
              max={Math.min(10, activeSheet.rowCount - 1)}
              value={activeSheet.frozenRows}
              onChange={(event) => {
                const v = Math.max(0, Math.min(activeSheet.rowCount - 1, Number(event.target.value) || 0));
                updateActiveSheet((sheet) => ({ ...sheet, frozenRows: v }));
              }}
            />
          </label>
          <label className="axl-range">Frozen cols
            <input
              type="number"
              min={0}
              max={Math.min(8, activeSheet.colCount - 1)}
              value={activeSheet.frozenCols}
              onChange={(event) => {
                const v = Math.max(0, Math.min(activeSheet.colCount - 1, Number(event.target.value) || 0));
                updateActiveSheet((sheet) => ({ ...sheet, frozenCols: v }));
              }}
            />
          </label>
          <select
            className="axl-select"
            value={currentFormat.numberFormat ?? 'general'}
            onChange={(event) => applyFormat({ numberFormat: event.target.value as CellFormat['numberFormat'] })}
          >
            <option value="general">General</option>
            <option value="number">Number</option>
            <option value="currency">Currency</option>
            <option value="percent">Percent</option>
          </select>
        </div>
      </section>

      <section className="axl-formula-lux panel-glass">
        <div className="axl-name-box">{cellRef(activeCell.row, activeCell.col)}</div>
        <div className="axl-fx">fx</div>
        <input
          className="axl-formula-input"
          value={currentRaw}
          onChange={(event) => writeCell(activeCell.row, activeCell.col, event.target.value, false)}
          onBlur={() => commitWorkbook(workbook, true)}
        />
        <div className="axl-eval">{currentRaw.startsWith('=') ? evaluateFormula(currentRaw, activeSheet) : ''}</div>
      </section>

      <div className="axl-body-lux">
        <div
          className="axl-grid-lux panel-glass"
          ref={gridWrapRef}
          onScroll={(event) => setScroll({ top: event.currentTarget.scrollTop, left: event.currentTarget.scrollLeft })}
        >
          <table className="axl-grid-table">
            <thead>
              <tr>
                <th className="axl-corner" />
                {allCols.map((col) => (
                  <th
                    key={col}
                    className={`axl-col-head${col < activeSheet.frozenCols ? ' frozen' : ''}`}
                    style={{ minWidth: activeSheet.columnWidths[col] }}
                  >
                    {toColumnLabel(col)}
                    <div
                      className="axl-resize-col"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        const startX = event.clientX;
                        const initial = activeSheet.columnWidths[col];
                        const onMove = (moveEvent: MouseEvent) => {
                          const width = Math.max(MIN_COL_WIDTH, initial + moveEvent.clientX - startX);
                          updateActiveSheet((sheet) => {
                            const columnWidths = [...sheet.columnWidths];
                            columnWidths[col] = width;
                            return { ...sheet, columnWidths };
                          }, false);
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
              {allRows.map((row) => (
                <tr key={row} style={{ height: activeSheet.rowHeights[row] }}>
                  <th className={`axl-row-head${row < activeSheet.frozenRows ? ' frozen' : ''}`}>
                    {row + 1}
                    <div
                      className="axl-resize-row"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        const startY = event.clientY;
                        const initial = activeSheet.rowHeights[row];
                        const onMove = (moveEvent: MouseEvent) => {
                          const height = Math.max(MIN_ROW_HEIGHT, initial + moveEvent.clientY - startY);
                          updateActiveSheet((sheet) => {
                            const rowHeights = [...sheet.rowHeights];
                            rowHeights[row] = height;
                            return { ...sheet, rowHeights };
                          }, false);
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
                  {allCols.map((col) => {
                    const selected = activeCell.row === row && activeCell.col === col;
                    const inRange = isInSelection({ row, col }, selectionStart, selectionEnd);
                    const format = activeSheet.formats[cellKey(row, col)];
                    const raw = activeSheet.grid[row]?.[col] ?? '';
                    return (
                      <td
                        key={`${row}-${col}`}
                        className={`axl-cell${selected ? ' selected' : ''}${inRange ? ' in-range' : ''}`}
                        style={{
                          minWidth: activeSheet.columnWidths[col],
                          fontWeight: format?.bold ? 650 : 450,
                          fontStyle: format?.italic ? 'italic' : 'normal',
                          textDecoration: format?.underline ? 'underline' : 'none',
                          textAlign: format?.align ?? 'left',
                        }}
                        onMouseDown={() => {
                          setActiveCell({ row, col });
                          setSelectionStart({ row, col });
                          setSelectionEnd({ row, col });
                        }}
                        onMouseEnter={(event) => {
                          if (event.buttons === 1 && selectionStart) setSelectionEnd({ row, col });
                        }}
                        onDoubleClick={() => setEditingCell({ row, col })}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          setActiveCell({ row, col });
                          setMenu({ x: event.clientX, y: event.clientY, row, col });
                        }}
                      >
                        {editingCell?.row === row && editingCell.col === col ? (
                          <input
                            className="axl-cell-editor"
                            autoFocus
                            value={raw}
                            onChange={(event) => writeCell(row, col, event.target.value, false)}
                            onBlur={() => {
                              setEditingCell(null);
                              commitWorkbook(workbook, true);
                            }}
                          />
                        ) : (
                          formatDisplayValue(raw, activeSheet, format)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {panelOpen && (
          <aside className="axl-side-panel panel-glass">
            <h4>Selection Metrics</h4>
            <div className="axl-panel-row"><span>Cell</span><strong>{cellRef(activeCell.row, activeCell.col)}</strong></div>
            <div className="axl-panel-row"><span>Raw</span><strong>{currentRaw || 'Empty'}</strong></div>
            <div className="axl-panel-row"><span>Value</span><strong>{currentRaw.startsWith('=') ? evaluateFormula(currentRaw, activeSheet) : currentRaw || 'Empty'}</strong></div>
            <h4>Workflow</h4>
            <ul>
              <li>Ctrl/Cmd + C, X, V for clipboard operations</li>
              <li>Ctrl/Cmd + Z and Shift + Ctrl/Cmd + Z for history</li>
              <li>Shift + arrows for range extension</li>
              <li>Right-click for context operations</li>
            </ul>
          </aside>
        )}
      </div>

      <footer className="axl-footer-lux panel-glass">
        <div className="axl-tabs">
          {workbook.sheets.map((sheet) => (
            <button
              key={sheet.id}
              type="button"
              className={`axl-tab${sheet.id === workbook.activeSheetId ? ' active' : ''}`}
              onClick={() => commitWorkbook({ ...workbook, activeSheetId: sheet.id })}
            >
              {sheet.name}
            </button>
          ))}
          <button
            type="button"
            className="axl-tab"
            onClick={() => {
              const id = `sheet-${workbook.sheets.length + 1}`;
              const newSheet = createSheet(id, `Sheet ${workbook.sheets.length + 1}`);
              commitWorkbook({ ...workbook, activeSheetId: id, sheets: [...workbook.sheets, newSheet] });
            }}
          >
            Add Sheet
          </button>
        </div>
        <div>{activeSheet.rowCount} rows × {activeSheet.colCount} columns · {history.length} revisions</div>
      </footer>

      {menu && (
        <div className="axl-menu" style={{ top: menu.y, left: menu.x }} onClick={(event) => event.stopPropagation()}>
          <button type="button" onClick={() => copySelection(false)}>Copy</button>
          <button type="button" onClick={() => copySelection(true)}>Cut</button>
          <button type="button" onClick={() => pasteSelection()}>Paste</button>
          <button type="button" onClick={() => writeSelection('')}>Clear</button>
        </div>
      )}
    </div>
  );
}

export function AccelApp() {
  const { documents, activeDocumentId, setActiveDocument, createSpreadsheet } = useDriveStore();
  const workbooks = documents.filter((doc) => doc.type === 'spreadsheet');
  const [view, setView] = useState<ViewMode>('home');
  const [currentId, setCurrentId] = useState<string | null>(activeDocumentId ?? workbooks[0]?.id ?? null);

  useEffect(() => {
    if (activeDocumentId && workbooks.some((sheet) => sheet.id === activeDocumentId)) {
      setCurrentId(activeDocumentId);
      setView('workbook');
    }
  }, [activeDocumentId, workbooks]);

  if (view === 'workbook' && currentId) {
    return <WorkbookSurface docId={currentId} onClose={() => setView('home')} />;
  }

  return (
    <div className="axl-home-lux">
      <section className="axl-home-main panel-glass">
        <header>
          <h3>Accel Enterprise Workbooks</h3>
          <p>Spreadsheet-grade analysis workspace with structured computation and precision editing.</p>
        </header>

        <button
          type="button"
          className="axl-create"
          onClick={() => {
            const id = createSpreadsheet('Untitled Enterprise Workbook');
            setCurrentId(id);
            setView('workbook');
          }}
        >
          Create Enterprise Workbook
        </button>

        <div className="axl-card-grid">
          {workbooks.map((book) => (
            <button
              type="button"
              key={book.id}
              className="axl-book-card"
              onClick={() => {
                setActiveDocument(book.id);
                setCurrentId(book.id);
                setView('workbook');
              }}
            >
              <div className="axl-book-preview" />
              <strong>{book.title}</strong>
              <span>{book.owner} · {new Date(book.updatedAt).toLocaleString()}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
