import { create } from 'zustand';

export type EmailFolder = 'inbox' | 'starred' | 'sent' | 'drafts' | 'trash';

export type Email = {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  starred: boolean;
  folder: EmailFolder;
};

type MailStore = {
  emails: Email[];
  sendEmail: (email: Omit<Email, 'id' | 'read' | 'starred' | 'folder'> & { folder?: EmailFolder }) => void;
  markRead: (id: string) => void;
  toggleStar: (id: string) => void;
  moveToFolder: (id: string, folder: EmailFolder) => void;
  deleteEmail: (id: string) => void;
};

const now = () => new Date().toISOString();
const ts = (offsetMs: number) => new Date(Date.now() - offsetMs).toISOString();

const SEED_EMAILS: Email[] = [
  {
    id: 'mail-001',
    from: 'aOS Team <noreply@workspace.aos>',
    to: 'user@workspace.aos',
    subject: 'Welcome to Outlook on aOS',
    body: `<p>Welcome to your aOS workspace email client.</p>
<p>Your inbox is connected across all aOS applications. Job applications submitted through Safari will deliver confirmation emails directly here.</p>
<p>To compose a new message, click <strong>New Message</strong> in the toolbar above.</p>
<br><p>— The aOS Team</p>`,
    date: ts(1000 * 60 * 60 * 2),
    read: false,
    starred: false,
    folder: 'inbox',
  },
  {
    id: 'mail-002',
    from: 'Platform Alerts <alerts@workspace.aos>',
    to: 'user@workspace.aos',
    subject: 'Workspace storage at 34% capacity',
    body: `<p>Your Sanctum workspace storage is currently at <strong>34%</strong> of total capacity.</p>
<p>No action is required at this time. You will be notified again at 80%.</p>
<br><p>— aOS Platform</p>`,
    date: ts(1000 * 60 * 60 * 5),
    read: true,
    starred: false,
    folder: 'inbox',
  },
  {
    id: 'mail-003',
    from: 'Priya Hartwell <p.hartwell@stratexus.com>',
    to: 'user@workspace.aos',
    subject: 'Re: Q3 Data Pipeline Review',
    body: `<p>Thanks for the update. The latency numbers look good — we should be fine for the Thursday presentation.</p>
<p>One note: make sure the Redshift query on line 47 is using the partitioned index. Last quarter it caused a full table scan that delayed the nightly batch by ~40 minutes.</p>
<p>Let me know if you need anything else before the sync.</p>
<br><p>Best,<br>Priya</p>`,
    date: ts(1000 * 60 * 60 * 24),
    read: true,
    starred: true,
    folder: 'inbox',
  },
  {
    id: 'mail-004',
    from: 'Marcus Thornton <m.thornton@neurova.io>',
    to: 'user@workspace.aos',
    subject: 'Intro call — Thursday 2pm?',
    body: `<p>Hi,</p>
<p>I came across your profile and thought your background in ML infrastructure would be a strong fit for a role we're building out at Neurova. We're a Series B company working on real-time inference systems for enterprise clients.</p>
<p>Would you be open to a 20-minute introductory call this Thursday at 2pm? Happy to work around your schedule if another time is better.</p>
<br><p>Best,<br>Marcus Thornton<br>Head of Engineering, Neurova IO</p>`,
    date: ts(1000 * 60 * 60 * 48),
    read: false,
    starred: false,
    folder: 'inbox',
  },
];

export const useMailStore = create<MailStore>((set) => ({
  emails: SEED_EMAILS,

  sendEmail: (partial) => {
    const email: Email = {
      id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      read: false,
      starred: false,
      folder: partial.folder ?? 'inbox',
      ...partial,
      date: partial.date ?? now(),
    };
    set((state) => ({ emails: [email, ...state.emails] }));
  },

  markRead: (id) =>
    set((state) => ({
      emails: state.emails.map((e) => (e.id === id ? { ...e, read: true } : e)),
    })),

  toggleStar: (id) =>
    set((state) => ({
      emails: state.emails.map((e) =>
        e.id === id ? { ...e, starred: !e.starred, folder: !e.starred ? 'starred' : 'inbox' } : e
      ),
    })),

  moveToFolder: (id, folder) =>
    set((state) => ({
      emails: state.emails.map((e) => (e.id === id ? { ...e, folder } : e)),
    })),

  deleteEmail: (id) =>
    set((state) => ({
      emails: state.emails.map((e) => (e.id === id ? { ...e, folder: 'trash' } : e)),
    })),
}));
