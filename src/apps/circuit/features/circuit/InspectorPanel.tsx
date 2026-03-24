import { getNodeValueLabel, templateMap } from './catalog'
import type { CircuitNode, SimulationResult } from './types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'

interface InspectorPanelProps {
  node: CircuitNode | null
  simulation: SimulationResult | null
  onSelectNode: (nodeId: string | null) => void
  onUpdateNode: (nodeId: string, patch: Partial<CircuitNode>) => void
  onRemoveNode: (nodeId: string) => void
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number | undefined
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-200">
      <span>{label}</span>
      <input
        className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none"
        max={max}
        min={min}
        step={step}
        type="number"
        value={value ?? ''}
        onChange={(event) => {
          const parsed = Number(event.target.value)
          if (!Number.isFinite(parsed)) return
          const clamped = Math.min(max, Math.max(min, parsed))
          onChange(clamped)
        }}
      />
    </label>
  )
}

export function InspectorPanel({ node, simulation, onSelectNode, onUpdateNode, onRemoveNode }: InspectorPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Component Inspector</CardTitle>
        <CardDescription>Select a part to tune electrical properties, inspect computed drops, or remove it from the loop.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!node && <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-300">Select a component on the canvas to edit it.</div>}
        {node && (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-slate-400">{node.type}</div>
              <div className="mt-1 text-lg font-semibold text-white">{node.label}</div>
              <div className="mt-2 text-sm text-slate-300">{getNodeValueLabel(node)}</div>
            </div>

            <label className="grid gap-2 text-sm text-slate-200">
              <span>Display name</span>
              <input
                className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none"
                value={node.label}
                onChange={(event) => onUpdateNode(node.id, { label: event.target.value })}
              />
            </label>

            {node.type === 'battery' && (
              <NumberField label="Supply voltage (V)" max={48} min={1} step={0.1} value={node.voltage ?? templateMap.battery.defaults.voltage} onChange={(value) => onUpdateNode(node.id, { voltage: value })} />
            )}
            {node.type === 'resistor' && (
              <NumberField label="Resistance (Ω)" max={1000000} min={1} step={1} value={node.resistance ?? templateMap.resistor.defaults.resistance} onChange={(value) => onUpdateNode(node.id, { resistance: value })} />
            )}
            {node.type === 'led' && (
              <NumberField label="Forward voltage (V)" max={5} min={1} step={0.1} value={node.forwardVoltage ?? templateMap.led.defaults.forwardVoltage} onChange={(value) => onUpdateNode(node.id, { forwardVoltage: value })} />
            )}
            {node.type === 'switch' && (
              <div className="grid gap-3">
                <button
                  className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-left text-white"
                  type="button"
                  onClick={() => onUpdateNode(node.id, { isClosed: !(node.isClosed ?? templateMap.switch.defaults.isClosed) })}
                >
                  Switch state: {(node.isClosed ?? templateMap.switch.defaults.isClosed) ? 'Closed' : 'Open'}
                </button>
                <NumberField label="Closed resistance (Ω)" max={10} min={0.01} step={0.01} value={node.resistance ?? templateMap.switch.defaults.resistance} onChange={(value) => onUpdateNode(node.id, { resistance: value })} />
              </div>
            )}
            {node.type === 'capacitor' && (
              <div className="grid gap-3">
                <NumberField label="Capacitance (µF)" max={100000} min={1} step={1} value={node.capacitance ?? templateMap.capacitor.defaults.capacitance} onChange={(value) => onUpdateNode(node.id, { capacitance: value })} />
                <NumberField label="Equivalent series resistance (Ω)" max={50} min={0.01} step={0.01} value={node.resistance ?? templateMap.capacitor.defaults.resistance} onChange={(value) => onUpdateNode(node.id, { resistance: value })} />
              </div>
            )}
            {node.type === 'transistor' && (
              <div className="grid gap-3">
                <NumberField label="Gain (β)" max={400} min={10} step={1} value={node.gain ?? templateMap.transistor.defaults.gain} onChange={(value) => onUpdateNode(node.id, { gain: value })} />
                <NumberField label="Collector-emitter drop (V)" max={2} min={0.05} step={0.01} value={node.collectorEmitterDrop ?? templateMap.transistor.defaults.collectorEmitterDrop} onChange={(value) => onUpdateNode(node.id, { collectorEmitterDrop: value })} />
                <NumberField label="Equivalent channel resistance (Ω)" max={500} min={0.1} step={0.1} value={node.resistance ?? templateMap.transistor.defaults.resistance} onChange={(value) => onUpdateNode(node.id, { resistance: value })} />
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 text-sm text-slate-300">
              <div className="font-medium text-white">Simulation metrics</div>
              <div className="mt-2 space-y-1">
                <div>Voltage drop: {(simulation?.voltageDrops[node.id] ?? 0).toFixed(3)} V</div>
                <div>Power: {(simulation?.powerWatts[node.id] ?? 0).toFixed(4)} W</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 rounded-xl bg-white/10 px-4 py-2 text-white" type="button" onClick={() => onSelectNode(null)}>Clear selection</button>
              <button className="flex-1 rounded-xl bg-rose-500/20 px-4 py-2 text-rose-200" type="button" onClick={() => onRemoveNode(node.id)}>Remove</button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
