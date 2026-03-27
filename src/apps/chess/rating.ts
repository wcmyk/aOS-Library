import type { FidePool, MatchResult, SiteRating, TitleCode, UserProfile } from './types';

const q = Math.log(10) / 400;

export function glickoUpdate(player: SiteRating, opponent: SiteRating, result: MatchResult, isWhite: boolean): SiteRating {
  const s = result === '1/2-1/2' ? 0.5 : result === '1-0' ? (isWhite ? 1 : 0) : isWhite ? 0 : 1;
  const g = 1 / Math.sqrt(1 + (3 * q * q * opponent.rd * opponent.rd) / (Math.PI * Math.PI));
  const e = 1 / (1 + Math.pow(10, (-g * (player.rating - opponent.rating)) / 400));
  const d2 = 1 / (q * q * g * g * e * (1 - e));
  const preRd = Math.min(Math.sqrt(player.rd * player.rd + 50 * 50), 350);
  const newRd = Math.sqrt(1 / ((1 / (preRd * preRd)) + (1 / d2)));
  const newRating = player.rating + (q / ((1 / (preRd * preRd)) + (1 / d2))) * g * (s - e);

  return {
    rating: Math.round(newRating),
    rd: Math.max(40, Math.round(newRd)),
    games: player.games + 1,
  };
}

export function initializeSiteRatings() {
  return {
    bullet: { rating: 800, rd: 350, games: 0 },
    blitz: { rating: 800, rd: 350, games: 0 },
    rapid: { rating: 800, rd: 350, games: 0 },
    daily: { rating: 800, rd: 350, games: 0 },
  };
}

export function initializeFideRatings() {
  return {
    standard: { rating: null, games: 0 },
    rapid: { rating: null, games: 0 },
    blitz: { rating: null, games: 0 },
  };
}

export function maybeAutoAwardTitles(user: UserProfile) {
  const standard = user.fideRatings.standard;
  const titles: TitleCode[] = [];

  if (standard.games >= 30 && standard.rating !== null) {
    if (standard.rating >= 2300) titles.push('FM');
    else if (standard.rating >= 2200) titles.push('CM');
    if (standard.rating >= 2100) titles.push('WFM');
    if (standard.rating >= 2000) titles.push('WCM');
  }

  for (const title of titles) {
    if (!user.titles.some((t) => t.code === title && t.state !== 'revoked')) {
      user.titles.push({ code: title, state: 'earned_in_simulation', awardedAt: new Date().toISOString() });
    }
  }

  const normTracks: Array<{ title: TitleCode; minRating: number; requiredNorms: number }> = [
    { title: 'GM', minRating: 2500, requiredNorms: 3 },
    { title: 'IM', minRating: 2400, requiredNorms: 3 },
    { title: 'WGM', minRating: 2300, requiredNorms: 3 },
    { title: 'WIM', minRating: 2200, requiredNorms: 3 },
  ];

  for (const track of normTracks) {
    const norms = user.norms.filter((n) => n.titleTrack === track.title);
    const games = norms.reduce((sum, n) => sum + n.games, 0);
    if ((standard.rating ?? 0) >= track.minRating && norms.length >= track.requiredNorms && games >= 27) {
      if (!user.titles.some((t) => t.code === track.title && t.state !== 'revoked')) {
        user.titles.push({ code: track.title, state: 'pending_review', awardedAt: new Date().toISOString() });
      }
    }
  }
}

export function applyFideResult(
  white: UserProfile,
  black: UserProfile,
  result: MatchResult,
  pool: FidePool,
): { whiteDelta: number; blackDelta: number } {
  const init = (v: number | null) => (v === null ? 1600 : v);
  const k = 20;

  const wr = init(white.fideRatings[pool].rating);
  const br = init(black.fideRatings[pool].rating);
  const ew = 1 / (1 + Math.pow(10, (br - wr) / 400));
  const eb = 1 - ew;
  const sw = result === '1-0' ? 1 : result === '0-1' ? 0 : 0.5;
  const sb = 1 - sw;

  const newW = Math.round(wr + k * (sw - ew));
  const newB = Math.round(br + k * (sb - eb));

  white.fideRatings[pool] = { rating: newW, games: white.fideRatings[pool].games + 1 };
  black.fideRatings[pool] = { rating: newB, games: black.fideRatings[pool].games + 1 };

  return { whiteDelta: newW - wr, blackDelta: newB - br };
}
