import type { CircuitNode, CircuitTemplate } from './types'

// ─── Per-component dimensions ────────────────────────────────────────────────
export const COMPONENT_DIMS: Record<string, { width: number; height: number }> = {
  battery:      { width: 110, height: 80 },
  resistor:     { width: 160, height: 54 },
  led:          { width: 90,  height: 80 },
  diode:        { width: 148, height: 52 },
  switch:       { width: 110, height: 64 },
  capacitor:    { width: 136, height: 56 },
  inductor:     { width: 160, height: 60 },
  transistor:   { width: 90,  height: 100 },
  potentiometer:{ width: 100, height: 90 },
  ground:       { width: 64,  height: 80 },
  gear:         { width: 92,  height: 92 },
  motor:        { width: 130, height: 70 },
  propeller:    { width: 120, height: 80 },
  antenna:      { width: 90,  height: 90 },
  bluetooth:    { width: 86,  height: 86 },
}

export const DEFAULT_DIMS = { width: 160, height: 60 }

export const circuitTemplates: CircuitTemplate[] = [
  {
    type: 'battery',
    label: 'Battery',
    description: 'DC voltage source',
    color: '#38bdf8',
    defaults: { voltage: 9 },
    ports: [
      { id: 'positive', label: '+', side: 'left' },
      { id: 'negative', label: '-', side: 'right' },
    ],
  },
  {
    type: 'resistor',
    label: 'Resistor',
    description: 'Fixed series resistance',
    color: '#a855f7',
    defaults: { resistance: 220 },
    ports: [
      { id: 'left', label: 'A', side: 'left' },
      { id: 'right', label: 'B', side: 'right' },
    ],
  },
  {
    type: 'led',
    label: 'LED',
    description: 'Light emitting diode',
    color: '#22c55e',
    defaults: { forwardVoltage: 2 },
    ports: [
      { id: 'anode', label: '+', side: 'left' },
      { id: 'cathode', label: '-', side: 'right' },
    ],
  },
  {
    type: 'diode',
    label: 'Diode',
    description: 'Rectifier, 0.7 V drop',
    color: '#f97316',
    defaults: { forwardVoltage: 0.7 },
    ports: [
      { id: 'anode', label: 'A', side: 'left' },
      { id: 'cathode', label: 'K', side: 'right' },
    ],
  },
  {
    type: 'switch',
    label: 'Switch',
    description: 'Open / closed loop control',
    color: '#94a3b8',
    defaults: { resistance: 0.05, isClosed: true },
    ports: [
      { id: 'input', label: 'IN', side: 'left' },
      { id: 'output', label: 'OUT', side: 'right' },
    ],
  },
  {
    type: 'capacitor',
    label: 'Capacitor',
    description: 'Charge storage + ESR',
    color: '#06b6d4',
    defaults: { resistance: 0.2, capacitance: 220, chargePercent: 35 },
    ports: [
      { id: 'positive', label: '+', side: 'left' },
      { id: 'negative', label: '-', side: 'right' },
    ],
  },
  {
    type: 'inductor',
    label: 'Inductor',
    description: 'Magnetic energy storage',
    color: '#0ea5e9',
    defaults: { resistance: 0.5, inductance: 10 },
    ports: [
      { id: 'left', label: 'A', side: 'left' },
      { id: 'right', label: 'B', side: 'right' },
    ],
  },
  {
    type: 'transistor',
    label: 'Transistor',
    description: 'BJT amplifier / switch',
    color: '#d946ef',
    defaults: { resistance: 8, gain: 120, collectorEmitterDrop: 0.2 },
    ports: [
      { id: 'collector', label: 'C', side: 'left' },
      { id: 'emitter', label: 'E', side: 'right' },
      { id: 'base', label: 'B', side: 'bottom' },
    ],
  },
  {
    type: 'potentiometer',
    label: 'Potentiometer',
    description: 'Variable resistance divider',
    color: '#84cc16',
    defaults: { resistance: 10000, potentiometerWiper: 50 },
    ports: [
      { id: 'a', label: 'A', side: 'left' },
      { id: 'b', label: 'B', side: 'right' },
      { id: 'wiper', label: 'W', side: 'bottom' },
    ],
  },

  {
    type: 'gear',
    label: 'Gear',
    description: 'Mechanical transfer gear',
    color: '#f59e0b',
    defaults: { resistance: 4 },
    ports: [
      { id: 'left', label: 'IN', side: 'left' },
      { id: 'right', label: 'OUT', side: 'right' },
    ],
  },
  {
    type: 'motor',
    label: 'Motor',
    description: 'Rotary motor drive',
    color: '#fb7185',
    defaults: { resistance: 12 },
    ports: [
      { id: 'left', label: '+', side: 'left' },
      { id: 'right', label: '-', side: 'right' },
    ],
  },
  {
    type: 'propeller',
    label: 'Propeller',
    description: 'Thrust module',
    color: '#22d3ee',
    defaults: { resistance: 9 },
    ports: [
      { id: 'left', label: 'IN', side: 'left' },
      { id: 'right', label: 'OUT', side: 'right' },
    ],
  },
  {
    type: 'antenna',
    label: 'Antenna',
    description: 'Wireless signal mast',
    color: '#c084fc',
    defaults: { resistance: 18 },
    ports: [
      { id: 'left', label: 'SIG', side: 'left' },
      { id: 'right', label: 'GND', side: 'right' },
    ],
  },
  {
    type: 'bluetooth',
    label: 'Bluetooth',
    description: 'BT sync module',
    color: '#60a5fa',
    defaults: { resistance: 22 },
    ports: [
      { id: 'left', label: 'TX', side: 'left' },
      { id: 'right', label: 'RX', side: 'right' },
    ],
  },
  {
    type: 'ground',
    label: 'Ground',
    description: '0 V reference node',
    color: '#64748b',
    defaults: { resistance: 0.0001 },
    ports: [
      { id: 'gnd', label: 'GND', side: 'top' },
      { id: 'ref', label: '', side: 'bottom' },
    ],
  },
]

export const templateMap = Object.fromEntries(
  circuitTemplates.map((t) => [t.type, t]),
) as Record<CircuitTemplate['type'], CircuitTemplate>

export function getPortPosition(node: CircuitNode, portId: string): { x: number; y: number } {
  const dims = COMPONENT_DIMS[node.type] ?? DEFAULT_DIMS
  const { width, height } = dims
  const template = templateMap[node.type]
  const port = template?.ports.find((p) => p.id === portId)
  const side = port?.side ?? 'left'

  if (side === 'right')  return { x: node.position.x + width,      y: node.position.y + height / 2 }
  if (side === 'top')    return { x: node.position.x + width / 2,   y: node.position.y }
  if (side === 'bottom') return { x: node.position.x + width / 2,   y: node.position.y + height }
  return { x: node.position.x, y: node.position.y + height / 2 }
}

export function getNodeValueLabel(node: CircuitNode): string {
  const template = templateMap[node.type]
  if (node.type === 'battery') return `${node.voltage ?? template.defaults.voltage} V`
  if (node.type === 'resistor') return `${node.resistance ?? template.defaults.resistance} Ω`
  if (node.type === 'led') return `Vf ${node.forwardVoltage ?? template.defaults.forwardVoltage} V`
  if (node.type === 'diode') return `Vf ${node.forwardVoltage ?? template.defaults.forwardVoltage} V`
  if (node.type === 'switch') return (node.isClosed ?? template.defaults.isClosed) ? 'Closed' : 'Open'
  if (node.type === 'capacitor') return `${node.capacitance ?? template.defaults.capacitance} µF`
  if (node.type === 'inductor') return `${node.inductance ?? template.defaults.inductance} mH`
  if (node.type === 'potentiometer') return `${node.resistance ?? template.defaults.resistance} Ω · ${node.potentiometerWiper ?? 50}%`
  if (node.type === 'transistor') return `β ${node.gain ?? template.defaults.gain}`
  if (node.type === 'ground') return 'GND'
  if (node.type === 'gear') return 'Drive Coupler'
  if (node.type === 'motor') return 'Rotary Motor'
  if (node.type === 'propeller') return 'Rotor'
  if (node.type === 'antenna') return 'RF mast'
  if (node.type === 'bluetooth') return 'BLE sync'
  return ''
}
