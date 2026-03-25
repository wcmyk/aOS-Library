import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type EdenStore = {
  unlocked: boolean
  dmgCreatedAt: string | null
  unlock: () => void
}

export const useEdenStore = create<EdenStore>()(
  persist(
    (set) => ({
      unlocked: false,
      dmgCreatedAt: null,
      unlock: () => set({ unlocked: true, dmgCreatedAt: new Date().toISOString() }),
    }),
    { name: 'aos-eden-store-v1' },
  ),
)
