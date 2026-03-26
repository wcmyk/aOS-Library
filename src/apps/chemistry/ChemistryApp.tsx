/**
 * ChemistryApp – main entry point for the aOS Chemistry Lab Simulator.
 *
 * Layout:
 *  ┌─────────────┬──────────────────────────────┬─────────────────┐
 *  │ Reagent     │         Lab Bench             │  Property       │
 *  │ Panel       │    (central workspace)        │  Inspector      │
 *  │ (left)      │                               │  (right)        │
 *  ├─────────────┴──────────────────────────────┴─────────────────┤
 *  │ Bottom tabs: Notebook | Graphs | Guided Experiments | Safety  │
 *  └──────────────────────────────────────────────────────────────┘
 */

import React, { useState } from 'react';
import { useChemLabStore, useActiveHazards } from './state/useChemLabStore';
import { LabBench } from './components/LabBench';
import { ReagentPanel } from './components/ReagentPanel';
import { PropertyInspector } from './components/PropertyInspector';
import { LabNotebook } from './components/LabNotebook';
import { GraphPanel } from './components/GraphPanel';
import { SafetyPanel, HazardToast } from './components/SafetyPanel';
import { GuidedExperimentPanel } from './components/GuidedExperiment';

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

type BottomTab = 'notebook' | 'graphs' | 'experiment' | 'safety';

interface TabButtonProps {
  tab: BottomTab;
  active: boolean;
  label: string;
  badge?: number;
  icon: React.ReactNode;
  onClick: () => void;
}

function TabButton({ tab, active, label, badge, icon, onClick }: TabButtonProps) {
  const accentColor = tab === 'safety' ? '#f59e0b' : '#7dd3fc';
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 12px', borderRadius: 5,
        border: active ? `1px solid ${accentColor}44` : '1px solid transparent',
        background: active ? `${accentColor}14` : 'transparent',
        color: active ? accentColor : 'rgba(148,163,184,0.55)',
        fontSize: 10, cursor: 'pointer', fontWeight: active ? 700 : 400,
        fontFamily: 'SF Pro Display, Inter, sans-serif',
        transition: 'all 0.15s',
        position: 'relative',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span style={{
          position: 'absolute', top: 2, right: 4,
          minWidth: 14, height: 14, borderRadius: 7,
          background: tab === 'safety' ? '#ef4444' : '#7dd3fc',
          color: '#0f1218', fontSize: 8, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 3px',
        }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

// ─── Mode Toggle ──────────────────────────────────────────────────────────────

function ModeToggle() {
  const mode = useChemLabStore((s) => s.mode);
  const currentExp = useChemLabStore((s) => s.currentExperimentId);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '4px 6px',
      borderRadius: 6,
      border: '1px solid rgba(100,130,170,0.15)',
      background: 'rgba(10,20,45,0.6)',
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: 4,
        background: mode === 'guided' ? '#34d399' : '#7dd3fc',
        flexShrink: 0,
        boxShadow: `0 0 6px ${mode === 'guided' ? '#34d399' : '#7dd3fc'}`,
      }} />
      <span style={{
        fontSize: 9, fontWeight: 700,
        color: mode === 'guided' ? '#34d399' : '#7dd3fc',
        fontFamily: 'SF Pro Display, Inter, sans-serif',
        letterSpacing: '0.06em',
      }}>
        {mode === 'guided' && currentExp ? 'GUIDED' : mode.toUpperCase()}
      </span>
    </div>
  );
}

// ─── Header Bar ──────────────────────────────────────────────────────────────

function AppHeader() {
  const measurements = useChemLabStore((s) => s.measurements);
  const containers = useChemLabStore((s) => s.containers);
  const selectedId = useChemLabStore((s) => s.selectedItemId);
  const selectedContainer = containers.find((c) => c.id === selectedId);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 14px',
      borderBottom: '1px solid rgba(100,130,170,0.12)',
      background: 'rgba(8,15,32,0.96)',
      flexShrink: 0,
    }}>
      {/* App icon + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 6 }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M8 2L8 9L3 18L19 18L14 9L14 2Z" fill="none" stroke="#7dd3fc" strokeWidth="1.5" strokeLinejoin="round" />
          <line x1="7" y1="2" x2="15" y2="2" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="9" cy="13" r="1.5" fill="#a78bfa" />
          <circle cx="13" cy="15" r="1" fill="#34d399" />
        </svg>
        <span style={{
          fontSize: 13, fontWeight: 700, color: '#e2e8f0',
          fontFamily: 'SF Pro Display, Inter, sans-serif',
          letterSpacing: '-0.01em',
        }}>
          Chemistry Lab
        </span>
      </div>

      <ModeToggle />

      {/* Live readout: selected container */}
      {selectedContainer?.mixture && (
        <div style={{
          display: 'flex', gap: 12, padding: '3px 10px',
          borderRadius: 5, background: 'rgba(12,25,55,0.7)',
          border: '1px solid rgba(100,130,170,0.12)',
          fontSize: 10, fontFamily: "'SF Mono', Menlo, monospace",
        }}>
          <span style={{ color: '#94a3b8' }}>
            {selectedContainer.label}
          </span>
          <span style={{ color: '#7dd3fc' }}>
            pH {selectedContainer.mixture.pH.toFixed(2)}
          </span>
          <span style={{ color: '#f59e0b' }}>
            {selectedContainer.temperatureC.toFixed(1)}°C
          </span>
          <span style={{ color: '#34d399' }}>
            {selectedContainer.mixture.totalVolumeML.toFixed(1)} mL
          </span>
        </div>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.4)', fontFamily: "'SF Mono', Menlo, monospace" }}>
          {measurements.length} measurements
        </span>
        <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.4)', fontFamily: "'SF Mono', Menlo, monospace" }}>
          {containers.length} containers
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ChemistryApp() {
  const [bottomTab, setBottomTab] = useState<BottomTab>('notebook');
  const [bottomOpen, setBottomOpen] = useState(true);
  const activeHazards = useActiveHazards();
  const selectedItemId = useChemLabStore((s) => s.selectedItemId);
  const selectedItemType = useChemLabStore((s) => s.selectedItemType);
  const notebook = useChemLabStore((s) => s.notebook);
  const mode = useChemLabStore((s) => s.mode);
  const reagentPanelOpen = useChemLabStore((s) => s.reagentPanelOpen);
  const setReagentPanelOpen = useChemLabStore((s) => s.setReagentPanelOpen);

  const selectedContainerId = selectedItemType === 'container' ? selectedItemId : null;

  const BOTTOM_H = bottomOpen ? 220 : 34;
  const LEFT_W = reagentPanelOpen ? 190 : 32;
  const RIGHT_W = 210;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', width: '100%',
      background: '#060e1e',
      overflow: 'hidden',
      fontFamily: 'SF Pro Display, Inter, system-ui, sans-serif',
    }}>
      {/* Header */}
      <AppHeader />

      {/* Main workspace */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Left: Reagent Panel */}
        <div style={{
          width: LEFT_W, flexShrink: 0,
          borderRight: '1px solid rgba(100,130,170,0.12)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', transition: 'width 0.25s ease',
          position: 'relative',
        }}>
          {reagentPanelOpen ? (
            <ReagentPanel selectedContainerId={selectedContainerId} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 12 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="2" width="10" height="10" rx="2" stroke="#7dd3fc" strokeWidth="1.3" />
                <line x1="4" y1="5" x2="10" y2="5" stroke="#7dd3fc" strokeWidth="1" />
                <line x1="4" y1="7.5" x2="8" y2="7.5" stroke="#7dd3fc" strokeWidth="1" />
              </svg>
            </div>
          )}
          {/* Toggle button */}
          <button
            onClick={() => setReagentPanelOpen(!reagentPanelOpen)}
            style={{
              position: 'absolute', top: 10, right: -12, zIndex: 10,
              width: 22, height: 22, borderRadius: '50%',
              border: '1px solid rgba(100,130,170,0.25)',
              background: 'rgba(10,22,45,0.9)',
              color: '#7dd3fc', fontSize: 11, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0,
            }}
          >
            {reagentPanelOpen ? '‹' : '›'}
          </button>
        </div>

        {/* Center: Lab Bench */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <LabBench />
          {/* Hazard toast overlay */}
          {activeHazards.length > 0 && <HazardToast />}
        </div>

        {/* Right: Property Inspector */}
        <div style={{
          width: RIGHT_W, flexShrink: 0,
          borderLeft: '1px solid rgba(100,130,170,0.12)',
          overflow: 'hidden',
        }}>
          <PropertyInspector />
        </div>
      </div>

      {/* Bottom panel */}
      <div style={{
        height: BOTTOM_H, flexShrink: 0,
        borderTop: '1px solid rgba(100,130,170,0.12)',
        background: 'rgba(8,15,32,0.97)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', transition: 'height 0.25s ease',
      }}>
        {/* Tab bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          padding: '4px 8px',
          borderBottom: bottomOpen ? '1px solid rgba(100,130,170,0.1)' : 'none',
          flexShrink: 0,
        }}>
          <TabButton
            tab="notebook"
            active={bottomTab === 'notebook'}
            label="Lab Notebook"
            badge={notebook.length}
            icon={<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="1" y="1" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><line x1="3" y1="3.5" x2="8" y2="3.5" stroke="currentColor" strokeWidth="1"/><line x1="3" y1="5.5" x2="7" y2="5.5" stroke="currentColor" strokeWidth="1"/><line x1="3" y1="7.5" x2="6" y2="7.5" stroke="currentColor" strokeWidth="1"/></svg>}
            onClick={() => { setBottomTab('notebook'); setBottomOpen(true); }}
          />
          <TabButton
            tab="graphs"
            active={bottomTab === 'graphs'}
            label="Graphs"
            icon={<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><polyline points="1.5,8.5 3.5,5.5 5.5,6.5 7.5,3.5 9.5,2.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/><line x1="1.5" y1="8.5" x2="9.5" y2="8.5" stroke="currentColor" strokeWidth="1"/></svg>}
            onClick={() => { setBottomTab('graphs'); setBottomOpen(true); }}
          />
          <TabButton
            tab="experiment"
            active={bottomTab === 'experiment'}
            label={mode === 'guided' ? 'Experiment ●' : 'Experiments'}
            icon={<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M4 1L4 5L1.5 9L9.5 9L7 5L7 1Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>}
            onClick={() => { setBottomTab('experiment'); setBottomOpen(true); }}
          />
          <TabButton
            tab="safety"
            active={bottomTab === 'safety'}
            label="Safety"
            badge={activeHazards.length}
            icon={<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1L10 9H1Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><line x1="5.5" y1="4" x2="5.5" y2="6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="5.5" cy="7.8" r="0.6" fill="currentColor"/></svg>}
            onClick={() => { setBottomTab('safety'); setBottomOpen(true); }}
          />
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => setBottomOpen(!bottomOpen)}
              style={{
                padding: '4px 8px', borderRadius: 4, border: 'none',
                background: 'transparent', color: 'rgba(148,163,184,0.4)',
                fontSize: 11, cursor: 'pointer',
              }}
            >
              {bottomOpen ? '▼' : '▲'}
            </button>
          </div>
        </div>

        {/* Tab content */}
        {bottomOpen && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {bottomTab === 'notebook' && <LabNotebook />}
            {bottomTab === 'graphs' && <GraphPanel />}
            {bottomTab === 'experiment' && <GuidedExperimentPanel />}
            {bottomTab === 'safety' && <SafetyPanel />}
          </div>
        )}
      </div>
    </div>
  );
}
