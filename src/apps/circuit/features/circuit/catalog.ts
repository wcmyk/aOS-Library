import type { CircuitTemplate } from './types'

export const circuitTemplates: CircuitTemplate[] = [
  {
    type: 'battery',
    label: 'Battery',
    description: 'DC voltage source. Drives current through the circuit.',
    defaults: { voltage: 9 },
    ports: [
      { id: 'positive', label: '+' },
      { id: 'negative', label: '\u2212' },
    ],
  },
  {
    type: 'resistor',
    label: 'Resistor',
    description: 'Limits current flow by a fixed resistance value.',
    defaults: { resistance: 220 },
    ports: [
      { id: 'left', label: 'A' },
      { id: 'right', label: 'B' },
    ],
  },
  {
    type: 'led',
    label: 'LED',
    description: 'Emits light when forward-biased with sufficient voltage.',
    defaults: { forwardVoltage: 2 },
    ports: [
      { id: 'anode', label: '+' },
      { id: 'cathode', label: '\u2212' },
    ],
  },
  {
    type: 'switch',
    label: 'Switch',
    description: 'Opens or closes the circuit path. Click to toggle.',
    defaults: { closed: true },
    ports: [
      { id: 'left', label: 'A' },
      { id: 'right', label: 'B' },
    ],
  },
  {
    type: 'capacitor',
    label: 'Capacitor',
    description: 'Stores electric charge. Blocks DC current in steady state.',
    defaults: { capacitance: 100 },
    ports: [
      { id: 'left', label: '+' },
      { id: 'right', label: '\u2212' },
    ],
  },
]

export const templateMap = Object.fromEntries(circuitTemplates.map((t) => [t.type, t]))
