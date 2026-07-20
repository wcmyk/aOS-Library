import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// iMessage-style text threads. Carries carrier notices, a phishing-awareness
// text, and live two-factor verification codes for enterprise sign-ins.

export type SmsMessage = { text: string; at: string; fromMe?: boolean };
export type SmsThread = { id: string; sender: string; shortcode?: boolean; messages: SmsMessage[] };

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
