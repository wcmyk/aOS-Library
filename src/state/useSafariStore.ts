import { create } from 'zustand';

type SafariStore = {
  pendingUrl: string | null;
  navigate: (url: string) => void;
  clearPending: () => void;
};

export const useSafariStore = create<SafariStore>((set) => ({
  pendingUrl: null,
  navigate: (url) => set({ pendingUrl: url }),
  clearPending: () => set({ pendingUrl: null }),
}));
