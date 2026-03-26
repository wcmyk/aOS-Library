import { useState, useEffect, useCallback, useRef } from 'react';
import { useMnemoStore } from '../../state/useMnemoStore';
import type { Flashcard } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────
const COLS = 10, ROWS = 20;
const COLORS: Record<string, string> = { I: '#7dd3fc', O: '#f59e0b', T: '#a78bfa', S: '#34d399', Z: '#ef4444', J: '#818cf8', L: '#fb923c' };
const PIECES: Record<string, number[][]> = {
  I: [[1,1,1,1]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1]],
  S: [[0,1,1],[1,1,0]],
  Z: [[1,1,0],[0,1,1]],
  J: [[1,0,0],[1,1,1]],
  L: [[0,0,1],[1,1,1]],
};
const PIECE_KEYS = Object.keys(PIECES);
const TICK_MS = 650;

type Board = (string | null)[][];
interface Piece { type: string; shape: number[][]; x: number; y: number; }

function emptyBoard(): Board { return Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }
function randPiece(): Piece {
  const type = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
  const shape = PIECES[type];
  return { type, shape, x: Math.floor((COLS - shape[0].length) / 2), y: 0 };
}
function rotate(shape: number[][]): number[][] {
  return shape[0].map((_, i) => shape.map((row) => row[i]).reverse());
}
function fits(board: Board, piece: Piece, dx = 0, dy = 0, shape = piece.shape): boolean {
  for (let r = 0; r < shape.length; r++) for (let c = 0; c < shape[r].length; c++) {
    if (!shape[r][c]) continue;
    const nx = piece.x + c + dx, ny = piece.y + r + dy;
    if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
    if (ny >= 0 && board[ny][nx]) return false;
  }
  return true;
}
function place(board: Board, piece: Piece): Board {
  const b = board.map((row) => [...row]);
  const color = COLORS[piece.type];
  piece.shape.forEach((row, r) => row.forEach((v, c) => { if (v) { const y = piece.y + r, x = piece.x + c; if (y >= 0) b[y][x] = color; } }));
  return b;
}
function clearLines(board: Board): { board: Board; cleared: number } {
  const kept = board.filter((row) => row.some((c) => c === null));
  const cleared = ROWS - kept.length;
  const top = Array.from({ length: cleared }, () => Array(COLS).fill(null));
  return { board: [...top, ...kept], cleared };
}
function addRubble(board: Board): Board {
  const b = board.slice(1);
  const row = Array.from({ length: COLS }, () => Math.random() > 0.45 ? '#334155' : null);
  return [...b, row];
}
function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export function TetrisGame() {
  const { sets, activeSetId, startSession, recordResult, endSession, setView } = useMnemoStore();
  const activeSet = sets.find((s) => s.id === activeSetId);
  const cards = activeSet?.cards ?? [];

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(480);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    ro.observe(el);
    setContainerHeight(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  const cellSize = Math.max(20, Math.min(32, Math.floor(containerHeight * 0.85 / ROWS)));

  const [board, setBoard] = useState<Board>(emptyBoard);
  const [piece, setPiece] = useState<Piece>(randPiece);
  const [next, setNext] = useState<Piece>(randPiece);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [piecesPlaced, setPiecesPlaced] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [question, setQuestion] = useState<{ card: Flashcard; choices: string[]; answer: string } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState({ correct: 0, total: 0 });
  const [started, setStarted] = useState(false);

  const boardRef = useRef(board);
  const pieceRef = useRef(piece);
  boardRef.current = board;
  pieceRef.current = piece;

  function spawnQuestion() {
    if (cards.length === 0) return;
    const card = cards[Math.floor(Math.random() * cards.length)];
    const answer = card.definition;
    const wrong = shuffle(cards.filter((c) => c.id !== card.id).map((c) => c.definition)).slice(0, 3);
    setQuestion({ card, choices: shuffle([answer, ...wrong]), answer });
    setPaused(true);
    setFeedback(null);
  }

  function lock(b: Board, p: Piece) {
    const placed = place(b, p);
    const { board: cleared, cleared: n } = clearLines(placed);
    setBoard(cleared);
    setLines((l) => l + n);
    setScore((s) => s + n * 100 + 10);

    const newPiecesPlaced = piecesPlaced + 1;
    setPiecesPlaced(newPiecesPlaced);

    const spawned = next;
    const nextNext = randPiece();
    setNext(nextNext);

    if (!fits(cleared, spawned)) { setGameOver(true); endSession(); return; }
    setPiece(spawned);

    if (newPiecesPlaced % 3 === 0 && cards.length > 0) {
      const card = cards[Math.floor(Math.random() * cards.length)];
      const answer = card.definition;
      const wrong = shuffle(cards.filter((c) => c.id !== card.id).map((c) => c.definition)).slice(0, 3);
      setQuestion({ card, choices: shuffle([answer, ...wrong]), answer });
      setPaused(true);
      setFeedback(null);
    }
  }

  // Game tick
  useEffect(() => {
    if (!started || paused || gameOver) return;
    const id = setInterval(() => {
      const b = boardRef.current, p = pieceRef.current;
      if (fits(b, p, 0, 1)) { setPiece((prev) => ({ ...prev, y: prev.y + 1 })); }
      else { lock(b, p); }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [started, paused, gameOver, piecesPlaced, next]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!started || paused || gameOver || question) return;
    const b = boardRef.current, p = pieceRef.current;
    if (e.key === 'ArrowLeft' && fits(b, p, -1, 0)) setPiece((prev) => ({ ...prev, x: prev.x - 1 }));
    if (e.key === 'ArrowRight' && fits(b, p, 1, 0)) setPiece((prev) => ({ ...prev, x: prev.x + 1 }));
    if (e.key === 'ArrowDown' && fits(b, p, 0, 1)) setPiece((prev) => ({ ...prev, y: prev.y + 1 }));
    if (e.key === 'ArrowUp') { const r = rotate(p.shape); if (fits(b, { ...p, shape: r }, 0, 0)) setPiece((prev) => ({ ...prev, shape: r })); }
    if (e.key === ' ') { let dy = 0; while (fits(b, p, 0, dy + 1)) dy++; lock(b, { ...p, y: p.y + dy }); e.preventDefault(); }
  }, [started, paused, gameOver, question]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  function answerQuestion(choice: string) {
    if (!question) return;
    const correct = choice === question.answer;
    setAccuracy((a) => ({ correct: a.correct + (correct ? 1 : 0), total: a.total + 1 }));
    recordResult(question.card.id, correct, 0);
    setFeedback(correct ? 'Correct! +3 pieces' : `Wrong. Answer: ${question.answer}`);
    if (!correct) setBoard((b) => addRubble(b));
    setTimeout(() => { setQuestion(null); setPaused(false); setFeedback(null); }, 1400);
  }

  function startGame() {
    startSession(activeSet?.id ?? '', 'game_tetris');
    setBoard(emptyBoard()); setPiece(randPiece()); setNext(randPiece());
    setScore(0); setLines(0); setPiecesPlaced(0); setGameOver(false); setPaused(false); setQuestion(null); setAccuracy({ correct: 0, total: 0 }); setStarted(true);
  }

  // Render board with ghost piece and current piece
  const display = board.map((row) => [...row]);
  // Ghost piece
  let ghostY = piece.y;
  while (fits(board, piece, 0, ghostY - piece.y + 1)) ghostY++;
  piece.shape.forEach((row, r) => row.forEach((v, c) => { if (v && piece.y + r >= 0 && ghostY !== piece.y) { const gy = ghostY + r, gx = piece.x + c; if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS && !display[gy][gx]) display[gy][gx] = 'ghost_' + COLORS[piece.type]; } }));
  // Current piece
  piece.shape.forEach((row, r) => row.forEach((v, c) => { if (v) { const y = piece.y + r, x = piece.x + c; if (y >= 0 && y < ROWS && x >= 0 && x < COLS) display[y][x] = COLORS[piece.type]; } }));

  if (!started || gameOver) {
    return (
      <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: '#06111f', color: '#e2e8f0', width: '100%', height: '100%' }}>
        {gameOver && (
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>Game Over</div>
            <div style={{ fontSize: 14, color: '#64748b' }}>Score: {score} · Lines: {lines} · Accuracy: {accuracy.total > 0 ? Math.round(accuracy.correct / accuracy.total * 100) : 0}%</div>
          </div>
        )}
        {!gameOver && (
          <>
            <svg width="56" height="56" viewBox="0 0 56 56"><rect x="4" y="24" width="12" height="12" rx="2" fill="#7dd3fc" /><rect x="16" y="24" width="12" height="12" rx="2" fill="#7dd3fc" /><rect x="16" y="12" width="12" height="12" rx="2" fill="#7dd3fc" /><rect x="28" y="24" width="12" height="12" rx="2" fill="#7dd3fc" /><rect x="32" y="36" width="12" height="12" rx="2" fill="#a78bfa" /></svg>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Tetris Study</div>
            <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center', maxWidth: 340 }}>Every 3 pieces placed, answer a study question. Correct = keep playing. Wrong = penalty row added.</div>
            <div style={{ fontSize: 12, color: '#475569' }}>Arrow keys to move · ↑ to rotate · Space to drop hard</div>
          </>
        )}
        <button style={{ padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#7dd3fc', color: '#06111f' }} onClick={startGame}>
          {gameOver ? 'Play Again' : 'Start'}
        </button>
        {gameOver && <button style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: '1px solid rgba(125,211,252,0.3)', background: 'transparent', color: '#7dd3fc' }} onClick={() => setView('library')}>Back</button>}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ flex: 1, display: 'flex', background: '#06111f', gap: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Board */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: 16 }}>
        <div style={{ position: 'relative' }}>
          <svg width={COLS * cellSize} height={ROWS * cellSize} style={{ border: '1px solid rgba(148,163,184,0.15)', borderRadius: 4, display: 'block' }}>
            {/* Background grid */}
            {Array.from({ length: ROWS }).map((_, r) => Array.from({ length: COLS }).map((__, c) => (
              <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="rgba(10,25,47,0.8)" stroke="rgba(148,163,184,0.06)" strokeWidth="0.5" />
            )))}
            {/* Cells */}
            {display.map((row, r) => row.map((cell, c) => {
              if (!cell) return null;
              const isGhost = cell.startsWith('ghost_');
              const color = isGhost ? cell.replace('ghost_', '') : cell;
              return (
                <rect key={`c${r}-${c}`} x={c * cellSize + 1} y={r * cellSize + 1} width={cellSize - 2} height={cellSize - 2} rx={2}
                  fill={isGhost ? 'none' : color} stroke={color} strokeWidth={isGhost ? 1 : 0}
                  opacity={isGhost ? 0.3 : 1} />
              );
            }))}
          </svg>
          {/* Question overlay */}
          {question && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,17,31,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 14, borderRadius: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Study Question</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', textAlign: 'center' }}>{question.card.term}</div>
              {feedback ? (
                <div style={{ fontSize: 13, color: feedback.startsWith('Correct') ? '#34d399' : '#ef4444', textAlign: 'center', fontWeight: 500 }}>{feedback}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                  {question.choices.map((ch) => (
                    <button key={ch} onClick={() => answerQuestion(ch)} style={{ padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(15,30,55,0.9)', color: '#cbd5e1', textAlign: 'left' }}>{ch}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Side panel */}
      <div style={{ width: 140, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 16, borderLeft: '1px solid rgba(148,163,184,0.1)', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Score</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#7dd3fc', fontFamily: 'monospace' }}>{score}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Lines</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>{lines}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Accuracy</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: accuracy.total === 0 ? '#475569' : accuracy.correct / accuracy.total >= 0.7 ? '#34d399' : '#f59e0b' }}>
            {accuracy.total === 0 ? '—' : `${Math.round(accuracy.correct / accuracy.total * 100)}%`}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Next</div>
          <svg width={4 * cellSize} height={4 * cellSize} style={{ background: 'rgba(10,25,47,0.8)', borderRadius: 4 }}>
            {next.shape.map((row, r) => row.map((v, c) => v ? <rect key={`n${r}${c}`} x={c * cellSize + 2} y={r * cellSize + 8} width={cellSize - 3} height={cellSize - 3} rx={2} fill={COLORS[next.type]} /> : null))}
          </svg>
        </div>
        <button style={{ marginTop: 'auto', padding: '7px', borderRadius: 7, fontSize: 11, cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444' }} onClick={() => { setGameOver(true); endSession(); }}>
          End
        </button>
      </div>
    </div>
  );
}
