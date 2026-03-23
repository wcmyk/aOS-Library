import type { CircuitTrace } from './types'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'

function badgeVariant(level: CircuitTrace['steps'][number]['level']) {
  if (level === 'success') return 'success'
  if (level === 'warning') return 'warning'
  if (level === 'error') return 'destructive'
  return 'primary'
}

export function TracePanel({ trace }: { trace: CircuitTrace | null }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Execution Trace</CardTitle>
        <CardDescription>Every simulation explains user intent, topology, rules, computations, and final effects.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[560px] space-y-3 overflow-auto pr-2">
          {!trace && <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-300">Run a simulation to inspect the structured trace.</div>}
          {trace?.steps.map((step: CircuitTrace['steps'][number], index: number) => (
            <div key={step.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Step {index + 1} · {step.category}</div>
                  <div className="text-sm font-semibold text-white">{step.title}</div>
                </div>
                <Badge variant={badgeVariant(step.level)}>{step.level}</Badge>
              </div>
              <p className="text-sm leading-6 text-slate-200">{step.detail}</p>
              {step.data && (
                <pre className="mt-3 overflow-auto rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs text-slate-300">{JSON.stringify(step.data, null, 2)}</pre>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
