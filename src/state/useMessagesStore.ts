import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChatMessage = {
  id: string;
  from: 'me' | 'them';
  text: string;
  ts: number;
};

export type Relationship = 'manager' | 'recruiter' | 'colleague' | 'linkedin' | 'mentor' | 'hr' | 'client';

export type Contact = {
  id: string;
  name: string;
  role: string;
  company: string;
  relationship: Relationship;
  /** Short tagline shown under the name in the conversation header. */
  status: string;
};

export type Conversation = {
  contactId: string;
  messages: ChatMessage[];
  /** Whether the user has opened/read the latest incoming message. */
  unread: boolean;
};

let seqCounter = 0;
export const nextMsgId = () => {
  seqCounter += 1;
  return `m${Date.now().toString(36)}${seqCounter}`;
};

type MessagesStore = {
  conversations: Record<string, Conversation>;
  /** Ensure a conversation exists with a seeded opener from the contact. */
  ensureConversation: (contactId: string, opener?: string, ts?: number) => void;
  appendMessage: (contactId: string, msg: ChatMessage) => void;
  markRead: (contactId: string) => void;
};

export const useMessagesStore = create<MessagesStore>()(
  persist(
    (set, get) => ({
      conversations: {},
      ensureConversation: (contactId, opener, ts) => {
        if (get().conversations[contactId]) return;
        const messages: ChatMessage[] = opener
          ? [{ id: nextMsgId(), from: 'them', text: opener, ts: ts ?? Date.now() }]
          : [];
        set((s) => ({
          conversations: { ...s.conversations, [contactId]: { contactId, messages, unread: !!opener } },
        }));
      },
      appendMessage: (contactId, msg) =>
        set((s) => {
          const conv = s.conversations[contactId] ?? { contactId, messages: [], unread: false };
          return {
            conversations: {
              ...s.conversations,
              [contactId]: {
                ...conv,
                messages: [...conv.messages, msg],
                unread: msg.from === 'them',
              },
            },
          };
        }),
      markRead: (contactId) =>
        set((s) => {
          const conv = s.conversations[contactId];
          if (!conv || !conv.unread) return s;
          return { conversations: { ...s.conversations, [contactId]: { ...conv, unread: false } } };
        }),
    }),
    { name: 'aos-messages-store' },
  ),
);
