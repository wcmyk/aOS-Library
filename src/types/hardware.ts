/**
 * Core domain types for the Forge technology-manufacturing & data-center system.
 *
 * These are the Phase-1 entities described in docs/hardware-datacenter-system.md.
 * Later phases extend this file with suppliers, contracts, departments, facilities,
 * construction, operations, incidents and financing. The types here are deliberately
 * the minimal set that makes the end-to-end loop work: design → buy → ship → stock →
 * assemble → operate.
 */

export type ComponentCategory =
  | 'cpu'
  | 'gpu'
  | 'motherboard'
  | 'ram'
  | 'storage'
  | 'psu'
  | 'cooling'
  | 'case'
  | 'fan';

export type ComponentTier =
  | 'budget'
  | 'consumer'
  | 'enthusiast'
  | 'professional'
  | 'enterprise'
  | 'prototype';

export type Condition = 'new' | 'refurbished' | 'used' | 'salvage' | 'damaged';

export type WholesaleTier =
  | 'consumer'
  | 'pro-workstation'
  | 'datacenter-gpu'
  | 'ai-accelerator'
  | 'networking'
  | 'interconnect'
  | 'server-platform'
  | 'devkit'
  | 'support-package';

/** Per-category technical stats. All optional; only the fields for a category are set. */
export interface ComponentStats {
  // CPU
  cores?: number;
  boostGhz?: number;
  ipc?: number; // 0–150 index
  socket?: string;
  // GPU
  vramGB?: number;
  fp32Tflops?: number;
  tensorTflops?: number;
  lengthMm?: number;
  nvlink?: boolean;
  // Motherboard
  chipsetTier?: 1 | 2 | 3;
  ramType?: 'DDR4' | 'DDR5';
  ramSlots?: number;
  maxRamGhz?: number;
  pcieSlots?: number;
  formFactor?: 'ITX' | 'mATX' | 'ATX' | 'EATX';
  // RAM
  capacityGB?: number;
  speedGhz?: number;
  ecc?: boolean;
  // Storage
  capacityTB?: number;
  driveKind?: 'nvme' | 'sata' | 'hdd';
  readMBs?: number;
  enduranceTBW?: number;
  // PSU
  watts?: number;
  efficiency?: number; // 0.85 (Bronze) … 0.94 (Titanium)
  // Cooling
  coolingKind?: 'air' | 'aio240' | 'aio360' | 'custom-loop' | 'rack-liquid';
  coolingW?: number; // heat dissipation capacity
  noiseDb?: number;
  // Case
  formFactorMax?: 'ITX' | 'mATX' | 'ATX' | 'EATX';
  gpuMaxMm?: number;
  airflowScore?: number; // 0–100
  fanMounts?: number;
  // Fan
  fanNoiseDb?: number;
  // Shared power draw
  tdpW?: number;
}

export interface ComponentModel {
  id: string;
  name: string;
  brand: string;
  category: ComponentCategory;
  tier: ComponentTier;
  wholesaleTier: WholesaleTier;
  /** Base wholesale price in USD. Retail/used/refurb prices derive from this. */
  basePrice: number;
  /** Mean time between failures, hours. */
  mtbfHours: number;
  warrantyMonths: number;
  stats: ComponentStats;
}

/** A blueprint slot assignment: a component model id plus stick/drive/fan count. */
export interface BlueprintSlots {
  cpu?: string;
  gpu?: string[]; // 0–8
  motherboard?: string;
  ram?: string; // model id
  ramSticks?: number; // 1–8
  storage?: string;
  storageCount?: number;
  psu?: string;
  cooling?: string;
  case?: string;
  caseFans?: number;
}

export type BlueprintKind = 'pc' | 'server' | 'rack' | 'cluster' | 'dc-module';

export interface BlueprintVersion {
  version: number;
  at: string;
  note: string;
}

export interface HardwareBlueprint {
  id: string;
  name: string;
  kind: BlueprintKind;
  version: number;
  history: BlueprintVersion[];
  slots: BlueprintSlots;
  priorities: string[];
  createdAt: string;
}

/** Result of the compatibility / performance engine (pure, see hardwareEngine.ts). */
export interface AnalysisIssue {
  code: string;
  slot?: string;
  message: string;
}

export interface WorkloadScore {
  workload: string;
  label: string;
  score: number; // 0–1000+ effective
  bottleneck: BottleneckKind;
  fps?: number;
}

export type BottleneckKind = 'CPU' | 'GPU' | 'MEMORY' | 'STORAGE' | 'THERMAL' | 'POWER' | 'BALANCED';

export interface BlueprintAnalysis {
  errors: AnalysisIssue[];
  warnings: AnalysisIssue[];
  buildable: boolean;
  subsystem: { cpu: number; gpu: number; ai: number; mem: number; sto: number };
  workloads: WorkloadScore[];
  heatW: number;
  thermalMarginW: number;
  thermalFactor: number;
  psuLoadW: number;
  psuHeadroomPct: number | null;
  noiseDb: number;
  annualFailPct: number;
  lifespanYears: number;
  resaleValue: number;
  upgradeScore: number;
  assemblyDifficulty: number;
  totalCost: number;
  primaryBottleneck: BottleneckKind;
}

export interface BomLine {
  modelId: string;
  name: string;
  category: ComponentCategory;
  qty: number;
  unitPrice: number;
}

// ---- Inventory & logistics ----

export type LotState = 'spare' | 'reserved' | 'installed' | 'damaged' | 'returned' | 'in-repair';

export interface InventoryLot {
  lotId: string;
  modelId: string;
  name: string;
  condition: Condition;
  qty: number;
  state: LotState;
  warrantyUntil?: string;
  unitPrice: number;
}

export type ShipmentStatus = 'in-transit' | 'delivered' | 'damaged' | 'lost';

export interface ShipmentLine {
  modelId: string;
  name: string;
  category: ComponentCategory;
  condition: Condition;
  qty: number;
  unitPrice: number;
}

export interface Shipment {
  id: string;
  orderId: string;
  source: 'amazon' | 'wholesale' | 'salvage';
  destinationId: string; // location id
  lines: ShipmentLine[];
  placedAt: string;
  etaAt: number; // epoch ms
  status: ShipmentStatus;
  settled: boolean;
}

// ---- Projects & built assets ----

export type ProjectKind = string; // e.g. 'pc.gaming', 'infra.ai-training' (open enum)

export type ProjectPhase =
  | 'concept'
  | 'design'
  | 'planning'
  | 'procurement'
  | 'buildout'
  | 'assembly'
  | 'integration'
  | 'testing'
  | 'launch'
  | 'operating'
  | 'decommission';

export interface ComputingProject {
  id: string;
  name: string;
  kind: ProjectKind;
  purpose: string;
  phase: ProjectPhase;
  budgetUSD: number;
  blueprintId?: string;
  locationId: string;
  ownership: 'personal' | 'company' | 'subsidiary';
  commercial: boolean;
  createdAt: string;
  log: Array<{ at: string; text: string }>;
}

export type AssemblyStatus = 'not-started' | 'in-progress' | 'complete' | 'failed';

export interface BuiltAsset {
  id: string;
  name: string;
  blueprintId: string;
  projectId: string;
  locationId: string;
  kind: BlueprintKind;
  status: 'operating' | 'idle' | 'faulty';
  wearPct: number;
  createdAt: string;
}

/** A place inventory can live and builds can happen. Phase 1 seeds one Home location. */
export interface TechLocation {
  id: string;
  name: string;
  kind: 'home' | 'workshop' | 'warehouse' | 'office' | 'lab' | 'factory' | 'datacenter';
  features: string[]; // e.g. 'workbench', 'assembly-line'
}

/** Cross-app deep-link intent written by Forge, read by the target app. */
export interface CrossAppIntent {
  target: string; // appId
  reason: string;
  payload?: Record<string, unknown>;
  at: number;
}
