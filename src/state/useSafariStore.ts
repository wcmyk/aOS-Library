import { create } from 'zustand';

type SafariStore = {
  currentUrl: string;
  navigate: (url: string) => void;
};

export const useSafariStore = create<SafariStore>((set) => ({
  currentUrl: 'https://linkedin.com',
  navigate: (url) => set({ currentUrl: url.startsWith('http') ? url : `https://${url}` }),
}));
