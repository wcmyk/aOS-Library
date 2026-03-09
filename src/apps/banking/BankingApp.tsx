import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';

type Tab = 'pay-bills' | 'quickpay' | 'transfer' | 'activity';

type Account = {
  id: string;
  kind: 'checking' | 'savings' | 'credit' | 'mortgage';
  name: string;
  last4: string;
  routing: string;
  accountNumber: string;
  balance: number;
  available?: number;
};

type Txn = { id: string; date: string; desc: string; amount: number; balance: number; pending?: boolean };

const accounts: Account[] = [
  { id: 'chk', kind: 'checking', name: 'Total Checking', last4: '1666', routing: '021000021', accountNumber: '9448201191', balance: 0, available: 0 },
  { id: 'sav', kind: 'savings', name: 'Chase Savings', last4: '5462', routing: '021000021', accountNumber: '8824193375', balance: 0, available: 0 },
  { id: 'cc-freedom', kind: 'credit', name: 'Freedom Unlimited', last4: '6399', routing: 'N/A', accountNumber: '6399', balance: 0 },
  { id: 'cc-sapphire', kind: 'credit', name: 'Sapphire Reserve', last4: '0077', routing: 'N/A', accountNumber: '0077', balance: 0 },
  { id: 'mort', kind: 'mortgage', name: 'Home Mortgage', last4: '6798', routing: '021000021', accountNumber: '1177392281', balance: 0 },
];

const txns: Txn[] = [
  { id: '1', date: 'Jan 20, 2026', desc: 'Remote Online Deposit', amount: 0, balance: 0 },
  { id: '2', date: 'Jan 19, 2026', desc: 'Trattoria Marco Debit Purchase', amount: 0, balance: 0 },
  { id: '3', date: 'Jan 18, 2026', desc: 'Interest Payment', amount: 0, balance: 0 },
  { id: '4', date: 'Jan 10, 2026', desc: 'Mobile Bill Payment', amount: 0, balance: 0 },
  { id: '5', date: 'Dec 24, 2025', desc: 'Allied Waste Service', amount: 0, balance: 0 },
];

export function BankingApp() {
  const [tab, setTab] = useState<Tab>('activity');
  const [from, setFrom] = useState('chk');
  const [to, setTo] = useState('sav');
  const [amount, setAmount] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const totals = useMemo(() => ({ deposits: accounts.filter((a) => a.kind === 'checking' || a.kind === 'savings').reduce((n, a) => n + a.balance, 0), credit: 0 }), []);

  return (
    <div style={{ height: '100%', background: '#eef2f6', color: '#0f172a', fontFamily: "'Helvetica Neue','Inter',sans-serif", display: 'grid', gridTemplateRows: '52px 50px 1fr' }}>
      <header style={{ background: '#0b65a5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px' }}>
        <div style={{ fontWeight: 700 }}>CHASE</div>
        <div style={{ fontSize: 12 }}>Secure Session</div>
      </header>

      <nav style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #d9e1ea', padding: '0 12px', gap: 8 }}>
        {[
          ['pay-bills', 'Pay bills'],
          ['quickpay', 'Chase QuickPay'],
          ['transfer', 'Transfer money'],
          ['activity', 'Payment activity'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id as Tab)}
            style={{
              padding: '8px 10px',
              borderBottom: tab === id ? '2px solid #0b65a5' : '2px solid transparent',
              color: tab === id ? '#0b65a5' : '#334155',
              fontSize: 12,
              background: 'transparent',
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 10, padding: 10, overflow: 'auto' }}>
        <section style={{ background: 'white', border: '1px solid #d8e0e8' }}>
          <Group title="Bank Accounts">
            <RowAccount name="Total Checking" amount={accounts[0].balance} meta={`Routing ${accounts[0].routing} • Account ${accounts[0].accountNumber}`} />
            <RowAccount name="Chase Savings" amount={accounts[1].balance} meta={`Routing ${accounts[1].routing} • Account ${accounts[1].accountNumber}`} />
          </Group>
          <Group title="Credit Cards">
            <RowAccount name="Freedom" amount={0} meta="Current balance" />
            <RowAccount name="Sapphire" amount={0} meta="Current balance" />
          </Group>
          <Group title="Loans & Lines">
            <RowAccount name="Home Mortgage" amount={0} meta="Monthly payment configured" />
          </Group>
        </section>

        <section style={{ background: 'white', border: '1px solid #d8e0e8', display: 'grid', gridTemplateRows: 'auto auto 1fr' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Metric label="Total deposits" value={`$${totals.deposits.toFixed(2)}`} />
            <Metric label="Credit card balance" value="$0.00" />
            <Metric label="Overdraft protection" value="On" />
          </div>

          {tab === 'transfer' ? (
            <div style={{ padding: 12, borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8 }}>
              <select value={from} onChange={(e) => setFrom(e.target.value)} style={input}>{accounts.filter((a) => a.kind !== 'mortgage').map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              <select value={to} onChange={(e) => setTo(e.target.value)} style={input}>{accounts.filter((a) => a.id !== from && a.kind !== 'mortgage').map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={input} />
              <button type="button" style={{ ...input, background: '#0b65a5', color: 'white', borderColor: '#0b65a5' }} onClick={() => setConfirmation(`Transfer submitted for $${amount || '0.00'}`)}>Submit</button>
            </div>
          ) : (
            <div style={{ padding: 12, borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 12 }}>
              {tab === 'pay-bills' && 'Bill pay center is connected to your checking account.'}
              {tab === 'quickpay' && 'QuickPay is enabled for eligible contacts and vendor profiles.'}
              {tab === 'activity' && 'Showing all transactions'}
              {confirmation && <div style={{ marginTop: 4, color: '#0b65a5' }}>{confirmation}</div>}
            </div>
          )}

          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#64748b' }}>
                  <th style={th}>Date</th><th style={th}>Description</th><th style={th}>Amount</th><th style={th}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <tr key={t.id}>
                    <td style={td}>{t.date}</td>
                    <td style={td}>{t.desc}</td>
                    <td style={td}>${t.amount.toFixed(2)}</td>
                    <td style={td}>${t.balance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return <div style={{ borderBottom: '1px solid #e2e8f0' }}><div style={{ padding: '8px 10px', fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>{title}</div>{children}</div>;
}

function RowAccount({ name, amount, meta }: { name: string; amount: number; meta: string }) {
  return <div style={{ padding: '8px 10px', borderTop: '1px solid #f1f5f9' }}><div style={{ fontSize: 13 }}>{name}</div><div style={{ fontSize: 12, color: '#334155' }}>${amount.toFixed(2)}</div><div style={{ fontSize: 11, color: '#64748b' }}>{meta}</div></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><div style={{ fontSize: 11, color: '#64748b' }}>{label}</div><div style={{ fontWeight: 700 }}>{value}</div></div>;
}

const input: CSSProperties = { padding: '7px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 };
const th: CSSProperties = { textAlign: 'left', padding: '7px 8px', borderBottom: '1px solid #e2e8f0' };
const td: CSSProperties = { padding: '8px', borderBottom: '1px solid #f1f5f9' };
