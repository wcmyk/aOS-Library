import { useState, type CSSProperties, type ReactNode } from 'react';

type PaymentMethod = { type: 'card' | 'ach'; label: string; details: string };

export function RentCafeApp() {
  const [leaseStatus, setLeaseStatus] = useState('Prospect');
  const [rent] = useState(2480);
  const [maintenance, setMaintenance] = useState<string[]>(['Air filter replacement', 'Garage gate sensor calibration']);
  const [methodType, setMethodType] = useState<'card' | 'ach'>('ach');
  const [cardOrRouting, setCardOrRouting] = useState('');
  const [account, setAccount] = useState('');
  const [methods, setMethods] = useState<PaymentMethod[]>([]);

  return (
    <div style={{ height: '100%', background: '#f8fafc', color: '#0f172a', padding: 20, overflow: 'auto' }}>
      <h1 style={{ marginTop: 0 }}>RentCafe</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Panel title="Lease">
          <Row k="Status" v={leaseStatus} />
          <Row k="Property" v="Parkview Tower - Unit 1406" />
          <Row k="Lease term" v="12 months" />
          <button type="button" onClick={() => setLeaseStatus('Active')} style={btn}>Mark lease active</button>
        </Panel>
        <Panel title="Rent & Auto Pay">
          <Row k="Monthly rent" v={`$${rent.toLocaleString()}`} />
          <Row k="Due date" v="1st of each month" />
          <Row k="Auto pay" v={methods.length ? `Enabled (${methods[0].label})` : 'Not configured'} />
        </Panel>
        <Panel title="Add bank/card payment method">
          <div style={{ display: 'grid', gap: 8 }}>
            <select value={methodType} onChange={(e) => setMethodType(e.target.value as 'card' | 'ach')} style={input}><option value="ach">Bank account (routing + account)</option><option value="card">Card</option></select>
            <input value={cardOrRouting} onChange={(e) => setCardOrRouting(e.target.value)} style={input} placeholder={methodType === 'ach' ? 'Routing number' : 'Card number'} />
            <input value={account} onChange={(e) => setAccount(e.target.value)} style={input} placeholder={methodType === 'ach' ? 'Account number' : 'MM/YY + CVV'} />
            <button type="button" onClick={() => setMethods((p) => [{ type: methodType, label: methodType === 'ach' ? 'ACH account' : 'Card', details: `${cardOrRouting} / ${account}` }, ...p])} style={btn}>Save payment method</button>
          </div>
        </Panel>
        <Panel title="Maintenance requests">
          {maintenance.map((m) => <div key={m} style={{ padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>{m}</div>)}
          <button type="button" onClick={() => setMaintenance((p) => [...p, 'New request submitted'])} style={{ ...btn, marginTop: 8 }}>Create maintenance request</button>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}><h3 style={{ marginTop: 0 }}>{title}</h3>{children}</section>;
}
function Row({ k, v }: { k: string; v: string }) { return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span style={{ color: '#64748b' }}>{k}</span><strong>{v}</strong></div>; }
const input: CSSProperties = { padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' };
const btn: CSSProperties = { padding: '9px 11px', borderRadius: 8, background: '#0b4ea2', color: 'white', fontWeight: 700 };
