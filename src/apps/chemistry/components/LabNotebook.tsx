/**
 * LabNotebook – auto-logging panel for all experiment actions and observations.
 * Shows timestamped entries grouped by category with export support.
 */

import React, { useRef, useEffect, useState } from 'react';
import { useChemLabStore } from '../state/useChemLabStore';
import type { NotebookEntry } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  action:      '#7dd3fc',
  measurement: '#34d399',
  reaction:    '#a78bfa',
  safety:      '#f59e0b',
  observation: '#94a3b8',
  result:      '#f472b6',
};

const CATEGORY_ICONS: Record<string, string> = {
  action:      '▶',
  measurement: '◈',
  reaction:    '⬡',
  safety:      '⚠',
  observation: '◉',
  result:      '★',
};

function NotebookRow({ entry }: { entry: NotebookEntry }) {
  const color = CATEGORY_COLORS[entry.category] ?? '#94a3b8';
  const icon = CATEGORY_ICONS[entry.category] ?? '•';
  const time = entry.timestamp instanceof Date
    ? entry.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : typeof entry.timestamp === 'string'
      ? new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '--:--:--';

  return (
    <div style={{
      display: 'flex', gap: 8, padding: '5px 10px',
      borderBottom: '1px solid rgba(100,130,170,0.06)',
      alignItems: 'flex-start',
    }}>
      {/* Icon + time */}
      <div style={{ flexShrink: 0, paddingTop: 1 }}>
        <span style={{ color, fontSize: 10 }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase',
            letterSpacing: '0.05em', fontFamily: 'SF Pro Display, Inter, sans-serif',
          }}>
            {entry.category}
          </span>
          <span style={{
            fontSize: 9, color: 'rgba(148,163,184,0.45)',
            fontFamily: "'SF Mono', Menlo, monospace",
          }}>
            {time}
          </span>
        </div>
        <div style={{
          fontSize: 10, color: '#cbd5e1', lineHeight: 1.45,
          fontFamily: 'SF Pro Display, Inter, sans-serif',
          wordBreak: 'break-word',
        }}>
          {entry.text}
        </div>
        {entry.data && Object.keys(entry.data).length > 0 && (
          <div style={{
            marginTop: 3, fontSize: 9, color: 'rgba(148,163,184,0.5)',
            fontFamily: "'SF Mono', Menlo, monospace",
          }}>
            {Object.entries(entry.data).map(([k, v]) => (
              <span key={k} style={{ marginRight: 8 }}>
                {k}: {typeof v === 'number' ? v.toFixed(4) : String(v)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function LabNotebook() {
  const notebook = useChemLabStore((s) => s.notebook);
  const addNotebookEntry = useChemLabStore((s) => s.addNotebookEntry);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [noteText, setNoteText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [notebook.length, autoScroll]);

  const filtered = filterCat === 'all'
    ? notebook
    : notebook.filter((e) => e.category === filterCat);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNotebookEntry({ category: 'observation', text: noteText.trim() });
    setNoteText('');
  };

  const handleExport = () => {
    const lines = notebook.map((e) => {
      const time = e.timestamp instanceof Date
        ? e.timestamp.toISOString()
        : new Date(e.timestamp).toISOString();
      return `[${time}] [${e.category.toUpperCase()}] ${e.text}`;
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab_notebook_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'rgba(8,18,38,0.9)',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px 8px',
        borderBottom: '1px solid rgba(100,130,170,0.12)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7dd3fc', letterSpacing: '0.05em', fontFamily: 'SF Pro Display, Inter, sans-serif' }}>
            LAB NOTEBOOK
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              style={{
                padding: '3px 7px', borderRadius: 4, border: 'none',
                background: autoScroll ? 'rgba(52,211,153,0.15)' : 'rgba(30,50,80,0.5)',
                color: autoScroll ? '#34d399' : '#64748b',
                fontSize: 9, cursor: 'pointer', fontFamily: 'SF Pro Display, Inter, sans-serif',
              }}
            >
              Auto-scroll {autoScroll ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={handleExport}
              style={{
                padding: '3px 7px', borderRadius: 4, border: 'none',
                background: 'rgba(125,211,252,0.12)', color: '#7dd3fc',
                fontSize: 9, cursor: 'pointer', fontFamily: 'SF Pro Display, Inter, sans-serif',
                fontWeight: 600,
              }}
            >
              Export
            </button>
          </div>
        </div>
        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {['all', 'action', 'measurement', 'reaction', 'safety', 'observation'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              style={{
                padding: '2px 8px', borderRadius: 12, border: 'none',
                background: filterCat === cat
                  ? `${CATEGORY_COLORS[cat] ?? '#7dd3fc'}22`
                  : 'rgba(30,50,80,0.5)',
                color: filterCat === cat
                  ? (CATEGORY_COLORS[cat] ?? '#7dd3fc')
                  : '#64748b',
                fontSize: 9, cursor: 'pointer', textTransform: 'capitalize',
                fontFamily: 'SF Pro Display, Inter, sans-serif',
                fontWeight: filterCat === cat ? 700 : 400,
                transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Entry count */}
      <div style={{
        padding: '3px 12px',
        fontSize: 9, color: 'rgba(148,163,184,0.4)',
        borderBottom: '1px solid rgba(100,130,170,0.06)',
        fontFamily: 'SF Pro Display, Inter, sans-serif',
        flexShrink: 0,
      }}>
        {filtered.length} {filterCat === 'all' ? 'total' : filterCat} entries
      </div>

      {/* Log entries */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{
            padding: '20px 12px', textAlign: 'center',
            fontSize: 10, color: 'rgba(148,163,184,0.4)',
            fontFamily: 'SF Pro Display, Inter, sans-serif',
          }}>
            No entries yet. Perform an action to begin logging.
          </div>
        )}
        {filtered.map((entry) => (
          <NotebookRow key={entry.id} entry={entry} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Observation input */}
      <div style={{
        padding: '8px 10px',
        borderTop: '1px solid rgba(100,130,170,0.1)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <input
            type="text"
            placeholder="Add observation…"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
            style={{
              flex: 1, padding: '5px 8px', borderRadius: 5,
              border: '1px solid rgba(100,140,180,0.2)',
              background: 'rgba(10,25,50,0.7)', color: '#e2e8f0', fontSize: 10,
              fontFamily: 'SF Pro Display, Inter, sans-serif', outline: 'none',
            }}
          />
          <button
            onClick={handleAddNote}
            disabled={!noteText.trim()}
            style={{
              padding: '5px 10px', borderRadius: 5, border: 'none',
              background: noteText.trim() ? 'rgba(125,211,252,0.2)' : 'rgba(20,30,50,0.3)',
              color: noteText.trim() ? '#7dd3fc' : '#374151',
              fontSize: 10, cursor: noteText.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'SF Pro Display, Inter, sans-serif', fontWeight: 600,
            }}
          >
            Log
          </button>
        </div>
      </div>
    </div>
  );
}
