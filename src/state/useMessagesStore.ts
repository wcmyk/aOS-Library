import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// iMessage-style text threads. Carries carrier notices, a phishing-awareness
// text, and live two-factor verification codes for enterprise sign-ins.

export type SmsMessage = { text: string; at: string; fromMe?: boolean };

// Human contacts get contextual auto-replies from the reply engine, keyed to
// their relationship persona. Shortcode senders never reply.
export type Contact = {
  id: string;
  name: string;
  relationship: 'manager' | 'recruiter' | 'colleague' | 'linkedin' | 'mentor' | 'hr' | 'client';
  company: string;
  role?: string;
};

// Reply-engine view of a conversation turn.
export type ChatMessage = { from: 'me' | 'them'; text: string; at: string };

export type SmsThread = { id: string; sender: string; shortcode?: boolean; contact?: Contact; messages: SmsMessage[] };

type MessagesStore = {
  threads: SmsThread[];
  lastRead: Record<string, number>;
  appendMessage: (sender: string, text: string, opts?: { fromMe?: boolean; shortcode?: boolean }) => void;
  markThreadRead: (id: string) => void;
  issueVerificationCode: (service: string, org: string) => string;
};

const iso = (minsAgo: number) => new Date(Date.now() - minsAgo * 60 * 1000).toISOString();

const SEED_THREADS: SmsThread[] = [
  {
    id: 'ct-recruiter',
    sender: 'Naomi Calloway',
    contact: { id: 'ct-recruiter', name: 'Naomi Calloway', relationship: 'recruiter', company: 'Google', role: 'Talent Acquisition' },
    messages: [
      { text: 'Hi! Naomi here — I sourced your profile on LinkedIn. When you have a minute I would love to hear what you are looking for in your next role.', at: iso(60 * 30) },
    ],
  },
  {
    id: 'ct-mentor',
    sender: 'Prof. Alvarez',
    contact: { id: 'ct-mentor', name: 'Prof. Alvarez', relationship: 'mentor', company: 'University of Michigan', role: 'Faculty Mentor' },
    messages: [
      { text: 'Saw your graduation photos — congratulations again. Keep me posted on the job hunt, and lean on me for references anytime.', at: iso(60 * 50) },
    ],
  },
  {
    id: 'ct-colleague',
    sender: 'Marcus Thornton',
    contact: { id: 'ct-colleague', name: 'Marcus Thornton', relationship: 'colleague', company: 'aOS', role: 'Senior Engineer' },
    messages: [
      { text: 'Yo — lunch crew is trying the new taqueria on 5th at noon Friday. You in?', at: iso(60 * 9) },
    ],
  },
  {
    id: 'vzw',
    sender: '899-88',
    shortcode: true,
    messages: [
      { text: 'Verizon Msg: Your bill is ready. Your autopay of $92.14 will process on the 28th. To view: vzw.com/bill', at: iso(60 * 26) },
    ],
  },
  {
    id: 'phish',
    sender: '+1 (938) 202-8817',
    messages: [
      { text: 'USPS: Your package is on hold due to an incomplete address. Confirm your details within 24 hours to avoid return: usps-redelivery-help.info/track', at: iso(60 * 7) },
      { text: 'Reminder: this is a common phishing pattern. The USPS never texts links like this — do not tap, do not reply.', at: iso(60 * 7 - 1) },
    ],
  },
];

export const useMessagesStore = create<MessagesStore>()(
  persist(
    (set, get) => ({
      threads: SEED_THREADS,
      lastRead: {},
      appendMessage: (sender, text, opts) => set((s) => {
        const existing = s.threads.find((t) => t.sender === sender);
        const msg: SmsMessage = { text, at: new Date().toISOString(), fromMe: opts?.fromMe };
        if (existing) {
          return {
            threads: s.threads.map((t) => (t.id === existing.id ? { ...t, messages: [...t.messages, msg] } : t)),
          };
        }
        return {
          threads: [
            { id: `th-${s.threads.length}-${Date.now()}`, sender, shortcode: opts?.shortcode, messages: [msg] },
            ...s.threads,
          ],
        };
      }),
      markThreadRead: (id) => set((s) => ({ lastRead: { ...s.lastRead, [id]: Date.now() } })),
      issueVerificationCode: (service, org) => {
        const code = String(Math.floor(100000 + Math.random() * 900000));
        get().appendMessage(
          service === 'teams' ? '62-953' : '77-461',
          `Your ${service === 'teams' ? 'Microsoft Teams' : 'Workday'} verification code for ${org} is ${code}. It expires in 10 minutes. Don't share this code with anyone.`,
          { shortcode: true },
        );
        return code;
      },
    }),
    { name: 'aos-messages-store' },
  ),
);
