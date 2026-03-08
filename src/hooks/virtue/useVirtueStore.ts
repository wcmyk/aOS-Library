import { create } from 'zustand';
import { getVirtueApps } from '../../data/virtue/provider';
import type { VirtueInstallState, VirtueLayoutMode, VirtueSortMode, VirtueView } from '../../types/virtue';

type VirtueState = {
  activeView: VirtueView;
  selectedAppId: string | null;
  searchQuery: string;
  selectedCategory: string | null;
  layoutMode: VirtueLayoutMode;
  sortMode: VirtueSortMode;
  recentSearches: string[];
  installStates: Record<string, VirtueInstallState>;
  setView: (view: VirtueView) => void;
  setSelectedApp: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  setCategory: (categoryId: string | null) => void;
  setLayoutMode: (mode: VirtueLayoutMode) => void;
  setSortMode: (mode: VirtueSortMode) => void;
  installApp: (appId: string) => void;
  openApp: (appId: string) => void;
  updateApp: (appId: string) => void;
  updateAll: () => void;
};

const INSTALL_STORAGE_KEY = 'virtue-install-states';
const RECENT_STORAGE_KEY = 'virtue-recent-searches';

const safelyRead = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const safelyWrite = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const inferInstallState = (
  appId: string,
  installStates: Record<string, VirtueInstallState>,
): VirtueInstallState => {
  const catalogApp = getVirtueApps().find((app) => app.id === appId);
  if (installStates[appId]) return installStates[appId];
  if (catalogApp?.updateAvailable) return 'update_available';
  if (catalogApp?.installed) return 'installed';
  return 'not_installed';
};

export const useVirtueStore = create<VirtueState>((set, get) => ({
  activeView: 'discover',
  selectedAppId: null,
  searchQuery: '',
  selectedCategory: null,
  layoutMode: 'grid',
  sortMode: 'name-asc',
  recentSearches: safelyRead<string[]>(RECENT_STORAGE_KEY, []),
  installStates: safelyRead<Record<string, VirtueInstallState>>(INSTALL_STORAGE_KEY, {}),
  setView: (view) => set({ activeView: view }),
  setSelectedApp: (id) => set({ selectedAppId: id, activeView: id ? 'detail' : get().activeView }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  addRecentSearch: (query) =>
    set((state) => {
      const trimmed = query.trim();
      if (!trimmed) return state;
      const next = [trimmed, ...state.recentSearches.filter((item) => item !== trimmed)].slice(0, 8);
      safelyWrite(RECENT_STORAGE_KEY, next);
      return { recentSearches: next };
    }),
  clearRecentSearches: () => {
    safelyWrite(RECENT_STORAGE_KEY, []);
    set({ recentSearches: [] });
  },
  setCategory: (categoryId) => set({ selectedCategory: categoryId }),
  setLayoutMode: (mode) => set({ layoutMode: mode }),
  setSortMode: (mode) => set({ sortMode: mode }),
  installApp: (appId) => {
    set((state) => {
      const next = { ...state.installStates, [appId]: 'installing' as const };
      safelyWrite(INSTALL_STORAGE_KEY, next);
      return { installStates: next };
    });

    window.setTimeout(() => {
      set((state) => {
        const next = { ...state.installStates, [appId]: 'installed' as const };
        safelyWrite(INSTALL_STORAGE_KEY, next);
        return { installStates: next };
      });
    }, 1200);
  },
  openApp: () => undefined,
  updateApp: (appId) => {
    set((state) => {
      const next = { ...state.installStates, [appId]: 'installing' as const };
      safelyWrite(INSTALL_STORAGE_KEY, next);
      return { installStates: next };
    });

    window.setTimeout(() => {
      set((state) => {
        const next = { ...state.installStates, [appId]: 'installed' as const };
        safelyWrite(INSTALL_STORAGE_KEY, next);
        return { installStates: next };
      });
    }, 900);
  },
  updateAll: () => {
    const { installStates, updateApp } = get();
    const toUpdate = getVirtueApps().filter((app) => inferInstallState(app.id, installStates) === 'update_available');
    toUpdate.forEach((app, index) => {
      window.setTimeout(() => updateApp(app.id), index * 150);
    });
  },
}));
