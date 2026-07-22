import type { ComponentModel, Condition, ComponentCategory } from '../types/hardware';

/**
 * Phase-1 component catalog. Data lives in code (not persisted) so saves stay small;
 * persisted blueprints/inventory reference these by `id`. Prices are base wholesale;
 * retail and used/refurbished prices derive via the multipliers below.
 *
 * This is a representative starter set (~44 models across every slot and tier). Later
 * phases expand it and add server/rack/interconnect SKUs plus per-model amazonListing
 * and supplier allocation metadata.
 */

export const CONDITION_PRICE_MULT: Record<Condition, number> = {
  new: 1,
  refurbished: 0.72,
  used: 0.6,
  salvage: 0.35,
  damaged: 0.28,
};

/** Failure-rate multiplier by condition (used by the reliability model). */
export const CONDITION_FAIL_MULT: Record<Condition, number> = {
  new: 1,
  refurbished: 1.35,
  used: 1.9,
  salvage: 2.6,
  damaged: 3.4,
};

/** Retail (Amazon) markup over base wholesale. */
export const RETAIL_MARKUP = 1.2;

export const HARDWARE_CATALOG: ComponentModel[] = [
  // ---------- CPUs ----------
  { id: 'cpu-a3-6', name: 'Aster 3 6-Core', brand: 'Aster', category: 'cpu', tier: 'budget', wholesaleTier: 'consumer', basePrice: 129, mtbfHours: 900000, warrantyMonths: 36,
    stats: { cores: 6, boostGhz: 4.2, ipc: 92, socket: 'AM-Z', tdpW: 65 } },
  { id: 'cpu-a5-8', name: 'Aster 5 8-Core', brand: 'Aster', category: 'cpu', tier: 'consumer', wholesaleTier: 'consumer', basePrice: 259, mtbfHours: 950000, warrantyMonths: 36,
    stats: { cores: 8, boostGhz: 4.9, ipc: 108, socket: 'AM-Z', tdpW: 95 } },
  { id: 'cpu-a7-16', name: 'Aster 7 16-Core', brand: 'Aster', category: 'cpu', tier: 'enthusiast', wholesaleTier: 'consumer', basePrice: 549, mtbfHours: 950000, warrantyMonths: 36,
    stats: { cores: 16, boostGhz: 5.4, ipc: 122, socket: 'AM-Z', tdpW: 145 } },
  { id: 'cpu-c9-24', name: 'Corvid 9 24-Core', brand: 'Corvid', category: 'cpu', tier: 'professional', wholesaleTier: 'pro-workstation', basePrice: 1299, mtbfHours: 1100000, warrantyMonths: 36,
    stats: { cores: 24, boostGhz: 5.6, ipc: 128, socket: 'LGA-X', tdpW: 250 } },
  { id: 'cpu-xeon-64', name: 'Corvid Xen 64-Core', brand: 'Corvid', category: 'cpu', tier: 'enterprise', wholesaleTier: 'server-platform', basePrice: 6800, mtbfHours: 1500000, warrantyMonths: 60,
    stats: { cores: 64, boostGhz: 3.9, ipc: 118, socket: 'SP-5', tdpW: 360 } },

  // ---------- GPUs ----------
  { id: 'gpu-rx60', name: 'Radix RX 60', brand: 'Radix', category: 'gpu', tier: 'budget', wholesaleTier: 'consumer', basePrice: 279, mtbfHours: 500000, warrantyMonths: 24,
    stats: { vramGB: 8, fp32Tflops: 18, tensorTflops: 0, lengthMm: 244, tdpW: 130 } },
  { id: 'gpu-rx70', name: 'Radix RX 70', brand: 'Radix', category: 'gpu', tier: 'consumer', wholesaleTier: 'consumer', basePrice: 599, mtbfHours: 520000, warrantyMonths: 24,
    stats: { vramGB: 12, fp32Tflops: 38, tensorTflops: 120, lengthMm: 290, tdpW: 220 } },
  { id: 'gpu-rx90', name: 'Radix RX 90 Flagship', brand: 'Radix', category: 'gpu', tier: 'enthusiast', wholesaleTier: 'consumer', basePrice: 1599, mtbfHours: 520000, warrantyMonths: 24,
    stats: { vramGB: 24, fp32Tflops: 83, tensorTflops: 330, lengthMm: 336, tdpW: 350 } },
  { id: 'gpu-w6000', name: 'Radix Pro W6000', brand: 'Radix', category: 'gpu', tier: 'professional', wholesaleTier: 'datacenter-gpu', basePrice: 4200, mtbfHours: 800000, warrantyMonths: 36,
    stats: { vramGB: 48, fp32Tflops: 91, tensorTflops: 380, lengthMm: 267, tdpW: 300 } },
  { id: 'gpu-ax9000', name: 'Nyx AX-9000 Accelerator', brand: 'Nyx', category: 'gpu', tier: 'enterprise', wholesaleTier: 'ai-accelerator', basePrice: 32000, mtbfHours: 900000, warrantyMonths: 36,
    stats: { vramGB: 80, fp32Tflops: 67, tensorTflops: 1980, lengthMm: 267, tdpW: 700, nvlink: true } },
  { id: 'gpu-ux8000', name: 'Nyx UX-8000 Accelerator', brand: 'Nyx', category: 'gpu', tier: 'enterprise', wholesaleTier: 'ai-accelerator', basePrice: 21000, mtbfHours: 900000, warrantyMonths: 36,
    stats: { vramGB: 48, fp32Tflops: 48, tensorTflops: 1200, lengthMm: 267, tdpW: 500, nvlink: true } },

  // ---------- Motherboards ----------
  { id: 'mb-b-atx', name: 'Aster B-Lite ATX', brand: 'Aster', category: 'motherboard', tier: 'budget', wholesaleTier: 'consumer', basePrice: 119, mtbfHours: 700000, warrantyMonths: 36,
    stats: { socket: 'AM-Z', chipsetTier: 1, ramType: 'DDR5', ramSlots: 2, maxRamGhz: 5.2, pcieSlots: 1, formFactor: 'ATX' } },
  { id: 'mb-x-atx', name: 'Aster X-Pro ATX', brand: 'Aster', category: 'motherboard', tier: 'enthusiast', wholesaleTier: 'consumer', basePrice: 329, mtbfHours: 750000, warrantyMonths: 36,
    stats: { socket: 'AM-Z', chipsetTier: 3, ramType: 'DDR5', ramSlots: 4, maxRamGhz: 6.4, pcieSlots: 3, formFactor: 'ATX' } },
  { id: 'mb-x-itx', name: 'Aster X-Pro ITX', brand: 'Aster', category: 'motherboard', tier: 'enthusiast', wholesaleTier: 'consumer', basePrice: 289, mtbfHours: 740000, warrantyMonths: 36,
    stats: { socket: 'AM-Z', chipsetTier: 2, ramType: 'DDR5', ramSlots: 2, maxRamGhz: 6.0, pcieSlots: 1, formFactor: 'ITX' } },
  { id: 'mb-ws-eatx', name: 'Corvid WS EATX', brand: 'Corvid', category: 'motherboard', tier: 'professional', wholesaleTier: 'pro-workstation', basePrice: 899, mtbfHours: 1000000, warrantyMonths: 36,
    stats: { socket: 'LGA-X', chipsetTier: 3, ramType: 'DDR5', ramSlots: 8, maxRamGhz: 6.0, pcieSlots: 4, formFactor: 'EATX' } },
  { id: 'mb-sp5', name: 'Corvid Server SP-5', brand: 'Corvid', category: 'motherboard', tier: 'enterprise', wholesaleTier: 'server-platform', basePrice: 1450, mtbfHours: 1400000, warrantyMonths: 60,
    stats: { socket: 'SP-5', chipsetTier: 3, ramType: 'DDR5', ramSlots: 8, maxRamGhz: 4.8, pcieSlots: 4, formFactor: 'EATX' } },

  // ---------- RAM ----------
  { id: 'ram-ddr5-16', name: 'Kestrel DDR5-5200 16GB', brand: 'Kestrel', category: 'ram', tier: 'budget', wholesaleTier: 'consumer', basePrice: 49, mtbfHours: 2000000, warrantyMonths: 120,
    stats: { capacityGB: 16, ramType: 'DDR5', speedGhz: 5.2, ecc: false } },
  { id: 'ram-ddr5-32', name: 'Kestrel DDR5-6000 32GB', brand: 'Kestrel', category: 'ram', tier: 'consumer', wholesaleTier: 'consumer', basePrice: 109, mtbfHours: 2000000, warrantyMonths: 120,
    stats: { capacityGB: 32, ramType: 'DDR5', speedGhz: 6.0, ecc: false } },
  { id: 'ram-ddr5-48', name: 'Kestrel DDR5-6400 48GB', brand: 'Kestrel', category: 'ram', tier: 'enthusiast', wholesaleTier: 'consumer', basePrice: 189, mtbfHours: 2000000, warrantyMonths: 120,
    stats: { capacityGB: 48, ramType: 'DDR5', speedGhz: 6.4, ecc: false } },
  { id: 'ram-ecc-64', name: 'Kestrel ECC DDR5-5600 64GB', brand: 'Kestrel', category: 'ram', tier: 'enterprise', wholesaleTier: 'server-platform', basePrice: 420, mtbfHours: 3000000, warrantyMonths: 120,
    stats: { capacityGB: 64, ramType: 'DDR5', speedGhz: 5.6, ecc: true } },
  { id: 'ram-ddr4-16', name: 'Kestrel DDR4-3600 16GB', brand: 'Kestrel', category: 'ram', tier: 'budget', wholesaleTier: 'consumer', basePrice: 38, mtbfHours: 2000000, warrantyMonths: 120,
    stats: { capacityGB: 16, ramType: 'DDR4', speedGhz: 3.6, ecc: false } },

  // ---------- Storage ----------
  { id: 'ssd-nvme-1', name: 'Kestrel NVMe 1TB', brand: 'Kestrel', category: 'storage', tier: 'consumer', wholesaleTier: 'consumer', basePrice: 79, mtbfHours: 1500000, warrantyMonths: 60,
    stats: { capacityTB: 1, driveKind: 'nvme', readMBs: 7000, enduranceTBW: 600 } },
  { id: 'ssd-nvme-2', name: 'Kestrel NVMe 2TB Pro', brand: 'Kestrel', category: 'storage', tier: 'enthusiast', wholesaleTier: 'consumer', basePrice: 149, mtbfHours: 1500000, warrantyMonths: 60,
    stats: { capacityTB: 2, driveKind: 'nvme', readMBs: 7400, enduranceTBW: 1200 } },
  { id: 'ssd-u2-8', name: 'Kestrel U.2 8TB Enterprise', brand: 'Kestrel', category: 'storage', tier: 'enterprise', wholesaleTier: 'server-platform', basePrice: 990, mtbfHours: 2500000, warrantyMonths: 60,
    stats: { capacityTB: 8, driveKind: 'nvme', readMBs: 6800, enduranceTBW: 14000 } },
  { id: 'sata-ssd-1', name: 'Kestrel SATA SSD 1TB', brand: 'Kestrel', category: 'storage', tier: 'budget', wholesaleTier: 'consumer', basePrice: 55, mtbfHours: 1400000, warrantyMonths: 36,
    stats: { capacityTB: 1, driveKind: 'sata', readMBs: 550, enduranceTBW: 400 } },
  { id: 'hdd-8', name: 'Meridian HDD 8TB', brand: 'Meridian', category: 'storage', tier: 'budget', wholesaleTier: 'consumer', basePrice: 129, mtbfHours: 1000000, warrantyMonths: 36,
    stats: { capacityTB: 8, driveKind: 'hdd', readMBs: 250, enduranceTBW: 0 } },

  // ---------- PSUs ----------
  { id: 'psu-550-b', name: 'Northgrid 550W Bronze', brand: 'Northgrid', category: 'psu', tier: 'budget', wholesaleTier: 'consumer', basePrice: 55, mtbfHours: 700000, warrantyMonths: 60,
    stats: { watts: 550, efficiency: 0.85 } },
  { id: 'psu-750-g', name: 'Northgrid 750W Gold', brand: 'Northgrid', category: 'psu', tier: 'consumer', wholesaleTier: 'consumer', basePrice: 99, mtbfHours: 800000, warrantyMonths: 84,
    stats: { watts: 750, efficiency: 0.9 } },
  { id: 'psu-1000-p', name: 'Northgrid 1000W Platinum', brand: 'Northgrid', category: 'psu', tier: 'enthusiast', wholesaleTier: 'consumer', basePrice: 189, mtbfHours: 900000, warrantyMonths: 120,
    stats: { watts: 1000, efficiency: 0.92 } },
  { id: 'psu-1600-t', name: 'Northgrid 1600W Titanium', brand: 'Northgrid', category: 'psu', tier: 'professional', wholesaleTier: 'pro-workstation', basePrice: 419, mtbfHours: 1000000, warrantyMonths: 120,
    stats: { watts: 1600, efficiency: 0.94 } },

  // ---------- Cooling ----------
  { id: 'cool-air-b', name: 'Northgrid AirTower 120', brand: 'Northgrid', category: 'cooling', tier: 'budget', wholesaleTier: 'consumer', basePrice: 29, mtbfHours: 600000, warrantyMonths: 36,
    stats: { coolingKind: 'air', coolingW: 120, noiseDb: 32 } },
  { id: 'cool-air-e', name: 'Northgrid AirTower Dual', brand: 'Northgrid', category: 'cooling', tier: 'enthusiast', wholesaleTier: 'consumer', basePrice: 79, mtbfHours: 650000, warrantyMonths: 60,
    stats: { coolingKind: 'air', coolingW: 220, noiseDb: 30 } },
  { id: 'cool-aio240', name: 'Northgrid Frost 240 AIO', brand: 'Northgrid', category: 'cooling', tier: 'consumer', wholesaleTier: 'consumer', basePrice: 109, mtbfHours: 400000, warrantyMonths: 60,
    stats: { coolingKind: 'aio240', coolingW: 250, noiseDb: 34 } },
  { id: 'cool-aio360', name: 'Northgrid Frost 360 AIO', brand: 'Northgrid', category: 'cooling', tier: 'enthusiast', wholesaleTier: 'consumer', basePrice: 159, mtbfHours: 400000, warrantyMonths: 60,
    stats: { coolingKind: 'aio360', coolingW: 360, noiseDb: 36 } },
  { id: 'cool-loop', name: 'Northgrid Custom Loop Kit', brand: 'Northgrid', category: 'cooling', tier: 'professional', wholesaleTier: 'consumer', basePrice: 549, mtbfHours: 300000, warrantyMonths: 24,
    stats: { coolingKind: 'custom-loop', coolingW: 600, noiseDb: 26 } },

  // ---------- Cases ----------
  { id: 'case-mid', name: 'Vellum Mid-Tower Airflow', brand: 'Vellum', category: 'case', tier: 'consumer', wholesaleTier: 'consumer', basePrice: 89, mtbfHours: 5000000, warrantyMonths: 24,
    stats: { formFactorMax: 'ATX', gpuMaxMm: 360, airflowScore: 82, fanMounts: 7 } },
  { id: 'case-sff', name: 'Vellum SFF Compact', brand: 'Vellum', category: 'case', tier: 'enthusiast', wholesaleTier: 'consumer', basePrice: 139, mtbfHours: 5000000, warrantyMonths: 24,
    stats: { formFactorMax: 'ITX', gpuMaxMm: 335, airflowScore: 55, fanMounts: 3 } },
  { id: 'case-lux', name: 'Vellum Atelier Glass', brand: 'Vellum', category: 'case', tier: 'professional', wholesaleTier: 'consumer', basePrice: 299, mtbfHours: 5000000, warrantyMonths: 36,
    stats: { formFactorMax: 'EATX', gpuMaxMm: 420, airflowScore: 78, fanMounts: 10 } },
  { id: 'case-budget', name: 'Vellum Essential', brand: 'Vellum', category: 'case', tier: 'budget', wholesaleTier: 'consumer', basePrice: 49, mtbfHours: 4000000, warrantyMonths: 12,
    stats: { formFactorMax: 'ATX', gpuMaxMm: 320, airflowScore: 58, fanMounts: 4 } },

  // ---------- Fans ----------
  { id: 'fan-120', name: 'Vellum AF120 Fan', brand: 'Vellum', category: 'fan', tier: 'consumer', wholesaleTier: 'consumer', basePrice: 12, mtbfHours: 400000, warrantyMonths: 24,
    stats: { fanNoiseDb: 24 } },
  { id: 'fan-120-q', name: 'Vellum Silent AF120', brand: 'Vellum', category: 'fan', tier: 'enthusiast', wholesaleTier: 'consumer', basePrice: 22, mtbfHours: 500000, warrantyMonths: 60,
    stats: { fanNoiseDb: 18 } },
];

export const CATALOG_BY_ID: Record<string, ComponentModel> = Object.fromEntries(
  HARDWARE_CATALOG.map((m) => [m.id, m]),
);

export function modelsByCategory(cat: ComponentCategory): ComponentModel[] {
  return HARDWARE_CATALOG.filter((m) => m.category === cat);
}

export function retailPrice(model: ComponentModel, condition: Condition = 'new'): number {
  return Math.round(model.basePrice * RETAIL_MARKUP * CONDITION_PRICE_MULT[condition]);
}

export const CATEGORY_LABEL: Record<ComponentCategory, string> = {
  cpu: 'CPU',
  gpu: 'GPU',
  motherboard: 'Motherboard',
  ram: 'Memory',
  storage: 'Storage',
  psu: 'Power Supply',
  cooling: 'Cooling',
  case: 'Case',
  fan: 'Case Fan',
};
