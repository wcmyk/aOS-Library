import React, { useState, useEffect, useMemo } from 'react';
import { useMnemoStore } from '../../state/useMnemoStore';
import type { Flashcard } from '../../types';

const C = {
  surface: 'rgba(10,25,47,0.8)',
  border: 'rgba(148,163,184,0.2)',
  text: '#e8ebf0',
  muted: '#94a3b8',
  cyan: '#7dd3fc',
  purple: '#a78bfa',
  green: '#34d399',
  red: '#ef4444',
  amber: '#f59e0b',
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type PromptType = 'multiple_choice' | 'typing' | 'true_false';
type CardStatus = 'unseen' | 'correct' | 'incorrect';

interface LearnCard {
  card: Flashcard;
  status: CardStatus;
  weight: number;
}

function buildQueue(learnCards: LearnCard[]): Flashcard[] {
  const queue: Flashcard[] = [];
  for (const lc of learnCards) {
    if (lc.status !== 'correct') {
      for (let i = 0; i < lc.weight; i++) {
        queue.push(lc.card);
      }
    }
  }
  return shuffleArray(queue);
}

function getOptions(correct: string, allCards: Flashcard[], field: 'term' | 'definition'): string[] {
  const wrong = allCards
    .map((c) => c[field])
    .filter((v) => v !== correct);
  const shuffled = shuffleArray(wrong).slice(0, 3);
  return shuffleArray([correct, ...shuffled]);
}

export function LearnMode() {
  const { sets, activeSetId, answerDirection, setAnswerDirection } = useMnemoStore();
  const activeSet = sets.find((s) => s.id === activeSetId);
  const cards = activeSet?.cards ?? [];

  const [learnCards, setLearnCards] = useState<LearnCard[]>(() =>
    cards.map((c) => ({ card: c, status: 'unseen' as CardStatus, weight: 1 })),
  );
  const [queue, setQueue] = useState<Flashcard[]>(() => shuffleArray(cards));
  const [queueIdx, setQueueIdx] = useState(0);
  const [promptType, setPromptType] = useState<PromptType>('multiple_choice');
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [promptCount, setPromptCount] = useState(0);

  const promptTypes: PromptType[] = ['multiple_choice', 'typing', 'true_false'];

  useEffect(() => {
    setLearnCards(cards.map((c) => ({ card: c, status: 'unseen' as CardStatus, weight: 1 })));
    setQueue(shuffleArray(cards));
    setQueueIdx(0);
    setPromptCount(0);
    setDone(false);
    setSubmitted(false);
    setAnswer('');
    setIsCorrect(null);
  }, [activeSetId]);

  const currentCard = queue[queueIdx];

  useEffect(() => {
    if (!currentCard) return;
    const pt = promptTypes[promptCount % promptTypes.length];
    setPromptType(pt);
    if (pt === 'multiple_choice') {
      const correctField = answerDirection === 'term_to_definition' ? 'definition' : 'term';
      const correct = currentCard[correctField];
      setOptions(getOptions(correct, cards, correctField));
    } else if (pt === 'true_false') {
      const useReal = Math.random() > 0.5;
      if (!useReal) {
        const wrong = cards.filter((c) => c.id !== currentCard.id);
        const wrongCard = wrong[Math.floor(Math.random() * wrong.length)];
        if (wrongCard) {
          const correctField = answerDirection === 'term_to_definition' ? 'definition' : 'term';
          setOptions([wrongCard[correctField]]);
        } else {
          setOptions([currentCard[answerDirection === 'term_to_definition' ? 'definition' : 'term']]);
        }
      } else {
        const correctField = answerDirection === 'term_to_definition' ? 'definition' : 'term';
        setOptions([currentCard[correctField]]);
      }
    }
    setAnswer('');
    setSubmitted(false);
    setIsCorrect(null);
  }, [queueIdx, currentCard?.id, answerDirection, promptCount]);

  const questionField = answerDirection === 'term_to_definition' ? 'term' : 'definition';
  const answerField = answerDirection === 'term_to_definition' ? 'definition' : 'term';

  const correctAnswer = currentCard?.[answerField] ?? '';

  const handleSubmit = (userAnswer: string) => {
    if (submitted || !currentCard) return;
    const correct = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    setIsCorrect(correct);
    setSubmitted(true);
    setAnswer(userAnswer);

    setLearnCards((prev) =>
      prev.map((lc) => {
        if (lc.card.id !== currentCard.id) return lc;
        if (correct) return { ...lc, status: 'correct', weight: 1 };
        return { ...lc, status: 'incorrect', weight: 2 };
      }),
    );
  };

  const handleNext = () => {
    if (!submitted) return;
    const nextIdx = queueIdx + 1;
    const updatedLearnCards = learnCards.map((lc) => {
      if (lc.card.id !== currentCard?.id) return lc;
      const correct = isCorrect ?? false;
      if (correct) return { ...lc, status: 'correct' as CardStatus, weight: 1 };
      return { ...lc, status: 'incorrect' as CardStatus, weight: 2 };
    });

    if (nextIdx >= queue.length) {
      const remaining = updatedLearnCards.filter((lc) => lc.status !== 'correct');
      if (remaining.length === 0) {
        setDone(true);
        return;
      }
      const newQueue = buildQueue(updatedLearnCards);
      setQueue(newQueue);
      setQueueIdx(0);
    } else {
      setQueueIdx(nextIdx);
    }
    setLearnCards(updatedLearnCards);
    setPromptCount((c) => c + 1);
  };

  const masteredCount = learnCards.filter((lc) => lc.status === 'correct').length;
  const progress = cards.length > 0 ? masteredCount / cards.length : 0;

  if (!activeSet || cards.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 16 }}>
        No cards in this set.
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="9 12 11.5 14.5 15 10" strokeWidth="2.5"/>
        </svg>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 8px', color: C.text, fontSize: 26 }}>Mastered!</h2>
          <p style={{ margin: 0, color: C.muted, fontSize: 16 }}>You correctly answered all {cards.length} cards.</p>
        </div>
        <button
          onClick={() => {
            setLearnCards(cards.map((c) => ({ card: c, status: 'unseen', weight: 1 })));
            setQueue(shuffleArray(cards));
            setQueueIdx(0);
            setPromptCount(0);
            setDone(false);
          }}
          style={{ background: C.cyan, color: '#0a1628', border: 'none', borderRadius: 8, padding: '12px 28px', cursor: 'pointer', fontWeight: 700, fontSize: 15 }}
        >
          Study Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', gap: 20, overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: C.text, fontSize: 16, fontWeight: 600 }}>Learn Mode</h3>
        <button
          onClick={() => setAnswerDirection(answerDirection === 'term_to_definition' ? 'definition_to_term' : 'term_to_definition')}
          style={{
            background: 'rgba(167,139,250,0.1)',
            border: `1px solid ${C.purple}`,
            borderRadius: 8,
            padding: '6px 14px',
            cursor: 'pointer',
            color: C.purple,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {answerDirection === 'term_to_definition' ? 'Term → Def' : 'Def → Term'}
        </button>
      </div>

      {/* Progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: C.muted, fontSize: 13 }}>Progress</span>
          <span style={{ color: C.cyan, fontSize: 13, fontWeight: 600 }}>{masteredCount}/{cards.length} mastered</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: C.green, borderRadius: 3, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Question card */}
      {currentCard && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
          <div style={{
            width: '100%',
            maxWidth: 640,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: '28px 32px',
            textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 8px', color: C.cyan, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>
              {answerDirection === 'term_to_definition' ? 'TERM' : 'DEFINITION'}
            </p>
            <p style={{ margin: 0, color: C.text, fontSize: 22, fontWeight: 600, lineHeight: 1.4 }}>
              {currentCard[questionField]}
            </p>
          </div>

          {/* Answer area */}
          <div style={{ width: '100%', maxWidth: 640 }}>
            {promptType === 'multiple_choice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ margin: '0 0 4px', color: C.muted, fontSize: 13 }}>Choose the correct answer:</p>
                {options.map((opt) => {
                  let bg = C.surface;
                  let borderColor = C.border;
                  if (submitted) {
                    if (opt === correctAnswer) { bg = 'rgba(52,211,153,0.15)'; borderColor = C.green; }
                    else if (opt === answer && !isCorrect) { bg = 'rgba(239,68,68,0.15)'; borderColor = C.red; }
                  }
                  return (
                    <button
                      key={opt}
                      onClick={() => !submitted && handleSubmit(opt)}
                      style={{
                        background: bg,
                        border: `1px solid ${borderColor}`,
                        borderRadius: 10,
                        padding: '14px 18px',
                        cursor: submitted ? 'default' : 'pointer',
                        color: C.text,
                        textAlign: 'left',
                        fontSize: 15,
                        transition: 'border-color 0.2s, background 0.2s',
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {promptType === 'typing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ margin: '0 0 4px', color: C.muted, fontSize: 13 }}>Type the answer:</p>
                <input
                  value={answer}
                  onChange={(e) => !submitted && setAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !submitted && handleSubmit(answer)}
                  disabled={submitted}
                  placeholder="Your answer..."
                  style={{
                    background: submitted
                      ? isCorrect ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)'
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${submitted ? (isCorrect ? C.green : C.red) : C.border}`,
                    borderRadius: 10,
                    padding: '14px 16px',
                    color: C.text,
                    fontSize: 16,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                {!submitted && (
                  <button
                    onClick={() => handleSubmit(answer)}
                    style={{ background: C.cyan, color: '#0a1628', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 14, alignSelf: 'flex-start' }}
                  >
                    Submit
                  </button>
                )}
              </div>
            )}

            {promptType === 'true_false' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ margin: '0 0 4px', color: C.muted, fontSize: 13 }}>
                  Is this the correct answer?
                </p>
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: '14px 18px',
                  color: C.text,
                  fontSize: 15,
                  marginBottom: 8,
                }}>
                  {options[0]}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['True', 'False'].map((opt) => {
                    const isTrue = options[0] === correctAnswer;
                    const userPicked = opt === answer;
                    let bg = C.surface;
                    let borderColor = C.border;
                    if (submitted && userPicked) {
                      bg = isCorrect ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)';
                      borderColor = isCorrect ? C.green : C.red;
                    }
                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          if (submitted) return;
                          const userSaysTrue = opt === 'True';
                          const actuallyTrue = options[0] === correctAnswer;
                          const correct = userSaysTrue === actuallyTrue;
                          setAnswer(opt);
                          handleSubmit(correct ? correctAnswer : 'wrong');
                        }}
                        style={{
                          flex: 1,
                          background: bg,
                          border: `1px solid ${borderColor}`,
                          borderRadius: 10,
                          padding: '14px',
                          cursor: submitted ? 'default' : 'pointer',
                          color: C.text,
                          fontSize: 16,
                          fontWeight: 600,
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feedback */}
            {submitted && (
              <div style={{
                marginTop: 14,
                padding: '14px 16px',
                borderRadius: 10,
                background: isCorrect ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${isCorrect ? C.green : C.red}`,
              }}>
                <p style={{ margin: '0 0 4px', color: isCorrect ? C.green : C.red, fontWeight: 700, fontSize: 14 }}>
                  {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </p>
                {!isCorrect && (
                  <p style={{ margin: 0, color: C.text, fontSize: 14 }}>
                    Correct answer: <strong>{correctAnswer}</strong>
                  </p>
                )}
                <button
                  onClick={handleNext}
                  style={{
                    marginTop: 10,
                    background: C.cyan,
                    color: '#0a1628',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 20px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  Continue →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
