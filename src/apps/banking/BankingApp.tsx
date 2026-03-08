import { useState, useMemo } from 'react';
import { useHcmStore } from '../../state/useHcmStore';
import { useMailStore } from '../../state/useMailStore';
import { useProfileStore } from '../../state/useProfileStore';

type BankTab = 'accounts' | 'pay' | 'investments' | 'mortgage' | 'security';
type DarkMode = boolean;

// ── Seed helpers ──────────────────────────────────────────────────────────────

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

// ── Transaction types ─────────────────────────────────────────────────────────

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number; // positive = credit, negative = debit
  category: string;
  pending: boolean;
  balance: number;
};

const MERCHANT_CATEGORIES: Array<{ name: string; category: string; sign: -1 }> = [
  { name: 'Whole Foods Market', category: 'Groceries', sign: -1 },
  { name: 'Amazon.com', category: 'Shopping', sign: -1 },
  { name: 'Netflix', category: 'Entertainment', sign: -1 },
  { name: 'Spotify Premium', category: 'Entertainment', sign: -1 },
  { name: 'Chevron Gas Station', category: 'Gas', sign: -1 },
  { name: 'Shell Gas Station', category: 'Gas', sign: -1 },
  { name: 'Starbucks', category: 'Dining', sign: -1 },
  { name: 'Chipotle Mexican Grill', category: 'Dining', sign: -1 },
  { name: 'Target', category: 'Shopping', sign: -1 },
  { name: 'Costco', category: 'Groceries', sign: -1 },
  { name: 'Apple Services', category: 'Entertainment', sign: -1 },
  { name: 'Google Services', category: 'Entertainment', sign: -1 },
  { name: 'AT&T Wireless', category: 'Utilities', sign: -1 },
  { name: 'PG&E Electric', category: 'Utilities', sign: -1 },
  { name: 'Rent Payment', category: 'Housing', sign: -1 },
  { name: 'Uber Eats', category: 'Dining', sign: -1 },
  { name: 'DoorDash', category: 'Dining', sign: -1 },
  { name: 'Southwest Airlines', category: 'Travel', sign: -1 },
  { name: 'Marriott Hotels', category: 'Travel', sign: -1 },
  { name: 'Gym Membership', category: 'Health', sign: -1 },
];

const AMOUNTS_BY_CATEGORY: Record<string, [number, number]> = {
  Groceries: [45, 180],
  Shopping: [25, 250],
  Entertainment: [9, 35],
  Gas: [35, 90],
  Dining: [12, 65],
  Utilities: [80, 200],
  Housing: [1200, 2500],
  Travel: [150, 650],
  Health: [25, 90],
};

function generateTransactions(salary: number, months = 3): Transaction[] {
  const txns: Transaction[] = [];
  const rng = seeded(strHash('banking' + salary));
  const now = new Date();

  // Bi-weekly payroll deposits
  for (let m = 0; m < months; m++) {
    const payDate1 = new Date(now);
    payDate1.setMonth(now.getMonth() - m);
    payDate1.setDate(1);
    const payDate2 = new Date(payDate1);
    payDate2.setDate(15);
    const netPay = Math.round((salary / 24) * 0.72 * 100) / 100; // biweekly after tax
    txns.push({
      id: `pay-${m}-1`,
      date: payDate1.toISOString().split('T')[0],
      description: 'Direct Deposit — Payroll',
      amount: netPay,
      category: 'Income',
      pending: false,
      balance: 0,
    });
    txns.push({
      id: `pay-${m}-2`,
      date: payDate2.toISOString().split('T')[0],
      description: 'Direct Deposit — Payroll',
      amount: netPay,
      category: 'Income',
      pending: false,
      balance: 0,
    });
  }

  // Regular expenses
  for (let d = 0; d < months * 30; d++) {
    const txnDate = new Date(now);
    txnDate.setDate(now.getDate() - d);
    const numTxns = Math.floor(rng() * 3);
    for (let t = 0; t < numTxns; t++) {
      const merchant = MERCHANT_CATEGORIES[Math.floor(rng() * MERCHANT_CATEGORIES.length)];
      const [min, max] = AMOUNTS_BY_CATEGORY[merchant.category] ?? [20, 80];
      const amount = -(min + Math.floor(rng() * (max - min)));
      txns.push({
        id: `txn-${d}-${t}`,
        date: txnDate.toISOString().split('T')[0],
        description: merchant.name,
        amount,
        category: merchant.category,
        pending: d === 0 && t === 0,
        balance: 0,
      });
    }
  }

  // Sort descending by date
  txns.sort((a, b) => b.date.localeCompare(a.date));

  // Calculate running balance
  let runningBalance = 12450.88;
  return txns.map((t) => {
    const bal = runningBalance;
    runningBalance -= t.amount; // in reverse order
    return { ...t, balance: bal };
  });
}

// ── Chart components ──────────────────────────────────────────────────────────

function SpendingDonut({ transactions, dark }: { transactions: Transaction[]; dark: DarkMode }) {
  const byCategory: Record<string, number> = {};
  for (const t of transactions) {
    if (t.amount < 0) {
      byCategory[t.category] = (byCategory[t.category] ?? 0) + Math.abs(t.amount);
    }
  }
  const total = Object.values(byCategory).reduce((a, b) => a + b, 0);
  const COLORS = ['#1a6abf', '#2e8cdf', '#4aa8f5', '#0055a5', '#003b7a', '#6ec6ff', '#ff6b35', '#4caf50'];
  const entries = Object.entries(byCategory).slice(0, 8);
  let cumulative = 0;
  const segments = entries.map(([cat, val], i) => {
    const pct = val / total;
    const startAngle = cumulative * 360;
    const sweep = pct * 360;
    cumulative += pct;
    return { cat, val, pct, startAngle, sweep, color: COLORS[i % COLORS.length] };
  });

  return (
    <div className={`bank-donut-wrap ${dark ? 'dark' : 'light'}`}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        {segments.map((seg) => {
          const r = 55;
          const cx = 70;
          const cy = 70;
          const startRad = ((seg.startAngle - 90) * Math.PI) / 180;
          const endRad = ((seg.startAngle + seg.sweep - 90) * Math.PI) / 180;
          const x1 = cx + r * Math.cos(startRad);
          const y1 = cy + r * Math.sin(startRad);
          const x2 = cx + r * Math.cos(endRad);
          const y2 = cy + r * Math.sin(endRad);
          const largeArc = seg.sweep > 180 ? 1 : 0;
          const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          return <path key={seg.cat} d={d} fill={seg.color} opacity={0.9} />;
        })}
        <circle cx="70" cy="70" r="35" fill={dark ? '#1a2332' : '#ffffff'} />
        <text x="70" y="66" textAnchor="middle" fontSize="10" fill={dark ? '#94a3b8' : '#64748b'}>Spent</text>
        <text x="70" y="80" textAnchor="middle" fontSize="12" fontWeight="700" fill={dark ? '#e2e8f0' : '#1e293b'}>${total.toFixed(0)}</text>
      </svg>
      <div className="bank-donut-legend">
        {segments.map((seg) => (
          <div key={seg.cat} className="bank-legend-item">
            <span className="bank-legend-dot" style={{ background: seg.color }} />
            <span className="bank-legend-label">{seg.cat}</span>
            <span className="bank-legend-val">${seg.val.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Account card ──────────────────────────────────────────────────────────────

type Account = {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  balance: number;
  available: number;
  last4: string;
  color: string;
};

// ── Main component ────────────────────────────────────────────────────────────

export function BankingApp() {
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState<BankTab>('accounts');
  const [selectedAccount, setSelectedAccount] = useState<string>('checking');
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferFrom, setTransferFrom] = useState('checking');
  const [transferTo, setTransferTo] = useState('savings');
  const [transferDone, setTransferDone] = useState(false);
  const [txnSearch, setTxnSearch] = useState('');
  const [txnFilter, setTxnFilter] = useState<string>('all');

  const { fullName } = useProfileStore();
  const emails = useMailStore((s) => s.emails);
  const payStubs = useHcmStore((s) => s.payStubs);
  const employees = useHcmStore((s) => s.employees);

  // Get salary from accepted job or HCM
  const acceptedJobMeta = useMemo(() => emails.find((e) => e.jobMeta?.stage === 'onboarding')?.jobMeta, [emails]);
  const annualSalary = useMemo(() => {
    if (acceptedJobMeta?.compensation && acceptedJobMeta.compensation > 0) return acceptedJobMeta.compensation;
    const emp = employees[0];
    if (emp?.baseSalaryUSD) return emp.baseSalaryUSD;
    return 95000;
  }, [acceptedJobMeta, employees]);

  const transactions = useMemo(() => generateTransactions(annualSalary, 3), [annualSalary]);

  const accounts: Account[] = [
    {
      id: 'checking',
      name: 'Chase Total Checking®',
      type: 'checking',
      balance: 12450.88,
      available: 12450.88,
      last4: '4821',
      color: '#1a6abf',
    },
    {
      id: 'savings',
      name: 'Chase Savings℠',
      type: 'savings',
      balance: 34200.0,
      available: 34200.0,
      last4: '2094',
      color: '#0a4f99',
    },
    {
      id: 'credit',
      name: 'Chase Freedom Unlimited®',
      type: 'credit',
      balance: -1842.5,
      available: 12157.5,
      last4: '8836',
      color: '#003b7a',
    },
  ];

  const selectedAcc = accounts.find((a) => a.id === selectedAccount) ?? accounts[0];

  const filteredTxns = useMemo(() => {
    return transactions.filter((t) => {
      if (txnFilter !== 'all' && t.category.toLowerCase() !== txnFilter.toLowerCase()) return false;
      if (txnSearch.trim()) {
        const q = txnSearch.toLowerCase();
        return t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [transactions, txnFilter, txnSearch]);

  const categories = useMemo(() => {
    const cats = new Set(transactions.map((t) => t.category));
    return ['all', ...Array.from(cats)];
  }, [transactions]);

  // Pay stubs from Workday
  const recentPayStubs = payStubs.slice(0, 6);

  const bg = dark ? '#0f1623' : '#f0f4f8';
  const surface = dark ? '#1a2332' : '#ffffff';
  const surfaceAlt = dark ? '#1e2d42' : '#f8fafc';
  const border = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const text = dark ? '#e2e8f0' : '#1e293b';
  const textMuted = dark ? '#94a3b8' : '#64748b';
  const accent = '#1a6abf';

  return (
    <div className="bank-shell" style={{ background: bg, color: text, height: '100%', display: 'flex', flexDirection: 'column', fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <header className="bank-header" style={{ background: accent, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 16, height: 56, flexShrink: 0 }}>
        <div className="bank-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="white" opacity="0.15" />
            <text x="16" y="22" textAnchor="middle" fontSize="18" fontWeight="900" fill="white">⬡</text>
          </svg>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>Chase</span>
        </div>
        <nav style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {(['accounts', 'pay', 'investments', 'mortgage', 'security'] as BankTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                background: tab === t ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white',
                fontSize: 13,
                fontWeight: tab === t ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {t === 'pay' ? 'Pay & Transfer' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 8 }}>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{fullName || 'Account Holder'}</span>
          <button
            type="button"
            onClick={() => setDark(!dark)}
            style={{
              padding: '5px 12px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              fontSize: 12,
              border: '1px solid rgba(255,255,255,0.25)',
              cursor: 'pointer',
            }}
          >
            {dark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{ width: 240, background: surface, borderRight: `1px solid ${border}`, display: 'flex', flexDirection: 'column', overflow: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '16px 16px 8px', fontSize: 11, fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>My Accounts</div>
          {accounts.map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => { setSelectedAccount(acc.id); setTab('accounts'); }}
              style={{
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                background: selectedAccount === acc.id && tab === 'accounts' ? `${accent}18` : 'transparent',
                borderLeft: selectedAccount === acc.id && tab === 'accounts' ? `3px solid ${accent}` : '3px solid transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: text }}>{acc.name}</span>
              <span style={{ fontSize: 12, color: textMuted }}>···· {acc.last4}</span>
              <span style={{
                fontSize: 15,
                fontWeight: 700,
                color: acc.balance < 0 ? '#ef4444' : accent,
              }}>
                {acc.balance < 0 ? '-' : ''}${Math.abs(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </button>
          ))}

          <div style={{ margin: '16px 16px 8px', borderTop: `1px solid ${border}` }} />
          <div style={{ padding: '0 16px 8px', fontSize: 11, fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Actions</div>
          {[
            { label: 'Pay a Bill', icon: '🏦' },
            { label: 'Send Money', icon: '💸' },
            { label: 'Request Money', icon: '📩' },
            { label: 'ATM / Branch', icon: '📍' },
          ].map((action) => (
            <button
              key={action.label}
              type="button"
              style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: text, fontSize: 13 }}
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}

          <div style={{ margin: '16px 16px 8px', borderTop: `1px solid ${border}` }} />
          <div style={{ padding: '12px 16px', fontSize: 12, color: textMuted }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: text }}>Workday Pay Sync</div>
            <div style={{ color: '#22c55e', fontWeight: 600 }}>✓ Connected</div>
            <div style={{ marginTop: 4 }}>Salary: ${annualSalary.toLocaleString()}/yr</div>
            <div style={{ marginTop: 2 }}>Next pay: {new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'auto', padding: 0 }}>
          {/* ── Accounts tab ── */}
          {tab === 'accounts' && (
            <div style={{ padding: 24 }}>
              {/* Account hero card */}
              <div style={{
                background: `linear-gradient(135deg, ${selectedAcc.color}, #0a4f99)`,
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'absolute', bottom: -30, right: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>{selectedAcc.name}</div>
                <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>
                  {selectedAcc.balance < 0 ? '-' : ''}${Math.abs(selectedAcc.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
                  {selectedAcc.type === 'credit' ? `Available Credit: $${selectedAcc.available.toLocaleString()}` : `Available Balance: $${selectedAcc.available.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => { setShowTransfer(true); setTransferFrom(selectedAcc.id); }}
                    style={{ padding: '8px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Transfer
                  </button>
                  <button
                    type="button"
                    style={{ padding: '8px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Pay Bill
                  </button>
                  <span style={{ marginLeft: 'auto', opacity: 0.7, fontSize: 13 }}>···· {selectedAcc.last4}</span>
                </div>
              </div>

              {/* Spending chart */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <div style={{ background: surface, borderRadius: 12, padding: 20, border: `1px solid ${border}` }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Spending Breakdown</div>
                  <SpendingDonut transactions={transactions} dark={dark} />
                </div>
                <div style={{ background: surface, borderRadius: 12, padding: 20, border: `1px solid ${border}` }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Account Summary</div>
                  {accounts.map((acc) => (
                    <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${border}` }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{acc.name}</div>
                        <div style={{ fontSize: 11, color: textMuted }}>···· {acc.last4}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: acc.balance < 0 ? '#ef4444' : '#22c55e', fontSize: 14 }}>
                        {acc.balance < 0 ? '-' : '+'}${Math.abs(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                  <div style={{ paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>Net Worth (Bank)</span>
                    <span style={{ color: accent }}>${(accounts.reduce((s, a) => s + a.balance, 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Transactions */}
              <div style={{ background: surface, borderRadius: 12, border: `1px solid ${border}` }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>Recent Transactions</div>
                  <input
                    placeholder="Search transactions…"
                    value={txnSearch}
                    onChange={(e) => setTxnSearch(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${border}`, background: surfaceAlt, color: text, fontSize: 13, width: 180 }}
                  />
                  <select
                    value={txnFilter}
                    onChange={(e) => setTxnFilter(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${border}`, background: surfaceAlt, color: text, fontSize: 13 }}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  {filteredTxns.slice(0, 30).map((txn) => (
                    <div
                      key={txn.id}
                      style={{
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        borderBottom: `1px solid ${border}`,
                        opacity: txn.pending ? 0.7 : 1,
                      }}
                    >
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: txn.amount > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(26,106,191,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        flexShrink: 0,
                      }}>
                        {txn.amount > 0 ? '💰' : txn.category === 'Groceries' ? '🛒' : txn.category === 'Dining' ? '🍽️' : txn.category === 'Gas' ? '⛽' : txn.category === 'Entertainment' ? '🎬' : txn.category === 'Travel' ? '✈️' : txn.category === 'Housing' ? '🏠' : txn.category === 'Utilities' ? '⚡' : '💳'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{txn.description}</div>
                        <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>
                          {txn.date} · {txn.category}
                          {txn.pending && <span style={{ marginLeft: 8, color: '#f59e0b', fontWeight: 600 }}>Pending</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: txn.amount > 0 ? '#22c55e' : text }}>
                          {txn.amount > 0 ? '+' : '-'}${Math.abs(txn.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: 11, color: textMuted }}>${txn.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Pay & Transfer tab ── */}
          {tab === 'pay' && (
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Pay & Transfer</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Transfer */}
                <div style={{ background: surface, borderRadius: 12, padding: 24, border: `1px solid ${border}` }}>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Transfer Money</div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 6, fontWeight: 600 }}>From Account</label>
                    <select
                      value={transferFrom}
                      onChange={(e) => setTransferFrom(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: surfaceAlt, color: text, fontSize: 14 }}
                    >
                      {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} (···· {a.last4})</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 6, fontWeight: 600 }}>To Account</label>
                    <select
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: surfaceAlt, color: text, fontSize: 14 }}
                    >
                      {accounts.filter((a) => a.id !== transferFrom).map((a) => <option key={a.id} value={a.id}>{a.name} (···· {a.last4})</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 12, color: textMuted, marginBottom: 6, fontWeight: 600 }}>Amount</label>
                    <input
                      type="number"
                      placeholder="$0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: surfaceAlt, color: text, fontSize: 14 }}
                    />
                  </div>
                  {transferDone ? (
                    <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.12)', color: '#22c55e', fontWeight: 600, fontSize: 14 }}>
                      ✓ Transfer of ${transferAmount} submitted successfully
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { if (transferAmount) { setTransferDone(true); setTimeout(() => setTransferDone(false), 4000); } }}
                      style={{ width: '100%', padding: '12px', borderRadius: 10, background: accent, color: 'white', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                    >
                      Transfer Now
                    </button>
                  )}
                </div>

                {/* Pay History from Workday */}
                <div style={{ background: surface, borderRadius: 12, padding: 24, border: `1px solid ${border}` }}>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Workday Pay History</div>
                  {recentPayStubs.length > 0 ? recentPayStubs.map((stub) => (
                    <div key={stub.id} style={{ padding: '12px 0', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Direct Deposit</div>
                        <div style={{ fontSize: 11, color: textMuted }}>{stub.payDate}</div>
                        <div style={{ fontSize: 11, color: textMuted }}>Gross: ${stub.grossUSD.toLocaleString()} · Tax: ${stub.deductionsUSD.toLocaleString()}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#22c55e', fontSize: 15 }}>+${stub.netUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                  )) : (
                    <div>
                      {transactions.filter((t) => t.category === 'Income').slice(0, 6).map((t) => (
                        <div key={t.id} style={{ padding: '12px 0', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{t.description}</div>
                            <div style={{ fontSize: 11, color: textMuted }}>{t.date}</div>
                          </div>
                          <div style={{ fontWeight: 700, color: '#22c55e', fontSize: 15 }}>+${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 12, padding: '10px 0', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: textMuted }}>
                    <span>Annual Salary (Workday)</span>
                    <span style={{ color: accent, fontWeight: 700 }}>${annualSalary.toLocaleString()}</span>
                  </div>
                  {acceptedJobMeta && (
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: `${accent}12`, marginTop: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: accent }}>{acceptedJobMeta.role} @ {acceptedJobMeta.company}</div>
                      <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{acceptedJobMeta.salary}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Investments tab ── */}
          {tab === 'investments' && (
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>J.P. Morgan Investments</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                  { name: 'Total Portfolio', value: '$142,830.44', change: '+12.4%', up: true },
                  { name: 'Today\'s Return', value: '+$284.22', change: '+0.20%', up: true },
                  { name: 'Total Return', value: '+$18,430.44', change: '+14.82%', up: true },
                ].map((stat) => (
                  <div key={stat.name} style={{ background: surface, borderRadius: 12, padding: 20, border: `1px solid ${border}` }}>
                    <div style={{ fontSize: 12, color: textMuted, marginBottom: 8 }}>{stat.name}</div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{stat.value}</div>
                    <div style={{ fontSize: 13, color: stat.up ? '#22c55e' : '#ef4444', fontWeight: 600, marginTop: 4 }}>{stat.change}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: surface, borderRadius: 12, padding: 20, border: `1px solid ${border}` }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Holdings</div>
                {[
                  { symbol: 'AAPL', name: 'Apple Inc.', shares: 12, price: 189.42, change: 1.2 },
                  { symbol: 'MSFT', name: 'Microsoft Corp.', shares: 8, price: 415.20, change: 0.8 },
                  { symbol: 'GOOGL', name: 'Alphabet Inc.', shares: 5, price: 178.54, change: -0.3 },
                  { symbol: 'NVDA', name: 'NVIDIA Corp.', shares: 10, price: 875.38, change: 3.1 },
                  { symbol: 'AMZN', name: 'Amazon.com Inc.', shares: 6, price: 190.22, change: 0.5 },
                  { symbol: 'VTI', name: 'Vanguard Total Mkt ETF', shares: 50, price: 244.18, change: 0.4 },
                ].map((h) => (
                  <div key={h.symbol} style={{ padding: '12px 0', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: accent }}>{h.symbol}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{h.name}</div>
                      <div style={{ fontSize: 11, color: textMuted }}>{h.shares} shares · ${h.price.toFixed(2)}/sh</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>${(h.shares * h.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                      <div style={{ fontSize: 12, color: h.change >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{h.change >= 0 ? '+' : ''}{h.change}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Mortgage tab ── */}
          {tab === 'mortgage' && (
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Mortgage & Home Lending</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ background: surface, borderRadius: 12, padding: 24, border: `1px solid ${border}` }}>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Current Mortgage</div>
                  {[
                    { label: 'Loan Balance', value: '$342,450.00' },
                    { label: 'Monthly Payment', value: '$1,892.00' },
                    { label: 'Interest Rate', value: '6.85% Fixed' },
                    { label: 'Loan Type', value: '30-Year Fixed' },
                    { label: 'Next Payment', value: `${new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` },
                    { label: 'Payoff Date', value: 'March 2051' },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${border}` }}>
                      <span style={{ fontSize: 13, color: textMuted }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: surface, borderRadius: 12, padding: 24, border: `1px solid ${border}` }}>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Home Equity</div>
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: accent }}>$157,550</div>
                    <div style={{ fontSize: 13, color: textMuted, marginTop: 8 }}>Estimated Home Equity</div>
                    <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 600, marginTop: 4 }}>Home Value: $500,000</div>
                    <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>LTV: 68.5%</div>
                  </div>
                  <button type="button" style={{ width: '100%', padding: 12, borderRadius: 10, background: accent, color: 'white', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: 12 }}>
                    Apply for HELOC
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Security tab ── */}
          {tab === 'security' && (
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Security Center</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {[
                  { title: 'Two-Factor Authentication', status: 'Enabled', icon: '🔐', color: '#22c55e' },
                  { title: 'Face ID / Biometrics', status: 'Enabled', icon: '👤', color: '#22c55e' },
                  { title: 'Account Alerts', status: 'Enabled', icon: '🔔', color: '#22c55e' },
                  { title: 'Paperless Statements', status: 'Enabled', icon: '📄', color: '#22c55e' },
                  { title: 'Card Controls', status: 'Active', icon: '💳', color: accent },
                  { title: 'Travel Notice', status: 'Not Set', icon: '✈️', color: '#f59e0b' },
                ].map((item) => (
                  <div key={item.title} style={{ background: surface, borderRadius: 12, padding: 20, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 28 }}>{item.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: item.color, fontWeight: 600, marginTop: 4 }}>{item.status}</div>
                    </div>
                    <button type="button" style={{ padding: '6px 14px', borderRadius: 8, background: `${accent}20`, color: accent, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      Manage
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Transfer Modal */}
      {showTransfer && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: surface, borderRadius: 16, padding: 32, width: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Quick Transfer</div>
            <button type="button" onClick={() => setShowTransfer(false)} style={{ position: 'absolute', top: 'calc(50% - 120px)', right: 'calc(50% - 210px + 16px)', background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: textMuted }}>✕</button>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: textMuted, display: 'block', marginBottom: 6 }}>Amount</label>
              <input
                type="number"
                placeholder="$0.00"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: 10, border: `1px solid ${border}`, background: surfaceAlt, color: text, fontSize: 16, fontWeight: 700 }}
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => { if (transferAmount) { setTransferDone(true); setShowTransfer(false); setTimeout(() => setTransferDone(false), 4000); } }}
              style={{ width: '100%', padding: '14px', borderRadius: 12, background: accent, color: 'white', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              Transfer ${transferAmount || '0.00'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
