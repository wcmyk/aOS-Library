import { create } from 'zustand';

/**
 * Shared "wallet" ledger for cross-app purchasing. The Amazon storefront
 * writes orders here at checkout; the Chase banking app reads them and
 * renders them as real transactions that move the account balance.
 */

export type WalletOrderItem = { id: string; title: string; price: number; qty: number };

export type WalletOrder = {
  id: string;
  date: string; // ISO
  desc: string; // transaction description, e.g. "AMAZON.COM*A1B2C3"
  total: number;
  itemCount: number;
  items: WalletOrderItem[];
  accountId: string; // bank account charged (e.g. 'chk', 'cc-freedom')
  accountKind: 'checking' | 'savings' | 'credit';
  last4: string;
  cardName: string;
};

type WalletState = {
  orders: WalletOrder[];
  addOrder: (order: WalletOrder) => void;
  clearOrders: () => void;
};

const STORAGE_KEY = 'aos-wallet-orders';

const read = (): WalletOrder[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    // Persisted data may come from an older build with a different shape;
    // anything that isn't a well-formed order list is discarded.
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (o): o is WalletOrder =>
        !!o && typeof o === 'object' &&
        typeof (o as WalletOrder).id === 'string' &&
        typeof (o as WalletOrder).accountId === 'string' &&
        typeof (o as WalletOrder).total === 'number',
    );
  } catch {
    return [];
  }
};

const write = (orders: WalletOrder[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    /* ignore */
  }
};

export const useWalletStore = create<WalletState>((set, get) => ({
  orders: read(),
  addOrder: (order) => {
    const next = [order, ...get().orders].slice(0, 100);
    write(next);
    set({ orders: next });
  },
  clearOrders: () => {
    write([]);
    set({ orders: [] });
  },
}));

/** Short pseudo-random order id derived from time + a counter (no Math.random for SSR safety). */
let orderSeq = 0;
export function nextOrderId(): string {
  orderSeq += 1;
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const seq = orderSeq.toString(36).toUpperCase().padStart(2, '0');
  return `${stamp}${seq}`;
}
