import { useEffect, useMemo, useState } from 'react'
import { useCircuitLabStore } from '../../state/useCircuitLabStore'
import { CircuitCanvas } from './features/circuit/CircuitCanvas'
import { circuitTemplates, getPortPosition, getNodeValueLabel, templateMap, COMPONENT_DIMS, DEFAULT_DIMS } from './features/circuit/catalog'
import { simulateCircuit } from './features/circuit/simulate'
import type {
  CircuitComponentType,
  CircuitLayer,
  CircuitNode,
  CircuitWire,
  SimulationResult,
} from './features/circuit/types'

// ─── Default layers ──────────────────────────────────────────────────────────
const DEFAULT_LAYERS: CircuitLayer[] = [
  { id: 1, name: 'Signal', visible: true, color: '#38bdf8' },
  { id: 2, name: 'Power', visible: true, color: '#f87171' },
  { id: 3, name: 'Ground', visible: true, color: '#64748b' },
]

const INITIAL_TYPES: CircuitComponentType[] = ['battery', 'switch', 'resistor', 'led', 'motor', 'propeller']


const CIRCUIT_SNAPSHOT_KEY = 'aos-circuit-snapshot-v1'

type CircuitSnapshot = {
  circuitName: string
  nodes: CircuitNode[]
  wires: CircuitWire[]
  layers: CircuitLayer[]
}

function loadSnapshot(): CircuitSnapshot | null {
  try {
    const raw = localStorage.getItem(CIRCUIT_SNAPSHOT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CircuitSnapshot
  } catch {
    return null
  }
}

function createNode(type: CircuitComponentType, index: number, layer = 1): CircuitNode {
  const template = templateMap[type]
  const dims = COMPONENT_DIMS[type] ?? DEFAULT_DIMS
  const colSpacing = dims.width + 40
  const rowSpacing = dims.height + 50
  return {
    id: crypto.randomUUID(),
    type,
    label: `${template.label} ${index + 1}`,
    layer,
    position: { x: 60 + (index % 4) * colSpacing, y: 60 + Math.floor(index / 4) * rowSpacing },
    voltage: template.defaults.voltage,
    resistance: template.defaults.resistance,
    forwardVoltage: template.defaults.forwardVoltage,
    capacitance: template.defaults.capacitance,
    chargePercent: template.defaults.chargePercent,
    gain: template.defaults.gain,
    collectorEmitterDrop: template.defaults.collectorEmitterDrop,
    isClosed: template.defaults.isClosed,
    inductance: template.defaults.inductance,
    potentiometerWiper: template.defaults.potentiometerWiper,
  }
}

// ─── Compact inline inspector ────────────────────────────────────────────────
function InlineField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
      <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', flex: 1 }}>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)))
        }}
        style={{
          width: 72,
          fontSize: 11,
          background: 'rgba(255,255,255,.05)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 4,
          color: '#e2e8f0',
          padding: '2px 5px',
          textAlign: 'right',
          outline: 'none',
        }}
      />
    </div>
  )
}

interface InspectorProps {
  node: CircuitNode
  simulation: SimulationResult | null
  layers: CircuitLayer[]
  onUpdateNode: (id: string, patch: Partial<CircuitNode>) => void
  onRemoveNode: (id: string) => void
  onDeselect: () => void
}

function CompactInspector({ node, simulation, layers, onUpdateNode, onRemoveNode, onDeselect }: InspectorProps) {
  const template = templateMap[node.type]
  return (
    <div>
      {/* Type + editable name */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid rgba(255,255,255,.05)',
        }}
      >
        <div
          style={{
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            color: template.color,
            marginBottom: 3,
          }}
        >
          {node.type}
        </div>
        <input
          value={node.label}
          onChange={(e) => onUpdateNode(node.id, { label: e.target.value })}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#e2e8f0',
            background: 'none',
            border: 'none',
            outline: 'none',
            width: '100%',
            padding: 0,
          }}
        />
        <div style={{ fontSize: 10, color: '#334155', marginTop: 2 }}>{getNodeValueLabel(node)}</div>
      </div>

      {/* Properties */}
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {/* Layer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>Layer</span>
          <select
            value={node.layer}
            onChange={(e) => onUpdateNode(node.id, { layer: Number(e.target.value) })}
            style={{
              fontSize: 11,
              background: 'rgba(255,255,255,.05)',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 4,
              color: '#94a3b8',
              padding: '2px 6px',
              outline: 'none',
            }}
          >
            {layers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Component-specific fields */}
        {node.type === 'battery' && (
          <InlineField
            label="Voltage (V)"
            value={node.voltage ?? 9}
            min={1}
            max={48}
            step={0.5}
            onChange={(v) => onUpdateNode(node.id, { voltage: v })}
          />
        )}
        {node.type === 'resistor' && (
          <InlineField
            label="Resistance (Ω)"
            value={node.resistance ?? 220}
            min={1}
            max={1000000}
            step={1}
            onChange={(v) => onUpdateNode(node.id, { resistance: v })}
          />
        )}
        {(node.type === 'led' || node.type === 'diode') && (
          <InlineField
            label="Fwd voltage (V)"
            value={node.forwardVoltage ?? (node.type === 'diode' ? 0.7 : 2)}
            min={0.1}
            max={5}
            step={0.05}
            onChange={(v) => onUpdateNode(node.id, { forwardVoltage: v })}
          />
        )}
        {node.type === 'switch' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>State</span>
            <button
              type="button"
              onClick={() => onUpdateNode(node.id, { isClosed: !node.isClosed })}
              style={{
                fontSize: 11,
                padding: '2px 10px',
                borderRadius: 4,
                background: node.isClosed ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.12)',
                color: node.isClosed ? '#22c55e' : '#f87171',
                border: `1px solid ${node.isClosed ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.25)'}`,
                cursor: 'pointer',
              }}
            >
              {node.isClosed ? 'Closed' : 'Open'}
            </button>
          </div>
        )}
        {node.type === 'capacitor' && (
          <>
            <InlineField
              label="Capacitance (µF)"
              value={node.capacitance ?? 220}
              min={1}
              max={100000}
              step={1}
              onChange={(v) => onUpdateNode(node.id, { capacitance: v })}
            />
            <InlineField
              label="ESR (Ω)"
              value={node.resistance ?? 0.2}
              min={0.01}
              max={50}
              step={0.01}
              onChange={(v) => onUpdateNode(node.id, { resistance: v })}
            />
          </>
        )}
        {node.type === 'inductor' && (
          <>
            <InlineField
              label="Inductance (mH)"
              value={node.inductance ?? 10}
              min={0.01}
              max={10000}
              step={0.1}
              onChange={(v) => onUpdateNode(node.id, { inductance: v })}
            />
            <InlineField
              label="DCR (Ω)"
              value={node.resistance ?? 0.5}
              min={0.01}
              max={100}
              step={0.01}
              onChange={(v) => onUpdateNode(node.id, { resistance: v })}
            />
          </>
        )}
        {node.type === 'transistor' && (
          <>
            <InlineField
              label="Gain (β)"
              value={node.gain ?? 120}
              min={10}
              max={400}
              step={1}
              onChange={(v) => onUpdateNode(node.id, { gain: v })}
            />
            <InlineField
              label="Vce sat (V)"
              value={node.collectorEmitterDrop ?? 0.2}
              min={0.05}
              max={2}
              step={0.01}
              onChange={(v) => onUpdateNode(node.id, { collectorEmitterDrop: v })}
            />
          </>
        )}
        {node.type === 'potentiometer' && (
          <>
            <InlineField
              label="Total R (Ω)"
              value={node.resistance ?? 10000}
              min={100}
              max={1000000}
              step={100}
              onChange={(v) => onUpdateNode(node.id, { resistance: v })}
            />
            <InlineField
              label="Wiper (%)"
              value={node.potentiometerWiper ?? 50}
              min={0}
              max={100}
              step={1}
              onChange={(v) => onUpdateNode(node.id, { potentiometerWiper: v })}
            />
          </>
        )}

        {/* Simulation metrics */}
        {simulation && (
          <div
            style={{
              marginTop: 2,
              padding: '6px 8px',
              background: 'rgba(255,255,255,.03)',
              borderRadius: 5,
              fontSize: 11,
            }}
          >
            <div style={{ color: '#334155', fontWeight: 500, marginBottom: 4, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Simulation
            </div>
            <div style={{ color: '#475569' }}>Drop: {(simulation.voltageDrops[node.id] ?? 0).toFixed(3)} V</div>
            <div style={{ color: '#475569' }}>Power: {(simulation.powerWatts[node.id] ?? 0).toFixed(5)} W</div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 5, paddingTop: 2 }}>
          <button
            type="button"
            onClick={onDeselect}
            style={{
              flex: 1,
              fontSize: 11,
              padding: '4px 0',
              borderRadius: 4,
              background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.07)',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            Deselect
          </button>
          <button
            type="button"
            onClick={() => onRemoveNode(node.id)}
            style={{
              flex: 1,
              fontSize: 11,
              padding: '4px 0',
              borderRadius: 4,
              background: 'rgba(239,68,68,.08)',
              border: '1px solid rgba(239,68,68,.18)',
              color: '#f87171',
              cursor: 'pointer',
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main app ─────────────────────────────────────────────────────────────────
export function CircuitApp() {
  const snapshot = loadSnapshot()
  const [nodes, setNodes] = useState<CircuitNode[]>(() => snapshot?.nodes ?? INITIAL_TYPES.map((t, i) => createNode(t, i)))
  const [wires, setWires] = useState<CircuitWire[]>(() => snapshot?.wires ?? [])
  const [layers, setLayers] = useState<CircuitLayer[]>(() => snapshot?.layers ?? DEFAULT_LAYERS)
  const [activeLayer, setActiveLayer] = useState(1)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedPort, setSelectedPort] = useState<{ nodeId: string; portId: string } | null>(null)
  const [previewWire, setPreviewWire] = useState<{
    from: { nodeId: string; portId: string }
    x: number
    y: number
  } | null>(null)
  const [simulation, setSimulation] = useState<SimulationResult | null>(null)
  const [showTrace, setShowTrace] = useState(false)
  const [componentSearch, setComponentSearch] = useState('')
  const [circuitName, setCircuitName] = useState(snapshot?.circuitName ?? 'untitled.ckt')
  const [isRenamingCircuit, setIsRenamingCircuit] = useState(false)
  const [labMode, setLabMode] = useState<'blueprint' | 'build'>('blueprint')
  const [popupLog, setPopupLog] = useState<string | null>(null)

  const inventory = useCircuitLabStore((s) => s.inventory)
  const consumeInventory = useCircuitLabStore((s) => s.consumeInventory)
  const addExportedSystem = useCircuitLabStore((s) => s.addExportedSystem)

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) ?? null, [nodes, selectedNodeId])
  const filteredTemplates = useMemo(() => {
    const term = componentSearch.trim().toLowerCase()
    if (!term) return circuitTemplates
    return circuitTemplates.filter((tmpl) => tmpl.label.toLowerCase().includes(term) || tmpl.description.toLowerCase().includes(term) || tmpl.type.includes(term))
  }, [componentSearch])

  const addComponent = (type: CircuitComponentType) => {
    setNodes((current) => [...current, createNode(type, current.length, activeLayer)])
    setSimulation(null)
  }

  const moveNode = (nodeId: string, position: { x: number; y: number }) => {
    setNodes((current) => current.map((n) => (n.id === nodeId ? { ...n, position } : n)))
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
      (w) =>
        (w.from.nodeId === source.nodeId && w.from.portId === source.portId && w.to.nodeId === targetNodeId && w.to.portId === targetPortId) ||
        (w.to.nodeId === source.nodeId && w.to.portId === source.portId && w.from.nodeId === targetNodeId && w.from.portId === targetPortId),
    )
    if (!duplicate && source.nodeId !== targetNodeId) {
      setWires((current) => [
        ...current,
        { id: crypto.randomUUID(), from: source, to: { nodeId: targetNodeId, portId: targetPortId } },
      ])
    }
    setPreviewWire(null)
    setSelectedPort(null)
    setSimulation(null)
  }

  const runSimulation = () => setSimulation(simulateCircuit(nodes, wires))

  const reset = () => {
    setNodes(INITIAL_TYPES.map((t, i) => createNode(t, i)))
    setWires([])
    setSelectedNodeId(null)
    setSelectedPort(null)
    setPreviewWire(null)
    setSimulation(null)
  }

  const updateNode = (nodeId: string, patch: Partial<CircuitNode>) => {
    setNodes((current) => current.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)))
    setSimulation(null)
  }

  const removeNode = (nodeId: string) => {
    setNodes((current) => current.filter((n) => n.id !== nodeId))
    setWires((current) => current.filter((w) => w.from.nodeId !== nodeId && w.to.nodeId !== nodeId))
    setSelectedNodeId((current) => (current === nodeId ? null : current))
    setSimulation(null)
  }

  const toggleLayer = (layerId: number) => {
    setLayers((current) => current.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)))
  }

  const addLayer = () => {
    const newId = Math.max(...layers.map((l) => l.id)) + 1
    const colors = ['#f59e0b', '#84cc16', '#ec4899', '#8b5cf6', '#14b8a6']
    setLayers((current) => [
      ...current,
      { id: newId, name: `Layer ${newId}`, visible: true, color: colors[(newId - 1) % colors.length] },
    ])
  }



  useEffect(() => {
    localStorage.setItem(
      CIRCUIT_SNAPSHOT_KEY,
      JSON.stringify({ circuitName, nodes, wires, layers } satisfies CircuitSnapshot),
    )
  }, [circuitName, layers, nodes, wires])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#060c18',
        color: '#e2e8f0',
        overflow: 'hidden',
        fontFamily: 'inherit',
        fontSize: 13,
      }}
    >
      {/* ── Title bar ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px',
          height: 38,
          borderBottom: '1px solid rgba(255,255,255,.07)',
          flexShrink: 0,
          background: 'rgba(4,8,18,.98)',
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 5, marginRight: 4 }}>
          {(['#ff5f56', '#ffbd2e', '#27c93f'] as const).map((c) => (
            <span
              key={c}
              style={{ width: 9, height: 9, borderRadius: '50%', background: c, display: 'inline-block' }}
            />
          ))}
        </div>

        <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Circuit Studio</span>
        <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,.08)' }} />
        {isRenamingCircuit ? (
          <input
            value={circuitName}
            onChange={(e) => setCircuitName(e.target.value)}
            onBlur={() => setIsRenamingCircuit(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') setIsRenamingCircuit(false) }}
            autoFocus
            style={{ fontSize: 11, color: '#64748b', background: 'transparent', border: '1px solid rgba(255,255,255,.12)', borderRadius: 4, padding: '1px 6px' }}
          />
        ) : (
          <span style={{ fontSize: 11, color: '#334155', cursor: 'text' }} onDoubleClick={() => setIsRenamingCircuit(true)}>{circuitName}</span>
        )}

        <div style={{ flex: 1 }} />

        {/* Sim stats */}
        {simulation && (
          <div style={{ display: 'flex', gap: 12, fontSize: 11, marginRight: 8 }}>
            <span style={{ color: simulation.isClosedLoop ? '#22c55e' : '#ef4444' }}>
              {simulation.isClosedLoop ? '⬤' : '○'} {simulation.isClosedLoop ? 'Closed' : 'Open'}
            </span>
            <span style={{ color: '#64748b' }}>{simulation.currentAmps.toFixed(4)} A</span>
            {simulation.ledOn && <span style={{ color: '#22c55e' }}>LED on</span>}
            {simulation.warnings.length > 0 && (
              <span style={{ color: '#f59e0b' }}>⚠ {simulation.warnings.length}</span>
            )}
          </div>
        )}

        <button
          onClick={() => setLabMode((current) => (current === 'blueprint' ? 'build' : 'blueprint'))}
          style={{
            fontSize: 11,
            padding: '3px 8px',
            borderRadius: 5,
            background: labMode === 'build' ? 'rgba(34,197,94,.14)' : 'rgba(148,163,184,.08)',
            color: labMode === 'build' ? '#86efac' : '#94a3b8',
            border: '1px solid rgba(255,255,255,.07)',
            cursor: 'pointer',
          }}
        >
          {labMode === 'build' ? 'Build Side' : 'Blueprint Side'}
        </button>
        <button
          onClick={() => {
            const stockSkus = Object.keys(inventory)
            if (stockSkus.length === 0) {
              setPopupLog('Build failed: no materials available. Buy parts from CIRCUTE first.')
              return
            }
            const requirements = stockSkus.slice(0, Math.min(6, nodes.length)).map((sku) => ({ sku, quantity: 1 }))
            const consume = consumeInventory(requirements)
            if (!consume.ok) {
              setPopupLog(`Build failed: missing materials for ${consume.missing.length} components.`)
              return
            }
            setPopupLog('Build completed. Welding, soldering, and assembly steps succeeded.')
          }}
          style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, background: 'rgba(251,191,36,.12)', color: '#fcd34d', border: '1px solid rgba(251,191,36,.25)', cursor: 'pointer' }}
        >
          Build
        </button>
        <button
          onClick={() => {
            const lowerName = circuitName.toLowerCase()
            const kind = lowerName.includes('drone') || nodes.some((n) => n.type === 'propeller') ? 'drone' : lowerName.includes('generator') ? 'generator' : 'machine'
            addExportedSystem({ name: circuitName.replace('.ckt', ''), kind })
            setPopupLog(`${circuitName} exported to aOS desktop rewards.`)
          }}
          style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, background: 'rgba(168,85,247,.13)', color: '#d8b4fe', border: '1px solid rgba(168,85,247,.3)', cursor: 'pointer' }}
        >
          Export
        </button>

        <button
          onClick={() => setShowTrace((v) => !v)}
          style={{
            fontSize: 11,
            padding: '3px 8px',
            borderRadius: 5,
            background: showTrace ? 'rgba(125,211,252,.1)' : 'transparent',
            color: showTrace ? '#7dd3fc' : '#475569',
            border: '1px solid rgba(255,255,255,.07)',
            cursor: 'pointer',
          }}
        >
          Trace
        </button>
        <button
          onClick={runSimulation}
          style={{
            fontSize: 11,
            padding: '3px 10px',
            borderRadius: 5,
            background: 'rgba(56,189,248,.14)',
            color: '#7dd3fc',
            border: '1px solid rgba(56,189,248,.28)',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          ▶ Run
        </button>
        <button
          onClick={reset}
          style={{
            fontSize: 11,
            padding: '3px 8px',
            borderRadius: 5,
            background: 'transparent',
            color: '#475569',
            border: '1px solid rgba(255,255,255,.07)',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>

      {/* ── IDE body ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Left sidebar: Components + Layers */}
        <div
          style={{
            width: 188,
            flexShrink: 0,
            borderRight: '1px solid rgba(255,255,255,.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'rgba(4,8,18,.6)',
          }}
        >
          {/* Components section */}
          <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,.05)' }}>
            <div
              style={{
                padding: '7px 12px 5px',
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#334155',
              }}
            >
              Components
            </div>
            <div style={{ padding: '0 10px 6px' }}><input value={componentSearch} onChange={(e)=>setComponentSearch(e.target.value)} placeholder="Search components" style={{ width:'100%', fontSize:11, borderRadius:6, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.03)', color:'#94a3b8', padding:'5px 7px' }} /></div>
            {filteredTemplates.map((tmpl) => (
              <button
                key={tmpl.type}
                type="button"
                onClick={() => addComponent(tmpl.type)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '5px 12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.04)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: tmpl.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{tmpl.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#1e293b' }}>+</span>
              </button>
            ))}
          </div>

          {/* Layers section */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <div
              style={{
                padding: '7px 12px 5px',
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Layers</span>
              <button
                type="button"
                onClick={addLayer}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#334155',
                  cursor: 'pointer',
                  fontSize: 14,
                  lineHeight: 1,
                  padding: '0 2px',
                }}
                title="Add layer"
              >
                +
              </button>
            </div>

            {layers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => setActiveLayer(layer.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '5px 12px',
                  cursor: 'pointer',
                  background: activeLayer === layer.id ? 'rgba(56,189,248,.07)' : 'none',
                  borderLeft: `2px solid ${activeLayer === layer.id ? 'rgba(56,189,248,.4)' : 'transparent'}`,
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLayer(layer.id)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: layer.visible ? '#475569' : '#1e293b',
                    fontSize: 10,
                    lineHeight: 1,
                  }}
                  title={layer.visible ? 'Hide' : 'Show'}
                >
                  {layer.visible ? '◉' : '○'}
                </button>
                <span
                  style={{ width: 7, height: 7, borderRadius: '50%', background: layer.color, flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: 12,
                    color: activeLayer === layer.id ? '#e2e8f0' : '#475569',
                    flex: 1,
                  }}
                >
                  {layer.name}
                </span>
                <span style={{ fontSize: 10, color: '#1e293b' }}>
                  {nodes.filter((n) => n.layer === layer.id).length}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Canvas */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minWidth: 0 }}>
          <CircuitCanvas
            nodes={nodes}
            wires={wires}
            layers={layers}
            selectedNodeId={selectedNodeId}
            selectedPort={selectedPort}
            previewWire={previewWire}
            simulationActive={Boolean(simulation?.isClosedLoop)}
            ledOn={Boolean(simulation?.ledOn)}
            onMoveNode={moveNode}
            onSelectNode={setSelectedNodeId}
            onStartWireDrag={(nodeId, portId) => {
              const node = nodes.find((n) => n.id === nodeId)
              if (!node) return
              const pos = getPortPosition(node, portId)
              setSelectedPort({ nodeId, portId })
              setPreviewWire({ from: { nodeId, portId }, x: pos.x, y: pos.y })
            }}
            onUpdatePreviewWire={(point) =>
              setPreviewWire((current) => (current ? { ...current, ...point } : current))
            }
            onCompleteWire={completeWire}
            onCancelWireDrag={() => {
              setPreviewWire(null)
              setSelectedPort(null)
            }}
            onRemoveWire={(wireId) => {
              setWires((current) => current.filter((w) => w.id !== wireId))
              setSimulation(null)
            }}
          />
        </div>

        {/* Right: Inspector + Trace */}
        <div
          style={{
            width: 252,
            flexShrink: 0,
            borderLeft: '1px solid rgba(255,255,255,.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'rgba(4,8,18,.6)',
          }}
        >
          {/* Inspector */}
          <div
            style={{
              flex: showTrace ? '0 0 auto' : 1,
              overflow: 'auto',
              borderBottom: showTrace ? '1px solid rgba(255,255,255,.05)' : 'none',
            }}
          >
            <div
              style={{
                padding: '7px 12px 5px',
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#334155',
                borderBottom: '1px solid rgba(255,255,255,.05)',
              }}
            >
              Inspector
            </div>
            {labMode === 'build' && (
              <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,.06)', fontSize: 11, color: '#94a3b8' }}>
                Build actions: welding • soldering • dismantling • rebuilding.
                <div style={{ marginTop: 6, color: '#64748b' }}>Inventory materials: {Object.keys(inventory).length}</div>
              </div>
            )}
            {!selectedNode ? (
              <div style={{ padding: '12px', fontSize: 11, color: '#1e293b', lineHeight: 1.6 }}>
                Select a component on the canvas to edit properties.
              </div>
            ) : (
              <CompactInspector
                node={selectedNode}
                simulation={simulation}
                layers={layers}
                onUpdateNode={updateNode}
                onRemoveNode={removeNode}
                onDeselect={() => setSelectedNodeId(null)}
              />
            )}
          </div>

          {/* Execution trace (toggled via toolbar) */}
          {showTrace && (
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              <div
                style={{
                  padding: '7px 12px 5px',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#334155',
                  borderBottom: '1px solid rgba(255,255,255,.05)',
                  flexShrink: 0,
                }}
              >
                Execution Trace
              </div>
              {!simulation?.trace ? (
                <div style={{ padding: 12, fontSize: 11, color: '#1e293b' }}>
                  Run a simulation to inspect the trace.
                </div>
              ) : (
                simulation.trace.steps.map((step, i) => (
                  <div
                    key={step.id}
                    style={{
                      padding: '7px 12px',
                      borderBottom: '1px solid rgba(255,255,255,.03)',
                      fontSize: 11,
                    }}
                  >
                    <div
                      style={{
                        color:
                          step.level === 'success'
                            ? '#22c55e'
                            : step.level === 'error'
                              ? '#ef4444'
                              : step.level === 'warning'
                                ? '#f59e0b'
                                : '#7dd3fc',
                        fontSize: 9,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: 2,
                      }}
                    >
                      {i + 1} · {step.category} · {step.level}
                    </div>
                    <div style={{ color: '#94a3b8', fontWeight: 500, marginBottom: 1 }}>{step.title}</div>
                    <div style={{ color: '#334155', lineHeight: 1.4 }}>{step.detail}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      {popupLog && (
        <div style={{ position: 'absolute', right: 18, bottom: 18, background: 'rgba(15,23,42,.96)', border: '1px solid rgba(125,211,252,.25)', color: '#cbd5e1', borderRadius: 10, padding: '10px 12px', maxWidth: 340, fontSize: 11 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <strong style={{ color: '#7dd3fc' }}>Lab Log</strong>
            <button onClick={() => setPopupLog(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ marginTop: 6, color: '#94a3b8' }}>{popupLog}</div>
        </div>
      )}
    </div>
  )
}
