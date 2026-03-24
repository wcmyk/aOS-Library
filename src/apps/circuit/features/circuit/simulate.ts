import { templateMap } from './catalog'
import { createCircuitTrace, circuitTraceStep } from './trace'
import type { CircuitNode, CircuitWire, SimulationResult } from './types'

interface DisjointSet {
  parent: number[]
  rank: number[]
}

interface ResistiveBranch {
  id: string
  node: CircuitNode
  fromNet: number
  toNet: number
  resistance: number
}

interface VoltageSourceBranch {
  id: string
  node: CircuitNode
  fromNet: number
  toNet: number
  voltage: number
}

function createDisjointSet(size: number): DisjointSet {
  return {
    parent: Array.from({ length: size }, (_, index) => index),
    rank: Array.from({ length: size }, () => 0),
  }
}

function findRoot(ds: DisjointSet, value: number): number {
  if (ds.parent[value] !== value) ds.parent[value] = findRoot(ds, ds.parent[value])
  return ds.parent[value]
}

function union(ds: DisjointSet, a: number, b: number) {
  const rootA = findRoot(ds, a)
  const rootB = findRoot(ds, b)
  if (rootA === rootB) return

  if (ds.rank[rootA] < ds.rank[rootB]) {
    ds.parent[rootA] = rootB
    return
  }

  if (ds.rank[rootA] > ds.rank[rootB]) {
    ds.parent[rootB] = rootA
    return
  }

  ds.parent[rootB] = rootA
  ds.rank[rootA] += 1
}

function getComponentResistance(node: CircuitNode): number {
  if (node.type === 'switch') {
    return (node.isClosed ?? templateMap.switch.defaults.isClosed)
      ? node.resistance ?? templateMap.switch.defaults.resistance ?? 0.05
      : Number.POSITIVE_INFINITY
  }
  if (node.type === 'resistor') return node.resistance ?? templateMap.resistor.defaults.resistance ?? 220
  if (node.type === 'capacitor') return node.resistance ?? templateMap.capacitor.defaults.resistance ?? 0.2
  if (node.type === 'transistor') return node.resistance ?? templateMap.transistor.defaults.resistance ?? 8
  if (node.type === 'led') {
    const vf = node.forwardVoltage ?? templateMap.led.defaults.forwardVoltage ?? 2
    return Math.max(1, vf / 0.02)
  }
  return Number.POSITIVE_INFINITY
}

function solveLinearSystem(matrix: number[][], vector: number[]): number[] | null {
  const n = vector.length
  const a = matrix.map((row) => [...row])
  const b = [...vector]

  for (let col = 0; col < n; col += 1) {
    let pivot = col
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row
    }

    if (Math.abs(a[pivot][col]) < 1e-12) return null

    if (pivot !== col) {
      ;[a[pivot], a[col]] = [a[col], a[pivot]]
      ;[b[pivot], b[col]] = [b[col], b[pivot]]
    }

    const pivotVal = a[col][col]
    for (let c = col; c < n; c += 1) a[col][c] /= pivotVal
    b[col] /= pivotVal

    for (let row = 0; row < n; row += 1) {
      if (row === col) continue
      const factor = a[row][col]
      if (Math.abs(factor) < 1e-12) continue
      for (let c = col; c < n; c += 1) a[row][c] -= factor * a[col][c]
      b[row] -= factor * b[col]
    }
  }

  return b
}

function findFirstCycle(edges: Array<{ a: number; b: number; id: string }>, netCount: number) {
  const adjacency = new Map<number, Array<{ net: number; id: string }>>()
  for (let net = 0; net < netCount; net += 1) adjacency.set(net, [])

  for (const edge of edges) {
    adjacency.get(edge.a)?.push({ net: edge.b, id: edge.id })
    adjacency.get(edge.b)?.push({ net: edge.a, id: edge.id })
  }

  for (const entries of adjacency.values()) {
    entries.sort((left, right) => left.id.localeCompare(right.id) || left.net - right.net)
  }

  const visited = new Set<number>()
  const inStack = new Set<number>()
  const parentNet = new Map<number, number>()

  const dfs = (current: number): number[] | null => {
    visited.add(current)
    inStack.add(current)

    for (const entry of adjacency.get(current) ?? []) {
      const next = entry.net
      if (!visited.has(next)) {
        parentNet.set(next, current)
        const cycle = dfs(next)
        if (cycle) return cycle
        continue
      }

      if (inStack.has(next) && parentNet.get(current) !== next) {
        const chain = [next, current]
        let walker = parentNet.get(current)
        while (walker !== undefined && walker !== next) {
          chain.push(walker)
          walker = parentNet.get(walker)
        }
        chain.reverse()
        chain.push(next)
        return chain
      }
    }

    inStack.delete(current)
    return null
  }

  for (let net = 0; net < netCount; net += 1) {
    if (visited.has(net)) continue
    const cycle = dfs(net)
    if (cycle) return cycle
  }

  return null
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

  const endpointIndex = new Map<string, number>()
  const endpointByIndex: string[] = []
  const componentEndpoints = new Map<string, { left: number; right: number }>()

  for (const node of nodes) {
    const ports = templateMap[node.type].ports
    const leftKey = `${node.id}:${ports[0].id}`
    const rightKey = `${node.id}:${ports[1].id}`

    endpointIndex.set(leftKey, endpointByIndex.length)
    endpointByIndex.push(leftKey)
    endpointIndex.set(rightKey, endpointByIndex.length)
    endpointByIndex.push(rightKey)

    componentEndpoints.set(node.id, {
      left: endpointIndex.get(leftKey) ?? 0,
      right: endpointIndex.get(rightKey) ?? 0,
    })
  }

  const ds = createDisjointSet(endpointByIndex.length)
  for (const wire of wires) {
    const a = endpointIndex.get(`${wire.from.nodeId}:${wire.from.portId}`)
    const b = endpointIndex.get(`${wire.to.nodeId}:${wire.to.portId}`)
    if (a === undefined || b === undefined) continue
    union(ds, a, b)
  }

  const netByRoot = new Map<number, number>()
  const endpointToNet: number[] = []
  for (let index = 0; index < endpointByIndex.length; index += 1) {
    const root = findRoot(ds, index)
    if (!netByRoot.has(root)) netByRoot.set(root, netByRoot.size)
    endpointToNet[index] = netByRoot.get(root) ?? 0
  }

  const netCount = netByRoot.size
  const resistiveBranches: ResistiveBranch[] = []
  const voltageBranches: VoltageSourceBranch[] = []
  const openSwitches: CircuitNode[] = []

  for (const node of nodes) {
    const endpoints = componentEndpoints.get(node.id)
    if (!endpoints) continue
    const fromNet = endpointToNet[endpoints.left]
    const toNet = endpointToNet[endpoints.right]

    if (node.type === 'battery') {
      voltageBranches.push({
        id: node.id,
        node,
        fromNet,
        toNet,
        voltage: node.voltage ?? templateMap.battery.defaults.voltage ?? 9,
      })
      continue
    }

    if (node.type === 'switch' && !(node.isClosed ?? templateMap.switch.defaults.isClosed)) {
      openSwitches.push(node)
      continue
    }

    const resistance = getComponentResistance(node)
    if (!Number.isFinite(resistance) || resistance <= 0) continue

    resistiveBranches.push({
      id: node.id,
      node,
      fromNet,
      toNet,
      resistance,
    })
  }

  if (openSwitches.length > 0) {
    steps.push(
      circuitTraceStep.failure(
        'Open switch detected',
        `The following switches break continuity: ${openSwitches.map((node) => node.label).join(', ')}.`,
        { openSwitches: openSwitches.map((node) => node.id) },
      ),
    )
    return emptyResult(['At least one switch is open, so the path is interrupted.'])
  }

  if (voltageBranches.length === 0) {
    steps.push(circuitTraceStep.failure('No supply source', 'Add at least one battery to provide excitation.'))
    return emptyResult(['No battery detected.'])
  }

  const conductiveEdges = [
    ...resistiveBranches.map((branch) => ({ a: branch.fromNet, b: branch.toNet, id: `r-${branch.id}` })),
    ...voltageBranches.map((branch) => ({ a: branch.fromNet, b: branch.toNet, id: `v-${branch.id}` })),
  ]

  const degreeByNet = Array.from({ length: netCount }, () => 0)
  for (const edge of conductiveEdges) {
    if (edge.a === edge.b) continue
    degreeByNet[edge.a] += 1
    degreeByNet[edge.b] += 1
  }

  const hasBranch = degreeByNet.some((degree) => degree > 2)
  const cycle = findFirstCycle(conductiveEdges, netCount)
  const isClosedLoop = Boolean(cycle)

  const adjacencyByNet = new Map<number, number[]>()
  for (let net = 0; net < netCount; net += 1) adjacencyByNet.set(net, [])
  for (const edge of conductiveEdges) {
    adjacencyByNet.get(edge.a)?.push(edge.b)
    adjacencyByNet.get(edge.b)?.push(edge.a)
  }

  const batteryNet = voltageBranches[0]?.fromNet ?? 0
  const reachable = new Set<number>([batteryNet])
  const queue = [batteryNet]
  while (queue.length > 0) {
    const current = queue.shift() ?? 0
    const neighbors = [...(adjacencyByNet.get(current) ?? [])].sort((a, b) => a - b)
    for (const neighbor of neighbors) {
      if (reachable.has(neighbor)) continue
      reachable.add(neighbor)
      queue.push(neighbor)
    }
  }

  const disconnectedNets = Array.from({ length: netCount }, (_, index) => index).filter((net) => !reachable.has(net))
  if (disconnectedNets.length > 0) {
    steps.push(
      circuitTraceStep.failure(
        'Disconnected network detected',
        `Some electrical nets are unreachable from the primary source: ${disconnectedNets.join(', ')}.`,
        { disconnectedNets },
      ),
    )
    return emptyResult(['One or more electrical nets are disconnected from the source.'])
  }

  steps.push(
    circuitTraceStep.topology(
      'Graph topology analyzed',
      'Used graph connectivity with deterministic neighbor ordering to detect cycles and branches.',
      isClosedLoop ? 'success' : 'warning',
      { degreeByNet, hasBranch, cycle },
    ),
  )

  if (!isClosedLoop) {
    return emptyResult(['No closed conductive cycle detected, current = 0 A.'])
  }

  const referenceNet = voltageBranches[0]?.toNet ?? 0
  const unknownNets = Array.from({ length: netCount }, (_, index) => index).filter((net) => net !== referenceNet)
  const netToVarIndex = new Map<number, number>()
  unknownNets.forEach((net, index) => netToVarIndex.set(net, index))

  const voltageSourceCount = voltageBranches.length
  const matrixSize = unknownNets.length + voltageSourceCount
  const matrix = Array.from({ length: matrixSize }, () => Array.from({ length: matrixSize }, () => 0))
  const vector = Array.from({ length: matrixSize }, () => 0)

  const stampConductance = (a: number, b: number, conductance: number) => {
    const ia = netToVarIndex.get(a)
    const ib = netToVarIndex.get(b)

    if (ia !== undefined) matrix[ia][ia] += conductance
    if (ib !== undefined) matrix[ib][ib] += conductance
    if (ia !== undefined && ib !== undefined) {
      matrix[ia][ib] -= conductance
      matrix[ib][ia] -= conductance
    }
  }

  for (const branch of resistiveBranches) {
    const conductance = 1 / branch.resistance
    stampConductance(branch.fromNet, branch.toNet, conductance)
  }

  voltageBranches.forEach((source, sourceIndex) => {
    const row = unknownNets.length + sourceIndex
    const fromIndex = netToVarIndex.get(source.fromNet)
    const toIndex = netToVarIndex.get(source.toNet)

    if (fromIndex !== undefined) {
      matrix[fromIndex][row] += 1
      matrix[row][fromIndex] += 1
    }
    if (toIndex !== undefined) {
      matrix[toIndex][row] -= 1
      matrix[row][toIndex] -= 1
    }

    vector[row] = source.voltage
  })

  const solved = solveLinearSystem(matrix, vector)
  if (!solved) {
    steps.push(circuitTraceStep.failure('Solver failed', 'MNA matrix became singular for the current configuration.'))
    return emptyResult(['Could not solve the nodal equations for this topology.'])
  }

  const netVoltageMap = new Map<number, number>()
  netVoltageMap.set(referenceNet, 0)
  unknownNets.forEach((net, index) => netVoltageMap.set(net, solved[index] ?? 0))

  const sourceCurrents = solved.slice(unknownNets.length)
  const primaryCurrent = Math.abs(sourceCurrents[0] ?? 0)

  const voltageDrops = Object.fromEntries(
    nodes.map((node) => {
      const endpoints = componentEndpoints.get(node.id)
      if (!endpoints) return [node.id, 0]

      const leftNet = endpointToNet[endpoints.left]
      const rightNet = endpointToNet[endpoints.right]
      const leftV = netVoltageMap.get(leftNet) ?? 0
      const rightV = netVoltageMap.get(rightNet) ?? 0

      return [node.id, Math.abs(leftV - rightV)]
    }),
  )

  const powerWatts = Object.fromEntries(
    nodes.map((node) => {
      const drop = voltageDrops[node.id] ?? 0
      if (node.type === 'battery') {
        const sourceIndex = voltageBranches.findIndex((source) => source.id === node.id)
        const sourceCurrent = sourceIndex >= 0 ? Math.abs(sourceCurrents[sourceIndex] ?? 0) : primaryCurrent
        return [node.id, -drop * sourceCurrent]
      }

      const branch = resistiveBranches.find((candidate) => candidate.id === node.id)
      if (!branch) return [node.id, 0]

      const current = drop / branch.resistance
      return [node.id, drop * current]
    }),
  )

  const totalResistanceOhms = primaryCurrent > 1e-9 ? Math.abs((voltageBranches[0]?.voltage ?? 0) / primaryCurrent) : Number.POSITIVE_INFINITY
  const supplyVoltage = voltageBranches.reduce((sum, source) => sum + Math.abs(source.voltage), 0)
  const netVoltage = supplyVoltage

  const capacitors = nodes.filter((node) => node.type === 'capacitor')
  const totalCapacitanceMicro = capacitors.reduce((sum, capacitor) => sum + (capacitor.capacitance ?? templateMap.capacitor.defaults.capacitance ?? 220), 0)
  const capacitorChargeSeconds = Number.isFinite(totalResistanceOhms) && totalCapacitanceMicro > 0
    ? 5 * totalResistanceOhms * (totalCapacitanceMicro / 1_000_000)
    : null

  const warnings: string[] = [
    'Assumes lumped linear components and ideal wires.',
    'Transient capacitor behavior is approximated by a first-order RC estimate.',
    'Active-device behavior (LED/transistor) is linearized for this solver.',
  ]
  if (primaryCurrent > 0.08) warnings.push('Current exceeds 80 mA; use a larger resistor or lower supply voltage.')
  if (hasBranch) warnings.push('Branching topology detected; MNA-lite solved DC operating point without full nonlinear device models.')

  steps.push(
    circuitTraceStep.rule(
      'MNA-lite DC solver selected',
      'Solved arbitrary conductive topology using modified nodal analysis with deterministic graph ordering.',
      {
        netCount,
        resistiveBranchCount: resistiveBranches.length,
        voltageSourceCount,
        hasBranch,
      },
    ),
  )
  steps.push(
    circuitTraceStep.computation(
      'Computed operating point',
      `Primary source current solved at ${primaryCurrent.toFixed(4)} A with estimated equivalent resistance ${Number.isFinite(totalResistanceOhms) ? totalResistanceOhms.toFixed(2) : '∞'} Ω.`,
      'success',
      {
        sourceCurrents,
        netVoltages: Object.fromEntries(netVoltageMap.entries()),
        voltageDrops,
        powerWatts,
      },
    ),
  )

  const path = cycle ? cycle.map((net) => `net-${net}`) : []

  return {
    isClosedLoop,
    isSeries: !hasBranch,
    currentAmps: primaryCurrent,
    totalResistanceOhms,
    supplyVoltage,
    ledOn: nodes.some((node) => node.type === 'led') && primaryCurrent > 0.002,
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
