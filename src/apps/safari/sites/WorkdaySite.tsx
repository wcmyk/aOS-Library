import { useMemo, useState } from 'react';
import { useCompanyStore } from '../../../state/useCompanyStore';

export function WorkdaySite() {
  const accounts = useCompanyStore((s) => s.employerAccounts);
  const activeId = useCompanyStore((s) => s.sessions.activeWorkdayAccountId);
  const login = useCompanyStore((s) => s.loginWorkday);
  const logout = useCompanyStore((s) => s.logoutWorkday);
  const [selectedId, setSelectedId] = useState(accounts[0]?.id ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const active = useMemo(() => accounts.find((a) => a.id === activeId) ?? null, [accounts, activeId]);

  if (accounts.length === 0) {
    return <div className="workday-shell"><div className="workday-center">No employer-linked Workday accounts are available yet.</div></div>;
  }

  if (!active) {
    return (
      <div className="workday-shell" style={{ display: 'grid', placeItems: 'center', height: '100%', background: '#f3f6fb' }}>
        <div style={{ width: 560, background: 'white', border: '1px solid #dbe3ee', borderRadius: 14, padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>Select a Workday account</h2>
          <p style={{ color: '#64748b', marginTop: -4 }}>Each employer has a separate Workday identity. Sign in to the account for the company you want.</p>
          <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            {accounts.map((acc) => (
              <label key={acc.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="radio" checked={selectedId === acc.id} onChange={() => setSelectedId(acc.id)} />
                <div>
                  <div style={{ fontWeight: 700 }}>{acc.companyName}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{acc.companyEmail} · Employee ID {acc.employeeId}</div>
                </div>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Workday password" style={{ flex: 1, padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <button type="button" onClick={() => {
              if (!selectedId) return;
              const ok = login(selectedId, password);
              setError(ok ? '' : 'Invalid credentials for the selected account.');
            }} style={{ padding: '9px 12px', borderRadius: 8, background: '#0b65a5', color: 'white', fontWeight: 700 }}>Sign in</button>
          </div>
          {error && <div style={{ marginTop: 8, color: '#b91c1c', fontSize: 12 }}>{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="workday-shell" style={{ height: '100%', background: '#f8fafc', padding: 14, overflow: 'auto' }}>
      <div style={{ background: 'white', border: '1px solid #dbe3ee', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>Workday — {active.companyName}</h2>
            <div style={{ color: '#64748b', fontSize: 13 }}>{active.companyEmail} · {active.department} · {active.location}</div>
          </div>
          <button type="button" onClick={logout} style={{ padding: '8px 12px', borderRadius: 8, background: '#e2e8f0' }}>Sign out</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
          <Card k="Title" v={active.title} />
          <Card k="Compensation" v={`$${active.compensation.toLocaleString()}`} />
          <Card k="Status" v={active.employmentStatus} />
          <Card k="Start Date" v={active.startDate} />
        </div>

        <div style={{ marginTop: 14, border: '1px solid #e2e8f0', borderRadius: 10 }}>
          <Row k="Manager" v={active.managerName} />
          <Row k="Workday Employee ID" v={active.employeeId} />
          <Row k="Company Email" v={active.companyEmail} />
          <Row k="Promotion History" v={active.promotionHistory.length ? `${active.promotionHistory.length} records` : 'No promotions yet'} />
        </div>
      </div>
    </div>
  );
}

function Card({ k, v }: { k: string; v: string }) { return <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 10 }}><div style={{ fontSize: 11, color: '#64748b' }}>{k}</div><div style={{ fontWeight: 700 }}>{v}</div></div>; }
function Row({ k, v }: { k: string; v: string }) { return <div style={{ display: 'flex', justifyContent: 'space-between', padding: 10, borderBottom: '1px solid #f1f5f9' }}><span style={{ color: '#64748b' }}>{k}</span><strong>{v}</strong></div>; }
