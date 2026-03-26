import { useState } from 'react';
import { useMnemoStore } from '../../state/useMnemoStore';
import type { Phase, Flashcard } from '../../types';

function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

const S = {
  root: { height: '100%', display: 'flex', flexDirection: 'column' as const, background: '#06111f' },
  hdr: { padding: '14px 20px', borderBottom: '1px solid rgba(148,163,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  body: { flex: 1, overflowY: 'auto' as const, padding: 20 },
  phaseBox: { background: 'rgba(10,25,47,0.8)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: 16, marginBottom: 14 },
  phaseHdr: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  phaseName: { fontSize: 14, fontWeight: 600, color: '#7dd3fc' },
  cardChip: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: 'rgba(15,30,55,0.9)', border: '1px solid rgba(148,163,184,0.15)', fontSize: 12, color: '#94a3b8', margin: '3px', cursor: 'grab' },
  btn: (variant = 'primary'): React.CSSProperties => ({ padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: variant === 'primary' ? 'none' : '1px solid rgba(125,211,252,0.3)', background: variant === 'primary' ? '#7dd3fc' : 'transparent', color: variant === 'primary' ? '#06111f' : '#7dd3fc' }),
  unassigned: { background: 'rgba(10,25,47,0.5)', border: '1px dashed rgba(148,163,184,0.2)', borderRadius: 12, padding: 16, marginBottom: 14 },
};

export function SplitLearning() {
  const { sets, activeSetId, updateSet } = useMnemoStore();
  const activeSet = sets.find((s) => s.id === activeSetId);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  if (!activeSet) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>No active set.</div>;

  const phases: Phase[] = activeSet.phases.length > 0 ? activeSet.phases : [];
  const assignedIds = new Set(phases.flatMap((p) => p.cardIds));
  const unassigned = activeSet.cards.filter((c) => !assignedIds.has(c.id));

  function addPhase() {
    if (!activeSet) return;
    const newPhase: Phase = { id: genId(), name: `Phase ${phases.length + 1}`, cardIds: [], sortOrder: phases.length };
    updateSet(activeSet.id, { phases: [...phases, newPhase] });
  }

  function renamePhase(id: string, name: string) {
    if (!activeSet) return;
    updateSet(activeSet.id, { phases: phases.map((p) => p.id === id ? { ...p, name } : p) });
  }

  function deletePhase(id: string) {
    if (!activeSet) return;
    updateSet(activeSet.id, { phases: phases.filter((p) => p.id !== id) });
  }

  function autoDistribute(count: number) {
    if (!activeSet) return;
    const allIds = activeSet.cards.map((c) => c.id);
    const shuffled = [...allIds].sort(() => Math.random() - 0.5);
    const newPhases: Phase[] = Array.from({ length: count }, (_, i) => ({
      id: genId(), name: `Phase ${i + 1}`, cardIds: [], sortOrder: i,
    }));
    shuffled.forEach((id, i) => newPhases[i % count].cardIds.push(id));
    updateSet(activeSet.id, { phases: newPhases });
  }

  function dropCardOnPhase(cardId: string, phaseId: string) {
    if (!activeSet) return;
    const updated = phases.map((p) => {
      if (p.id === phaseId) return { ...p, cardIds: p.cardIds.includes(cardId) ? p.cardIds : [...p.cardIds, cardId] };
      return { ...p, cardIds: p.cardIds.filter((id) => id !== cardId) };
    });
    updateSet(activeSet.id, { phases: updated });
  }

  function removeCardFromPhase(cardId: string, phaseId: string) {
    if (!activeSet) return;
    updateSet(activeSet.id, { phases: phases.map((p) => p.id === phaseId ? { ...p, cardIds: p.cardIds.filter((id) => id !== cardId) } : p) });
  }

  return (
    <div style={S.root}>
      <div style={S.hdr}>
        <span style={{ color: '#7dd3fc', fontSize: 13, fontWeight: 600 }}>Split Learning — {activeSet.title}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <select onChange={(e) => autoDistribute(Number(e.target.value))} style={{ background: 'rgba(15,30,55,0.9)', border: '1px solid rgba(148,163,184,0.2)', color: '#94a3b8', borderRadius: 6, padding: '5px 8px', fontSize: 12, cursor: 'pointer' }} defaultValue="">
            <option value="" disabled>Auto-distribute</option>
            {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} phases</option>)}
          </select>
          <button style={S.btn()} onClick={addPhase}>+ Add Phase</button>
        </div>
      </div>
      <div style={S.body}>
        {unassigned.length > 0 && (
          <div style={S.unassigned}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Unassigned ({unassigned.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const }}>
              {unassigned.map((c) => (
                <span key={c.id} draggable style={S.cardChip} onDragStart={() => setDragging(c.id)} onDragEnd={() => setDragging(null)}>{c.term.slice(0, 30)}{c.term.length > 30 ? '…' : ''}</span>
              ))}
            </div>
          </div>
        )}
        {phases.map((phase) => {
          const phaseCards = phase.cardIds.map((id) => activeSet.cards.find((c) => c.id === id)).filter(Boolean) as Flashcard[];
          return (
            <div key={phase.id} style={{ ...S.phaseBox, borderColor: dragOver === phase.id ? 'rgba(125,211,252,0.4)' : 'rgba(148,163,184,0.12)' }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(phase.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => { if (dragging) dropCardOnPhase(dragging, phase.id); setDragOver(null); setDragging(null); }}>
              <div style={S.phaseHdr}>
                <input value={phase.name} onChange={(e) => renamePhase(phase.id, e.target.value)} style={{ background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: '#7dd3fc', outline: 'none', flex: 1 }} />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#475569' }}>{phaseCards.length} cards</span>
                  <button style={{ ...S.btn('ghost'), padding: '4px 8px', fontSize: 11, color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }} onClick={() => deletePhase(phase.id)}>Remove</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, minHeight: 36 }}>
                {phaseCards.length === 0 && <span style={{ fontSize: 12, color: '#334155', alignSelf: 'center' }}>Drag cards here</span>}
                {phaseCards.map((c) => (
                  <span key={c.id} draggable style={S.cardChip} onDragStart={() => setDragging(c.id)} onDragEnd={() => setDragging(null)}>
                    {c.term.slice(0, 28)}{c.term.length > 28 ? '…' : ''}
                    <button onClick={() => removeCardFromPhase(c.id, phase.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        {phases.length === 0 && (
          <div style={{ textAlign: 'center', color: '#475569', fontSize: 14, paddingTop: 40 }}>
            <div style={{ marginBottom: 12 }}>No phases yet. Add a phase or auto-distribute cards.</div>
          </div>
        )}
      </div>
    </div>
  );
}
