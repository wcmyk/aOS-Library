import { useState, useEffect } from 'react';
import { useTheme } from '../../theme';
import { useMnemoStore } from '../../state/useMnemoStore';
import type { Flashcard } from '../../types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

interface Tile { id: string; text: string; cardId: string; side: 'term' | 'def'; matched: boolean; selected: boolean; shaking: boolean; }

const GRID_SIZE = 6;

export function MatchMode() {
  const { sets, activeSetId, answerDirection, startSession, recordResult, endSession, setView } = useMnemoStore();
  const theme = useTheme();
  const activeSet = sets.find((s) => s.id === activeSetId);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);

  function buildTiles(cards: Flashcard[]) {
    const pool = shuffle(cards).slice(0, GRID_SIZE);
    const ts: Tile[] = [];
    pool.forEach((c) => {
      ts.push({ id: `term-${c.id}`, text: answerDirection === 'term_to_definition' ? c.term : c.definition, cardId: c.id, side: 'term', matched: false, selected: false, shaking: false });
      ts.push({ id: `def-${c.id}`, text: answerDirection === 'term_to_definition' ? c.definition : c.term, cardId: c.id, side: 'def', matched: false, selected: false, shaking: false });
    });
    return shuffle(ts);
  }

  function start() {
    if (!activeSet) return;
    startSession(activeSet.id, 'match');
    setTiles(buildTiles(activeSet.cards));
    setSelected(null); setElapsed(0); setDone(false); setStarted(true);
  }

  useEffect(() => {
    if (!started || done) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [started, done]);

  function selectTile(id: string) {
    if (!started || done) return;
    const tile = tiles.find((t) => t.id === id);
    if (!tile || tile.matched) return;

    if (!selected) {
      setSelected(id);
      setTiles((prev) => prev.map((t) => t.id === id ? { ...t, selected: true } : t));
      return;
    }

    if (selected === id) {
      setSelected(null);
      setTiles((prev) => prev.map((t) => t.id === id ? { ...t, selected: false } : t));
      return;
    }

    const selTile = tiles.find((t) => t.id === selected)!;
    const isMatch = selTile.cardId === tile.cardId && selTile.side !== tile.side;

    if (isMatch) {
      recordResult(tile.cardId, true, 0);
      const updated = tiles.map((t) =>
        t.id === id || t.id === selected ? { ...t, matched: true, selected: false } : t,
      );
      setTiles(updated);
      setSelected(null);
      if (updated.every((t) => t.matched)) { endSession(); setDone(true); }
    } else {
      // Shake both
      setTiles((prev) => prev.map((t) => t.id === id || t.id === selected ? { ...t, shaking: true, selected: false } : t));
      setTimeout(() => {
        setTiles((prev) => prev.map((t) => t.id === id || t.id === selected ? { ...t, shaking: false } : t));
      }, 500);
      setSelected(null);
    }
  }

  if (!activeSet || activeSet.cards.length < 2) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>Need at least 2 cards.</div>;

  const matched = tiles.filter((t) => t.matched).length / 2;
  const total = tiles.length / 2;
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#06111f' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(148,163,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: theme.primary, fontSize: 13, fontWeight: 600 }}>Match — {activeSet.title}</span>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748b' }}>
          <span>{matched}/{total} matched</span>
          <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{mins}:{secs}</span>
        </div>
      </div>

      {!started ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <svg width="52" height="52" viewBox="0 0 52 52"><rect x="4" y="14" width="18" height="26" rx="4" fill="none" stroke="#7dd3fc" strokeWidth="2" /><rect x="30" y="14" width="18" height="26" rx="4" fill="none" stroke="#a78bfa" strokeWidth="2" /><line x1="22" y1="27" x2="30" y2="27" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 2" /></svg>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>Match Mode</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Click a term, then its matching definition</div>
          <button style={{ padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: theme.primary, color: '#06111f' }} onClick={start}>Start</button>
        </div>
      ) : done ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <svg width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="rgba(52,211,153,0.15)" stroke="#34d399" strokeWidth="2" /><path d="M20 33l8 8 16-16" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#34d399' }}>All matched!</div>
          <div style={{ fontSize: 14, color: '#64748b' }}>Time: {mins}:{secs}</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={{ padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: theme.primary, color: '#06111f' }} onClick={start}>Play Again</button>
            <button style={{ padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: '1px solid theme.primaryMuted', background: 'transparent', color: theme.primary }} onClick={() => setView('library')}>Done</button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 700, margin: '0 auto' }}>
            {tiles.map((tile) => (
              <button
                key={tile.id}
                onClick={() => selectTile(tile.id)}
                style={{
                  padding: '14px 12px', borderRadius: 10, cursor: tile.matched ? 'default' : 'pointer',
                  fontSize: 13, fontWeight: 500, textAlign: 'center',
                  border: '1px solid', transition: 'all 0.15s',
                  background: tile.matched ? 'rgba(52,211,153,0.1)' : tile.selected ? 'theme.primaryMuted' : 'rgba(15,30,55,0.9)',
                  borderColor: tile.matched ? '#34d399' : tile.selected ? '#7dd3fc' : 'rgba(148,163,184,0.15)',
                  color: tile.matched ? '#34d399' : tile.selected ? '#7dd3fc' : '#cbd5e1',
                  opacity: tile.matched ? 0.5 : 1,
                  animation: tile.shaking ? 'shake 0.4s ease' : undefined,
                  minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {tile.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
