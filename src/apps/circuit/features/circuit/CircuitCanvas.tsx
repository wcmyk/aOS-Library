import type { CircuitNode, CircuitWire } from './types'
import { templateMap } from './catalog'
import { cn } from '../../lib/utils'

interface CircuitCanvasProps {
  nodes: CircuitNode[]
  wires: CircuitWire[]
  selectedPort: { nodeId: string; portId: string } | null
  simulationActive: boolean
  ledOn: boolean
  onMoveNode: (nodeId: string, position: { x: number; y: number }) => void
  onSelectPort: (nodeId: string, portId: string) => void
}

const NODE_WIDTH = 150
const NODE_HEIGHT = 92

function getPortPosition(node: CircuitNode, portId: string) {
  const isLeft = ['negative', 'left', 'anode'].includes(portId)
  return {
    x: node.position.x + (isLeft ? 0 : NODE_WIDTH),
    y: node.position.y + NODE_HEIGHT / 2,
  }
}

function getNodeAccent(node: CircuitNode, simulationActive: boolean, ledOn: boolean) {
  if (node.type === 'battery') return 'from-sky-400/50 to-cyan-300/30'
  if (node.type === 'resistor') return 'from-violet-400/45 to-fuchsia-300/20'
  if (node.type === 'led') return ledOn && simulationActive ? 'from-emerald-400/70 to-lime-300/40' : 'from-amber-400/35 to-rose-300/25'
  return 'from-white/20 to-white/5'
}

export function CircuitCanvas({ nodes, wires, selectedPort, simulationActive, ledOn, onMoveNode, onSelectPort }: CircuitCanvasProps) {
  return (
    <div className="relative min-h-[560px] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/40 shadow-glass">
      <div className="absolute inset-0 bg-grid bg-[size:32px_32px] opacity-60" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {wires.map((wire) => {
          const fromNode = nodes.find((node) => node.id === wire.from.nodeId)
          const toNode = nodes.find((node) => node.id === wire.to.nodeId)
          if (!fromNode || !toNode) return null

          const from = getPortPosition(fromNode, wire.from.portId)
          const to = getPortPosition(toNode, wire.to.portId)
          const midX = (from.x + to.x) / 2
          const path = `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`

          return (
            <path
              key={wire.id}
              d={path}
              fill="none"
              stroke={simulationActive ? '#7dd3fc' : '#94a3b8'}
              strokeDasharray={simulationActive ? '10 6' : '0'}
              strokeLinecap="round"
              strokeWidth={4}
            />
          )
        })}
      </svg>

      {nodes.map((node) => {
        const template = templateMap[node.type]
        const valueLabel =
          node.type === 'battery'
            ? `${node.voltage ?? template.defaults.voltage} V`
            : node.type === 'resistor'
              ? `${node.resistance ?? template.defaults.resistance} \u03A9`
              : `${node.forwardVoltage ?? template.defaults.forwardVoltage} V_f`

        return (
          <div
            key={node.id}
            className={cn(
              'absolute rounded-3xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl transition-transform hover:-translate-y-1',
              'w-[150px] cursor-grab shadow-[0_16px_48px_rgba(15,23,42,0.38)]',
            )}
            onMouseDown={(event: any) => {
              event.preventDefault()
              const startX = event.clientX
              const startY = event.clientY
              const origin = { ...node.position }

              const handleMove = (moveEvent: MouseEvent) => {
                onMoveNode(node.id, {
                  x: origin.x + (moveEvent.clientX - startX),
                  y: origin.y + (moveEvent.clientY - startY),
                })
              }
              const handleUp = () => {
                window.removeEventListener('mousemove', handleMove)
                window.removeEventListener('mouseup', handleUp)
              }

              window.addEventListener('mousemove', handleMove)
              window.addEventListener('mouseup', handleUp)
            }}
            style={{ left: node.position.x, top: node.position.y, minHeight: NODE_HEIGHT }}
          >
            <div className={cn('absolute inset-0 rounded-3xl bg-gradient-to-br opacity-90', getNodeAccent(node, simulationActive, ledOn))} />
            <div className="relative flex h-full flex-col justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-slate-200/75">{node.type}</div>
                <div className="text-lg font-semibold text-white">{node.label}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-2 text-sm text-slate-100">{valueLabel}</div>
            </div>
            <div className="absolute inset-y-0 left-0 flex items-center -translate-x-1/2">
              <button
                className={cn(
                  'h-5 w-5 rounded-full border-2 border-white bg-slate-950/90',
                  selectedPort?.nodeId === node.id && selectedPort.portId === template.ports[0].id && 'border-primary shadow-[0_0_0_4px_rgba(125,211,252,0.2)]',
                )}
                onClick={(event: any) => {
                  event.stopPropagation()
                  onSelectPort(node.id, template.ports[0].id)
                }}
                title={`${node.label} ${template.ports[0].label}`}
                type="button"
              />
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center translate-x-1/2">
              <button
                className={cn(
                  'h-5 w-5 rounded-full border-2 border-white bg-slate-950/90',
                  selectedPort?.nodeId === node.id && selectedPort.portId === template.ports[1].id && 'border-primary shadow-[0_0_0_4px_rgba(125,211,252,0.2)]',
                )}
                onClick={(event: any) => {
                  event.stopPropagation()
                  onSelectPort(node.id, template.ports[1].id)
                }}
                title={`${node.label} ${template.ports[1].label}`}
                type="button"
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
