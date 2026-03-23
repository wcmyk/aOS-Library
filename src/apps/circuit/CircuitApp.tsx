import { useMemo, useState } from 'react'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Palette } from './features/circuit/Palette'
import { CircuitCanvas } from './features/circuit/CircuitCanvas'
import { TracePanel } from './features/circuit/TracePanel'
import { templateMap } from './features/circuit/catalog'
import { circuitModuleManifest } from './features/circuit/module'
import { simulateCircuit } from './features/circuit/simulate'
import type { CircuitComponentType, CircuitNode, CircuitWire, SimulationResult } from './features/circuit/types'

const initialSimulation: SimulationResult | null = null

function createNode(type: CircuitComponentType, index: number): CircuitNode {
  const template = templateMap[type]
  return {
    id: crypto.randomUUID(),
    type,
    label: `${template.label} ${index + 1}`,
    position: { x: 80 + (index % 3) * 210, y: 80 + Math.floor(index / 3) * 140 },
    voltage: template.defaults.voltage,
    resistance: template.defaults.resistance,
    forwardVoltage: template.defaults.forwardVoltage,
  }
}

export function CircuitApp() {
  const [nodes, setNodes] = useState<CircuitNode[]>([
    createNode('battery', 0),
    createNode('resistor', 1),
    createNode('led', 2),
  ])
  const [wires, setWires] = useState<CircuitWire[]>([])
  const [selectedPort, setSelectedPort] = useState<{ nodeId: string; portId: string } | null>(null)
  const [simulation, setSimulation] = useState<SimulationResult | null>(initialSimulation)

  const stats = useMemo(() => {
    if (!simulation) {
      return [
        { label: 'Current', value: '\u2014' },
        { label: 'Loop', value: 'Not evaluated' },
        { label: 'LED', value: 'Idle' },
      ]
    }

    return [
      { label: 'Current', value: `${simulation.currentAmps.toFixed(3)} A` },
      { label: 'Loop', value: simulation.isClosedLoop ? 'Closed' : 'Open' },
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

  const handleSelectPort = (nodeId: string, portId: string) => {
    if (!selectedPort) {
      setSelectedPort({ nodeId, portId })
      return
    }

    if (selectedPort.nodeId === nodeId && selectedPort.portId === portId) {
      setSelectedPort(null)
      return
    }

    const duplicate = wires.some(
      (wire) =>
        (wire.from.nodeId === selectedPort.nodeId && wire.from.portId === selectedPort.portId && wire.to.nodeId === nodeId && wire.to.portId === portId) ||
        (wire.to.nodeId === selectedPort.nodeId && wire.to.portId === selectedPort.portId && wire.from.nodeId === nodeId && wire.from.portId === portId),
    )

    if (!duplicate && selectedPort.nodeId !== nodeId) {
      setWires((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          from: selectedPort,
          to: { nodeId, portId },
        },
      ])
    }

    setSelectedPort(null)
    setSimulation(null)
  }

  const runSimulation = () => setSimulation(simulateCircuit(nodes, wires))
  const reset = () => {
    setNodes([createNode('battery', 0), createNode('resistor', 1), createNode('led', 2)])
    setWires([])
    setSelectedPort(null)
    setSimulation(null)
  }

  const relationshipCopy =
    'This app uses shared aOS contracts for structured trace envelopes and module manifests, keeping circuit physics self-contained while integrating cleanly with the aOS ecosystem.'

  return (
    <div className="min-h-full bg-[#06111f] px-6 py-8 text-[#edf5ff] overflow-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Card className="overflow-hidden">
          <CardContent className="relative flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(167,139,250,0.12),transparent_28%)]" />
            <div className="relative space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="primary">{circuitModuleManifest.name}</Badge>
                <Badge>{circuitModuleManifest.version}</Badge>
                <Badge>{circuitModuleManifest.capabilities.join(' \u00B7 ')}</Badge>
              </div>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-white">Transparent circuit simulation for the aOS ecosystem.</h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-200">
                  Build a battery \u2192 resistor \u2192 LED loop, wire it together, and inspect exactly how the system interprets topology, applies rules, and computes the outcome.
                </p>
              </div>
            </div>
            <div className="relative grid gap-3 sm:grid-cols-3">
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
                  <div className="mb-2 font-medium text-white">Reused shared contracts</div>
                  <ul className="list-disc space-y-1 pl-5 text-slate-300">
                    <li>Trace envelope + step categories</li>
                    <li>Module manifest contract</li>
                    <li>Shared typing boundary for domain integration</li>
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
                    <CardDescription>Select two ports to create a wire. Drag components to reposition them.</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" onClick={runSimulation}>\u25B6 Run Simulation</Button>
                    <Button onClick={reset}>\u21BA Reset</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CircuitCanvas
                  nodes={nodes}
                  wires={wires}
                  selectedPort={selectedPort}
                  simulationActive={Boolean(simulation?.isClosedLoop)}
                  ledOn={Boolean(simulation?.ledOn)}
                  onMoveNode={moveNode}
                  onSelectPort={handleSelectPort}
                />
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="flex items-center gap-3 px-5 py-5">
                  <div className="text-3xl">\uD83D\uDD01</div>
                  <div>
                    <div className="text-sm font-medium text-white">Topology</div>
                    <div className="text-xs text-slate-300">Closed-loop validation and disconnected component detection.</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 px-5 py-5">
                  <div className="text-3xl">\uD83D\uDCD0</div>
                  <div>
                    <div className="text-sm font-medium text-white">Solver</div>
                    <div className="text-xs text-slate-300">Single-loop Ohm's Law with LED forward-voltage handling.</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 px-5 py-5">
                  <div className="text-3xl">\uD83D\uDD0D</div>
                  <div>
                    <div className="text-sm font-medium text-white">Inspectability</div>
                    <div className="text-xs text-slate-300">Structured trace explains exactly why the simulation succeeded or failed.</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <TracePanel trace={simulation?.trace ?? null} />
        </div>
      </div>
    </div>
  )
}
