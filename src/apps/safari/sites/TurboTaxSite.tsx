import { useMemo, useState } from 'react';
import { useCompanyStore } from '../../../state/useCompanyStore';
import { useProfileStore } from '../../../state/useProfileStore';
import { useDevStore } from '../../../state/useDevStore';
import { buildPaychecks, usd } from '../../../data/simulator/payroll';
import { CompanyLogo } from '../../../data/brands';
import './turbotax.css';

// turbotax.intuit.com — files a return from the simulation's real payroll
// history. W-2s are aggregated per employer from the shared payroll engine;
// the refund (or balance due) actually lands in Chase.

const BASE_URL = import.meta.env.BASE_URL;
const STANDARD_DEDUCTION = 14600;

type Step = 'home' | 'personal' | 'income' | 'deductions' | 'review' | 'filed';

// Simplified single-filer brackets
function federalTax(taxable: number): number {
  const brackets: Array<[number, number]> = [[11600, 0.1], [47150, 0.12], [100525, 0.22], [191950, 0.24], [243725, 0.32], [609350, 0.35], [Infinity, 0.37]];
  let tax = 0;
  let prev = 0;
  for (const [cap, rate] of brackets) {
    if (taxable <= prev) break;
    tax += (Math.min(taxable, cap) - prev) * rate;
    prev = cap;
  }
  return Math.max(0, Math.round(tax));
}

export function TurboTaxSite() {
  const accounts = useCompanyStore((s) => s.employerAccounts);
  const fullName = useProfileStore((s) => s.fullName);
  const taxRefunds = useDevStore((s) => s.taxRefunds);
  const addTaxRefund = useDevStore((s) => s.addTaxRefund);
  const year = new Date().getFullYear() - 1;
  const alreadyFiled = taxRefunds.some((r) => r.year === year);
  const [step, setStep] = useState<Step>(alreadyFiled ? 'filed' : 'home');

  const w2s = useMemo(() => {
    return accounts
      .filter((a) => a.employmentStatus !== 'inactive' || true) // inactive employers still issue W-2s
      .map((acc) => {
        const checks = buildPaychecks(acc, 26);
        if (checks.length === 0) return null;
        const wages = checks.reduce((s, c) => s + c.gross, 0);
        const fed = checks.reduce((s, c) => s + (c.deductions.find((d) => d.label.startsWith('Federal'))?.amount ?? 0), 0);
        const ss = checks.reduce((s, c) => s + (c.deductions.find((d) => d.label.startsWith('OASDI'))?.amount ?? 0), 0);
        const medicare = checks.reduce((s, c) => s + (c.deductions.find((d) => d.label === 'Medicare')?.amount ?? 0), 0);
        const state = checks.reduce((s, c) => s + (c.deductions.find((d) => d.label.startsWith('State'))?.amount ?? 0), 0);
        return { acc, wages: Math.round(wages), fed: Math.round(fed), ss: Math.round(ss), medicare: Math.round(medicare), state: Math.round(state) };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [accounts]);

  const totals = useMemo(() => {
    const wages = w2s.reduce((s, w) => s + w.wages, 0);
    const withheld = w2s.reduce((s, w) => s + w.fed, 0);
    const taxable = Math.max(0, wages - STANDARD_DEDUCTION);
    const liability = federalTax(taxable);
    return { wages, withheld, taxable, liability, refund: withheld - liability };
  }, [w2s]);

  const refundColor = totals.refund >= 0 ? '#127e30' : '#c02b2b';
  const filedRecord = taxRefunds.find((r) => r.year === year);

  const Header = (
    <header className="tt-header">
      <span className="tt-logo"><span className="tt-logo-intuit">intuit</span> <strong>turbotax</strong></span>
      {step !== 'home' && step !== 'filed' && (
        <span className="tt-refund-meter" style={{ color: refundColor }}>
          Federal {totals.refund >= 0 ? 'refund' : 'owed'}: <strong>{usd(Math.abs(totals.refund))}</strong>
        </span>
      )}
      <span className="tt-header-user">{fullName}</span>
    </header>
  );

  if (step === 'home') {
    return (
      <div className="tt-shell">
        {Header}
        <div className="tt-hero" style={{ backgroundImage: `url(${BASE_URL}assets/banners/turbotax.webp)` }}>
          <div className="tt-hero-card">
            <h1>File your {year} taxes with confidence</h1>
            <p>We import your W-2s automatically from your employers' payroll. 100% accurate calculations, guaranteed.</p>
            {w2s.length === 0 ? (
              <p className="tt-hero-note">No wage income found yet — once you're employed and paid, your W-2s appear here automatically.</p>
            ) : (
              <p className="tt-hero-note">{w2s.length} W-2{w2s.length > 1 ? 's' : ''} ready to import from {w2s.map((w) => w.acc.companyName).join(', ')}.</p>
            )}
            <button type="button" className="tt-cta" disabled={w2s.length === 0} onClick={() => setStep('personal')}>
              Start my {year} return
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'filed') {
    return (
      <div className="tt-shell">
        {Header}
        <div className="tt-wizard">
          <div className="tt-card tt-filed">
            <div className="tt-filed-check">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#127e30" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="m7.5 12.5 3 3 6-6.5" /></svg>
            </div>
            <h1>Your {year} federal return has been filed</h1>
            <p>The IRS accepted your e-filed return.</p>
            {filedRecord && (
              <div className="tt-filed-amount" style={{ color: filedRecord.amount >= 0 ? '#127e30' : '#c02b2b' }}>
                {filedRecord.amount >= 0 ? 'Refund' : 'Amount paid'}: {usd(Math.abs(filedRecord.amount))}
              </div>
            )}
            <p className="tt-fine">{filedRecord && filedRecord.amount >= 0 ? 'Your refund was deposited to Chase Total Checking ····1666 — look for "IRS TREAS 310 TAX REF" in your transactions.' : 'Your payment was drafted from Chase Total Checking ····1666.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const steps: Step[] = ['personal', 'income', 'deductions', 'review'];
  const stepIx = steps.indexOf(step);

  return (
    <div className="tt-shell">
      {Header}
      <div className="tt-progress">
        {['Personal info', 'Income', 'Deductions', 'Review & file'].map((label, i) => (
          <span key={label} className={`tt-prog-step ${i <= stepIx ? 'active' : ''}`}>
            <i>{i + 1}</i>{label}
          </span>
        ))}
      </div>
      <div className="tt-wizard">
        {step === 'personal' && (
          <div className="tt-card">
            <h1>Let's confirm your info</h1>
            <div className="tt-kv"><span>Name</span><strong>{fullName}</strong></div>
            <div className="tt-kv"><span>Filing status</span><strong>Single</strong></div>
            <div className="tt-kv"><span>Tax year</span><strong>{year}</strong></div>
            <div className="tt-kv"><span>SSN</span><strong>XXX-XX-4821</strong></div>
            <button type="button" className="tt-cta" onClick={() => setStep('income')}>Looks good — continue</button>
          </div>
        )}

        {step === 'income' && (
          <div className="tt-card">
            <h1>We found {w2s.length} W-2{w2s.length > 1 ? 's' : ''} for you</h1>
            <p className="tt-sub">Imported directly from your employers' payroll providers.</p>
            {w2s.map((w) => (
              <div key={w.acc.id} className="tt-w2">
                <div className="tt-w2-head">
                  <CompanyLogo company={w.acc.companyName} size={30} />
                  <div>
                    <strong>{w.acc.companyName}</strong>
                    <span>Form W-2 · Wage and Tax Statement · {year}</span>
                  </div>
                </div>
                <div className="tt-w2-boxes">
                  <div><span>Box 1 — Wages</span><strong>{usd(w.wages)}</strong></div>
                  <div><span>Box 2 — Federal tax withheld</span><strong>{usd(w.fed)}</strong></div>
                  <div><span>Box 4 — Social Security</span><strong>{usd(w.ss)}</strong></div>
                  <div><span>Box 6 — Medicare</span><strong>{usd(w.medicare)}</strong></div>
                  <div><span>Box 17 — State income tax</span><strong>{usd(w.state)}</strong></div>
                </div>
              </div>
            ))}
            <button type="button" className="tt-cta" onClick={() => setStep('deductions')}>Continue</button>
          </div>
        )}

        {step === 'deductions' && (
          <div className="tt-card">
            <h1>Standard or itemized?</h1>
            <p className="tt-sub">We compared both — the standard deduction saves you the most.</p>
            <div className="tt-kv"><span>Standard deduction (Single)</span><strong>{usd(STANDARD_DEDUCTION)}</strong></div>
            <div className="tt-kv"><span>Your itemizable expenses</span><strong>{usd(3240)}</strong></div>
            <div className="tt-choice-note">We selected the <strong>standard deduction</strong> for you.</div>
            <button type="button" className="tt-cta" onClick={() => setStep('review')}>Continue</button>
          </div>
        )}

        {step === 'review' && (
          <div className="tt-card">
            <h1>Review your {year} federal return</h1>
            <div className="tt-kv"><span>Total wages (all W-2s)</span><strong>{usd(totals.wages)}</strong></div>
            <div className="tt-kv"><span>Standard deduction</span><strong>−{usd(STANDARD_DEDUCTION)}</strong></div>
            <div className="tt-kv"><span>Taxable income</span><strong>{usd(totals.taxable)}</strong></div>
            <div className="tt-kv"><span>Federal tax</span><strong>{usd(totals.liability)}</strong></div>
            <div className="tt-kv"><span>Federal tax withheld</span><strong>{usd(totals.withheld)}</strong></div>
            <div className="tt-total" style={{ color: refundColor }}>
              {totals.refund >= 0 ? 'Your federal refund' : 'You owe'}: {usd(Math.abs(totals.refund))}
            </div>
            <div className="tt-kv"><span>{totals.refund >= 0 ? 'Deposit to' : 'Pay from'}</span><strong>Chase Total Checking ····1666</strong></div>
            <button type="button" className="tt-cta" onClick={() => { addTaxRefund(year, totals.refund); setStep('filed'); }}>
              E-file my federal return
            </button>
            <span className="tt-fine">By filing you agree the information above is true and complete to the best of your knowledge.</span>
          </div>
        )}
      </div>
    </div>
  );
}
