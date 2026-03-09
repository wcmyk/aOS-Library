import { useState, useCallback, useEffect } from 'react';

type Mode = 'basic' | 'scientific' | 'financial' | 'programmer' | 'statistics' | 'conversion' | 'currency';
type RadixMode = 'dec' | 'hex' | 'oct' | 'bin';
type AngleMode = 'deg' | 'rad' | 'grad';

// ── Helpers ──────────────────────────────────────────────────────────────────

function toRad(val: number, mode: AngleMode): number {
  if (mode === 'deg') return (val * Math.PI) / 180;
  if (mode === 'grad') return (val * Math.PI) / 200;
  return val;
}

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n === 0 || n === 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function pmt(rate: number, nper: number, pv: number, fv = 0): number {
  if (rate === 0) return -(pv + fv) / nper;
  return (rate * (pv * Math.pow(1 + rate, nper) + fv)) / (1 - Math.pow(1 + rate, nper));
}

function pv(rate: number, nper: number, payment: number, fv = 0): number {
  if (rate === 0) return -payment * nper - fv;
  return (payment * (1 - Math.pow(1 + rate, -nper))) / rate - fv / Math.pow(1 + rate, nper);
}

function fvCalc(rate: number, nper: number, payment: number, pvVal = 0): number {
  if (rate === 0) return -pvVal - payment * nper;
  return -pvVal * Math.pow(1 + rate, nper) - payment * ((Math.pow(1 + rate, nper) - 1) / rate);
}

function npv(rate: number, cashflows: number[]): number {
  return cashflows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + rate, i + 1), 0);
}

function irr(cashflows: number[]): number {
  // Newton-Raphson
  let rate = 0.1;
  for (let iter = 0; iter < 200; iter++) {
    let f = 0;
    let df = 0;
    cashflows.forEach((cf, i) => {
      f += cf / Math.pow(1 + rate, i);
      df -= i * cf / Math.pow(1 + rate, i + 1);
    });
    if (Math.abs(df) < 1e-12) break;
    const next = rate - f / df;
    if (Math.abs(next - rate) < 1e-9) { rate = next; break; }
    rate = next;
  }
  return rate;
}

function mean(data: number[]): number { return data.reduce((a, b) => a + b, 0) / data.length; }
function median(data: number[]): number {
  const s = [...data].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}
function stddev(data: number[], pop = false): number {
  const m = mean(data);
  const variance = data.reduce((a, b) => a + (b - m) ** 2, 0) / (pop ? data.length : data.length - 1);
  return Math.sqrt(variance);
}

// Exchange rates (USD base, Jan 2026 approx)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 157.5, CAD: 1.44, AUD: 1.62,
  CHF: 0.90, CNY: 7.28, INR: 86.4, MXN: 20.3, BRL: 6.12, KRW: 1445,
  SGD: 1.36, HKD: 7.79, SEK: 10.94, NOK: 11.31, DKK: 7.14,
};

// Conversion factors to SI base units
const CONVERSIONS: Record<string, Record<string, number>> = {
  length: { m: 1, km: 1e3, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, 'in': 0.0254, nm: 1e-9 },
  mass: { kg: 1, g: 0.001, lb: 0.453592, oz: 0.028350, t: 1000, mg: 1e-6, ug: 1e-9 },
  temp: { C: 0, F: 0, K: 0 }, // special case
  area: { 'm2': 1, 'km2': 1e6, 'cm2': 1e-4, 'ft2': 0.092903, 'in2': 6.4516e-4, acre: 4046.86, ha: 10000 },
  volume: { L: 1, mL: 0.001, 'm3': 1000, gal: 3.78541, qt: 0.946353, pt: 0.473176, 'fl oz': 0.0295735, cup: 0.236588 },
  speed: { 'm/s': 1, 'km/h': 1 / 3.6, mph: 0.44704, knot: 0.514444, 'ft/s': 0.3048 },
  time: { s: 1, min: 60, h: 3600, day: 86400, week: 604800, month: 2628000, year: 31536000 },
  data: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776, bit: 0.125 },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function CalcBtn({ label, onClick, wide, color, small }: {
  label: string; onClick: () => void; wide?: boolean; color?: string; small?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => { setPressed(false); onClick(); }}
      onMouseLeave={() => setPressed(false)}
      style={{
        gridColumn: wide ? 'span 2' : undefined,
        background: pressed ? (color ? `${color}cc` : '#4a4a4a') : (color ?? '#3a3a3a'),
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        fontSize: small ? 11 : 15,
        fontWeight: 500,
        cursor: 'pointer',
        padding: '0 4px',
        transition: 'background 0.08s',
        minHeight: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {label}
    </button>
  );
}

// ── BASIC ─────────────────────────────────────────────────────────────────────

function BasicCalc() {
  const [display, setDisplay] = useState('0');
  const [expr, setExpr] = useState('');
  const [justCalc, setJustCalc] = useState(false);
  const [mem, setMem] = useState(0);

  const append = (ch: string) => {
    if (justCalc) { setDisplay(ch === '.' ? '0.' : ch); setExpr(''); setJustCalc(false); return; }
    if (display === '0' && ch !== '.') setDisplay(ch);
    else if (display.includes('.') && ch === '.') return;
    else setDisplay(display + ch);
  };
  const op = (o: string) => {
    setExpr(display + ' ' + o);
    setJustCalc(false);
    setDisplay('0');
  };
  const calc = () => {
    try {
      const [left, operator] = expr.split(' ');
      const a = parseFloat(left);
      const b = parseFloat(display);
      let result: number;
      if (operator === '+') result = a + b;
      else if (operator === '−') result = a - b;
      else if (operator === '×') result = a * b;
      else if (operator === '÷') result = b === 0 ? NaN : a / b;
      else result = b;
      const str = Number.isNaN(result) ? 'Error' : result.toPrecision(12).replace(/\.?0+$/, '');
      setDisplay(str);
      setExpr('');
      setJustCalc(true);
    } catch { setDisplay('Error'); }
  };

  const btn = (label: string, action: () => void, color?: string) => ({ label, action, color });
  const grid = [
    btn('MC', () => setMem(0), '#555'), btn('M+', () => setMem(m => m + parseFloat(display)), '#555'),
    btn('M-', () => setMem(m => m - parseFloat(display)), '#555'), btn('MR', () => { setDisplay(String(mem)); setJustCalc(true); }, '#555'),
    btn('AC', () => { setDisplay('0'); setExpr(''); setJustCalc(false); }, '#636363'),
    btn('+/-', () => setDisplay(d => d.startsWith('-') ? d.slice(1) : '-' + d), '#636363'),
    btn('%', () => setDisplay(d => String(parseFloat(d) / 100)), '#636363'),
    btn('÷', () => op('÷'), '#ff9f0a'),
    btn('7', () => append('7')), btn('8', () => append('8')), btn('9', () => append('9')), btn('×', () => op('×'), '#ff9f0a'),
    btn('4', () => append('4')), btn('5', () => append('5')), btn('6', () => append('6')), btn('−', () => op('−'), '#ff9f0a'),
    btn('1', () => append('1')), btn('2', () => append('2')), btn('3', () => append('3')), btn('+', () => op('+'), '#ff9f0a'),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      <div style={{ background: '#1c1c1e', borderRadius: 12, padding: '16px 20px', marginBottom: 4 }}>
        <div style={{ color: '#888', fontSize: 13, minHeight: 18, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>{expr}&nbsp;</div>
        <div style={{ color: '#fff', fontSize: 40, fontWeight: 200, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.1 }}>{display}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, flex: 1 }}>
        {grid.map((b, i) => <CalcBtn key={i} label={b.label} onClick={b.action} color={b.color} />)}
        <CalcBtn label="0" onClick={() => append('0')} wide />
        <CalcBtn label="." onClick={() => append('.')} />
        <CalcBtn label="=" onClick={calc} color="#ff9f0a" />
      </div>
    </div>
  );
}

// ── SCIENTIFIC ────────────────────────────────────────────────────────────────

function ScientificCalc() {
  const [display, setDisplay] = useState('0');
  const [expr, setExpr] = useState('');
  const [justCalc, setJustCalc] = useState(false);
  const [angle, setAngle] = useState<AngleMode>('deg');
  const [inv, setInv] = useState(false);
  const [mem, setMem] = useState(0);

  const num = () => parseFloat(display);
  const show = (v: number) => { setDisplay(isNaN(v) ? 'Error' : v.toPrecision(10).replace(/\.?0+$/, '')); setJustCalc(true); };

  const append = (ch: string) => {
    if (justCalc) { setDisplay(ch === '.' ? '0.' : ch); setExpr(''); setJustCalc(false); return; }
    if (display === '0' && ch !== '.') setDisplay(ch);
    else if (display.includes('.') && ch === '.') return;
    else setDisplay(display + ch);
  };
  const op = (o: string) => { setExpr(display + ' ' + o); setJustCalc(false); setDisplay('0'); };
  const calc = () => {
    try {
      const parts = expr.split(' ');
      const a = parseFloat(parts[0]);
      const operator = parts[1];
      const b = num();
      let r: number;
      if (operator === '+') r = a + b;
      else if (operator === '−') r = a - b;
      else if (operator === '×') r = a * b;
      else if (operator === '÷') r = b === 0 ? NaN : a / b;
      else if (operator === 'xʸ') r = Math.pow(a, b);
      else if (operator === 'ˣ√y') r = Math.pow(b, 1 / a);
      else if (operator === 'EE') r = a * Math.pow(10, b);
      else r = b;
      show(r);
      setExpr('');
    } catch { setDisplay('Error'); }
  };

  const sci = [
    { l: inv ? 'sinh⁻¹' : 'sinh', f: () => show(inv ? Math.asinh(num()) : Math.sinh(num())) },
    { l: inv ? 'cosh⁻¹' : 'cosh', f: () => show(inv ? Math.acosh(num()) : Math.cosh(num())) },
    { l: inv ? 'tanh⁻¹' : 'tanh', f: () => show(inv ? Math.atanh(num()) : Math.tanh(num())) },
    { l: inv ? 'sin⁻¹' : 'sin', f: () => show(inv ? (angle === 'deg' ? (Math.asin(num()) * 180) / Math.PI : Math.asin(num())) : Math.sin(toRad(num(), angle))) },
    { l: inv ? 'cos⁻¹' : 'cos', f: () => show(inv ? (angle === 'deg' ? (Math.acos(num()) * 180) / Math.PI : Math.acos(num())) : Math.cos(toRad(num(), angle))) },
    { l: inv ? 'tan⁻¹' : 'tan', f: () => show(inv ? (angle === 'deg' ? (Math.atan(num()) * 180) / Math.PI : Math.atan(num())) : Math.tan(toRad(num(), angle))) },
    { l: inv ? 'eˣ' : 'ln', f: () => show(inv ? Math.exp(num()) : Math.log(num())) },
    { l: inv ? '10ˣ' : 'log₁₀', f: () => show(inv ? Math.pow(10, num()) : Math.log10(num())) },
    { l: inv ? '2ˣ' : 'log₂', f: () => show(inv ? Math.pow(2, num()) : Math.log2(num())) },
    { l: 'x!', f: () => show(factorial(num())) },
    { l: 'xʸ', f: () => op('xʸ') },
    { l: 'ˣ√y', f: () => op('ˣ√y') },
    { l: '√', f: () => show(Math.sqrt(num())) },
    { l: 'x²', f: () => show(num() ** 2) },
    { l: 'x³', f: () => show(num() ** 3) },
    { l: '1/x', f: () => show(1 / num()) },
    { l: 'π', f: () => { setDisplay(String(Math.PI)); setJustCalc(true); } },
    { l: 'e', f: () => { setDisplay(String(Math.E)); setJustCalc(true); } },
    { l: 'EE', f: () => op('EE') },
    { l: 'Rand', f: () => show(Math.random()) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 6 }}>
      <div style={{ background: '#1c1c1e', borderRadius: 12, padding: '12px 16px' }}>
        <div style={{ color: '#888', fontSize: 11, textAlign: 'right' }}>{expr}&nbsp;</div>
        <div style={{ color: '#fff', fontSize: 32, fontWeight: 200, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>{display}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(['deg', 'rad', 'grad'] as AngleMode[]).map(a => (
          <button key={a} type="button" onClick={() => setAngle(a)}
            style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: angle === a ? '#ff9f0a' : '#3a3a3a', color: '#fff', fontSize: 11, cursor: 'pointer' }}>
            {a.toUpperCase()}
          </button>
        ))}
        <button type="button" onClick={() => setInv(v => !v)}
          style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: inv ? '#30d158' : '#3a3a3a', color: '#fff', fontSize: 11, cursor: 'pointer' }}>
          INV
        </button>
        <button type="button" onClick={() => setMem(0)} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', background: '#3a3a3a', color: '#aaa', fontSize: 11, cursor: 'pointer' }}>MC</button>
        <button type="button" onClick={() => setMem(m => m + num())} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', background: '#3a3a3a', color: '#aaa', fontSize: 11, cursor: 'pointer' }}>M+</button>
        <button type="button" onClick={() => { setDisplay(String(mem)); setJustCalc(true); }} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', background: '#3a3a3a', color: '#aaa', fontSize: 11, cursor: 'pointer' }}>MR</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, flex: 1 }}>
        {sci.map((b, i) => <CalcBtn key={i} label={b.l} onClick={b.f} small color="#2c2c2e" />)}
        {/* Basic row */}
        <CalcBtn label="AC" onClick={() => { setDisplay('0'); setExpr(''); }} color="#636363" />
        <CalcBtn label="+/-" onClick={() => setDisplay(d => d.startsWith('-') ? d.slice(1) : '-' + d)} color="#636363" />
        <CalcBtn label="%" onClick={() => show(num() / 100)} color="#636363" />
        <CalcBtn label="÷" onClick={() => op('÷')} color="#ff9f0a" />
        <CalcBtn label="×" onClick={() => op('×')} color="#ff9f0a" />
        {['7','8','9'].map(d => <CalcBtn key={d} label={d} onClick={() => append(d)} />)}
        <CalcBtn label="−" onClick={() => op('−')} color="#ff9f0a" />
        <CalcBtn label="+" onClick={() => op('+')} color="#ff9f0a" />
        {['4','5','6'].map(d => <CalcBtn key={d} label={d} onClick={() => append(d)} />)}
        <CalcBtn label="1" onClick={() => append('1')} />
        <CalcBtn label="2" onClick={() => append('2')} />
        <CalcBtn label="3" onClick={() => append('3')} />
        <CalcBtn label="=" onClick={calc} color="#ff9f0a" wide />
        <CalcBtn label="0" onClick={() => append('0')} wide />
        <CalcBtn label="." onClick={() => append('.')} />
      </div>
    </div>
  );
}

// ── FINANCIAL ─────────────────────────────────────────────────────────────────

type FinTab = 'pmt' | 'pv' | 'fv' | 'npv' | 'irr' | 'amort';

function FinancialCalc() {
  const [tab, setTab] = useState<FinTab>('pmt');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [result, setResult] = useState('');

  const set = (k: string, v: string) => setFields(f => ({ ...f, [k]: v }));
  const g = (k: string) => parseFloat(fields[k] || '0');

  const calcPMT = () => {
    const r = g('rate') / 100 / 12;
    const n = g('nper');
    const p = g('pv');
    const f = g('fv');
    setResult(`PMT = $${Math.abs(pmt(r, n, p, f)).toFixed(2)}/month`);
  };
  const calcPV = () => {
    const r = g('rate') / 100 / 12;
    setResult(`PV = $${Math.abs(pv(r, g('nper'), g('payment'), g('fv'))).toFixed(2)}`);
  };
  const calcFV = () => {
    const r = g('rate') / 100 / 12;
    setResult(`FV = $${Math.abs(fvCalc(r, g('nper'), g('payment'), g('pv'))).toFixed(2)}`);
  };
  const calcNPV = () => {
    const cfs = (fields['cashflows'] || '').split(',').map(Number).filter(isFinite);
    setResult(`NPV = $${npv(g('rate') / 100, cfs).toFixed(2)}`);
  };
  const calcIRR = () => {
    const cfs = (fields['cashflows'] || '').split(',').map(Number).filter(isFinite);
    const r = irr(cfs);
    setResult(`IRR = ${(r * 100).toFixed(4)}%`);
  };
  const calcAmort = () => {
    const rate = g('rate') / 100 / 12;
    const n = g('nper');
    const principal = g('pv');
    const payment = Math.abs(pmt(rate, n, principal, 0));
    let bal = principal;
    let totalInterest = 0;
    const rows: string[] = [];
    for (let i = 1; i <= Math.min(n, 12); i++) {
      const interest = bal * rate;
      const prinPaid = payment - interest;
      totalInterest += interest;
      bal -= prinPaid;
      rows.push(`Mo ${i}: Int=$${interest.toFixed(2)} | Prin=$${prinPaid.toFixed(2)} | Bal=$${Math.max(0, bal).toFixed(2)}`);
    }
    if (n > 12) rows.push(`... (showing first 12 of ${n} months)`);
    rows.push(`Total Interest = $${totalInterest.toFixed(2)}`);
    setResult(rows.join('\n'));
  };

  const finTabs: { id: FinTab; label: string }[] = [
    { id: 'pmt', label: 'PMT' }, { id: 'pv', label: 'PV' }, { id: 'fv', label: 'FV' },
    { id: 'npv', label: 'NPV' }, { id: 'irr', label: 'IRR' }, { id: 'amort', label: 'Amort' },
  ];

  const inp = (label: string, key: string, placeholder?: string) => (
    <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ color: '#aaa', fontSize: 11 }}>{label}</span>
      <input
        value={fields[key] || ''}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder ?? '0'}
        style={{ background: '#2c2c2e', border: '1px solid #444', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 13 }}
      />
    </label>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10, color: '#fff' }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {finTabs.map(t => (
          <button key={t.id} type="button" onClick={() => { setTab(t.id); setResult(''); }}
            style={{ padding: '5px 14px', borderRadius: 8, border: 'none', background: tab === t.id ? '#ff9f0a' : '#3a3a3a', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: tab === t.id ? 600 : 400 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#1c1c1e', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tab === 'pmt' && (<>
          <div style={{ color: '#ff9f0a', fontWeight: 600, fontSize: 13 }}>Payment Calculator (PMT)</div>
          {inp('Annual Interest Rate (%)', 'rate', 'e.g. 7.5')}
          {inp('Number of Periods (months)', 'nper', 'e.g. 360')}
          {inp('Present Value / Loan Amount ($)', 'pv', 'e.g. 400000')}
          {inp('Future Value ($, optional)', 'fv', '0')}
          <button type="button" onClick={calcPMT} style={calcBtnStyle}>Calculate PMT</button>
        </>)}
        {tab === 'pv' && (<>
          <div style={{ color: '#ff9f0a', fontWeight: 600, fontSize: 13 }}>Present Value (PV)</div>
          {inp('Annual Interest Rate (%)', 'rate', 'e.g. 6')}
          {inp('Number of Periods (months)', 'nper', 'e.g. 360')}
          {inp('Monthly Payment ($)', 'payment', 'e.g. 2000')}
          {inp('Future Value ($, optional)', 'fv', '0')}
          <button type="button" onClick={calcPV} style={calcBtnStyle}>Calculate PV</button>
        </>)}
        {tab === 'fv' && (<>
          <div style={{ color: '#ff9f0a', fontWeight: 600, fontSize: 13 }}>Future Value (FV)</div>
          {inp('Annual Interest Rate (%)', 'rate', 'e.g. 8')}
          {inp('Number of Periods (months)', 'nper', 'e.g. 120')}
          {inp('Monthly Payment ($)', 'payment', 'e.g. 500')}
          {inp('Present Value ($, optional)', 'pv', '0')}
          <button type="button" onClick={calcFV} style={calcBtnStyle}>Calculate FV</button>
        </>)}
        {tab === 'npv' && (<>
          <div style={{ color: '#ff9f0a', fontWeight: 600, fontSize: 13 }}>Net Present Value (NPV)</div>
          {inp('Discount Rate (%)', 'rate', 'e.g. 10')}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ color: '#aaa', fontSize: 11 }}>Cash Flows (comma-separated, year 1..n)</span>
            <textarea value={fields['cashflows'] || ''} onChange={e => set('cashflows', e.target.value)}
              placeholder="-10000, 3000, 4000, 5000, 6000"
              style={{ background: '#2c2c2e', border: '1px solid #444', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12, resize: 'none', height: 60 }} />
          </label>
          <button type="button" onClick={calcNPV} style={calcBtnStyle}>Calculate NPV</button>
        </>)}
        {tab === 'irr' && (<>
          <div style={{ color: '#ff9f0a', fontWeight: 600, fontSize: 13 }}>Internal Rate of Return (IRR)</div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ color: '#aaa', fontSize: 11 }}>Cash Flows (comma-separated, starting with initial investment)</span>
            <textarea value={fields['cashflows'] || ''} onChange={e => set('cashflows', e.target.value)}
              placeholder="-10000, 3000, 4000, 5000, 6000"
              style={{ background: '#2c2c2e', border: '1px solid #444', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12, resize: 'none', height: 60 }} />
          </label>
          <button type="button" onClick={calcIRR} style={calcBtnStyle}>Calculate IRR</button>
        </>)}
        {tab === 'amort' && (<>
          <div style={{ color: '#ff9f0a', fontWeight: 600, fontSize: 13 }}>Amortization Schedule</div>
          {inp('Annual Interest Rate (%)', 'rate', 'e.g. 6.5')}
          {inp('Loan Term (months)', 'nper', 'e.g. 360')}
          {inp('Loan Amount ($)', 'pv', 'e.g. 350000')}
          <button type="button" onClick={calcAmort} style={calcBtnStyle}>Generate Schedule</button>
        </>)}
      </div>

      {result && (
        <div style={{ background: '#0d1117', borderRadius: 10, padding: 12, color: '#30d158', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', flex: 1, overflowY: 'auto' }}>
          {result}
        </div>
      )}
    </div>
  );
}

// ── PROGRAMMER ───────────────────────────────────────────────────────────────

function ProgrammerCalc() {
  const [display, setDisplay] = useState('0');
  const [radix, setRadix] = useState<RadixMode>('dec');
  const [expr, setExpr] = useState('');
  const [justCalc, setJustCalc] = useState(false);

  const numVal = () => {
    const bases: Record<RadixMode, number> = { dec: 10, hex: 16, oct: 8, bin: 2 };
    return parseInt(display, bases[radix]) || 0;
  };

  const showNum = (n: number) => {
    if (!isFinite(n)) { setDisplay('Error'); setJustCalc(true); return; }
    const floor = Math.trunc(n);
    const bases: Record<RadixMode, string> = {
      dec: String(floor), hex: floor.toString(16).toUpperCase(), oct: floor.toString(8), bin: floor.toString(2),
    };
    setDisplay(bases[radix]);
    setJustCalc(true);
  };

  const append = (ch: string) => {
    if (justCalc) { setDisplay(ch); setJustCalc(false); return; }
    if (display === '0') setDisplay(ch);
    else setDisplay(display + ch);
  };

  const op = (o: string) => {
    setExpr(String(numVal()) + ' ' + o);
    setDisplay('0');
    setJustCalc(false);
  };

  const calc = () => {
    const parts = expr.split(' ');
    const a = parseInt(parts[0], 10);
    const b = numVal();
    const o = parts[1];
    let r: number;
    if (o === 'AND') r = a & b;
    else if (o === 'OR') r = a | b;
    else if (o === 'XOR') r = a ^ b;
    else if (o === '<<') r = a << b;
    else if (o === '>>') r = a >> b;
    else if (o === '+') r = a + b;
    else if (o === '−') r = a - b;
    else if (o === '×') r = a * b;
    else if (o === '÷') r = b === 0 ? NaN : Math.trunc(a / b);
    else r = b;
    showNum(r);
    setExpr('');
  };

  const switchRadix = (r: RadixMode) => {
    const val = numVal();
    setRadix(r);
    const bases: Record<RadixMode, string> = {
      dec: String(val), hex: val.toString(16).toUpperCase(), oct: val.toString(8), bin: val.toString(2),
    };
    setDisplay(bases[r]);
  };

  const hexEnabled = radix === 'hex';
  const octEnabled: boolean = radix === 'hex' || radix === 'oct' || radix === 'dec';
  const decEnabled: boolean = radix === 'dec' || radix === 'hex' || radix === 'oct';
  const notBin: boolean = radix !== 'bin';

  const radixes: { id: RadixMode; label: string }[] = [
    { id: 'hex', label: 'HEX' }, { id: 'dec', label: 'DEC' }, { id: 'oct', label: 'OCT' }, { id: 'bin', label: 'BIN' },
  ];

  // Show value in all bases
  const val = numVal();
  const reprs = [
    { label: 'HEX', value: val.toString(16).toUpperCase() },
    { label: 'DEC', value: String(val) },
    { label: 'OCT', value: val.toString(8) },
    { label: 'BIN', value: val.toString(2).replace(/(\d{4})(?=\d)/g, '$1 ') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8, color: '#fff' }}>
      <div style={{ background: '#1c1c1e', borderRadius: 12, padding: '12px 16px' }}>
        <div style={{ color: '#888', fontSize: 11, textAlign: 'right' }}>{expr}&nbsp;</div>
        <div style={{ color: '#fff', fontSize: 30, fontWeight: 200, textAlign: 'right', fontFamily: 'monospace' }}>{display}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4, marginTop: 8 }}>
          {reprs.map(r => (
            <div key={r.label} style={{ display: 'flex', gap: 6, fontSize: 11 }}>
              <span style={{ color: '#888', minWidth: 28 }}>{r.label}</span>
              <span style={{ color: '#ddd', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {radixes.map(r => (
          <button key={r.id} type="button" onClick={() => switchRadix(r.id)}
            style={{ flex: 1, padding: '4px 0', borderRadius: 6, border: 'none', background: radix === r.id ? '#ff9f0a' : '#3a3a3a', color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
            {r.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, flex: 1 }}>
        <CalcBtn label="AND" onClick={() => op('AND')} color="#2c2c2e" small />
        <CalcBtn label="OR" onClick={() => op('OR')} color="#2c2c2e" small />
        <CalcBtn label="XOR" onClick={() => op('XOR')} color="#2c2c2e" small />
        <CalcBtn label="NOT" onClick={() => showNum(~numVal())} color="#2c2c2e" small />
        <CalcBtn label="AC" onClick={() => { setDisplay('0'); setExpr(''); }} color="#636363" />
        <CalcBtn label="<<" onClick={() => op('<<')} color="#2c2c2e" small />
        <CalcBtn label=">>" onClick={() => op('>>')} color="#2c2c2e" small />
        <CalcBtn label="+/-" onClick={() => showNum(-numVal())} color="#636363" small />
        <CalcBtn label="%" onClick={() => showNum(numVal() % 2)} color="#636363" small />
        <CalcBtn label="÷" onClick={() => op('÷')} color="#ff9f0a" />
        {hexEnabled ? <CalcBtn label="A" onClick={() => append('A')} color="#555" /> : <CalcBtn label="A" onClick={() => {}} color="#222" />}
        {hexEnabled ? <CalcBtn label="B" onClick={() => append('B')} color="#555" /> : <CalcBtn label="B" onClick={() => {}} color="#222" />}
        {hexEnabled ? <CalcBtn label="C" onClick={() => append('C')} color="#555" /> : <CalcBtn label="C" onClick={() => {}} color="#222" />}
        {hexEnabled ? <CalcBtn label="D" onClick={() => append('D')} color="#555" /> : <CalcBtn label="D" onClick={() => {}} color="#222" />}
        <CalcBtn label="×" onClick={() => op('×')} color="#ff9f0a" />
        {hexEnabled ? <CalcBtn label="E" onClick={() => append('E')} color="#555" /> : <CalcBtn label="E" onClick={() => {}} color="#222" />}
        {hexEnabled ? <CalcBtn label="F" onClick={() => append('F')} color="#555" /> : <CalcBtn label="F" onClick={() => {}} color="#222" />}
        <CalcBtn label="7" onClick={() => decEnabled ? append('7') : undefined} color={decEnabled ? undefined : "#222"} />
        <CalcBtn label="8" onClick={() => decEnabled && notBin ? append('8') : undefined} color={decEnabled && notBin ? undefined : "#222"} />
        <CalcBtn label="−" onClick={() => op('−')} color="#ff9f0a" />
        <CalcBtn label="9" onClick={() => decEnabled && notBin ? append('9') : undefined} color={decEnabled && notBin ? undefined : "#222"} />
        {octEnabled ? <CalcBtn label="4" onClick={() => append('4')} /> : <CalcBtn label="4" onClick={() => {}} color="#222" />}
        {octEnabled ? <CalcBtn label="5" onClick={() => append('5')} /> : <CalcBtn label="5" onClick={() => {}} color="#222" />}
        {octEnabled ? <CalcBtn label="6" onClick={() => append('6')} /> : <CalcBtn label="6" onClick={() => {}} color="#222" />}
        <CalcBtn label="+" onClick={() => op('+')} color="#ff9f0a" />
        <CalcBtn label="1" onClick={() => append('1')} />
        <CalcBtn label="2" onClick={() => notBin ? append('2') : undefined} color={notBin ? undefined : "#222"} />
        <CalcBtn label="3" onClick={() => notBin ? append('3') : undefined} color={notBin ? undefined : "#222"} />
        <CalcBtn label="=" onClick={calc} color="#ff9f0a" wide />
        <CalcBtn label="0" onClick={() => append('0')} wide />
      </div>
    </div>
  );
}

// ── STATISTICS ────────────────────────────────────────────────────────────────

function StatisticsCalc() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');

  const analyze = () => {
    const data = input.split(/[\s,;]+/).map(Number).filter(n => isFinite(n) && !isNaN(n));
    if (data.length === 0) { setResult('No valid data entered.'); return; }
    const sorted = [...data].sort((a, b) => a - b);
    const n = data.length;
    const m = mean(data);
    const med = median(data);
    const sd = n > 1 ? stddev(data) : 0;
    const sdPop = stddev(data, true);
    const variance = n > 1 ? sd ** 2 : 0;
    const freq = new Map<number, number>();
    data.forEach(v => freq.set(v, (freq.get(v) || 0) + 1));
    const maxFreq = Math.max(...freq.values());
    const modes = [...freq.entries()].filter(([, f]) => f === maxFreq).map(([v]) => v);
    const modeStr = maxFreq === 1 ? 'None' : modes.join(', ');
    const q1 = median(sorted.slice(0, Math.floor(n / 2)));
    const q3 = median(sorted.slice(Math.ceil(n / 2)));
    const iqr = q3 - q1;
    const sum = data.reduce((a, b) => a + b, 0);
    const lines = [
      `Count (n)        = ${n}`,
      `Sum              = ${sum.toFixed(6).replace(/\.?0+$/, '')}`,
      `Mean (μ̄)         = ${m.toFixed(6).replace(/\.?0+$/, '')}`,
      `Median           = ${med}`,
      `Mode             = ${modeStr}`,
      `Min              = ${sorted[0]}`,
      `Max              = ${sorted[n - 1]}`,
      `Range            = ${sorted[n - 1] - sorted[0]}`,
      `Q1               = ${q1}`,
      `Q3               = ${q3}`,
      `IQR              = ${iqr.toFixed(4).replace(/\.?0+$/, '')}`,
      `Std Dev (sample) = ${sd.toFixed(6).replace(/\.?0+$/, '')}`,
      `Std Dev (pop)    = ${sdPop.toFixed(6).replace(/\.?0+$/, '')}`,
      `Variance (s²)    = ${variance.toFixed(6).replace(/\.?0+$/, '')}`,
    ];
    setResult(lines.join('\n'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10, color: '#fff' }}>
      <div style={{ background: '#1c1c1e', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ color: '#ff9f0a', fontWeight: 600, fontSize: 13 }}>Statistics Calculator</div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ color: '#aaa', fontSize: 11 }}>Data (comma, space, or semicolon separated)</span>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g. 2, 4, 4, 4, 5, 5, 7, 9"
            style={{ background: '#2c2c2e', border: '1px solid #444', borderRadius: 6, color: '#fff', padding: '8px', fontSize: 13, resize: 'none', height: 80, fontFamily: 'monospace' }}
          />
        </label>
        <button type="button" onClick={analyze} style={calcBtnStyle}>Analyze</button>
      </div>
      {result && (
        <div style={{ background: '#0d1117', borderRadius: 10, padding: 14, color: '#30d158', fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre', flex: 1, overflowY: 'auto', lineHeight: 1.7 }}>
          {result}
        </div>
      )}
    </div>
  );
}

// ── CONVERSION ────────────────────────────────────────────────────────────────

function ConversionCalc() {
  const [category, setCategory] = useState('length');
  const [fromUnit, setFromUnit] = useState('');
  const [toUnit, setToUnit] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [result, setResult] = useState('');

  const cats = Object.keys(CONVERSIONS);
  const units = Object.keys(CONVERSIONS[category] || {});

  const convert = () => {
    const val = parseFloat(inputVal);
    if (isNaN(val)) { setResult('Invalid input'); return; }
    if (!fromUnit || !toUnit) { setResult('Select units'); return; }

    if (category === 'temp') {
      let celsius: number;
      if (fromUnit === 'C') celsius = val;
      else if (fromUnit === 'F') celsius = (val - 32) * 5 / 9;
      else celsius = val - 273.15; // K

      let out: number;
      if (toUnit === 'C') out = celsius;
      else if (toUnit === 'F') out = celsius * 9 / 5 + 32;
      else out = celsius + 273.15; // K

      setResult(`${val} ${fromUnit} = ${out.toFixed(4).replace(/\.?0+$/, '')} ${toUnit}`);
    } else {
      const factors = CONVERSIONS[category];
      const inSI = val * factors[fromUnit];
      const out = inSI / factors[toUnit];
      setResult(`${val} ${fromUnit} = ${out.toPrecision(8).replace(/\.?0+$/, '')} ${toUnit}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10, color: '#fff' }}>
      <div style={{ background: '#1c1c1e', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ color: '#ff9f0a', fontWeight: 600, fontSize: 13 }}>Unit Conversion</div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ color: '#aaa', fontSize: 11 }}>Category</span>
          <select value={category} onChange={e => { setCategory(e.target.value); setFromUnit(''); setToUnit(''); setResult(''); }}
            style={{ background: '#2c2c2e', border: '1px solid #444', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 13 }}>
            {cats.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ color: '#aaa', fontSize: 11 }}>From</span>
            <select value={fromUnit} onChange={e => setFromUnit(e.target.value)}
              style={{ background: '#2c2c2e', border: '1px solid #444', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 13 }}>
              <option value="">Select</option>
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
          <div style={{ color: '#888', paddingBottom: 6, textAlign: 'center' }}>→</div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ color: '#aaa', fontSize: 11 }}>To</span>
            <select value={toUnit} onChange={e => setToUnit(e.target.value)}
              style={{ background: '#2c2c2e', border: '1px solid #444', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 13 }}>
              <option value="">Select</option>
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ color: '#aaa', fontSize: 11 }}>Value</span>
          <input value={inputVal} onChange={e => setInputVal(e.target.value)} placeholder="Enter value"
            style={{ background: '#2c2c2e', border: '1px solid #444', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 13 }} />
        </label>
        <button type="button" onClick={convert} style={calcBtnStyle}>Convert</button>
      </div>
      {result && (
        <div style={{ background: '#0d1117', borderRadius: 10, padding: 14, color: '#30d158', fontFamily: 'monospace', fontSize: 16, fontWeight: 500 }}>
          {result}
        </div>
      )}
    </div>
  );
}

// ── CURRENCY ──────────────────────────────────────────────────────────────────

function CurrencyCalc() {
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState('');

  const currencies = Object.keys(EXCHANGE_RATES);

  const convert = () => {
    const val = parseFloat(amount);
    if (isNaN(val)) { setResult('Invalid amount'); return; }
    const usd = val / EXCHANGE_RATES[from];
    const out = usd * EXCHANGE_RATES[to];
    setResult(`${val.toLocaleString()} ${from} = ${out.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${to}`);
  };

  const swap = () => { setFrom(to); setTo(from); setResult(''); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10, color: '#fff' }}>
      <div style={{ background: '#1c1c1e', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ color: '#ff9f0a', fontWeight: 600, fontSize: 13 }}>Currency Converter</div>
        <div style={{ color: '#666', fontSize: 11 }}>Rates based on approximate Jan 2026 values (USD base)</div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ color: '#aaa', fontSize: 11 }}>Amount</span>
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount"
            style={{ background: '#2c2c2e', border: '1px solid #444', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 13 }} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ color: '#aaa', fontSize: 11 }}>From</span>
            <select value={from} onChange={e => setFrom(e.target.value)}
              style={{ background: '#2c2c2e', border: '1px solid #444', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 13 }}>
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <button type="button" onClick={swap}
            style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#3a3a3a', color: '#fff', fontSize: 14, cursor: 'pointer', marginBottom: 1 }}>
            ⇄
          </button>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ color: '#aaa', fontSize: 11 }}>To</span>
            <select value={to} onChange={e => setTo(e.target.value)}
              style={{ background: '#2c2c2e', border: '1px solid #444', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 13 }}>
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <button type="button" onClick={convert} style={calcBtnStyle}>Convert</button>
      </div>
      {result && (
        <div style={{ background: '#0d1117', borderRadius: 10, padding: 14, color: '#30d158', fontFamily: 'monospace', fontSize: 16, fontWeight: 500 }}>
          {result}
        </div>
      )}
      <div style={{ background: '#1c1c1e', borderRadius: 10, padding: 12 }}>
        <div style={{ color: '#aaa', fontSize: 11, marginBottom: 8 }}>Quick Rates (vs USD)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {Object.entries(EXCHANGE_RATES).filter(([k]) => k !== 'USD').slice(0, 12).map(([currency, rate]) => (
            <div key={currency} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#ddd', padding: '2px 0' }}>
              <span style={{ color: '#888' }}>{currency}</span>
              <span>{rate}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

const calcBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  background: '#ff9f0a',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const MODES: { id: Mode; label: string; icon: string }[] = [
  { id: 'basic', label: 'Basic', icon: '⌨' },
  { id: 'scientific', label: 'Scientific', icon: '∫' },
  { id: 'financial', label: 'Financial', icon: '$' },
  { id: 'programmer', label: 'Programmer', icon: '<>' },
  { id: 'statistics', label: 'Statistics', icon: 'σ' },
  { id: 'conversion', label: 'Conversion', icon: '⇄' },
  { id: 'currency', label: 'Currency', icon: '€' },
];

export function CalculatorApp() {
  const [mode, setMode] = useState<Mode>('basic');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMode('basic');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{
      height: '100%',
      background: '#1a1a1a',
      color: '#fff',
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
      fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
    }}>
      {/* Mode selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '8px 12px',
        background: '#111',
        borderBottom: '1px solid #2a2a2a',
        overflowX: 'auto',
      }}>
        {MODES.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '5px 14px',
              borderRadius: 8,
              border: 'none',
              background: mode === m.id ? '#ff9f0a' : 'transparent',
              color: mode === m.id ? '#fff' : '#aaa',
              fontSize: 11,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <span style={{ fontSize: 16 }}>{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Calculator body */}
      <div style={{ padding: 12, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {mode === 'basic' && <BasicCalc />}
        {mode === 'scientific' && <ScientificCalc />}
        {mode === 'financial' && <FinancialCalc />}
        {mode === 'programmer' && <ProgrammerCalc />}
        {mode === 'statistics' && <StatisticsCalc />}
        {mode === 'conversion' && <ConversionCalc />}
        {mode === 'currency' && <CurrencyCalc />}
      </div>
    </div>
  );
}
