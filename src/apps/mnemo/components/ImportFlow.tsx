import React, { useState, useRef } from 'react';
import { useMnemoStore } from '../state/useMnemoStore';

const C = {
  bg: '#06111f',
  surface: 'rgba(10,25,47,0.8)',
  border: 'rgba(148,163,184,0.2)',
  text: '#e8ebf0',
  muted: '#94a3b8',
  cyan: '#7dd3fc',
  purple: '#a78bfa',
  green: '#34d399',
  amber: '#f59e0b',
  red: '#ef4444',
};

type DelimiterOption = 'tab' | 'comma' | 'dash' | 'pipe' | 'custom';

function getDelimiter(option: DelimiterOption, custom: string): string {
  switch (option) {
    case 'tab': return '\t';
    case 'comma': return ',';
    case 'dash': return ' - ';
    case 'pipe': return '|';
    case 'custom': return custom;
    default: return '\t';
  }
}

function stripNumbering(line: string): string {
  return line.replace(/^\s*\d+[\.\)\-\s]+/, '').trim();
}

function parseLines(
  text: string,
  delimiter: string,
  doStripNumbering: boolean,
): { term: string; definition: string; confidence: 'high' | 'low' }[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const processed = doStripNumbering ? stripNumbering(line) : line;
      const idx = delimiter === '\t'
        ? processed.indexOf('\t')
        : processed.indexOf(delimiter);
      if (idx !== -1) {
        return {
          term: processed.slice(0, idx).trim(),
          definition: processed.slice(idx + delimiter.length).trim(),
          confidence: 'high' as const,
        };
      }
      // try to auto-detect
      const tabIdx = processed.indexOf('\t');
      if (tabIdx !== -1) {
        return {
          term: processed.slice(0, tabIdx).trim(),
          definition: processed.slice(tabIdx + 1).trim(),
          confidence: 'low' as const,
        };
      }
      return { term: processed, definition: '', confidence: 'low' as const };
    })
    .filter((p) => p.term);
}

function UploadIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

export function ImportFlow() {
  const { bulkImportSet, setActiveSet, setView } = useMnemoStore();
  const [tab, setTab] = useState<'text' | 'csv'>('text');
  const [text, setText] = useState('');
  const [csvText, setCsvText] = useState('');
  const [delimiter, setDelimiter] = useState<DelimiterOption>('tab');
  const [customDelimiter, setCustomDelimiter] = useState('');
  const [stripNum, setStripNum] = useState(true);
  const [reverse, setReverse] = useState(false);
  const [setTitle, setSetTitle] = useState('Imported Set');
  const [editingPairs, setEditingPairs] = useState<{ term: string; definition: string; confidence: 'high' | 'low' }[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeText = tab === 'text' ? text : csvText;
  const delim = getDelimiter(delimiter, customDelimiter);
  const parsed = parseLines(activeText, delim, stripNum);
  const displayPairs = editingPairs ?? parsed;
  const finalPairs = reverse
    ? displayPairs.map((p) => ({ term: p.definition, definition: p.term, confidence: p.confidence }))
    : displayPairs;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
    setSetTitle(file.name.replace(/\.(csv|txt)$/i, ''));
  };

  const handleImport = () => {
    if (finalPairs.length === 0) return;
    const pairs = finalPairs.map((p) => ({ term: p.term, definition: p.definition }));
    const newSet = bulkImportSet(
      setTitle.trim() || 'Imported Set',
      pairs,
      tab === 'csv' ? 'imported_csv' : 'imported_text',
    );
    setActiveSet(newSet.id);
    setView('edit');
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '8px 12px',
    color: C.text,
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
  };

  const lowConfidenceCount = finalPairs.filter((p) => p.confidence === 'low').length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', gap: 20, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 20, fontWeight: 700 }}>Import Cards</h2>
        <button
          onClick={() => setView('library')}
          style={{ background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}
        >
          Cancel
        </button>
      </div>

      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '16px',
      }}>
        <label style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Set Title</label>
        <input
          value={setTitle}
          onChange={(e) => setSetTitle(e.target.value)}
          style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', fontSize: 15 }}
          placeholder="Name your set..."
          onFocus={(e) => (e.target.style.borderColor = C.cyan)}
          onBlur={(e) => (e.target.style.borderColor = C.border)}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}` }}>
        {(['text', 'csv'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? `2px solid ${C.cyan}` : '2px solid transparent',
              color: tab === t ? C.cyan : C.muted,
              padding: '10px 20px',
              cursor: 'pointer',
              fontWeight: tab === t ? 600 : 400,
              fontSize: 14,
              marginBottom: -1,
            }}
          >
            {t === 'text' ? 'Paste Text' : 'CSV / File'}
          </button>
        ))}
      </div>

      {/* Options bar */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ color: C.muted, fontSize: 13 }}>Delimiter:</label>
          <select
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value as DelimiterOption)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="tab">Tab</option>
            <option value="comma">Comma</option>
            <option value="dash">Dash ( - )</option>
            <option value="pipe">Pipe (|)</option>
            <option value="custom">Custom</option>
          </select>
          {delimiter === 'custom' && (
            <input
              value={customDelimiter}
              onChange={(e) => setCustomDelimiter(e.target.value)}
              placeholder="e.g. ::"
              style={{ ...inputStyle, width: 60 }}
            />
          )}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.muted, fontSize: 13, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={stripNum}
            onChange={(e) => setStripNum(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Strip numbering (1. 2. etc.)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.muted, fontSize: 13, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={reverse}
            onChange={(e) => setReverse(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Reverse cards (swap term/def)
        </label>
      </div>

      {/* Input area */}
      {tab === 'text' ? (
        <div>
          <label style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Paste your content
          </label>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setEditingPairs(null); }}
            placeholder={`term[tab]definition\nterm2[tab]definition2\n\nOr paste from a document, notes app, etc.`}
            style={{
              ...inputStyle,
              width: '100%',
              minHeight: 160,
              resize: 'vertical',
              boxSizing: 'border-box',
              fontSize: 13,
              fontFamily: 'monospace',
            }}
            onFocus={(e) => (e.target.style.borderColor = C.cyan)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
        </div>
      ) : (
        <div>
          <input
            type="file"
            accept=".csv,.txt"
            ref={fileRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {!csvText ? (
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${C.border}`,
                borderRadius: 12,
                padding: '40px',
                textAlign: 'center',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.cyan)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
            >
              <UploadIcon />
              <div>
                <p style={{ margin: 0, color: C.text, fontSize: 15, fontWeight: 600 }}>Click to upload CSV or TXT</p>
                <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 13 }}>Supports .csv and .txt files</p>
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <textarea
                value={csvText}
                onChange={(e) => { setCsvText(e.target.value); setEditingPairs(null); }}
                style={{
                  ...inputStyle,
                  width: '100%',
                  minHeight: 160,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontSize: 13,
                  fontFamily: 'monospace',
                }}
              />
              <button
                onClick={() => { setCsvText(''); if (fileRef.current) fileRef.current.value = ''; }}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                  color: C.muted, fontSize: 12,
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {finalPairs.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ margin: 0, color: C.text, fontSize: 15, fontWeight: 600 }}>
              Preview — {finalPairs.length} pairs detected
              {lowConfidenceCount > 0 && (
                <span style={{ marginLeft: 8, color: C.amber, fontSize: 13, fontWeight: 400 }}>
                  ({lowConfidenceCount} low-confidence)
                </span>
              )}
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
            {finalPairs.map((pair, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  background: pair.confidence === 'low' ? 'rgba(245,158,11,0.08)' : C.surface,
                  border: `1px solid ${pair.confidence === 'low' ? C.amber : C.border}`,
                  borderRadius: 8,
                  padding: '8px 12px',
                  alignItems: 'center',
                }}
              >
                <input
                  value={pair.term}
                  onChange={(e) => {
                    const next = [...(editingPairs ?? parsed)];
                    next[i] = { ...next[i], term: e.target.value };
                    setEditingPairs(next);
                  }}
                  style={{ ...inputStyle, fontSize: 13, width: '100%', boxSizing: 'border-box' }}
                  placeholder="term"
                />
                <input
                  value={pair.definition}
                  onChange={(e) => {
                    const next = [...(editingPairs ?? parsed)];
                    next[i] = { ...next[i], definition: e.target.value };
                    setEditingPairs(next);
                  }}
                  style={{ ...inputStyle, fontSize: 13, width: '100%', boxSizing: 'border-box' }}
                  placeholder="definition"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={finalPairs.length === 0}
        style={{
          background: finalPairs.length > 0 ? C.cyan : 'rgba(125,211,252,0.3)',
          color: finalPairs.length > 0 ? '#0a1628' : C.muted,
          border: 'none',
          borderRadius: 10,
          padding: '12px 24px',
          cursor: finalPairs.length > 0 ? 'pointer' : 'default',
          fontWeight: 700,
          fontSize: 15,
          alignSelf: 'flex-start',
        }}
      >
        Import {finalPairs.length > 0 ? finalPairs.length : ''} Cards
      </button>
    </div>
  );
}
