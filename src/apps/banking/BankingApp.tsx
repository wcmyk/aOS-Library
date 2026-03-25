import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useCompanyStore } from '../../state/useCompanyStore';

type Tab = 'activity' | 'transfer' | 'cards';

type Account = {
  id: string;
  kind: 'checking' | 'savings' | 'credit' | 'mortgage' | 'income';
  name: string;
  last4: string;
  routing: string;
  accountNumber: string;
  balance: number;
  available?: number;
};

type Txn = { id: string; accountId: string; date: string; desc: string; amount: number; balance: number };

type UserCard = { id: string; network: 'Visa' | 'Mastercard' | 'Debit'; holder: string; number: string; cvv: string; expiry: string; linkedAccount: string };

const BASE_ACCOUNTS: Account[] = [
  { id: 'chk', kind: 'checking', name: 'Total Checking', last4: '1666', routing: '021000021', accountNumber: '9448201191', balance: 0, available: 0 },
  { id: 'sav', kind: 'savings', name: 'Chase Savings', last4: '5462', routing: '021000021', accountNumber: '8824193375', balance: 0, available: 0 },
  { id: 'cc-freedom', kind: 'credit', name: 'Freedom Unlimited', last4: '6399', routing: 'N/A', accountNumber: '6399', balance: 0 },
  { id: 'cc-sapphire', kind: 'credit', name: 'Sapphire Reserve', last4: '0077', routing: 'N/A', accountNumber: '0077', balance: 0 },
  { id: 'mort', kind: 'mortgage', name: 'Home Mortgage', last4: '6798', routing: '021000021', accountNumber: '1177392281', balance: 0 },
];

const CARDS: UserCard[] = [
  { id: 'card-1', network: 'Visa', holder: 'AOS USER', number: '4138521900016399', cvv: '218', expiry: '03/29', linkedAccount: 'Freedom Unlimited' },
  { id: 'card-2', network: 'Mastercard', holder: 'AOS USER', number: '5424001109870077', cvv: '605', expiry: '11/30', linkedAccount: 'Sapphire Reserve' },
  { id: 'card-3', network: 'Debit', holder: 'AOS USER', number: '4213670041231666', cvv: '114', expiry: '08/28', linkedAccount: 'Total Checking' },
];

const shortCompany = (name: string) => name.split(/\s+/).map((p) => p[0]).join('').slice(0, 5).toUpperCase();
const maskCard = (value: string) => `•••• •••• •••• ${value.slice(-4)}`;

export function BankingApp() {
  const employerAccounts = useCompanyStore((s) => s.employerAccounts);
  const [tab, setTab] = useState<Tab>('activity');
  const [from, setFrom] = useState('chk');
  const [to, setTo] = useState('sav');
  const [amount, setAmount] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('chk');

  const activeEmployment = employerAccounts.filter((a) => a.employmentStatus === 'active' || a.employmentStatus === 'onboarding');

  const salaryTxns = useMemo<Txn[]>(() => {
    if (activeEmployment.length === 0) return [];
    const txns: Txn[] = [];
    activeEmployment.forEach((emp, index) => {
      const biweekly = Math.round((emp.compensation / 26) * 100) / 100;
      const startDate = new Date(emp.startDate);
      const now = new Date();
      let payDate = new Date(startDate);
      let runningBalance = 0;
      let count = 0;
      const accountId = `income-${emp.id}`;
      while (payDate <= now && count < 4) {
        runningBalance += biweekly;
        txns.push({
          id: `pay-${emp.id}-${count}`,
          accountId,
          date: payDate.toISOString(),
          desc: `Direct Deposit — ${shortCompany(emp.companyName)} Payroll`,
          amount: biweekly,
          balance: runningBalance,
        });
        payDate = new Date(payDate.getTime() + (14 + index % 2) * 24 * 60 * 60 * 1000);
        count++;
      }
    });
    return txns;
  }, [activeEmployment]);

  const payrollAccounts = useMemo<Account[]>(() => activeEmployment.map((emp) => {
    const accountId = `income-${emp.id}`;
    const accountTxns = salaryTxns.filter((t) => t.accountId === accountId);
    const balance = accountTxns.reduce((sum, t) => sum + t.amount, 0);
    const label = `${shortCompany(emp.companyName)} Income`;
    return {
      id: accountId,
      kind: 'income',
      name: label,
      last4: emp.employeeId.slice(-4),
      routing: 'PAYROLL',
      accountNumber: emp.employeeId,
      balance,
      available: balance,
    };
  }), [activeEmployment, salaryTxns]);

  const checkingBalance = payrollAccounts.reduce((sum, p) => sum + p.balance, 0);

  const accounts = useMemo<Account[]>(() => ([
    ...BASE_ACCOUNTS.map((a) => a.id === 'chk' ? { ...a, balance: checkingBalance, available: checkingBalance } : a),
    ...payrollAccounts,
  ]), [checkingBalance, payrollAccounts]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? accounts[0];
  const accountTxns = salaryTxns.filter((t) => t.accountId === selectedAccount.id).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

  const totals = useMemo(() => ({
    deposits: accounts.filter((a) => a.kind === 'checking' || a.kind === 'savings' || a.kind === 'income').reduce((n, a) => n + a.balance, 0),
    credit: 0,
  }), [accounts]);

  return (
    <div style={{ height: '100%', background: '#eef2f6', color: '#0f172a', fontFamily: "'Helvetica Neue','Inter',sans-serif", display: 'grid', gridTemplateRows: '52px 50px 1fr' }}>
      <header style={{ background: '#0b65a5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px' }}>
        <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '0.04em' }}>CHASE</div>
        <div style={{ fontSize: 12 }}>Secure Session</div>
      </header>

      <nav style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #d9e1ea', padding: '0 12px', gap: 8 }}>
        {[
          ['activity', 'Account activity'],
          ['transfer', 'Transfer money'],
          ['cards', 'Manage your Cards'],
        ].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id as Tab)} style={{ padding: '8px 10px', borderBottom: tab === id ? '2px solid #0b65a5' : '2px solid transparent', color: tab === id ? '#0b65a5' : '#334155', fontSize: 12, background: 'transparent' }}>
            {label}
          </button>
        ))}
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 10, padding: 10, overflow: 'auto' }}>
        <section style={{ background: 'white', border: '1px solid #d8e0e8' }}>
          <Group title="Accounts">
            {accounts.map((a) => (
              <button key={a.id} type="button" onClick={() => setSelectedAccountId(a.id)} style={{ width: '100%', textAlign: 'left', background: selectedAccountId === a.id ? '#eff6ff' : 'transparent', border: 'none', cursor: 'pointer' }}>
                <RowAccount name={a.name} amount={a.balance} meta={`${a.routing} • ****${a.last4}`} />
              </button>
            ))}
          </Group>
        </section>

        <section style={{ background: 'white', border: '1px solid #d8e0e8', display: 'grid', gridTemplateRows: 'auto auto 1fr' }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Metric label="Total deposits" value={`$${totals.deposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            <Metric label="Selected account" value={selectedAccount?.name ?? 'N/A'} />
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
              {tab === 'activity' && `Viewing ${selectedAccount?.name ?? 'account'} activity.`}
              {tab === 'cards' && 'Secure card details and virtual controls.'}
              {confirmation && <div style={{ marginTop: 4, color: '#0b65a5' }}>{confirmation}</div>}
            </div>
          )}

          <div style={{ overflow: 'auto' }}>
            {tab === 'cards' ? (
              <div style={{ padding: 16, display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
                {CARDS.map((card) => (
                  <div key={card.id} style={{ borderRadius: 20, padding: 16, minHeight: 160, background: 'linear-gradient(130deg,#0b1f3a,#0b65a5 58%,#38bdf8)', color: 'white', boxShadow: '0 12px 30px rgba(2,6,23,.22)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{card.network}</strong><span style={{ opacity: .8, fontSize: 12 }}>{card.linkedAccount}</span></div>
                    <div style={{ marginTop: 28, letterSpacing: '.16em', fontSize: 16 }}>{maskCard(card.number)}</div>
                    <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span>{card.holder}</span><span>EXP {card.expiry}</span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, opacity: .9 }}>CVV {card.cvv}</div>
                  </div>
                ))}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b' }}>
                    <th style={th}>Date</th><th style={th}>Description</th><th style={th}>Amount</th><th style={th}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {accountTxns.map((t) => (
                    <tr key={t.id} style={{ background: 'rgba(11,101,165,0.04)' }}>
                      <td style={td}>{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td style={{ ...td, color: '#0b65a5' }}>{t.desc}</td>
                      <td style={{ ...td, color: '#15803d' }}>+{t.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                      <td style={td}>{t.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                    </tr>
                  ))}
                  {accountTxns.length === 0 && (
                    <tr><td colSpan={4} style={{ ...td, color: '#94a3b8', textAlign: 'center', padding: 24 }}>No transactions for this account yet.</td></tr>
                  )}
                </tbody>
              </table>
            )}
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
