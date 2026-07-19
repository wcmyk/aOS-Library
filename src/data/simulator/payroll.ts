import type { EmployerAccount } from '../../state/useCompanyStore';

// Shared payroll engine used by Workday, ADP, and Chase so every surface shows
// the same checks, deductions, and YTD figures for a given employer account.

export type PayDeduction = { label: string; amount: number; kind: 'tax' | 'pretax' | 'posttax' };

export type Paycheck = {
  id: string;
  checkNumber: string;
  payDate: string;        // ISO date
  periodStart: string;
  periodEnd: string;
  gross: number;
  deductions: PayDeduction[];
  totalDeductions: number;
  net: number;
  ytdGross: number;
  ytdNet: number;
  hours: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildPaychecks(account: EmployerAccount, maxChecks = 12): Paycheck[] {
  const biweeklyGross = round2(account.compensation / 26);
  const start = new Date(account.startDate);
  const now = new Date();
  const checks: Paycheck[] = [];
  let ytdGross = 0;
  let ytdNet = 0;
  let payDate = new Date(start.getTime());
  // first check lands two weeks after start
  payDate.setDate(payDate.getDate() + 14);
  let n = 0;
  while (payDate <= now && n < maxChecks) {
    const fed = round2(biweeklyGross * 0.148);
    const state = round2(biweeklyGross * 0.049);
    const ss = round2(biweeklyGross * 0.062);
    const medicare = round2(biweeklyGross * 0.0145);
    const k401 = round2(biweeklyGross * 0.05);
    const medical = 87.5;
    const dental = 11.25;
    const vision = 3.4;
    const deductions: PayDeduction[] = [
      { label: 'Federal Withholding', amount: fed, kind: 'tax' },
      { label: 'State Income Tax', amount: state, kind: 'tax' },
      { label: 'OASDI (Social Security)', amount: ss, kind: 'tax' },
      { label: 'Medicare', amount: medicare, kind: 'tax' },
      { label: '401(k) Traditional — 5%', amount: k401, kind: 'pretax' },
      { label: 'Medical — PPO Plan', amount: medical, kind: 'pretax' },
      { label: 'Dental', amount: dental, kind: 'pretax' },
      { label: 'Vision', amount: vision, kind: 'pretax' },
    ];
    const totalDeductions = round2(deductions.reduce((s, d) => s + d.amount, 0));
    const net = round2(biweeklyGross - totalDeductions);
    ytdGross = round2(ytdGross + biweeklyGross);
    ytdNet = round2(ytdNet + net);
    const periodEnd = new Date(payDate.getTime());
    periodEnd.setDate(periodEnd.getDate() - 3);
    const periodStart = new Date(periodEnd.getTime());
    periodStart.setDate(periodStart.getDate() - 13);
    checks.push({
      id: `chk-${account.id}-${n}`,
      checkNumber: String(30140 + n * 7),
      payDate: fmtDate(payDate),
      periodStart: fmtDate(periodStart),
      periodEnd: fmtDate(periodEnd),
      gross: biweeklyGross,
      deductions,
      totalDeductions,
      net,
      ytdGross,
      ytdNet,
      hours: 80,
    });
    payDate = new Date(payDate.getTime());
    payDate.setDate(payDate.getDate() + 14);
    n++;
  }
  return checks.reverse(); // newest first
}

export function usd(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function threeDigits(n: number): string {
  let out = '';
  if (n >= 100) { out += `${ONES[Math.floor(n / 100)]} Hundred`; n %= 100; if (n) out += ' '; }
  if (n >= 20) { out += TENS[Math.floor(n / 10)]; if (n % 10) out += `-${ONES[n % 10]}`; }
  else if (n > 0) out += ONES[n];
  return out;
}

// "1,234.56" → "One Thousand Two Hundred Thirty-Four and 56/100 Dollars"
export function amountInWords(amount: number): string {
  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);
  let words = '';
  const thousands = Math.floor(dollars / 1000);
  const rest = dollars % 1000;
  if (thousands) words += `${threeDigits(thousands)} Thousand`;
  if (rest) words += `${words ? ' ' : ''}${threeDigits(rest)}`;
  if (!words) words = 'Zero';
  return `${words} and ${String(cents).padStart(2, '0')}/100 Dollars`;
}
