import type { CircuitTemplate } from './types'

export const circuitTemplates: CircuitTemplate[] = [
  {
    type: 'battery',
    label: 'Battery',
    description: 'Provides the supply voltage for the circuit.',
    defaults: { voltage: 9 },
    ports: [
      { id: 'positive', label: '+' },
      { id: 'negative', label: '-' },
    ],
  },
  {
    type: 'resistor',
    label: 'Resistor',
    description: 'Limits current using a fixed resistance.',
    defaults: { resistance: 220 },
    ports: [
      { id: 'left', label: 'A' },
      { id: 'right', label: 'B' },
    ],
  },
  {
    type: 'led',
    label: 'LED',
    description: 'Lights up when enough forward voltage is present.',
    defaults: { forwardVoltage: 2 },
    ports: [
      { id: 'anode', label: '+' },
      { id: 'cathode', label: '-' },
    ],
  },
]

export const templateMap = Object.fromEntries(circuitTemplates.map((template) => [template.type, template]))
