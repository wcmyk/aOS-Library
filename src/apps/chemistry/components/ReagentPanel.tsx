/**
 * ReagentPanel – left-side chemical inventory panel
 * Allows users to drag chemicals onto containers or click to add measured amounts.
 */

import React, { useState } from 'react';
import { CHEMICAL_LIST } from '../data/chemicals';
import type { Chemical } from '../types';
import { useChemLabStore } from '../state/useChemLabStore';

const HAZARD_COLORS: Record<string, string> = {
  corrosive: '#f59e0b',
  toxic: '#ef4444',
  flammable: '#f97316',
  oxidizer: '#a78bfa',
  irritant: '#facc15',
  explosive: '#ef4444',
  none: '#374151',
};

const HAZARD_LABELS: Record<string, string> = {
  corrosive: 'C',
  toxic: 'T',
  flammable: 'F',
  oxidizer: 'O',
  irritant: 'I',
  explosive: 'E',
};

function HazardBadge({ hazard }: { hazard: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 14, height: 14, borderRadius: 3,
      background: `${HAZARD_COLORS[hazard] ?? '#374151'}22`,
      border: `1px solid ${HAZARD_COLORS[hazard] ?? '#374151'}55`,
      color: HAZARD_COLORS[hazard] ?? '#6b7280',
      fontSize: 8, fontWeight: 700, marginRight: 2,
      fontFamily: 'SF Pro Display, Inter, sans-serif',
    }}>
      {HAZARD_LABELS[hazard] ?? '?'}
    </span>
  );
}

function ChemicalRow({
  chem,
  onAddToSelected,
  canAdd,
}: {
  chem: Chemical;
  onAddToSelected: (chem: Chemical, amount: number, unit: 'mL' | 'g') => void;
  canAdd: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [amount, setAmount] = useState(10);
  const [unit, setUnit] = useState<'mL' | 'g'>('mL');

  return (
    <div
      style={{
        borderRadius: 6,
        border: '1px solid rgba(100,130,170,0.15)',
        background: 'rgba(15,30,55,0.5)',
        marginBottom: 4,
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded((e) => !e)}
    >
      {/* Row header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '5px 8px', gap: 6 }}>
        {/* Color swatch */}
        <div style={{
          width: 10, height: 10, borderRadius: 2, flexShrink: 0,
          background: chem.color !== 'rgba(255,255,255,0)' ? chem.color : chem.solidColor,
          border: '1px solid rgba(180,210,240,0.2)',
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.2, fontFamily: 'SF Pro Display, Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {chem.name}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.8)', fontFamily: "'SF Mono', Menlo, monospace" }}>
            {chem.formula}
          </div>
        </div>
        {/* Hazard badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {chem.hazards.filter((h) => h !== 'none').map((h) => (
            <HazardBadge key={h} hazard={h} />
          ))}
        </div>
        <svg width="10" height="10" viewBox="0 0 10 10" style={{ opacity: 0.4, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
          <path d="M 2 3 L 5 7 L 8 3" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Expanded: add controls */}
      {expanded && (
        <div
          style={{ padding: '6px 8px 8px', borderTop: '1px solid rgba(100,130,170,0.1)', background: 'rgba(10,20,40,0.4)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.7)', marginBottom: 4, fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
            {chem.description}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.6)', marginBottom: 6, fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
            MM: {chem.molarMass.toFixed(2)} g/mol &nbsp;·&nbsp; {chem.phase}
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              type="number"
              value={amount}
              min={0.1}
              max={unit === 'mL' ? 500 : 100}
              step={unit === 'mL' ? 5 : 0.5}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              style={{
                width: 52, padding: '3px 5px', borderRadius: 4, border: '1px solid rgba(100,140,180,0.3)',
                background: 'rgba(10,25,50,0.8)', color: '#e2e8f0', fontSize: 11,
                fontFamily: "'SF Mono', Menlo, monospace",
              }}
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as 'mL' | 'g')}
              style={{
                padding: '3px 4px', borderRadius: 4, border: '1px solid rgba(100,140,180,0.3)',
                background: 'rgba(10,25,50,0.8)', color: '#94a3b8', fontSize: 10,
                fontFamily: 'SF Pro Display, Inter, sans-serif',
              }}
            >
              <option value="mL">mL</option>
              <option value="g">g</option>
            </select>
            <button
              disabled={!canAdd}
              onClick={() => onAddToSelected(chem, amount, unit)}
              style={{
                flex: 1, padding: '3px 6px', borderRadius: 4, border: 'none',
                background: canAdd ? 'rgba(125,211,252,0.15)' : 'rgba(60,80,100,0.3)',
                color: canAdd ? '#7dd3fc' : '#6b7280',
                fontSize: 10, cursor: canAdd ? 'pointer' : 'not-allowed',
                fontFamily: 'SF Pro Display, Inter, sans-serif', fontWeight: 600,
                transition: 'background 0.2s',
              }}
            >
              Add →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ReagentPanelProps {
  selectedContainerId: string | null;
}

export function ReagentPanel({ selectedContainerId }: ReagentPanelProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'acid' | 'base' | 'salt' | 'indicator'>('all');
  const addChemical = useChemLabStore((s) => s.addChemicalToContainer);

  const filtered = CHEMICAL_LIST.filter((c) => {
    const q = search.toLowerCase();
    if (q && !c.name.toLowerCase().includes(q) && !c.formula.toLowerCase().includes(q)) return false;
    if (filterType === 'acid' && !c.isAcid) return false;
    if (filterType === 'base' && !c.isBase) return false;
    if (filterType === 'indicator' && !['phenolphthalein', 'methyl_orange', 'universal_indicator'].includes(c.id)) return false;
    if (filterType === 'salt' && (c.isAcid || c.isBase || ['phenolphthalein', 'methyl_orange', 'universal_indicator', 'H2O', 'CO2'].includes(c.id))) return false;
    return true;
  });

  const handleAdd = (chem: Chemical, amount: number, unit: 'mL' | 'g') => {
    if (!selectedContainerId) return;
    addChemical(selectedContainerId, chem.id, amount, unit, chem.concentrationDefault);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'rgba(8,18,38,0.85)',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px 8px',
        borderBottom: '1px solid rgba(100,130,170,0.12)',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#7dd3fc', letterSpacing: '0.05em', marginBottom: 8, fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
          REAGENT INVENTORY
        </div>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 6 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
            <circle cx="5" cy="5" r="3.5" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="7.5" y1="7.5" x2="11" y2="11" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search chemicals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '5px 8px 5px 24px', borderRadius: 5,
              border: '1px solid rgba(100,140,180,0.2)',
              background: 'rgba(10,25,50,0.7)', color: '#e2e8f0', fontSize: 10,
              boxSizing: 'border-box', fontFamily: 'SF Pro Display, Inter, sans-serif',
              outline: 'none',
            }}
          />
        </div>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 3 }}>
          {(['all', 'acid', 'base', 'salt', 'indicator'] as const).map((t) => (
            <button key={t} onClick={() => setFilterType(t)} style={{
              flex: 1, padding: '3px 0', borderRadius: 4, border: 'none',
              background: filterType === t ? 'rgba(125,211,252,0.18)' : 'rgba(30,50,80,0.5)',
              color: filterType === t ? '#7dd3fc' : '#64748b',
              fontSize: 9, cursor: 'pointer', textTransform: 'capitalize',
              fontFamily: 'SF Pro Display, Inter, sans-serif', fontWeight: filterType === t ? 700 : 400,
              transition: 'all 0.15s',
            }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Help text */}
      {!selectedContainerId && (
        <div style={{
          padding: '8px 12px', fontSize: 9, color: 'rgba(148,163,184,0.6)',
          fontStyle: 'italic', fontFamily: 'SF Pro Display, Inter, sans-serif',
          borderBottom: '1px solid rgba(100,130,170,0.08)',
        }}>
          Select a container on the bench to add chemicals.
        </div>
      )}
      {selectedContainerId && (
        <div style={{
          padding: '6px 12px', fontSize: 9, color: 'rgba(52,211,153,0.8)',
          fontFamily: 'SF Pro Display, Inter, sans-serif',
          borderBottom: '1px solid rgba(100,130,170,0.08)',
        }}>
          Container selected — expand a reagent to add.
        </div>
      )}

      {/* Chemical list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        {filtered.length === 0 && (
          <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', textAlign: 'center', padding: '20px 0', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
            No chemicals match filter.
          </div>
        )}
        {filtered.map((chem) => (
          <ChemicalRow
            key={chem.id}
            chem={chem}
            onAddToSelected={handleAdd}
            canAdd={!!selectedContainerId}
          />
        ))}
      </div>

      {/* Hazard legend */}
      <div style={{
        padding: '6px 10px',
        borderTop: '1px solid rgba(100,130,170,0.1)',
        display: 'flex', gap: 6, flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        {Object.entries(HAZARD_LABELS).slice(0, 5).map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <HazardBadge hazard={key} />
            <span style={{ fontSize: 8, color: 'rgba(148,163,184,0.5)', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
