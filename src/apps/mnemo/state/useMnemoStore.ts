import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  StudySet,
  Flashcard,
  StudySession,
  SessionResult,
  AppView,
  StudyMode,
  AnswerDirection,
} from '../types';

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface MnemoState {
  sets: StudySet[];
  sessions: StudySession[];
  activeSetId: string | null;
  activeView: AppView;
  studyMode: StudyMode;
  answerDirection: AnswerDirection;
  currentSession: StudySession | null;

  createSet(title: string, description: string): StudySet;
  updateSet(id: string, partial: Partial<Omit<StudySet, 'id'>>): void;
  deleteSet(id: string): void;
  addCard(setId: string, term: string, definition: string): void;
  updateCard(setId: string, cardId: string, partial: Partial<Omit<Flashcard, 'id'>>): void;
  deleteCard(setId: string, cardId: string): void;
  reorderCards(setId: string, newOrder: string[]): void;
  importCards(setId: string, cards: { term: string; definition: string }[]): void;
  setActiveSet(id: string | null): void;
  setView(view: AppView): void;
  setStudyMode(mode: StudyMode): void;
  setAnswerDirection(dir: AnswerDirection): void;
  startSession(setId: string, mode: StudyMode): void;
  recordResult(cardId: string, correct: boolean, timeMs: number): void;
  endSession(): void;
  bulkImportSet(
    title: string,
    pairs: { term: string; definition: string }[],
    sourceType: StudySet['sourceType'],
  ): StudySet;
}

export const useMnemoStore = create<MnemoState>()(
  persist(
    (set, get) => ({
      sets: [],
      sessions: [],
      activeSetId: null,
      activeView: 'library',
      studyMode: 'flashcards',
      answerDirection: 'term_to_definition',
      currentSession: null,

      createSet(title, description) {
        const now = new Date();
        const newSet: StudySet = {
          id: genId(),
          title,
          description,
          tags: [],
          createdAt: now,
          updatedAt: now,
          sourceType: 'manual',
          cards: [],
          phases: [],
        };
        set((s) => ({ sets: [...s.sets, newSet] }));
        return newSet;
      },

      updateSet(id, partial) {
        set((s) => ({
          sets: s.sets.map((st) =>
            st.id === id ? { ...st, ...partial, updatedAt: new Date() } : st,
          ),
        }));
      },

      deleteSet(id) {
        set((s) => ({
          sets: s.sets.filter((st) => st.id !== id),
          activeSetId: s.activeSetId === id ? null : s.activeSetId,
        }));
      },

      addCard(setId, term, definition) {
        const card: Flashcard = {
          id: genId(),
          term,
          definition,
          difficulty: 'medium',
          starred: false,
        };
        set((s) => ({
          sets: s.sets.map((st) =>
            st.id === setId
              ? { ...st, cards: [...st.cards, card], updatedAt: new Date() }
              : st,
          ),
        }));
      },

      updateCard(setId, cardId, partial) {
        set((s) => ({
          sets: s.sets.map((st) =>
            st.id === setId
              ? {
                  ...st,
                  cards: st.cards.map((c) =>
                    c.id === cardId ? { ...c, ...partial } : c,
                  ),
                  updatedAt: new Date(),
                }
              : st,
          ),
        }));
      },

      deleteCard(setId, cardId) {
        set((s) => ({
          sets: s.sets.map((st) =>
            st.id === setId
              ? {
                  ...st,
                  cards: st.cards.filter((c) => c.id !== cardId),
                  updatedAt: new Date(),
                }
              : st,
          ),
        }));
      },

      reorderCards(setId, newOrder) {
        set((s) => ({
          sets: s.sets.map((st) => {
            if (st.id !== setId) return st;
            const cardMap = new Map(st.cards.map((c) => [c.id, c]));
            const reordered = newOrder.map((id) => cardMap.get(id)!).filter(Boolean);
            return { ...st, cards: reordered, updatedAt: new Date() };
          }),
        }));
      },

      importCards(setId, cards) {
        const newCards: Flashcard[] = cards.map((c) => ({
          id: genId(),
          term: c.term,
          definition: c.definition,
          difficulty: 'medium',
          starred: false,
        }));
        set((s) => ({
          sets: s.sets.map((st) =>
            st.id === setId
              ? { ...st, cards: [...st.cards, ...newCards], updatedAt: new Date() }
              : st,
          ),
        }));
      },

      setActiveSet(id) {
        set({ activeSetId: id });
      },

      setView(view) {
        set({ activeView: view });
      },

      setStudyMode(mode) {
        set({ studyMode: mode });
      },

      setAnswerDirection(dir) {
        set({ answerDirection: dir });
      },

      startSession(setId, mode) {
        const session: StudySession = {
          id: genId(),
          setId,
          mode,
          startedAt: new Date(),
          results: [],
          accuracy: 0,
          streak: 0,
        };
        set({ currentSession: session });
      },

      recordResult(cardId, correct, timeMs) {
        const session = get().currentSession;
        if (!session) return;
        const existing = session.results.find((r) => r.cardId === cardId);
        let newResults: SessionResult[];
        if (existing) {
          newResults = session.results.map((r) =>
            r.cardId === cardId
              ? { ...r, attempts: r.attempts + 1, correct, timeMs }
              : r,
          );
        } else {
          newResults = [
            ...session.results,
            { cardId, correct, attempts: 1, timeMs },
          ];
        }
        const correctCount = newResults.filter((r) => r.correct).length;
        const accuracy = newResults.length > 0 ? correctCount / newResults.length : 0;
        set({
          currentSession: { ...session, results: newResults, accuracy },
        });
      },

      endSession() {
        const session = get().currentSession;
        if (!session) return;
        const ended = { ...session, endedAt: new Date() };
        set((s) => ({
          sessions: [...s.sessions, ended],
          currentSession: null,
        }));
      },

      bulkImportSet(title, pairs, sourceType) {
        const now = new Date();
        const cards: Flashcard[] = pairs.map((p) => ({
          id: genId(),
          term: p.term,
          definition: p.definition,
          difficulty: 'medium',
          starred: false,
        }));
        const newSet: StudySet = {
          id: genId(),
          title,
          description: '',
          tags: [],
          createdAt: now,
          updatedAt: now,
          sourceType,
          cards,
          phases: [],
        };
        set((s) => ({ sets: [...s.sets, newSet] }));
        return newSet;
      },
    }),
    {
      name: 'aos-mnemo-v1',
      partialize: (state) => ({
        sets: state.sets,
        sessions: state.sessions,
        answerDirection: state.answerDirection,
      }),
    },
  ),
);
