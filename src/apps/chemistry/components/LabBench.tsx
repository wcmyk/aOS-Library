/**
 * LabBench – central workspace with drag-and-drop lab equipment.
 * Containers and instruments can be dragged, selected, and interacted with.
 * Drop-zone for pouring (drag one container onto another).
 */

import React, { useRef, useState, useCallback } from 'react';
import { useChemLabStore } from '../state/useChemLabStore';
import { ContainerSVG, HotPlateSVG, BalanceSVG, PHMeterSVG, ThermometerSVG, BunsenBurnerSVG, StirrerSVG } from '../svg/LabEquipment';
import type { ContainerInstance, InstrumentInstance } from '../types';

// ─── Bench Grid Background ────────────────────────────────────────────────────

function BenchGrid({ width, height }: { width: number; height: number }) {
  const GRID = 32;
  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.08 }}
    >
      <defs>
        <pattern id="bench-grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
          <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="#7dd3fc" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#bench-grid)" />
    </svg>
  );
}

// ─── Draggable Container ──────────────────────────────────────────────────────

interface DraggableContainerProps {
  container: ContainerInstance;
  onSelect: (id: string) => void;
  onMove: (id: string, pos: { x: number; y: number }) => void;
  onDrop: (draggedId: string, targetId: string) => void;
  benchRef: React.RefObject<HTMLDivElement>;
}

function DraggableContainer({ container, onSelect, onMove, onDrop, benchRef }: DraggableContainerProps) {
  const isDragging = useRef(false);
  const startMouse = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const [dropHighlight, setDropHighlight] = useState(false);
  const [isDraggingState, setIsDraggingState] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(container.id);
    isDragging.current = true;
    setIsDraggingState(true);
    startMouse.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...container.position };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = ev.clientX - startMouse.current.x;
      const dy = ev.clientY - startMouse.current.y;
      const rect = benchRef.current?.getBoundingClientRect();
      const maxX = (rect?.width ?? 800) - 100;
      const maxY = (rect?.height ?? 500) - 100;
      onMove(container.id, {
        x: Math.max(0, Math.min(maxX, startPos.current.x + dx)),
        y: Math.max(0, Math.min(maxY, startPos.current.y + dy)),
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      setIsDraggingState(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [container.id, container.position, benchRef, onSelect, onMove]);

  // Drop target: allow dragging another container over this one to pour
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDropHighlight(true);
  };
  const handleDragLeave = () => setDropHighlight(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropHighlight(false);
    const srcId = e.dataTransfer.getData('containerId');
    if (srcId && srcId !== container.id) {
      onDrop(srcId, container.id);
    }
  };
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('containerId', container.id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: container.position.x,
        top: container.position.y,
        zIndex: container.zIndex,
        cursor: isDraggingState ? 'grabbing' : 'grab',
        userSelect: 'none',
        filter: dropHighlight
          ? 'drop-shadow(0 0 8px rgba(125,211,252,0.7))'
          : container.isSelected
            ? 'drop-shadow(0 0 6px rgba(125,211,252,0.5))'
            : 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))',
        transition: isDraggingState ? 'none' : 'filter 0.2s',
        touchAction: 'none',
      }}
    >
      <ContainerSVG container={container} />
    </div>
  );
}

// ─── Draggable Instrument ─────────────────────────────────────────────────────

interface DraggableInstrumentProps {
  instrument: InstrumentInstance;
  onSelect: (id: string) => void;
  onMove: (id: string, pos: { x: number; y: number }) => void;
  benchRef: React.RefObject<HTMLDivElement>;
}

function InstrumentSVGSwitch({ inst }: { inst: InstrumentInstance }) {
  switch (inst.type) {
    case 'hot_plate':
      return <HotPlateSVG isActive={inst.isActive} isSelected={inst.isSelected} />;
    case 'balance':
      return <BalanceSVG reading={inst.currentReading ?? 0} isSelected={inst.isSelected} />;
    case 'ph_meter':
      return <PHMeterSVG reading={inst.currentReading ?? 7} isActive={inst.isActive} isSelected={inst.isSelected} />;
    case 'thermometer':
      return <ThermometerSVG tempC={inst.currentReading ?? 22} isSelected={inst.isSelected} />;
    case 'bunsen_burner':
      return <BunsenBurnerSVG isActive={inst.isActive} isSelected={inst.isSelected} />;
    case 'stirrer':
      return <StirrerSVG isActive={inst.isActive} isSelected={inst.isSelected} />;
    default:
      return (
        <div style={{
          width: 60, height: 40, borderRadius: 5,
          background: 'rgba(30,50,80,0.7)',
          border: inst.isSelected ? '2px solid #7dd3fc' : '1px solid rgba(100,140,180,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
            {inst.label}
          </span>
        </div>
      );
  }
}

function DraggableInstrument({ instrument, onSelect, onMove, benchRef }: DraggableInstrumentProps) {
  const isDragging = useRef(false);
  const startMouse = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(instrument.id);
    isDragging.current = true;
    startMouse.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...instrument.position };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = ev.clientX - startMouse.current.x;
      const dy = ev.clientY - startMouse.current.y;
      const rect = benchRef.current?.getBoundingClientRect();
      const maxX = (rect?.width ?? 800) - 100;
      const maxY = (rect?.height ?? 500) - 100;
      onMove(instrument.id, {
        x: Math.max(0, Math.min(maxX, startPos.current.x + dx)),
        y: Math.max(0, Math.min(maxY, startPos.current.y + dy)),
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [instrument.id, instrument.position, benchRef, onSelect, onMove]);

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: instrument.position.x,
        top: instrument.position.y,
        zIndex: instrument.zIndex,
        cursor: 'grab',
        userSelect: 'none',
        filter: instrument.isSelected
          ? 'drop-shadow(0 0 6px rgba(125,211,252,0.5))'
          : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        transition: 'filter 0.2s',
        touchAction: 'none',
      }}
    >
      <InstrumentSVGSwitch inst={instrument} />
    </div>
  );
}

// ─── Equipment Adder ──────────────────────────────────────────────────────────

type EquipmentType = { label: string; type: string; capacity?: number; icon: React.ReactNode };

const EQUIPMENT_PRESETS: EquipmentType[] = [
  { label: 'Beaker 250mL', type: 'beaker', capacity: 250, icon: <svg width="16" height="20" viewBox="0 0 16 20"><path d="M3 2L2 17L14 17L13 2Z" fill="none" stroke="#7dd3fc" strokeWidth="1.5" /><line x1="1.5" y1="2" x2="14.5" y2="2" stroke="#7dd3fc" strokeWidth="2" /></svg> },
  { label: 'Beaker 100mL', type: 'beaker', capacity: 100, icon: <svg width="14" height="16" viewBox="0 0 16 20"><path d="M3 2L2 17L14 17L13 2Z" fill="none" stroke="#7dd3fc" strokeWidth="1.5" /><line x1="1.5" y1="2" x2="14.5" y2="2" stroke="#7dd3fc" strokeWidth="2" /></svg> },
  { label: 'Erlenmeyer 250mL', type: 'erlenmeyer', capacity: 250, icon: <svg width="16" height="22" viewBox="0 0 16 22"><path d="M6 2L6 9L2 18L14 18L10 9L10 2Z" fill="none" stroke="#a78bfa" strokeWidth="1.5" /></svg> },
  { label: 'Test Tube', type: 'test_tube', capacity: 20, icon: <svg width="10" height="20" viewBox="0 0 10 20"><path d="M3 2L3 15Q5 18 7 15L7 2Z" fill="none" stroke="#7dd3fc" strokeWidth="1.5" /></svg> },
  { label: 'Grad. Cylinder 100mL', type: 'graduated_cylinder', capacity: 100, icon: <svg width="12" height="22" viewBox="0 0 12 22"><rect x="3" y="2" width="6" height="17" fill="none" stroke="#34d399" strokeWidth="1.5" /></svg> },
  { label: 'Burette 50mL', type: 'burette', capacity: 50, icon: <svg width="10" height="22" viewBox="0 0 10 22"><rect x="4" y="1" width="4" height="18" fill="none" stroke="#7dd3fc" strokeWidth="1.5" /><path d="M4.5 19L5 22L5.5 19Z" fill="none" stroke="#7dd3fc" strokeWidth="1" /></svg> },
  { label: 'Volumetric Flask 250mL', type: 'volumetric_flask', capacity: 250, icon: <svg width="16" height="22" viewBox="0 0 16 22"><circle cx="8" cy="16" r="6" fill="none" stroke="#a78bfa" strokeWidth="1.5" /><line x1="6" y1="2" x2="6" y2="10" stroke="#a78bfa" strokeWidth="1.5" /><line x1="10" y1="2" x2="10" y2="10" stroke="#a78bfa" strokeWidth="1.5" /></svg> },
];

interface EquipmentPaletteProps {
  onAdd: (type: string, capacity: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function EquipmentPalette({ onAdd, isOpen, onToggle }: EquipmentPaletteProps) {
  return (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 100 }}>
      <button
        onClick={onToggle}
        style={{
          padding: '6px 12px', borderRadius: 6,
          border: '1px solid rgba(125,211,252,0.3)',
          background: isOpen ? 'rgba(125,211,252,0.18)' : 'rgba(12,25,50,0.85)',
          color: '#7dd3fc', fontSize: 10, cursor: 'pointer',
          fontFamily: 'SF Pro Display, Inter, sans-serif', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6,
          backdropFilter: 'blur(6px)',
          letterSpacing: '0.04em',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <line x1="6" y1="1" x2="6" y2="11" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="1" y1="6" x2="11" y2="6" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Add Equipment
      </button>
      {isOpen && (
        <div style={{
          marginTop: 6,
          background: 'rgba(10,22,45,0.96)',
          border: '1px solid rgba(100,130,170,0.2)',
          borderRadius: 8,
          padding: '6px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', gap: 2,
          minWidth: 170,
        }}>
          {EQUIPMENT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => { onAdd(preset.type, preset.capacity ?? 100); onToggle(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 8px', borderRadius: 5, border: 'none',
                background: 'transparent', color: '#e2e8f0',
                fontSize: 10, cursor: 'pointer', textAlign: 'left',
                fontFamily: 'SF Pro Display, Inter, sans-serif',
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(125,211,252,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ flexShrink: 0, width: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {preset.icon}
              </span>
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Bench Toolbar ────────────────────────────────────────────────────────────

interface BenchToolbarProps {
  onReset: () => void;
  onClearBench: () => void;
}

function BenchToolbar({ onReset, onClearBench }: BenchToolbarProps) {
  return (
    <div style={{
      position: 'absolute', top: 10, right: 10, zIndex: 100,
      display: 'flex', gap: 6,
    }}>
      <button
        onClick={onClearBench}
        style={{
          padding: '5px 10px', borderRadius: 5, border: '1px solid rgba(100,130,170,0.2)',
          background: 'rgba(10,22,45,0.85)', color: '#64748b',
          fontSize: 9, cursor: 'pointer', fontFamily: 'SF Pro Display, Inter, sans-serif',
          backdropFilter: 'blur(6px)',
        }}
      >
        Clear Bench
      </button>
      <button
        onClick={onReset}
        style={{
          padding: '5px 10px', borderRadius: 5, border: '1px solid rgba(239,68,68,0.25)',
          background: 'rgba(10,22,45,0.85)', color: '#fca5a5',
          fontSize: 9, cursor: 'pointer', fontFamily: 'SF Pro Display, Inter, sans-serif',
          backdropFilter: 'blur(6px)',
        }}
      >
        Reset Lab
      </button>
    </div>
  );
}

// ─── Main LabBench ────────────────────────────────────────────────────────────

export function LabBench() {
  const {
    containers,
    instruments,
    selectedItemId,
    selectItem,
    moveContainer,
    moveInstrument,
    addContainer,
    pourChemical,
    bringToFront,
    resetLab,
  } = useChemLabStore();

  const benchRef = useRef<HTMLDivElement>(null);
  const [equipPaletteOpen, setEquipPaletteOpen] = useState(false);
  const [benchSize, setBenchSize] = useState({ width: 800, height: 500 });

  const handleResize = useCallback(() => {
    if (benchRef.current) {
      setBenchSize({
        width: benchRef.current.clientWidth,
        height: benchRef.current.clientHeight,
      });
    }
  }, []);

  React.useEffect(() => {
    const obs = new ResizeObserver(handleResize);
    if (benchRef.current) obs.observe(benchRef.current);
    handleResize();
    return () => obs.disconnect();
  }, [handleResize]);

  const handleSelectContainer = useCallback((id: string) => {
    selectItem(id, 'container');
    bringToFront(id);
  }, [selectItem, bringToFront]);

  const handleSelectInstrument = useCallback((id: string) => {
    selectItem(id, 'instrument');
    bringToFront(id);
  }, [selectItem, bringToFront]);

  const handleBenchClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-draggable]')) return;
    selectItem(null, null);
  }, [selectItem]);

  const handleDrop = useCallback((sourceId: string, targetId: string) => {
    // Dragging a container onto another pours 25mL (quick pour)
    const src = containers.find((c) => c.id === sourceId);
    if (src?.mixture) {
      const pourAmt = Math.min(25, src.mixture.totalVolumeML);
      pourChemical(sourceId, targetId, pourAmt);
    }
  }, [containers, pourChemical]);

  const handleAddEquipment = useCallback((type: string, capacity: number) => {
    const centerX = benchSize.width / 2 - 40 + (Math.random() - 0.5) * 100;
    const centerY = benchSize.height / 2 - 50 + (Math.random() - 0.5) * 60;
    addContainer(type as any, capacity, undefined, { x: centerX, y: centerY });
  }, [addContainer, benchSize]);

  const handleClearBench = useCallback(() => {
    containers.forEach((c) => useChemLabStore.getState().removeContainer(c.id));
  }, [containers]);

  return (
    <div
      ref={benchRef}
      onClick={handleBenchClick}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(160deg, rgba(8,18,38,0.95) 0%, rgba(12,24,50,0.98) 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Grid */}
      <BenchGrid width={benchSize.width} height={benchSize.height} />

      {/* Lab bench surface */}
      <div style={{
        position: 'absolute',
        left: 20, right: 20, bottom: 0, height: 40,
        background: 'linear-gradient(0deg, rgba(30,50,80,0.5) 0%, transparent 100%)',
        borderTop: '1px solid rgba(100,130,170,0.15)',
        pointerEvents: 'none',
      }} />

      {/* Instruments */}
      {instruments.map((inst) => (
        <div key={inst.id} data-draggable="true">
          <DraggableInstrument
            instrument={inst}
            onSelect={handleSelectInstrument}
            onMove={moveInstrument}
            benchRef={benchRef}
          />
        </div>
      ))}

      {/* Containers */}
      {containers.map((cont) => (
        <div key={cont.id} data-draggable="true">
          <DraggableContainer
            container={cont}
            onSelect={handleSelectContainer}
            onMove={moveContainer}
            onDrop={handleDrop}
            benchRef={benchRef}
          />
        </div>
      ))}

      {/* Empty bench hint */}
      {containers.length === 0 && instruments.length === 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{ opacity: 0.15 }}>
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <path d="M10 50 L18 18 L42 18 L50 50" fill="none" stroke="#7dd3fc" strokeWidth="2" strokeLinejoin="round" />
              <line x1="7" y1="18" x2="53" y2="18" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="10" y1="50" x2="50" y2="50" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.35)', marginTop: 10, fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
            Add equipment to the bench<br />or start a guided experiment.
          </div>
        </div>
      )}

      {/* Equipment palette button */}
      <EquipmentPalette
        onAdd={handleAddEquipment}
        isOpen={equipPaletteOpen}
        onToggle={() => setEquipPaletteOpen(!equipPaletteOpen)}
      />

      {/* Bench toolbar */}
      <BenchToolbar onReset={resetLab} onClearBench={handleClearBench} />

      {/* CSS Animations */}
      <style>{`
        @keyframes rise {
          0%   { transform: translateY(0) scale(1); opacity: 0.7; }
          100% { transform: translateY(-20px) scale(0.3); opacity: 0; }
        }
        @keyframes pulse {
          0%   { opacity: 0.4; }
          100% { opacity: 1; }
        }
        @keyframes flicker {
          0%   { transform: scaleX(1) scaleY(1); opacity: 0.8; }
          50%  { transform: scaleX(0.92) scaleY(1.05); opacity: 0.95; }
          100% { transform: scaleX(1.05) scaleY(0.95); opacity: 0.85; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
