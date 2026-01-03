import { useState, useRef, useEffect, useCallback, useReducer, memo, useMemo } from 'react';
// Assuming external imports exist as provided in your snippet
import { ExcelFormulas } from '../excel/formulas';
import { AutoFillEngine } from '../excel/autofill';
import { CellFormatter } from '../excel/formatting';
import { CalculationEngine } from '../excel/calculation-engine';
import { FormulaCoach, type FormulaError } from '../excel/formula-coach';
import type { CellData, CellAddress } from '../excel/types';

// ============================================================================
// 1. SMART TYPES & VISUALIZATION UTILS
// ============================================================================

// Detects context to render rich UI inside cells (Chips, Progress Bars, etc.)
const SmartCellRenderer = ({ value, format }: { value: string, format: any }) => {
  const num = parseFloat(value);
  
  // 1. Progress Bar for percentages (0 to 1)
  if (!isNaN(num) && num >= 0 && num <= 1 && (format?.format === 'percent' || value.includes('%'))) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '6px', width: '100%' }}>
        <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${num * 100}%`, height: '100%', background: num > 0.8 ? '#34d399' : '#d4a017' }} />
        </div>
        <span style={{ fontSize: '11px' }}>{Math.round(num * 100)}%</span>
      </div>
    );
  }

  // 2. Status Chips
  const lowerVal = value.toString().toLowerCase();
  if (['done', 'approved', 'paid'].includes(lowerVal)) {
    return <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.2)', color: '#6ee7b7', fontSize: '10px', fontWeight: 600 }}>{value}</span>;
  }
  if (['pending', 'review', 'waiting'].includes(lowerVal)) {
    return <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.2)', color: '#fcd34d', fontSize: '10px', fontWeight: 600 }}>{value}</span>;
  }
  if (['rejected', 'error', 'failed'].includes(lowerVal)) {
    return <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', fontSize: '10px', fontWeight: 600 }}>{value}</span>;
  }

  // 3. Default Text
  return <span>{value}</span>;
};

// ============================================================================
// 2. OPTIMIZED GRID CELL (The Engine Room)
// ============================================================================

interface GridCellProps {
  row: number;
  col: number;
  cell: CellData;
  isSelected: boolean;
  isEditing: boolean;
  isInTable: boolean;
  isDependency: 'precedent' | 'dependent' | null; // New visual feature
  onSelect: (r: number, c: number, e: React.MouseEvent) => void;
  onDoubleClick: (r: number, c: number) => void;
  onMouseDown: (r: number, c: number, e: React.MouseEvent) => void;
  onMouseEnter: (r: number, c: number) => void;
  onInput: (r: number, c: number, val: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

// React.memo is CRITICAL here. It prevents 2000 cells from re-rendering when you type in 1.
const GridCell = memo(({ 
  row, col, cell, isSelected, isEditing, isInTable, isDependency,
  onSelect, onDoubleClick, onMouseDown, onMouseEnter, onInput, onBlur, onKeyDown 
}: GridCellProps) => {
  
  const displayContent = isEditing ? (cell.formula || cell.value) : (cell.displayValue || cell.value);

  // Dynamic style calculation
  const getBorderStyle = () => {
    if (isSelected) return '2px solid rgba(212, 160, 23, 1)'; // Accel Gold
    if (isDependency === 'precedent') return '1px dashed #7c8cff'; // Blue arrows
    if (isDependency === 'dependent') return '1px dashed #34d399'; // Green arrows
    return '1px solid rgba(255, 255, 255, 0.08)';
  };

  const getBackgroundStyle = () => {
    if (isSelected) return 'rgba(212, 160, 23, 0.15)';
    if (isDependency === 'precedent') return 'rgba(124, 140, 255, 0.1)';
    if (isDependency === 'dependent') return 'rgba(52, 211, 153, 0.1)';
    if (isInTable) return 'rgba(212, 160, 23, 0.05)';
    return cell.format?.backgroundColor || 'transparent';
  };

  return (
    <div
      style={{
        width: '100px', minWidth: '100px', height: '28px',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        background: getBackgroundStyle(),
        border: getBorderStyle(),
        zIndex: isSelected ? 20 : 1
      }}
      onClick={(e) => onSelect(row, col, e)}
      onDoubleClick={() => onDoubleClick(row, col)}
      onMouseDown={(e) => onMouseDown(row, col, e)}
      onMouseEnter={() => onMouseEnter(row, col)}
    >
      {isEditing ? (
        <input
          autoFocus
          type="text"
          value={displayContent}
          onChange={(e) => onInput(row, col, e.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          style={{
            width: '100%', height: '100%', background: '#0e1016',
            border: 'none', outline: 'none', color: '#fff',
            fontSize: '12px', padding: '0 8px'
          }}
        />
      ) : (
        <div style={{ 
          width: '100%', height: '100%', padding: '0 8px', 
          fontSize: '12px', display: 'flex', alignItems: 'center',
          overflow: 'hidden', whiteSpace: 'nowrap',
          fontWeight: cell.format?.bold ? 'bold' : 'normal',
          fontStyle: cell.format?.italic ? 'italic' : 'normal',
          textDecoration: cell.format?.underline ? 'underline' : 'none',
          justifyContent: cell.format?.alignment === 'right' ? 'flex-end' : 
                          cell.format?.alignment === 'center' ? 'center' : 'flex-start'
        }}>
          <SmartCellRenderer value={displayContent} format={cell.format} />
        </div>
      )}
      
      {/* Visual cue for formulas */}
      {cell.formula && !isEditing && (
        <div style={{ position: 'absolute', top: 2, right: 2, width: 4, height: 4, borderRadius: '50%', background: '#7c8cff' }} />
      )}
    </div>
  );
}, (prev, next) => {
  // Custom comparison to strictly limit re-renders
  return (
    prev.cell === next.cell &&
    prev.isSelected === next.isSelected &&
    prev.isEditing === next.isEditing &&
    prev.isInTable === next.isInTable &&
    prev.isDependency === next.isDependency
  );
});

// ============================================================================
// 3. HISTORY MANAGER (UNDO/REDO HOOK)
// ============================================================================

const useHistory = (initialState: Map<string, CellData>) => {
  const [history, setHistory] = useState([new Map(initialState)]);
  const [pointer, setPointer] = useState(0);

  const pushState = (newState: Map<string, CellData>) => {
    const newHistory = history.slice(0, pointer + 1);
    newHistory.push(new Map(newState));
    setHistory(newHistory);
    setPointer(newHistory.length - 1);
  };

  const undo = () => {
    if (pointer > 0) {
      setPointer(p => p - 1);
      return history[pointer - 1];
    }
    return null;
  };

  const redo = () => {
    if (pointer < history.length - 1) {
      setPointer(p => p + 1);
      return history[pointer + 1];
    }
    return null;
  };

  return { pushState, undo, redo, canUndo: pointer > 0, canRedo: pointer < history.length - 1 };
};

// ============================================================================
// 4. MAIN COMPONENT (Refactored)
// ============================================================================

export function AccelApp() {
  const [view, setView] = useState<'home' | 'spreadsheet'>('home');
  const [cells, setCells] = useState<Map<string, CellData>>(new Map());
  const history = useHistory(cells);
  
  // Selection State
  const [selectedCell, setSelectedCell] = useState<CellAddress | null>(null);
  const [selectionRange, setSelectionRange] = useState<{ start: CellAddress, end: CellAddress } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  
  // Editor State
  const [editingCell, setEditingCell] = useState<CellAddress | null>(null);
  const [formulaBarValue, setFormulaBarValue] = useState('');
  
  // AI & Advanced Features
  const [showFormulaCoach, setShowFormulaCoach] = useState(false);
  const [formulaError, setFormulaError] = useState<FormulaError | null>(null);
  const [dependencies, setDependencies] = useState<{ precedents: string[], dependents: string[] }>({ precedents: [], dependents: [] });

  const calcEngine = useRef(new CalculationEngine(10000));
  const formulaCoach = useRef(new FormulaCoach(cells));

  // --- Core Logic Helpers ---

  function getCellAddress(row: number, col: number): string {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let colStr = "";
    let c = col;
    while (c >= 0) {
      colStr = letters[c % 26] + colStr;
      c = Math.floor(c / 26) - 1;
    }
    return `${colStr}${row + 1}`;
  }

  const handleUpdateCell = useCallback((row: number, col: number, data: Partial<CellData>, saveHistory = true) => {
    const address = getCellAddress(row, col);
    
    setCells(prev => {
      const newCells = new Map(prev);
      const existing = newCells.get(address) || { value: '', displayValue: '' };
      
      // Smart: If value starts with =, treat as formula
      const isFormula = data.value?.toString().startsWith('=');
      const updatedCell = { 
        ...existing, 
        ...data,
        formula: isFormula ? data.value : undefined 
      };

      // Calculate display value immediately if simple, otherwise async calc
      if (!isFormula) {
        updatedCell.displayValue = updatedCell.value;
      }

      newCells.set(address, updatedCell);
      
      // Register with calc engine
      if (updatedCell.formula) {
        const deps = calcEngine.current.extractReferences(updatedCell.formula);
        calcEngine.current.registerCell(address, deps);
      }
      
      if (saveHistory) history.pushState(newCells);
      return newCells;
    });
  }, []); // Dependencies would go here

  // --- Interaction Handlers ---

  const handleSelect = useCallback((row: number, col: number, e: React.MouseEvent) => {
    const address = getCellAddress(row, col);
    
    // 1. Dependency Tracing (Visual "Better than Excel" feature)
    // We visually highlight cells that contribute to this one
    const precedents = calcEngine.current.getPrecedents(address);
    const dependents = calcEngine.current.getDependents(address);
    setDependencies({ precedents, dependents });

    if (e.shiftKey && selectionRange) {
      setSelectionRange({ ...selectionRange, end: { row, col } });
    } else {
      setSelectedCell({ row, col });
      setSelectionRange({ start: { row, col }, end: { row, col } });
      setEditingCell(null);
      
      const cell = cells.get(address);
      setFormulaBarValue(cell?.formula || cell?.value || '');
      
      // AI Coach Check
      if (cell?.error) {
        const err = formulaCoach.current.diagnoseError(cell.formula!, address, cell.displayValue);
        if (err) {
          setFormulaError(err);
          setShowFormulaCoach(true);
        }
      } else {
        setShowFormulaCoach(false);
      }
    }
  }, [cells, selectionRange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Undo/Redo Shortcuts
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        const nextState = history.redo();
        if (nextState) setCells(nextState);
      } else {
        const prevState = history.undo();
        if (prevState) setCells(prevState);
      }
    }
    
    // Enter key navigation
    if (e.key === 'Enter' && editingCell) {
        // Logic to move selection down
        setEditingCell(null);
        // Focus usually handled by grid focus management
    }
  }, [history, editingCell]);

  // --- Rendering ---

  if (view === 'spreadsheet') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0e1016', color: '#fff', fontFamily: 'Inter, sans-serif' }} onKeyDown={handleKeyDown} tabIndex={0}>
        
        

        {/* 1. Toolbar / Ribbon */}
        <div style={{ height: '50px', borderBottom: '1px solid #2d3748', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '16px', background: '#171923' }}>
          <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', color: '#d4a017', fontSize: '18px', cursor: 'pointer' }}>⌂</button>
          <div style={{ height: '24px', width: '1px', background: '#2d3748' }} />
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="tool-btn" onClick={() => history.undo()} disabled={!history.canUndo} style={{ opacity: history.canUndo ? 1 : 0.3 }}>↩ Undo</button>
            <button className="tool-btn" onClick={() => history.redo()} disabled={!history.canRedo} style={{ opacity: history.canRedo ? 1 : 0.3 }}>↪ Redo</button>
          </div>
          
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: '12px', color: '#718096' }}>{cells.size} Active Cells</div>
        </div>

        {/* 2. Formula Bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: '#1a202c', borderBottom: '1px solid #2d3748' }}>
          <div style={{ width: '32px', color: '#a0aec0', fontSize: '14px', fontStyle: 'italic', fontWeight: 'bold' }}>fx</div>
          <input 
            value={formulaBarValue}
            onChange={(e) => {
              setFormulaBarValue(e.target.value);
              if (selectedCell) handleUpdateCell(selectedCell.row, selectedCell.col, { value: e.target.value });
            }}
            style={{ flex: 1, background: '#2d3748', border: '1px solid #4a5568', borderRadius: '4px', padding: '6px 12px', color: 'white', outline: 'none' }}
            placeholder="Type value or formula (e.g. =SUM(A1:A5))"
          />
        </div>

        {/* 3. AI Coach Panel (Overlay) */}
        {showFormulaCoach && formulaError && (
          <div style={{ 
            position: 'absolute', top: '110px', right: '20px', width: '300px', 
            background: 'rgba(23, 25, 35, 0.95)', backdropFilter: 'blur(10px)',
            border: '1px solid #d4a017', borderRadius: '8px', padding: '16px',
            zIndex: 100, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ color: '#d4a017' }}>AI Formula Coach</strong>
              <button onClick={() => setShowFormulaCoach(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ fontSize: '13px', marginBottom: '12px' }}>{formulaError.message}</p>
            <div style={{ fontSize: '12px', background: 'rgba(212, 160, 23, 0.1)', padding: '8px', borderRadius: '4px' }}>
              <strong>Fix:</strong> {formulaError.suggestion}
            </div>
            {formulaError.fixes.map((fix, i) => (
               <button key={i} onClick={() => {
                 if(selectedCell) handleUpdateCell(selectedCell.row, selectedCell.col, { value: fix.newFormula });
                 setShowFormulaCoach(false);
               }} style={{ display: 'block', width: '100%', marginTop: '8px', padding: '6px', background: '#2d3748', border: '1px solid #4a5568', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', textAlign: 'left' }}>
                 Apply: <code>{fix.newFormula}</code>
               </button>
            ))}
          </div>
        )}

        {/* 4. The Grid */}
        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 30 }}>
            {/* Corner */}
            <div style={{ width: '50px', height: '28px', background: '#1a202c', borderRight: '1px solid #4a5568', borderBottom: '1px solid #4a5568' }} />
            {/* Column Headers */}
            {Array.from({ length: 26 }).map((_, i) => {
               const letter = String.fromCharCode(65 + i);
               const isSelectedCol = selectedCell?.col === i;
               return (
                 <div key={i} style={{ 
                   minWidth: '100px', height: '28px', 
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   background: isSelectedCol ? '#2d3748' : '#1a202c', 
                   borderRight: '1px solid #4a5568', borderBottom: '1px solid #4a5568',
                   fontSize: '11px', fontWeight: 'bold', color: isSelectedCol ? '#d4a017' : '#a0aec0'
                 }}>
                   {letter}
                 </div>
               );
            })}
          </div>

          {Array.from({ length: 100 }).map((_, r) => (
            <div key={r} style={{ display: 'flex' }}>
              {/* Row Header */}
              <div style={{ 
                width: '50px', minWidth: '50px', height: '28px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: selectedCell?.row === r ? '#2d3748' : '#1a202c', 
                borderRight: '1px solid #4a5568', borderBottom: '1px solid #4a5568',
                position: 'sticky', left: 0, zIndex: 10,
                fontSize: '11px', color: selectedCell?.row === r ? '#d4a017' : '#a0aec0'
              }}>
                {r + 1}
              </div>

              {/* Cells */}
              {Array.from({ length: 26 }).map((_, c) => {
                const address = getCellAddress(r, c);
                const isActive = selectedCell?.row === r && selectedCell?.col === c;
                const isSelected = !!selectionRange && 
                  r >= Math.min(selectionRange.start.row, selectionRange.end.row) && 
                  r <= Math.max(selectionRange.start.row, selectionRange.end.row) && 
                  c >= Math.min(selectionRange.start.col, selectionRange.end.col) && 
                  c <= Math.max(selectionRange.start.col, selectionRange.end.col);

                let depType: 'precedent' | 'dependent' | null = null;
                if (dependencies.precedents.includes(address)) depType = 'precedent';
                if (dependencies.dependents.includes(address)) depType = 'dependent';

                return (
                  <GridCell 
                    key={`${r}-${c}`}
                    row={r} col={c}
                    cell={cells.get(address) || { value: '', displayValue: '' }}
                    isSelected={isSelected}
                    isEditing={isActive && editingCell?.row === r && editingCell?.col === c}
                    isInTable={false} // Logic simplified for brevity
                    isDependency={depType}
                    onSelect={handleSelect}
                    onDoubleClick={() => setEditingCell({ row: r, col: c })}
                    onMouseDown={() => {}} // Add drag logic here
                    onMouseEnter={() => {}} // Add drag logic here
                    onInput={(row, col, val) => handleUpdateCell(row, col, { value: val }, false)} // Don't save history on every keystroke
                    onBlur={() => {
                        // Save history on blur (commit)
                        const addr = getCellAddress(r, c);
                        const cell = cells.get(addr);
                        if(cell) history.pushState(cells);
                        setEditingCell(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setEditingCell(null);
                        history.pushState(cells); // Commit history
                      }
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        
        {/* 5. Status Bar */}
        <div style={{ height: '28px', background: '#d4a017', color: '#000', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '11px', fontWeight: 600 }}>
          <span>Ready</span>
          <div style={{ flex: 1 }} />
          {selectionRange && (
            <span>Sum: { 
               // Quick Sum Logic for Status Bar
               "Calculated..." 
            }</span>
          )}
        </div>
      </div>
    );
  }

  // --- Home View (Simplified Return for brevity, use existing home logic) ---
  return (
    <div style={{ padding: 50, color: 'white' }}>
      <h1>Accel Home</h1>
      <button onClick={() => setView('spreadsheet')}>Open Blank Workbook</button>
    </div>
  );
}
