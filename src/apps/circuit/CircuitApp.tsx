import { useMemo, useState } from 'react'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Palette } from './features/circuit/Palette'
import { CircuitCanvas } from './features/circuit/CircuitCanvas'
import { InspectorPanel } from './features/circuit/InspectorPanel'
import { TracePanel } from './features/circuit/TracePanel'
import { templateMap } from './features/circuit/catalog'
import { circuitModuleManifest } from './features/circuit/module'
import { simulateCircuit } from './features/circuit/simulate'
import type { CircuitComponentType, CircuitNode, CircuitWire, SimulationResult } from './features/circuit/types'

const initialSimulation: SimulationResult | null = null
const INITIAL_NODES: CircuitComponentType[] = ['battery', 'switch', 'resistor', 'led', 'capacitor']

function createNode(type: CircuitComponentType, index: number): CircuitNode {
  const template = templateMap[type]
  return {
    id: crypto.randomUUID(),
    type,
    label: `${template.label} ${index + 1}`,
    position: { x: 72 + (index % 3) * 228, y: 72 + Math.floor(index / 3) * 165 },
    voltage: template.defaults.voltage,
    resistance: template.defaults.resistance,
    forwardVoltage: template.defaults.forwardVoltage,
    capacitance: template.defaults.capacitance,
    chargePercent: template.defaults.chargePercent,
    gain: template.defaults.gain,
    collectorEmitterDrop: template.defaults.collectorEmitterDrop,
    isClosed: template.defaults.isClosed,
  }
}

function createStarterNodes() {
  return INITIAL_NODES.map((type, index) => createNode(type, index))
}

export function CircuitApp() {
  const [nodes, setNodes] = useState<CircuitNode[]>(createStarterNodes)
  const [wires, setWires] = useState<CircuitWire[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedPort, setSelectedPort] = useState<{ nodeId: string; portId: string } | null>(null)
  const [previewWire, setPreviewWire] = useState<{ from: { nodeId: string; portId: string }; x: number; y: number } | null>(null)
  const [simulation, setSimulation] = useState<SimulationResult | null>(initialSimulation)

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) ?? null, [nodes, selectedNodeId])

  const stats = useMemo(() => {
    if (!simulation) {
      return [
        { label: 'Current', value: '—' },
        { label: 'Loop', value: 'Not evaluated' },
        { label: 'Charge', value: 'Pending' },
        { label: 'LED', value: 'Idle' },
      ]
    }

    return [
      { label: 'Current', value: `${simulation.currentAmps.toFixed(4)} A` },
      { label: 'Loop', value: simulation.isClosedLoop ? 'Closed' : 'Open' },
      { label: 'Charge', value: simulation.capacitorChargeSeconds === null ? 'N/A' : `${simulation.capacitorChargeSeconds.toFixed(3)} s` },
      { label: 'LED', value: simulation.ledOn ? 'On' : 'Off' },
    ]
  }, [simulation])

  const addComponent = (type: CircuitComponentType) => {
    setNodes((current) => [...current, createNode(type, current.length)])
    setSimulation(null)
  }

  const moveNode = (nodeId: string, position: { x: number; y: number }) => {
    setNodes((current) =>
      current.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              position: {
                x: Math.max(24, position.x),
                y: Math.max(24, position.y),
              },
            }
          : node,
      ),
    )
  }

  const completeWire = (targetNodeId: string, targetPortId: string) => {
    if (!previewWire) return
    const source = previewWire.from
    if (source.nodeId === targetNodeId && source.portId === targetPortId) {
      setPreviewWire(null)
      setSelectedPort(null)
      return
    }

    const duplicate = wires.some(
      (wire) =>
        (wire.from.nodeId === source.nodeId && wire.from.portId === source.portId && wire.to.nodeId === targetNodeId && wire.to.portId === targetPortId) ||
        (wire.to.nodeId === source.nodeId && wire.to.portId === source.portId && wire.from.nodeId === targetNodeId && wire.from.portId === targetPortId),
    )

    if (!duplicate && source.nodeId !== targetNodeId) {
      setWires((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          from: source,
          to: { nodeId: targetNodeId, portId: targetPortId },
        },
      ])
    }

    setPreviewWire(null)
    setSelectedPort(null)
    setSimulation(null)
  }

  const runSimulation = () => setSimulation(simulateCircuit(nodes, wires))
  const reset = () => {
    setNodes(createStarterNodes())
    setWires([])
    setSelectedNodeId(null)
    setSelectedPort(null)
    setPreviewWire(null)
    setSimulation(null)
  }

  const updateNode = (nodeId: string, patch: Partial<CircuitNode>) => {
    setNodes((current) => current.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)))
    setSimulation(null)
  }

  const removeNode = (nodeId: string) => {
    setNodes((current) => current.filter((node) => node.id !== nodeId))
    setWires((current) => current.filter((wire) => wire.from.nodeId !== nodeId && wire.to.nodeId !== nodeId))
    setSelectedNodeId((current) => (current === nodeId ? null : current))
    setSimulation(null)
  }

  const relationshipCopy =
    'The canvas now supports richer part families, direct inspector editing, simplified switch/transistor/capacitor modeling, and interactive wire dragging while still emitting structured aOS traces.'

  return (
    <div className="min-h-full overflow-auto bg-[#06111f] px-6 py-8 text-[#edf5ff]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Card className="overflow-hidden">
          <CardContent className="relative flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(167,139,250,0.12),transparent_28%)]" />
            <div className="relative space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="primary">{circuitModuleManifest.name}</Badge>
                <Badge>{circuitModuleManifest.version}</Badge>
                <Badge>{circuitModuleManifest.capabilities.join(' · ')}</Badge>
              </div>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-white">Realistic circuit building with a live storefront-to-lab workflow.</h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-200">
                  Assemble a more realistic single-loop circuit with batteries, switches, resistors, LEDs, capacitors, and transistor stages. Drag wires between ports, tune part values in the inspector, and inspect richer voltage, power, and timing outputs.
                </p>
              </div>
            </div>
            <div className="relative grid gap-3 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 backdrop-blur">
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-400">{stat.label}</div>
                  <div className="mt-1 text-lg font-semibold text-white">{stat.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Palette onAddComponent={addComponent} />
            <Card>
              <CardHeader>
                <CardTitle>aOS Integration</CardTitle>
                <CardDescription>The shared layer stays reusable while circuit physics remains local to this app.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-slate-200">
                <p>{relationshipCopy}</p>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 font-medium text-white">What changed</div>
                  <ul className="list-disc space-y-1 pl-5 text-slate-300">
                    <li>Interactive drag-to-connect wiring with removable traces</li>
                    <li>Editable battery, resistor, LED, switch, capacitor, and transistor properties</li>
                    <li>Computed current, voltage drop, power dissipation, and capacitor charge estimates</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Circuit Canvas</CardTitle>
                    <CardDescription>Drag parts to reposition them, then drag from one port to another to lay out the loop.</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" onClick={runSimulation}>▶ Run Simulation</Button>
                    <Button onClick={reset}>↺ Reset</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CircuitCanvas
                  nodes={nodes}
                  wires={wires}
                  selectedNodeId={selectedNodeId}
                  selectedPort={selectedPort}
                  previewWire={previewWire}
                  simulationActive={Boolean(simulation?.isClosedLoop)}
                  ledOn={Boolean(simulation?.ledOn)}
                  onMoveNode={moveNode}
                  onSelectNode={setSelectedNodeId}
                  onStartWireDrag={(nodeId, portId) => {
                    const node = nodes.find((candidate) => candidate.id === nodeId)
                    if (!node) return
                    const initialPoint = {
                      x: node.position.x + (['negative', 'left', 'anode', 'input', 'collector', 'positive'].includes(portId) ? 0 : 168),
                      y: node.position.y + 56,
                    }
                    setSelectedPort({ nodeId, portId })
                    setPreviewWire({ from: { nodeId, portId }, ...initialPoint })
                  }}
                  onUpdatePreviewWire={(point) => setPreviewWire((current) => (current ? { ...current, ...point } : current))}
                  onCompleteWire={completeWire}
                  onCancelWireDrag={() => {
                    setPreviewWire(null)
                    setSelectedPort(null)
                  }}
                  onRemoveWire={(wireId) => {
                    setWires((current) => current.filter((wire) => wire.id !== wireId))
                    setSimulation(null)
                  }}
                />
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="flex items-center gap-3 px-5 py-5">
                  <div className="text-3xl">🪛</div>
                  <div>
                    <div className="text-sm font-medium text-white">Workbench</div>
                    <div className="text-xs text-slate-300">Parts now support inspector-driven value tuning and removal.</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 px-5 py-5">
                  <div className="text-3xl">⚡</div>
                  <div>
                    <div className="text-sm font-medium text-white">Electrical Model</div>
                    <div className="text-xs text-slate-300">Reports current, voltage drops, power, switch continuity, and RC timing.</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 px-5 py-5">
                  <div className="text-3xl">🧭</div>
                  <div>
                    <div className="text-sm font-medium text-white">Traceability</div>
                    <div className="text-xs text-slate-300">Structured trace still explains every topology, rule, and computation step.</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <InspectorPanel
              node={selectedNode}
              simulation={simulation}
              onSelectNode={setSelectedNodeId}
              onUpdateNode={updateNode}
              onRemoveNode={removeNode}
            />
            <TracePanel trace={simulation?.trace ?? null} />
          </div>
        </div>
      </div>
    </div>
  )
}
