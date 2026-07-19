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

export type Subscription = { active: boolean; since?: string };

type DevStore = {
  cashAdjustment: number;
  subscriptions: Record<AiService, Subscription>;
  devOffersGranted: number;
  setCashAdjustment: (amount: number) => void;
  addCash: (delta: number) => void;
  subscribe: (service: AiService) => void;
  cancelSubscription: (service: AiService) => void;
  noteDevOffer: () => void;
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
      setCashAdjustment: (amount) => set({ cashAdjustment: amount }),
      addCash: (delta) => set((s) => ({ cashAdjustment: Math.round((s.cashAdjustment + delta) * 100) / 100 })),
      subscribe: (service) => set((s) => ({
        subscriptions: { ...s.subscriptions, [service]: { active: true, since: new Date().toISOString() } },
      })),
      cancelSubscription: (service) => set((s) => ({
        subscriptions: { ...s.subscriptions, [service]: { active: false } },
      })),
      noteDevOffer: () => set((s) => ({ devOffersGranted: s.devOffersGranted + 1 })),
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
    const plan = AI_PLANS[svc];
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
