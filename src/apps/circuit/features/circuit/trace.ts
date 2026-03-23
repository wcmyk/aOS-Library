import type { TraceCategory, TraceLevel, TraceStep } from '../../contracts'
import type { CircuitAnalysisContext, CircuitTrace } from './types'

function createStep(category: TraceCategory, title: string, detail: string, level: TraceLevel, data?: Record<string, unknown>): TraceStep {
  return {
    id: crypto.randomUUID(),
    category,
    title,
    detail,
    level,
    data,
  }
}

export function createCircuitTrace(context: CircuitAnalysisContext, steps: TraceStep[]): CircuitTrace {
  return {
    traceId: crypto.randomUUID(),
    source: 'aos-circuits/simulation',
    timestamp: new Date().toISOString(),
    context,
    steps,
  }
}

export const circuitTraceStep = {
  intent: (title: string, detail: string, data?: Record<string, unknown>) => createStep('intent', title, detail, 'info', data),
  interpretation: (title: string, detail: string, data?: Record<string, unknown>) =>
    createStep('interpretation', title, detail, 'info', data),
  topology: (title: string, detail: string, level: TraceLevel = 'info', data?: Record<string, unknown>) =>
    createStep('topology', title, detail, level, data),
  rule: (title: string, detail: string, data?: Record<string, unknown>) => createStep('rule', title, detail, 'info', data),
  computation: (title: string, detail: string, level: TraceLevel = 'success', data?: Record<string, unknown>) =>
    createStep('computation', title, detail, level, data),
  effect: (title: string, detail: string, level: TraceLevel = 'success', data?: Record<string, unknown>) =>
    createStep('effect', title, detail, level, data),
  failure: (title: string, detail: string, data?: Record<string, unknown>) => createStep('failure', title, detail, 'error', data),
}
