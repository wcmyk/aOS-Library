import { useState, useEffect } from 'react';
import { useTheme } from '../../theme';
import { useMnemoStore } from '../../state/useMnemoStore';

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

interface MemCard { id: string; text: string; pairId: string; isFlipped: boolean; isMatched: boolean; }

export function MemoryFlip() {
  const { sets, activeSetId, startSession, recordResult, endSession, setView } = useMnemoStore();
  const theme = useTheme();
  const activeSet = sets.find((s) => s.id === activeSetId);
  const [cards, setCards] = useState<MemCard[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const GRID = 8; // 4 pairs

  function build() {
    if (!activeSet || activeSet.cards.length < 2) return;
    startSession(activeSet.id, 'game_memory');
    const pool = shuffle(activeSet.cards).slice(0, GRID / 2);
    const tiles: MemCard[] = [];
    pool.forEach((c) => {
      tiles.push({ id: `t-${c.id}`, text: c.term, pairId: c.id, isFlipped: false, isMatched: false });
      tiles.push({ id: `d-${c.id}`, text: c.definition, pairId: c.id, isFlipped: false, isMatched: false });
    });
    setCards(shuffle(tiles)); setFlipped([]); setMoves(0); setElapsed(0); setDone(false); setBlocking(false); setStarted(true);
  }

  useEffect(() => {
    if (!started || done) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [started, done]);

  function flip(id: string) {
    if (blocking || done) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    if (flipped.length === 0) {
      setCards((prev) => prev.map((c) => c.id === id ? { ...c, isFlipped: true } : c));
      setFlipped([id]);
      return;
    }
    if (flipped.length === 1) {
      const first = cards.find((c) => c.id === flipped[0])!;
      const newCards = cards.map((c) => c.id === id ? { ...c, isFlipped: true } : c);
      setCards(newCards);
      setFlipped([]);
      setMoves((m) => m + 1);
      if (first.pairId === card.pairId) {
        setCards(newCards.map((c) => c.pairId === card.pairId ? { ...c, isMatched: true } : c));
        recordResult(card.pairId, true, 0);
        if (newCards.every((c) => c.pairId === card.pairId || c.isMatched)) { setDone(true); endSession(); }
      } else {
        setBlocking(true);
        setTimeout(() => {
          setCards((prev) => prev.map((c) => c.id === id || c.id === flipped[0] ? { ...c, isFlipped: false } : c));
          setBlocking(false);
        }, 900);
      }
    }
  }

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  if (!activeSet || activeSet.cards.length < 2) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>Need at least 2 cards.</div>;

  if (!started) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: '#06111f' }}>
        <svg width="52" height="52" viewBox="0 0 52 52"><rect x="4" y="4" width="20" height="20" rx="4" fill="none" stroke="#a78bfa" strokeWidth="2" /><rect x="28" y="4" width="20" height="20" rx="4" fill="none" stroke="#a78bfa" strokeWidth="2" /><rect x="4" y="28" width="20" height="20" rx="4" fill="rgba(167,139,250,0.3)" stroke="#a78bfa" strokeWidth="2" /><rect x="28" y="28" width="20" height="20" rx="4" fill="none" stroke="#a78bfa" strokeWidth="2" /></svg>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>Memory Flip</div>
        <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center', maxWidth: 300 }}>Match each term with its definition. Flip two cards at a time.</div>
        <button style={{ padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#a78bfa', color: '#06111f' }} onClick={build}>Start</button>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#06111f' }}>
        <svg width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="rgba(167,139,250,0.15)" stroke="#a78bfa" strokeWidth="2" /><path d="M20 33l8 8 16-16" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#a78bfa' }}>All Matched!</div>
        <div style={{ fontSize: 14, color: '#64748b' }}>{moves} moves · {mins}:{secs}</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#a78bfa', color: '#06111f' }} onClick={build}>Play Again</button>
          <button style={{ padding: '10px 28px', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: '1px solid rgba(167,139,250,0.3)', background: 'transparent', color: '#a78bfa' }} onClick={() => setView('library')}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#06111f', overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(148,163,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ color: '#a78bfa', fontSize: 14, fontWeight: 600 }}>Memory Flip</span>
        <span style={{ fontSize: 13, color: '#64748b' }}>Moves: {moves}</span>
        <span style={{ fontFamily: 'monospace', fontSize: 14, color: '#94a3b8' }}>{mins}:{secs}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, width: '100%', maxWidth: 700 }}>
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => flip(card.id)}
              style={{
                minWidth: 100, minHeight: 100, borderRadius: 12, cursor: card.isMatched ? 'default' : 'pointer', fontSize: 13, fontWeight: 500, textAlign: 'center', border: '1px solid', padding: 12,
                background: card.isMatched ? 'rgba(167,139,250,0.1)' : card.isFlipped ? 'rgba(15,30,55,0.95)' : 'rgba(10,20,40,0.9)',
                borderColor: card.isMatched ? '#a78bfa' : card.isFlipped ? 'rgba(167,139,250,0.4)' : 'rgba(148,163,184,0.15)',
                color: card.isMatched ? '#a78bfa' : '#cbd5e1',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                opacity: card.isMatched ? 0.6 : 1,
                lineHeight: 1.3,
              }}
            >
              {card.isFlipped || card.isMatched ? card.text : (
                <svg width="28" height="28" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="4" fill="rgba(167,139,250,0.2)" stroke="rgba(167,139,250,0.4)" strokeWidth="1.5" /><path d="M12 7v5l3 3" stroke="rgba(167,139,250,0.6)" strokeWidth="1.5" strokeLinecap="round" /></svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
