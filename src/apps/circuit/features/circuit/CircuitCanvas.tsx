import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { CircuitNode, CircuitWire, CircuitLayer } from './types'
import { getNodeValueLabel, getPortPosition, templateMap } from './catalog'
import { cn } from '../../lib/utils'

const NODE_WIDTH = 160
const NODE_HEIGHT = 96

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
  const midX = (from.x + to.x) / 2
  return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`
}

function getWireColor(wire: CircuitWire, nodes: CircuitNode[], active: boolean) {
  const fromNode = nodes.find((n) => n.id === wire.from.nodeId)
  const toNode = nodes.find((n) => n.id === wire.to.nodeId)
  const ports = `${wire.from.portId}:${wire.to.portId}`
  if (ports.includes('positive') || ports.includes('anode')) return active ? '#ef4444' : '#f87171'
  if (ports.includes('negative') || ports.includes('cathode')) return active ? '#475569' : '#64748b'
  if (fromNode?.type === 'transistor' || toNode?.type === 'transistor') return '#d946ef'
  if (fromNode?.type === 'capacitor' || toNode?.type === 'capacitor') return '#06b6d4'
  if (fromNode?.type === 'resistor' || toNode?.type === 'resistor') return '#a855f7'
  if (fromNode?.type === 'led' || toNode?.type === 'led') return active ? '#22c55e' : '#4ade80'
  if (fromNode?.type === 'inductor' || toNode?.type === 'inductor') return '#0ea5e9'
  if (fromNode?.type === 'ground' || toNode?.type === 'ground') return '#475569'
  return active ? '#38bdf8' : '#94a3b8'
}

function getPortStyle(side: string | undefined): CSSProperties {
  const half = 9
  if (side === 'right') return { right: -half, top: '50%', transform: 'translateY(-50%)' }
  if (side === 'top') return { top: -half, left: '50%', transform: 'translateX(-50%)' }
  if (side === 'bottom') return { bottom: -half, left: '50%', transform: 'translateX(-50%)' }
  return { left: -half, top: '50%', transform: 'translateY(-50%)' }
}

function hexToRgb(hex: string): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!r) return '148,163,184'
  return `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}`
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
      className="relative h-full overflow-hidden"
      style={{
        background: '#060c18',
        backgroundImage:
          'linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
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
      {/* Wire layer */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ overflow: 'visible' }}>
        {wires.map((wire) => {
          const fromNode = visibleNodes.find((n) => n.id === wire.from.nodeId)
          const toNode = visibleNodes.find((n) => n.id === wire.to.nodeId)
          if (!fromNode || !toNode) return null
          const from = getPortPosition(fromNode, wire.from.portId)
          const to = getPortPosition(toNode, wire.to.portId)
          const color = getWireColor(wire, visibleNodes, simulationActive)
          return (
            <g key={wire.id} className="pointer-events-auto">
              <path
                d={buildWirePath(from, to)}
                fill="none"
                stroke={color}
                strokeDasharray={simulationActive ? '8 5' : '0'}
                strokeLinecap="round"
                strokeWidth={2}
              />
              {/* wider invisible hit target for double-click removal */}
              <path
                d={buildWirePath(from, to)}
                fill="none"
                stroke="transparent"
                strokeWidth={16}
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
              <path
                d={buildWirePath(from, { x: previewWire.x, y: previewWire.y })}
                fill="none"
                stroke="rgba(255,255,255,0.35)"
                strokeDasharray="5 5"
                strokeLinecap="round"
                strokeWidth={1.5}
              />
            )
          })()}
      </svg>

      {/* Component nodes */}
      {visibleNodes.map((node) => {
        const template = templateMap[node.type]
        const layer = layers.find((l) => l.id === node.layer)
        const isSelected = selectedNodeId === node.id
        const isLedOn = node.type === 'led' && ledOn && simulationActive

        return (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: node.position.x,
              top: node.position.y,
              width: NODE_WIDTH,
              minHeight: NODE_HEIGHT,
              userSelect: 'none',
            }}
            onPointerDown={(e: ReactPointerEvent<HTMLDivElement>) => {
              if ((e.target as HTMLElement).closest('button')) return
              e.preventDefault()
              onSelectNode(node.id)
              const startX = e.clientX
              const startY = e.clientY
              const origin = { ...node.position }
              const handleMove = (mv: PointerEvent) => {
                onMoveNode(node.id, {
                  x: Math.max(0, origin.x + (mv.clientX - startX)),
                  y: Math.max(0, origin.y + (mv.clientY - startY)),
                })
              }
              const handleUp = () => {
                window.removeEventListener('pointermove', handleMove)
                window.removeEventListener('pointerup', handleUp)
              }
              window.addEventListener('pointermove', handleMove)
              window.addEventListener('pointerup', handleUp)
            }}
          >
            {/* Card body */}
            <div
              className={cn('absolute inset-0 rounded-xl backdrop-blur-xl', isSelected ? 'cursor-grabbing' : 'cursor-grab')}
              style={{
                border: isSelected
                  ? '1px solid rgba(56,189,248,.55)'
                  : '1px solid rgba(255,255,255,.07)',
                background: `linear-gradient(135deg, rgba(${hexToRgb(template.color)},0.14), rgba(${hexToRgb(template.color)},0.04))`,
                boxShadow: isLedOn
                  ? `0 0 24px rgba(34,197,94,0.45), 0 4px 12px rgba(0,0,0,0.5)`
                  : isSelected
                    ? '0 0 0 2px rgba(56,189,248,.2), 0 4px 16px rgba(0,0,0,0.5)'
                    : '0 4px 12px rgba(0,0,0,0.4)',
              }}
            >
              {/* Layer dot */}
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 8,
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: layer?.color ?? '#64748b',
                  opacity: 0.6,
                }}
              />
              <div style={{ padding: '8px 12px 10px' }}>
                <div
                  style={{
                    fontSize: 9,
                    textTransform: 'uppercase',
                    letterSpacing: '0.18em',
                    color: template.color,
                    marginBottom: 2,
                    opacity: 0.85,
                  }}
                >
                  {node.type}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', lineHeight: 1.3 }}>{node.label}</div>
                <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 3 }}>{getNodeValueLabel(node)}</div>
                {simulationActive && (
                  <div style={{ fontSize: 9, color: isLedOn ? '#22c55e' : '#334155', marginTop: 4 }}>
                    {isLedOn ? '◉ energized' : '○ idle'}
                  </div>
                )}
              </div>
            </div>

            {/* Port buttons */}
            {template.ports.map((port) => {
              const isPortSelected = selectedPort?.nodeId === node.id && selectedPort.portId === port.id
              return (
                <button
                  key={port.id}
                  type="button"
                  title={`${node.label}: ${port.label || port.id}`}
                  style={{
                    position: 'absolute',
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: `2px solid ${isPortSelected ? '#7dd3fc' : 'rgba(255,255,255,0.35)'}`,
                    background: isPortSelected ? 'rgba(125,211,252,.3)' : 'rgba(8,14,26,.92)',
                    cursor: 'crosshair',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isPortSelected
                      ? '0 0 0 3px rgba(125,211,252,.2)'
                      : '0 2px 4px rgba(0,0,0,.5)',
                    zIndex: 2,
                    ...getPortStyle(port.side),
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
                      color: '#94a3b8',
                      fontWeight: 700,
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

      {/* Hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 12,
          fontSize: 10,
          color: '#1e293b',
          pointerEvents: 'none',
        }}
      >
        Drag to move · Port → port to wire · Dbl-click wire to remove
      </div>
    </div>
  )
}
