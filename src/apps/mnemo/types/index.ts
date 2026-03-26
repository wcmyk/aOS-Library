export type StudyMode =
  | 'flashcards'
  | 'learn'
  | 'test'
  | 'match'
  | 'dragmatch'
  | 'written'
  | 'split'
  | 'game_tetris'
  | 'game_speed'
  | 'game_memory'
  | 'game_blast'
  | 'game_falling';

export type AnswerDirection = 'term_to_definition' | 'definition_to_term';

export type AppView =
  | 'library'
  | 'create'
  | 'edit'
  | 'import'
  | 'study'
  | 'games'
  | 'stats'
  | 'settings';

export interface Flashcard {
  id: string;
  term: string;
  definition: string;
  notes?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  starred: boolean;
  phaseId?: string;
}

export interface Phase {
  id: string;
  name: string;
  cardIds: string[];
  sortOrder: number;
}

export interface StudySet {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  sourceType: 'manual' | 'imported_text' | 'imported_csv';
  cards: Flashcard[];
  phases: Phase[];
}

export interface SessionResult {
  cardId: string;
  correct: boolean;
  attempts: number;
  timeMs: number;
}

export interface StudySession {
  id: string;
  setId: string;
  mode: StudyMode;
  startedAt: Date;
  endedAt?: Date;
  results: SessionResult[];
  accuracy: number;
  streak: number;
}
