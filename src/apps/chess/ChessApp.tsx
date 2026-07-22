import { useEffect, useMemo, useState } from 'react';
import { chooseBotMove } from './bots';
import { legalMoves, type Move, type Position } from './engine';
import { useChessStore } from './services';
import type { SitePool, Square } from './types';
import './chess.css';

// chess.com replica chrome over the existing engine/matchmaking/rating stack.

const files = 'abcdefgh';
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

const pieceGlyph: Record<string, string> = {
  wp: '♟', wn: '♞', wb: '♝', wr: '♜', wq: '♛', wk: '♚',
  bp: '♟', bn: '♞', bb: '♝', br: '♜', bq: '♛', bk: '♚',
};

function TitleBadge({ title }: { title: string }) {
  return <span className="chx-titlechip">{title}</span>;
}

function Board({ position, onMove, disabled }: { position: Position; onMove: (m: Move) => void; disabled?: boolean }) {
  const [selected, setSelected] = useState<Square | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);

  const handleClick = (sq: Square) => {
    if (disabled) return;
    if (selected) {
      const mv = moves.find((m) => m.to === sq);
      if (mv) {
        onMove(mv);
        setSelected(null);
        setMoves([]);
        return;
      }
    }

    const piece = position.board[sq];
    if (!piece || piece.color !== position.turn) {
      setSelected(null);
      setMoves([]);
      return;
    }

    setSelected(sq);
    setMoves(legalMoves(position).filter((m) => m.from === sq));
  };

  return (
    <div className="chx-board">
      {ranks.flatMap((r, rowIndex) =>
        files.split('').map((f, colIndex) => {
          const square = `${f}${r}` as Square;
          const p = position.board[square];
          const dark = (rowIndex + colIndex) % 2 === 1;
          const isSel = selected === square;
          const canGo = moves.some((m) => m.to === square);
          const isCapture = canGo && !!p;
          return (
            <button
              key={square}
              onClick={() => handleClick(square)}
              className={`chx-sq ${dark ? 'dark' : 'light'} ${isSel ? 'sel' : ''} ${isCapture ? 'cap' : ''}`}
              style={{ background: isSel ? '#f5f682' : dark ? '#779556' : '#ebecd0' }}
            >
              {p ? <span className={p.color === 'w' ? 'chx-piece-w' : 'chx-piece-b'}>{pieceGlyph[`${p.color}${p.type}`]}</span> : null}
              {canGo && !p ? <span className="chx-dot" /> : null}
              {colIndex === 0 || rowIndex === 7 ? <span className="chx-coord">{square}</span> : null}
            </button>
          );
        }),
      )}
    </div>
  );
}

const TIME_CONTROLS: Array<{ id: SitePool; label: string; sub: string }> = [
  { id: 'bullet', label: '1 min', sub: 'Bullet' },
  { id: 'blitz', label: '3 min', sub: 'Blitz' },
  { id: 'rapid', label: '10 min', sub: 'Rapid' },
  { id: 'daily', label: '1 day', sub: 'Daily' },
];

function fmtClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function ChessApp() {
  const {
    users,
    currentUserId,
    queueStatus,
    activeGame,
    matches,
    tournaments,
    antiCheatEvents,
    enqueue,
    startGame,
    playMove,
    resign,
    offerDraw,
    tickClocks,
    filteredTournaments,
    pagedHistory,
    registerUser,
    setCurrentUser,
  } = useChessStore();

  const me = users[currentUserId];
  const [pool, setPool] = useState<SitePool>('blitz');
  const [page, setPage] = useState(1);
  const [newUser, setNewUser] = useState('');
  const [sideTab, setSideTab] = useState<'new' | 'games' | 'events'>('new');
  const [tourFideOnly, setTourFideOnly] = useState(false);
  const [tourNorm, setTourNorm] = useState(false);

  useEffect(() => {
    const int = setInterval(() => tickClocks(), 500);
    return () => clearInterval(int);
  }, [tickClocks]);

  useEffect(() => {
    if (!activeGame?.bot) return;
    const botColor = activeGame.whiteId === activeGame.bot.id ? 'w' : 'b';
    if (activeGame.position.turn !== botColor) return;

    const { move, thinkMs } = chooseBotMove(activeGame.position, activeGame.bot.targetRating);
    const timer = setTimeout(() => {
      playMove(move.from, move.to, move.promotion);
    }, thinkMs);
    return () => clearTimeout(timer);
  }, [activeGame, playMove]);

  const queueUp = () => {
    const match = enqueue({ userId: currentUserId, pool, region: me.region, maxWaitMs: 2500 });
    startGame(match, pool);
  };

  const white = activeGame ? users[activeGame.whiteId] : undefined;
  const black = activeGame ? users[activeGame.blackId] : undefined;

  const history = pagedHistory(page, 6);
  const filteredTourneys = filteredTournaments({ fideOnly: tourFideOnly, normEligible: tourNorm });

  const topTitle = (u?: typeof me) => u?.titles.find((t) => t.state !== 'revoked')?.code;

  const sitePools = useMemo(() => [
    { id: 'bullet' as const, label: 'Bullet', rating: me.siteRatings.bullet.rating },
    { id: 'blitz' as const, label: 'Blitz', rating: me.siteRatings.blitz.rating },
    { id: 'rapid' as const, label: 'Rapid', rating: me.siteRatings.rapid.rating },
    { id: 'daily' as const, label: 'Daily', rating: me.siteRatings.daily.rating },
  ], [me]);

  const resultClass = (m: { result: string; whiteId: string }) => {
    if (m.result === '1/2-1/2') return 'chx-result-draw';
    const iWasWhite = m.whiteId === currentUserId;
    const whiteWon = m.result === '1-0';
    return (iWasWhite ? whiteWon : !whiteWon) ? 'chx-result-win' : 'chx-result-loss';
  };

  const ratingFor = (u?: typeof me) => u ? u.siteRatings[activeGame ? activeGame.pool : 'blitz']?.rating ?? '?' : '?';

  const playerBar = (u: typeof me | undefined, name: string, clockMs: number, color: 'w' | 'b') => (
    <div className="chx-playerbar">
      <span className="chx-avatar" aria-hidden>{u?.id === currentUserId ? '🙂' : '🤖'}</span>
      <span className="chx-playername">
        {topTitle(u) ? <TitleBadge title={topTitle(u)!} /> : null}
        {name} <span className="chx-rating">({ratingFor(u)})</span>
      </span>
      <span className={`chx-clock ${activeGame?.position.turn === color ? 'active' : ''}`}>{fmtClock(clockMs)}</span>
    </div>
  );

  return (
    <div className="chx-shell">
      {/* Left rail */}
      <aside className="chx-rail">
        <div className="chx-logo"><span className="chx-logo-mark">♞</span>Chess.com</div>
        <button type="button" className="chx-rail-item active"><span className="chx-rail-ico">▶</span>Play</button>
        <button type="button" className="chx-rail-item"><span className="chx-rail-ico">🧩</span>Puzzles</button>
        <button type="button" className="chx-rail-item"><span className="chx-rail-ico">🎓</span>Learn</button>
        <button type="button" className="chx-rail-item"><span className="chx-rail-ico">📺</span>Watch</button>
        <button type="button" className="chx-rail-item"><span className="chx-rail-ico">📰</span>News</button>
        <button type="button" className="chx-rail-item"><span className="chx-rail-ico">👥</span>Social</button>
        <div className="chx-rail-footer">
          {me.username}<br />aOS simulation node
        </div>
      </aside>

      {/* Board */}
      <main className="chx-center">
        {activeGame ? (
          <>
            {playerBar(black, activeGame.blackName, activeGame.clocksMs.b, 'b')}
            <Board
              position={activeGame.position}
              disabled={activeGame.position.turn !== (activeGame.whiteId === currentUserId ? 'w' : 'b')}
              onMove={(m) => playMove(m.from, m.to, m.promotion)}
            />
            {playerBar(white, activeGame.whiteName, activeGame.clocksMs.w, 'w')}
            <div className="chx-board-note">Supports checkmate, stalemate, repetition, the 50-move rule, timeouts, and promotions.</div>
          </>
        ) : (
          <>
            <div className="chx-empty-board" aria-hidden />
            <div className="chx-board-note" style={{ textAlign: 'center' }}>Choose a time control and press Play.</div>
          </>
        )}
      </main>

      {/* Right panel */}
      <aside className="chx-side">
        <div className="chx-panel">
          <h3>Play Chess</h3>
          <div className="chx-tabs">
            <button type="button" className={`chx-tab ${sideTab === 'new' ? 'active' : ''}`} onClick={() => setSideTab('new')}>New Game</button>
            <button type="button" className={`chx-tab ${sideTab === 'games' ? 'active' : ''}`} onClick={() => setSideTab('games')}>Games</button>
            <button type="button" className={`chx-tab ${sideTab === 'events' ? 'active' : ''}`} onClick={() => setSideTab('events')}>Events</button>
          </div>

          {sideTab === 'new' && (
            <>
              <div className="chx-tc-grid">
                {TIME_CONTROLS.map((tc) => (
                  <button key={tc.id} type="button" className={`chx-tc ${pool === tc.id ? 'sel' : ''}`} onClick={() => setPool(tc.id)}>
                    {tc.label}
                    <small>{tc.sub} · {me.siteRatings[tc.id].rating}</small>
                  </button>
                ))}
              </div>
              {activeGame ? (
                <div className="chx-game-actions">
                  <button type="button" className="chx-action" onClick={offerDraw}>½ Draw</button>
                  <button type="button" className="chx-action" onClick={resign}>⚑ Resign</button>
                </div>
              ) : (
                <button type="button" className="chx-play-btn" onClick={queueUp}>Play</button>
              )}
              <div className="chx-queue-status">{queueStatus}</div>
            </>
          )}

          {sideTab === 'games' && (
            <>
              <div className="chx-list-title">Game History</div>
              {history.length === 0 && <div className="chx-row-sub">No games yet — play your first game.</div>}
              {history.map((m) => (
                <div key={m.id} className="chx-row">
                  <div><span className={resultClass(m)}>{m.result}</span> · <strong>{m.whiteName}</strong> vs <strong>{m.blackName}</strong></div>
                  <div className="chx-row-sub">{m.pool} {m.timeControl} · {m.reason} · ΔW {m.ratingDelta.white} / ΔB {m.ratingDelta.black}</div>
                </div>
              ))}
              <div className="chx-pager">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                <span>Page {page}</span>
                <button type="button" onClick={() => setPage((p) => p + 1)} disabled={matches.length <= page * 6}>›</button>
              </div>
            </>
          )}

          {sideTab === 'events' && (
            <>
              <div className="chx-list-title">Tournaments</div>
              <label className="chx-filter"><input type="checkbox" checked={tourFideOnly} onChange={(e) => setTourFideOnly(e.target.checked)} /> FIDE-rated only</label>
              <label className="chx-filter"><input type="checkbox" checked={tourNorm} onChange={(e) => setTourNorm(e.target.checked)} /> Norm eligible</label>
              {filteredTourneys.map((t) => (
                <div key={t.id} className="chx-row">
                  <strong>{t.name}</strong>
                  <div className="chx-row-sub">{t.format} · {t.timeControl} · Range {t.minRating}–{t.maxRating}</div>
                  <div className="chx-row-sub">{t.siteRated ? 'Site-rated' : ''}{t.siteRated && t.fideRated ? ' + ' : ''}{t.fideRated ? 'FIDE-rated' : ''}</div>
                </div>
              ))}
              <div className="chx-list-title" style={{ marginTop: 12 }}>Fair Play</div>
              {antiCheatEvents.slice(0, 4).map((ev) => (
                <div key={ev.id} className="chx-row">
                  <div className="chx-row-sub">{users[ev.userId]?.username ?? ev.userId}: {ev.reason} ({ev.score})</div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="chx-panel">
          <div className="chx-list-title">My Ratings</div>
          <div className="chx-stats">
            {sitePools.map((p) => (
              <div key={p.id} className="chx-stat">
                <div className="chx-stat-label">{p.label}</div>
                <div className="chx-stat-value">{p.rating}</div>
              </div>
            ))}
          </div>
          <div className="chx-list-title" style={{ marginTop: 12 }}>FIDE</div>
          {(['standard', 'rapid', 'blitz'] as const).map((fp) => (
            <div key={fp} className="chx-row">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ textTransform: 'capitalize' }}>{fp}</span>
                <strong>{me.fideRatings[fp].rating ?? 'Unrated'}</strong>
              </div>
            </div>
          ))}
          <div className="chx-list-title" style={{ marginTop: 12 }}>Titles &amp; Norms</div>
          <div className="chx-row-sub">Norm games tracked: {me.norms.reduce((n, x) => n + x.games, 0)}</div>
          {me.titles.map((t, idx) => (
            <div key={idx} className="chx-row-sub">{t.code} — {t.state}</div>
          ))}
          <div className="chx-list-title" style={{ marginTop: 12 }}>Accounts</div>
          <div className="chx-account-row">
            <input placeholder="New username" value={newUser} onChange={(e) => setNewUser(e.target.value)} />
            <button
              type="button"
              onClick={() => {
                if (!newUser.trim()) return;
                const id = registerUser(newUser.trim(), me.region);
                setCurrentUser(id);
                setNewUser('');
              }}
            >
              Create
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default ChessApp;
