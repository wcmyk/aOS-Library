import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { REAL_COMPANIES } from '../data/companies';

export type CompanyArchetype = 'tech' | 'finance' | 'consulting' | 'startup';

export type CompanyDirectoryItem = {
  id: string;
  name: string;
  domain: string;
  archetype: CompanyArchetype;
  industry: string;
  color: string;
  careersSummary: string;
};

export type PromotionRecord = {
  at: string;
  fromTitle: string;
  toTitle: string;
  fromComp: number;
  toComp: number;
  trigger: string;
  companyId: string;
  steps: number;
};

export type EmployerAccount = {
  id: string;
  companyId: string;
  companyName: string;
  domain: string;
  employeeId: string;
  companyEmail: string;
  outlookPassword: string;
  workdayPassword: string;
  title: string;
  department: string;
  managerName: string;
  compensation: number;
  employmentStatus: 'active' | 'onboarding' | 'inactive';
  startDate: string;
  location: string;
  workdayLoggedIn: boolean;
  colabLoggedIn: boolean;
  promotionHistory: PromotionRecord[];
};

type SessionState = {
  activeOutlookEmail: string | null;
  activeWorkdayAccountId: string | null;
  activeColabAccountId: string | null;
};

type CompanyStore = {
  companies: CompanyDirectoryItem[];
  employerAccounts: EmployerAccount[];
  sessions: SessionState;
  ensureEmployerFromOffer: (params: {
    companyName: string;
    role: string;
    compensation: number;
    managerName: string;
    location: string;
    fullName: string;
    department?: string;
  }) => EmployerAccount;
  loginWorkday: (accountId: string, password: string) => boolean;
  logoutWorkday: () => void;
  loginOutlook: (email: string, password: string) => boolean;
  logoutOutlook: () => void;
  loginColab: (accountId: string, password: string) => boolean;
  logoutColab: () => void;
  applyPromotionCommand: (companyEmail: string, percentCount: number, trigger: string) => PromotionRecord | null;
};

const curatedCompanies: CompanyDirectoryItem[] = REAL_COMPANIES.slice(0, 24).map((c, idx) => ({
  id: c.domain.replace(/\./g, '-'),
  name: c.name,
  domain: c.domain,
  archetype: c.archetype as CompanyArchetype,
  industry: c.sector,
  color: ['#2563eb', '#0f766e', '#7c3aed', '#be123c', '#0369a1'][idx % 5],
  careersSummary: `Explore opportunities at ${c.name} across ${c.sector}.`,
}));

const LADDERS: Record<CompanyArchetype, string[]> = {
  tech: ['Junior Software Engineer', 'Software Engineer I', 'Software Engineer II', 'Software Engineer III', 'Senior Software Engineer', 'Staff Engineer', 'Principal Engineer'],
  finance: ['Technology Analyst', 'Associate Engineer', 'Software Engineer', 'Senior Software Engineer', 'Lead Engineer', 'Director, Engineering'],
  consulting: ['Associate', 'Consultant', 'Senior Consultant', 'Manager', 'Senior Manager', 'Principal'],
  startup: ['Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'Principal Engineer', 'Head of Engineering'],
};

const salaryBump = (comp: number) => Math.round(comp * (1.07 + Math.random() * 0.08));

function normalizeName(fullName: string) {
  const clean = fullName.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  const [first = 'user', last = 'employee'] = clean.split(/\s+/);
  return { first, last };
}

function generateCompanyEmail(fullName: string, domain: string, existing: string[]): string {
  const { first, last } = normalizeName(fullName);
  const patterns = [`${first}.${last}`, `${first[0]}${last}`, `${first}${last}`, `${last}.${first}`];
  for (const base of patterns) {
    const candidate = `${base}@${domain}`;
    if (!existing.includes(candidate)) return candidate;
  }
  return `${first}.${last}${existing.length + 2}@${domain}`;
}

export const useCompanyStore = create<CompanyStore>()(
  persist(
    (set, get) => ({
      companies: curatedCompanies,
      employerAccounts: [],
      sessions: {
        activeOutlookEmail: 'user@workspace.aos',
        activeWorkdayAccountId: null,
        activeColabAccountId: null,
      },
      ensureEmployerFromOffer: ({ companyName, role, compensation, managerName, location, fullName, department }) => {
        const state = get();
        const company = state.companies.find((c) => c.name.toLowerCase() === companyName.toLowerCase())
          ?? state.companies.find((c) => companyName.toLowerCase().includes(c.name.toLowerCase()))
          ?? {
            id: companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: companyName,
            domain: `${companyName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
            archetype: 'startup' as CompanyArchetype,
            industry: 'Technology',
            color: '#2563eb',
            careersSummary: `Careers at ${companyName}`,
          };
        const existing = state.employerAccounts.find((a) => a.companyId === company.id);
        if (existing) return existing;

        const used = state.employerAccounts.map((a) => a.companyEmail);
        const companyEmail = generateCompanyEmail(fullName, company.domain, used);
        const account: EmployerAccount = {
          id: `emp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          companyId: company.id,
          companyName: company.name,
          domain: company.domain,
          employeeId: `WD-${Math.floor(100000 + Math.random() * 900000)}`,
          companyEmail,
          outlookPassword: 'Welcome@123',
          workdayPassword: 'Workday@123',
          title: role,
          department: department ?? 'Engineering',
          managerName,
          compensation: Math.max(compensation || 90000, 60000),
          employmentStatus: 'onboarding',
          startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10),
          location,
          workdayLoggedIn: false,
          colabLoggedIn: false,
          promotionHistory: [],
        };
        set((s) => ({ employerAccounts: [account, ...s.employerAccounts] }));
        return account;
      },
      loginWorkday: (accountId, password) => {
        const acc = get().employerAccounts.find((a) => a.id === accountId);
        if (!acc || acc.workdayPassword !== password) return false;
        set((s) => ({
          sessions: { ...s.sessions, activeWorkdayAccountId: accountId },
          employerAccounts: s.employerAccounts.map((a) => a.id === accountId ? { ...a, workdayLoggedIn: true } : a),
        }));
        return true;
      },
      logoutWorkday: () => set((s) => ({ sessions: { ...s.sessions, activeWorkdayAccountId: null } })),
      loginOutlook: (email, password) => {
        if (email === 'user@workspace.aos' && password === 'workspace') {
          set((s) => ({ sessions: { ...s.sessions, activeOutlookEmail: email } }));
          return true;
        }
        const acc = get().employerAccounts.find((a) => a.companyEmail.toLowerCase() === email.toLowerCase());
        if (!acc || acc.outlookPassword !== password) return false;
        set((s) => ({ sessions: { ...s.sessions, activeOutlookEmail: acc.companyEmail } }));
        return true;
      },
      logoutOutlook: () => set((s) => ({ sessions: { ...s.sessions, activeOutlookEmail: null } })),
      loginColab: (accountId, password) => {
        const acc = get().employerAccounts.find((a) => a.id === accountId);
        if (!acc || acc.workdayPassword !== password) return false;
        set((s) => ({
          sessions: { ...s.sessions, activeColabAccountId: accountId },
          employerAccounts: s.employerAccounts.map((a) => a.id === accountId ? { ...a, colabLoggedIn: true } : a),
        }));
        return true;
      },
      logoutColab: () => set((s) => ({ sessions: { ...s.sessions, activeColabAccountId: null } })),
      applyPromotionCommand: (companyEmail, percentCount, trigger) => {
        const state = get();
        const idx = state.employerAccounts.findIndex((a) => a.companyEmail.toLowerCase() === companyEmail.toLowerCase());
        if (idx < 0) return null;
        const account = state.employerAccounts[idx];
        const company = state.companies.find((c) => c.id === account.companyId);
        const ladder = LADDERS[company?.archetype ?? 'startup'];
        let titleIndex = ladder.findIndex((t) => t.toLowerCase() === account.title.toLowerCase());
        if (titleIndex < 0) titleIndex = Math.max(0, ladder.findIndex((t) => /engineer|associate|consultant/.test(t.toLowerCase())));
        const maxAllowed = Math.max(0, ladder.length - 2); // block top executive-like tier
        const nextIndex = Math.min(maxAllowed, titleIndex + Math.max(1, percentCount));
        if (nextIndex === titleIndex) return null;

        const newComp = salaryBump(account.compensation);
        const record: PromotionRecord = {
          at: new Date().toISOString(),
          fromTitle: account.title,
          toTitle: ladder[nextIndex],
          fromComp: account.compensation,
          toComp: newComp,
          trigger,
          companyId: account.companyId,
          steps: percentCount,
        };

        set((s) => ({
          employerAccounts: s.employerAccounts.map((a) => a.id === account.id ? {
            ...a,
            title: record.toTitle,
            compensation: record.toComp,
            employmentStatus: 'active',
            promotionHistory: [record, ...a.promotionHistory],
          } : a),
        }));
        return record;
      },
    }),
    { name: 'aos-company-store-v1' },
  ),
);
