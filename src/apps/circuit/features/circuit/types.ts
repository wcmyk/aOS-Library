import type { AosModuleManifest, TraceEnvelope } from '../../contracts'

export type CircuitComponentType = 'battery' | 'resistor' | 'led' | 'switch' | 'capacitor'

export interface PortDefinition {
  id: string
  label: string
}

export interface CircuitTemplate {
  type: CircuitComponentType
  label: string
  description: string
  defaults: {
    voltage?: number
    resistance?: number
    forwardVoltage?: number
    closed?: boolean
    capacitance?: number
  }
  ports: [PortDefinition, PortDefinition]
}

export interface CircuitNode {
  id: string
  type: CircuitComponentType
  label: string
  position: { x: number; y: number }
  voltage?: number
  resistance?: number
  forwardVoltage?: number
  closed?: boolean
  capacitance?: number
}

export interface CircuitWireEndpoint {
  nodeId: string
  portId: string
}

export interface CircuitWire {
  id: string
  from: CircuitWireEndpoint
  to: CircuitWireEndpoint
}

export interface CircuitAnalysisContext {
  nodeCount: number
  wireCount: number
  requestedAt: string
}

export type CircuitTrace = TraceEnvelope<CircuitAnalysisContext>

export interface SimulationResult {
  isClosedLoop: boolean
  isSeries: boolean
  currentAmps: number
  totalResistanceOhms: number
  supplyVoltage: number
  ledOn: boolean
  voltageDrops: Record<string, number>
  warnings: string[]
  errors: string[]
  path: string[]
  trace: CircuitTrace
}

export type CircuitCapability = 'trace' | 'circuit-simulation' | 'circuit-canvas'

export type CircuitModuleManifest = AosModuleManifest<CircuitCapability>

export type CircuitType = CircuitComponentType
