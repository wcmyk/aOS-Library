/**
 * SafetyPanel – floating alert panel for hazard events.
 * Shows active warnings, dismissal controls, and safety guidance.
 */

import React from 'react';
import { useChemLabStore, useActiveHazards } from '../state/useChemLabStore';

const SEVERITY_CONFIG = {
  warning: {
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.35)',
    color: '#fcd34d',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1 L13 12 L1 12 Z" stroke="#f59e0b" strokeWidth="1.4" fill="none" />
        <line x1="7" y1="5" x2="7" y2="8.5" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="7" cy="10.5" r="0.7" fill="#f59e0b" />
      </svg>
    ),
  },
  danger: {
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.4)',
    color: '#fca5a5',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6" stroke="#ef4444" strokeWidth="1.4" />
        <line x1="7" y1="4" x2="7" y2="7.5" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="7" cy="9.5" r="0.7" fill="#ef4444" />
      </svg>
    ),
  },
  critical: {
    bg: 'rgba(239,68,68,0.2)',
    border: 'rgba(239,68,68,0.6)',
    color: '#f87171',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="1" width="12" height="12" rx="2" stroke="#ef4444" strokeWidth="1.4" />
        <line x1="4" y1="4" x2="10" y2="10" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="10" y1="4" x2="4" y2="10" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
};

export function SafetyPanel() {
  const hazards = useActiveHazards();
  const { dismissHazard, clearAllHazards, setShowSafety } = useChemLabStore();

  if (hazards.length === 0) {
    return (
      <div style={{
        padding: '14px 12px', textAlign: 'center',
        background: 'rgba(8,18,38,0.9)', height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      }}>
        <div style={{ opacity: 0.3 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="#34d399" strokeWidth="2" />
            <path d="M 9 14 L 12.5 17.5 L 19 11" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(148,163,184,0.5)', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
          No active safety alerts.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'rgba(8,18,38,0.9)',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px 8px',
        borderBottom: '1px solid rgba(100,130,170,0.12)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#fcd34d', letterSpacing: '0.05em', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
          SAFETY ALERTS ({hazards.length})
        </div>
        <button
          onClick={clearAllHazards}
          style={{
            padding: '3px 8px', borderRadius: 4, border: 'none',
            background: 'rgba(30,50,80,0.6)', color: '#64748b',
            fontSize: 9, cursor: 'pointer', fontFamily: 'SF Pro Display, Inter, sans-serif',
          }}
        >
          Dismiss All
        </button>
      </div>

      {/* Alerts */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        {hazards.map((hz) => {
          const cfg = SEVERITY_CONFIG[hz.severity];
          return (
            <div
              key={hz.id}
              style={{
                borderRadius: 6, border: `1px solid ${cfg.border}`,
                background: cfg.bg, padding: '8px 10px',
                marginBottom: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                  <div style={{ paddingTop: 1, flexShrink: 0 }}>{cfg.icon}</div>
                  <div>
                    <div style={{
                      fontSize: 9, fontWeight: 700, color: cfg.color,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      fontFamily: 'SF Pro Display, Inter, sans-serif', marginBottom: 3,
                    }}>
                      {hz.severity} — {hz.type.replace(/_/g, ' ')}
                    </div>
                    <div style={{
                      fontSize: 10, color: '#e2e8f0', lineHeight: 1.4,
                      fontFamily: 'SF Pro Display, Inter, sans-serif',
                    }}>
                      {hz.message}
                    </div>
                    <div style={{
                      fontSize: 9, color: 'rgba(148,163,184,0.45)', marginTop: 3,
                      fontFamily: "'SF Mono', Menlo, monospace",
                    }}>
                      {hz.timestamp instanceof Date
                        ? hz.timestamp.toLocaleTimeString()
                        : new Date(hz.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => dismissHazard(hz.id)}
                  style={{
                    flexShrink: 0, padding: '2px 6px', borderRadius: 4, border: 'none',
                    background: 'rgba(30,50,80,0.5)', color: '#64748b',
                    fontSize: 9, cursor: 'pointer', fontFamily: 'SF Pro Display, Inter, sans-serif',
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety reminders */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid rgba(100,130,170,0.1)',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.5)', lineHeight: 1.5, fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
          Always wear appropriate PPE. Never mix unknown chemicals. Handle exothermic reactions carefully.
        </div>
      </div>
    </div>
  );
}

// ─── Floating Alert Toast ─────────────────────────────────────────────────────

export function HazardToast() {
  const hazards = useActiveHazards();
  const dismissHazard = useChemLabStore((s) => s.dismissHazard);
  const setShowSafety = useChemLabStore((s) => s.setShowSafety);

  const latest = hazards[hazards.length - 1];
  if (!latest) return null;

  const cfg = SEVERITY_CONFIG[latest.severity];

  return (
    <div
      style={{
        position: 'absolute', bottom: 12, right: 12,
        zIndex: 9999,
        borderRadius: 8, border: `1px solid ${cfg.border}`,
        background: `rgba(8,18,38,0.97)`,
        padding: '10px 14px',
        display: 'flex', gap: 10, alignItems: 'flex-start',
        maxWidth: 280,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        animation: 'slideIn 0.25s ease-out',
      }}
    >
      <div style={{ paddingTop: 1 }}>{cfg.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: cfg.color, marginBottom: 3, fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
          {latest.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </div>
        <div style={{ fontSize: 10, color: '#cbd5e1', lineHeight: 1.4, fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
          {latest.message}
        </div>
        <button
          onClick={() => setShowSafety(true)}
          style={{
            marginTop: 5, padding: '2px 8px', borderRadius: 4, border: 'none',
            background: `${cfg.border}`, color: cfg.color,
            fontSize: 9, cursor: 'pointer', fontFamily: 'SF Pro Display, Inter, sans-serif', fontWeight: 600,
          }}
        >
          View Safety Panel
        </button>
      </div>
      <button
        onClick={() => dismissHazard(latest.id)}
        style={{
          flexShrink: 0, padding: '0 4px', border: 'none', background: 'transparent',
          color: '#64748b', fontSize: 14, cursor: 'pointer', lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
