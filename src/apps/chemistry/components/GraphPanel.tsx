/**
 * GraphPanel – vector-rendered graphs for experiment data.
 * Renders titration curves, temperature vs time, concentration trends.
 * Uses pure SVG — no chart library dependency.
 */

import React, { useMemo } from 'react';
import { useChemLabStore } from '../state/useChemLabStore';
import type { GraphSeries, GraphDataPoint } from '../types';

interface AxisRange {
  min: number;
  max: number;
}

function computeRange(points: GraphDataPoint[], axis: 'x' | 'y'): AxisRange {
  if (points.length === 0) return { min: 0, max: 1 };
  const vals = points.map((p) => (axis === 'x' ? p.x : p.y));
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pad = (max - min) * 0.1 || 1;
  return { min: min - pad, max: max + pad };
}

function mapToCanvas(val: number, range: AxisRange, size: number): number {
  const { min, max } = range;
  return ((val - min) / (max - min)) * size;
}

function formatNum(n: number): string {
  if (Math.abs(n) >= 1000) return n.toFixed(0);
  if (Math.abs(n) >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

interface SeriesChartProps {
  series: GraphSeries;
  width?: number;
  height?: number;
}

function SeriesChart({ series, width = 400, height = 200 }: SeriesChartProps) {
  const PAD = { left: 42, right: 16, top: 18, bottom: 36 };
  const W = width - PAD.left - PAD.right;
  const H = height - PAD.top - PAD.bottom;

  const xRange = useMemo(() => computeRange(series.points, 'x'), [series.points]);
  const yRange = useMemo(() => computeRange(series.points, 'y'), [series.points]);

  const pts = useMemo(() =>
    series.points.map((p) => ({
      cx: PAD.left + mapToCanvas(p.x, xRange, W),
      cy: PAD.top + H - mapToCanvas(p.y, yRange, H),
      x: p.x, y: p.y,
    })),
    [series.points, xRange, yRange, W, H, PAD.left, PAD.top],
  );

  const polyline = pts.map((p) => `${p.cx},${p.cy}`).join(' ');

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const range = yRange.max - yRange.min;
    const step = range / 4;
    return Array.from({ length: 5 }, (_, i) => yRange.min + step * i);
  }, [yRange]);

  // X-axis ticks
  const xTicks = useMemo(() => {
    const range = xRange.max - xRange.min;
    const step = range / 4;
    return Array.from({ length: 5 }, (_, i) => xRange.min + step * i);
  }, [xRange]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'visible' }}
    >
      {/* Background */}
      <rect x={PAD.left} y={PAD.top} width={W} height={H}
        fill="rgba(10,20,40,0.5)" stroke="rgba(100,130,170,0.15)" strokeWidth={1} rx={3} />

      {/* Grid lines */}
      {yTicks.map((v, i) => {
        const y = PAD.top + H - mapToCanvas(v, yRange, H);
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={PAD.left + W} y2={y}
              stroke="rgba(100,130,170,0.12)" strokeWidth={0.8} strokeDasharray="3 3" />
            <text x={PAD.left - 4} y={y + 3} textAnchor="end"
              fontSize="8" fill="rgba(148,163,184,0.5)"
              fontFamily="'SF Mono', Menlo, monospace">
              {formatNum(v)}
            </text>
          </g>
        );
      })}
      {xTicks.map((v, i) => {
        const x = PAD.left + mapToCanvas(v, xRange, W);
        return (
          <g key={i}>
            <line x1={x} y1={PAD.top} x2={x} y2={PAD.top + H}
              stroke="rgba(100,130,170,0.12)" strokeWidth={0.8} strokeDasharray="3 3" />
            <text x={x} y={PAD.top + H + 13} textAnchor="middle"
              fontSize="8" fill="rgba(148,163,184,0.5)"
              fontFamily="'SF Mono', Menlo, monospace">
              {formatNum(v)}
            </text>
          </g>
        );
      })}

      {/* Data line */}
      {pts.length > 1 && (
        <polyline
          points={polyline}
          fill="none"
          stroke={series.color}
          strokeWidth={1.8}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Area under line (subtle fill) */}
      {pts.length > 1 && (
        <polygon
          points={`${PAD.left},${PAD.top + H} ${polyline} ${PAD.left + W},${PAD.top + H}`}
          fill={`${series.color}12`}
        />
      )}

      {/* Data points */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r={2.5}
          fill={series.color} fillOpacity={0.85} stroke="rgba(10,20,40,0.8)" strokeWidth={0.8} />
      ))}

      {/* Axes */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + H}
        stroke="rgba(100,130,170,0.4)" strokeWidth={1} />
      <line x1={PAD.left} y1={PAD.top + H} x2={PAD.left + W} y2={PAD.top + H}
        stroke="rgba(100,130,170,0.4)" strokeWidth={1} />

      {/* Axis labels */}
      <text x={PAD.left + W / 2} y={height - 4} textAnchor="middle"
        fontSize="9" fill="rgba(148,163,184,0.6)"
        fontFamily="SF Pro Display, Inter, sans-serif">
        {series.xLabel}
      </text>
      <text
        x={10}
        y={PAD.top + H / 2}
        textAnchor="middle"
        fontSize="9"
        fill="rgba(148,163,184,0.6)"
        fontFamily="SF Pro Display, Inter, sans-serif"
        transform={`rotate(-90, 10, ${PAD.top + H / 2})`}
      >
        {series.yLabel}
      </text>

      {/* Title */}
      <text x={PAD.left + W / 2} y={PAD.top - 6} textAnchor="middle"
        fontSize="10" fontWeight="600" fill={series.color}
        fontFamily="SF Pro Display, Inter, sans-serif">
        {series.name}
      </text>
    </svg>
  );
}

export function GraphPanel() {
  const graphs = useChemLabStore((s) => s.graphs);
  const clearGraphSeries = useChemLabStore((s) => s.clearGraphSeries);

  if (graphs.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: 'rgba(8,18,38,0.9)', justifyContent: 'center', alignItems: 'center',
        padding: 20,
      }}>
        <div style={{ opacity: 0.25 }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <polyline points="4,28 10,18 16,22 22,10 28,14 32,6"
              stroke="#7dd3fc" strokeWidth="2" fill="none" strokeLinejoin="round" />
            <line x1="4" y1="28" x2="32" y2="28" stroke="#7dd3fc" strokeWidth="1.5" />
            <line x1="4" y1="4" x2="4" y2="28" stroke="#7dd3fc" strokeWidth="1.5" />
          </svg>
        </div>
        <div style={{ marginTop: 10, fontSize: 10, color: 'rgba(148,163,184,0.4)', textAlign: 'center', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
          No graph data yet.<br />Run an experiment to generate plots.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'rgba(8,18,38,0.9)', overflowY: 'auto', padding: '12px',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: '#7dd3fc', letterSpacing: '0.05em',
        marginBottom: 12, fontFamily: 'SF Pro Display, Inter, sans-serif',
      }}>
        DATA GRAPHS
      </div>
      {graphs.map((series) => (
        <div key={series.id} style={{
          background: 'rgba(12,25,50,0.7)', borderRadius: 8,
          border: '1px solid rgba(100,130,170,0.15)', padding: '12px',
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: series.color, fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
              {series.name}
            </div>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.5)', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
                {series.points.length} pts
              </span>
              <button
                onClick={() => clearGraphSeries(series.id)}
                style={{
                  padding: '2px 7px', borderRadius: 4, border: 'none',
                  background: 'rgba(30,50,80,0.6)', color: '#64748b',
                  fontSize: 9, cursor: 'pointer', fontFamily: 'SF Pro Display, Inter, sans-serif',
                }}
              >
                Clear
              </button>
            </div>
          </div>
          {series.points.length < 2 ? (
            <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.4)', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
                Need at least 2 data points to plot.
              </span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <SeriesChart series={series} width={320} height={180} />
            </div>
          )}
          {/* Data table */}
          {series.points.length > 0 && (
            <div style={{ marginTop: 8, maxHeight: 80, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '2px 6px', textAlign: 'left', color: 'rgba(148,163,184,0.5)', fontFamily: 'SF Pro Display, Inter, sans-serif', borderBottom: '1px solid rgba(100,130,170,0.12)' }}>
                      {series.xLabel}
                    </th>
                    <th style={{ padding: '2px 6px', textAlign: 'right', color: 'rgba(148,163,184,0.5)', fontFamily: 'SF Pro Display, Inter, sans-serif', borderBottom: '1px solid rgba(100,130,170,0.12)' }}>
                      {series.yLabel}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {series.points.map((pt, i) => (
                    <tr key={i}>
                      <td style={{ padding: '2px 6px', fontFamily: "'SF Mono', Menlo, monospace", color: '#94a3b8' }}>
                        {pt.x.toFixed(2)}
                      </td>
                      <td style={{ padding: '2px 6px', textAlign: 'right', fontFamily: "'SF Mono', Menlo, monospace", color: series.color }}>
                        {pt.y.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
