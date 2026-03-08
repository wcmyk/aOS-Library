import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { JobMeta } from './useMailStore';

type ProfileStore = {
  firstName: string;
  lastName: string;
  avatarColor: string;
  acceptedJob: JobMeta | null;
  setProfile: (firstName: string, lastName: string) => void;
  setAvatarColor: (color: string) => void;
  setAcceptedJob: (job: JobMeta | null) => void;
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      firstName: '',
      lastName: '',
      avatarColor: '#0078d4',
      acceptedJob: null,

      setProfile: (firstName, lastName) => set({ firstName, lastName }),
      setAvatarColor: (avatarColor) => set({ avatarColor }),
      setAcceptedJob: (acceptedJob) => set({ acceptedJob }),
    }),
    { name: 'aos-profile-store' }
  )
);
