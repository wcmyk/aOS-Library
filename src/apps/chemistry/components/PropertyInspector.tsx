/**
 * PropertyInspector – right panel showing selected object details
 * and action controls (heat, cool, measure, pour, clear).
 */

import React, { useState } from 'react';
import { useChemLabStore, useSelectedContainer, useSelectedInstrument } from '../state/useChemLabStore';
import { CHEMICALS } from '../data/chemicals';

function PropRow({ label, value, unit, highlight }: { label: string; value: string | number; unit?: string; highlight?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '4px 0', borderBottom: '1px solid rgba(100,130,170,0.07)',
    }}>
      <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.7)', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
        {label}
      </span>
      <span style={{
        fontSize: 11, fontWeight: 600, color: highlight ? '#7dd3fc' : '#e2e8f0',
        fontFamily: "'SF Mono', Menlo, monospace",
      }}>
        {typeof value === 'number' ? value.toFixed(typeof unit === 'string' && unit === '' ? 2 : 3) : value}
        {unit && <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.5)', marginLeft: 2 }}>{unit}</span>}
      </span>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, color: 'rgba(125,211,252,0.7)',
      letterSpacing: '0.08em', padding: '8px 0 3px',
      fontFamily: 'SF Pro Display, Inter, sans-serif',
      textTransform: 'uppercase',
    }}>
      {title}
    </div>
  );
}

function PillBadge({ label, color }: { label: string; color?: string }) {
  const c = color ?? '#60a5fa';
  return (
    <span style={{
      display: 'inline-block', padding: '2px 7px', borderRadius: 12,
      background: `${c}1a`, border: `1px solid ${c}44`,
      color: c, fontSize: 9, fontWeight: 600, marginRight: 4, marginBottom: 3,
      fontFamily: 'SF Pro Display, Inter, sans-serif',
    }}>
      {label}
    </span>
  );
}

function ActionButton({
  label, icon, onClick, variant = 'default', disabled = false,
}: {
  label: string; icon?: React.ReactNode; onClick: () => void;
  variant?: 'default' | 'danger' | 'success' | 'warning'; disabled?: boolean;
}) {
  const colors = {
    default: { bg: 'rgba(30,50,90,0.6)', border: 'rgba(100,140,180,0.3)', text: '#94a3b8', hover: 'rgba(40,65,110,0.8)' },
    danger:  { bg: 'rgba(70,20,20,0.6)', border: 'rgba(239,68,68,0.35)', text: '#fca5a5', hover: 'rgba(90,25,25,0.8)' },
    success: { bg: 'rgba(15,50,35,0.6)', border: 'rgba(52,211,153,0.35)', text: '#6ee7b7', hover: 'rgba(20,65,45,0.8)' },
    warning: { bg: 'rgba(60,40,10,0.6)', border: 'rgba(245,158,11,0.35)', text: '#fcd34d', hover: 'rgba(80,55,15,0.8)' },
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 9px', borderRadius: 5,
        border: `1px solid ${disabled ? 'rgba(60,80,100,0.2)' : colors.border}`,
        background: disabled ? 'rgba(20,30,50,0.3)' : colors.bg,
        color: disabled ? '#374151' : colors.text,
        fontSize: 10, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'SF Pro Display, Inter, sans-serif', fontWeight: 600,
        transition: 'all 0.15s', width: '100%', justifyContent: 'center',
        marginBottom: 4,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}

export function PropertyInspector() {
  const selectedContainer = useSelectedContainer();
  const selectedInstrument = useSelectedInstrument();
  const {
    removeContainer,
    clearContainer,
    heatContainer,
    coolContainer,
    measureContainerPH,
    measureContainerTemp,
    pourChemical,
    containers,
    selectedItemId,
    activateInstrument,
    deactivateInstrument,
  } = useChemLabStore();

  const [heatTarget, setHeatTarget] = useState(80);
  const [pourTarget, setPourTarget] = useState('');
  const [pourVolume, setPourVolume] = useState(25);
  const [lastPH, setLastPH] = useState<number | null>(null);
  const [lastTemp, setLastTemp] = useState<number | null>(null);

  if (!selectedContainer && !selectedInstrument) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: 'rgba(8,18,38,0.85)', padding: '14px 12px',
        justifyContent: 'center', alignItems: 'center',
      }}>
        <div style={{ opacity: 0.25 }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="4" y="10" width="28" height="20" rx="4" stroke="#94a3b8" strokeWidth="2" />
            <line x1="4" y1="17" x2="32" y2="17" stroke="#94a3b8" strokeWidth="1.5" />
            <circle cx="18" cy="24" r="3" stroke="#94a3b8" strokeWidth="1.5" />
          </svg>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)', textAlign: 'center', marginTop: 10, fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
          Click any container or<br />instrument to inspect.
        </div>
      </div>
    );
  }

  if (selectedInstrument) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: 'rgba(8,18,38,0.85)', overflowY: 'auto',
      }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(100,130,170,0.12)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7dd3fc', letterSpacing: '0.05em', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
            INSTRUMENT
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginTop: 2, fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
            {selectedInstrument.label}
          </div>
        </div>
        <div style={{ padding: '0 12px 12px' }}>
          <SectionHeader title="Status" />
          <PropRow label="Type" value={selectedInstrument.type.replace(/_/g, ' ')} />
          <PropRow label="Active" value={selectedInstrument.isActive ? 'Yes' : 'No'} highlight={selectedInstrument.isActive} />
          {selectedInstrument.currentReading !== undefined && (
            <PropRow label="Reading" value={selectedInstrument.currentReading.toFixed(2)} unit={selectedInstrument.readingUnit} />
          )}
          <div style={{ marginTop: 10 }}>
            {selectedInstrument.isActive ? (
              <ActionButton label="Deactivate" variant="warning" onClick={() => deactivateInstrument(selectedInstrument.id)} />
            ) : (
              <ActionButton label="Activate" variant="success" onClick={() => activateInstrument(selectedInstrument.id)} />
            )}
          </div>
        </div>
      </div>
    );
  }

  const cont = selectedContainer!;
  const mix = cont.mixture;
  const fillFrac = mix ? mix.totalVolumeML / cont.capacityML : 0;

  const otherContainers = containers.filter((c) => c.id !== cont.id && !c.isBroken);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'rgba(8,18,38,0.85)', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid rgba(100,130,170,0.12)', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#7dd3fc', letterSpacing: '0.05em', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
          {cont.type.replace(/_/g, ' ').toUpperCase()}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginTop: 2, fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
          {cont.label}
        </div>
        {/* Fill bar */}
        <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: 'rgba(30,50,80,0.8)' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${Math.min(100, fillFrac * 100).toFixed(1)}%`,
            background: fillFrac > 0.9 ? '#ef4444' : fillFrac > 0.5 ? '#7dd3fc' : '#3b82f6',
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, fontSize: 9, color: 'rgba(148,163,184,0.5)', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
          <span>{mix?.totalVolumeML.toFixed(1) ?? '0.0'} mL</span>
          <span>{cont.capacityML} mL cap.</span>
        </div>
      </div>

      <div style={{ padding: '0 12px 12px', flex: 1, overflowY: 'auto' }}>

        {/* Physical state */}
        <SectionHeader title="Physical State" />
        <PropRow label="Temperature" value={cont.temperatureC.toFixed(1)} unit="°C" highlight={cont.temperatureC > 50} />
        <PropRow label="Volume" value={mix?.totalVolumeML.toFixed(2) ?? '0.00'} unit="mL" />
        <PropRow label="pH" value={mix ? mix.pH.toFixed(2) : '—'} highlight={!!mix} />
        {lastPH !== null && (
          <div style={{ fontSize: 9, color: '#34d399', padding: '2px 0', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
            Last measured pH: {lastPH.toFixed(2)}
          </div>
        )}
        {lastTemp !== null && (
          <div style={{ fontSize: 9, color: '#f59e0b', padding: '2px 0', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
            Last measured temp: {lastTemp.toFixed(1)} °C
          </div>
        )}

        {/* Mixture status */}
        {mix && (
          <>
            <SectionHeader title="Mixture" />
            {mix.gasEvolved.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                {mix.gasEvolved.map((gId) => (
                  <PillBadge key={gId} label={`Gas: ${CHEMICALS[gId]?.formula ?? gId}`} color="#f59e0b" />
                ))}
              </div>
            )}
            {mix.hasPrecipitate && (
              <PillBadge label="Precipitate present" color="#a78bfa" />
            )}
            {mix.isCloudy && (
              <PillBadge label="Turbid" color="#94a3b8" />
            )}

            {/* Components */}
            {mix.components.length > 0 && (
              <>
                <SectionHeader title="Components" />
                {mix.components.map((comp) => {
                  const chem = CHEMICALS[comp.chemicalId];
                  const concMolar = mix.totalVolumeML > 0 ? comp.moles / (mix.totalVolumeML / 1000) : 0;
                  return (
                    <div key={comp.chemicalId} style={{
                      padding: '3px 0', borderBottom: '1px solid rgba(100,130,170,0.07)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, color: '#e2e8f0', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
                          {chem?.name ?? comp.chemicalId}
                        </span>
                        <span style={{ fontSize: 10, color: '#7dd3fc', fontFamily: "'SF Mono', Menlo, monospace" }}>
                          {comp.moles.toFixed(4)} mol
                        </span>
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.5)', fontFamily: "'SF Mono', Menlo, monospace" }}>
                        {concMolar.toFixed(4)} M &nbsp;·&nbsp; {chem?.formula}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* Measure actions */}
        <SectionHeader title="Measure" />
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          <button
            onClick={() => {
              const ph = measureContainerPH(cont.id);
              setLastPH(ph);
            }}
            disabled={!mix}
            style={{
              flex: 1, padding: '5px 6px', borderRadius: 5, border: 'none',
              background: mix ? 'rgba(52,211,153,0.15)' : 'rgba(20,30,50,0.3)',
              color: mix ? '#34d399' : '#374151', fontSize: 10, cursor: mix ? 'pointer' : 'not-allowed',
              fontFamily: 'SF Pro Display, Inter, sans-serif', fontWeight: 600,
            }}
          >
            Measure pH
          </button>
          <button
            onClick={() => {
              const t = measureContainerTemp(cont.id);
              setLastTemp(t);
            }}
            style={{
              flex: 1, padding: '5px 6px', borderRadius: 5, border: 'none',
              background: 'rgba(245,158,11,0.15)',
              color: '#f59e0b', fontSize: 10, cursor: 'pointer',
              fontFamily: 'SF Pro Display, Inter, sans-serif', fontWeight: 600,
            }}
          >
            Measure T°
          </button>
        </div>

        {/* Heat / cool */}
        <SectionHeader title="Heating" />
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
          <input
            type="number"
            value={heatTarget}
            min={22}
            max={350}
            onChange={(e) => setHeatTarget(parseInt(e.target.value) || 22)}
            style={{
              width: 54, padding: '4px 6px', borderRadius: 4,
              border: '1px solid rgba(100,140,180,0.3)',
              background: 'rgba(10,25,50,0.7)', color: '#e2e8f0', fontSize: 11,
              fontFamily: "'SF Mono', Menlo, monospace",
            }}
          />
          <span style={{ fontSize: 10, color: '#94a3b8' }}>°C</span>
          <button
            onClick={() => heatContainer(cont.id, heatTarget)}
            style={{
              flex: 1, padding: '4px 6px', borderRadius: 5, border: 'none',
              background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
              fontSize: 10, cursor: 'pointer', fontWeight: 600,
              fontFamily: 'SF Pro Display, Inter, sans-serif',
            }}
          >
            Heat
          </button>
          <button
            onClick={() => coolContainer(cont.id)}
            style={{
              padding: '4px 8px', borderRadius: 5, border: 'none',
              background: 'rgba(96,165,250,0.12)', color: '#93c5fd',
              fontSize: 10, cursor: 'pointer', fontWeight: 600,
              fontFamily: 'SF Pro Display, Inter, sans-serif',
            }}
          >
            Cool
          </button>
        </div>

        {/* Pour */}
        <SectionHeader title="Pour Into" />
        {otherContainers.length === 0 ? (
          <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.4)', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
            No other containers on bench.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 4, flexDirection: 'column', marginBottom: 4 }}>
            <select
              value={pourTarget}
              onChange={(e) => setPourTarget(e.target.value)}
              style={{
                padding: '4px 6px', borderRadius: 4,
                border: '1px solid rgba(100,140,180,0.3)',
                background: 'rgba(10,25,50,0.7)', color: '#e2e8f0', fontSize: 10,
                fontFamily: 'SF Pro Display, Inter, sans-serif',
              }}
            >
              <option value="">Select target…</option>
              {otherContainers.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input
                type="number"
                value={pourVolume}
                min={1}
                max={mix?.totalVolumeML ?? 100}
                onChange={(e) => setPourVolume(parseFloat(e.target.value) || 0)}
                style={{
                  width: 60, padding: '4px 6px', borderRadius: 4,
                  border: '1px solid rgba(100,140,180,0.3)',
                  background: 'rgba(10,25,50,0.7)', color: '#e2e8f0', fontSize: 11,
                  fontFamily: "'SF Mono', Menlo, monospace",
                }}
              />
              <span style={{ fontSize: 10, color: '#94a3b8' }}>mL</span>
              <button
                onClick={() => pourTarget && pourChemical(cont.id, pourTarget, pourVolume)}
                disabled={!pourTarget || !mix || pourVolume <= 0}
                style={{
                  flex: 1, padding: '4px 6px', borderRadius: 5, border: 'none',
                  background: pourTarget && mix ? 'rgba(125,211,252,0.15)' : 'rgba(20,30,50,0.3)',
                  color: pourTarget && mix ? '#7dd3fc' : '#374151',
                  fontSize: 10, cursor: (pourTarget && mix) ? 'pointer' : 'not-allowed',
                  fontWeight: 600, fontFamily: 'SF Pro Display, Inter, sans-serif',
                }}
              >
                Pour
              </button>
            </div>
          </div>
        )}

        {/* Danger zone */}
        <SectionHeader title="Actions" />
        <ActionButton
          label="Clear Contents"
          variant="warning"
          disabled={!mix}
          onClick={() => clearContainer(cont.id)}
        />
        <ActionButton
          label="Remove Container"
          variant="danger"
          onClick={() => removeContainer(cont.id)}
        />
      </div>
    </div>
  );
}
