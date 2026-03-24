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
  return labels.join(' → ')
}

function getNodeResistance(node: CircuitNode) {
  if (node.type === 'switch') {
    return (node.isClosed ?? templateMap.switch.defaults.isClosed) ? node.resistance ?? templateMap.switch.defaults.resistance ?? 0.05 : Number.POSITIVE_INFINITY
  }
  if (node.type === 'transistor') return node.resistance ?? templateMap.transistor.defaults.resistance ?? 8
  if (node.type === 'capacitor') return node.resistance ?? templateMap.capacitor.defaults.resistance ?? 0.2
  if (node.type === 'resistor') return node.resistance ?? templateMap.resistor.defaults.resistance ?? 220
  return 0
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

  const emptyResult = (errors: string[], warnings: string[] = []): SimulationResult => ({
    isClosedLoop: false,
    isSeries: false,
    currentAmps: 0,
    totalResistanceOhms: 0,
    supplyVoltage: 0,
    ledOn: false,
    voltageDrops: {},
    powerWatts: {},
    netVoltage: 0,
    capacitorChargeSeconds: null,
    warnings,
    errors,
    path: [],
    trace: createCircuitTrace(context, steps),
  })

  if (nodes.length === 0) {
    steps.push(circuitTraceStep.failure('No components placed', 'Simulation aborted because the canvas is empty.'))
    return emptyResult(['No components placed on the canvas.'])
  }

  const adjacency = buildAdjacency(nodes, wires)
  const disconnected = nodes.filter((node) => (adjacency.get(node.id)?.length ?? 0) === 0)
  if (disconnected.length > 0) {
    steps.push(
      circuitTraceStep.failure(
        'Disconnected component detected',
        `The following components are isolated: ${disconnected.map((node) => node.label).join(', ')}.`,
        { disconnected: disconnected.map((node) => node.id) },
      ),
    )
    return emptyResult(['One or more components are disconnected.'])
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
  const hasClosedLoop = nodes.length >= 2 && degrees.every((degree) => degree === 2) && wires.length === nodes.length
  if (!hasClosedLoop) {
    steps.push(
      circuitTraceStep.topology(
        'No closed loop detected',
        'A valid series loop requires every component to have exactly two connections and the wire count to match the node count.',
        'error',
        { degrees, wireCount: wires.length, nodeCount: nodes.length },
      ),
    )
    steps.push(circuitTraceStep.effect('Current forced to zero', 'Without a closed loop, charge cannot circulate through the circuit.', 'warning'))

    return emptyResult(['No closed loop detected, current = 0 A.'])
  }

  const startNode = nodes.find((node) => node.type === 'battery') ?? nodes[0]
  const path = [startNode.id]
  let previous: string | null = null
  let current = startNode.id

  while (true) {
    const neighbors = (adjacency.get(current) ?? []).filter((entry) => entry.targetNodeId !== previous)
    const next = neighbors[0]?.targetNodeId

    if (!next) break
    if (next === startNode.id) {
      path.push(next)
      break
    }

    path.push(next)
    previous = current
    current = next

    if (path.length > nodes.length + 1) break
  }

  const uniquePath = path.slice(0, -1)
  const uniqueNodes = uniquePath.map((nodeId) => nodes.find((node) => node.id === nodeId)).filter(Boolean) as CircuitNode[]
  const batteries = nodes.filter((node) => node.type === 'battery')
  const batteryCount = batteries.length
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
    const message = batteryCount === 1 ? 'Invalid topology for current solver.' : 'Exactly one battery is supported in the current solver.'
    steps.push(circuitTraceStep.failure('Topology is outside supported solver scope', message, { batteryCount, path }))
    return {
      isClosedLoop: true,
      isSeries: false,
      currentAmps: 0,
      totalResistanceOhms: 0,
      supplyVoltage: 0,
      ledOn: false,
      voltageDrops: {},
      powerWatts: {},
      netVoltage: 0,
      capacitorChargeSeconds: null,
      warnings: [],
      errors: [message],
      path,
      trace: createCircuitTrace(context, steps),
    }
  }

  const battery = batteries[0]
  const supplyVoltage = battery.voltage ?? templateMap.battery.defaults.voltage ?? 9
  const resistors = nodes.filter((node) => node.type === 'resistor')
  const leds = nodes.filter((node) => node.type === 'led')
  const switches = nodes.filter((node) => node.type === 'switch')
  const capacitors = nodes.filter((node) => node.type === 'capacitor')
  const transistors = nodes.filter((node) => node.type === 'transistor')
  const warnings: string[] = []

  const openSwitches = switches.filter((node) => !(node.isClosed ?? templateMap.switch.defaults.isClosed))
  if (openSwitches.length > 0) {
    steps.push(
      circuitTraceStep.failure(
        'Open switch detected',
        `The following switches break continuity: ${openSwitches.map((node) => node.label).join(', ')}.`,
        { openSwitches: openSwitches.map((node) => node.id) },
      ),
    )
    return {
      isClosedLoop: false,
      isSeries: true,
      currentAmps: 0,
      totalResistanceOhms: 0,
      supplyVoltage,
      ledOn: false,
      voltageDrops: {},
      powerWatts: {},
      netVoltage: 0,
      capacitorChargeSeconds: null,
      warnings,
      errors: ['At least one switch is open, so the path is interrupted.'],
      path,
      trace: createCircuitTrace(context, steps),
    }
  }

  const totalResistanceOhms = uniqueNodes.reduce((sum, node) => sum + getNodeResistance(node), 0)
  const totalLedDrop = leds.reduce((sum, led) => sum + (led.forwardVoltage ?? templateMap.led.defaults.forwardVoltage ?? 2), 0)
  const transistorDrop = transistors.reduce((sum, transistor) => sum + (transistor.collectorEmitterDrop ?? templateMap.transistor.defaults.collectorEmitterDrop ?? 0.2), 0)
  const netVoltage = supplyVoltage - totalLedDrop - transistorDrop

  steps.push(
    circuitTraceStep.rule(
      'Enhanced series solver selected',
      'The simulator combines resistive loads, switch continuity, LED forward drop, transistor drop, and capacitor timing estimates.',
      {
        resistorCount: resistors.length,
        ledCount: leds.length,
        switchCount: switches.length,
        capacitorCount: capacitors.length,
        transistorCount: transistors.length,
      },
    ),
  )

  if (!Number.isFinite(totalResistanceOhms) || totalResistanceOhms <= 0) {
    steps.push(
      circuitTraceStep.failure(
        'Resistance too low',
        'The equivalent series resistance must be greater than zero for the current solver.',
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
      powerWatts: {},
      netVoltage,
      capacitorChargeSeconds: null,
      warnings,
      errors: ['Resistance too low for the current solver.'],
      path,
      trace: createCircuitTrace(context, steps),
    }
  }

  if (netVoltage <= 0) {
    steps.push(
      circuitTraceStep.failure(
        'Insufficient available voltage',
        'The battery voltage does not exceed aggregate LED and transistor drops.',
        { supplyVoltage, totalLedDrop, transistorDrop },
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
      powerWatts: {},
      netVoltage,
      capacitorChargeSeconds: null,
      warnings,
      errors: ['Supply voltage is too low for the selected active components.'],
      path,
      trace: createCircuitTrace(context, steps),
    }
  }

  const currentAmps = netVoltage / totalResistanceOhms
  const voltageDrops = Object.fromEntries(
    uniqueNodes.map((node) => {
      if (node.type === 'battery') return [node.id, supplyVoltage]
      if (node.type === 'led') return [node.id, node.forwardVoltage ?? templateMap.led.defaults.forwardVoltage ?? 2]
      if (node.type === 'transistor') return [node.id, node.collectorEmitterDrop ?? templateMap.transistor.defaults.collectorEmitterDrop ?? 0.2]
      return [node.id, currentAmps * getNodeResistance(node)]
    }),
  )
  const powerWatts = Object.fromEntries(
    uniqueNodes.map((node) => {
      const drop = voltageDrops[node.id] ?? 0
      return [node.id, node.type === 'battery' ? supplyVoltage * currentAmps : drop * currentAmps]
    }),
  )

  const totalCapacitanceMicro = capacitors.reduce((sum, capacitor) => sum + (capacitor.capacitance ?? templateMap.capacitor.defaults.capacitance ?? 220), 0)
  const capacitorChargeSeconds = totalCapacitanceMicro > 0 ? 5 * totalResistanceOhms * (totalCapacitanceMicro / 1_000_000) : null

  if (currentAmps > 0.08) warnings.push('Current exceeds 80 mA; use a larger resistor or lower supply voltage.')
  if (transistors.length > 0) warnings.push('Transistor behavior is estimated with a simplified collector-emitter drop model.')
  if (capacitors.length > 0) warnings.push('Capacitor timing is approximated with a single equivalent RC constant.')

  steps.push(
    circuitTraceStep.computation(
      'Applied enhanced series analysis',
      `Computed current = (${supplyVoltage.toFixed(2)} V - ${totalLedDrop.toFixed(2)} V - ${transistorDrop.toFixed(2)} V) / ${totalResistanceOhms.toFixed(2)} Ω = ${currentAmps.toFixed(4)} A.`,
      'success',
      { supplyVoltage, totalLedDrop, transistorDrop, totalResistanceOhms, currentAmps, capacitorChargeSeconds },
    ),
  )
  steps.push(
    circuitTraceStep.effect(
      leds.length > 0 ? 'Interactive components energized' : 'Passive loop stabilized',
      leds.length > 0
        ? 'At least one LED is forward biased, so the canvas can animate the energized path while reporting voltage and power metrics.'
        : 'No LED was present, so the solver produced electrical metrics without a light indicator.',
      warnings.length > 0 ? 'warning' : 'success',
      { warnings, voltageDrops, powerWatts },
    ),
  )

  return {
    isClosedLoop: true,
    isSeries: true,
    currentAmps,
    totalResistanceOhms,
    supplyVoltage,
    ledOn: leds.length > 0 && currentAmps > 0.002,
    voltageDrops,
    powerWatts,
    netVoltage,
    capacitorChargeSeconds,
    warnings,
    errors: [],
    path,
    trace: createCircuitTrace(context, steps),
  }
}
