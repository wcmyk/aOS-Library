import React, { useState, useEffect, useCallback } from 'react';
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

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? C.amber : 'none'} stroke={C.amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function ShuffleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function FlashcardsMode() {
  const { sets, activeSetId, answerDirection, updateCard } = useMnemoStore();
  const activeSet = sets.find((s) => s.id === activeSetId);
  const cards = activeSet?.cards ?? [];

  const [shuffled, setShuffled] = useState(false);
  const [order, setOrder] = useState<string[]>(cards.map((c) => c.id));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [unknown, setUnknown] = useState<Set<string>>(new Set());

  useEffect(() => {
    setOrder(cards.map((c) => c.id));
    setIndex(0);
    setFlipped(false);
  }, [activeSetId]);

  const currentCardId = order[index];
  const currentCard = cards.find((c) => c.id === currentCardId);

  const handleShuffle = () => {
    if (!shuffled) {
      setOrder(shuffleArray(cards.map((c) => c.id)));
    } else {
      setOrder(cards.map((c) => c.id));
    }
    setShuffled((v) => !v);
    setIndex(0);
    setFlipped(false);
  };

  const handlePrev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
      setFlipped(false);
    }
  }, [index]);

  const handleNext = useCallback(() => {
    if (index < order.length - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
    }
  }, [index, order.length]);

  const handleFlip = useCallback(() => {
    setFlipped((v) => !v);
  }, []);

  const markKnown = useCallback(() => {
    if (!currentCardId) return;
    setKnown((s) => new Set([...s, currentCardId]));
    setUnknown((s) => { const n = new Set(s); n.delete(currentCardId); return n; });
    handleNext();
  }, [currentCardId, handleNext]);

  const markUnknown = useCallback(() => {
    if (!currentCardId) return;
    setUnknown((s) => new Set([...s, currentCardId]));
    setKnown((s) => { const n = new Set(s); n.delete(currentCardId); return n; });
    handleNext();
  }, [currentCardId, handleNext]);

  const handleStar = (card: Flashcard) => {
    updateCard(activeSetId!, card.id, { starred: !card.starred });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'ArrowLeft') handlePrev();
      else if (e.code === 'ArrowRight') handleNext();
      else if (e.code === 'Space') { e.preventDefault(); handleFlip(); }
      else if (e.code === 'KeyK') markKnown();
      else if (e.code === 'KeyU') markUnknown();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlePrev, handleNext, handleFlip, markKnown, markUnknown]);

  if (!activeSet || cards.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 16 }}>
        No cards in this set. Add some cards first.
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, color: C.text }}>
        <div style={{ fontSize: 48 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11.5 14.5 15 10"/></svg>
        </div>
        <h3 style={{ margin: 0, fontSize: 22 }}>All cards reviewed!</h3>
        <p style={{ margin: 0, color: C.muted }}>
          Known: {known.size} · Unknown: {unknown.size}
        </p>
        <button
          onClick={() => { setIndex(0); setFlipped(false); setKnown(new Set()); setUnknown(new Set()); }}
          style={{ background: C.cyan, color: '#0a1628', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
        >
          Start Over
        </button>
      </div>
    );
  }

  const front = answerDirection === 'term_to_definition' ? currentCard.term : currentCard.definition;
  const back = answerDirection === 'term_to_definition' ? currentCard.definition : currentCard.term;
  const frontLabel = answerDirection === 'term_to_definition' ? 'TERM' : 'DEFINITION';
  const backLabel = answerDirection === 'term_to_definition' ? 'DEFINITION' : 'TERM';

  const isKnown = known.has(currentCardId);
  const isUnknown = unknown.has(currentCardId);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', gap: 20, alignItems: 'center', userSelect: 'none' }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: C.muted, fontSize: 14 }}>
          Card {index + 1} of {order.length}
        </span>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ color: C.green, fontSize: 13, fontWeight: 600 }}>✓ {known.size} Known</span>
          <span style={{ color: C.red, fontSize: 13, fontWeight: 600 }}>✗ {unknown.size} Unknown</span>
        </div>
        <button
          onClick={handleShuffle}
          style={{
            background: shuffled ? 'rgba(167,139,250,0.2)' : 'transparent',
            border: `1px solid ${shuffled ? C.purple : C.border}`,
            borderRadius: 8,
            color: shuffled ? C.purple : C.muted,
            padding: '6px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
          }}
        >
          <ShuffleIcon /> Shuffle
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 700, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
        <div style={{
          height: '100%',
          width: `${((index + 1) / order.length) * 100}%`,
          background: C.cyan,
          borderRadius: 2,
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Card */}
      <div
        style={{ width: '100%', maxWidth: 700, flex: 1, maxHeight: 360, perspective: 1000, cursor: 'pointer' }}
        onClick={handleFlip}
      >
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          minHeight: 280,
        }}>
          {/* Front */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: C.surface,
            border: `1px solid ${isKnown ? C.green : isUnknown ? C.red : C.border}`,
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            boxSizing: 'border-box',
            gap: 16,
          }}>
            <span style={{ color: C.cyan, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>{frontLabel}</span>
            <p style={{ margin: 0, color: C.text, fontSize: 24, fontWeight: 600, textAlign: 'center', lineHeight: 1.4 }}>
              {front}
            </p>
            <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>Click or press Space to flip</p>
          </div>
          {/* Back */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'rgba(10,25,60,0.9)',
            border: `1px solid ${C.cyan}`,
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            boxSizing: 'border-box',
            gap: 16,
          }}>
            <span style={{ color: C.purple, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>{backLabel}</span>
            <p style={{ margin: 0, color: C.text, fontSize: 22, fontWeight: 500, textAlign: 'center', lineHeight: 1.5 }}>
              {back}
            </p>
            {currentCard.notes && (
              <p style={{ margin: 0, color: C.muted, fontSize: 13, textAlign: 'center', fontStyle: 'italic' }}>
                {currentCard.notes}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ width: '100%', maxWidth: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={handlePrev}
          disabled={index === 0}
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 50,
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: index === 0 ? 'default' : 'pointer',
            color: index === 0 ? 'rgba(148,163,184,0.3)' : C.text,
          }}
        >
          <ChevronLeftIcon />
        </button>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={markUnknown}
            style={{
              background: isUnknown ? C.red : 'rgba(239,68,68,0.1)',
              border: `1px solid ${C.red}`,
              borderRadius: 8,
              padding: '10px 20px',
              cursor: 'pointer',
              color: C.text,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            ✗ Don't Know (U)
          </button>
          <button
            onClick={() => handleStar(currentCard)}
            style={{
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: '10px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <StarIcon filled={currentCard.starred} />
          </button>
          <button
            onClick={markKnown}
            style={{
              background: isKnown ? C.green : 'rgba(52,211,153,0.1)',
              border: `1px solid ${C.green}`,
              borderRadius: 8,
              padding: '10px 20px',
              cursor: 'pointer',
              color: isKnown ? '#0a1628' : C.text,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            ✓ Know It (K)
          </button>
        </div>

        <button
          onClick={handleNext}
          disabled={index === order.length - 1}
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 50,
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: index === order.length - 1 ? 'default' : 'pointer',
            color: index === order.length - 1 ? 'rgba(148,163,184,0.3)' : C.text,
          }}
        >
          <ChevronRightIcon />
        </button>
      </div>

      <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>
        Keyboard: ← → navigate · Space flip · K know it · U don't know
      </p>
    </div>
  );
}
