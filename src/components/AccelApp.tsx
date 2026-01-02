import { useState } from 'react';

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
      </div>
    </div>
  );
}
