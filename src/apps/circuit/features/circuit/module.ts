import type { CircuitModuleManifest } from './types'

export const circuitModuleManifest: CircuitModuleManifest = {
  id: 'aos-circuits',
  name: 'aOS Circuits',
  version: '0.1.0',
  description: 'Interactive circuit builder domain module for the aOS ecosystem.',
  capabilities: ['trace', 'circuit-simulation', 'circuit-canvas'],
}
