import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  HardwareBlueprint,
  BlueprintSlots,
  ComputingProject,
  ProjectPhase,
  Shipment,
  InventoryLot,
  BuiltAsset,
  TechLocation,
  BomLine,
  Condition,
  CrossAppIntent,
} from '../types/hardware';
import { CATALOG_BY_ID, CONDITION_FAIL_MULT } from '../data/hardwareCatalog';
import { useWalletStore, nextOrderId, type WalletOrder } from './useWalletStore';
import { useNotifyStore } from './useNotifyStore';

/**
 * useTechStore — the Forge domain store (Phase 1).
 *
 * Owns blueprints, projects, per-location inventory, shipments and built assets.
 * It never duplicates money or HR state: purchases settle through useWalletStore
 * (so the Chase banking app renders them), and notifications go through
 * useNotifyStore. Time-dependent work (shipment arrival, assembly completion) is
 * resolved lazily on read via settleClock() — there is no game tick in aOS.
 */

const STARTER_LOCATIONS: TechLocation[] = [
  { id: 'loc-home', name: 'Home', kind: 'home', features: ['workbench'] },
];

let idSeq = 0;
function uid(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}${idSeq.toString(36)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

interface AssemblyJob {
  projectId: string;
  blueprintId: string;
  locationId: string;
  startedAt: number;
  finishAt: number;
  builderSkill: number; // 0–100 (player default ~35)
  difficulty: number;
}

interface TechState {
  locations: TechLocation[];
  blueprints: HardwareBlueprint[];
  projects: ComputingProject[];
  inventory: Record<string, InventoryLot[]>; // by locationId
  shipments: Shipment[];
  assets: BuiltAsset[];
  assemblies: AssemblyJob[];
  crossAppIntents: CrossAppIntent[];
  pendingCart: BomLine[] | null;

  // blueprint / project
  saveBlueprint: (bp: Omit<HardwareBlueprint, 'id' | 'version' | 'history' | 'createdAt'> & { id?: string }) => HardwareBlueprint;
  createProject: (p: { name: string; kind: string; purpose: string; budgetUSD: number; locationId?: string; commercial?: boolean; ownership?: ComputingProject['ownership'] }) => ComputingProject;
  setProjectBlueprint: (projectId: string, blueprintId: string) => void;
  advancePhase: (projectId: string, to: ProjectPhase) => void;
  cancelProject: (projectId: string) => void;

  // procurement / logistics
  orderBom: (args: { projectId?: string; locationId: string; lines: BomLine[]; conditions?: Record<string, Condition>; accountId?: string; last4?: string; cardName?: string; accountKind?: WalletOrder['accountKind'] }) => Shipment;
  settleClock: () => void;

  // assembly
  startAssembly: (projectId: string, builderSkill?: number) => { ok: boolean; missing?: string[] };
  // cross-app
  pushIntent: (intent: Omit<CrossAppIntent, 'at'>) => void;
  setPendingCart: (lines: BomLine[] | null) => void;

  resetTech: () => void;
}

function lotsFor(state: TechState, locationId: string): InventoryLot[] {
  return state.inventory[locationId] ?? [];
}

export const useTechStore = create<TechState>()(
  persist(
    (set, get) => ({
      locations: STARTER_LOCATIONS,
      blueprints: [],
      projects: [],
      inventory: {},
      shipments: [],
      assets: [],
      assemblies: [],
      crossAppIntents: [],
      pendingCart: null,

      saveBlueprint: (bp) => {
        const existing = bp.id ? get().blueprints.find((b) => b.id === bp.id) : undefined;
        const record: HardwareBlueprint = existing
          ? {
              ...existing,
              name: bp.name,
              kind: bp.kind,
              slots: bp.slots,
              priorities: bp.priorities,
              version: existing.version + 1,
              history: [...existing.history, { version: existing.version + 1, at: nowIso(), note: 'Updated design' }],
            }
          : {
              id: bp.id ?? uid('bp'),
              name: bp.name,
              kind: bp.kind,
              slots: bp.slots,
              priorities: bp.priorities,
              version: 1,
              history: [{ version: 1, at: nowIso(), note: 'Created' }],
              createdAt: nowIso(),
            };
        set((s) => ({
          blueprints: existing
            ? s.blueprints.map((b) => (b.id === record.id ? record : b))
            : [record, ...s.blueprints],
        }));
        return record;
      },

      createProject: (p) => {
        const project: ComputingProject = {
          id: uid('proj'),
          name: p.name,
          kind: p.kind,
          purpose: p.purpose,
          phase: 'design',
          budgetUSD: p.budgetUSD,
          locationId: p.locationId ?? 'loc-home',
          ownership: p.ownership ?? 'personal',
          commercial: p.commercial ?? false,
          createdAt: nowIso(),
          log: [{ at: nowIso(), text: 'Project created.' }],
        };
        set((s) => ({ projects: [project, ...s.projects] }));
        return project;
      },

      setProjectBlueprint: (projectId, blueprintId) =>
        set((s) => ({
          projects: s.projects.map((pr) =>
            pr.id === projectId
              ? { ...pr, blueprintId, log: [...pr.log, { at: nowIso(), text: 'Blueprint attached.' }] }
              : pr,
          ),
        })),

      advancePhase: (projectId, to) =>
        set((s) => ({
          projects: s.projects.map((pr) =>
            pr.id === projectId
              ? { ...pr, phase: to, log: [...pr.log, { at: nowIso(), text: `Phase → ${to}.` }] }
              : pr,
          ),
        })),

      cancelProject: (projectId) =>
        set((s) => ({ projects: s.projects.filter((pr) => pr.id !== projectId) })),

      orderBom: ({ projectId, locationId, lines, conditions, accountId, last4, cardName, accountKind }) => {
        const orderId = nextOrderId();
        const cond = (modelId: string): Condition => conditions?.[modelId] ?? 'new';
        // price each line by condition
        const shipLines = lines.map((l) => {
          const model = CATALOG_BY_ID[l.modelId];
          const c = cond(l.modelId);
          const unit = model ? Math.round(model.basePrice * 1.2 * ({ new: 1, refurbished: 0.72, used: 0.6, salvage: 0.35, damaged: 0.28 }[c])) : l.unitPrice;
          return { modelId: l.modelId, name: l.name, category: l.category, condition: c, qty: l.qty, unitPrice: unit };
        });
        const total = shipLines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
        const itemCount = shipLines.reduce((s, l) => s + l.qty, 0);

        // settle money through the wallet ledger so Chase shows it
        const kind = accountKind ?? 'credit';
        const order: WalletOrder = {
          id: orderId,
          date: nowIso(),
          desc: `AMAZON.COM*FORGE-${orderId}`,
          total: Math.round(total * 100) / 100,
          itemCount,
          items: shipLines.map((l) => ({ id: l.modelId, title: l.name, price: l.unitPrice, qty: l.qty })),
          accountId: accountId ?? 'cc-freedom',
          accountKind: kind,
          last4: last4 ?? '4021',
          cardName: cardName ?? 'Freedom Unlimited',
        };
        useWalletStore.getState().addOrder(order);

        const etaDays = 2;
        const shipment: Shipment = {
          id: uid('ship'),
          orderId,
          source: 'amazon',
          destinationId: locationId,
          lines: shipLines,
          placedAt: nowIso(),
          etaAt: Date.now() + etaDays * 86400000,
          status: 'in-transit',
          settled: false,
        };
        set((s) => ({ shipments: [shipment, ...s.shipments] }));
        useNotifyStore.getState().push({
          appId: 'forge',
          appName: 'Forge',
          title: 'Order placed',
          body: `${itemCount} item(s) · $${total.toLocaleString()} · arriving in ${etaDays} days`,
        });
        if (projectId) {
          set((s) => ({
            projects: s.projects.map((pr) =>
              pr.id === projectId
                ? { ...pr, phase: pr.phase === 'design' || pr.phase === 'planning' ? 'procurement' : pr.phase, log: [...pr.log, { at: nowIso(), text: `Ordered ${itemCount} components ($${total.toLocaleString()}).` }] }
                : pr,
            ),
          }));
        }
        return shipment;
      },

      settleClock: () => {
        const now = Date.now();
        const state = get();
        let changed = false;
        const nextInventory: Record<string, InventoryLot[]> = { ...state.inventory };
        const notes: Array<{ title: string; body: string }> = [];

        // 1) deliver due shipments into inventory
        const nextShipments = state.shipments.map((sh) => {
          if (sh.settled || sh.status !== 'in-transit' || sh.etaAt > now) return sh;
          changed = true;
          const lots = [...(nextInventory[sh.destinationId] ?? [])];
          let damaged = 0;
          for (const line of sh.lines) {
            // small DOA/damage roll: worse for used/refurb (deterministic-ish by line)
            const failMult = CONDITION_FAIL_MULT[line.condition] ?? 1;
            const damageChance = 0.02 * failMult;
            const damagedQty = line.qty > 0 && hashUnit(sh.id + line.modelId) < damageChance ? 1 : 0;
            damaged += damagedQty;
            if (line.qty - damagedQty > 0) {
              lots.push({
                lotId: uid('lot'),
                modelId: line.modelId,
                name: line.name,
                condition: line.condition,
                qty: line.qty - damagedQty,
                state: 'spare',
                unitPrice: line.unitPrice,
              });
            }
            if (damagedQty > 0) {
              lots.push({
                lotId: uid('lot'),
                modelId: line.modelId,
                name: line.name,
                condition: 'damaged',
                qty: damagedQty,
                state: 'damaged',
                unitPrice: line.unitPrice,
              });
            }
          }
          nextInventory[sh.destinationId] = lots;
          notes.push({
            title: 'Delivered',
            body: `${sh.lines.reduce((s, l) => s + l.qty, 0)} item(s) arrived${damaged ? ` · ${damaged} damaged in transit` : ''}.`,
          });
          return { ...sh, status: 'delivered' as const, settled: true };
        });

        // 2) complete finished assemblies into built assets
        const stillBuilding: AssemblyJob[] = [];
        const newAssets: BuiltAsset[] = [];
        for (const job of state.assemblies) {
          if (job.finishAt > now) {
            stillBuilding.push(job);
            continue;
          }
          changed = true;
          const bp = state.blueprints.find((b) => b.id === job.blueprintId);
          // consume reserved lots for this build
          const lots = [...(nextInventory[job.locationId] ?? [])];
          const needed = bomModelCounts(bp?.slots);
          for (const [modelId, qty] of Object.entries(needed)) {
            let remaining = qty;
            for (const lot of lots) {
              if (remaining <= 0) break;
              if (lot.modelId === modelId && (lot.state === 'spare' || lot.state === 'reserved') && lot.condition !== 'damaged') {
                const take = Math.min(lot.qty, remaining);
                lot.qty -= take;
                remaining -= take;
              }
            }
          }
          nextInventory[job.locationId] = lots.filter((l) => l.qty > 0);
          const asset: BuiltAsset = {
            id: uid('asset'),
            name: bp?.name ?? 'Custom Build',
            blueprintId: job.blueprintId,
            projectId: job.projectId,
            locationId: job.locationId,
            kind: bp?.kind ?? 'pc',
            status: 'operating',
            wearPct: 0,
            createdAt: nowIso(),
          };
          newAssets.push(asset);
          notes.push({ title: 'Build complete', body: `${asset.name} powered on and passed testing.` });
        }

        const nextProjects = newAssets.length
          ? state.projects.map((pr) =>
              newAssets.some((a) => a.projectId === pr.id)
                ? { ...pr, phase: 'operating' as ProjectPhase, log: [...pr.log, { at: nowIso(), text: 'Assembly complete — now operating.' }] }
                : pr,
            )
          : state.projects;

        if (changed) {
          set({
            shipments: nextShipments,
            inventory: nextInventory,
            assemblies: stillBuilding,
            assets: [...newAssets, ...state.assets],
            projects: nextProjects,
          });
          const notify = useNotifyStore.getState().push;
          for (const n of notes.slice(0, 3)) notify({ appId: 'forge', appName: 'Forge', title: n.title, body: n.body });
        }
      },

      startAssembly: (projectId, builderSkill = 35) => {
        const state = get();
        const project = state.projects.find((p) => p.id === projectId);
        if (!project?.blueprintId) return { ok: false, missing: ['blueprint'] };
        const bp = state.blueprints.find((b) => b.id === project.blueprintId);
        if (!bp) return { ok: false, missing: ['blueprint'] };
        const needed = bomModelCounts(bp.slots);
        const lots = lotsFor(state, project.locationId);
        const missing: string[] = [];
        for (const [modelId, qty] of Object.entries(needed)) {
          const have = lots
            .filter((l) => l.modelId === modelId && l.condition !== 'damaged' && (l.state === 'spare' || l.state === 'reserved'))
            .reduce((s, l) => s + l.qty, 0);
          if (have < qty) missing.push(CATALOG_BY_ID[modelId]?.name ?? modelId);
        }
        if (missing.length) return { ok: false, missing };

        // reserve lots
        const reserved = lots.map((l) => ({ ...l }));
        for (const [modelId, qty] of Object.entries(needed)) {
          let remaining = qty;
          for (const lot of reserved) {
            if (remaining <= 0) break;
            if (lot.modelId === modelId && lot.state === 'spare' && lot.condition !== 'damaged') {
              lot.state = 'reserved';
              remaining -= lot.qty;
            }
          }
        }

        // assembly time from difficulty + builder skill
        const difficulty = 30 + Object.keys(needed).length * 4;
        const baseMin = 240 + difficulty * 3;
        const minutes = baseMin * (1.9 - builderSkill / 100);
        const finishAt = Date.now() + minutes * 60000;

        set((s) => ({
          inventory: { ...s.inventory, [project.locationId]: reserved },
          assemblies: [
            ...s.assemblies,
            { projectId, blueprintId: bp.id, locationId: project.locationId, startedAt: Date.now(), finishAt, builderSkill, difficulty },
          ],
          projects: s.projects.map((pr) =>
            pr.id === projectId
              ? { ...pr, phase: 'assembly', log: [...pr.log, { at: nowIso(), text: `Assembly started (~${Math.round(minutes / 60)}h).` }] }
              : pr,
          ),
        }));
        useNotifyStore.getState().push({ appId: 'forge', appName: 'Forge', title: 'Assembly started', body: `${bp.name} — components reserved.` });
        return { ok: true };
      },

      pushIntent: (intent) => set((s) => ({ crossAppIntents: [{ ...intent, at: Date.now() }, ...s.crossAppIntents].slice(0, 20) })),
      setPendingCart: (lines) => set({ pendingCart: lines }),

      resetTech: () =>
        set({
          locations: STARTER_LOCATIONS,
          blueprints: [],
          projects: [],
          inventory: {},
          shipments: [],
          assets: [],
          assemblies: [],
          crossAppIntents: [],
          pendingCart: null,
        }),
    }),
    {
      name: 'aos-tech-store-v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        locations: s.locations,
        blueprints: s.blueprints,
        projects: s.projects,
        inventory: s.inventory,
        shipments: s.shipments,
        assets: s.assets,
        assemblies: s.assemblies,
      }),
    },
  ),
);

/** Model → required quantity for a blueprint (used for reserve/consume). */
function bomModelCounts(slots?: BlueprintSlots): Record<string, number> {
  const counts: Record<string, number> = {};
  if (!slots) return counts;
  const add = (id: string | undefined, qty: number) => {
    if (!id) return;
    counts[id] = (counts[id] ?? 0) + qty;
  };
  add(slots.cpu, 1);
  for (const g of slots.gpu ?? []) add(g, 1);
  add(slots.motherboard, 1);
  add(slots.ram, Math.max(1, slots.ramSticks ?? 1));
  add(slots.storage, Math.max(1, slots.storageCount ?? 1));
  add(slots.psu, 1);
  add(slots.cooling, 1);
  add(slots.case, 1);
  if ((slots.caseFans ?? 0) > 0) add('fan-120', slots.caseFans!);
  return counts;
}

/** Deterministic 0..1 hash for damage rolls (no Math.random, SSR/replay safe). */
function hashUnit(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}
