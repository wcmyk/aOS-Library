import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createBot } from './bots';
import { applyMove, gameStatus, initialPosition, legalMoves, type Move, type Position } from './engine';
import { applyFideResult, glickoUpdate, initializeFideRatings, initializeSiteRatings, maybeAutoAwardTitles } from './rating';
import type {
  BotProfile,
  MatchRecord,
  QueueMatch,
  QueueRequest,
  SitePool,
  Tournament,
  UserProfile,
} from './types';

export type ActiveGame = {
  id: string;
  whiteId: string;
  blackId: string;
  whiteName: string;
  blackName: string;
  pool: SitePool;
  timeControl: string;
  clocksMs: { w: number; b: number };
  lastTickAt: number;
  position: Position;
  premove?: Move | null;
  bot?: BotProfile;
};

type ChessState = {
  currentUserId: string;
  users: Record<string, UserProfile>;
  tournaments: Tournament[];
  matches: MatchRecord[];
  activeGame: ActiveGame | null;
  queueStatus: 'idle' | 'searching' | 'matched';
  queueInfo?: { pool: SitePool; startedAt: number; fallbackMs: number };
  antiCheatEvents: Array<{ id: string; userId: string; score: number; reason: string; createdAt: string }>;
  registerUser: (username: string, region: string) => string;
  setCurrentUser: (id: string) => void;
  enqueue: (request: QueueRequest) => QueueMatch;
  startGame: (match: QueueMatch, pool: SitePool) => void;
  playMove: (from: string, to: string, promotion?: 'q'|'r'|'b'|'n') => { ok: boolean; message?: string };
  resign: () => void;
  offerDraw: () => void;
  tickClocks: () => void;
  createTournament: (t: Omit<Tournament, 'id'|'startedAt'>) => void;
  filteredTournaments: (filters: { fideOnly?: boolean; normEligible?: boolean; timeControl?: string; min?: number; max?: number }) => Tournament[];
  pagedHistory: (page: number, pageSize: number) => MatchRecord[];
};

const uid = () => Math.random().toString(36).slice(2, 11);
const defaultTimeByPool: Record<SitePool, { label: string; ms: number }> = {
  bullet: { label: '1+0', ms: 60_000 },
  blitz: { label: '5+0', ms: 300_000 },
  rapid: { label: '10+0', ms: 600_000 },
  daily: { label: '24h', ms: 24 * 3600_000 },
};

function makeUser(username: string, region: string): UserProfile {
  return {
    id: uid(),
    username,
    region,
    fairPlayFlag: 'clean',
    siteRatings: initializeSiteRatings(),
    fideRatings: initializeFideRatings(),
    titles: [],
    norms: [],
    friends: [],
    stats: { wins: 0, losses: 0, draws: 0 },
  };
}

export const useChessStore = create<ChessState>()(
  persist(
    (set, get) => ({
      currentUserId: 'local-user',
      users: {
        'local-user': {
          ...makeUser('You', 'US-East'),
          id: 'local-user',
        },
      },
      tournaments: [
        {
          id: 't1',
          name: 'City Rapid Arena',
          format: 'arena',
          timeControl: '10+0',
          minRating: 800,
          maxRating: 2200,
          siteRated: true,
          fideRated: false,
          normEligible: false,
          startedAt: new Date().toISOString(),
        },
        {
          id: 't2',
          name: 'FIDE Classical Norm Quest',
          format: 'swiss',
          timeControl: '90+30',
          minRating: 1600,
          maxRating: 2800,
          siteRated: false,
          fideRated: true,
          normEligible: true,
          startedAt: new Date().toISOString(),
        },
      ],
      matches: [],
      activeGame: null,
      queueStatus: 'idle',
      antiCheatEvents: [],
      registerUser: (username, region) => {
        const user = makeUser(username, region);
        set((s) => ({ users: { ...s.users, [user.id]: user } }));
        return user.id;
      },
      setCurrentUser: (id) => set({ currentUserId: id }),
      enqueue: (request) => {
        set({ queueStatus: 'searching', queueInfo: { pool: request.pool, startedAt: Date.now(), fallbackMs: request.maxWaitMs } });
        const me = get().users[request.userId];
        const playerPool = me.siteRatings[request.pool];

        const others = Object.values(get().users).filter((u) => u.id !== request.userId && u.fairPlayFlag !== 'restricted');
        const samePool = others
          .map((u) => ({ u, score: Math.abs(u.siteRatings[request.pool].rating - playerPool.rating) + Math.abs(u.siteRatings[request.pool].rd - playerPool.rd) }))
          .filter(({ u }) => u.region === request.region || Math.random() > 0.4)
          .sort((a, b) => a.score - b.score);

        if (samePool.length) {
          const picked = samePool[0].u;
          set({ queueStatus: 'matched' });
          return { opponentId: picked.id, opponentName: picked.username, isBot: false, pool: request.pool };
        }

        const now = Date.now();
        if (now - (get().queueInfo?.startedAt ?? now) >= request.maxWaitMs) {
          const targetRating = playerPool.rating + Math.round((Math.random() * 2 - 1) * 90);
          const bot = createBot(targetRating, Math.floor(Math.random() * 5000));
          const botUser: UserProfile = {
            ...makeUser(bot.username, request.region),
            id: bot.id,
            siteRatings: {
              bullet: { rating: targetRating, rd: 80, games: 200 },
              blitz: { rating: targetRating, rd: 80, games: 200 },
              rapid: { rating: targetRating, rd: 80, games: 200 },
              daily: { rating: targetRating, rd: 80, games: 200 },
            },
          };
          set((s) => ({ users: { ...s.users, [bot.id]: botUser }, queueStatus: 'matched' }));
          return { opponentId: bot.id, opponentName: bot.username, isBot: true, pool: request.pool };
        }

        const bot = createBot(playerPool.rating, Math.floor(Math.random() * 5000));
        const botUser: UserProfile = {
          ...makeUser(bot.username, request.region),
          id: bot.id,
          siteRatings: {
            bullet: { rating: bot.targetRating, rd: 90, games: 120 },
            blitz: { rating: bot.targetRating, rd: 90, games: 120 },
            rapid: { rating: bot.targetRating, rd: 90, games: 120 },
            daily: { rating: bot.targetRating, rd: 90, games: 120 },
          },
        };
        set((s) => ({ users: { ...s.users, [bot.id]: botUser }, queueStatus: 'matched' }));
        return { opponentId: bot.id, opponentName: bot.username, isBot: true, pool: request.pool };
      },
      startGame: (match, pool) => {
        const me = get().currentUserId;
        const white = Math.random() > 0.5 ? me : match.opponentId;
        const black = white === me ? match.opponentId : me;
        set({
          activeGame: {
            id: uid(),
            whiteId: white,
            blackId: black,
            whiteName: get().users[white]?.username ?? 'White',
            blackName: get().users[black]?.username ?? 'Black',
            pool,
            timeControl: defaultTimeByPool[pool].label,
            clocksMs: { w: defaultTimeByPool[pool].ms, b: defaultTimeByPool[pool].ms },
            lastTickAt: Date.now(),
            position: initialPosition(),
            bot: match.isBot ? { id: match.opponentId, username: match.opponentName, targetRating: get().users[match.opponentId].siteRatings[pool].rating, style: 'balanced' } : undefined,
          },
          queueStatus: 'idle',
        });
      },
      playMove: (from, to, promotion) => {
        const game = get().activeGame;
        if (!game) return { ok: false, message: 'No active game' };
        const legal = legalMoves(game.position).find((m) => m.from === from && m.to === to && (!m.promotion || m.promotion === promotion));
        if (!legal) return { ok: false, message: 'Illegal move' };

        const nextPos = applyMove(game.position, { from: from as any, to: to as any, promotion });
        set((s) => ({ activeGame: s.activeGame ? { ...s.activeGame, position: nextPos, lastTickAt: Date.now() } : null }));

        finalizeIfOver();
        return { ok: true };
      },
      resign: () => finalizeManual('resign'),
      offerDraw: () => finalizeManual('draw_agreement'),
      tickClocks: () => {
        const game = get().activeGame;
        if (!game) return;
        const now = Date.now();
        const elapsed = now - game.lastTickAt;
        const side = game.position.turn;
        const newClocks = { ...game.clocksMs, [side]: game.clocksMs[side] - elapsed };

        if (newClocks[side] <= 0) {
          set((s) => ({ activeGame: s.activeGame ? { ...s.activeGame, clocksMs: newClocks, lastTickAt: now } : null }));
          finalizeManual('timeout');
          return;
        }

        set((s) => ({ activeGame: s.activeGame ? { ...s.activeGame, clocksMs: newClocks, lastTickAt: now } : null }));
      },
      createTournament: (t) => set((s) => ({ tournaments: [{ ...t, id: uid(), startedAt: new Date().toISOString() }, ...s.tournaments] })),
      filteredTournaments: (filters) => get().tournaments.filter((t) => {
        if (filters.fideOnly && !t.fideRated) return false;
        if (filters.normEligible && !t.normEligible) return false;
        if (filters.timeControl && !t.timeControl.includes(filters.timeControl)) return false;
        if (typeof filters.min === 'number' && t.maxRating < filters.min) return false;
        if (typeof filters.max === 'number' && t.minRating > filters.max) return false;
        return true;
      }),
      pagedHistory: (page, size) => {
        const start = (page - 1) * size;
        return get().matches.slice(start, start + size);
      },
    }),
    {
      name: 'aos-chess-platform-v1',
      version: 1,
    },
  ),
);

function finalizeManual(reason: MatchRecord['reason']) {
  const state = useChessStore.getState();
  const game = state.activeGame;
  if (!game) return;

  let result: MatchRecord['result'] = '1/2-1/2';
  if (reason === 'resign' || reason === 'timeout') {
    const loser = game.position.turn;
    result = loser === 'w' ? '0-1' : '1-0';
  }

  commitFinishedGame(game, result, reason);
}

function finalizeIfOver() {
  const state = useChessStore.getState();
  const game = state.activeGame;
  if (!game) return;
  const status = gameStatus(game.position);
  if (!status.over || !status.result || !status.reason) return;
  commitFinishedGame(game, status.result, status.reason as MatchRecord['reason']);
}

function commitFinishedGame(game: ActiveGame, result: MatchRecord['result'], reason: MatchRecord['reason']) {
  const store = useChessStore.getState();
  const users = { ...store.users };
  const white = { ...users[game.whiteId] };
  const black = { ...users[game.blackId] };

  const prevW = white.siteRatings[game.pool];
  const prevB = black.siteRatings[game.pool];
  const nextW = glickoUpdate(prevW, prevB, result, true);
  const nextB = glickoUpdate(prevB, prevW, result, false);

  white.siteRatings = { ...white.siteRatings, [game.pool]: nextW };
  black.siteRatings = { ...black.siteRatings, [game.pool]: nextB };

  if (result === '1-0') {
    white.stats.wins += 1;
    black.stats.losses += 1;
  } else if (result === '0-1') {
    black.stats.wins += 1;
    white.stats.losses += 1;
  } else {
    white.stats.draws += 1;
    black.stats.draws += 1;
  }

  maybeAutoAwardTitles(white);
  maybeAutoAwardTitles(black);

  // if current game tagged as a simulated FIDE event later, this helper demonstrates strict separation.
  if (false) applyFideResult(white, black, result, 'standard');

  users[white.id] = white;
  users[black.id] = black;

  const timings = Array.from({ length: Math.max(10, game.position.pgn.length) }, () => Math.round(300 + Math.random() * 5000));
  const accuracySignals = Array.from({ length: Math.max(10, game.position.pgn.length) }, () => Number((Math.random() * 0.5 + 0.45).toFixed(2)));
  const corr = Number((Math.random() * 0.6 + 0.2).toFixed(2));

  const antiCheatEvents = [...store.antiCheatEvents];
  if (corr > 0.92) {
    antiCheatEvents.unshift({ id: uid(), userId: game.whiteId, score: corr, reason: 'high engine correlation', createdAt: new Date().toISOString() });
  }

  const record: MatchRecord = {
    id: game.id,
    whiteId: game.whiteId,
    blackId: game.blackId,
    whiteName: game.whiteName,
    blackName: game.blackName,
    timeControl: game.timeControl,
    pool: game.pool,
    result,
    reason,
    pgn: game.position.pgn.join(' '),
    startedAt: new Date(Date.now() - 10 * 60_000).toISOString(),
    finishedAt: new Date().toISOString(),
    ratingDelta: {
      white: nextW.rating - prevW.rating,
      black: nextB.rating - prevB.rating,
    },
    meta: {
      moveTimingsMs: timings,
      accuracySignals,
      engineCorrelationScore: corr,
    },
  };

  useChessStore.setState({
    users,
    matches: [record, ...store.matches],
    activeGame: null,
    antiCheatEvents,
  });
}
