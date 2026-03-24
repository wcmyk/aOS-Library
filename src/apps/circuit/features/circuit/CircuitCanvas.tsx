import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { CircuitNode, CircuitWire, CircuitLayer } from './types'
import { getPortPosition, templateMap, COMPONENT_DIMS, DEFAULT_DIMS } from './catalog'
import { ComponentSVG } from './ComponentSVG'

interface PreviewWire {
  from: { nodeId: string; portId: string }
  x: number
  y: number
}

interface CircuitCanvasProps {
  nodes: CircuitNode[]
  wires: CircuitWire[]
  layers: CircuitLayer[]
  selectedNodeId: string | null
  selectedPort: { nodeId: string; portId: string } | null
  previewWire: PreviewWire | null
  simulationActive: boolean
  ledOn: boolean
  onMoveNode: (nodeId: string, position: { x: number; y: number }) => void
  onSelectNode: (nodeId: string) => void
  onStartWireDrag: (nodeId: string, portId: string) => void
  onUpdatePreviewWire: (point: { x: number; y: number }) => void
  onCompleteWire: (nodeId: string, portId: string) => void
  onCancelWireDrag: () => void
  onRemoveWire: (wireId: string) => void
}

function buildWirePath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const bend = Math.min(dist * 0.45, 80)

  // Use orthogonal-style routing for a cleaner look
  if (Math.abs(dx) > Math.abs(dy)) {
    // Mostly horizontal: curve horizontally
    return `M ${from.x} ${from.y} C ${from.x + bend} ${from.y}, ${to.x - bend} ${to.y}, ${to.x} ${to.y}`
  }
  // Mostly vertical: curve vertically
  return `M ${from.x} ${from.y} C ${from.x} ${from.y + bend}, ${to.x} ${to.y - bend}, ${to.x} ${to.y}`
}

function getWireColor(wire: CircuitWire, nodes: CircuitNode[], active: boolean) {
  const fromNode = nodes.find((n) => n.id === wire.from.nodeId)
  const toNode = nodes.find((n) => n.id === wire.to.nodeId)
  const ports = `${wire.from.portId}:${wire.to.portId}`
  if (ports.includes('positive') || ports.includes('anode')) return active ? '#dc2626' : '#f87171'
  if (ports.includes('negative') || ports.includes('cathode') || ports.includes('gnd')) return active ? '#374151' : '#64748b'
  if (fromNode?.type === 'transistor' || toNode?.type === 'transistor') return '#d946ef'
  if (fromNode?.type === 'capacitor' || toNode?.type === 'capacitor') return '#06b6d4'
  if (fromNode?.type === 'resistor' || toNode?.type === 'resistor') return '#a855f7'
  if (fromNode?.type === 'led' || toNode?.type === 'led') return active ? '#16a34a' : '#4ade80'
  if (fromNode?.type === 'inductor' || toNode?.type === 'inductor') return '#0ea5e9'
  if (fromNode?.type === 'ground' || toNode?.type === 'ground') return '#4b5563'
  if (fromNode?.type === 'potentiometer' && wire.from.portId === 'wiper') return '#f59e0b'
  if (toNode?.type === 'potentiometer' && wire.to.portId === 'wiper') return '#f59e0b'
  return active ? '#2563eb' : '#6b7280'
}

function getPortButtonStyle(side: string | undefined, width: number, height: number): CSSProperties {
  const half = 9 // half of 18px button
  if (side === 'right')  return { right: -half, top: height / 2 - half }
  if (side === 'top')    return { top: -half, left: width / 2 - half }
  if (side === 'bottom') return { bottom: -half, left: width / 2 - half }
  // default: left
  return { left: -half, top: height / 2 - half }
}

export function CircuitCanvas({
  nodes,
  wires,
  layers,
  selectedNodeId,
  selectedPort,
  previewWire,
  simulationActive,
  ledOn,
  onMoveNode,
  onSelectNode,
  onStartWireDrag,
  onUpdatePreviewWire,
  onCompleteWire,
  onCancelWireDrag,
  onRemoveWire,
}: CircuitCanvasProps) {
  const visibleLayerIds = new Set(layers.filter((l) => l.visible).map((l) => l.id))
  const visibleNodes = nodes.filter((n) => visibleLayerIds.has(n.layer))

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        overflow: 'hidden',
        background: '#0a0f1e',
        backgroundImage: [
          'radial-gradient(circle at 15% 15%, rgba(56,189,248,0.04) 0%, transparent 40%)',
          'radial-gradient(circle at 85% 80%, rgba(167,139,250,0.04) 0%, transparent 40%)',
          'linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: 'auto, auto, 24px 24px, 24px 24px',
      }}
      onPointerMove={(e) => {
        if (!previewWire) return
        const rect = e.currentTarget.getBoundingClientRect()
        onUpdatePreviewWire({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }}
      onPointerUp={() => {
        if (previewWire) onCancelWireDrag()
      }}
    >
      {/* ── Wire SVG layer ─────────────────────────────────────────────── */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        <defs>
          {/* Animated flow for active wires */}
          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.15)" />
          </marker>
        </defs>

        {/* Rendered wires */}
        {wires.map((wire) => {
          const fromNode = visibleNodes.find((n) => n.id === wire.from.nodeId)
          const toNode = visibleNodes.find((n) => n.id === wire.to.nodeId)
          if (!fromNode || !toNode) return null
          const from = getPortPosition(fromNode, wire.from.portId)
          const to = getPortPosition(toNode, wire.to.portId)
          const color = getWireColor(wire, visibleNodes, simulationActive)
          const d = buildWirePath(from, to)
          return (
            <g key={wire.id} style={{ pointerEvents: 'auto' }}>
              {/* Glow effect on active wires */}
              {simulationActive && (
                <path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={6}
                  opacity={0.18}
                  strokeLinecap="round"
                />
              )}
              {/* Main wire */}
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={simulationActive ? 2 : 1.5}
                strokeLinecap="round"
                strokeDasharray={simulationActive ? '10 6' : undefined}
              />
              {/* Wide invisible hit area for double-click removal */}
              <path
                d={d}
                fill="none"
                stroke="transparent"
                strokeWidth={18}
                style={{ cursor: 'pointer' }}
                onDoubleClick={() => onRemoveWire(wire.id)}
              />
            </g>
          )
        })}

        {/* Preview wire while dragging */}
        {previewWire &&
          (() => {
            const fromNode = visibleNodes.find((n) => n.id === previewWire.from.nodeId)
            if (!fromNode) return null
            const from = getPortPosition(fromNode, previewWire.from.portId)
            return (
              <>
                <path
                  d={buildWirePath(from, { x: previewWire.x, y: previewWire.y })}
                  fill="none"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth={6}
                  strokeLinecap="round"
                />
                <path
                  d={buildWirePath(from, { x: previewWire.x, y: previewWire.y })}
                  fill="none"
                  stroke="rgba(255,255,255,0.55)"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeDasharray="5 4"
                />
              </>
            )
          })()}
      </svg>

      {/* ── Component nodes ────────────────────────────────────────────── */}
      {visibleNodes.map((node) => {
        const template = templateMap[node.type]
        const dims = COMPONENT_DIMS[node.type] ?? DEFAULT_DIMS
        const { width, height } = dims
        const isSelected = selectedNodeId === node.id
        const layer = layers.find((l) => l.id === node.layer)
        const isLedOn = node.type === 'led' && ledOn && simulationActive

        return (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: node.position.x,
              top: node.position.y,
              width,
              height,
              userSelect: 'none',
              // Selection ring rendered as outline
              outline: isSelected ? '2px solid rgba(56,189,248,0.7)' : '2px solid transparent',
              outlineOffset: 4,
              borderRadius: 6,
              boxShadow: isLedOn
                ? '0 0 28px rgba(34,197,94,0.55)'
                : isSelected
                  ? '0 0 0 4px rgba(56,189,248,0.15), 0 8px 24px rgba(0,0,0,0.5)'
                  : '0 4px 16px rgba(0,0,0,0.4)',
              transition: 'outline 0.1s, box-shadow 0.15s',
            }}
            onPointerDown={(e: ReactPointerEvent<HTMLDivElement>) => {
              if ((e.target as HTMLElement).closest('button')) return
              e.preventDefault()
              onSelectNode(node.id)
              const startX = e.clientX
              const startY = e.clientY
              const origin = { ...node.position }
              const onMove = (mv: PointerEvent) => {
                onMoveNode(node.id, {
                  x: Math.max(0, origin.x + (mv.clientX - startX)),
                  y: Math.max(0, origin.y + (mv.clientY - startY)),
                })
              }
              const onUp = () => {
                window.removeEventListener('pointermove', onMove)
                window.removeEventListener('pointerup', onUp)
              }
              window.addEventListener('pointermove', onMove)
              window.addEventListener('pointerup', onUp)
            }}
          >
            {/* Layer color dot */}
            {layer && (
              <div
                style={{
                  position: 'absolute',
                  top: -8,
                  right: 0,
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: layer.color,
                  zIndex: 3,
                  opacity: 0.7,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* SVG component visual */}
            <div style={{ position: 'absolute', inset: 0, cursor: 'grab' }}>
              <ComponentSVG
                node={node}
                width={width}
                height={height}
                simulationActive={simulationActive}
                ledOn={ledOn}
              />
            </div>

            {/* Port connection buttons */}
            {template.ports.map((port) => {
              const isPortSelected = selectedPort?.nodeId === node.id && selectedPort.portId === port.id
              const btnStyle = getPortButtonStyle(port.side, width, height)
              return (
                <button
                  key={port.id}
                  type="button"
                  title={`${node.label} · ${port.label || port.id}`}
                  style={{
                    position: 'absolute',
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: `2px solid ${isPortSelected ? '#38bdf8' : 'rgba(255,255,255,0.45)'}`,
                    background: isPortSelected
                      ? 'rgba(56,189,248,0.35)'
                      : 'rgba(6,12,24,0.88)',
                    cursor: 'crosshair',
                    zIndex: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isPortSelected
                      ? '0 0 0 3px rgba(56,189,248,0.25), 0 2px 6px rgba(0,0,0,0.6)'
                      : '0 0 0 1px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.5)',
                    transition: 'border-color 0.1s, background 0.1s',
                    ...btnStyle,
                  }}
                  onMouseEnter={(e) => {
                    if (!isPortSelected) {
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.8)'
                      ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isPortSelected) {
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.45)'
                      ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(6,12,24,0.88)'
                    }
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    onSelectNode(node.id)
                    onStartWireDrag(node.id, port.id)
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation()
                    if (previewWire) onCompleteWire(node.id, port.id)
                  }}
                >
                  <span
                    style={{
                      fontSize: 6,
                      fontWeight: 700,
                      color: isPortSelected ? '#38bdf8' : '#64748b',
                      pointerEvents: 'none',
                      lineHeight: 1,
                    }}
                  >
                    {port.label}
                  </span>
                </button>
              )
            })}
          </div>
        )
      })}

      {/* Hint text */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 14,
          fontSize: 10,
          color: '#1e293b',
          pointerEvents: 'none',
          letterSpacing: '0.02em',
        }}
      >
        Drag components · Drag port → port to wire · Dbl-click wire to remove
      </div>
    </div>
  )
}
