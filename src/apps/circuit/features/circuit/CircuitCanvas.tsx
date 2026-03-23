import { useRef, useState } from 'react'
import type { CircuitNode, CircuitWire } from './types'
import { templateMap } from './catalog'

const CARD_W = 160
const CARD_H = 104
const PORT_R = 7

interface CircuitCanvasProps {
  nodes: CircuitNode[]
  wires: CircuitWire[]
  selectedPort: { nodeId: string; portId: string } | null
  simulationActive: boolean
  ledOn: boolean
  voltageDrops?: Record<string, number>
  onMoveNode: (nodeId: string, position: { x: number; y: number }) => void
  onSelectPort: (nodeId: string, portId: string) => void
  onDeleteNode?: (nodeId: string) => void
  onDeleteWire?: (wireId: string) => void
  onToggleSwitch?: (nodeId: string) => void
}

function getPortPos(node: CircuitNode, portId: string) {
  const isLeft = ['negative', 'left', 'anode'].includes(portId)
  return {
    x: node.position.x + (isLeft ? 0 : CARD_W),
    y: node.position.y + CARD_H / 2,
  }
}

// ─── Component Symbols ──────────────────────────────────────────────────────

function BatterySymbol({ voltage, active }: { voltage: number; active: boolean }) {
  const wire = active ? '#38bdf8' : '#334155'
  const pos = active ? '#f87171' : '#64748b'
  const neg = active ? '#7dd3fc' : '#475569'
  const cy = CARD_H / 2
  return (
    <g>
      <line x1={0} y1={cy} x2={52} y2={cy} stroke={wire} strokeWidth={2} strokeLinecap="round" />
      {/* negative plate (short) */}
      <line x1={52} y1={cy - 11} x2={52} y2={cy + 11} stroke={neg} strokeWidth={3} strokeLinecap="round" />
      {/* positive plate (long) */}
      <line x1={63} y1={cy - 20} x2={63} y2={cy + 20} stroke={pos} strokeWidth={3} strokeLinecap="round" />
      {/* second cell */}
      <line x1={76} y1={cy - 11} x2={76} y2={cy + 11} stroke={neg} strokeWidth={3} strokeLinecap="round" />
      <line x1={87} y1={cy - 20} x2={87} y2={cy + 20} stroke={pos} strokeWidth={3} strokeLinecap="round" />
      <line x1={87} y1={cy} x2={CARD_W} y2={cy} stroke={wire} strokeWidth={2} strokeLinecap="round" />
      <text x={45} y={cy - 23} textAnchor="middle" fontSize={11} fill={neg} fontFamily="monospace">\u2212</text>
      <text x={92} y={cy - 23} textAnchor="middle" fontSize={11} fill={pos} fontFamily="monospace">+</text>
      <text x={CARD_W / 2} y={cy + 34} textAnchor="middle" fontSize={11} fill={active ? '#7dd3fc' : '#475569'} fontFamily="monospace">
        {voltage}V
      </text>
    </g>
  )
}

function ResistorSymbol({ resistance, active, voltageDrop }: { resistance: number; active: boolean; voltageDrop?: number }) {
  const wire = active ? '#38bdf8' : '#334155'
  const body = active ? '#c084fc' : '#475569'
  const cy = CARD_H / 2
  const label = resistance >= 1000 ? `${resistance / 1000}k\u03A9` : `${resistance}\u03A9`
  return (
    <g>
      <line x1={0} y1={cy} x2={28} y2={cy} stroke={wire} strokeWidth={2} strokeLinecap="round" />
      <rect x={28} y={cy - 16} width={104} height={32} rx={7} fill={active ? 'rgba(192,132,252,0.09)' : 'rgba(71,85,105,0.15)'} stroke={body} strokeWidth={2} />
      <line x1={132} y1={cy} x2={CARD_W} y2={cy} stroke={wire} strokeWidth={2} strokeLinecap="round" />
      <text x={CARD_W / 2} y={cy + 5} textAnchor="middle" fontSize={11} fill={active ? '#e9d5ff' : '#64748b'} fontFamily="monospace">
        {label}
      </text>
      {voltageDrop !== undefined && active && (
        <text x={CARD_W / 2} y={cy + 27} textAnchor="middle" fontSize={9} fill="#a78bfa" fontFamily="monospace">
          {voltageDrop.toFixed(2)}V\u2193
        </text>
      )}
    </g>
  )
}

function LEDSymbol({ on, forwardVoltage }: { on: boolean; forwardVoltage: number }) {
  const color = on ? '#4ade80' : '#475569'
  const cy = CARD_H / 2
  return (
    <g>
      <line x1={0} y1={cy} x2={42} y2={cy} stroke={color} strokeWidth={2} strokeLinecap="round" />
      {/* triangle body — left=anode(+), right points to cathode */}
      <polygon
        points={`42,${cy - 22} 42,${cy + 22} 80,${cy}`}
        fill={on ? 'rgba(74,222,128,0.22)' : 'rgba(71,85,105,0.12)'}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* cathode bar */}
      <line x1={80} y1={cy - 22} x2={80} y2={cy + 22} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <line x1={80} y1={cy} x2={CARD_W} y2={cy} stroke={color} strokeWidth={2} strokeLinecap="round" />
      {/* light rays */}
      {on && (
        <g stroke="#4ade80" strokeWidth={1.5} strokeLinecap="round" opacity={0.9}>
          <line x1={86} y1={cy - 20} x2={98} y2={cy - 33} />
          <line x1={92} y1={cy - 10} x2={107} y2={cy - 19} />
          <line x1={94} y1={cy + 2} x2={112} y2={cy + 2} />
        </g>
      )}
      <text x={61} y={cy + 34} textAnchor="middle" fontSize={11} fill={on ? '#86efac' : '#475569'} fontFamily="monospace">
        {forwardVoltage}Vf
      </text>
      {on && <circle cx={61} cy={cy} r={28} fill="rgba(74,222,128,0.07)" style={{ pointerEvents: 'none' }} />}
    </g>
  )
}

function SwitchSymbol({ closed, active }: { closed: boolean; active: boolean }) {
  const color = active && closed ? '#38bdf8' : closed ? '#94a3b8' : '#f59e0b'
  const cy = CARD_H / 2
  return (
    <g>
      <line x1={0} y1={cy} x2={46} y2={cy} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <circle cx={49} cy={cy} r={4} fill={color} />
      {closed ? (
        <line x1={49} y1={cy} x2={111} y2={cy} stroke={color} strokeWidth={2} strokeLinecap="round" />
      ) : (
        <line x1={49} y1={cy} x2={104} y2={cy - 26} stroke={color} strokeWidth={2} strokeLinecap="round" />
      )}
      <circle cx={114} cy={cy} r={4} fill={color} />
      <line x1={114} y1={cy} x2={CARD_W} y2={cy} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <text x={CARD_W / 2} y={cy + 34} textAnchor="middle" fontSize={10} fill={color} fontFamily="monospace">
        {closed ? 'CLOSED' : 'OPEN'}
      </text>
    </g>
  )
}

function CapacitorSymbol({ capacitance, active }: { capacitance: number; active: boolean }) {
  const color = active ? '#38bdf8' : '#475569'
  const cy = CARD_H / 2
  const label = capacitance >= 1000 ? `${capacitance / 1000}mF` : `${capacitance}\u00B5F`
  return (
    <g>
      <line x1={0} y1={cy} x2={62} y2={cy} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <line x1={62} y1={cy - 22} x2={62} y2={cy + 22} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <rect x={63} y={cy - 22} width={34} height={44} fill="rgba(56,189,248,0.05)" style={{ pointerEvents: 'none' }} />
      <line x1={98} y1={cy - 22} x2={98} y2={cy + 22} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <line x1={98} y1={cy} x2={CARD_W} y2={cy} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <text x={CARD_W / 2} y={cy + 34} textAnchor="middle" fontSize={10} fill={active ? '#7dd3fc' : '#475569'} fontFamily="monospace">
        {label}
      </text>
    </g>
  )
}

function ComponentSymbol({
  node,
  simulationActive,
  ledOn,
  voltDrop,
}: {
  node: CircuitNode
  simulationActive: boolean
  ledOn: boolean
  voltDrop?: number
}) {
  const t = templateMap[node.type]
  switch (node.type) {
    case 'battery':
      return <BatterySymbol voltage={node.voltage ?? t.defaults.voltage ?? 9} active={simulationActive} />
    case 'resistor':
      return <ResistorSymbol resistance={node.resistance ?? t.defaults.resistance ?? 220} active={simulationActive} voltageDrop={voltDrop} />
    case 'led':
      return <LEDSymbol on={ledOn && simulationActive} forwardVoltage={node.forwardVoltage ?? t.defaults.forwardVoltage ?? 2} />
    case 'switch':
      return <SwitchSymbol closed={node.closed ?? t.defaults.closed ?? true} active={simulationActive} />
    case 'capacitor':
      return <CapacitorSymbol capacitance={node.capacitance ?? t.defaults.capacitance ?? 100} active={simulationActive} />
    default:
      return null
  }
}

// ─── Main Canvas ─────────────────────────────────────────────────────────────

export function CircuitCanvas({
  nodes,
  wires,
  selectedPort,
  simulationActive,
  ledOn,
  voltageDrops = {},
  onMoveNode,
  onSelectPort,
  onDeleteNode,
  onDeleteWire,
  onToggleSwitch,
}: CircuitCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredWire, setHoveredWire] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const handleNodeDrag = (e: any, nodeId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return
    const startX = e.clientX
    const startY = e.clientY
    const ox = node.position.x
    const oy = node.position.y
    const move = (me: MouseEvent) => {
      onMoveNode(nodeId, {
        x: Math.max(8, ox + (me.clientX - startX)),
        y: Math.max(8, oy + (me.clientY - startY)),
      })
    }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#050d1a]" style={{ minHeight: 580 }}>
      <svg ref={svgRef} className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="cc-dots" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="16" cy="16" r="1" fill="rgba(148,163,184,0.10)" />
          </pattern>
          <filter id="cc-glow-green" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="cc-glow-blue" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <style>{`
            @keyframes cc-flow { to { stroke-dashoffset: -20; } }
            .cc-wire-active { animation: cc-flow 0.45s linear infinite; }
          `}</style>
        </defs>

        {/* Background */}
        <rect width="100%" height="100%" fill="#050d1a" />
        <rect width="100%" height="100%" fill="url(#cc-dots)" />

        {/* ── Wires ── */}
        {wires.map((wire) => {
          const fromNode = nodes.find((n) => n.id === wire.from.nodeId)
          const toNode = nodes.find((n) => n.id === wire.to.nodeId)
          if (!fromNode || !toNode) return null

          const from = getPortPos(fromNode, wire.from.portId)
          const to = getPortPos(toNode, wire.to.portId)
          const midX = (from.x + to.x) / 2
          const midY = (from.y + to.y) / 2
          const path = `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`
          const isHov = hoveredWire === wire.id
          const wireColor = simulationActive ? '#38bdf8' : isHov ? '#64748b' : '#1a2d45'

          return (
            <g key={wire.id}>
              {/* Wide invisible hit zone */}
              <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth={18}
                style={{ cursor: onDeleteWire ? 'pointer' : 'default' }}
                onMouseEnter={() => setHoveredWire(wire.id)}
                onMouseLeave={() => setHoveredWire(null)}
                onClick={() => onDeleteWire?.(wire.id)}
              />
              {/* Glow layer when active */}
              {simulationActive && (
                <path
                  d={path}
                  fill="none"
                  stroke="rgba(56,189,248,0.18)"
                  strokeWidth={6}
                  strokeLinecap="round"
                  style={{ pointerEvents: 'none' }}
                />
              )}
              {/* Visible wire */}
              <path
                d={path}
                fill="none"
                stroke={wireColor}
                strokeWidth={isHov ? 3 : 2.5}
                strokeLinecap="round"
                strokeDasharray={simulationActive ? '8 8' : '0'}
                className={simulationActive ? 'cc-wire-active' : undefined}
                style={{ pointerEvents: 'none' }}
                filter={simulationActive ? 'url(#cc-glow-blue)' : undefined}
              />
              {/* Delete badge on hover */}
              {isHov && onDeleteWire && (
                <g style={{ cursor: 'pointer' }} onClick={() => onDeleteWire(wire.id)}>
                  <circle cx={midX} cy={midY} r={11} fill="#0c1a2e" stroke="#ef4444" strokeWidth={1.5} />
                  <text x={midX} y={midY + 4.5} textAnchor="middle" fontSize={14} fill="#ef4444" style={{ pointerEvents: 'none' }}>
                    \u00D7
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* ── Nodes ── */}
        {nodes.map((node) => {
          const template = templateMap[node.type]
          const isHov = hoveredNode === node.id
          const voltDrop = voltageDrops[node.id]
          const isLedOn = node.type === 'led' && ledOn && simulationActive
          const isSwitchClosed = node.type === 'switch' && (node.closed ?? true)

          const accentColor =
            node.type === 'battery'
              ? '#38bdf8'
              : node.type === 'resistor'
                ? '#c084fc'
                : node.type === 'led'
                  ? isLedOn
                    ? '#4ade80'
                    : '#fbbf24'
                  : node.type === 'switch'
                    ? isSwitchClosed
                      ? '#94a3b8'
                      : '#f59e0b'
                    : '#38bdf8'

          return (
            <g
              key={node.id}
              transform={`translate(${node.position.x}, ${node.position.y})`}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* LED ambient glow when on */}
              {isLedOn && (
                <rect
                  x={-16}
                  y={-16}
                  width={CARD_W + 32}
                  height={CARD_H + 32}
                  rx={28}
                  fill="rgba(74,222,128,0.08)"
                  filter="url(#cc-glow-green)"
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* Card body — drag handle */}
              <rect
                x={0}
                y={0}
                width={CARD_W}
                height={CARD_H}
                rx={18}
                fill="#08111e"
                stroke={isHov ? accentColor : 'rgba(255,255,255,0.06)'}
                strokeWidth={isHov ? 1.5 : 1}
                style={{ cursor: 'grab' }}
                onMouseDown={(e: any) => handleNodeDrag(e, node.id)}
              />

              {/* Subtle top gradient tint */}
              <rect
                x={1}
                y={1}
                width={CARD_W - 2}
                height={CARD_H / 2}
                rx={17}
                fill={`${accentColor}0a`}
                style={{ pointerEvents: 'none' }}
              />

              {/* Component type label */}
              <text
                x={CARD_W / 2}
                y={14}
                textAnchor="middle"
                fontSize={8}
                fill={accentColor}
                fontFamily="monospace"
                letterSpacing={2}
                style={{ pointerEvents: 'none', textTransform: 'uppercase' }}
              >
                {node.type.toUpperCase()}
              </text>

              {/* Component symbol */}
              <g style={{ pointerEvents: 'none' }}>
                <ComponentSymbol node={node} simulationActive={simulationActive} ledOn={ledOn} voltDrop={voltDrop} />
              </g>

              {/* Port circles */}
              {template.ports.map((port) => {
                const pos = getPortPos(node, port.id)
                const cx = pos.x - node.position.x
                const cy = pos.y - node.position.y
                const isSel = selectedPort?.nodeId === node.id && selectedPort.portId === port.id
                return (
                  <circle
                    key={port.id}
                    cx={cx}
                    cy={cy}
                    r={PORT_R}
                    fill={isSel ? '#38bdf8' : '#060f1e'}
                    stroke={isSel ? '#7dd3fc' : 'rgba(255,255,255,0.30)'}
                    strokeWidth={isSel ? 2.5 : 2}
                    filter={isSel ? 'url(#cc-glow-blue)' : undefined}
                    style={{ cursor: 'crosshair' }}
                    onClick={(e: any) => {
                      e.stopPropagation()
                      onSelectPort(node.id, port.id)
                    }}
                  />
                )
              })}

              {/* Port labels */}
              {template.ports.map((port) => {
                const pos = getPortPos(node, port.id)
                const cx = pos.x - node.position.x
                const cy = pos.y - node.position.y
                const onLeft = cx === 0
                return (
                  <text
                    key={`lbl-${port.id}`}
                    x={onLeft ? cx - 13 : cx + 13}
                    y={cy + 4}
                    textAnchor={onLeft ? 'end' : 'start'}
                    fontSize={9}
                    fill="rgba(148,163,184,0.45)"
                    style={{ pointerEvents: 'none' }}
                  >
                    {port.label}
                  </text>
                )
              })}

              {/* Delete button (top-right, on hover) */}
              {isHov && onDeleteNode && (
                <g
                  style={{ cursor: 'pointer' }}
                  onClick={(e: any) => {
                    e.stopPropagation()
                    onDeleteNode(node.id)
                  }}
                >
                  <circle cx={CARD_W - 11} cy={11} r={9} fill="#0c1a2e" stroke="#ef4444" strokeWidth={1.5} />
                  <text x={CARD_W - 11} y={15.5} textAnchor="middle" fontSize={13} fill="#ef4444" style={{ pointerEvents: 'none' }}>
                    \u00D7
                  </text>
                </g>
              )}

              {/* Switch toggle button (bottom-left, always visible) */}
              {node.type === 'switch' && onToggleSwitch && (
                <g
                  style={{ cursor: 'pointer' }}
                  onClick={(e: any) => {
                    e.stopPropagation()
                    onToggleSwitch(node.id)
                  }}
                >
                  <rect
                    x={10}
                    y={CARD_H - 18}
                    width={52}
                    height={13}
                    rx={6.5}
                    fill={isSwitchClosed ? 'rgba(74,222,128,0.18)' : 'rgba(71,85,105,0.35)'}
                    stroke={isSwitchClosed ? '#4ade80' : '#475569'}
                    strokeWidth={1}
                  />
                  <text
                    x={36}
                    y={CARD_H - 9}
                    textAnchor="middle"
                    fontSize={8}
                    fill={isSwitchClosed ? '#4ade80' : '#94a3b8'}
                    fontFamily="monospace"
                    style={{ pointerEvents: 'none' }}
                  >
                    {isSwitchClosed ? 'CLOSE' : 'OPEN'}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
