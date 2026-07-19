import { useMemo, useState, type ReactNode } from 'react';
import { useCompanyStore } from '../../state/useCompanyStore';
import { useProfileStore } from '../../state/useProfileStore';
import { useDevStore, subscriptionCharges } from '../../state/useDevStore';
import { VisaWordmark, ChaseOctagon } from '../../data/brands';
import './banking.css';

type Tab = 'accounts' | 'transfer' | 'wallet';

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

const BASE_ACCOUNTS: Account[] = [
  { id: 'chk', kind: 'checking', name: 'Chase Total Checking', last4: '1666', routing: '021000021', accountNumber: '9448201191', balance: 0, available: 0 },
  { id: 'sav', kind: 'savings', name: 'Chase Savings', last4: '5462', routing: '021000021', accountNumber: '8824193375', balance: 0, available: 0 },
  { id: 'cc-freedom', kind: 'credit', name: 'Freedom Unlimited', last4: '6399', routing: 'N/A', accountNumber: '6399', balance: 0 },
  { id: 'cc-sapphire', kind: 'credit', name: 'Sapphire Reserve', last4: '0077', routing: 'N/A', accountNumber: '0077', balance: 0 },
  { id: 'mort', kind: 'mortgage', name: 'Home Mortgage', last4: '6798', routing: '021000021', accountNumber: '1177392281', balance: 0 },
];

const shortCompany = (name: string) => name.split(/\s+/).map((p) => p[0]).join('').slice(0, 5).toUpperCase();

// ── Card art primitives ───────────────────────────────────────────────────────

function EmvChip({ light = false }: { light?: boolean }) {
  const stroke = light ? 'rgba(60,60,60,0.55)' : 'rgba(40,40,40,0.5)';
  return (
    <svg className="chb-chip" width="46" height="36" viewBox="0 0 46 36">
      <defs>
        <linearGradient id="chipGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e8e6e1" />
          <stop offset="0.5" stopColor="#c8c6c0" />
          <stop offset="1" stopColor="#f0efec" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="44" height="34" rx="6" fill="url(#chipGrad)" stroke={stroke} strokeWidth="1" />
      <path d="M1 13h14M1 23h14M31 13h14M31 23h14M15 13v-6M15 23v6M31 13v-6M31 23v6M15 13h16v10H15z" fill="none" stroke={stroke} strokeWidth="1" />
    </svg>
  );
}

function Contactless({ color = 'rgba(255,255,255,0.85)' }: { color?: string }) {
  return (
    <svg width="22" height="24" viewBox="0 0 22 24">
      {[4, 9, 14, 19].map((r, i) => (
        <path key={i} d={`M${2 + i * 2} ${12 - r / 1.4} a ${r} ${r} 0 0 1 0 ${r * 1.43}`} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      ))}
    </svg>
  );
}

// ── Card definitions ──────────────────────────────────────────────────────────

type WalletCard = {
  id: string;
  className: string;
  bank: ReactNode;
  product: ReactNode;
  network: ReactNode;
  holder: string;
  last4: string;
  expiry: string;
  linked: string;
  lightChip?: boolean;
  darkText?: boolean;
};

function buildWallet(holder: string): WalletCard[] {
  const h = holder.toUpperCase();
  return [
    {
      id: 'sapphire',
      className: 'chb-card-sapphire',
      bank: <span className="chb-bankmark"><span style={{ fontWeight: 700, letterSpacing: '0.08em' }}>CHASE</span> <ChaseOctagon size={16} /></span>,
      product: <div className="chb-product-stack"><span>SAPPHIRE</span><span className="chb-product-sub">RESERVE</span></div>,
      network: <div className="chb-network-stack"><VisaWordmark height={22} /><span className="chb-network-tier">Infinite</span></div>,
      holder: h, last4: '0077', expiry: '11/30', linked: 'Sapphire Reserve',
    },
    {
      id: 'freedom',
      className: 'chb-card-freedom',
      bank: <span className="chb-bankmark"><span style={{ fontWeight: 700, letterSpacing: '0.08em' }}>CHASE</span> <ChaseOctagon size={16} /></span>,
      product: <div className="chb-product-stack"><span>FREEDOM</span><span className="chb-product-sub">UNLIMITED</span></div>,
      network: <div className="chb-network-stack"><VisaWordmark height={22} /><span className="chb-network-tier">Signature</span></div>,
      holder: h, last4: '6399', expiry: '03/29', linked: 'Freedom Unlimited',
    },
    {
      id: 'debit',
      className: 'chb-card-debit',
      bank: <span className="chb-bankmark"><span style={{ fontWeight: 700, letterSpacing: '0.08em' }}>CHASE</span> <ChaseOctagon size={16} /></span>,
      product: <div className="chb-product-stack"><span style={{ fontSize: 12, letterSpacing: '0.16em' }}>TOTAL CHECKING</span><span className="chb-product-sub">DEBIT</span></div>,
      network: <div className="chb-network-stack"><VisaWordmark height={22} /><span className="chb-network-tier">Debit</span></div>,
      holder: h, last4: '1666', expiry: '08/28', linked: 'Total Checking',
    },
  ];
}

function CardArt({ card }: { card: WalletCard }) {
  return (
    <div className={`chb-card ${card.className}`}>
      <div className="chb-card-sheen" />
      <div className="chb-card-top">
        {card.bank}
        {card.product}
      </div>
      <div className="chb-card-mid">
        <EmvChip light={card.lightChip} />
        <Contactless color={card.darkText ? 'rgba(60,60,60,0.6)' : 'rgba(255,255,255,0.85)'} />
      </div>
      <div className="chb-card-bottom">
        <div className="chb-card-holder">
          <span className="chb-card-number">•••• {card.last4}</span>
          <span className="chb-card-name">{card.holder}</span>
        </div>
        <div className="chb-card-netwrap">{card.network}</div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BankingApp() {
  const employerAccounts = useCompanyStore((s) => s.employerAccounts);
  const profileName = useProfileStore((s) => s.fullName);
  const cashAdjustment = useDevStore((s) => s.cashAdjustment);
  const subscriptions = useDevStore((s) => s.subscriptions);
  const bankTransfers = useDevStore((s) => s.bankTransfers);
  const cardCharges = useDevStore((s) => s.cardCharges);
  const addTransfer = useDevStore((s) => s.addTransfer);
  const payCard = useDevStore((s) => s.payCard);
  const [tab, setTab] = useState<Tab>('accounts');
  const [from, setFrom] = useState('chk');
  const [to, setTo] = useState('sav');
  const [amount, setAmount] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('chk');
  const [lockedCards, setLockedCards] = useState<Record<string, boolean>>({});

  const activeEmployment = employerAccounts.filter((a) => a.employmentStatus === 'active' || a.employmentStatus === 'onboarding');
  const holderName = profileName || 'AOS MEMBER';

  const extraTxns = useMemo<Txn[]>(() => {
    const txns: Txn[] = [];
    if (cashAdjustment !== 0) {
      txns.push({
        id: 'dev-adjust', accountId: 'chk', date: new Date().toISOString(),
        desc: cashAdjustment > 0 ? 'Wire Transfer Credit — External Funding' : 'Adjustment — External Debit',
        amount: cashAdjustment, balance: cashAdjustment,
      });
    }
    subscriptionCharges(subscriptions).forEach((c) => {
      const merchant = c.service === 'claude' ? 'ANTHROPIC PBC — CLAUDE PRO' : c.service === 'chatgpt' ? 'OPENAI *CHATGPT PLUS' : 'GOOGLE *AI PRO';
      txns.push({ id: c.id, accountId: 'chk', date: c.date, desc: `Recurring Payment — ${merchant}`, amount: -c.amount, balance: 0 });
    });
    const accName = (id: string) => id === 'chk' ? 'Chase Total Checking (...1666)' : id === 'sav' ? 'Chase Savings (...5462)' : id === 'card-freedom' ? 'Freedom Unlimited (...6399)' : id === 'card-sapphire' ? 'Sapphire Reserve (...0077)' : id;
    bankTransfers.forEach((t) => {
      txns.push({ id: `${t.id}-out`, accountId: t.from, date: t.date, desc: `Online Transfer to ${accName(t.to)}`, amount: -t.amount, balance: 0 });
      if (t.to === 'chk' || t.to === 'sav') {
        txns.push({ id: `${t.id}-in`, accountId: t.to, date: t.date, desc: `Online Transfer from ${accName(t.from)}`, amount: t.amount, balance: 0 });
      }
    });
    cardCharges.forEach((c) => {
      txns.push({ id: c.id, accountId: `cc-${c.card}`, date: c.date, desc: c.desc, amount: -c.amount, balance: 0 });
    });
    return txns;
  }, [cashAdjustment, subscriptions, bankTransfers, cardCharges]);

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
          desc: `ACH Direct Dep — ${shortCompany(emp.companyName)} PAYROLL PPD`,
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
    return {
      id: accountId,
      kind: 'income' as const,
      name: `${shortCompany(emp.companyName)} Payroll`,
      last4: emp.employeeId.slice(-4),
      routing: 'PAYROLL',
      accountNumber: emp.employeeId,
      balance,
      available: balance,
    };
  }), [activeEmployment, salaryTxns]);

  const ledgerFor = (accountId: string) => extraTxns.filter((t) => t.accountId === accountId).reduce((n, t) => n + t.amount, 0);
  const checkingBalance = Math.round((payrollAccounts.reduce((sum, p) => sum + p.balance, 0) + ledgerFor('chk')) * 100) / 100;
  const savingsBalance = Math.round(ledgerFor('sav') * 100) / 100;
  const freedomOwed = Math.round(cardCharges.filter((c) => c.card === 'freedom').reduce((n, c) => n + c.amount, 0) * 100) / 100;
  const sapphireOwed = Math.round(cardCharges.filter((c) => c.card === 'sapphire').reduce((n, c) => n + c.amount, 0) * 100) / 100;

  const accounts = useMemo<Account[]>(() => ([
    ...BASE_ACCOUNTS.map((a) => {
      if (a.id === 'chk') return { ...a, balance: checkingBalance, available: checkingBalance };
      if (a.id === 'sav') return { ...a, balance: savingsBalance, available: savingsBalance };
      if (a.id === 'cc-freedom') return { ...a, balance: freedomOwed };
      if (a.id === 'cc-sapphire') return { ...a, balance: sapphireOwed };
      return a;
    }),
    ...payrollAccounts,
  ]), [checkingBalance, savingsBalance, freedomOwed, sapphireOwed, payrollAccounts]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? accounts[0];
  const accountTxns = [...salaryTxns, ...extraTxns].filter((t) => t.accountId === selectedAccount.id).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

  const totalDeposits = accounts.filter((a) => a.kind === 'checking' || a.kind === 'savings' || a.kind === 'income').reduce((n, a) => n + a.balance, 0);
  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const wallet = buildWallet(holderName);

  return (
    <div className="chb-shell">
      {/* Brand header */}
      <header className="chb-header">
        <div className="chb-header-brand">
          <ChaseOctagon size={26} color="#fff" />
          <span className="chb-header-wordmark">CHASE</span>
        </div>
        <nav className="chb-header-nav">
          <button type="button">Open an account</button>
          <button type="button">Customer service</button>
          <button type="button">Español</button>
          <button type="button" className="chb-signout">Sign out</button>
        </nav>
      </header>

      {/* Secondary nav */}
      <nav className="chb-subnav">
        {([
          ['accounts', 'Accounts'],
          ['transfer', 'Pay & transfer'],
          ['wallet', 'Card services'],
        ] as Array<[Tab, string]>).map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
        <span className="chb-subnav-static">Plan & track</span>
        <span className="chb-subnav-static">Investments</span>
        <span className="chb-subnav-static">Security & privacy</span>
        <span className="chb-secure"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V8a3 3 0 0 0-6 0z"/></svg> Secure session</span>
      </nav>

      <div className="chb-body">
        {tab === 'wallet' ? (
          <div className="chb-wallet">
            <div className="chb-wallet-head">
              <h1>Card services</h1>
              <p>Manage your credit and debit cards, lock a misplaced card instantly, and view digital card details.</p>
            </div>
            <div className="chb-wallet-grid">
              {wallet.map((card) => (
                <div key={card.id} className="chb-wallet-item">
                  <CardArt card={card} />
                  {lockedCards[card.id] && <div className="chb-card-lockedover"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V8a3 3 0 0 0-6 0z"/></svg> Card locked</div>}
                  <div className="chb-wallet-meta">
                    <div>
                      <div className="chb-wallet-linked">{card.linked}</div>
                      <div className="chb-wallet-sub">Card ending in {card.last4} · Exp {card.expiry}</div>
                    </div>
                    <div className="chb-wallet-actions">
                      <button type="button" onClick={() => setLockedCards((p) => ({ ...p, [card.id]: !p[card.id] }))}>
                        {lockedCards[card.id] ? 'Unlock card' : 'Lock card'}
                      </button>
                      <button type="button">Replace card</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="chb-dashboard">
            <aside className="chb-accounts-rail">
              <div className="chb-rail-title">Accounts <span>{fmt(totalDeposits)}</span></div>
              {accounts.map((a) => (
                <button key={a.id} type="button"
                  className={`chb-account-row ${selectedAccountId === a.id ? 'active' : ''}`}
                  onClick={() => { setSelectedAccountId(a.id); setTab('accounts'); }}>
                  <div className="chb-account-name">{a.name} <span>(...{a.last4})</span></div>
                  <div className="chb-account-bal">{fmt(a.balance)}</div>
                  <div className="chb-account-meta">{a.kind === 'credit' ? 'Current balance' : 'Available balance'}</div>
                </button>
              ))}
              <div className="chb-rail-offer">
                <strong>You're pre-approved</strong>
                <span>Chase Sapphire Reserve® — earn 60,000 bonus points.</span>
                <button type="button" onClick={() => setTab('wallet')}>Learn more</button>
              </div>
            </aside>

            <main className="chb-main">
              {tab === 'transfer' ? (
                <section className="chb-panel">
                  <h1>Transfer money</h1>
                  <div className="chb-transfer-grid">
                    <label>From
                      <select value={from} onChange={(e) => setFrom(e.target.value)}>
                        {accounts.filter((a) => a.kind !== 'mortgage').map((a) => <option key={a.id} value={a.id}>{a.name} (...{a.last4}) — {fmt(a.balance)}</option>)}
                      </select>
                    </label>
                    <label>To
                      <select value={to} onChange={(e) => setTo(e.target.value)}>
                        {accounts.filter((a) => a.id !== from && a.kind !== 'mortgage').map((a) => <option key={a.id} value={a.id}>{a.name} (...{a.last4})</option>)}
                      </select>
                    </label>
                    <label>Amount
                      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="$0.00" />
                    </label>
                    <button type="button" className="chb-primary-btn" onClick={() => {
                      const amt = parseFloat(amount);
                      if (Number.isNaN(amt) || amt <= 0) { setConfirmation('Enter a valid amount.'); return; }
                      const fromBal = accounts.find((a) => a.id === from)?.balance ?? 0;
                      if ((from === 'chk' || from === 'sav') && amt > fromBal) { setConfirmation(`Insufficient funds: available ${fmt(fromBal)}.`); return; }
                      if (to === 'cc-freedom') { payCard('freedom', amt); }
                      else if (to === 'cc-sapphire') { payCard('sapphire', amt); }
                      else { addTransfer(from, to, amt); }
                      setAmount('');
                      setConfirmation(`Transfer complete — ${fmt(amt)} moved. Confirmation #${String(Date.now()).slice(-9)}`);
                    }}>
                      Transfer money
                    </button>
                  </div>
                  {confirmation && <div className="chb-confirm">✓ {confirmation}</div>}
                  <p className="chb-finequote">Transfers between Chase accounts made before 11 PM ET are available immediately.</p>
                </section>
              ) : (
                <>
                  <section className="chb-hero-tile">
                    <div>
                      <div className="chb-hero-label">{selectedAccount.name} (...{selectedAccount.last4})</div>
                      <div className="chb-hero-balance">{fmt(selectedAccount.balance)}</div>
                      <div className="chb-hero-sub">{selectedAccount.kind === 'credit' ? 'Current balance' : 'Available balance'}</div>
                    </div>
                    <div className="chb-hero-details">
                      <div><span>Routing number</span><strong>{selectedAccount.routing}</strong></div>
                      <div><span>Account number</span><strong>···{selectedAccount.accountNumber.slice(-4)}</strong></div>
                      <div><span>Overdraft protection</span><strong>On</strong></div>
                    </div>
                  </section>

                  <section className="chb-panel">
                    <div className="chb-panel-head">
                      <h2>Activity</h2>
                      <span>{accountTxns.length} transactions</span>
                    </div>
                    <table className="chb-table">
                      <thead>
                        <tr><th>Date</th><th>Description</th><th className="chb-num">Amount</th><th className="chb-num">Balance</th></tr>
                      </thead>
                      <tbody>
                        {accountTxns.map((t) => (
                          <tr key={t.id}>
                            <td>{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                            <td className="chb-txn-desc">{t.desc}</td>
                            <td className={`chb-num ${t.amount >= 0 ? 'chb-credit' : 'chb-debit'}`}>{t.amount >= 0 ? '+' : '−'}{fmt(Math.abs(t.amount))}</td>
                            <td className="chb-num">{fmt(t.balance)}</td>
                          </tr>
                        ))}
                        {accountTxns.length === 0 && (
                          <tr><td colSpan={4} className="chb-empty">No recent transactions on this account.{activeEmployment.length === 0 ? ' Accept a job offer in Outlook to start receiving payroll deposits.' : ''}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </section>
                </>
              )}
            </main>
          </div>
        )}
      </div>

      <footer className="chb-footer">
        <span>JPMorgan Chase Bank, N.A. Member FDIC · Equal Housing Lender</span>
        <span>Simulation environment — for training use only</span>
      </footer>
    </div>
  );
}
