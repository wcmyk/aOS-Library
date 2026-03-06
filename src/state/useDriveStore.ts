import { create } from 'zustand';

export type DriveDocument = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  owner: string;
  sharedWith: string[];
  folder: 'Documents' | 'Shared' | 'Archive';
};

type DriveStore = {
  documents: DriveDocument[];
  createDocument: (title?: string) => string;
  updateDocument: (id: string, updates: Partial<Pick<DriveDocument, 'title' | 'content' | 'sharedWith' | 'folder'>>) => void;
};

const now = () => new Date().toISOString();

const seedDocuments: DriveDocument[] = [
  {
    id: 'doc-1',
    title: 'Q2 Product Narrative',
    content: 'Vision transforms workspace search into a native experience with instant recall and low-latency interaction.',
    updatedAt: now(),
    owner: 'You',
    sharedWith: ['Product Team'],
    folder: 'Documents',
  },
  {
    id: 'doc-2',
    title: 'Launch Checklist',
    content: 'Finalize QA signoff, verify release notes, run smoke tests, and coordinate rollout windows.',
    updatedAt: now(),
    owner: 'You',
    sharedWith: [],
    folder: 'Documents',
  },
  {
    id: 'doc-3',
    title: 'Shared Design Notes',
    content: 'Typography, spacing system, and interaction animations for dock and window chrome.',
    updatedAt: now(),
    owner: 'Design',
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
  createDocument: (title = 'Untitled document') => {
    const id = generateId();
    set((state) => ({
      documents: [
        {
          id,
          title,
          content: '',
          updatedAt: now(),
          owner: 'You',
          sharedWith: [],
          folder: 'Documents',
        },
        ...state.documents,
      ],
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
}));
