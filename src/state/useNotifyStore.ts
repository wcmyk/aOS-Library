import { create } from 'zustand';

// macOS-style Notification Center banners. Apps push notifications; the shell
// renders them stacked top-right and auto-dismisses after a few seconds.

export type AppNotification = {
  id: string;
  appId: string;
  appName: string;
  title: string;
  body: string;
  at: number;
};

type NotifyStore = {
  banners: AppNotification[];
  push: (n: Omit<AppNotification, 'id' | 'at'>) => void;
  dismiss: (id: string) => void;
};

let seq = 0;

export const useNotifyStore = create<NotifyStore>()((set) => ({
  banners: [],
  push: (n) => {
    const id = `ntf-${++seq}-${Date.now()}`;
    set((s) => ({ banners: [...s.banners.slice(-3), { ...n, id, at: Date.now() }] }));
    setTimeout(() => set((s) => ({ banners: s.banners.filter((b) => b.id !== id) })), 6500);
  },
  dismiss: (id) => set((s) => ({ banners: s.banners.filter((b) => b.id !== id) })),
}));
