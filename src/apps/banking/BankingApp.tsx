import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';

type BankTab = 'accounts' | 'pay' | 'investments' | 'mortgage' | 'security';
type BankName = 'Chase' | 'Wells Fargo' | 'PNC' | 'Bank of America';

type Account = {
  id: string;
  bank: BankName;
  name: string;
  balance: number;
  routing: string;
  accountNumber: string;
};

const seedAccounts: Account[] = [
  { id: 'chase-checking', bank: 'Chase', name: 'Total Checking', balance: 12450.88, routing: '021000021', accountNumber: '5648391201' },
  { id: 'chase-savings', bank: 'Chase', name: 'Premier Savings', balance: 34200, routing: '021000021', accountNumber: '7720483910' },
  { id: 'wf-checking', bank: 'Wells Fargo', name: 'Everyday Checking', balance: 8450.12, routing: '121000248', accountNumber: '1045892374' },
];

const bankOptions: BankName[] = ['Chase', 'Wells Fargo', 'PNC', 'Bank of America'];

export function BankingApp() {
  const [tab, setTab] = useState<BankTab>('accounts');
  const [accounts, setAccounts] = useState(seedAccounts);
  const [activeBank, setActiveBank] = useState<BankName>('Chase');
  const [transferFrom, setTransferFrom] = useState(seedAccounts[0].id);
  const [transferTo, setTransferTo] = useState(seedAccounts[1].id);
  const [amount, setAmount] = useState('');
  const [routing, setRouting] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const currentAccounts = useMemo(() => accounts.filter((a) => a.bank === activeBank), [accounts, activeBank]);
  const creditCardBalance = 0;

  const transfer = () => {
    const value = Number(amount);
    if (!value || value <= 0 || transferFrom === transferTo) return;
    setAccounts((prev) => prev.map((a) => {
      if (a.id === transferFrom) return { ...a, balance: a.balance - value };
      if (a.id === transferTo) return { ...a, balance: a.balance + value };
      return a;
    }));
    setAmount('');
  };

  return (
    <div style={{ height: '100%', background: '#f3f6fb', color: '#0f172a', fontFamily: "'SF Pro Display','Inter',system-ui,sans-serif", display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#0b4ea2', color: 'white', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <strong style={{ fontSize: 20 }}>CHASE</strong>
        <nav style={{ display: 'flex', gap: 6, marginLeft: 20 }}>
          {(['accounts', 'pay', 'investments', 'mortgage', 'security'] as BankTab[]).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{ padding: '8px 12px', borderRadius: 8, background: tab === t ? 'rgba(255,255,255,0.18)' : 'transparent', color: 'white' }}>{t === 'pay' ? 'Pay & Transfer' : t[0].toUpperCase() + t.slice(1)}</button>
          ))}
        </nav>
      </header>

      <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, flex: 1, overflow: 'auto' }}>
        <aside style={{ background: 'white', border: '1px solid #dbe3ee', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Bank profile</div>
          <select value={activeBank} onChange={(e) => setActiveBank(e.target.value as BankName)} style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px solid #cbd5e1' }}>
            {bankOptions.map((b) => <option key={b}>{b}</option>)}
          </select>
          <div style={{ marginTop: 14, fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Accounts</div>
          {currentAccounts.map((a) => (
            <div key={a.id} style={{ marginTop: 8, border: '1px solid #e2e8f0', borderRadius: 10, padding: 10 }}>
              <div style={{ fontWeight: 700 }}>{a.name}</div>
              <div style={{ fontSize: 12, color: '#475569' }}>Routing: {a.routing}</div>
              <div style={{ fontSize: 12, color: '#475569' }}>Account: {a.accountNumber}</div>
              <div style={{ marginTop: 4, color: '#0b4ea2', fontWeight: 700 }}>${a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
          ))}
        </aside>

        <main style={{ background: 'white', border: '1px solid #dbe3ee', borderRadius: 12, padding: 18 }}>
          {tab === 'accounts' && (
            <div>
              <h2 style={{ marginTop: 0 }}>Professional account overview</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Card title="Total Deposits" value={`$${currentAccounts.reduce((a, b) => a + b.balance, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                <Card title="Credit Card Balance" value="$0.00" subtitle="Current cycle paid in full" />
                <Card title="Upcoming Payments" value="$1,240.00" subtitle="Mortgage and utilities" />
              </div>
            </div>
          )}

          {tab === 'pay' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                <h3 style={{ marginTop: 0 }}>Transfer funds</h3>
                <Field label="From">
                  <select value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)} style={inputStyle}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.bank} {a.name}</option>)}</select>
                </Field>
                <Field label="To">
                  <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)} style={inputStyle}>{accounts.filter((a) => a.id !== transferFrom).map((a) => <option key={a.id} value={a.id}>{a.bank} {a.name}</option>)}</select>
                </Field>
                <Field label="Amount"><input value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} placeholder="0.00" /></Field>
                <button type="button" onClick={transfer} style={primaryBtn}>Submit transfer</button>
              </section>

              <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                <h3 style={{ marginTop: 0 }}>Workday payroll destination</h3>
                <p style={{ color: '#475569', fontSize: 13 }}>Add or change where your payroll is deposited by routing and account number.</p>
                <Field label="Routing number"><input value={routing} onChange={(e) => setRouting(e.target.value)} style={inputStyle} /></Field>
                <Field label="Account number"><input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} style={inputStyle} /></Field>
                <button type="button" style={primaryBtn}>Save payroll destination</button>
              </section>
            </div>
          )}

          {tab === 'investments' && <ProfessionalList title="Investments" rows={[['Managed portfolio', '$128,450.44'], ['Retirement (401k rollover)', '$84,203.21'], ['Treasury ladder', '$25,000.00'], ['Dividend income YTD', '$3,120.11']]} />}
          {tab === 'mortgage' && <ProfessionalList title="Mortgage center" rows={[['Current principal', '$482,330.21'], ['Interest rate', '5.87% fixed'], ['Escrow balance', '$4,830.45'], ['Next due date', 'Apr 01, 2026']]} />}
          {tab === 'security' && <ProfessionalList title="Security posture" rows={[['Two-factor authentication', 'Enabled'], ['Account alerts', 'Enabled'], ['Device trust', '4 approved devices'], ['Fraud monitoring', 'Active 24/7']]} />}
        </main>
      </div>
    </div>
  );
}

function Card({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}><div style={{ color: '#64748b', fontSize: 12 }}>{title}</div><div style={{ fontWeight: 800, fontSize: 24, marginTop: 4 }}>{value}</div>{subtitle && <div style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>{subtitle}</div>}</div>;
}

function ProfessionalList({ title, rows }: { title: string; rows: [string, string][] }) {
  return <div><h2 style={{ marginTop: 0 }}>{title}</h2><div style={{ border: '1px solid #e2e8f0', borderRadius: 10 }}>{rows.map((r) => <div key={r[0]} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderBottom: '1px solid #f1f5f9' }}><span>{r[0]}</span><strong>{r[1]}</strong></div>)}</div></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label style={{ display: 'block', marginBottom: 10 }}><div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{label}</div>{children}</label>;
}

const inputStyle: CSSProperties = { width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1' };
const primaryBtn: CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, background: '#0b4ea2', color: 'white', fontWeight: 700 };
