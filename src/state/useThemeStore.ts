import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// System-wide appearance. The selected mode is stamped on <html data-theme>
// so every themed app (Settings, Safari chrome, Messages, Calendar) restyles
// through CSS while keeping its layout identical.

export type ThemeMode = 'dark' | 'light';

type ThemeStore = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: 'dark',
      setMode: (mode) => set({ mode }),
    }),
    { name: 'aos-theme-store' },
  ),
);
