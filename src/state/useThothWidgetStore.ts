import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnswerDirection } from '../apps/mnemo/types';

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export interface ThothWidget {
  id: string;
  setId: string;
  phaseId: string | null;
  direction: AnswerDirection;
  x: number;
  y: number;
}

interface ThothWidgetStore {
  widgets: ThothWidget[];
  addWidget(config: { setId: string; phaseId: string | null; direction: AnswerDirection }): ThothWidget;
  removeWidget(id: string): void;
  moveWidget(id: string, x: number, y: number): void;
}

export const useThothWidgetStore = create<ThothWidgetStore>()(
  persist(
    (set) => ({
      widgets: [],
      addWidget(config) {
        const widget: ThothWidget = {
          id: genId(),
          setId: config.setId,
          phaseId: config.phaseId,
          direction: config.direction,
          x: 100,
          y: 100,
        };
        set((s) => ({ widgets: [...s.widgets, widget] }));
        return widget;
      },
      removeWidget(id) {
        set((s) => ({ widgets: s.widgets.filter((w) => w.id !== id) }));
      },
      moveWidget(id, x, y) {
        set((s) => ({ widgets: s.widgets.map((w) => w.id === id ? { ...w, x, y } : w) }));
      },
    }),
    { name: 'aos-thoth-widgets-v1' }
  )
);
