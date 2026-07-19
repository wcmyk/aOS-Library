import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Developer/simulation controls: cash overrides and AI assistant subscriptions.
// Charges surface as transactions in Chase and gate the claude.ai / chatgpt.com
// / gemini chat surfaces in Safari.

export type AiService = 'claude' | 'chatgpt' | 'gemini';

export const AI_PLANS: Record<AiService, { name: string; plan: string; monthly: number }> = {
  claude: { name: 'Claude', plan: 'Claude Pro', monthly: 20 },
  chatgpt: { name: 'ChatGPT', plan: 'ChatGPT Plus', monthly: 20 },
  gemini: { name: 'Gemini', plan: 'Google AI Pro', monthly: 19.99 },
};

export type ClaudePlan = 'pro' | 'max' | 'team' | 'enterprise';

export const CLAUDE_PLANS: Record<ClaudePlan, { label: string; monthly: number; blurb: string; perSeat?: boolean }> = {
  pro: { label: 'Claude Pro', monthly: 20, blurb: 'More usage, Projects, and access to Claude Fable 5' },
  max: { label: 'Claude Max', monthly: 100, blurb: '5x-20x higher limits, priority access at peak times' },
  team: { label: 'Claude Team', monthly: 25, perSeat: true, blurb: 'Per seat (min 5) with central billing and admin tools' },
  enterprise: { label: 'Claude Enterprise', monthly: 0, blurb: 'Provided by your employer with SSO, expanded context, and data controls' },
};

// Organizations that provision Claude Enterprise for employees in the sim
export const CLAUDE_ENTERPRISE_ORGS = /anthropic|google|amazon|aws|microsoft|meta\b|apple|netflix|nvidia|mckinsey|bain|boston consulting|deloitte|intuit|salesforce/i;

export type Subscription = { active: boolean; since?: string; plan?: ClaudePlan };

export type BankTransfer = { id: string; from: string; to: string; amount: number; date: string };
export type CardCharge = { id: string; card: 'freedom' | 'sapphire'; desc: string; amount: number; date: string };

type DevStore = {
  cashAdjustment: number;
  subscriptions: Record<AiService, Subscription>;
  devOffersGranted: number;
  bankTransfers: BankTransfer[];
  cardCharges: CardCharge[];
  setCashAdjustment: (amount: number) => void;
  addCash: (delta: number) => void;
  subscribe: (service: AiService, plan?: ClaudePlan) => void;
  cancelSubscription: (service: AiService) => void;
  noteDevOffer: () => void;
  addTransfer: (from: string, to: string, amount: number) => void;
  addCardCharge: (card: 'freedom' | 'sapphire', desc: string, amount: number) => void;
  payCard: (card: 'freedom' | 'sapphire', amount: number) => void;
};

export const useDevStore = create<DevStore>()(
  persist(
    (set) => ({
      cashAdjustment: 0,
      subscriptions: {
        claude: { active: false },
        chatgpt: { active: false },
        gemini: { active: false },
      },
      devOffersGranted: 0,
      bankTransfers: [],
      cardCharges: [],
      setCashAdjustment: (amount) => set({ cashAdjustment: amount }),
      addCash: (delta) => set((s) => ({ cashAdjustment: Math.round((s.cashAdjustment + delta) * 100) / 100 })),
      subscribe: (service, plan) => set((s) => ({
        subscriptions: { ...s.subscriptions, [service]: { active: true, since: new Date().toISOString(), plan: service === 'claude' ? (plan ?? 'pro') : undefined } },
      })),
      cancelSubscription: (service) => set((s) => ({
        subscriptions: { ...s.subscriptions, [service]: { active: false } },
      })),
      noteDevOffer: () => set((s) => ({ devOffersGranted: s.devOffersGranted + 1 })),
      addTransfer: (from, to, amount) => set((s) => ({
        bankTransfers: [...s.bankTransfers, { id: `tr-${s.bankTransfers.length}-${amount}`, from, to, amount: Math.round(amount * 100) / 100, date: new Date().toISOString() }],
      })),
      addCardCharge: (card, desc, amount) => set((s) => ({
        cardCharges: [...s.cardCharges, { id: `cc-${s.cardCharges.length}-${amount}`, card, desc, amount: Math.round(amount * 100) / 100, date: new Date().toISOString() }],
      })),
      payCard: (card, amount) => set((s) => ({
        cardCharges: [...s.cardCharges, { id: `pay-${s.cardCharges.length}-${amount}`, card, desc: 'Payment Thank You - Web', amount: -Math.round(amount * 100) / 100, date: new Date().toISOString() }],
        bankTransfers: [...s.bankTransfers, { id: `trp-${s.bankTransfers.length}-${amount}`, from: 'chk', to: `card-${card}`, amount: Math.round(amount * 100) / 100, date: new Date().toISOString() }],
      })),
    }),
    { name: 'aos-dev-store' },
  ),
);

// Monthly charges for active subscriptions, rendered as bank transactions.
export function subscriptionCharges(subs: Record<AiService, Subscription>): Array<{ id: string; service: AiService; label: string; amount: number; date: string }> {
  const out: Array<{ id: string; service: AiService; label: string; amount: number; date: string }> = [];
  (Object.keys(subs) as AiService[]).forEach((svc) => {
    const sub = subs[svc];
    if (!sub.active || !sub.since) return;
    const plan = svc === 'claude' && sub.plan
      ? { plan: CLAUDE_PLANS[sub.plan].label, monthly: sub.plan === 'team' ? CLAUDE_PLANS.team.monthly * 5 : CLAUDE_PLANS[sub.plan].monthly }
      : AI_PLANS[svc];
    if (plan.monthly === 0) return; // employer-provided plans do not bill the user
    const start = new Date(sub.since);
    const now = new Date();
    let d = new Date(start);
    let n = 0;
    while (d <= now && n < 12) {
      out.push({
        id: `sub-${svc}-${n}`,
        service: svc,
        label: `${plan.plan} — recurring`,
        amount: plan.monthly,
        date: d.toISOString(),
      });
      d = new Date(d);
      d.setMonth(d.getMonth() + 1);
      n++;
    }
  });
  return out;
}
