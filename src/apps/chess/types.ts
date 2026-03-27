export type SitePool = 'bullet' | 'blitz' | 'rapid' | 'daily';
export type FidePool = 'standard' | 'rapid' | 'blitz';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Color = 'w' | 'b';

export type Piece = {
  type: PieceType;
  color: Color;
};

export type Square = `${'a'|'b'|'c'|'d'|'e'|'f'|'g'|'h'}${1|2|3|4|5|6|7|8}`;

export type SiteRating = {
  rating: number;
  rd: number;
  games: number;
};

export type FideRating = {
  rating: number | null;
  games: number;
};

export type MatchResult = '1-0' | '0-1' | '1/2-1/2';

export type MatchRecord = {
  id: string;
  whiteId: string;
  blackId: string;
  whiteName: string;
  blackName: string;
  timeControl: string;
  pool: SitePool;
  result: MatchResult;
  reason: 'checkmate' | 'stalemate' | 'timeout' | 'resign' | 'draw_agreement' | 'repetition' | 'fifty_move';
  pgn: string;
  startedAt: string;
  finishedAt: string;
  ratingDelta: {
    white: number;
    black: number;
  };
  meta: {
    accuracySignals: number[];
    moveTimingsMs: number[];
    engineCorrelationScore: number;
  };
};

export type TitleCode = 'GM' | 'IM' | 'FM' | 'CM' | 'WGM' | 'WIM' | 'WFM' | 'WCM';

export type TitleState = 'earned_in_simulation' | 'pending_review' | 'verified' | 'revoked';

export type NormEvent = {
  id: string;
  titleTrack: Exclude<TitleCode, 'FM' | 'CM' | 'WFM' | 'WCM'>;
  tournamentId: string;
  games: number;
  performance: number;
  timestamp: string;
  audit: string;
};

export type UserProfile = {
  id: string;
  username: string;
  region: string;
  fairPlayFlag: 'clean' | 'watchlist' | 'restricted';
  siteRatings: Record<SitePool, SiteRating>;
  fideRatings: Record<FidePool, FideRating>;
  titles: Array<{ code: TitleCode; state: TitleState; awardedAt: string }>;
  norms: NormEvent[];
  friends: string[];
  stats: { wins: number; losses: number; draws: number };
};

export type TournamentFormat = 'arena' | 'swiss' | 'round_robin' | 'knockout';

export type Tournament = {
  id: string;
  name: string;
  format: TournamentFormat;
  timeControl: string;
  minRating: number;
  maxRating: number;
  siteRated: boolean;
  fideRated: boolean;
  normEligible: boolean;
  startedAt: string;
};

export type QueueRequest = {
  userId: string;
  pool: SitePool;
  region: string;
  maxWaitMs: number;
};

export type QueueMatch = {
  opponentId: string;
  opponentName: string;
  isBot: boolean;
  pool: SitePool;
};

export type BotProfile = {
  id: string;
  username: string;
  targetRating: number;
  style: 'aggressive' | 'positional' | 'tricky' | 'balanced';
};
