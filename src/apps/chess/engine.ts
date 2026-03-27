import type { Color, Piece, PieceType, Square } from './types';

type Coord = { x: number; y: number };
export type Move = {
  from: Square;
  to: Square;
  promotion?: Exclude<PieceType, 'k' | 'p'>;
  san?: string;
};

export type Position = {
  board: Record<Square, Piece | null>;
  turn: Color;
  castling: { wk: boolean; wq: boolean; bk: boolean; bq: boolean };
  enPassant: Square | null;
  halfmoveClock: number;
  fullmove: number;
  historyHashes: string[];
  pgn: string[];
};

const files = 'abcdefgh';

export const sq = (x: number, y: number): Square => `${files[x]}${y + 1}` as Square;
export const toCoord = (s: Square): Coord => ({ x: files.indexOf(s[0]), y: Number(s[1]) - 1 });
const inBounds = (x: number, y: number) => x >= 0 && x < 8 && y >= 0 && y < 8;

export function initialPosition(): Position {
  const board = {} as Record<Square, Piece | null>;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) board[sq(x, y)] = null;
  const set = (s: Square, type: PieceType, color: Color) => (board[s] = { type, color });

  (['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const).forEach((f) => {
    set(`${f}2`, 'p', 'w');
    set(`${f}7`, 'p', 'b');
  });
  set('a1', 'r', 'w'); set('h1', 'r', 'w'); set('a8', 'r', 'b'); set('h8', 'r', 'b');
  set('b1', 'n', 'w'); set('g1', 'n', 'w'); set('b8', 'n', 'b'); set('g8', 'n', 'b');
  set('c1', 'b', 'w'); set('f1', 'b', 'w'); set('c8', 'b', 'b'); set('f8', 'b', 'b');
  set('d1', 'q', 'w'); set('d8', 'q', 'b'); set('e1', 'k', 'w'); set('e8', 'k', 'b');

  const pos: Position = {
    board,
    turn: 'w',
    castling: { wk: true, wq: true, bk: true, bq: true },
    enPassant: null,
    halfmoveClock: 0,
    fullmove: 1,
    historyHashes: [],
    pgn: [],
  };
  pos.historyHashes.push(positionHash(pos));
  return pos;
}

const clonePosition = (p: Position): Position => ({
  ...p,
  board: { ...p.board },
  castling: { ...p.castling },
  historyHashes: [...p.historyHashes],
  pgn: [...p.pgn],
});

function rayMoves(pos: Position, from: Square, deltas: Array<[number, number]>, color: Color, once = false): Square[] {
  const c = toCoord(from);
  const targets: Square[] = [];
  for (const [dx, dy] of deltas) {
    let x = c.x + dx;
    let y = c.y + dy;
    while (inBounds(x, y)) {
      const target = sq(x, y);
      const piece = pos.board[target];
      if (!piece) targets.push(target);
      else {
        if (piece.color !== color) targets.push(target);
        break;
      }
      if (once) break;
      x += dx;
      y += dy;
    }
  }
  return targets;
}

function isAttacked(pos: Position, target: Square, by: Color): boolean {
  for (const from of Object.keys(pos.board) as Square[]) {
    const piece = pos.board[from];
    if (!piece || piece.color !== by) continue;
    const moves = pseudoMoves(pos, from, true);
    if (moves.some((m) => m.to === target)) return true;
  }
  return false;
}

function kingSquare(pos: Position, color: Color): Square {
  const found = (Object.keys(pos.board) as Square[]).find((s) => pos.board[s]?.type === 'k' && pos.board[s]?.color === color);
  if (!found) throw new Error('King missing');
  return found;
}

function pseudoMoves(pos: Position, from: Square, attacksOnly = false): Move[] {
  const piece = pos.board[from];
  if (!piece) return [];
  const c = toCoord(from);
  const moves: Move[] = [];

  if (piece.type === 'p') {
    const dir = piece.color === 'w' ? 1 : -1;
    const startRank = piece.color === 'w' ? 1 : 6;
    const promotionRank = piece.color === 'w' ? 7 : 0;

    if (!attacksOnly) {
      const oneY = c.y + dir;
      if (inBounds(c.x, oneY) && !pos.board[sq(c.x, oneY)]) {
        if (oneY === promotionRank) {
          ['q', 'r', 'b', 'n'].forEach((promo) => moves.push({ from, to: sq(c.x, oneY), promotion: promo as any }));
        } else {
          moves.push({ from, to: sq(c.x, oneY) });
        }
        const twoY = c.y + dir * 2;
        if (c.y === startRank && !pos.board[sq(c.x, twoY)]) moves.push({ from, to: sq(c.x, twoY) });
      }
    }

    for (const dx of [-1, 1]) {
      const x = c.x + dx;
      const y = c.y + dir;
      if (!inBounds(x, y)) continue;
      const target = sq(x, y);
      const occupant = pos.board[target];
      if (occupant && occupant.color !== piece.color) {
        if (y === promotionRank) ['q', 'r', 'b', 'n'].forEach((promo) => moves.push({ from, to: target, promotion: promo as any }));
        else moves.push({ from, to: target });
      }
      if (pos.enPassant === target) moves.push({ from, to: target });
    }
  }

  if (piece.type === 'n') {
    rayMoves(pos, from, [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]], piece.color, true)
      .forEach((to) => moves.push({ from, to }));
  }

  if (piece.type === 'b') rayMoves(pos, from, [[1,1],[-1,1],[1,-1],[-1,-1]], piece.color).forEach((to) => moves.push({ from, to }));
  if (piece.type === 'r') rayMoves(pos, from, [[1,0],[-1,0],[0,1],[0,-1]], piece.color).forEach((to) => moves.push({ from, to }));
  if (piece.type === 'q') rayMoves(pos, from, [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]], piece.color).forEach((to) => moves.push({ from, to }));

  if (piece.type === 'k') {
    rayMoves(pos, from, [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]], piece.color, true).forEach((to) => moves.push({ from, to }));
    if (!attacksOnly) {
      if (piece.color === 'w' && from === 'e1') {
        if (pos.castling.wk && !pos.board.f1 && !pos.board.g1 && !isAttacked(pos, 'e1', 'b') && !isAttacked(pos, 'f1', 'b') && !isAttacked(pos, 'g1', 'b')) moves.push({ from, to: 'g1' });
        if (pos.castling.wq && !pos.board.d1 && !pos.board.c1 && !pos.board.b1 && !isAttacked(pos, 'e1', 'b') && !isAttacked(pos, 'd1', 'b') && !isAttacked(pos, 'c1', 'b')) moves.push({ from, to: 'c1' });
      }
      if (piece.color === 'b' && from === 'e8') {
        if (pos.castling.bk && !pos.board.f8 && !pos.board.g8 && !isAttacked(pos, 'e8', 'w') && !isAttacked(pos, 'f8', 'w') && !isAttacked(pos, 'g8', 'w')) moves.push({ from, to: 'g8' });
        if (pos.castling.bq && !pos.board.d8 && !pos.board.c8 && !pos.board.b8 && !isAttacked(pos, 'e8', 'w') && !isAttacked(pos, 'd8', 'w') && !isAttacked(pos, 'c8', 'w')) moves.push({ from, to: 'c8' });
      }
    }
  }

  return moves;
}

export function legalMoves(pos: Position, color = pos.turn): Move[] {
  const all: Move[] = [];
  for (const from of Object.keys(pos.board) as Square[]) {
    const piece = pos.board[from];
    if (!piece || piece.color !== color) continue;
    pseudoMoves(pos, from).forEach((m) => {
      const next = applyMove(pos, m, true);
      if (!inCheck(next, color)) all.push(m);
    });
  }
  return all;
}

export const inCheck = (pos: Position, color: Color) => isAttacked(pos, kingSquare(pos, color), color === 'w' ? 'b' : 'w');

export function applyMove(pos: Position, move: Move, dryRun = false): Position {
  const next = clonePosition(pos);
  const piece = next.board[move.from];
  if (!piece) return next;
  const targetPiece = next.board[move.to];
  const fromC = toCoord(move.from);
  const toC = toCoord(move.to);

  const isPawn = piece.type === 'p';
  const isCapture = Boolean(targetPiece);

  if (isPawn && next.enPassant === move.to && !targetPiece && fromC.x !== toC.x) {
    const capY = piece.color === 'w' ? toC.y - 1 : toC.y + 1;
    next.board[sq(toC.x, capY)] = null;
  }

  next.board[move.from] = null;
  next.board[move.to] = move.promotion ? { type: move.promotion, color: piece.color } : piece;

  if (piece.type === 'k' && Math.abs(toC.x - fromC.x) === 2) {
    if (move.to === 'g1') { next.board.h1 = null; next.board.f1 = { type: 'r', color: 'w' }; }
    if (move.to === 'c1') { next.board.a1 = null; next.board.d1 = { type: 'r', color: 'w' }; }
    if (move.to === 'g8') { next.board.h8 = null; next.board.f8 = { type: 'r', color: 'b' }; }
    if (move.to === 'c8') { next.board.a8 = null; next.board.d8 = { type: 'r', color: 'b' }; }
  }

  if (piece.type === 'k') {
    if (piece.color === 'w') { next.castling.wk = false; next.castling.wq = false; }
    else { next.castling.bk = false; next.castling.bq = false; }
  }
  if (move.from === 'a1' || move.to === 'a1') next.castling.wq = false;
  if (move.from === 'h1' || move.to === 'h1') next.castling.wk = false;
  if (move.from === 'a8' || move.to === 'a8') next.castling.bq = false;
  if (move.from === 'h8' || move.to === 'h8') next.castling.bk = false;

  next.enPassant = null;
  if (piece.type === 'p' && Math.abs(toC.y - fromC.y) === 2) {
    next.enPassant = sq(fromC.x, (fromC.y + toC.y) / 2);
  }

  next.halfmoveClock = isPawn || isCapture ? 0 : next.halfmoveClock + 1;
  if (piece.color === 'b') next.fullmove += 1;
  next.turn = piece.color === 'w' ? 'b' : 'w';

  if (!dryRun) {
    const notation = `${move.from}${move.to}${move.promotion ?? ''}`;
    next.pgn.push(notation);
    next.historyHashes.push(positionHash(next));
  }

  return next;
}

export function gameStatus(pos: Position): { over: boolean; reason?: string; result?: '1-0'|'0-1'|'1/2-1/2' } {
  const lm = legalMoves(pos, pos.turn);
  const inChk = inCheck(pos, pos.turn);
  if (lm.length === 0 && inChk) return { over: true, reason: 'checkmate', result: pos.turn === 'w' ? '0-1' : '1-0' };
  if (lm.length === 0 && !inChk) return { over: true, reason: 'stalemate', result: '1/2-1/2' };

  if (pos.halfmoveClock >= 100) return { over: true, reason: 'fifty_move', result: '1/2-1/2' };
  const nowHash = pos.historyHashes[pos.historyHashes.length - 1];
  const repeats = pos.historyHashes.filter((h) => h === nowHash).length;
  if (repeats >= 3) return { over: true, reason: 'repetition', result: '1/2-1/2' };

  return { over: false };
}

const pieceValue: Record<PieceType, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

export function evaluateMaterial(pos: Position, color: Color): number {
  let score = 0;
  for (const s of Object.keys(pos.board) as Square[]) {
    const p = pos.board[s];
    if (!p) continue;
    score += p.color === color ? pieceValue[p.type] : -pieceValue[p.type];
  }
  return score;
}

export function positionHash(pos: Position): string {
  const boardState = (Object.keys(pos.board) as Square[])
    .map((s) => {
      const p = pos.board[s];
      return p ? `${s}${p.color}${p.type}` : '';
    })
    .filter(Boolean)
    .join('|');
  return `${boardState};${pos.turn};${JSON.stringify(pos.castling)};${pos.enPassant ?? '-'};${pos.halfmoveClock}`;
}
