import { create } from 'zustand';

export type DriveDocumentType = 'document' | 'spreadsheet';

export type DriveDocument = {
  id: string;
  type: DriveDocumentType;
  title: string;
  content: string;
  updatedAt: string;
  owner: string;
  sharedWith: string[];
  folder: 'Documents' | 'Shared' | 'Archive';
};

type DriveStore = {
  documents: DriveDocument[];
  activeDocumentId: string | null;
  createDocument: (title?: string) => string;
  createSpreadsheet: (title?: string) => string;
  updateDocument: (id: string, updates: Partial<Pick<DriveDocument, 'title' | 'content' | 'sharedWith' | 'folder'>>) => void;
  setActiveDocument: (id: string | null) => void;
};

const now = () => new Date().toISOString();

const seedDocuments: DriveDocument[] = [
  {
    id: 'doc-1',
    type: 'document',
    title: 'Q2 Product Narrative',
    content: 'Vision transforms workspace search into a native experience with instant recall and low-latency interaction.',
    updatedAt: now(),
    owner: 'You',
    sharedWith: ['Product Team'],
    folder: 'Documents',
  },
  {
    id: 'doc-2',
    type: 'document',
    title: 'Launch Checklist',
    content: 'Finalize QA signoff, verify release notes, run smoke tests, and coordinate rollout windows.',
    updatedAt: now(),
    owner: 'You',
    sharedWith: [],
    folder: 'Documents',
  },
  {
    id: 'sheet-1',
    type: 'spreadsheet',
    title: 'Revenue Forecast FY26',
    content: 'Month\tPlan\tActual\nJan\t145000\t139000\nFeb\t152000\t149500\nMar\t168000\t163400',
    updatedAt: now(),
    owner: 'Finance',
    sharedWith: ['You'],
    folder: 'Shared',
  },
];

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `doc-${Math.random().toString(36).slice(2, 8)}`;

export const useDriveStore = create<DriveStore>((set) => ({
  documents: seedDocuments,
  activeDocumentId: null,
  createDocument: (title = 'Untitled document') => {
    const id = generateId();
    set((state) => ({
      documents: [
        {
          id,
          type: 'document',
          title,
          content: '',
          updatedAt: now(),
          owner: 'You',
          sharedWith: [],
          folder: 'Documents',
        },
        ...state.documents,
      ],
      activeDocumentId: id,
    }));
    return id;
  },
  createSpreadsheet: (title = 'Untitled workbook') => {
    const id = generateId();
    const starter = 'Item\tOwner\tStatus\nBudget\tYou\tDraft\nHeadcount\tOps\tReview';
    set((state) => ({
      documents: [
        {
          id,
          type: 'spreadsheet',
          title,
          content: starter,
          updatedAt: now(),
          owner: 'You',
          sharedWith: [],
          folder: 'Documents',
        },
        ...state.documents,
      ],
      activeDocumentId: id,
    }));
    return id;
  },
  updateDocument: (id, updates) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              ...updates,
              updatedAt: now(),
            }
          : doc,
      ),
    }));
  },
  setActiveDocument: (id) => set({ activeDocumentId: id }),
}));
