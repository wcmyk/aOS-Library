import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useCompanyStore } from '../../state/useCompanyStore';

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

const BASE_ACCOUNTS: Account[] = [
  { id: 'chk', kind: 'checking', name: 'Total Checking', last4: '1666', routing: '021000021', accountNumber: '9448201191', balance: 0, available: 0 },
  { id: 'sav', kind: 'savings', name: 'Chase Savings', last4: '5462', routing: '021000021', accountNumber: '8824193375', balance: 0, available: 0 },
  { id: 'cc-freedom', kind: 'credit', name: 'Freedom Unlimited', last4: '6399', routing: 'N/A', accountNumber: '6399', balance: 0 },
  { id: 'cc-sapphire', kind: 'credit', name: 'Sapphire Reserve', last4: '0077', routing: 'N/A', accountNumber: '0077', balance: 0 },
  { id: 'mort', kind: 'mortgage', name: 'Home Mortgage', last4: '6798', routing: '021000021', accountNumber: '1177392281', balance: 0 },
];

export function BankingApp() {
  const employerAccounts = useCompanyStore((s) => s.employerAccounts);
  const [tab, setTab] = useState<Tab>('activity');
  const [from, setFrom] = useState('chk');
  const [to, setTo] = useState('sav');
  const [amount, setAmount] = useState('');
  const [confirmation, setConfirmation] = useState('');

  // Build salary-based transactions from active employer accounts
  const salaryTxns = useMemo<Txn[]>(() => {
    const active = employerAccounts.filter((a) => a.employmentStatus === 'active' || a.employmentStatus === 'onboarding');
    if (active.length === 0) return [];
    const txns: Txn[] = [];
    let runningBalance = 0;
    active.forEach((emp) => {
      const biweekly = Math.round((emp.compensation / 26) * 100) / 100;
      const startDate = new Date(emp.startDate);
      const now = new Date();
      let payDate = new Date(startDate);
      // Generate last 3 paycheck deposits if past start date
      let count = 0;
      while (payDate <= now && count < 3) {
        runningBalance += biweekly;
        txns.push({
          id: `pay-${emp.id}-${count}`,
          date: payDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          desc: `Direct Deposit — ${emp.companyName}`,
          amount: biweekly,
          balance: runningBalance,
        });
        payDate = new Date(payDate.getTime() + 14 * 24 * 60 * 60 * 1000);
        count++;
      }
    });
    return txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [employerAccounts]);

  // Compute checking balance from salary deposits
  const checkingBalance = useMemo(() => {
    return salaryTxns.reduce((sum, t) => sum + t.amount, 0);
  }, [salaryTxns]);

  const accounts = useMemo<Account[]>(() => {
    return BASE_ACCOUNTS.map((a) =>
      a.id === 'chk' ? { ...a, balance: checkingBalance, available: checkingBalance } : a,
    );
  }, [checkingBalance]);

  // All transactions: salary + static placeholders
  const staticTxns: Txn[] = [
    { id: 'static-1', date: 'Jan 20, 2026', desc: 'Trattoria Marco Debit Purchase', amount: -82.5, balance: checkingBalance - 82.5 },
    { id: 'static-2', date: 'Jan 18, 2026', desc: 'Interest Payment', amount: 2.14, balance: checkingBalance - 80.36 },
    { id: 'static-3', date: 'Jan 10, 2026', desc: 'Mobile Bill Payment', amount: -120, balance: checkingBalance - 200.36 },
    { id: 'static-4', date: 'Dec 24, 2025', desc: 'Allied Waste Service', amount: -45, balance: checkingBalance - 245.36 },
  ];
  const allTxns = [...salaryTxns, ...staticTxns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totals = useMemo(() => ({
    deposits: accounts.filter((a) => a.kind === 'checking' || a.kind === 'savings').reduce((n, a) => n + a.balance, 0),
    credit: 0,
  }), [accounts]);

  // Next paycheck info
  const nextPayInfo = useMemo(() => {
    const active = employerAccounts.find((a) => a.employmentStatus === 'active' || a.employmentStatus === 'onboarding');
    if (!active) return null;
    return {
      company: active.companyName,
      amount: Math.round((active.compensation / 26) * 100) / 100,
      annual: active.compensation,
      title: active.title,
    };
  }, [employerAccounts]);

  return (
    <div style={{ height: '100%', background: '#eef2f6', color: '#0f172a', fontFamily: "'Helvetica Neue','Inter',sans-serif", display: 'grid', gridTemplateRows: '52px 50px 1fr' }}>
      <header style={{ background: '#0b65a5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px' }}>
        <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '0.04em' }}>CHASE</div>
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
            <RowAccount name="Freedom Unlimited" amount={0} meta="Current balance" />
            <RowAccount name="Sapphire Reserve" amount={0} meta="Current balance" />
          </Group>
          <Group title="Loans & Lines">
            <RowAccount name="Home Mortgage" amount={0} meta="Monthly payment configured" />
          </Group>
          {nextPayInfo && (
            <Group title="Employment">
              <div style={{ padding: '10px 10px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0b65a5' }}>{nextPayInfo.company}</div>
                <div style={{ fontSize: 11, color: '#334155', marginTop: 2 }}>{nextPayInfo.title}</div>
                <div style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>
                  Annual: <strong>${nextPayInfo.annual.toLocaleString()}</strong>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  Bi-weekly deposit: ${nextPayInfo.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </Group>
          )}
          {!nextPayInfo && (
            <Group title="Employment">
              <div style={{ padding: '10px 10px', fontSize: 11, color: '#94a3b8', borderTop: '1px solid #f1f5f9' }}>
                No active employer accounts. Accept a job offer in Outlook to see payroll details.
              </div>
            </Group>
          )}
        </section>

        <section style={{ background: 'white', border: '1px solid #d8e0e8', display: 'grid', gridTemplateRows: 'auto auto 1fr' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Metric label="Total deposits" value={`$${totals.deposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            <Metric label="Credit card balance" value="$0.00" />
            <Metric label="Overdraft protection" value="On" />
          </div>

          {tab === 'transfer' ? (
            <div style={{ padding: 12, borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8 }}>
              <select value={from} onChange={(e) => setFrom(e.target.value)} style={input}>{accounts.filter((a) => a.kind !== 'mortgage').map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              <select value={to} onChange={(e) => setTo(e.target.value)} style={input}>{accounts.filter((a) => a.id !== from && a.kind !== 'mortgage').map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={input} />
              <button type="button" style={{ ...input, background: '#0b65a5', color: 'white', borderColor: '#0b65a5', cursor: 'pointer' }} onClick={() => setConfirmation(`Transfer submitted for $${amount || '0.00'}`)}>Submit</button>
            </div>
          ) : (
            <div style={{ padding: 12, borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 12 }}>
              {tab === 'pay-bills' && 'Bill pay center is connected to your checking account.'}
              {tab === 'quickpay' && 'QuickPay is enabled for eligible contacts and vendor profiles.'}
              {tab === 'activity' && `Showing all transactions${salaryTxns.length > 0 ? ` including ${salaryTxns.length} payroll deposit(s)` : ''}`}
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
                {allTxns.map((t) => (
                  <tr key={t.id} style={{ background: t.desc.startsWith('Direct Deposit') ? 'rgba(11,101,165,0.04)' : undefined }}>
                    <td style={td}>{t.date}</td>
                    <td style={{ ...td, color: t.desc.startsWith('Direct Deposit') ? '#0b65a5' : undefined }}>
                      {t.desc}
                    </td>
                    <td style={{ ...td, color: t.amount >= 0 ? '#15803d' : '#dc2626' }}>
                      {t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </td>
                    <td style={td}>{t.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                  </tr>
                ))}
                {allTxns.length === 0 && (
                  <tr><td colSpan={4} style={{ ...td, color: '#94a3b8', textAlign: 'center', padding: 24 }}>No transactions yet. Accept a job offer in Outlook to see payroll activity.</td></tr>
                )}
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
  return <div style={{ padding: '8px 10px', borderTop: '1px solid #f1f5f9' }}><div style={{ fontSize: 13 }}>{name}</div><div style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div><div style={{ fontSize: 11, color: '#64748b' }}>{meta}</div></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><div style={{ fontSize: 11, color: '#64748b' }}>{label}</div><div style={{ fontWeight: 700 }}>{value}</div></div>;
}

const input: CSSProperties = { padding: '7px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 };
const th: CSSProperties = { textAlign: 'left', padding: '7px 8px', borderBottom: '1px solid #e2e8f0' };
const td: CSSProperties = { padding: '8px', borderBottom: '1px solid #f1f5f9' };
