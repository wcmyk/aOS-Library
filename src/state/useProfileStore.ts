import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SimulationRole = 'employee' | 'manager' | 'hrbp' | 'payroll_admin' | 'legal_admin' | 'admin';

export type ProfileStore = {
  fullName: string;
  preferredEmail: string;
  icloudEmail: string;
  roleHeadline: string;
  location: string;
  workdayRole: SimulationRole;
  isPeopleManager: boolean;
  jobTitle: string;
  department: string;
  setProfile: (updates: Partial<Omit<ProfileStore, 'setProfile'>>) => void;
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      fullName: 'Workspace User',
      preferredEmail: 'user@workspace.aos',
      icloudEmail: 'user@icloud.com',
      roleHeadline: 'Software Professional · aOS Workspace',
      location: 'Remote',
      workdayRole: 'employee',
      isPeopleManager: false,
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      setProfile: (updates) => set((state) => ({ ...state, ...updates })),
    }),
    { name: 'aos-profile-store' }
  )
);
