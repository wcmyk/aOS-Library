import { useState, useRef, useEffect, useCallback, memo, CSSProperties } from 'react';
import { CalculationEngine } from '../excel/calculation-engine';
import { FormulaCoach, type FormulaError } from '../excel/formula-coach';
import type { CellData, CellAddress } from '../excel/types';

// ============================================================================
// 1. ICONS & ASSETS (Internal SVGs for the UI)
// ============================================================================

const Icons = {
  Home: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Folder: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>,
  Grid: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>,
  Table: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(212, 160, 23, 0.4)" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="3" x2="9" y2="21"></line></svg>,
  Chart: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(52, 211, 153, 0.4)" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="12" y1="17" x2="12" y2="10"></line><line x1="8" y1="17" x2="8" y2="13"></line><line x1="16" y1="17" x2="16" y2="7"></line></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
};

// ============================================================================
// 2. HELPER COMPONENTS
// ============================================================================

const SmartCellRenderer = ({ value, format }: { value: string, format: any }) => {
  const num = parseFloat(value);
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
  const lowerVal = value.toString().toLowerCase();
  if (['done', 'approved', 'paid'].includes(lowerVal)) return <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.2)', color: '#6ee7b7', fontSize: '10px', fontWeight: 600 }}>{value}</span>;
  if (['pending', 'review', 'waiting'].includes(lowerVal)) return <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.2)', color: '#fcd34d', fontSize: '10px', fontWeight: 600 }}>{value}</span>;
  if (['rejected', 'error', 'failed'].includes(lowerVal)) return <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', fontSize: '10px', fontWeight: 600 }}>{value}</span>;
  return <span>{value}</span>;
};

// [FIX] Strict Typing for GridCell Props
interface GridCellProps {
  row: number;
  col: number;
  cell: CellData;
  isSelected: boolean;
  isEditing: boolean;
  isInTable: boolean;
  isDependency: 'precedent' | 'dependent' | null;
  onSelect: (r: number, c: number, e: React.MouseEvent) => void;
  onDoubleClick: (r: number, c: number) => void;
  onMouseDown: (r: number, c: number, e: React.MouseEvent) => void;
  onMouseEnter: (r: number, c: number) => void;
  onInput: (r: number, c: number, val: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const GridCell = memo(({ 
  row, col, cell, isSelected, isEditing, isInTable, isDependency, 
  onSelect, onDoubleClick, onMouseDown, onMouseEnter, onInput, onBlur, onKeyDown 
}: GridCellProps) => {
  const displayContent = isEditing ? (cell.formula || cell.value) : (cell.displayValue || cell.value);
  
  const getBorderStyle = () => {
    if (isSelected) return '2px solid rgba(212, 160, 23, 1)';
    if (isDependency === 'precedent') return '1px dashed #7c8cff';
    if (isDependency === 'dependent') return '1px dashed #34d399';
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
          justifyContent: cell.format?.alignment === 'right' ? 'flex-end' : cell.format?.alignment === 'center' ? 'center' : 'flex-start' 
        }}>
          <SmartCellRenderer value={displayContent} format={cell.format} />
        </div>
      )}
      {cell.formula && !isEditing && <div style={{ position: 'absolute', top: 2, right: 2, width: 4, height: 4, borderRadius: '50%', background: '#7c8cff' }} />}
    </div>
  );
}, (prev, next) => 
  prev.cell === next.cell && 
  prev.isSelected === next.isSelected && 
  prev.isEditing === next.isEditing && 
  prev.isInTable === next.isInTable && 
  prev.isDependency === next.isDependency
);

// History Hook
const useHistory = (initialState: Map<string, CellData>) => {
  const [history, setHistory] = useState([new Map(initialState)]);
  const [pointer, setPointer] = useState(0);
  const pushState = (newState: Map<string, CellData>) => { const newHistory = history.slice(0, pointer + 1); newHistory.push(new Map(newState)); setHistory(newHistory); setPointer(newHistory.length - 1); };
  const undo = () => { if (pointer > 0) { setPointer(p => p - 1); return history[pointer - 1]; } return null; };
  const redo = () => { if (pointer < history.length - 1) { setPointer(p => p + 1); return history[pointer + 1]; } return null; };
  return { pushState, undo, redo, canUndo: pointer > 0, canRedo: pointer < history.length - 1 };
};

// ============================================================================
// 3. MAIN APP
// ============================================================================

export function AccelApp() {
  const [view, setView] = useState<'home' | 'spreadsheet'>('home');
  const [activeSidebar, setActiveSidebar] = useState('home');
  const [cells, setCells] = useState<Map<string, CellData>>(new Map());
  const history = useHistory(cells);
  
  // Spreadsheet State
  const [selectedCell, setSelectedCell] = useState<CellAddress | null>(null);
  const [selectionRange, setSelectionRange] = useState<{ start: CellAddress, end: CellAddress } | null>(null);
  const [editingCell, setEditingCell] = useState<CellAddress | null>(null);
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [showFormulaCoach, setShowFormulaCoach] = useState(false);
  const [formulaError, setFormulaError] = useState<FormulaError | null>(null);
  const [dependencies, setDependencies] = useState<{ precedents: string[], dependents: string[] }>({ precedents: [], dependents: [] });

  const calcEngine = useRef(new CalculationEngine(10000));
  const formulaCoach = useRef(new FormulaCoach(cells));

  function getCellAddress(row: number, col: number): string {
    let colStr = "", c = col;
    while (c >= 0) { colStr = String.fromCharCode(65 + (c % 26)) + colStr; c = Math.floor(c / 26) - 1; }
    return `${colStr}${row + 1}`;
  }

  const handleUpdateCell = useCallback((row: number, col: number, data: Partial<CellData>, saveHistory = true) => {
    const address = getCellAddress(row, col);
    setCells(prev => {
      const newCells = new Map(prev);
      const existing = newCells.get(address) || { value: '', displayValue: '' };
      const isFormula = data.value?.toString().startsWith('=');
      const updatedCell = { ...existing, ...data, formula: isFormula ? data.value : undefined };
      if (!isFormula) updatedCell.displayValue = updatedCell.value;
      newCells.set(address, updatedCell);
      if (updatedCell.formula && calcEngine.current.extractReferences) {
        const deps = calcEngine.current.extractReferences(updatedCell.formula);
        calcEngine.current.registerCell(address, deps);
      }
      if (saveHistory) history.pushState(newCells);
      return newCells;
    });
  }, []);

  const handleSelect = useCallback((row: number, col: number, e: React.MouseEvent) => {
    const address = getCellAddress(row, col);
    const precedents = calcEngine.current.getDependencies(address); // Uses alias
    const dependents = calcEngine.current.getDependents(address);
    setDependencies({ precedents, dependents });
    if (e.shiftKey && selectionRange) { setSelectionRange({ ...selectionRange, end: { row, col } }); }
    else {
      setSelectedCell({ row, col });
      setSelectionRange({ start: { row, col }, end: { row, col } });
      setEditingCell(null);
      const cell = cells.get(address);
      setFormulaBarValue(cell?.formula || cell?.value || '');
      if (cell?.error) {
        const err = formulaCoach.current.diagnoseError(cell.formula!, address, cell.displayValue);
        if (err) { setFormulaError(err); setShowFormulaCoach(true); }
      } else { setShowFormulaCoach(false); }
    }
  }, [cells, selectionRange]);

  // --- VIEW: SPREADSHEET ---
  if (view === 'spreadsheet') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0e1016', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ height: '48px', borderBottom: '1px solid #2d3748', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '16px', background: '#171923' }}>
          <button onClick={() => setView('home')} style={{ background: 'rgba(212, 160, 23, 0.1)', border: '1px solid rgba(212, 160, 23, 0.2)', color: '#d4a017', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
             <Icons.Home /> <span style={{fontSize: 12, fontWeight: 600}}>Home</span>
          </button>
          <div style={{ height: '20px', width: '1px', background: '#2d3748' }} />
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => history.undo()} disabled={!history.canUndo} style={{ opacity: history.canUndo ? 1 : 0.3, background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '6px' }}>↩</button>
            <button onClick={() => history.redo()} disabled={!history.canRedo} style={{ opacity: history.canRedo ? 1 : 0.3, background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '6px' }}>↪</button>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: '11px', color: '#718096', display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width: 6, height: 6, borderRadius: '50%', background: '#34d399'}}></div> Autosave On</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', background: '#1a202c', borderBottom: '1px solid #2d3748', gap: '10px' }}>
           <div style={{ fontSize: '12px', color: '#a0aec0', fontFamily: 'monospace' }}>{selectedCell ? getCellAddress(selectedCell.row, selectedCell.col) : ''}</div>
          <div style={{ width: '1px', height: '16px', background: '#4a5568' }}></div>
          <div style={{ color: '#a0aec0', fontSize: '14px', fontStyle: 'italic', fontWeight: 'bold' }}>fx</div>
          <input value={formulaBarValue} onChange={(e) => { setFormulaBarValue(e.target.value); if (selectedCell) handleUpdateCell(selectedCell.row, selectedCell.col, { value: e.target.value }); }} style={{ flex: 1, background: '#2d3748', border: 'none', borderRadius: '4px', padding: '4px 8px', color: 'white', outline: 'none', fontSize: '13px' }} placeholder="Formula" />
        </div>

        {showFormulaCoach && formulaError && (
          <div style={{ position: 'absolute', top: '110px', right: '20px', width: '280px', background: 'rgba(23, 25, 35, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid #d4a017', borderRadius: '8px', padding: '16px', zIndex: 100, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><strong style={{ color: '#d4a017' }}>AI Coach</strong><button onClick={() => setShowFormulaCoach(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button></div>
            <p style={{ fontSize: '13px', marginBottom: '12px', lineHeight: 1.4 }}>{formulaError.message}</p>
            {formulaError.fixes.map((fix, i) => (<button key={i} onClick={() => { if(selectedCell) handleUpdateCell(selectedCell.row, selectedCell.col, { value: fix.newFormula }); setShowFormulaCoach(false); }} style={{ display: 'block', width: '100%', marginTop: '8px', padding: '8px', background: '#2d3748', border: '1px solid #4a5568', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', textAlign: 'left' }}>Apply: <code style={{color: '#d4a017'}}>{fix.newFormula}</code></button>))}
          </div>
        )}

        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 30 }}>
            <div style={{ width: '50px', height: '28px', background: '#1a202c', borderRight: '1px solid #4a5568', borderBottom: '1px solid #4a5568' }} />
            {Array.from({ length: 26 }).map((_, i) => (
               <div key={i} style={{ minWidth: '100px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedCell?.col === i ? '#2d3748' : '#1a202c', borderRight: '1px solid #4a5568', borderBottom: '1px solid #4a5568', fontSize: '11px', fontWeight: 'bold', color: selectedCell?.col === i ? '#d4a017' : '#a0aec0' }}>{String.fromCharCode(65 + i)}</div>
            ))}
          </div>
          {Array.from({ length: 100 }).map((_, r) => (
            <div key={r} style={{ display: 'flex' }}>
              <div style={{ width: '50px', minWidth: '50px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedCell?.row === r ? '#2d3748' : '#1a202c', borderRight: '1px solid #4a5568', borderBottom: '1px solid #4a5568', position: 'sticky', left: 0, zIndex: 10, fontSize: '11px', color: selectedCell?.row === r ? '#d4a017' : '#a0aec0' }}>{r + 1}</div>
              {Array.from({ length: 26 }).map((_, c) => {
                const address = getCellAddress(r, c);
                const isActive = selectedCell?.row === r && selectedCell?.col === c;
                const isSelected = !!selectionRange && r >= Math.min(selectionRange.start.row, selectionRange.end.row) && r <= Math.max(selectionRange.start.row, selectionRange.end.row) && c >= Math.min(selectionRange.start.col, selectionRange.end.col) && c <= Math.max(selectionRange.start.col, selectionRange.end.col);
                let depType: 'precedent' | 'dependent' | null = null;
                if (dependencies.precedents.includes(address)) depType = 'precedent'; if (dependencies.dependents.includes(address)) depType = 'dependent';
                return (
                  <GridCell 
                    key={`${r}-${c}`} 
                    row={r} 
                    col={c} 
                    cell={cells.get(address) || { value: '', displayValue: '' }} 
                    isSelected={isSelected} 
                    isEditing={!!(isActive && editingCell?.row === r && editingCell?.col === c)} 
                    isInTable={false} 
                    isDependency={depType} 
                    onSelect={handleSelect} 
                    onDoubleClick={() => setEditingCell({ row: r, col: c })} 
                    onMouseDown={() => {}} 
                    onMouseEnter={() => {}} 
                    onInput={(row, col, val) => handleUpdateCell(row, col, { value: val }, false)} 
                    onBlur={() => { if(cells.get(getCellAddress(r, c))) history.pushState(cells); setEditingCell(null); }} 
                    onKeyDown={(e) => { if (e.key === 'Enter') { setEditingCell(null); history.pushState(cells); } }} 
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ height: '26px', background: '#d4a017', color: '#000', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '11px', fontWeight: 600 }}><span>Ready</span></div>
      </div>
    );
  }

  // --- VIEW: HOME SCREEN (The Redesign) ---
  const templates = [
    { name: 'Blank workbook', icon: <Icons.Grid />, color: 'rgba(212, 160, 23, 1)' },
    { name: 'Personal budget', icon: <Icons.Table />, color: '#34d399' },
    { name: 'Project tracker', icon: <Icons.Chart />, color: '#7c8cff' },
    { name: 'Schedule', icon: <Icons.Table />, color: '#f472b6' },
  ];

  const recentFiles = [
    { name: 'Q3 Financials.xlsx', date: 'Just now', path: 'My Mac » Documents' },
    { name: 'Marketing Campaign.xlsx', date: '2 hours ago', path: 'iCloud » Work' },
    { name: 'Inventory_2024.xlsx', date: 'Yesterday', path: 'Shared » Team' },
  ];

  return (
    <div style={{ display: 'flex', height: '100%', background: '#0e1016', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* 1. Sidebar */}
      <div style={{ width: '220px', background: '#171923', borderRight: '1px solid #2d3748', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', paddingLeft: '8px' }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #d4a017, #b4860b)', borderRadius: 6, display: 'grid', placeItems: 'center', fontWeight: 'bold', fontSize: 18, color: '#000' }}>A</div>
          <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px' }}>Accel</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {['Home', 'New', 'Open'].map(item => (
            <button 
              key={item}
              onClick={() => setActiveSidebar(item.toLowerCase())}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', 
                background: activeSidebar === item.toLowerCase() ? 'rgba(255,255,255,0.08)' : 'transparent', 
                border: 'none', borderRadius: '6px', color: activeSidebar === item.toLowerCase() ? '#d4a017' : '#a0aec0', 
                cursor: 'pointer', fontSize: '14px', fontWeight: 500, textAlign: 'left', transition: 'all 0.2s'
              }}
            >
              {item === 'Home' && <Icons.Home />}
              {item === 'New' && <Icons.Plus />}
              {item === 'Open' && <Icons.Folder />}
              {item}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #2d3748' }}>
          <div style={{ fontSize: '12px', color: '#718096', paddingLeft: '12px' }}>Account</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', padding: '0 12px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#4a5568', display: 'grid', placeItems: 'center', fontSize: '12px' }}>JM</div>
            <div style={{ fontSize: '13px' }}>Justin M.</div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '32px' }}>Good evening</h1>
        
        {/* Templates Row */}
        <div style={{ marginBottom: '48px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
             <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0' }}>New workbook</h2>
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
             {templates.map((t, i) => (
               <div 
                 key={i} 
                 onClick={() => setView('spreadsheet')}
                 className="template-card"
                 // [FIX] Removed invalid 'group' property
                 style={{ cursor: 'pointer' }}
               >
                 <div 
                   style={{ 
                     height: '100px', background: '#1a202c', border: '1px solid #2d3748', 
                     borderRadius: '8px', marginBottom: '10px', display: 'grid', placeItems: 'center',
                     transition: 'transform 0.2s, border-color 0.2s'
                   }}
                   onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d4a017'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                   onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2d3748'; e.currentTarget.style.transform = 'translateY(0)'; }}
                 >
                    <div style={{ color: t.color }}>{t.icon}</div>
                 </div>
                 <div style={{ fontSize: '13px', fontWeight: 500 }}>{t.name}</div>
               </div>
             ))}
           </div>
        </div>

        {/* Recent Files Table */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', marginBottom: '16px' }}>Recent</h2>
          <div style={{ border: '1px solid #2d3748', borderRadius: '8px', overflow: 'hidden' }}>
            {recentFiles.map((file, i) => (
              <div 
                key={i}
                onClick={() => setView('spreadsheet')}
                style={{ 
                  display: 'flex', alignItems: 'center', padding: '12px 16px', 
                  borderBottom: i !== recentFiles.length - 1 ? '1px solid #2d3748' : 'none',
                  cursor: 'pointer', background: '#151720'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1e2230'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#151720'}
              >
                <div style={{ width: 32, height: 32, background: 'rgba(52, 211, 153, 0.1)', borderRadius: 4, display: 'grid', placeItems: 'center', marginRight: '16px', color: '#34d399' }}>
                   <Icons.Grid />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>{file.name}</div>
                  <div style={{ fontSize: '11px', color: '#718096' }}>{file.path}</div>
                </div>
                <div style={{ fontSize: '12px', color: '#718096', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icons.Clock /> {file.date}
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}
