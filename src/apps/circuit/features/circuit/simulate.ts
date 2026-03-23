import { templateMap } from './catalog'
import { createCircuitTrace, circuitTraceStep } from './trace'
import type { CircuitNode, CircuitWire, SimulationResult } from './types'

interface AdjacencyEntry {
  wireId: string
  targetNodeId: string
}

function buildAdjacency(nodes: CircuitNode[], wires: CircuitWire[]) {
  const adjacency = new Map<string, AdjacencyEntry[]>()
  for (const node of nodes) {
    adjacency.set(node.id, [])
  }

  for (const wire of wires) {
    adjacency.get(wire.from.nodeId)?.push({ wireId: wire.id, targetNodeId: wire.to.nodeId })
    adjacency.get(wire.to.nodeId)?.push({ wireId: wire.id, targetNodeId: wire.from.nodeId })
  }

  return adjacency
}

function formatPath(nodes: CircuitNode[], path: string[]) {
  const labels = path.map((nodeId) => nodes.find((candidate) => candidate.id === nodeId)?.label ?? nodeId)
  return labels.join(' \u2192 ')
}

export function simulateCircuit(nodes: CircuitNode[], wires: CircuitWire[]): SimulationResult {
  const steps = [
    circuitTraceStep.intent(
      'User requested simulation',
      `Run simulation on ${nodes.length} component(s) and ${wires.length} wire(s).`,
      { nodeIds: nodes.map((node) => node.id), wireIds: wires.map((wire) => wire.id) },
    ),
  ]

  const context = {
    nodeCount: nodes.length,
    wireCount: wires.length,
    requestedAt: new Date().toISOString(),
  }

  if (nodes.length === 0) {
    steps.push(circuitTraceStep.failure('No components placed', 'Simulation aborted because the canvas is empty.'))
    return {
      isClosedLoop: false,
      isSeries: false,
      currentAmps: 0,
      totalResistanceOhms: 0,
      supplyVoltage: 0,
      ledOn: false,
      voltageDrops: {},
      warnings: [],
      errors: ['No components placed on the canvas.'],
      path: [],
      trace: createCircuitTrace(context, steps),
    }
  }

  // Capacitors block DC current — fail early if one is in the circuit
  const capacitors = nodes.filter((n) => n.type === 'capacitor')
  if (capacitors.length > 0) {
    steps.push(
      circuitTraceStep.failure(
        'Capacitor blocks DC current',
        'Capacitors block steady-state DC current. Remove the capacitor or use an AC solver.',
        { capacitorIds: capacitors.map((c) => c.id) },
      ),
    )
    return {
      isClosedLoop: false,
      isSeries: false,
      currentAmps: 0,
      totalResistanceOhms: 0,
      supplyVoltage: 0,
      ledOn: false,
      voltageDrops: {},
      warnings: [],
      errors: ['Capacitor blocks DC current. Remove capacitor or use AC solver.'],
      path: [],
      trace: createCircuitTrace(context, steps),
    }
  }

  // Open switches break the circuit — filter their wires from the conducting set
  const openSwitches = new Set(nodes.filter((n) => n.type === 'switch' && !(n.closed ?? true)).map((n) => n.id))
  if (openSwitches.size > 0) {
    const openLabels = nodes.filter((n) => openSwitches.has(n.id)).map((n) => n.label)
    steps.push(
      circuitTraceStep.topology(
        'Open switch detected',
        `Switch(es) are open, breaking the circuit path: ${openLabels.join(', ')}.`,
        'warning',
        { openSwitches: [...openSwitches] },
      ),
    )
  }

  const conductingWires = wires.filter(
    (w) => !openSwitches.has(w.from.nodeId) && !openSwitches.has(w.to.nodeId),
  )

  const adjacency = buildAdjacency(nodes, conductingWires)
  const disconnected = nodes.filter((node) => (adjacency.get(node.id)?.length ?? 0) === 0)
  if (disconnected.length > 0) {
    steps.push(
      circuitTraceStep.failure(
        'Disconnected component detected',
        `The following components are isolated: ${disconnected.map((node) => node.label).join(', ')}.`,
        { disconnected: disconnected.map((node) => node.id) },
      ),
    )
    return {
      isClosedLoop: false,
      isSeries: false,
      currentAmps: 0,
      totalResistanceOhms: 0,
      supplyVoltage: 0,
      ledOn: false,
      voltageDrops: {},
      warnings: [],
      errors: ['One or more components are disconnected.'],
      path: [],
      trace: createCircuitTrace(context, steps),
    }
  }

  steps.push(
    circuitTraceStep.interpretation(
      'Circuit graph assembled',
      'Converted the canvas into a node-edge graph for topology analysis.',
      {
        degrees: Object.fromEntries(nodes.map((node) => [node.label, adjacency.get(node.id)?.length ?? 0])),
      },
    ),
  )

  const degrees = nodes.map((node) => adjacency.get(node.id)?.length ?? 0)
  const hasClosedLoop = nodes.length >= 2 && degrees.every((degree) => degree === 2) && conductingWires.length === nodes.length
  if (!hasClosedLoop) {
    steps.push(
      circuitTraceStep.topology(
        'No closed loop detected',
        'A valid series loop requires every component to have exactly two connections and the wire count to match the node count.',
        'error',
        { degrees, conductingWireCount: conductingWires.length, nodeCount: nodes.length },
      ),
    )
    steps.push(circuitTraceStep.effect('Current forced to zero', 'Without a closed loop, charge cannot circulate through the circuit.', 'warning'))

    return {
      isClosedLoop: false,
      isSeries: false,
      currentAmps: 0,
      totalResistanceOhms: 0,
      supplyVoltage: 0,
      ledOn: false,
      voltageDrops: {},
      warnings: [],
      errors: ['No closed loop detected, current = 0 A.'],
      path: [],
      trace: createCircuitTrace(context, steps),
    }
  }

  const startNode = nodes.find((node) => node.type === 'battery') ?? nodes[0]
  const visited = new Set<string>()
  const path = [startNode.id]
  let previous: string | null = null
  let current = startNode.id

  while (true) {
    visited.add(current)
    const neighbors = (adjacency.get(current) ?? []).filter((entry) => entry.targetNodeId !== previous)
    const next = neighbors[0]?.targetNodeId

    if (!next) {
      break
    }

    if (next === startNode.id) {
      path.push(next)
      break
    }

    path.push(next)
    previous = current
    current = next

    if (path.length > nodes.length + 1) {
      break
    }
  }

  const uniquePath = path.slice(0, -1)
  const uniqueNodes = uniquePath.map((nodeId) => nodes.find((node) => node.id === nodeId)).filter(Boolean) as CircuitNode[]
  const batteryCount = nodes.filter((node) => node.type === 'battery').length
  const seriesSupported = batteryCount === 1 && uniqueNodes.length === nodes.length

  steps.push(
    circuitTraceStep.topology(
      'Closed loop detected',
      `Identified a loop through ${formatPath(nodes, path)}.`,
      'success',
      { path },
    ),
  )

  if (!seriesSupported) {
    const message = batteryCount === 1 ? 'Invalid topology for current solver.' : 'Exactly one battery is supported in the MVP solver.'
    steps.push(circuitTraceStep.failure('Topology is outside MVP solver scope', message, { batteryCount, path }))

    return {
      isClosedLoop: true,
      isSeries: false,
      currentAmps: 0,
      totalResistanceOhms: 0,
      supplyVoltage: 0,
      ledOn: false,
      voltageDrops: {},
      warnings: [],
      errors: [message],
      path,
      trace: createCircuitTrace(context, steps),
    }
  }

  const battery = nodes.find((node) => node.type === 'battery')!
  const supplyVoltage = battery.voltage ?? templateMap.battery.defaults.voltage ?? 9
  const resistors = nodes.filter((node) => node.type === 'resistor')
  const leds = nodes.filter((node) => node.type === 'led')
  // Switches with 0 resistance and no voltage drop are transparent to the solver
  const totalResistanceOhms = resistors.reduce(
    (sum, resistor) => sum + (resistor.resistance ?? templateMap.resistor.defaults.resistance ?? 220),
    0,
  )

  steps.push(
    circuitTraceStep.rule(
      'Series circuit detected',
      'The solver will apply a single-loop series analysis using component resistance and LED forward voltage.',
      { resistorCount: resistors.length, ledCount: leds.length },
    ),
  )

  if (totalResistanceOhms <= 0) {
    steps.push(
      circuitTraceStep.failure(
        'Resistance too low',
        'The equivalent series resistance must be greater than zero for the MVP Ohm\u2019s Law solver.',
        { totalResistanceOhms },
      ),
    )
    return {
      isClosedLoop: true,
      isSeries: true,
      currentAmps: 0,
      totalResistanceOhms,
      supplyVoltage,
      ledOn: false,
      voltageDrops: {},
      warnings: [],
      errors: ['Resistance too low for the current solver.'],
      path,
      trace: createCircuitTrace(context, steps),
    }
  }

  const totalLedDrop = leds.reduce((sum, led) => sum + (led.forwardVoltage ?? templateMap.led.defaults.forwardVoltage ?? 2), 0)
  const availableVoltage = supplyVoltage - totalLedDrop
  if (availableVoltage <= 0) {
    steps.push(
      circuitTraceStep.failure(
        'Insufficient voltage for LED path',
        'The battery voltage does not exceed the LED forward-voltage requirements.',
        { supplyVoltage, totalLedDrop },
      ),
    )
    return {
      isClosedLoop: true,
      isSeries: true,
      currentAmps: 0,
      totalResistanceOhms,
      supplyVoltage,
      ledOn: false,
      voltageDrops: {},
      warnings: [],
      errors: ['Battery voltage is too low to forward-bias the LED path.'],
      path,
      trace: createCircuitTrace(context, steps),
    }
  }

  const currentAmps = availableVoltage / totalResistanceOhms
  const voltageDrops = Object.fromEntries([
    ...resistors.map((resistor) => [resistor.id, currentAmps * (resistor.resistance ?? templateMap.resistor.defaults.resistance ?? 220)]),
    ...leds.map((led) => [led.id, led.forwardVoltage ?? templateMap.led.defaults.forwardVoltage ?? 2]),
    [battery.id, supplyVoltage],
  ])

  steps.push(
    circuitTraceStep.computation(
      'Applied Ohm\u2019s Law',
      `Computed current = (${supplyVoltage.toFixed(2)} V \u2212 ${totalLedDrop.toFixed(2)} V) / ${totalResistanceOhms.toFixed(2)} \u03A9 = ${currentAmps.toFixed(3)} A.`,
      'success',
      { supplyVoltage, totalLedDrop, totalResistanceOhms, currentAmps },
    ),
  )
  steps.push(
    circuitTraceStep.effect(
      leds.length > 0 ? 'LED activated' : 'Passive loop stabilized',
      leds.length > 0
        ? 'At least one LED is forward biased, so the indicator is considered on in the visualization.'
        : 'No LED was present, so the solver produced current without a visible light output.',
      'success',
      { ledCount: leds.length, voltageDrops },
    ),
  )

  return {
    isClosedLoop: true,
    isSeries: true,
    currentAmps,
    totalResistanceOhms,
    supplyVoltage,
    ledOn: leds.length > 0,
    voltageDrops,
    warnings: [],
    errors: [],
    path,
    trace: createCircuitTrace(context, steps),
  }
}
