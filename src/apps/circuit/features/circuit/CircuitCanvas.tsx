import type { PointerEvent as ReactPointerEvent } from 'react'
import type { CircuitNode, CircuitWire } from './types'
import { getNodeValueLabel, templateMap } from './catalog'
import { cn } from '../../lib/utils'

interface PreviewWire {
  from: { nodeId: string; portId: string }
  x: number
  y: number
}

interface CircuitCanvasProps {
  nodes: CircuitNode[]
  wires: CircuitWire[]
  selectedNodeId: string | null
  selectedPort: { nodeId: string; portId: string } | null
  previewWire: PreviewWire | null
  simulationActive: boolean
  ledOn: boolean
  boardShape: 'rectangle' | 'rounded' | 'octagon'
  boardSize: 'compact' | 'standard' | 'wide'
  onMoveNode: (nodeId: string, position: { x: number; y: number }) => void
  onSelectNode: (nodeId: string) => void
  onStartWireDrag: (nodeId: string, portId: string) => void
  onUpdatePreviewWire: (point: { x: number; y: number }) => void
  onCompleteWire: (nodeId: string, portId: string) => void
  onCancelWireDrag: () => void
  onRemoveWire: (wireId: string) => void
}

const NODE_WIDTH = 168
const NODE_HEIGHT = 112

function getBoardHeight(size: CircuitCanvasProps['boardSize']) {
  if (size === 'compact') return 'min-h-[520px]'
  if (size === 'wide') return 'min-h-[720px]'
  return 'min-h-[620px]'
}

function getPortPosition(node: CircuitNode, portId: string) {
  const isLeft = ['negative', 'left', 'anode', 'input', 'collector', 'positive'].includes(portId)
  return {
    x: node.position.x + (isLeft ? 0 : NODE_WIDTH),
    y: node.position.y + NODE_HEIGHT / 2,
  }
}

function getNodeAccent(node: CircuitNode, simulationActive: boolean, ledOn: boolean) {
  if (node.type === 'battery') return 'from-sky-400/50 to-cyan-300/30'
  if (node.type === 'resistor') return 'from-violet-400/45 to-fuchsia-300/20'
  if (node.type === 'led') return ledOn && simulationActive ? 'from-emerald-400/70 to-lime-300/40' : 'from-amber-400/35 to-rose-300/25'
  if (node.type === 'switch') return 'from-slate-300/35 to-slate-500/20'
  if (node.type === 'capacitor') return 'from-cyan-400/45 to-blue-400/20'
  if (node.type === 'transistor') return 'from-pink-400/40 to-purple-400/20'
  return 'from-white/20 to-white/5'
}

function buildWirePath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const midX = (from.x + to.x) / 2
  return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`
}

function getWireStrokeColor(wire: CircuitWire, nodes: CircuitNode[], simulationActive: boolean) {
  const fromNode = nodes.find((node) => node.id === wire.from.nodeId)
  const toNode = nodes.find((node) => node.id === wire.to.nodeId)
  const portIds = `${wire.from.portId}:${wire.to.portId}`

  if (portIds.includes('positive') || portIds.includes('anode')) return simulationActive ? '#ef4444' : '#f87171'
  if (portIds.includes('negative') || portIds.includes('cathode')) return simulationActive ? '#64748b' : '#94a3b8'
  if (fromNode?.type === 'switch' || toNode?.type === 'switch') return '#f59e0b'
  if (fromNode?.type === 'capacitor' || toNode?.type === 'capacitor') return '#06b6d4'
  if (fromNode?.type === 'transistor' || toNode?.type === 'transistor') return '#d946ef'
  if (fromNode?.type === 'resistor' || toNode?.type === 'resistor') return '#a855f7'
  if (fromNode?.type === 'led' || toNode?.type === 'led') return '#22c55e'
  return simulationActive ? '#38bdf8' : '#94a3b8'
}

export function CircuitCanvas({
  nodes,
  wires,
  selectedNodeId,
  selectedPort,
  previewWire,
  simulationActive,
  ledOn,
  boardShape,
  boardSize,
  onMoveNode,
  onSelectNode,
  onStartWireDrag,
  onUpdatePreviewWire,
  onCompleteWire,
  onCancelWireDrag,
  onRemoveWire,
}: CircuitCanvasProps) {
  const boardClipPath = boardShape === 'octagon'
    ? 'polygon(12% 0, 88% 0, 100% 12%, 100% 88%, 88% 100%, 12% 100%, 0 88%, 0 12%)'
    : undefined

  return (
    <div
      className={cn(
        'relative overflow-hidden border border-white/10 bg-slate-950/40 shadow-glass',
        boardShape === 'rounded' ? 'rounded-[40px]' : 'rounded-[20px]',
        getBoardHeight(boardSize),
      )}
      style={boardClipPath ? { clipPath: boardClipPath } : undefined}
      onPointerMove={(event) => {
        if (!previewWire) return
        const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect()
        onUpdatePreviewWire({ x: event.clientX - rect.left, y: event.clientY - rect.top })
      }}
      onPointerUp={() => {
        if (previewWire) onCancelWireDrag()
      }}
    >
      <div className="absolute inset-0 bg-grid bg-[size:32px_32px] opacity-60" />
      <svg className="absolute inset-0 h-full w-full">
        {wires.map((wire) => {
          const fromNode = nodes.find((node) => node.id === wire.from.nodeId)
          const toNode = nodes.find((node) => node.id === wire.to.nodeId)
          if (!fromNode || !toNode) return null

          const from = getPortPosition(fromNode, wire.from.portId)
          const to = getPortPosition(toNode, wire.to.portId)
          return (
            <g key={wire.id}>
              <path
                d={buildWirePath(from, to)}
                fill="none"
                stroke={getWireStrokeColor(wire, nodes, simulationActive)}
                strokeDasharray={simulationActive ? '10 6' : '0'}
                strokeLinecap="round"
                strokeWidth={4}
              />
              <path
                d={buildWirePath(from, to)}
                fill="none"
                onDoubleClick={() => onRemoveWire(wire.id)}
                stroke="transparent"
                strokeWidth={18}
              />
            </g>
          )
        })}
        {previewWire && (() => {
          const fromNode = nodes.find((node) => node.id === previewWire.from.nodeId)
          if (!fromNode) return null
          const from = getPortPosition(fromNode, previewWire.from.portId)
          return (
            <path
              d={buildWirePath(from, { x: previewWire.x, y: previewWire.y })}
              fill="none"
              stroke="#e2e8f0"
              strokeDasharray="8 8"
              strokeLinecap="round"
              strokeWidth={3}
            />
          )
        })()}
      </svg>

      {nodes.map((node) => {
        const template = templateMap[node.type]
        return (
          <div
            key={node.id}
            className={cn(
              'absolute rounded-3xl border bg-slate-950/70 p-4 backdrop-blur-xl transition-transform hover:-translate-y-1',
              'w-[168px] cursor-grab shadow-[0_16px_48px_rgba(15,23,42,0.38)]',
              selectedNodeId === node.id ? 'border-sky-300/70 ring-2 ring-sky-300/30' : 'border-white/10',
            )}
            onPointerDown={(event: ReactPointerEvent<HTMLDivElement>) => {
              if ((event.target as HTMLElement).closest('button')) return
              event.preventDefault()
              onSelectNode(node.id)
              const startX = event.clientX
              const startY = event.clientY
              const origin = { ...node.position }

              const handleMove = (moveEvent: PointerEvent) => {
                onMoveNode(node.id, {
                  x: origin.x + (moveEvent.clientX - startX),
                  y: origin.y + (moveEvent.clientY - startY),
                })
              }
              const handleUp = () => {
                window.removeEventListener('pointermove', handleMove)
                window.removeEventListener('pointerup', handleUp)
              }

              window.addEventListener('pointermove', handleMove)
              window.addEventListener('pointerup', handleUp)
            }}
            style={{ left: node.position.x, top: node.position.y, minHeight: NODE_HEIGHT }}
          >
            <div className={cn('absolute inset-0 rounded-3xl bg-gradient-to-br opacity-90', getNodeAccent(node, simulationActive, ledOn))} />
            <div className="relative flex h-full flex-col justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-slate-200/75">{node.type}</div>
                <div className="text-lg font-semibold text-white">{node.label}</div>
              </div>
              <div className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-2 text-sm text-slate-100">
                <div>{getNodeValueLabel(node)}</div>
                {simulationActive && <div className="text-xs text-slate-300">Energized path visual active</div>}
              </div>
            </div>
            {[template.ports[0], template.ports[1]].map((port, index) => {
              const sideClass = index === 0 ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'
              return (
                <div key={port.id} className={cn('absolute inset-y-0 flex items-center', sideClass)}>
                  <button
                    className={cn(
                      'relative h-6 w-6 rounded-full border-2 border-white bg-slate-950/90 shadow-[0_0_0_4px_rgba(15,23,42,0.24)]',
                      selectedPort?.nodeId === node.id && selectedPort.portId === port.id && 'border-primary shadow-[0_0_0_4px_rgba(125,211,252,0.2)]',
                    )}
                    onPointerDown={(event) => {
                      event.stopPropagation()
                      onSelectNode(node.id)
                      onStartWireDrag(node.id, port.id)
                    }}
                    onPointerUp={(event) => {
                      event.stopPropagation()
                      if (previewWire) onCompleteWire(node.id, port.id)
                    }}
                    title={`${node.label} ${port.label}`}
                    type="button"
                  >
                    <span className="absolute inset-0 rounded-full bg-white/10" />
                  </button>
                </div>
              )
            })}
          </div>
        )
      })}

      <div className="absolute bottom-4 right-4 rounded-2xl border border-white/10 bg-slate-950/75 px-4 py-3 text-xs text-slate-300 backdrop-blur">
        Drag components to reposition. Drag from one port to another to create wires. Double-click any wire to remove it.
      </div>
    </div>
  )
}
