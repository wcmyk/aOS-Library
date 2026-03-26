import { useState, useEffect, useRef } from 'react';
import { useMnemoStore } from '../../state/useMnemoStore';

function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

interface Bubble { id: string; text: string; isCorrect: boolean; x: number; y: number; blasted: boolean; wrong: boolean; }

export function BlastGame() {
  const { sets, activeSetId, startSession, recordResult, endSession, setView } = useMnemoStore();
  const activeSet = sets.find((s) => s.id === activeSetId);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [hearts, setHearts] = useState(3);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [screenFlash, setScreenFlash] = useState<'green' | 'red' | null>(null);
  const animRef = useRef<ReturnType<typeof setInterval>>();
  const cards = activeSet?.cards ?? [];

  function buildBubbles(cardIdx: number) {
    const card = cards[cardIdx % cards.length];
    setPrompt(card.term);
    const answer = card.definition;
    const wrong = shuffle(cards.filter((c) => c.id !== card.id).map((c) => c.definition)).slice(0, 3);
    const all = shuffle([
      { text: answer, isCorrect: true },
      ...wrong.map((w) => ({ text: w, isCorrect: false })),
    ]);
    setBubbles(all.map((b, i) => ({
      id: String(i), text: b.text, isCorrect: b.isCorrect,
      x: 10 + i * 22 + Math.random() * 10,
      y: 30 + Math.random() * 40,
      blasted: false, wrong: false,
    })));
  }

  function start() {
    startSession(activeSet?.id ?? '', 'game_blast');
    setHearts(3); setScore(0); setCorrect(0); setTotal(0); setDone(false); setRunning(true);
    buildBubbles(0);
  }

  // Animate bubbles drifting
  useEffect(() => {
    if (!running || done) return;
    let frame = 0;
    animRef.current = setInterval(() => {
      frame++;
      setBubbles((prev) => prev.map((b) => b.blasted || b.wrong ? b : { ...b, y: b.y + 0.08, x: b.x + Math.sin(frame * 0.04 + parseFloat(b.id)) * 0.1 }));
    }, 50);
    return () => clearInterval(animRef.current);
  }, [running, done]);

  const qRef = useRef(0);
  function blast(id: string) {
    const b = bubbles.find((bu) => bu.id === id);
    if (!b || b.blasted || b.wrong) return;
    const isCorrect = b.isCorrect;
    setBubbles((prev) => prev.map((bu) => bu.id === id ? { ...bu, blasted: true } : bu));
    setTotal((t) => t + 1);
    recordResult(cards[qRef.current % cards.length]?.id ?? '', isCorrect, 0);

    if (isCorrect) {
      setCorrect((c) => c + 1); setScore((s) => s + 100); setScreenFlash('green');
      setTimeout(() => { setScreenFlash(null); qRef.current++; buildBubbles(qRef.current); }, 700);
    } else {
      setScreenFlash('red');
      setBubbles((prev) => prev.map((bu) => bu.id === id ? { ...bu, blasted: false, wrong: true } : bu));
      const newHearts = hearts - 1;
      setHearts(newHearts);
      setTimeout(() => { setScreenFlash(null); if (newHearts <= 0) { setDone(true); setRunning(false); endSession(); } }, 600);
    }
  }

  if (!activeSet || cards.length < 2) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>Need at least 2 cards.</div>;

  if (!running && !done) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: '#06111f' }}>
        <svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth="2" /><path d="M18 18l16 16M34 18L18 34" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" /></svg>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>Blast Game</div>
        <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center', maxWidth: 300 }}>Click the correct answer bubble. 3 hearts — wrong blasts drain them.</div>
        <button style={{ padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#ef4444', color: '#fff' }} onClick={start}>Start</button>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#06111f' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#ef4444' }}>Game Over</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#e2e8f0' }}>{score}</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{correct}/{total} correct</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#ef4444', color: '#fff' }} onClick={start}>Play Again</button>
          <button style={{ padding: '10px 28px', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: '1px solid rgba(125,211,252,0.3)', background: 'transparent', color: '#7dd3fc' }} onClick={() => setView('library')}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: screenFlash === 'green' ? 'rgba(52,211,153,0.08)' : screenFlash === 'red' ? 'rgba(239,68,68,0.08)' : '#06111f', transition: 'background 0.2s', position: 'relative', overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(148,163,184,0.1)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8 }}>{Array.from({ length: 3 }).map((_, i) => <svg key={i} width="22" height="22" viewBox="0 0 18 18"><path d="M9 15S2 10.5 2 6a4 4 0 0 1 7-2.65A4 4 0 0 1 16 6c0 4.5-7 9-7 9Z" fill={i < hearts ? '#ef4444' : 'rgba(239,68,68,0.2)'} /></svg>)}</div>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace' }}>{score}</span>
      </div>
      <div style={{ padding: '16px 24px', textAlign: 'center', borderBottom: '1px solid rgba(148,163,184,0.08)', flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Blast the correct answer for:</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.3 }}>{prompt}</div>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        {bubbles.map((b) => (
          <button
            key={b.id}
            onClick={() => blast(b.id)}
            style={{
              position: 'absolute', left: `${Math.min(Math.max(b.x, 2), 75)}%`, top: `${Math.min(b.y, 80)}%`,
              padding: '14px 22px', borderRadius: 24, fontSize: 15, fontWeight: 500, cursor: b.blasted || b.wrong ? 'default' : 'pointer',
              border: '2px solid', maxWidth: 240, textAlign: 'center', transition: 'opacity 0.3s',
              background: b.blasted ? 'rgba(52,211,153,0.15)' : b.wrong ? 'rgba(239,68,68,0.15)' : 'rgba(15,30,55,0.92)',
              borderColor: b.blasted ? '#34d399' : b.wrong ? '#ef4444' : 'rgba(148,163,184,0.2)',
              color: b.blasted ? '#34d399' : b.wrong ? '#ef4444' : '#cbd5e1',
              opacity: b.blasted ? 0.4 : 1,
              lineHeight: 1.3,
            }}
          >{b.text}</button>
        ))}
      </div>
    </div>
  );
}
