import { useEffect, useMemo, useState } from 'react';
import { useDriveStore } from '../../state/useDriveStore';

type ViewMode = 'home' | 'sheet';

const GRID_ROWS = 16;
const GRID_COLS = 8;

const toCol = (index: number) => String.fromCharCode(65 + index);

function parseSheet(content: string): string[][] {
  const lines = content.split('\n').map((line) => line.split('\t'));
  if (lines.length === 0) return Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(''));
  const rows = Array.from({ length: GRID_ROWS }, (_, rowIdx) =>
    Array.from({ length: GRID_COLS }, (_, colIdx) => lines[rowIdx]?.[colIdx] ?? ''),
  );
  return rows;
}

function serializeSheet(grid: string[][]): string {
  return grid.map((row) => row.join('\t')).join('\n');
}

export function AccelApp() {
  const { documents, activeDocumentId, setActiveDocument, createSpreadsheet, updateDocument } = useDriveStore();
  const sheets = documents.filter((doc) => doc.type === 'spreadsheet');
  const [view, setView] = useState<ViewMode>('home');
  const [activeId, setActiveId] = useState<string | null>(activeDocumentId ?? sheets[0]?.id ?? null);

  useEffect(() => {
    if (!activeDocumentId) return;
    const exists = sheets.some((doc) => doc.id === activeDocumentId);
    if (exists) {
      setActiveId(activeDocumentId);
      setView('sheet');
    }
  }, [activeDocumentId, sheets]);

  const activeSheet = sheets.find((doc) => doc.id === activeId) ?? null;

  const grid = useMemo(() => parseSheet(activeSheet?.content ?? ''), [activeSheet?.content]);

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

  const updateCell = (row: number, col: number, value: string) => {
    if (!activeSheet) return;
    const next = parseSheet(activeSheet.content);
    next[row][col] = value;
    updateDocument(activeSheet.id, { content: serializeSheet(next) });
  };

  if (view === 'home') {
    return (
      <div className="accel-shell">
        <aside className="accel-sidebar">
          <h2>Accel</h2>
          <button type="button" className="accel-primary" onClick={createWorkbook}>+ New Workbook</button>
          <p>Performance analytics, live models, and team-ready sheets.</p>
        </aside>
        <section className="accel-home">
          <h3>Recent Workbooks</h3>
          <div className="accel-home-grid">
            {sheets.map((sheet) => (
              <button key={sheet.id} type="button" className="accel-file-card" onClick={() => openWorkbook(sheet.id)}>
                <strong>{sheet.title}</strong>
                <span>{sheet.owner}</span>
                <span>{new Date(sheet.updatedAt).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="accel-sheet-shell">
      <div className="accel-sheet-toolbar">
        <button type="button" onClick={() => setView('home')}>← Workbooks</button>
        <input
          className="accel-title-input"
          value={activeSheet?.title ?? ''}
          onChange={(event) => activeSheet && updateDocument(activeSheet.id, { title: event.target.value })}
        />
        <span>Synced to Sanctum</span>
      </div>
      <div className="accel-grid-wrap">
        <table className="accel-grid">
          <thead>
            <tr>
              <th>#</th>
              {Array.from({ length: GRID_COLS }, (_, c) => (
                <th key={c}>{toCol(c)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <th>{rowIndex + 1}</th>
                {row.map((value, colIndex) => (
                  <td key={`${rowIndex}-${colIndex}`}>
                    <input
                      value={value}
                      onChange={(event) => updateCell(rowIndex, colIndex, event.target.value)}
                      aria-label={`Cell ${toCol(colIndex)}${rowIndex + 1}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
