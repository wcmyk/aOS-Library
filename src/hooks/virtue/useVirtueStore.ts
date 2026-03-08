import { create } from 'zustand';
import { virtueCatalog } from '../../data/virtue/catalog';
import type { VirtueInstallState, VirtueView } from '../../types/virtue';

type LayoutMode = 'grid' | 'list';
type SortMode = 'name-asc' | 'name-desc' | 'rating-desc' | 'updated-desc';

type VirtueState = {
  activeView: VirtueView;
  selectedAppId: string | null;
  searchQuery: string;
  selectedCategory: string | null;
  layoutMode: LayoutMode;
  sortMode: SortMode;
  recentSearches: string[];
  installStates: Record<string, VirtueInstallState>;
  setView: (view: VirtueView) => void;
  setSelectedApp: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setCategory: (categoryId: string | null) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setSortMode: (mode: SortMode) => void;
  installApp: (appId: string) => void;
  openApp: (appId: string) => void;
  updateApp: (appId: string) => void;
  updateAll: () => void;
};

const STORAGE_KEY = 'virtue-install-states';

const initialInstallStates = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, VirtueInstallState>;
    return parsed;
  } catch {
    return {};
  }
};

const persistStates = (states: Record<string, VirtueInstallState>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
};

export const useVirtueStore = create<VirtueState>((set, get) => ({
  activeView: 'discover',
  selectedAppId: null,
  searchQuery: '',
  selectedCategory: null,
  layoutMode: 'grid',
  sortMode: 'name-asc',
  recentSearches: [],
  installStates: typeof window === 'undefined' ? {} : initialInstallStates(),
  setView: (view) => set({ activeView: view }),
  setSelectedApp: (id) => set({ selectedAppId: id, activeView: id ? 'detail' : get().activeView }),
  setSearchQuery: (query) =>
    set((state) => {
      const trimmed = query.trim();
      const recents = trimmed ? [trimmed, ...state.recentSearches.filter((s) => s !== trimmed)].slice(0, 8) : state.recentSearches;
      return { searchQuery: query, recentSearches: recents, activeView: 'search' };
    }),
  setCategory: (categoryId) => set({ selectedCategory: categoryId }),
  setLayoutMode: (mode) => set({ layoutMode: mode }),
  setSortMode: (mode) => set({ sortMode: mode }),
  installApp: (appId) => {
    set((state) => {
      const next = { ...state.installStates, [appId]: 'installing' as VirtueInstallState };
      persistStates(next);
      return { installStates: next };
    });

    window.setTimeout(() => {
      set((state) => {
        const next = { ...state.installStates, [appId]: 'installed' as VirtueInstallState };
        persistStates(next);
        return { installStates: next };
      });
    }, 1400);
  },
  openApp: () => undefined,
  updateApp: (appId) => {
    set((state) => {
      const next = { ...state.installStates, [appId]: 'installing' as VirtueInstallState };
      persistStates(next);
      return { installStates: next };
    });

    window.setTimeout(() => {
      set((state) => {
        const next = { ...state.installStates, [appId]: 'installed' as VirtueInstallState };
        persistStates(next);
        return { installStates: next };
      });
    }, 1100);
  },
  updateAll: () => {
    const toUpdate = virtueCatalog.apps.filter((app) => get().installStates[app.id] === 'update_available');
    toUpdate.forEach((app, idx) => {
      window.setTimeout(() => get().updateApp(app.id), idx * 120);
    });
  },
}));
