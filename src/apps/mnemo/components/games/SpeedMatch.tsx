import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../theme';
import { useMnemoStore } from '../../state/useMnemoStore';

export function SpeedMatch() {
  const { sets, activeSetId, startSession, recordResult, endSession, setView } = useMnemoStore();
  const theme = useTheme();
  const activeSet = sets.find((s) => s.id === activeSetId);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [term, setTerm] = useState('');
  const [shown, setShown] = useState('');
  const [isMatch, setIsMatch] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const cards = activeSet?.cards ?? [];

  function nextCard() {
    if (cards.length < 2) return;
    const card = cards[Math.floor(Math.random() * cards.length)];
    const match = Math.random() > 0.5;
    setTerm(card.term);
    setIsMatch(match);
    if (match) { setShown(card.definition); }
    else {
      const other = cards.filter((c) => c.id !== card.id)[Math.floor(Math.random() * (cards.length - 1))];
      setShown(other?.definition ?? card.definition);
    }
    setFeedback(null);
  }

  function start() {
    startSession(activeSet?.id ?? '', 'game_speed');
    setTimeLeft(60); setScore(0); setStreak(0); setTotal(0); setCorrect(0); setDone(false); setRunning(true);
    nextCard();
  }

  useEffect(() => {
    if (!running || done) return;
    const t = setInterval(() => setTimeLeft((tl) => { if (tl <= 1) { setRunning(false); setDone(true); endSession(); return 0; } return tl - 1; }), 1000);
    return () => clearInterval(t);
  }, [running, done]);

  function answer(userSaysMatch: boolean) {
    if (!running || feedback) return;
    const isCorrect = userSaysMatch === isMatch;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setTotal((t) => t + 1);
    recordResult(cards[0]?.id ?? '', isCorrect, 0);
    if (isCorrect) { setCorrect((c) => c + 1); setStreak((s) => s + 1); setScore((sc) => sc + 10 + streak * 2); }
    else { setStreak(0); }
    setTimeout(nextCard, 400);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'y' || e.key === 'Y') answer(true); if (e.key === 'n' || e.key === 'N') answer(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [running, isMatch, streak, feedback]);

  if (!activeSet || cards.length < 2) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>Need at least 2 cards.</div>;

  const bgFlash = feedback === 'correct' ? 'rgba(52,211,153,0.08)' : feedback === 'wrong' ? 'rgba(239,68,68,0.08)' : '#06111f';

  if (!running && !done) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: '#06111f' }}>
        <svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" fill="none" stroke="#f59e0b" strokeWidth="2" /><path d="M26 14v14l8 4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" /></svg>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>Speed Match</div>
        <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center', maxWidth: 300 }}>60 seconds. Does the definition match the term? Press Y / N or click Same / Different.</div>
        <button style={{ padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#f59e0b', color: '#06111f' }} onClick={start}>Start</button>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#06111f' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b' }}>Time&apos;s Up!</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#e2e8f0' }}>{score}</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{correct}/{total} correct · Best streak: {streak}</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#f59e0b', color: '#06111f' }} onClick={start}>Play Again</button>
          <button style={{ padding: '10px 28px', borderRadius: 8, fontSize: 14, cursor: 'pointer', border: '1px solid theme.primaryMuted', background: 'transparent', color: theme.primary }} onClick={() => setView('library')}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: bgFlash, transition: 'background 0.2s', overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(148,163,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: timeLeft <= 10 ? '#ef4444' : theme.primary }}>{timeLeft}s</span>
        <span style={{ fontSize: 15, color: '#64748b' }}>Score: <strong style={{ color: '#e2e8f0' }}>{score}</strong></span>
        <span style={{ fontSize: 15, color: streak >= 3 ? '#f59e0b' : '#475569' }}>Streak ×{streak}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '32px 48px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Term</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#e2e8f0', textAlign: 'center', maxWidth: 600, lineHeight: 1.3 }}>{term}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Definition shown</div>
        <div style={{ fontSize: 24, color: '#94a3b8', textAlign: 'center', maxWidth: 600, padding: '18px 28px', background: 'rgba(15,30,55,0.8)', borderRadius: 12, border: '1px solid rgba(148,163,184,0.12)', lineHeight: 1.4 }}>{shown}</div>
        <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
          <button style={{ padding: '14px 40px', borderRadius: 12, fontSize: 17, fontWeight: 700, cursor: 'pointer', border: '2px solid #34d399', background: 'rgba(52,211,153,0.15)', color: '#34d399' }} onClick={() => answer(true)}>Same (Y)</button>
          <button style={{ padding: '14px 40px', borderRadius: 12, fontSize: 17, fontWeight: 700, cursor: 'pointer', border: '2px solid #ef4444', background: 'rgba(239,68,68,0.15)', color: '#ef4444' }} onClick={() => answer(false)}>Different (N)</button>
        </div>
      </div>
    </div>
  );
}
