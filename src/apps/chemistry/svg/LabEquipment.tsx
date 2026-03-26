/**
 * SVG Lab Equipment Components
 *
 * All lab equipment rendered as clean, precise SVG.
 * Liquid levels are driven by fill fraction (0–1).
 * Colors, precipitate, and gas effects are controlled via props.
 */

import React, { useId } from 'react';

// ─── Shared Helpers ───────────────────────────────────────────────────────────

/** Clamp a value between min and max */
const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** Liquid level animation keyframes */
const liquidStyle: React.CSSProperties = {
  transition: 'all 0.4s ease',
};

// ─── Beaker ───────────────────────────────────────────────────────────────────

interface BeakerProps {
  width?: number;
  height?: number;
  fill?: number;           // 0–1 fill fraction
  color?: string;
  precipitateColor?: string;
  hasPrecipitate?: boolean;
  isCloudy?: boolean;
  gasEvolved?: boolean;
  isHeating?: boolean;
  isSelected?: boolean;
  label?: string;
}

export function BeakerSVG({
  width = 80, height = 100,
  fill = 0, color = 'rgba(160,210,255,0.35)',
  precipitateColor = '#ffffff',
  hasPrecipitate = false,
  isCloudy = false,
  gasEvolved = false,
  isHeating = false,
  isSelected = false,
  label,
}: BeakerProps) {
  const uid = useId();
  const lw = width;
  const lh = height;
  const rim = 10;
  const wall = 4;
  const topW = lw - 8;
  const botW = lw - 20;
  const liquidH = Math.max(0, (lh - rim - wall) * clamp(fill));
  const liquidY = lh - wall - liquidH;

  return (
    <svg width={lw} height={lh + 16} viewBox={`0 0 ${lw} ${lh + 16}`}>
      <defs>
        <clipPath id={`beaker-clip-${uid}`}>
          <path d={`M ${wall} ${rim} L ${(lw - topW) / 2} ${rim} L ${(lw - botW) / 2} ${lh - wall} L ${(lw + botW) / 2} ${lh - wall} L ${(lw + topW) / 2} ${rim} Z`} />
        </clipPath>
        {gasEvolved && (
          <radialGradient id={`bubble-grad-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
          </radialGradient>
        )}
      </defs>

      {/* Liquid fill */}
      {fill > 0 && (
        <g clipPath={`url(#beaker-clip-${uid})`}>
          <rect
            x={(lw - botW) / 2}
            y={liquidY}
            width={botW + (topW - botW) * (liquidH / (lh - rim - wall))}
            height={liquidH + 2}
            fill={isCloudy ? `${precipitateColor}88` : color}
            style={liquidStyle}
          />
          {/* Precipitate layer */}
          {hasPrecipitate && (
            <rect
              x={(lw - botW) / 2}
              y={lh - wall - 8}
              width={botW}
              height={8}
              fill={precipitateColor}
              opacity={0.85}
            />
          )}
          {/* Bubbles (gas) */}
          {gasEvolved && [0.3, 0.55, 0.75].map((bx, i) => (
            <circle
              key={i}
              cx={lw * bx}
              cy={liquidY + liquidH * 0.5}
              r={2.5}
              fill={`url(#bubble-grad-${uid})`}
              style={{
                animation: `rise ${0.8 + i * 0.3}s ease-in infinite`,
                opacity: 0.75,
              }}
            />
          ))}
        </g>
      )}

      {/* Beaker outline */}
      <path
        d={`M ${(lw - topW) / 2} ${rim}
            L ${(lw - botW) / 2} ${lh - wall}
            L ${(lw + botW) / 2} ${lh - wall}
            L ${(lw + topW) / 2} ${rim}`}
        fill="none"
        stroke={isSelected ? '#7dd3fc' : 'rgba(180,210,240,0.75)'}
        strokeWidth={isSelected ? 2.5 : 1.5}
        strokeLinejoin="round"
      />
      {/* Bottom */}
      <line
        x1={(lw - botW) / 2} y1={lh - wall}
        x2={(lw + botW) / 2} y2={lh - wall}
        stroke={isSelected ? '#7dd3fc' : 'rgba(180,210,240,0.75)'}
        strokeWidth={isSelected ? 2.5 : 2}
      />
      {/* Rim (top flare) */}
      <line
        x1={(lw - topW) / 2 - 3} y1={rim}
        x2={(lw + topW) / 2 + 3} y2={rim}
        stroke={isSelected ? '#7dd3fc' : 'rgba(180,210,240,0.75)'}
        strokeWidth={isSelected ? 2.5 : 2}
        strokeLinecap="round"
      />
      {/* Pour spout */}
      <path
        d={`M ${(lw + topW) / 2 - 3} ${rim} Q ${(lw + topW) / 2 + 6} ${rim - 4} ${(lw + topW) / 2 + 3} ${rim + 3}`}
        fill="none"
        stroke="rgba(180,210,240,0.5)"
        strokeWidth={1}
      />
      {/* Graduation marks */}
      {[0.25, 0.5, 0.75].map((frac, i) => {
        const gy = lh - wall - (lh - rim - wall) * frac;
        return (
          <line key={i} x1={(lw - topW) / 2 + 2} y1={gy} x2={(lw - topW) / 2 + 8} y2={gy}
            stroke="rgba(120,160,190,0.5)" strokeWidth={0.8} />
        );
      })}
      {/* Heating glow */}
      {isHeating && (
        <ellipse cx={lw / 2} cy={lh + 4} rx={lw / 2 - 4} ry={4}
          fill="rgba(255,100,20,0.35)"
          style={{ animation: 'pulse 1s ease-in-out infinite alternate' }}
        />
      )}
      {/* Label */}
      {label && (
        <text x={lw / 2} y={lh + 14} textAnchor="middle"
          fontSize="9" fill="rgba(160,190,220,0.8)" fontFamily="SF Pro Display, Inter, sans-serif">
          {label}
        </text>
      )}
    </svg>
  );
}

// ─── Erlenmeyer Flask ─────────────────────────────────────────────────────────

interface ErlenmeyerProps {
  width?: number;
  height?: number;
  fill?: number;
  color?: string;
  precipitateColor?: string;
  hasPrecipitate?: boolean;
  isCloudy?: boolean;
  gasEvolved?: boolean;
  isHeating?: boolean;
  isSelected?: boolean;
  label?: string;
}

export function ErlenmeyerSVG({
  width = 80, height = 110,
  fill = 0, color = 'rgba(160,210,255,0.35)',
  precipitateColor = '#ffffff',
  hasPrecipitate = false,
  isCloudy = false,
  gasEvolved = false,
  isHeating = false,
  isSelected = false,
  label,
}: ErlenmeyerProps) {
  const uid = useId();
  const cx = width / 2;
  const neckTop = 12;
  const neckBot = 38;
  const neckW = 18;
  const bodyBot = height - 8;
  const bodyW = width - 10;

  // Liquid geometry: fill from bottom, constrained to flask shape
  const maxFill = height - neckBot - 8;
  const fillH = maxFill * clamp(fill);
  const fillY = bodyBot - fillH;

  // Build path for flask outline
  const path = [
    `M ${cx - neckW / 2} ${neckTop}`,
    `L ${cx - neckW / 2} ${neckBot}`,
    `Q ${cx - bodyW / 2} ${neckBot + 20} ${cx - bodyW / 2} ${bodyBot}`,
    `L ${cx + bodyW / 2} ${bodyBot}`,
    `Q ${cx + bodyW / 2} ${neckBot + 20} ${cx + neckW / 2} ${neckBot}`,
    `L ${cx + neckW / 2} ${neckTop}`,
  ].join(' ');

  return (
    <svg width={width} height={height + 16} viewBox={`0 0 ${width} ${height + 16}`}>
      <defs>
        <clipPath id={`erl-clip-${uid}`}>
          <path d={path} />
        </clipPath>
      </defs>

      {fill > 0 && (
        <g clipPath={`url(#erl-clip-${uid})`}>
          <rect
            x={cx - bodyW / 2}
            y={fillY}
            width={bodyW}
            height={fillH + 10}
            fill={isCloudy ? `${precipitateColor}88` : color}
            style={liquidStyle}
          />
          {hasPrecipitate && (
            <rect x={cx - bodyW / 2} y={bodyBot - 8} width={bodyW} height={8}
              fill={precipitateColor} opacity={0.85} />
          )}
          {gasEvolved && [0.4, 0.6].map((bx, i) => (
            <circle key={i} cx={cx - bodyW / 2 + bodyW * bx} cy={fillY + fillH * 0.5}
              r={2} fill="rgba(255,255,255,0.6)"
              style={{ animation: `rise ${0.7 + i * 0.35}s ease-in infinite` }} />
          ))}
        </g>
      )}

      {/* Outline */}
      <path d={path} fill="none"
        stroke={isSelected ? '#7dd3fc' : 'rgba(180,210,240,0.75)'}
        strokeWidth={isSelected ? 2.5 : 1.5} strokeLinejoin="round" />
      {/* Bottom */}
      <line x1={cx - bodyW / 2} y1={bodyBot} x2={cx + bodyW / 2} y2={bodyBot}
        stroke={isSelected ? '#7dd3fc' : 'rgba(180,210,240,0.75)'}
        strokeWidth={isSelected ? 2.5 : 2} />
      {/* Rim */}
      <line x1={cx - neckW / 2 - 3} y1={neckTop} x2={cx + neckW / 2 + 3} y2={neckTop}
        stroke={isSelected ? '#7dd3fc' : 'rgba(180,210,240,0.75)'}
        strokeWidth={isSelected ? 2.5 : 2} strokeLinecap="round" />

      {isHeating && (
        <ellipse cx={cx} cy={bodyBot + 4} rx={bodyW / 2 - 2} ry={4}
          fill="rgba(255,100,20,0.35)"
          style={{ animation: 'pulse 1s ease-in-out infinite alternate' }} />
      )}
      {label && (
        <text x={cx} y={height + 14} textAnchor="middle"
          fontSize="9" fill="rgba(160,190,220,0.8)" fontFamily="SF Pro Display, Inter, sans-serif">
          {label}
        </text>
      )}
    </svg>
  );
}

// ─── Test Tube ────────────────────────────────────────────────────────────────

export function TestTubeSVG({
  width = 30, height = 100,
  fill = 0, color = 'rgba(160,210,255,0.35)',
  precipitateColor = '#ffffff',
  hasPrecipitate = false,
  gasEvolved = false,
  isSelected = false,
  label,
}: {
  width?: number; height?: number; fill?: number; color?: string;
  precipitateColor?: string; hasPrecipitate?: boolean; gasEvolved?: boolean;
  isSelected?: boolean; label?: string;
}) {
  const uid = useId();
  const cx = width / 2;
  const tubeW = width - 4;
  const tubeTop = 8;
  const tubeBot = height - 10;
  const fillH = (tubeBot - tubeTop) * clamp(fill);
  const fillY = tubeBot - fillH;

  return (
    <svg width={width} height={height + 16} viewBox={`0 0 ${width} ${height + 16}`}>
      <defs>
        <clipPath id={`tt-clip-${uid}`}>
          <path d={`M ${cx - tubeW / 2} ${tubeTop} L ${cx - tubeW / 2} ${tubeBot - 5} Q ${cx} ${tubeBot + 5} ${cx + tubeW / 2} ${tubeBot - 5} L ${cx + tubeW / 2} ${tubeTop}`} />
        </clipPath>
      </defs>
      {fill > 0 && (
        <g clipPath={`url(#tt-clip-${uid})`}>
          <rect x={cx - tubeW / 2} y={fillY} width={tubeW} height={fillH + 10} fill={color} style={liquidStyle} />
          {hasPrecipitate && <rect x={cx - tubeW / 2} y={tubeBot - 8} width={tubeW} height={8} fill={precipitateColor} opacity={0.85} />}
          {gasEvolved && <circle cx={cx} cy={fillY + 4} r={2} fill="rgba(255,255,255,0.6)" style={{ animation: 'rise 0.8s ease-in infinite' }} />}
        </g>
      )}
      <path d={`M ${cx - tubeW / 2} ${tubeTop} L ${cx - tubeW / 2} ${tubeBot - 5} Q ${cx} ${tubeBot + 5} ${cx + tubeW / 2} ${tubeBot - 5} L ${cx + tubeW / 2} ${tubeTop}`}
        fill="none" stroke={isSelected ? '#7dd3fc' : 'rgba(180,210,240,0.75)'} strokeWidth={isSelected ? 2 : 1.5} />
      <line x1={cx - tubeW / 2 - 2} y1={tubeTop} x2={cx + tubeW / 2 + 2} y2={tubeTop}
        stroke={isSelected ? '#7dd3fc' : 'rgba(180,210,240,0.75)'} strokeWidth={isSelected ? 2 : 2} />
      {label && <text x={cx} y={height + 14} textAnchor="middle" fontSize="8" fill="rgba(160,190,220,0.8)" fontFamily="SF Pro Display, Inter, sans-serif">{label}</text>}
    </svg>
  );
}

// ─── Graduated Cylinder ───────────────────────────────────────────────────────

export function GradCylinderSVG({
  width = 40, height = 120,
  fill = 0, color = 'rgba(160,210,255,0.35)',
  isSelected = false, label,
}: {
  width?: number; height?: number; fill?: number; color?: string;
  isSelected?: boolean; label?: string;
}) {
  const uid = useId();
  const cx = width / 2;
  const cylW = width - 10;
  const baseW = width - 4;
  const top = 10;
  const bot = height - 12;
  const baseH = 8;
  const fillH = (bot - top) * clamp(fill);
  const fillY = bot - fillH;

  return (
    <svg width={width} height={height + 16} viewBox={`0 0 ${width} ${height + 16}`}>
      <defs><clipPath id={`gc-clip-${uid}`}><rect x={cx - cylW / 2} y={top} width={cylW} height={bot - top} /></clipPath></defs>
      {fill > 0 && (
        <g clipPath={`url(#gc-clip-${uid})`}>
          <rect x={cx - cylW / 2} y={fillY} width={cylW} height={fillH} fill={color} style={liquidStyle} />
        </g>
      )}
      {/* Cylinder */}
      <rect x={cx - cylW / 2} y={top} width={cylW} height={bot - top} fill="none"
        stroke={isSelected ? '#7dd3fc' : 'rgba(180,210,240,0.75)'} strokeWidth={isSelected ? 2 : 1.5} />
      {/* Base */}
      <rect x={cx - baseW / 2} y={bot} width={baseW} height={baseH} rx={2} fill="none"
        stroke={isSelected ? '#7dd3fc' : 'rgba(180,210,240,0.75)'} strokeWidth={isSelected ? 2 : 1.5} />
      {/* Graduation lines */}
      {[0.2, 0.4, 0.6, 0.8].map((frac, i) => {
        const gy = bot - (bot - top) * frac;
        return <line key={i} x1={cx - cylW / 2 + 1} y1={gy} x2={cx - cylW / 2 + 7} y2={gy}
          stroke="rgba(120,160,190,0.5)" strokeWidth={0.8} />;
      })}
      {/* Pour lip */}
      <path d={`M ${cx + cylW / 2} ${top} Q ${cx + cylW / 2 + 4} ${top - 3} ${cx + cylW / 2 + 2} ${top + 4}`}
        fill="none" stroke="rgba(180,210,240,0.6)" strokeWidth={1} />
      {label && <text x={cx} y={height + 14} textAnchor="middle" fontSize="9" fill="rgba(160,190,220,0.8)" fontFamily="SF Pro Display, Inter, sans-serif">{label}</text>}
    </svg>
  );
}

// ─── Burette ─────────────────────────────────────────────────────────────────

export function BuretteSVG({
  width = 28, height = 160,
  fill = 0, color = 'rgba(160,210,255,0.35)',
  isSelected = false, label,
}: {
  width?: number; height?: number; fill?: number; color?: string;
  isSelected?: boolean; label?: string;
}) {
  const uid = useId();
  const cx = width / 2;
  const tubeW = 12;
  const top = 12;
  const valveY = height - 28;
  const tipY = height - 4;
  const fillH = (valveY - top) * clamp(fill);
  const fillY = valveY - fillH;

  return (
    <svg width={width} height={height + 16} viewBox={`0 0 ${width} ${height + 16}`}>
      <defs><clipPath id={`bur-clip-${uid}`}><rect x={cx - tubeW / 2} y={top} width={tubeW} height={valveY - top} /></clipPath></defs>
      {fill > 0 && (
        <g clipPath={`url(#bur-clip-${uid})`}>
          <rect x={cx - tubeW / 2} y={fillY} width={tubeW} height={fillH} fill={color} style={liquidStyle} />
        </g>
      )}
      {/* Tube */}
      <rect x={cx - tubeW / 2} y={top} width={tubeW} height={valveY - top} fill="none"
        stroke={isSelected ? '#7dd3fc' : 'rgba(180,210,240,0.75)'} strokeWidth={isSelected ? 2 : 1.5} />
      {/* Top opening */}
      <line x1={cx - tubeW / 2 - 2} y1={top} x2={cx + tubeW / 2 + 2} y2={top}
        stroke={isSelected ? '#7dd3fc' : 'rgba(180,210,240,0.75)'} strokeWidth={isSelected ? 2 : 2} />
      {/* Stopcock / valve */}
      <rect x={cx - 7} y={valveY - 3} width={14} height={6} rx={3}
        fill={isSelected ? 'rgba(125,211,252,0.25)' : 'rgba(100,150,200,0.3)'}
        stroke={isSelected ? '#7dd3fc' : 'rgba(180,210,240,0.75)'} strokeWidth={1} />
      {/* Tip */}
      <path d={`M ${cx - 3} ${valveY + 3} L ${cx} ${tipY} L ${cx + 3} ${valveY + 3}`}
        fill="none" stroke={isSelected ? '#7dd3fc' : 'rgba(180,210,240,0.75)'} strokeWidth={1.5} />
      {/* Graduation marks */}
      {[0.2, 0.4, 0.6, 0.8].map((frac, i) => {
        const gy = top + (valveY - top) * frac;
        return <line key={i} x1={cx - tubeW / 2 + 1} y1={gy} x2={cx - tubeW / 2 + 5} y2={gy}
          stroke="rgba(120,160,190,0.5)" strokeWidth={0.8} />;
      })}
      {label && <text x={cx} y={height + 14} textAnchor="middle" fontSize="9" fill="rgba(160,190,220,0.8)" fontFamily="SF Pro Display, Inter, sans-serif">{label}</text>}
    </svg>
  );
}

// ─── Reagent Bottle ───────────────────────────────────────────────────────────

export function ReagentBottleSVG({
  width = 60, height = 90,
  color = 'rgba(160,210,255,0.35)',
  fill = 0.7,
  isSelected = false,
  label,
}: {
  width?: number; height?: number; color?: string; fill?: number;
  isSelected?: boolean; label?: string;
}) {
  const uid = useId();
  const cx = width / 2;
  const neckW = 16;
  const neckH = 18;
  const bodyW = width - 8;
  const bodyH = height - neckH - 8;
  const bodyY = neckH + 4;
  const fillH = bodyH * clamp(fill);
  const fillY = bodyY + bodyH - fillH;

  return (
    <svg width={width} height={height + 16} viewBox={`0 0 ${width} ${height + 16}`}>
      <defs>
        <clipPath id={`rb-clip-${uid}`}>
          <rect x={cx - bodyW / 2} y={bodyY} width={bodyW} height={bodyH} />
        </clipPath>
      </defs>
      {/* Bottle body */}
      {fill > 0 && (
        <g clipPath={`url(#rb-clip-${uid})`}>
          <rect x={cx - bodyW / 2} y={fillY} width={bodyW} height={fillH} fill={color} style={liquidStyle} rx={3} />
        </g>
      )}
      {/* Body outline */}
      <rect x={cx - bodyW / 2} y={bodyY} width={bodyW} height={bodyH} rx={4} fill="none"
        stroke={isSelected ? '#7dd3fc' : 'rgba(180,210,240,0.75)'} strokeWidth={isSelected ? 2 : 1.5} />
      {/* Neck */}
      <rect x={cx - neckW / 2} y={4} width={neckW} height={neckH} rx={2} fill="none"
        stroke={isSelected ? '#7dd3fc' : 'rgba(180,210,240,0.75)'} strokeWidth={isSelected ? 2 : 1.5} />
      {/* Cap */}
      <rect x={cx - neckW / 2 - 2} y={0} width={neckW + 4} height={8} rx={3}
        fill={isSelected ? 'rgba(125,211,252,0.25)' : 'rgba(100,150,200,0.3)'}
        stroke={isSelected ? '#7dd3fc' : 'rgba(160,190,230,0.5)'} strokeWidth={1} />
      {/* Label band */}
      <rect x={cx - bodyW / 2 + 4} y={bodyY + 8} width={bodyW - 8} height={bodyH * 0.45} rx={2}
        fill="rgba(255,255,255,0.07)" stroke="rgba(180,210,240,0.2)" strokeWidth={0.8} />
      {label && (
        <>
          <text x={cx} y={bodyY + 8 + bodyH * 0.22} textAnchor="middle"
            fontSize="7.5" fontWeight="600" fill="rgba(200,225,255,0.9)" fontFamily="SF Pro Display, Inter, sans-serif">
            {label.length > 8 ? label.slice(0, 8) : label}
          </text>
          <text x={cx} y={height + 14} textAnchor="middle"
            fontSize="8.5" fill="rgba(160,190,220,0.8)" fontFamily="SF Pro Display, Inter, sans-serif">
            {label}
          </text>
        </>
      )}
    </svg>
  );
}

// ─── Hot Plate ────────────────────────────────────────────────────────────────

export function HotPlateSVG({
  width = 90, height = 50,
  isActive = false, isSelected = false,
}: {
  width?: number; height?: number; isActive?: boolean; isSelected?: boolean;
}) {
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Base */}
      <rect x={2} y={12} width={width - 4} height={height - 14} rx={5}
        fill="rgba(30,45,70,0.9)" stroke={isSelected ? '#7dd3fc' : 'rgba(100,140,180,0.5)'} strokeWidth={isSelected ? 2 : 1.5} />
      {/* Heating surface */}
      <rect x={8} y={4} width={width - 16} height={14} rx={3}
        fill={isActive ? 'rgba(255,80,20,0.4)' : 'rgba(50,70,100,0.8)'}
        stroke={isActive ? 'rgba(255,100,40,0.8)' : 'rgba(100,140,180,0.4)'} strokeWidth={1.5}
        style={{ transition: 'fill 0.5s ease, stroke 0.5s ease' }} />
      {/* Heating coil pattern */}
      {isActive && (
        <path d="M 16 8 Q 24 5 32 8 Q 40 11 48 8 Q 56 5 64 8 Q 72 11 76 8"
          fill="none" stroke="rgba(255,120,30,0.7)" strokeWidth={1.5}
          style={{ animation: 'pulse 1.2s ease-in-out infinite alternate' }} />
      )}
      {/* Control knob */}
      <circle cx={width - 18} cy={height - 10} r={7}
        fill="rgba(40,60,90,0.9)" stroke="rgba(120,160,200,0.5)" strokeWidth={1} />
      <line x1={width - 18} y1={height - 17} x2={width - 18} y2={height - 13}
        stroke={isActive ? '#f59e0b' : 'rgba(120,160,200,0.5)'} strokeWidth={1.5} strokeLinecap="round" />
      {/* Power indicator LED */}
      <circle cx={12} cy={height - 10} r={3}
        fill={isActive ? '#ef4444' : 'rgba(60,80,110,0.8)'}
        style={{ transition: 'fill 0.3s' }} />
      <text x={width / 2 - 8} y={height - 8} fontSize="7" fill="rgba(140,170,210,0.7)"
        fontFamily="SF Pro Display, Inter, sans-serif" fontWeight="500">HOT PLATE</text>
    </svg>
  );
}

// ─── Bunsen Burner ────────────────────────────────────────────────────────────

export function BunsenBurnerSVG({
  width = 50, height = 90,
  isActive = false, isSelected = false,
}: {
  width?: number; height?: number; isActive?: boolean; isSelected?: boolean;
}) {
  const cx = width / 2;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Base */}
      <rect x={cx - 18} y={height - 14} width={36} height={14} rx={4}
        fill="rgba(30,45,70,0.9)" stroke={isSelected ? '#7dd3fc' : 'rgba(100,140,180,0.5)'} strokeWidth={isSelected ? 2 : 1.5} />
      {/* Barrel */}
      <rect x={cx - 6} y={height - 65} width={12} height={52} rx={3}
        fill="rgba(50,70,100,0.8)" stroke={isSelected ? '#7dd3fc' : 'rgba(100,140,180,0.5)'} strokeWidth={isSelected ? 2 : 1.5} />
      {/* Air hole collar */}
      <rect x={cx - 8} y={height - 34} width={16} height={8} rx={2}
        fill="rgba(40,60,90,0.9)" stroke="rgba(100,140,180,0.4)" strokeWidth={1} />
      {/* Gas inlet tube */}
      <line x1={cx - 6} y1={height - 20} x2={cx - 20} y2={height - 20}
        stroke="rgba(100,140,180,0.5)" strokeWidth={3} strokeLinecap="round" />
      {/* Flame */}
      {isActive && (
        <g style={{ animation: 'flicker 0.25s ease-in-out infinite alternate' }}>
          <ellipse cx={cx} cy={height - 72} rx={6} ry={14}
            fill="rgba(30,100,255,0.7)" />
          <ellipse cx={cx} cy={height - 79} rx={4} ry={10}
            fill="rgba(100,180,255,0.6)" />
          <ellipse cx={cx} cy={height - 84} rx={2.5} ry={6}
            fill="rgba(200,230,255,0.8)" />
        </g>
      )}
    </svg>
  );
}

// ─── Balance / Scale ──────────────────────────────────────────────────────────

export function BalanceSVG({
  width = 100, height = 70,
  reading = 0, isSelected = false,
}: {
  width?: number; height?: number; reading?: number; isSelected?: boolean;
}) {
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Platform base */}
      <rect x={8} y={height - 18} width={width - 16} height={18} rx={4}
        fill="rgba(30,45,70,0.95)" stroke={isSelected ? '#7dd3fc' : 'rgba(100,140,180,0.5)'} strokeWidth={isSelected ? 2 : 1.5} />
      {/* Weighing pan */}
      <rect x={14} y={height - 30} width={width - 28} height={12} rx={3}
        fill="rgba(50,75,110,0.8)" stroke={isSelected ? '#7dd3fc' : 'rgba(120,160,200,0.5)'} strokeWidth={1.5} />
      {/* Display */}
      <rect x={20} y={6} width={width - 40} height={height - 46} rx={3}
        fill="rgba(10,25,45,0.9)" stroke={isSelected ? '#7dd3fc' : 'rgba(80,120,160,0.5)'} strokeWidth={1} />
      <text x={width / 2} y={height - 42} textAnchor="middle"
        fontSize="10" fontFamily="'SF Mono', Menlo, monospace" fill="#34d399" fontWeight="600">
        {reading.toFixed(3)}
      </text>
      <text x={width / 2} y={height - 33} textAnchor="middle"
        fontSize="7" fontFamily="SF Pro Display, Inter, sans-serif" fill="rgba(100,160,120,0.7)">
        g
      </text>
    </svg>
  );
}

// ─── pH Meter ─────────────────────────────────────────────────────────────────

export function PHMeterSVG({
  width = 50, height = 110,
  reading = 7.0, isActive = false, isSelected = false,
}: {
  width?: number; height?: number; reading?: number; isActive?: boolean; isSelected?: boolean;
}) {
  const cx = width / 2;
  const pHColor = reading < 4 ? '#ef4444' : reading < 7 ? '#f59e0b' : reading < 10 ? '#34d399' : '#818cf8';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Body */}
      <rect x={4} y={4} width={width - 8} height={height - 30} rx={6}
        fill="rgba(20,35,60,0.95)" stroke={isSelected ? '#7dd3fc' : 'rgba(100,140,180,0.5)'} strokeWidth={isSelected ? 2 : 1.5} />
      {/* Screen */}
      <rect x={9} y={12} width={width - 18} height={height - 60} rx={3}
        fill={isActive ? 'rgba(10,25,45,0.95)' : 'rgba(10,20,40,0.9)'}
        stroke="rgba(80,120,160,0.4)" strokeWidth={1} />
      {isActive && (
        <>
          <text x={cx} y={height - 60} textAnchor="middle"
            fontSize="14" fontFamily="'SF Mono', Menlo, monospace" fill={pHColor} fontWeight="700">
            {reading.toFixed(2)}
          </text>
          <text x={cx} y={height - 47} textAnchor="middle"
            fontSize="7" fill="rgba(160,190,220,0.7)" fontFamily="SF Pro Display, Inter, sans-serif">
            pH
          </text>
        </>
      )}
      {/* Button */}
      <circle cx={cx} cy={height - 22} r={7} fill="rgba(40,60,90,0.9)"
        stroke={isActive ? '#34d399' : 'rgba(100,140,180,0.4)'} strokeWidth={1.5} />
      <text x={cx} y={height - 18} textAnchor="middle" fontSize="6"
        fill={isActive ? '#34d399' : 'rgba(120,160,200,0.6)'} fontFamily="SF Pro Display, Inter, sans-serif">
        ON
      </text>
      {/* Probe */}
      <line x1={cx} y1={height - 30} x2={cx} y2={height}
        stroke="rgba(100,140,180,0.6)" strokeWidth={2} strokeLinecap="round" />
      <ellipse cx={cx} cy={height} rx={3} ry={2}
        fill={isActive ? pHColor : 'rgba(100,140,180,0.5)'}
        style={{ transition: 'fill 0.5s' }} />
    </svg>
  );
}

// ─── Thermometer ─────────────────────────────────────────────────────────────

export function ThermometerSVG({
  width = 24, height = 110,
  tempC = 22, minC = 0, maxC = 120,
  isSelected = false,
}: {
  width?: number; height?: number; tempC?: number; minC?: number; maxC?: number; isSelected?: boolean;
}) {
  const cx = width / 2;
  const bulbR = 8;
  const bulbY = height - bulbR - 2;
  const tubeTop = 12;
  const tubeBot = bulbY - bulbR;
  const tubeH = tubeBot - tubeTop;
  const fillFrac = clamp((tempC - minC) / (maxC - minC));
  const mercuryH = tubeH * fillFrac;
  const tempColor = tempC > 80 ? '#ef4444' : tempC > 40 ? '#f59e0b' : '#60a5fa';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Tube outline */}
      <rect x={cx - 3} y={tubeTop} width={6} height={tubeH} rx={3}
        fill="rgba(200,230,255,0.1)" stroke={isSelected ? '#7dd3fc' : 'rgba(180,210,240,0.6)'} strokeWidth={1} />
      {/* Mercury fill */}
      <rect x={cx - 2} y={tubeBot - mercuryH} width={4} height={mercuryH}
        fill={tempColor} rx={2} style={liquidStyle} />
      {/* Bulb */}
      <circle cx={cx} cy={bulbY} r={bulbR}
        fill={tempColor} stroke={isSelected ? '#7dd3fc' : 'rgba(180,210,240,0.6)'} strokeWidth={1}
        style={liquidStyle} />
      {/* Tick marks */}
      {[0.25, 0.5, 0.75].map((frac, i) => {
        const ty = tubeBot - tubeH * frac;
        return <line key={i} x1={cx + 3} y1={ty} x2={cx + 7} y2={ty}
          stroke="rgba(160,190,220,0.5)" strokeWidth={0.8} />;
      })}
      {/* Top of tube */}
      <circle cx={cx} cy={tubeTop} r={3.5}
        fill="rgba(200,230,255,0.1)" stroke={isSelected ? '#7dd3fc' : 'rgba(180,210,240,0.6)'} strokeWidth={1} />
    </svg>
  );
}

// ─── Stirrer / Stir Bar indicator ─────────────────────────────────────────────

export function StirrerSVG({
  width = 60, height = 40, isActive = false, isSelected = false,
}: {
  width?: number; height?: number; isActive?: boolean; isSelected?: boolean;
}) {
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect x={4} y={8} width={width - 8} height={height - 12} rx={5}
        fill="rgba(30,45,70,0.9)" stroke={isSelected ? '#7dd3fc' : 'rgba(100,140,180,0.5)'} strokeWidth={isSelected ? 2 : 1.5} />
      <ellipse cx={width / 2} cy={height / 2 + 2} rx={14} ry={7}
        fill="none" stroke={isActive ? '#7dd3fc' : 'rgba(100,140,180,0.4)'} strokeWidth={1.2}
        strokeDasharray={isActive ? '4 2' : 'none'}
        style={isActive ? { animation: 'spin 0.8s linear infinite' } : undefined} />
      <line x1={width / 2 - 10} y1={height / 2 + 2} x2={width / 2 + 10} y2={height / 2 + 2}
        stroke={isActive ? '#a78bfa' : 'rgba(100,140,180,0.4)'} strokeWidth={1.5}
        style={isActive ? { animation: 'spin 0.8s linear infinite' } : undefined} />
      <text x={width / 2} y={height - 2} textAnchor="middle" fontSize="6"
        fill="rgba(140,170,210,0.6)" fontFamily="SF Pro Display, Inter, sans-serif">STIRRER</text>
    </svg>
  );
}

// ─── Generic Container Renderer ───────────────────────────────────────────────

import type { ContainerInstance } from '../types';

interface ContainerSVGProps {
  container: ContainerInstance;
  scale?: number;
}

export function ContainerSVG({ container, scale = 1 }: ContainerSVGProps) {
  const mix = container.mixture;
  const fill = mix ? mix.totalVolumeML / container.capacityML : 0;
  const color = mix?.color ?? 'rgba(160,210,255,0.35)';
  const props = {
    fill,
    color,
    precipitateColor: mix?.precipitateColor ?? '#ffffff',
    hasPrecipitate: mix?.hasPrecipitate ?? false,
    isCloudy: mix?.isCloudy ?? false,
    gasEvolved: (mix?.gasEvolved?.length ?? 0) > 0,
    isHeating: container.isOnHeatSource,
    isSelected: container.isSelected,
    label: container.label,
  };

  switch (container.type) {
    case 'beaker':
      return <BeakerSVG width={80 * scale} height={90 * scale} {...props} />;
    case 'erlenmeyer':
      return <ErlenmeyerSVG width={75 * scale} height={100 * scale} {...props} />;
    case 'test_tube':
      return <TestTubeSVG width={28 * scale} height={90 * scale} {...props} />;
    case 'graduated_cylinder':
      return <GradCylinderSVG width={38 * scale} height={110 * scale} fill={fill} color={color} isSelected={container.isSelected} label={container.label} />;
    case 'burette':
      return <BuretteSVG width={26 * scale} height={150 * scale} fill={fill} color={color} isSelected={container.isSelected} label={container.label} />;
    case 'reagent_bottle':
      return <ReagentBottleSVG width={55 * scale} height={80 * scale} fill={fill} color={color} isSelected={container.isSelected} label={container.label} />;
    default:
      return <BeakerSVG width={70 * scale} height={80 * scale} {...props} />;
  }
}
