import { useState } from 'react';

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

export function AccelApp() {
  const [view, setView] = useState<'home' | 'spreadsheet'>('home');
  const [selectedSidebar, setSelectedSidebar] = useState('home');

  if (view === 'spreadsheet') {
    return (
      <div style={{ display: 'flex', height: '100%', background: 'rgba(14, 16, 22, 0.55)' }}>
        {/* Sidebar */}
        <div style={{ width: '48px', background: 'rgba(212, 160, 23, 0.15)', borderRight: '1px solid rgba(212, 160, 23, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '16px', gap: '12px' }}>
          <button onClick={() => { setView('home'); setSelectedSidebar('home'); }} style={{ width: '32px', height: '32px', background: selectedSidebar === 'home' ? 'rgba(212, 160, 23, 0.3)' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px' }}>
            ⌂
          </button>
        </div>

        {/* Spreadsheet Grid */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Formula Bar */}
          <div style={{ height: '32px', background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '12px' }}>
            <span style={{ fontSize: '12px', opacity: 0.7 }}>fx</span>
            <input type="text" placeholder="Enter formula" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '12px' }} />
          </div>

          {/* Grid */}
          <div style={{ position: 'relative' }}>
            {/* Column Headers */}
            <div style={{ display: 'flex', position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ width: '40px', height: '28px', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}></div>
              {Array.from({ length: 26 }, (_, i) => (
                <div key={i} style={{ width: '100px', height: '28px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600 }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>

            {/* Rows */}
            {Array.from({ length: 50 }, (_, rowIndex) => (
              <div key={rowIndex} style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                {/* Row Number */}
                <div style={{ width: '40px', height: '28px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, background: 'rgba(255, 255, 255, 0.05)' }}>
                  {rowIndex + 1}
                </div>
                {/* Cells */}
                {Array.from({ length: 26 }, (_, colIndex) => (
                  <div key={colIndex} style={{ width: '100px', height: '28px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', padding: '4px 8px' }}>
                    <input type="text" style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '12px' }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
          </div>
        </div>
      </div>
    </div>
  );
}
