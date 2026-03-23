export type TraceLevel = 'info' | 'success' | 'warning' | 'error'

export type TraceCategory =
  | 'intent'
  | 'interpretation'
  | 'topology'
  | 'rule'
  | 'computation'
  | 'effect'
  | 'failure'

export interface TraceStep {
  id: string
  category: TraceCategory
  title: string
  detail: string
  level: TraceLevel
  data?: Record<string, unknown>
}

export interface TraceEnvelope<TContext = Record<string, unknown>> {
  traceId: string
  source: string
  timestamp: string
  context: TContext
  steps: TraceStep[]
}

export interface AosModuleManifest<TCapabilities extends string = string> {
  id: string
  name: string
  version: string
  capabilities: TCapabilities[]
  description: string
}
