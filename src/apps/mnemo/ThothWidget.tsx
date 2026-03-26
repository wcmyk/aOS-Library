import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMnemoStore } from './state/useMnemoStore';
import { useThothWidgetStore, type ThothWidget as ThothWidgetType } from '../../state/useThothWidgetStore';
import type { ThemeColor } from './types';

const THEMES: Record<ThemeColor, { primary: string; primaryMuted: string; bg: string }> = {
  blue:          { primary: '#7dd3fc', primaryMuted: 'rgba(125,211,252,0.15)', bg: '#06111f' },
  pastel_pink:   { primary: '#f9a8d4', primaryMuted: 'rgba(249,168,212,0.15)', bg: '#1a0d14' },
  pastel_red:    { primary: '#fca5a5', primaryMuted: 'rgba(252,165,165,0.15)', bg: '#1a0a0a' },
  forest_green:  { primary: '#86efac', primaryMuted: 'rgba(134,239,172,0.15)', bg: '#061a0f' },
  dark_blue:     { primary: '#818cf8', primaryMuted: 'rgba(129,140,248,0.15)', bg: '#08091f' },
  pastel_purple: { primary: '#c4b5fd', primaryMuted: 'rgba(196,181,253,0.15)', bg: '#100d1a' },
  pastel_yellow: { primary: '#fef08a', primaryMuted: 'rgba(254,240,138,0.15)', bg: '#1a1800' },
  dark_yellow:   { primary: '#fcd34d', primaryMuted: 'rgba(252,211,77,0.15)', bg: '#1a1200' },
};

const FLIP_DELAY = 10000; // 10 seconds to show front
const ADVANCE_DELAY = 4000; // 4 seconds after flip to advance

export function ThothWidget({ widget }: { widget: ThothWidgetType }) {
  const { sets, themeColor } = useMnemoStore();
  const { removeWidget, moveWidget } = useThothWidgetStore();
  const theme = THEMES[themeColor];

  const studySet = sets.find((s) => s.id === widget.setId);

  // Get cards filtered by phase
  const allCards = studySet?.cards ?? [];
  const cards = widget.phaseId
    ? allCards.filter((c) => c.phaseId === widget.phaseId)
    : allCards;

  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [progress, setProgress] = useState(0); // 0..100 for the 10s countdown

  const flipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (flipTimerRef.current) { clearTimeout(flipTimerRef.current); flipTimerRef.current = null; }
    if (advanceTimerRef.current) { clearTimeout(advanceTimerRef.current); advanceTimerRef.current = null; }
    if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }
  }, []);

  const startFlipTimer = useCallback(() => {
    clearTimers();
    setIsFlipped(false);
    setProgress(0);
    startTimeRef.current = Date.now();

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / FLIP_DELAY) * 100, 100);
      setProgress(pct);
    }, 50);

    flipTimerRef.current = setTimeout(() => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setProgress(100);
      setIsFlipped(true);
      advanceTimerRef.current = setTimeout(() => {
        setCardIndex((prev) => (cards.length > 0 ? (prev + 1) % cards.length : 0));
      }, ADVANCE_DELAY);
    }, FLIP_DELAY);
  }, [clearTimers, cards.length]);

  // Reset timer when card changes
  useEffect(() => {
    if (cards.length > 0) {
      startFlipTimer();
    }
    return clearTimers;
  }, [cardIndex, cards.length, startFlipTimer, clearTimers]);

  const handleFlip = () => {
    clearTimers();
    setProgress(100);
    setIsFlipped(true);
    advanceTimerRef.current = setTimeout(() => {
      setCardIndex((prev) => (cards.length > 0 ? (prev + 1) % cards.length : 0));
    }, ADVANCE_DELAY);
  };

  const handlePrev = () => {
    clearTimers();
    setCardIndex((prev) => (cards.length > 0 ? (prev - 1 + cards.length) % cards.length : 0));
  };

  const handleNext = () => {
    clearTimers();
    setCardIndex((prev) => (cards.length > 0 ? (prev + 1) % cards.length : 0));
  };

  // Drag behavior
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const handleHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: widget.x,
      origY: widget.y,
    };

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      moveWidget(widget.id, dragRef.current.origX + dx, dragRef.current.origY + dy);
    };

    const onMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [widget.id, widget.x, widget.y, moveWidget]);

  if (!studySet || cards.length === 0) {
    return (
      <div style={{
        position: 'absolute',
        left: widget.x,
        top: widget.y,
        width: 300,
        height: 120,
        background: 'rgba(6,17,31,0.95)',
        border: `1px solid ${theme.primary}`,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${theme.primaryMuted}`,
        zIndex: 9999,
        userSelect: 'none',
      }}>
        <div
          onMouseDown={handleHeaderMouseDown}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: theme.primaryMuted,
            cursor: 'grab',
            borderBottom: `1px solid ${theme.primary}33`,
            flexShrink: 0,
          }}
        >
          <span style={{ color: theme.primary, fontSize: 11, fontWeight: 700 }}>
            {studySet?.title ?? 'Unknown Set'}
          </span>
          <button
            onClick={() => removeWidget(widget.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, lineHeight: 1, padding: 0 }}
          >
            ×
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 13 }}>
          No cards available
        </div>
      </div>
    );
  }

  const card = cards[cardIndex % cards.length];
  const front = widget.direction === 'term_to_definition' ? card.term : card.definition;
  const back = widget.direction === 'term_to_definition' ? card.definition : card.term;
  const frontLabel = widget.direction === 'term_to_definition' ? 'TERM' : 'DEFINITION';
  const backLabel = widget.direction === 'term_to_definition' ? 'DEFINITION' : 'TERM';

  return (
    <div style={{
      position: 'absolute',
      left: widget.x,
      top: widget.y,
      width: 300,
      height: 195,
      background: 'rgba(6,17,31,0.95)',
      border: `1px solid ${theme.primary}`,
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${theme.primaryMuted}`,
      zIndex: 9999,
      userSelect: 'none',
      fontFamily: "'SF Pro Display', Inter, system-ui, sans-serif",
    }}>
      {/* Header */}
      <div
        onMouseDown={handleHeaderMouseDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 10px',
          background: theme.primaryMuted,
          cursor: 'grab',
          borderBottom: `1px solid ${theme.primary}33`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          <span style={{ color: theme.primary, fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170 }}>
            {studySet.title}
          </span>
          <span style={{
            fontSize: 9,
            color: '#64748b',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 4,
            padding: '1px 5px',
            flexShrink: 0,
          }}>
            {widget.direction === 'term_to_definition' ? 'T→D' : 'D→T'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#475569', fontSize: 10 }}>{(cardIndex % cards.length) + 1}/{cards.length}</span>
          <button
            onClick={() => removeWidget(widget.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 16, lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center' }}
            title="Remove widget"
          >
            ×
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: theme.primary,
          transition: 'width 0.1s linear',
          borderRadius: '0 1px 1px 0',
        }} />
      </div>

      {/* Card flip area */}
      <div style={{ flex: 1, perspective: '1000px', overflow: 'hidden', cursor: 'pointer' }} onClick={!isFlipped ? handleFlip : undefined}>
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
          {/* Front face */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 16px',
            gap: 6,
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{frontLabel}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', textAlign: 'center', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
              {front}
            </div>
            <div style={{ fontSize: 10, color: '#334155', marginTop: 4 }}>tap to flip</div>
          </div>

          {/* Back face */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 16px',
            gap: 6,
            background: theme.primaryMuted,
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: theme.primary, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>{backLabel}</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0', textAlign: 'center', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
              {back}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '5px 10px',
        borderTop: `1px solid rgba(148,163,184,0.08)`,
        flexShrink: 0,
      }}>
        <button
          onClick={handlePrev}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#475569',
            fontSize: 16,
            padding: '2px 8px',
            borderRadius: 4,
            lineHeight: 1,
          }}
          title="Previous card"
        >
          ←
        </button>

        <button
          onClick={isFlipped ? handleNext : handleFlip}
          style={{
            background: theme.primaryMuted,
            border: `1px solid ${theme.primary}44`,
            borderRadius: 6,
            padding: '3px 12px',
            cursor: 'pointer',
            color: theme.primary,
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          {isFlipped ? 'Next →' : 'Flip'}
        </button>

        <button
          onClick={handleNext}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#475569',
            fontSize: 16,
            padding: '2px 8px',
            borderRadius: 4,
            lineHeight: 1,
          }}
          title="Next card"
        >
          →
        </button>
      </div>
    </div>
  );
}
