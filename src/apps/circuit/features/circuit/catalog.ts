import type { CircuitNode, CircuitTemplate } from './types'

export const circuitTemplates: CircuitTemplate[] = [
  {
    type: 'battery',
    label: 'Battery',
    description: 'Provides configurable DC supply voltage for the loop.',
    defaults: { voltage: 9 },
    ports: [
      { id: 'positive', label: '+' },
      { id: 'negative', label: '-' },
    ],
  },
  {
    type: 'resistor',
    label: 'Resistor',
    description: 'Adds fixed series resistance and dissipates power as heat.',
    defaults: { resistance: 220 },
    ports: [
      { id: 'left', label: 'A' },
      { id: 'right', label: 'B' },
    ],
  },
  {
    type: 'led',
    label: 'LED',
    description: 'Consumes forward voltage and lights when enough current flows.',
    defaults: { forwardVoltage: 2 },
    ports: [
      { id: 'anode', label: '+' },
      { id: 'cathode', label: '-' },
    ],
  },
  {
    type: 'switch',
    label: 'Switch',
    description: 'Opens or closes the loop with low on-resistance.',
    defaults: { resistance: 0.05, isClosed: true },
    ports: [
      { id: 'input', label: 'IN' },
      { id: 'output', label: 'OUT' },
    ],
  },
  {
    type: 'capacitor',
    label: 'Capacitor',
    description: 'Adds charge storage and equivalent series resistance estimates.',
    defaults: { resistance: 0.2, capacitance: 220, chargePercent: 35 },
    ports: [
      { id: 'positive', label: '+' },
      { id: 'negative', label: '-' },
    ],
  },
  {
    type: 'transistor',
    label: 'Transistor',
    description: 'Approximated as a controlled drop stage with gain metadata.',
    defaults: { resistance: 8, gain: 120, collectorEmitterDrop: 0.2 },
    ports: [
      { id: 'collector', label: 'C' },
      { id: 'emitter', label: 'E' },
    ],
  },
]

export const templateMap = Object.fromEntries(circuitTemplates.map((template) => [template.type, template])) as Record<CircuitTemplate['type'], CircuitTemplate>

export function getNodeValueLabel(node: CircuitNode) {
  const template = templateMap[node.type]
  if (node.type === 'battery') return `${node.voltage ?? template.defaults.voltage} V source`
  if (node.type === 'resistor') return `${node.resistance ?? template.defaults.resistance} Ω`
  if (node.type === 'led') return `${node.forwardVoltage ?? template.defaults.forwardVoltage} V_f`
  if (node.type === 'switch') return (node.isClosed ?? template.defaults.isClosed) ? 'Closed path' : 'Open path'
  if (node.type === 'capacitor') return `${node.capacitance ?? template.defaults.capacitance} µF`
  return `β ${node.gain ?? template.defaults.gain}`
}
