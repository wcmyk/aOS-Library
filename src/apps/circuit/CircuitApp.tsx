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
    position: { x: 80 + (index % 3) * 220, y: 80 + Math.floor(index / 3) * 160 },
    voltage: template.defaults.voltage,
    resistance: template.defaults.resistance,
    forwardVoltage: template.defaults.forwardVoltage,
    closed: template.defaults.closed,
    capacitance: template.defaults.capacitance,
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
        { label: 'Current', value: '\u2014', sub: 'A' },
        { label: 'Resistance', value: '\u2014', sub: '\u03A9' },
        { label: 'Voltage', value: '\u2014', sub: 'V' },
        { label: 'Power', value: '\u2014', sub: 'W' },
        { label: 'Loop', value: 'Idle', sub: '' },
        { label: 'LED', value: 'Idle', sub: '' },
      ]
    }
    const power = simulation.currentAmps * simulation.supplyVoltage
    return [
      { label: 'Current', value: simulation.currentAmps.toFixed(3), sub: 'A' },
      { label: 'Resistance', value: simulation.totalResistanceOhms.toFixed(0), sub: '\u03A9' },
      { label: 'Voltage', value: simulation.supplyVoltage.toFixed(1), sub: 'V' },
      { label: 'Power', value: power.toFixed(3), sub: 'W' },
      { label: 'Loop', value: simulation.isClosedLoop ? 'Closed' : 'Open', sub: '' },
      { label: 'LED', value: simulation.ledOn ? 'ON' : 'OFF', sub: '' },
    ]
  }, [simulation])

  const addComponent = (type: CircuitComponentType) => {
    setNodes((current) => [...current, createNode(type, current.length)])
    setSimulation(null)
  }

  const moveNode = (nodeId: string, position: { x: number; y: number }) => {
    setNodes((current) =>
      current.map((node) =>
        node.id === nodeId ? { ...node, position: { x: Math.max(8, position.x), y: Math.max(8, position.y) } } : node,
      ),
    )
  }

  const deleteNode = (nodeId: string) => {
    setNodes((current) => current.filter((n) => n.id !== nodeId))
    setWires((current) => current.filter((w) => w.from.nodeId !== nodeId && w.to.nodeId !== nodeId))
    setSimulation(null)
  }

  const deleteWire = (wireId: string) => {
    setWires((current) => current.filter((w) => w.id !== wireId))
    setSimulation(null)
  }

  const toggleSwitch = (nodeId: string) => {
    setNodes((current) =>
      current.map((node) => (node.id === nodeId ? { ...node, closed: !(node.closed ?? true) } : node)),
    )
    setSimulation(null)
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
        { id: crypto.randomUUID(), from: selectedPort, to: { nodeId, portId } },
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

  const hasErrors = simulation && simulation.errors.length > 0
  const simStatusColor = !simulation ? 'text-slate-400' : hasErrors ? 'text-rose-400' : 'text-emerald-400'
  const simStatusText = !simulation ? 'Not run' : hasErrors ? simulation.errors[0] : 'Success \u2014 circuit solved'

  return (
    <div className="min-h-full bg-[#06111f] px-6 py-8 text-[#edf5ff] overflow-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Header */}
        <Card className="overflow-hidden">
          <CardContent className="relative flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.13),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(192,132,252,0.10),transparent_28%)]" />
            <div className="relative space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="primary">{circuitModuleManifest.name}</Badge>
                <Badge>{circuitModuleManifest.version}</Badge>
                <Badge>{circuitModuleManifest.capabilities.join(' \u00B7 ')}</Badge>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                Interactive circuit simulation for the aOS ecosystem.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                Build circuits with batteries, resistors, LEDs, switches, and capacitors. Wire components by clicking ports,
                drag to reposition, and hover to delete. Run simulation to see animated current flow with full trace output.
              </p>
            </div>
            <div className="relative grid grid-cols-3 gap-2 min-w-[340px]">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3 backdrop-blur">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400">{stat.label}</div>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className="text-base font-semibold text-white">{stat.value}</span>
                    {stat.sub && <span className="text-xs text-slate-400">{stat.sub}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main layout */}
        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
          {/* Left: palette + integration info */}
          <div className="space-y-6">
            <Palette onAddComponent={addComponent} />
            <Card>
              <CardHeader>
                <CardTitle>Controls</CardTitle>
                <CardDescription>Tips for using the canvas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs leading-5 text-slate-300">
                <div className="flex gap-2"><span className="text-slate-400">Click port</span><span>\u2192 select, click another to wire</span></div>
                <div className="flex gap-2"><span className="text-slate-400">Drag card</span><span>\u2192 reposition component</span></div>
                <div className="flex gap-2"><span className="text-slate-400">Hover card</span><span>\u2192 reveals \u00D7 delete button</span></div>
                <div className="flex gap-2"><span className="text-slate-400">Hover wire</span><span>\u2192 click \u00D7 to remove wire</span></div>
                <div className="flex gap-2"><span className="text-slate-400">Switch</span><span>\u2192 click CLOSE/OPEN pill to toggle</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>aOS Integration</CardTitle>
                <CardDescription>Shared contracts, local physics.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-slate-200">
                <p>Circuit physics and simulation are fully local to this app. Shared aOS contracts provide the structured trace envelope and module manifest boundary.</p>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 font-medium text-white">Reused shared contracts</div>
                  <ul className="list-disc space-y-1 pl-5 text-slate-300 text-xs">
                    <li>Trace envelope + step categories</li>
                    <li>Module manifest contract</li>
                    <li>Shared typing boundary</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center: canvas */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Circuit Canvas</CardTitle>
                    <CardDescription>Click ports to wire. Drag to move. Hover to delete.</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" onClick={runSimulation}>
                      <span className="mr-1.5">\u25B6</span> Simulate
                    </Button>
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
                  voltageDrops={simulation?.voltageDrops}
                  onMoveNode={moveNode}
                  onSelectPort={handleSelectPort}
                  onDeleteNode={deleteNode}
                  onDeleteWire={deleteWire}
                  onToggleSwitch={toggleSwitch}
                />
              </CardContent>
            </Card>

            {/* Simulation status bar */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-3 flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full flex-shrink-0 ${!simulation ? 'bg-slate-500' : hasErrors ? 'bg-rose-500' : 'bg-emerald-500 shadow-[0_0_8px_rgba(74,222,128,0.7)]'}`} />
              <div className={`text-sm ${simStatusColor}`}>{simStatusText}</div>
              {simulation && simulation.warnings.length > 0 && (
                <div className="ml-auto text-xs text-amber-400">{simulation.warnings[0]}</div>
              )}
            </div>

            {/* Feature cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="flex items-start gap-3 px-5 py-5">
                  <div className="mt-0.5 h-8 w-8 rounded-xl bg-sky-500/15 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="#38bdf8" strokeWidth="1.5" />
                      <path d="M5 8h6M8 5v6" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Topology</div>
                    <div className="text-xs text-slate-300 mt-0.5">Closed-loop validation with disconnected component detection.</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-start gap-3 px-5 py-5">
                  <div className="mt-0.5 h-8 w-8 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="6" width="12" height="4" rx="1.5" stroke="#c084fc" strokeWidth="1.5" />
                      <line x1="0" y1="8" x2="2" y2="8" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="14" y1="8" x2="16" y2="8" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Ohm&rsquo;s Law Solver</div>
                    <div className="text-xs text-slate-300 mt-0.5">Single-loop analysis with LED forward-voltage compensation.</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-start gap-3 px-5 py-5">
                  <div className="mt-0.5 h-8 w-8 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 13L6 8l3 3 4-8" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Inspectability</div>
                    <div className="text-xs text-slate-300 mt-0.5">Structured trace explains every step of the simulation.</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right: trace panel */}
          <TracePanel trace={simulation?.trace ?? null} />
        </div>
      </div>
    </div>
  )
}
