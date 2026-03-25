import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface InventoryItem {
  sku: string
  name: string
  quantity: number
  unitPrice: number
}

export interface ExportedSystem {
  id: string
  name: string
  kind: 'drone' | 'generator' | 'machine'
  createdAt: string
}

type CircuitLabStore = {
  inventory: Record<string, InventoryItem>
  exportedSystems: ExportedSystem[]
  addInventory: (item: Omit<InventoryItem, 'quantity'>, quantity: number) => void
  updateInventoryQuantity: (sku: string, quantity: number) => void
  consumeInventory: (requirements: Array<{ sku: string; quantity: number }>) => { ok: boolean; missing: string[] }
  addExportedSystem: (system: Omit<ExportedSystem, 'id' | 'createdAt'>) => void
}

export const useCircuitLabStore = create<CircuitLabStore>()(
  persist(
    (set, get) => ({
      inventory: {},
      exportedSystems: [],
      addInventory: (item, quantity) =>
        set((state) => {
          const current = state.inventory[item.sku]
          return {
            inventory: {
              ...state.inventory,
              [item.sku]: {
                ...item,
                quantity: (current?.quantity ?? 0) + quantity,
              },
            },
          }
        }),
      updateInventoryQuantity: (sku, quantity) =>
        set((state) => {
          const existing = state.inventory[sku]
          if (!existing) return state
          return {
            inventory: {
              ...state.inventory,
              [sku]: { ...existing, quantity: Math.max(0, Math.floor(quantity)) },
            },
          }
        }),
      consumeInventory: (requirements) => {
        const inventory = get().inventory
        const missing = requirements
          .filter((req) => (inventory[req.sku]?.quantity ?? 0) < req.quantity)
          .map((req) => req.sku)

        if (missing.length > 0) return { ok: false, missing }

        set((state) => {
          const next = { ...state.inventory }
          requirements.forEach((req) => {
            const current = next[req.sku]
            if (!current) return
            next[req.sku] = { ...current, quantity: Math.max(0, current.quantity - req.quantity) }
          })
          return { inventory: next }
        })

        return { ok: true, missing: [] }
      },
      addExportedSystem: (system) =>
        set((state) => ({
          exportedSystems: [
            ...state.exportedSystems,
            {
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              ...system,
            },
          ],
        })),
    }),
    { name: 'aos-circuit-lab-store-v1' },
  ),
)
