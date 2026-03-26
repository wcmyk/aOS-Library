import { useState, useEffect } from 'react';
import { useTheme } from '../../theme';
import { useMnemoStore } from '../../state/useMnemoStore';
import type { Flashcard } from '../../types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

const S = {
  root: { height: '100%', display: 'flex', flexDirection: 'column' as const, background: '#06111f' },
  hdr: { padding: '14px 20px', borderBottom: '1px solid rgba(148,163,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  body: { flex: 1, overflowY: 'auto' as const, padding: 28 },
  card: { background: 'rgba(10,25,47,0.8)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: 20, marginBottom: 14 },
  qLabel: { fontSize: 11, color: '#475569', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8 },
  q: { fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 14 },
  choice: (st: string): React.CSSProperties => ({ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', marginBottom: 8, borderRadius: 8, cursor: 'pointer', fontSize: 13, border: '1px solid', background: st === 'correct' ? 'rgba(52,211,153,0.15)' : st === 'wrong' ? 'rgba(239,68,68,0.15)' : 'rgba(15,30,55,0.9)', borderColor: st === 'correct' ? '#34d399' : st === 'wrong' ? '#ef4444' : 'rgba(148,163,184,0.15)', color: st === 'correct' ? '#34d399' : st === 'wrong' ? '#ef4444' : '#cbd5e1' }),
  input: { width: '100%', padding: '10px 14px', fontSize: 14, color: '#e2e8f0', background: 'rgba(15,30,55,0.9)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, outline: 'none', boxSizing: 'border-box' as const },
  btn: { padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#7dd3fc', color: '#06111f' },
  cfg: { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32 },
};

interface TestQ { card: Flashcard; type: 'mc' | 'typed'; choices: string[]; answer: string; prompt: string; userAnswer: string | null; }

export function TestMode() {
  const { sets, activeSetId, answerDirection, startSession, recordResult, endSession, setView } = useMnemoStore();
  const theme = useTheme();
  const activeSet = sets.find((s) => s.id === activeSetId);
  const [configured, setConfigured] = useState(false);
  const [qCount, setQCount] = useState(10);
  const [questions, setQuestions] = useState<TestQ[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [typedAnswers, setTypedAnswers] = useState<Record<number, string>>({});

  if (!activeSet || activeSet.cards.length === 0) return <div style={{ ...S.body, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No cards.</div>;

  function buildTest() {
    startSession(activeSet!.id, 'test');
    const count = Math.min(qCount, activeSet!.cards.length);
    const qs: TestQ[] = shuffle(activeSet!.cards).slice(0, count).map((card) => {
      const prompt = answerDirection === 'term_to_definition' ? card.term : card.definition;
      const answer = answerDirection === 'term_to_definition' ? card.definition : card.term;
      const allAnswers = activeSet!.cards.map((c) => answerDirection === 'term_to_definition' ? c.definition : c.term);
      const wrong = shuffle(allAnswers.filter((a) => a !== answer)).slice(0, 3);
      const type = Math.random() > 0.4 ? 'mc' : 'typed';
      return { card, type, prompt, answer, choices: shuffle([answer, ...wrong]), userAnswer: null };
    });
    setQuestions(qs);
    setConfigured(true);
    setSubmitted(false);
    setTypedAnswers({});
  }

  function submitTest() {
    const finalQs = questions.map((q, i) => ({ ...q, userAnswer: q.type === 'typed' ? (typedAnswers[i] ?? '') : q.userAnswer }));
    setQuestions(finalQs);
    finalQs.forEach((q) => { const correct = q.userAnswer?.toLowerCase().trim() === q.answer.toLowerCase().trim(); recordResult(q.card.id, correct, 0); });
    endSession();
    setSubmitted(true);
  }

  function answerMC(idx: number, choice: string) {
    if (submitted) return;
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, userAnswer: choice } : q));
  }

  const score = submitted ? questions.filter((q) => q.userAnswer?.toLowerCase().trim() === q.answer.toLowerCase().trim()).length : 0;

  if (!configured) {
    return (
      <div style={S.root}>
        <div style={S.hdr}><span style={{ color: theme.primary, fontSize: 13, fontWeight: 600 }}>Test Mode — {activeSet.title}</span></div>
        <div style={S.cfg}>
          <svg width="48" height="48" viewBox="0 0 48 48"><rect x="6" y="6" width="36" height="36" rx="6" fill="none" stroke="#7dd3fc" strokeWidth="2" /><line x1="13" y1="16" x2="35" y2="16" stroke="#7dd3fc" strokeWidth="1.5" /><line x1="13" y1="24" x2="35" y2="24" stroke="#7dd3fc" strokeWidth="1.5" /><line x1="13" y1="32" x2="26" y2="32" stroke="#7dd3fc" strokeWidth="1.5" /></svg>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>Configure Test</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#94a3b8', fontSize: 14 }}>
            <span>Questions:</span>
            <input type="number" min={1} max={activeSet.cards.length} value={qCount} onChange={(e) => setQCount(Number(e.target.value))} style={{ ...S.input, width: 80 }} />
            <span style={{ color: '#475569' }}>max {activeSet.cards.length}</span>
          </div>
          <button style={S.btn} onClick={buildTest}>Start Test</button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.root}>
      <div style={S.hdr}>
        <span style={{ color: theme.primary, fontSize: 13, fontWeight: 600 }}>Test — {activeSet.title}</span>
        {submitted && <span style={{ fontSize: 13, color: score / questions.length >= 0.7 ? '#34d399' : '#ef4444', fontWeight: 700 }}>{score}/{questions.length} correct ({Math.round(score / questions.length * 100)}%)</span>}
      </div>
      <div style={S.body}>
        {questions.map((q, idx) => {
          const isCorrect = submitted && q.userAnswer?.toLowerCase().trim() === q.answer.toLowerCase().trim();
          return (
            <div key={idx} style={{ ...S.card, borderColor: submitted ? (isCorrect ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)') : 'rgba(148,163,184,0.12)' }}>
              <div style={S.qLabel}>Question {idx + 1}</div>
              <div style={S.q}>{q.prompt}</div>
              {q.type === 'mc' ? (
                q.choices.map((ch) => {
                  const st = !submitted ? (q.userAnswer === ch ? 'selected' : 'normal') : (ch === q.answer ? 'correct' : q.userAnswer === ch && ch !== q.answer ? 'wrong' : 'normal');
                  return <button key={ch} style={S.choice(st)} onClick={() => answerMC(idx, ch)}>{ch}</button>;
                })
              ) : (
                <div>
                  <input style={{ ...S.input, borderColor: submitted ? (isCorrect ? '#34d399' : '#ef4444') : 'rgba(148,163,184,0.2)' }} placeholder="Type your answer…" value={typedAnswers[idx] ?? ''} onChange={(e) => setTypedAnswers((prev) => ({ ...prev, [idx]: e.target.value }))} disabled={submitted} />
                  {submitted && !isCorrect && <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 6 }}>Correct: {q.answer}</div>}
                </div>
              )}
            </div>
          );
        })}
        {!submitted ? (
          <div style={{ textAlign: 'center', paddingTop: 8 }}>
            <button style={S.btn} onClick={submitTest}>Submit Test</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 8, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button style={S.btn} onClick={() => { setConfigured(false); }}>New Test</button>
            <button style={{ ...S.btn, background: 'rgba(15,30,55,0.9)', color: theme.primary, border: '1px solid theme.primaryMuted' }} onClick={() => setView('library')}>Back to Library</button>
          </div>
        )}
      </div>
    </div>
  );
}
