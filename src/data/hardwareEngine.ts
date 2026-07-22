import type {
  BlueprintSlots,
  BlueprintAnalysis,
  AnalysisIssue,
  BottleneckKind,
  WorkloadScore,
  BomLine,
  ComponentModel,
} from '../types/hardware';
import { CATALOG_BY_ID } from './hardwareCatalog';

/**
 * Pure compatibility + performance engine for hardware blueprints.
 * Implements the formulas in docs/hardware-datacenter-system.md §3.3–3.5.
 * No side effects, no randomness — safe to call on every slot change.
 */

interface WorkloadDef {
  id: string;
  label: string;
  cpu: number;
  gpu: number;
  mem: number;
  sto: number;
  ai?: boolean; // use tensor-based aiScore instead of gaming gpuScore
  ramNeedGB: number;
  fpsPerPoint?: number;
}

export const WORKLOADS: WorkloadDef[] = [
  { id: 'gaming-1080p', label: 'Gaming 1080p', cpu: 1.0, gpu: 1.0, mem: 0.55, sto: 0.3, ramNeedGB: 16, fpsPerPoint: 0.9 },
  { id: 'gaming-1440p', label: 'Gaming 1440p', cpu: 0.9, gpu: 1.25, mem: 0.6, sto: 0.35, ramNeedGB: 16, fpsPerPoint: 0.7 },
  { id: 'gaming-4k', label: 'Gaming 4K', cpu: 0.7, gpu: 1.6, mem: 0.6, sto: 0.4, ramNeedGB: 16, fpsPerPoint: 0.45 },
  { id: 'streaming', label: 'Streaming', cpu: 1.2, gpu: 1.1, mem: 0.7, sto: 0.5, ramNeedGB: 32, fpsPerPoint: 0.6 },
  { id: 'editing', label: 'Video Editing', cpu: 1.15, gpu: 0.9, mem: 1.0, sto: 0.9, ramNeedGB: 48 },
  { id: 'rendering', label: '3D Rendering', cpu: 1.3, gpu: 1.2, mem: 0.9, sto: 0.6, ramNeedGB: 48 },
  { id: 'dev', label: 'Software Dev', cpu: 1.1, gpu: 0.4, mem: 0.9, sto: 0.8, ramNeedGB: 32 },
  { id: 'ai-inference', label: 'AI Inference', cpu: 0.5, gpu: 1.3, mem: 0.8, sto: 0.6, ai: true, ramNeedGB: 32 },
  { id: 'ai-training', label: 'AI Training', cpu: 0.5, gpu: 1.6, mem: 1.0, sto: 0.9, ai: true, ramNeedGB: 64 },
];

function harmonicMean(xs: number[]): number {
  const valid = xs.filter((x) => x > 0);
  if (valid.length === 0) return 0;
  return valid.length / valid.reduce((s, x) => s + 1 / x, 0);
}

/** Resolve slots to concrete models, tolerating missing pieces. */
function resolve(slots: BlueprintSlots) {
  const cpu = slots.cpu ? CATALOG_BY_ID[slots.cpu] : undefined;
  const gpus = (slots.gpu ?? []).map((id) => CATALOG_BY_ID[id]).filter(Boolean) as ComponentModel[];
  const mobo = slots.motherboard ? CATALOG_BY_ID[slots.motherboard] : undefined;
  const ram = slots.ram ? CATALOG_BY_ID[slots.ram] : undefined;
  const ramSticks = Math.max(1, slots.ramSticks ?? 1);
  const storage = slots.storage ? CATALOG_BY_ID[slots.storage] : undefined;
  const storageCount = Math.max(1, slots.storageCount ?? 1);
  const psu = slots.psu ? CATALOG_BY_ID[slots.psu] : undefined;
  const cooling = slots.cooling ? CATALOG_BY_ID[slots.cooling] : undefined;
  const kase = slots.case ? CATALOG_BY_ID[slots.case] : undefined;
  const caseFans = Math.max(0, slots.caseFans ?? 0);
  return { cpu, gpus, mobo, ram, ramSticks, storage, storageCount, psu, cooling, kase, caseFans };
}

const FORM_ORDER = { ITX: 0, mATX: 1, ATX: 2, EATX: 3 } as const;

export function analyzeBlueprint(slots: BlueprintSlots): BlueprintAnalysis {
  const r = resolve(slots);
  const errors: AnalysisIssue[] = [];
  const warnings: AnalysisIssue[] = [];

  // ---- missing required slots ----
  if (!r.cpu) errors.push({ code: 'MISSING_CPU', slot: 'cpu', message: 'No CPU selected.' });
  if (!r.mobo) errors.push({ code: 'MISSING_MOBO', slot: 'motherboard', message: 'No motherboard selected.' });
  if (!r.ram) errors.push({ code: 'MISSING_RAM', slot: 'ram', message: 'No memory selected.' });
  if (!r.storage) errors.push({ code: 'MISSING_STORAGE', slot: 'storage', message: 'No storage selected.' });
  if (!r.psu) errors.push({ code: 'MISSING_PSU', slot: 'psu', message: 'No power supply selected.' });
  if (!r.cooling) errors.push({ code: 'MISSING_COOLING', slot: 'cooling', message: 'No CPU cooler selected.' });
  if (!r.kase) errors.push({ code: 'MISSING_CASE', slot: 'case', message: 'No case selected.' });

  // ---- compatibility ----
  if (r.cpu && r.mobo && r.cpu.stats.socket !== r.mobo.stats.socket) {
    errors.push({ code: 'SOCKET_MISMATCH', slot: 'cpu', message: `CPU socket ${r.cpu.stats.socket} does not fit ${r.mobo.stats.socket} board.` });
  }
  if (r.ram && r.mobo && r.ram.stats.ramType !== r.mobo.stats.ramType) {
    errors.push({ code: 'RAM_TYPE', slot: 'ram', message: `${r.ram.stats.ramType} memory is incompatible with a ${r.mobo.stats.ramType} board.` });
  }
  if (r.ram && r.mobo && r.ramSticks > (r.mobo.stats.ramSlots ?? 2)) {
    errors.push({ code: 'RAM_SLOTS', slot: 'ram', message: `${r.ramSticks} sticks exceed the board's ${r.mobo.stats.ramSlots} slots.` });
  }
  if (r.gpus.length > 0 && r.kase) {
    const longest = Math.max(...r.gpus.map((g) => g.stats.lengthMm ?? 0));
    if (longest > (r.kase.stats.gpuMaxMm ?? 999)) {
      errors.push({ code: 'GPU_CLEARANCE', slot: 'gpu', message: `GPU (${longest}mm) exceeds case clearance ${r.kase.stats.gpuMaxMm}mm.` });
    }
  }
  if (r.mobo && r.kase) {
    const need = FORM_ORDER[r.mobo.stats.formFactor ?? 'ATX'];
    const cap = FORM_ORDER[r.kase.stats.formFactorMax ?? 'ATX'];
    if (need > cap) errors.push({ code: 'FORM_FACTOR', slot: 'case', message: `${r.mobo.stats.formFactor} board does not fit a ${r.kase.stats.formFactorMax} case.` });
  }
  if (r.cooling?.stats.coolingKind === 'aio360' && r.kase && (r.kase.stats.fanMounts ?? 0) < 3) {
    warnings.push({ code: 'RADIATOR_FIT', slot: 'cooling', message: '360mm radiator may not fit this case.' });
  }
  if (r.ram && r.mobo && (r.ram.stats.speedGhz ?? 0) > (r.mobo.stats.maxRamGhz ?? 99)) {
    warnings.push({ code: 'RAM_DOWNCLOCK', slot: 'ram', message: `Memory will downclock to the board's ${r.mobo.stats.maxRamGhz} GHz limit.` });
  }
  if (r.ram?.stats.ecc && r.mobo && (r.mobo.stats.chipsetTier ?? 3) < 3 && r.mobo.stats.socket !== 'SP-5' && r.mobo.stats.socket !== 'LGA-X') {
    warnings.push({ code: 'ECC_UNSUPPORTED', slot: 'ram', message: 'ECC memory will run without ECC on this consumer board.' });
  }

  // ---- power & thermal ----
  const cpuHeat = (r.cpu?.stats.tdpW ?? 0) * 0.95;
  const gpuHeat = r.gpus.reduce((s, g) => s + (g.stats.tdpW ?? 0), 0);
  const restHeat = ((r.mobo ? 25 : 0) + (r.storage ? 6 * r.storageCount : 0) + (r.ram ? 4 * r.ramSticks : 0)) * 1;
  const heatW = cpuHeat + gpuHeat + restHeat;

  const airflowBonus = ((r.kase?.stats.airflowScore ?? 0) / 100) * 60 + r.caseFans * 15;
  const coolCap = (r.cooling?.stats.coolingW ?? 0) + airflowBonus;
  const thermalMarginW = coolCap - cpuHeat - gpuHeat * 0.25; // cooler mainly handles CPU + some GPU exhaust
  const thermalFactor = thermalMarginW >= 0 ? 1 : Math.max(0.6, 1 + thermalMarginW / Math.max(1, heatW) * 0.9);

  const psuLoadW = heatW * 1.18;
  const psuWatts = r.psu?.stats.watts ?? 0;
  const psuHeadroomPct = psuWatts > 0 ? Math.round((1 - psuLoadW / psuWatts) * 100) : null;
  let psuFactor = 1;
  if (psuWatts > 0) {
    if (psuLoadW > psuWatts) {
      errors.push({ code: 'PSU_OVERLOAD', slot: 'psu', message: `Load ${Math.round(psuLoadW)}W exceeds the ${psuWatts}W supply.` });
      psuFactor = 0.5;
    } else if (psuLoadW > psuWatts * 0.8) {
      warnings.push({ code: 'PSU_HEADROOM', slot: 'psu', message: `PSU at ${Math.round((psuLoadW / psuWatts) * 100)}% load — little headroom.` });
      psuFactor = 0.93;
    }
  }

  // ---- subsystem scores ----
  const cpuScore = r.cpu
    ? (r.cpu.stats.ipc ?? 100) * (0.55 * (r.cpu.stats.boostGhz ?? 3) + 0.45 * Math.log(1 + (r.cpu.stats.cores ?? 1)) * 1.9)
    : 0;
  const gpuGaming = r.gpus.reduce((s, g) => s + (g.stats.fp32Tflops ?? 0) * 9 + (g.stats.vramGB ?? 0) * 2, 0);
  const multiGpu = r.gpus.length > 1;
  const nvlinkOk = r.gpus.every((g) => g.stats.nvlink);
  const gpuAi = r.gpus.reduce((s, g) => s + (g.stats.tensorTflops ?? 0) * 1.6 + Math.min(g.stats.vramGB ?? 0, 80) * 5, 0)
    * (multiGpu && !nvlinkOk ? 0.6 : 1);

  const totalRamGB = (r.ram?.stats.capacityGB ?? 0) * r.ramSticks;
  const effRamGhz = Math.min(r.ram?.stats.speedGhz ?? 0, r.mobo?.stats.maxRamGhz ?? 99);
  const channels = Math.min(r.ramSticks, r.mobo?.stats.ramSlots ?? 2);
  const memBandwidth = effRamGhz * channels * 210;

  const stoScore = r.storage
    ? (r.storage.stats.driveKind === 'nvme'
        ? 6 + (r.storage.stats.readMBs ?? 0) / 14
        : r.storage.stats.driveKind === 'sata'
          ? 380
          : 120)
    : 0;

  // ---- workloads ----
  const workloads: WorkloadScore[] = WORKLOADS.map((w) => {
    const gpuSub = w.ai ? gpuAi : gpuGaming;
    const memCapacityFactor = 1000 * Math.min(1, totalRamGB / w.ramNeedGB);
    const memScore = Math.min(memCapacityFactor, memBandwidth);
    const eff: Record<BottleneckKind, number> = {
      CPU: cpuScore / w.cpu,
      GPU: gpuSub / w.gpu,
      MEMORY: memScore / w.mem,
      STORAGE: stoScore / w.sto,
      THERMAL: 99999,
      POWER: 99999,
      BALANCED: 99999,
    };
    const effList = [eff.CPU, eff.GPU, eff.MEMORY, eff.STORAGE];
    const base = harmonicMean(effList) * thermalFactor * psuFactor;
    // bottleneck = lowest effective subsystem, unless thermal/power dominate
    let bottleneck: BottleneckKind = (['CPU', 'GPU', 'MEMORY', 'STORAGE'] as BottleneckKind[])
      .reduce((min, k) => (eff[k] < eff[min] ? k : min), 'CPU' as BottleneckKind);
    if (thermalFactor < 0.9) bottleneck = 'THERMAL';
    else if (psuFactor < 0.9) bottleneck = 'POWER';
    return {
      workload: w.id,
      label: w.label,
      score: Math.round(base),
      bottleneck,
      fps: w.fpsPerPoint ? Math.round(base * w.fpsPerPoint) : undefined,
    };
  });

  // ---- reliability, lifespan, resale, etc. ----
  const parts: ComponentModel[] = [r.cpu, ...r.gpus, r.mobo, r.ram, r.storage, r.psu, r.cooling, r.kase].filter(Boolean) as ComponentModel[];
  const survive = parts.reduce((p, m) => p * (1 - Math.min(0.9, 8760 / m.mtbfHours)), 1);
  const annualFailPct = Math.round((1 - survive) * 1000) / 10;

  const stress = (thermalFactor < 1 ? 400 : 150) + r.gpus.length * 60;
  const lifespanYears = Math.round(6 * Math.min(1.25, 1000 / stress) * 10) / 10;

  const totalCost = parts.reduce((s, m) => {
    if (m.category === 'gpu') return s; // gpus counted below with qty
    if (m.category === 'ram') return s + m.basePrice * r.ramSticks;
    if (m.category === 'storage') return s + m.basePrice * r.storageCount;
    return s + m.basePrice;
  }, 0)
    + r.gpus.reduce((s, g) => s + g.basePrice, 0)
    + r.caseFans * 15;
  const retailCost = Math.round(totalCost * 1.2);
  const resaleValue = Math.round(retailCost * 0.62);

  const freeRamSlots = Math.max(0, (r.mobo?.stats.ramSlots ?? 2) - r.ramSticks);
  const freePcie = Math.max(0, (r.mobo?.stats.pcieSlots ?? 1) - Math.max(1, r.gpus.length));
  const upgradeScore = Math.round(
    freeRamSlots * 8 + freePcie * 10 + (psuHeadroomPct ?? 0) * 0.5 + (FORM_ORDER[r.kase?.stats.formFactorMax ?? 'ITX'] >= 2 ? 15 : 0),
  );

  const assemblyDifficulty = Math.min(100, Math.round(
    20 +
    (r.cooling?.stats.coolingKind === 'custom-loop' ? 35 : 0) +
    Math.max(0, r.gpus.length - 1) * 12 +
    (r.kase?.stats.formFactorMax === 'ITX' ? 18 : 0),
  ));

  // ---- noise ----
  const noiseSources = [
    r.cooling?.stats.noiseDb ?? 0,
    ...Array(r.caseFans).fill(24),
    (r.psu?.stats.watts ?? 0) > 0 ? 20 : 0,
    ...r.gpus.map((g) => 28 + Math.min(13, (g.stats.tdpW ?? 0) / 55)),
  ].filter((d) => d > 0);
  const noiseDb = noiseSources.length
    ? Math.round((10 * Math.log10(noiseSources.reduce((s, d) => s + Math.pow(10, d / 10), 0)) + (thermalMarginW < 50 ? 4 : 0)) * 10) / 10
    : 0;

  const subsystem = {
    cpu: Math.round(cpuScore),
    gpu: Math.round(gpuGaming),
    ai: Math.round(gpuAi),
    mem: Math.round(Math.min(1000 * Math.min(1, totalRamGB / 32), memBandwidth)),
    sto: Math.round(stoScore),
  };

  // primary bottleneck: most common across gaming workloads
  const counts: Record<string, number> = {};
  for (const w of workloads) counts[w.bottleneck] = (counts[w.bottleneck] ?? 0) + 1;
  const primaryBottleneck = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as BottleneckKind) ?? 'BALANCED';

  return {
    errors,
    warnings,
    buildable: errors.length === 0,
    subsystem,
    workloads,
    heatW: Math.round(heatW),
    thermalMarginW: Math.round(thermalMarginW),
    thermalFactor: Math.round(thermalFactor * 100) / 100,
    psuLoadW: Math.round(psuLoadW),
    psuHeadroomPct,
    noiseDb,
    annualFailPct,
    lifespanYears,
    resaleValue,
    upgradeScore,
    assemblyDifficulty,
    totalCost: retailCost,
    primaryBottleneck,
  };
}

/** Build a retail bill of materials from a blueprint's slots. */
export function bomFromSlots(slots: BlueprintSlots): BomLine[] {
  const r = resolve(slots);
  const lines: BomLine[] = [];
  const push = (m: ComponentModel | undefined, qty: number) => {
    if (!m) return;
    lines.push({ modelId: m.id, name: m.name, category: m.category, qty, unitPrice: Math.round(m.basePrice * 1.2) });
  };
  push(r.cpu, 1);
  for (const g of r.gpus) push(g, 1);
  push(r.mobo, 1);
  push(r.ram, r.ramSticks);
  push(r.storage, r.storageCount);
  push(r.psu, 1);
  push(r.cooling, 1);
  push(r.kase, 1);
  if (r.caseFans > 0) {
    lines.push({ modelId: 'fan-120', name: 'Vellum AF120 Fan', category: 'fan', qty: r.caseFans, unitPrice: Math.round(12 * 1.2) });
  }
  return lines;
}
