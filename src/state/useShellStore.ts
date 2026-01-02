import { create } from 'zustand';
import { apps, type ShellApp } from '../data/apps';

export type WindowState = {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
};

export type Command = {
  id: string;
  title: string;
  description: string;
  action: () => void;
  icon?: string;
};

type ShellStore = {
  windows: WindowState[];
  apps: ShellApp[];
  workspaceName: string;
  zCounter: number;
  spotlightOpen: boolean;
  spotlightQuery: string;
  openWindow: (appId: string) => void;
  focusWindow: (id: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number) => void;
  toggleSpotlight: (value?: boolean) => void;
  setSpotlightQuery: (value: string) => void;
};

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `win-${Math.random().toString(36).slice(2, 8)}`;

export const useShellStore = create<ShellStore>((set, get) => ({
  windows: [],
  apps,
  workspaceName: 'AngelOS Playground',
  zCounter: 10,
  spotlightOpen: false,
  spotlightQuery: '',
  openWindow: (appId) =>
    set((state) => {
      const existing = state.windows.find((window) => window.appId === appId);
      const nextZ = state.zCounter + 1;

      if (existing) {
        return {
          windows: state.windows.map((window) =>
            window.id === existing.id
              ? { ...window, minimized: false, zIndex: nextZ }
              : window,
          ),
          zCounter: nextZ,
          spotlightOpen: false,
        };
      }

      const app = state.apps.find((item) => item.id === appId);
      const offset = 120 + state.windows.length * 22;
      const width = app?.defaultSize.width ?? 720;
      const height = app?.defaultSize.height ?? 460;

      const newWindow: WindowState = {
        id: generateId(),
        appId,
        title: app?.name ?? 'Window',
        x: offset,
        y: offset + 30,
        width,
        height,
        zIndex: nextZ,
        minimized: false,
      };

      return {
        windows: [...state.windows, newWindow],
        zCounter: nextZ,
        spotlightOpen: false,
      };
    }),
  focusWindow: (id) =>
    set((state) => {
      const nextZ = state.zCounter + 1;
      return {
        windows: state.windows.map((window) =>
          window.id === id ? { ...window, minimized: false, zIndex: nextZ } : window,
        ),
        zCounter: nextZ,
      };
    }),
  closeWindow: (id) => set((state) => ({ windows: state.windows.filter((win) => win.id !== id) })),
  minimizeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((window) =>
        window.id === id ? { ...window, minimized: true } : window,
      ),
    })),
  moveWindow: (id, x, y) =>
    set((state) => ({
      windows: state.windows.map((window) => (window.id === id ? { ...window, x, y } : window)),
    })),
  resizeWindow: (id, width, height) =>
    set((state) => ({
      windows: state.windows.map((window) =>
        window.id === id ? { ...window, width: Math.max(340, width), height: Math.max(260, height) } : window,
      ),
    })),
  toggleSpotlight: (value) => set({ spotlightOpen: value ?? !get().spotlightOpen }),
  setSpotlightQuery: (value) => set({ spotlightQuery: value }),
}));
