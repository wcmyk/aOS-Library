import { applyMove, evaluateMaterial, gameStatus, legalMoves, type Move, type Position } from './engine';
import type { BotProfile } from './types';

const baseNames = [
  'Alex','Jordan','Taylor','Casey','Morgan','Riley','Cameron','Quinn','Avery','Hayden','Parker','Reese','Blake','Drew','Skyler','Rowan','Sage','Logan','Dakota','Emerson','Finley','Charlie','Elliot','Devon','Jesse','Sam','Nico','Adrian','Kai','Remy','Jules','Micah','Noel','River','Phoenix','Zion','Ashton','Ellis','Lennox','Bellamy','Indigo','Marlowe','Oakley','Monroe','Arden','Shiloh','Robin','Winter','August','Blair',
];

const adjectives = ['Silent', 'Nova', 'Arctic', 'Echo', 'Rapid', 'Steady', 'Crimson', 'Aero', 'Clever', 'Solar'];
const chessTerms = ['Knight', 'Bishop', 'Tempo', 'Pawn', 'Gambit', 'Endgame', 'Castle', 'Blitz'];
const regions = ['Tokyo', 'Berlin', 'Miami', 'Osaka', 'Denver', 'Seoul', 'Austin', 'Oslo'];

export function generateBotName(seed: number): string {
  const base = baseNames[seed % baseNames.length];
  const mode = seed % 4;
  if (mode === 0) return `${adjectives[seed % adjectives.length]}${base}`;
  if (mode === 1) return `${chessTerms[seed % chessTerms.length]}${base}${(seed % 90) + 10}`;
  if (mode === 2) return `${regions[seed % regions.length]}${base}`;
  return `${base}${String((seed * 17) % 1000).padStart(2, '0')}X`;
}

export function createBot(targetRating: number, seed: number): BotProfile {
  const styles: BotProfile['style'][] = ['aggressive', 'balanced', 'positional', 'tricky'];
  return {
    id: `bot-${seed}`,
    username: generateBotName(seed),
    targetRating,
    style: styles[seed % styles.length],
  };
}

function scoreMove(position: Position, move: Move, color: 'w'|'b') {
  const next = applyMove(position, move, true);
  const mat = evaluateMaterial(next, color);
  const status = gameStatus(next);
  if (status.over && status.result === (color === 'w' ? '1-0' : '0-1')) return mat + 10000;
  if (status.over && status.result === '1/2-1/2') return mat - 30;
  if (status.over) return mat - 10000;
  return mat;
}

export function chooseBotMove(position: Position, botRating: number): { move: Move; thinkMs: number } {
  const moves = legalMoves(position);
  if (!moves.length) throw new Error('No legal moves');

  const color = position.turn;
  const scored = moves.map((m) => ({ move: m, score: scoreMove(position, m, color) }));
  scored.sort((a, b) => b.score - a.score);

  const strength = Math.max(0, Math.min(1, (botRating - 600) / 1800));
  const topCount = strength > 0.8 ? 1 : strength > 0.65 ? 2 : strength > 0.5 ? 3 : 6;
  const candidate = scored[Math.floor(Math.random() * Math.min(topCount, scored.length))];
  const blunderChance = Math.max(0.02, 0.32 - strength * 0.28);
  const pick = Math.random() < blunderChance ? scored[Math.floor(Math.random() * scored.length)] : candidate;

  const baseThink = 450 + Math.random() * 2200;
  const jitter = (1 - strength) * 1600;
  return {
    move: pick.move,
    thinkMs: Math.round(baseThink + Math.random() * jitter),
  };
}
