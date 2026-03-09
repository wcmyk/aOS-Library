import { useState } from 'react';

const files = {
  'app/main.py': `from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get('/health')\ndef health():\n    return {'status': 'ok'}\n`,
  'app/services/billing.py': `def transfer_funds(source: str, destination: str, amount: float) -> bool:\n    if amount <= 0:\n        raise ValueError('amount must be positive')\n    return True\n`,
  'tests/test_health.py': `from fastapi.testclient import TestClient\nfrom app.main import app\n\nclient = TestClient(app)\n\ndef test_health():\n    assert client.get('/health').status_code == 200\n`,
};

const langs: Record<string, string> = { py: '#93c5fd', ts: '#60a5fa', json: '#fde68a', sh: '#86efac' };

export function PyCharmApp() {
  const keys = Object.keys(files);
  const [active, setActive] = useState(keys[0]);
  const ext = active.split('.').pop() ?? 'txt';
  const lines = files[active as keyof typeof files].split('\n');

  return (
    <div style={{ height: '100%', background: '#1e1f22', color: '#d4d4d4', display: 'grid', gridTemplateRows: '42px 1fr 150px 24px', fontFamily: "'JetBrains Mono','SF Mono',monospace" }}>
      <header style={{ borderBottom: '1px solid #2b2d31', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 14, fontSize: 12 }}>
        <strong style={{ color: '#e5e7eb' }}>PyCharm</strong>
        <span>File</span><span>Edit</span><span>View</span><span>Navigate</span><span>Code</span><span>Run</span>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr' }}>
        <aside style={{ borderRight: '1px solid #2b2d31', background: '#25262b', padding: 8 }}>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8 }}>Project</div>
          {keys.map((k) => (
            <button key={k} type="button" onClick={() => setActive(k)} style={{ width: '100%', textAlign: 'left', padding: '6px 8px', borderRadius: 6, background: active === k ? '#374151' : 'transparent', color: '#e5e7eb', fontSize: 12 }}>{k}</button>
          ))}
        </aside>
        <main style={{ display: 'grid', gridTemplateRows: '34px 1fr' }}>
          <div style={{ borderBottom: '1px solid #2b2d31', display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', fontSize: 12 }}>
            <span style={{ color: langs[ext] ?? '#a1a1aa' }}>●</span>
            {active}
          </div>
          <div style={{ overflow: 'auto', padding: '10px 0' }}>
            {lines.map((line, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '56px 1fr', padding: '0 12px', lineHeight: 1.7, fontSize: 13 }}>
                <span style={{ color: '#6b7280', textAlign: 'right', paddingRight: 10 }}>{i + 1}</span>
                <code style={{ whiteSpace: 'pre' }}>{line}</code>
              </div>
            ))}
          </div>
        </main>
      </div>
      <section style={{ borderTop: '1px solid #2b2d31', background: '#18191c', padding: 10, fontSize: 12 }}>
        <div style={{ color: '#9ca3af', marginBottom: 6 }}>Terminal / Problems</div>
        <div>{`$ pytest -q\n1 passed in 0.12s\n$ python -m uvicorn app.main:app --reload\nINFO: Application startup complete.`}</div>
      </section>
      <footer style={{ borderTop: '1px solid #2b2d31', background: '#111827', fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' }}>
        <span>Python 3.12 • UTF-8 • LF</span><span>Inspections: 0 warnings</span>
      </footer>
    </div>
  );
}
