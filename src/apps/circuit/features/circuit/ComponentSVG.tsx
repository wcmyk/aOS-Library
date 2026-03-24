import type { CircuitNode } from './types'

// ─── Resistor band colors ────────────────────────────────────────────────────
const DIGIT_COLORS = [
  '#1a1a1a', // 0 Black
  '#6b3a0f', // 1 Brown
  '#cc2200', // 2 Red
  '#e87800', // 3 Orange
  '#d4b800', // 4 Yellow
  '#1a6b1a', // 5 Green
  '#1a2ecc', // 6 Blue
  '#6b1ab2', // 7 Violet
  '#707070', // 8 Gray
  '#e8e8e8', // 9 White
]
const MULT_COLORS = ['#1a1a1a', '#6b3a0f', '#cc2200', '#e87800', '#d4b800', '#1a6b1a', '#1a2ecc', '#6b1ab2', '#aaa', '#e8e8e8', '#ffd700', '#bbb']

function getResistorBands(ohms: number): [string, string, string] {
  let val = Math.max(1, ohms)
  let mult = 0
  while (val >= 100) { val = Math.round(val / 10); mult++ }
  while (val < 10) { val = Math.round(val * 10); mult-- }
  const d1 = Math.min(9, Math.max(0, Math.floor(val / 10)))
  const d2 = Math.min(9, Math.max(0, Math.floor(val % 10)))
  return [DIGIT_COLORS[d1], DIGIT_COLORS[d2], MULT_COLORS[Math.max(0, Math.min(7, mult))]]
}

// ─── RESISTOR ────────────────────────────────────────────────────────────────
export function ResistorSVG({ w, h, resistance = 220 }: { w: number; h: number; resistance?: number }) {
  const cy = h / 2
  const bx = w * 0.15, bw = w * 0.70, bh = h * 0.48, by = cy - bh / 2
  const [b1, b2, b3] = getResistorBands(resistance)
  const r = bh / 2

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      {/* Leads */}
      <line x1={0} y1={cy} x2={bx} y2={cy} stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" />
      <line x1={bx + bw} y1={cy} x2={w} y2={cy} stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" />
      {/* Body shadow */}
      <rect x={bx + 1} y={by + 2} width={bw} height={bh} rx={r} fill="rgba(0,0,0,0.35)" />
      {/* Body */}
      <rect x={bx} y={by} width={bw} height={bh} rx={r} fill="#c8995a" />
      {/* Highlight */}
      <rect x={bx + r} y={by} width={bw - r * 2} height={bh * 0.38} rx={r * 0.5} fill="rgba(255,255,255,0.22)" />
      {/* Band 1 */}
      <rect x={bx + bw * 0.13} y={by} width={bw * 0.07} height={bh} fill={b1} rx={1} />
      {/* Band 2 */}
      <rect x={bx + bw * 0.25} y={by} width={bw * 0.07} height={bh} fill={b2} rx={1} />
      {/* Band 3 (multiplier) */}
      <rect x={bx + bw * 0.37} y={by} width={bw * 0.07} height={bh} fill={b3} rx={1} />
      {/* Band 4 (gold tolerance) */}
      <rect x={bx + bw * 0.67} y={by} width={bw * 0.07} height={bh} fill="#d4a700" rx={1} />
      {/* End caps */}
      <rect x={bx} y={by} width={bw * 0.08} height={bh} rx={r} fill="#a07840" />
      <rect x={bx + bw - bw * 0.08} y={by} width={bw * 0.08} height={bh} rx={r} fill="#a07840" />
    </svg>
  )
}

// ─── LED ─────────────────────────────────────────────────────────────────────
export function LedSVG({ w, h, on = false, color = '#22c55e' }: { w: number; h: number; on?: boolean; color?: string }) {
  const leadY = h * 0.56
  const bx = w * 0.20, bw = w * 0.60
  const lensRy = h * 0.32, lensRx = bw / 2, lensCy = h * 0.28
  const baseTop = lensCy + lensRy * 0.5, baseH = h * 0.2
  const glowColor = on ? color : 'none'

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        {on && (
          <radialGradient id="led-glow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        )}
        <linearGradient id="led-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={on ? color : '#374151'} stopOpacity={on ? 0.9 : 1} />
          <stop offset="100%" stopColor={on ? color : '#1f2937'} stopOpacity={0.8} />
        </linearGradient>
      </defs>

      {/* Glow halo */}
      {on && <ellipse cx={bx + bw / 2} cy={lensCy} rx={bw * 0.9} ry={h * 0.45} fill="url(#led-glow)" />}

      {/* Cathode lead (right, shorter) */}
      <line x1={bx + bw} y1={leadY} x2={w} y2={leadY} stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" />
      {/* Anode lead (left, longer) */}
      <line x1={0} y1={leadY} x2={bx} y2={leadY} stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" />

      {/* Body base / stem */}
      <rect x={bx} y={baseTop} width={bw} height={baseH} fill="#1c2433" />
      {/* Cathode flat on right */}
      <rect x={bx + bw - bw * 0.12} y={baseTop - 2} width={bw * 0.12} height={baseH + 2} fill="#111a26" />

      {/* Lens dome */}
      <ellipse cx={bx + bw / 2} cy={lensCy} rx={lensRx} ry={lensRy} fill="url(#led-body)" />
      <ellipse cx={bx + bw / 2} cy={lensCy} rx={lensRx} ry={lensRy} fill="none" stroke={on ? color : '#374151'} strokeWidth={0.5} />
      {/* Lens highlight */}
      <ellipse cx={bx + bw / 2 - lensRx * 0.22} cy={lensCy - lensRy * 0.35} rx={lensRx * 0.22} ry={lensRy * 0.22} fill="rgba(255,255,255,0.28)" />

      {/* + - labels */}
      <text x={5} y={leadY - 3} fontSize="7" fill="#6b7280">+</text>
      <text x={w - 10} y={leadY - 3} fontSize="7" fill="#6b7280">−</text>
    </svg>
  )
}

// ─── BATTERY ─────────────────────────────────────────────────────────────────
export function BatterySVG({ w, h, voltage = 9 }: { w: number; h: number; voltage?: number }) {
  const cy = h / 2
  const bx = w * 0.08, bw = w * 0.84, bh = h * 0.80, by = cy - bh / 2

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="batt-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e2d4a" />
          <stop offset="50%" stopColor="#152238" />
          <stop offset="100%" stopColor="#0d1827" />
        </linearGradient>
        <linearGradient id="batt-side" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4a6080" />
          <stop offset="100%" stopColor="#2a3d56" />
        </linearGradient>
      </defs>

      {/* + terminal lead */}
      <line x1={0} y1={cy} x2={bx} y2={cy} stroke="#f87171" strokeWidth={2} strokeLinecap="round" />
      {/* − terminal lead */}
      <line x1={bx + bw} y1={cy} x2={w} y2={cy} stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" />

      {/* Body shadow */}
      <rect x={bx + 1} y={by + 2} width={bw} height={bh} rx={4} fill="rgba(0,0,0,0.4)" />
      {/* Body */}
      <rect x={bx} y={by} width={bw} height={bh} rx={4} fill="url(#batt-body)" />
      <rect x={bx} y={by} width={bw} height={bh} rx={4} fill="none" stroke="#2a4a6b" strokeWidth={0.8} />

      {/* Top stripe (label band) */}
      <rect x={bx} y={by} width={bw} height={bh * 0.22} rx={4} fill="#0ea5e9" opacity={0.35} />

      {/* + terminal block (left) */}
      <rect x={bx} y={cy - 10} width={bw * 0.13} height={20} rx={2} fill="url(#batt-side)" />
      <rect x={bx + 2} y={cy - 6} width={bw * 0.09} height={12} rx={1} fill="#f87171" opacity={0.85} />
      <text x={bx + bw * 0.065} y={cy + 4} textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">+</text>

      {/* − terminal block (right) */}
      <rect x={bx + bw - bw * 0.13} y={cy - 7} width={bw * 0.13} height={14} rx={2} fill="url(#batt-side)" />
      <rect x={bx + bw - bw * 0.11} y={cy - 4} width={bw * 0.08} height={8} rx={1} fill="#6b7280" opacity={0.85} />

      {/* Voltage label */}
      <text x={bx + bw / 2} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#e2e8f0" opacity={0.9}>
        {voltage}V
      </text>
      <text x={bx + bw / 2} y={cy + 15} textAnchor="middle" fontSize="7" fill="#64748b" letterSpacing="1">
        BATTERY
      </text>

      {/* Highlight */}
      <rect x={bx + 4} y={by + 2} width={bw - 8} height={bh * 0.12} rx={3} fill="rgba(255,255,255,0.08)" />
    </svg>
  )
}

// ─── SWITCH ──────────────────────────────────────────────────────────────────
export function SwitchSVG({ w, h, closed = true }: { w: number; h: number; closed?: boolean }) {
  const cy = h / 2
  const bx = w * 0.12, bw = w * 0.76, bh = h * 0.55, by = cy - bh / 2
  const pivotX = bx + bw * 0.38
  // Lever pivot at left-center of body, tip swings to right
  const leverEndX = closed ? bx + bw * 0.78 : bx + bw * 0.65
  const leverEndY = closed ? cy : cy - bh * 0.4

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="sw-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
      </defs>

      {/* Leads */}
      <line x1={0} y1={cy} x2={bx} y2={cy} stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" />
      <line x1={bx + bw} y1={cy} x2={w} y2={cy} stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" />

      {/* Body shadow */}
      <rect x={bx + 1} y={by + 2} width={bw} height={bh} rx={3} fill="rgba(0,0,0,0.3)" />
      {/* Body */}
      <rect x={bx} y={by} width={bw} height={bh} rx={3} fill="url(#sw-body)" />
      <rect x={bx} y={by} width={bw} height={bh} rx={3} fill="none" stroke="#374151" strokeWidth={0.8} />

      {/* Pivot post */}
      <circle cx={pivotX} cy={cy} r={4} fill="#6b7280" />
      <circle cx={pivotX} cy={cy} r={2.5} fill="#374151" />

      {/* Right contact post */}
      <circle cx={bx + bw * 0.78} cy={cy} r={3.5} fill={closed ? '#22c55e' : '#4b5563'} />

      {/* Lever */}
      <line
        x1={pivotX}
        y1={cy}
        x2={leverEndX}
        y2={leverEndY}
        stroke={closed ? '#22c55e' : '#94a3b8'}
        strokeWidth={2.5}
        strokeLinecap="round"
      />

      {/* State text */}
      <text x={bx + bw / 2} y={by + bh + 12} textAnchor="middle" fontSize="7" fill={closed ? '#22c55e' : '#ef4444'}>
        {closed ? 'CLOSED' : 'OPEN'}
      </text>

      {/* IN / OUT labels */}
      <text x={bx + 4} y={by - 3} fontSize="7" fill="#4b5563">IN</text>
      <text x={bx + bw - 14} y={by - 3} fontSize="7" fill="#4b5563">OUT</text>

      {/* Highlight */}
      <rect x={bx + 2} y={by + 1} width={bw - 4} height={bh * 0.25} rx={2} fill="rgba(255,255,255,0.07)" />
    </svg>
  )
}

// ─── CAPACITOR ───────────────────────────────────────────────────────────────
export function CapacitorSVG({ w, h, capacitance = 220 }: { w: number; h: number; capacitance?: number }) {
  const cy = h / 2
  // Electrolytic cap drawn as a cylinder from the side, lying horizontal
  const bx = w * 0.14, bw = w * 0.72, bh = h * 0.60, by = cy - bh / 2

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="cap-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6b7a8d" />
          <stop offset="40%" stopColor="#3a4a5c" />
          <stop offset="100%" stopColor="#1e2a38" />
        </linearGradient>
        <linearGradient id="cap-stripe" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
      </defs>

      {/* Leads */}
      <line x1={0} y1={cy} x2={bx} y2={cy} stroke="#f87171" strokeWidth={1.5} strokeLinecap="round" />
      <line x1={bx + bw} y1={cy} x2={w} y2={cy} stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" />

      {/* Body shadow */}
      <rect x={bx + 1} y={by + 2} width={bw} height={bh} rx={bh / 2} fill="rgba(0,0,0,0.35)" />
      {/* Main body cylinder */}
      <rect x={bx} y={by} width={bw} height={bh} rx={bh / 2} fill="url(#cap-body)" />

      {/* Negative stripe (right side) */}
      <rect x={bx + bw * 0.72} y={by} width={bw * 0.28} height={bh} rx={bh / 2} fill="url(#cap-stripe)" />
      {/* Stripe marks */}
      <text x={bx + bw * 0.82} y={cy - 3} textAnchor="middle" fontSize="8" fill="#9ca3af">−</text>
      <text x={bx + bw * 0.82} y={cy + 8} textAnchor="middle" fontSize="8" fill="#9ca3af">−</text>

      {/* End caps */}
      <ellipse cx={bx} cy={cy} rx={4} ry={bh / 2} fill="#8a9bb0" />
      <ellipse cx={bx + bw} cy={cy} rx={4} ry={bh / 2} fill="#4a5568" />

      {/* Value label */}
      <text x={bx + bw * 0.38} y={cy + 4} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#e2e8f0">
        {capacitance >= 1000 ? `${(capacitance / 1000).toFixed(1)}mF` : `${capacitance}µF`}
      </text>

      {/* Highlight stripe */}
      <rect x={bx + 4} y={by + 1} width={bw * 0.65} height={bh * 0.28} rx={bh * 0.14} fill="rgba(255,255,255,0.12)" />

      {/* + indicator */}
      <text x={bx + bw * 0.2} y={by - 4} textAnchor="middle" fontSize="8" fill="#f87171">+</text>
    </svg>
  )
}

// ─── TRANSISTOR ──────────────────────────────────────────────────────────────
export function TransistorSVG({ w, h, gain = 120 }: { w: number; h: number; gain?: number }) {
  // TO-92 package viewed from the front
  // Collector = left, Emitter = right, Base = bottom
  const bx = w * 0.18, bw = w * 0.64, bh = h * 0.52, by = h * 0.08
  const flatY = by + bh
  const cx = w / 2

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="bjt-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2d2d2d" />
          <stop offset="100%" stopColor="#111" />
        </linearGradient>
      </defs>

      {/* Collector lead (left) */}
      <line x1={0} y1={h / 2} x2={bx} y2={by + bh * 0.30} stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" />
      {/* Emitter lead (right) */}
      <line x1={bx + bw} y1={by + bh * 0.30} x2={w} y2={h / 2} stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" />
      {/* Base lead (bottom) */}
      <line x1={cx} y1={flatY} x2={cx} y2={h} stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" />

      {/* TO-92 rounded body */}
      <path
        d={`M ${bx} ${flatY} A ${bw / 2} ${bh} 0 0 1 ${bx + bw} ${flatY} Z`}
        fill="url(#bjt-body)"
      />
      <path
        d={`M ${bx} ${flatY} A ${bw / 2} ${bh} 0 0 1 ${bx + bw} ${flatY} Z`}
        fill="none"
        stroke="#444"
        strokeWidth={0.5}
      />
      {/* Flat face */}
      <rect x={bx} y={flatY - 2} width={bw} height={4} fill="#222" />
      {/* Highlight on dome */}
      <path
        d={`M ${bx + bw * 0.25} ${by + bh * 0.18} A ${bw * 0.2} ${bh * 0.2} 0 0 1 ${bx + bw * 0.55} ${by + bh * 0.10} Z`}
        fill="rgba(255,255,255,0.12)"
      />

      {/* Lead labels */}
      <text x={bx - 2} y={by + bh * 0.22} fontSize="7" fill="#6b7280" textAnchor="end">C</text>
      <text x={bx + bw + 2} y={by + bh * 0.22} fontSize="7" fill="#6b7280">E</text>
      <text x={cx} y={h - 2} fontSize="7" fill="#6b7280" textAnchor="middle">B</text>

      {/* Type label */}
      <text x={cx} y={flatY - bh * 0.28} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#d1d5db">
        NPN
      </text>
      <text x={cx} y={flatY - bh * 0.12} textAnchor="middle" fontSize="7" fill="#6b7280">
        β={gain}
      </text>
    </svg>
  )
}

// ─── DIODE ───────────────────────────────────────────────────────────────────
export function DiodeSVG({ w, h, forwardVoltage = 0.7 }: { w: number; h: number; forwardVoltage?: number }) {
  const cy = h / 2
  const bx = w * 0.16, bw = w * 0.68, bh = h * 0.44, by = cy - bh / 2
  const r = bh / 2
  const bandX = bx + bw - bw * 0.15

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="diode-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d1d5db" />
          <stop offset="50%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#6b7280" />
        </linearGradient>
      </defs>

      {/* Leads */}
      <line x1={0} y1={cy} x2={bx} y2={cy} stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" />
      <line x1={bx + bw} y1={cy} x2={w} y2={cy} stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" />

      {/* Glass body shadow */}
      <rect x={bx + 1} y={by + 2} width={bw} height={bh} rx={r} fill="rgba(0,0,0,0.25)" />
      {/* Glass body */}
      <rect x={bx} y={by} width={bw} height={bh} rx={r} fill="url(#diode-body)" />
      {/* Glass sheen */}
      <rect x={bx + r} y={by} width={bw - r * 2} height={bh * 0.4} rx={r * 0.5} fill="rgba(255,255,255,0.3)" />

      {/* Cathode band (dark ring) */}
      <rect x={bandX} y={by} width={bw * 0.12} height={bh} fill="#1a1a1a" rx={1} />
      {/* Band highlight */}
      <rect x={bandX + 1} y={by + 1} width={bw * 0.04} height={bh * 0.4} fill="rgba(255,255,255,0.1)" rx={1} />

      {/* Labels */}
      <text x={bx + bw * 0.28} y={cy + 4} textAnchor="middle" fontSize="8" fill="#374151">
        {forwardVoltage}V
      </text>
      <text x={bx + 4} y={by - 4} fontSize="7" fill="#6b7280">A</text>
      <text x={bx + bw - 8} y={by - 4} fontSize="7" fill="#6b7280">K</text>
    </svg>
  )
}

// ─── GROUND ──────────────────────────────────────────────────────────────────
export function GroundSVG({ w, h }: { w: number; h: number }) {
  const cx = w / 2
  // Connection point is at top center (port 'gnd' with side='top')
  // Symbol drawn below
  const topY = 0
  const lineY1 = h * 0.32
  const l1 = w * 0.52, l2 = w * 0.34, l3 = w * 0.18
  const gap = h * 0.14

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      {/* Wire from top port down to symbol */}
      <line x1={cx} y1={topY} x2={cx} y2={lineY1} stroke="#64748b" strokeWidth={1.5} strokeLinecap="round" />
      {/* Three horizontal ground lines */}
      <line x1={cx - l1 / 2} y1={lineY1} x2={cx + l1 / 2} y2={lineY1} stroke="#64748b" strokeWidth={2} strokeLinecap="round" />
      <line x1={cx - l2 / 2} y1={lineY1 + gap} x2={cx + l2 / 2} y2={lineY1 + gap} stroke="#64748b" strokeWidth={2} strokeLinecap="round" />
      <line x1={cx - l3 / 2} y1={lineY1 + gap * 2} x2={cx + l3 / 2} y2={lineY1 + gap * 2} stroke="#64748b" strokeWidth={2} strokeLinecap="round" />
      {/* GND label */}
      <text x={cx} y={h - 4} textAnchor="middle" fontSize="8" fill="#475569" fontWeight="bold">GND</text>
      {/* Dummy ref port at bottom - invisible lead */}
      <line x1={cx} y1={lineY1 + gap * 2 + 2} x2={cx} y2={h} stroke="transparent" strokeWidth={1} />
    </svg>
  )
}

// ─── INDUCTOR ────────────────────────────────────────────────────────────────
export function InductorSVG({ w, h, inductance = 10 }: { w: number; h: number; inductance?: number }) {
  const cy = h / 2
  const bx = w * 0.12, bw = w * 0.76
  const loopR = h * 0.22
  const loopY = cy
  const numLoops = 5
  const spacing = bw / (numLoops + 0.5)

  // Generate arc bumps for the coil
  const coilPath = () => {
    let d = `M ${bx} ${loopY}`
    for (let i = 0; i < numLoops; i++) {
      const x0 = bx + i * spacing
      const x1 = x0 + spacing
      const mx = (x0 + x1) / 2
      d += ` C ${x0 + spacing * 0.2} ${loopY - loopR * 2.2} ${mx - spacing * 0.05} ${loopY - loopR * 2.2} ${mx} ${loopY - loopR * 0.3}`
      d += ` C ${mx + spacing * 0.05} ${loopY - loopR * 2.2} ${x1 - spacing * 0.2} ${loopY - loopR * 2.2} ${x1} ${loopY}`
    }
    return d
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      {/* Leads */}
      <line x1={0} y1={cy} x2={bx} y2={cy} stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" />
      <line x1={bx + bw} y1={cy} x2={w} y2={cy} stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" />

      {/* Coil shadow */}
      <path d={coilPath()} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={4} strokeLinecap="round" transform="translate(1,2)" />
      {/* Coil */}
      <path d={coilPath()} fill="none" stroke="#b8860b" strokeWidth={3.5} strokeLinecap="round" />
      {/* Coil highlight */}
      <path d={coilPath()} fill="none" stroke="#ffd700" strokeWidth={1} strokeLinecap="round" opacity={0.5} />

      {/* Core line (ferrite) */}
      <line x1={bx} y1={loopY + 2} x2={bx + bw} y2={loopY + 2} stroke="#6b7280" strokeWidth={1} strokeDasharray="4 3" />

      {/* Value label */}
      <text x={w / 2} y={cy + loopR + 12} textAnchor="middle" fontSize="8" fill="#9ca3af">
        {inductance >= 1000 ? `${(inductance / 1000).toFixed(1)}H` : `${inductance}mH`}
      </text>
    </svg>
  )
}

// ─── POTENTIOMETER ───────────────────────────────────────────────────────────
export function PotentiometerSVG({ w, h, wiper = 50, resistance = 10000 }: { w: number; h: number; wiper?: number; resistance?: number }) {
  const bx = w * 0.10, bw = w * 0.80, bh = h * 0.48, by = h * 0.06
  const cx = w / 2, cy = by + bh / 2
  const knobR = bh * 0.30
  const knobCy = cy
  // Wiper angle: 0% = bottom-left, 100% = bottom-right
  const wiperAngle = (-140 + (wiper / 100) * 280) * (Math.PI / 180)
  const indLen = knobR * 0.55
  const indX = cx + Math.cos(wiperAngle) * indLen
  const indY = knobCy + Math.sin(wiperAngle) * indLen

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="pot-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
        <linearGradient id="pot-knob" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
      </defs>

      {/* A lead (left) */}
      <line x1={0} y1={cy} x2={bx} y2={cy} stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" />
      {/* B lead (right) */}
      <line x1={bx + bw} y1={cy} x2={w} y2={cy} stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" />
      {/* Wiper lead (bottom center) */}
      <line x1={cx} y1={by + bh} x2={cx} y2={h} stroke="#f59e0b" strokeWidth={1.5} strokeLinecap="round" />

      {/* Body shadow */}
      <rect x={bx + 1} y={by + 2} width={bw} height={bh} rx={3} fill="rgba(0,0,0,0.3)" />
      {/* Body */}
      <rect x={bx} y={by} width={bw} height={bh} rx={3} fill="url(#pot-body)" />
      <rect x={bx} y={by} width={bw} height={bh} rx={3} fill="none" stroke="#374151" strokeWidth={0.8} />

      {/* Resistance track arc (visual arc on the body) */}
      <path
        d={`M ${bx + bw * 0.12} ${knobCy + knobR * 0.7} A ${knobR * 1.05} ${knobR * 1.05} 0 1 1 ${bx + bw * 0.88} ${knobCy + knobR * 0.7}`}
        fill="none"
        stroke="#4b5563"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Knob */}
      <circle cx={cx} cy={knobCy} r={knobR + 2} fill="rgba(0,0,0,0.3)" />
      <circle cx={cx} cy={knobCy} r={knobR} fill="url(#pot-knob)" />
      <circle cx={cx} cy={knobCy} r={knobR} fill="none" stroke="#6b7280" strokeWidth={0.5} />
      {/* Knob highlight */}
      <circle cx={cx - knobR * 0.2} cy={knobCy - knobR * 0.25} r={knobR * 0.22} fill="rgba(255,255,255,0.15)" />
      {/* Wiper indicator line */}
      <line x1={cx} y1={knobCy} x2={indX} y2={indY} stroke="#f59e0b" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={cx} cy={knobCy} r={2} fill="#f59e0b" />

      {/* Labels */}
      <text x={bx + 3} y={by - 3} fontSize="7" fill="#6b7280">A</text>
      <text x={bx + bw - 8} y={by - 3} fontSize="7" fill="#6b7280">B</text>
      <text x={cx} y={h} textAnchor="middle" fontSize="7" fill="#f59e0b">W</text>

      {/* Value */}
      <text x={cx} y={by + bh + 11} textAnchor="middle" fontSize="7" fill="#6b7280">
        {resistance >= 1000 ? `${(resistance / 1000).toFixed(0)}kΩ` : `${resistance}Ω`} · {wiper}%
      </text>
    </svg>
  )
}

// ─── Main dispatcher ─────────────────────────────────────────────────────────
interface ComponentSVGProps {
  node: CircuitNode
  width: number
  height: number
  simulationActive: boolean
  ledOn: boolean
}

export function ComponentSVG({ node, width, height, simulationActive, ledOn }: ComponentSVGProps) {
  switch (node.type) {
    case 'resistor':
      return <ResistorSVG w={width} h={height} resistance={node.resistance ?? 220} />
    case 'led':
      return <LedSVG w={width} h={height} on={ledOn && simulationActive} color="#22c55e" />
    case 'diode':
      return <DiodeSVG w={width} h={height} forwardVoltage={node.forwardVoltage ?? 0.7} />
    case 'battery':
      return <BatterySVG w={width} h={height} voltage={node.voltage ?? 9} />
    case 'switch':
      return <SwitchSVG w={width} h={height} closed={node.isClosed ?? true} />
    case 'capacitor':
      return <CapacitorSVG w={width} h={height} capacitance={node.capacitance ?? 220} />
    case 'inductor':
      return <InductorSVG w={width} h={height} inductance={node.inductance ?? 10} />
    case 'transistor':
      return <TransistorSVG w={width} h={height} gain={node.gain ?? 120} />
    case 'potentiometer':
      return <PotentiometerSVG w={width} h={height} wiper={node.potentiometerWiper ?? 50} resistance={node.resistance ?? 10000} />
    case 'ground':
      return <GroundSVG w={width} h={height} />
    default:
      return null
  }
}
