import type { CircuitNode, CircuitTemplate } from './types'

const NODE_WIDTH = 160
const NODE_HEIGHT = 96

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
    type: 'ground',
    label: 'Ground',
    description: '0 V reference node',
    color: '#64748b',
    defaults: { resistance: 0.0001 },
    ports: [
      { id: 'gnd', label: 'GND', side: 'left' },
      { id: 'ref', label: '', side: 'right' },
    ],
  },
]

export const templateMap = Object.fromEntries(
  circuitTemplates.map((t) => [t.type, t]),
) as Record<CircuitTemplate['type'], CircuitTemplate>

export function getPortPosition(node: CircuitNode, portId: string): { x: number; y: number } {
  const template = templateMap[node.type]
  const port = template?.ports.find((p) => p.id === portId)
  const side = port?.side ?? 'left'

  if (side === 'right') return { x: node.position.x + NODE_WIDTH, y: node.position.y + NODE_HEIGHT / 2 }
  if (side === 'top') return { x: node.position.x + NODE_WIDTH / 2, y: node.position.y }
  if (side === 'bottom') return { x: node.position.x + NODE_WIDTH / 2, y: node.position.y + NODE_HEIGHT }
  return { x: node.position.x, y: node.position.y + NODE_HEIGHT / 2 }
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
  return ''
}
