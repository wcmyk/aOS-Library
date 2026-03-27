import { useEffect, useMemo, useState } from 'react';
import { chooseBotMove } from './bots';
import { legalMoves, type Move, type Position } from './engine';
import { useChessStore } from './services';
import type { SitePool, Square } from './types';

const files = 'abcdefgh';
const ranks = [8,7,6,5,4,3,2,1];

const pieceGlyph: Record<string, string> = {
  wp: '♙', wn: '♘', wb: '♗', wr: '♖', wq: '♕', wk: '♔',
  bp: '♟', bn: '♞', bb: '♝', br: '♜', bq: '♛', bk: '♚',
};

function TitleBadge({ title }: { title: string }) {
  return (
    <span style={{ background: '#cf1f24', color: '#fff', borderRadius: 4, padding: '2px 6px', fontWeight: 700, fontSize: 11, marginRight: 6 }}>
      [{title}]
    </span>
  );
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', width: 500, height: 500, border: '1px solid #2f3d58', borderRadius: 10, overflow: 'hidden' }}>
      {ranks.flatMap((r, rowIndex) =>
        files.split('').map((f, colIndex) => {
          const square = `${f}${r}` as Square;
          const p = position.board[square];
          const dark = (rowIndex + colIndex) % 2 === 1;
          const isSel = selected === square;
          const canGo = moves.some((m) => m.to === square);
          return (
            <button
              key={square}
              onClick={() => handleClick(square)}
              style={{
                border: 0,
                background: isSel ? '#3f5478' : canGo ? '#6a8cc4' : dark ? '#7e95b8' : '#cdd7e8',
                color: p?.color === 'w' ? '#fff' : '#1d2432',
                fontSize: 34,
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              {p ? pieceGlyph[`${p.color}${p.type}`] : ''}
              <span style={{ position: 'absolute', bottom: 4, right: 5, fontSize: 10, opacity: 0.45 }}>{square}</span>
            </button>
          );
        }),
      )}
    </div>
  );
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
  const [fallbackMs, setFallbackMs] = useState(2500);
  const [page, setPage] = useState(1);
  const [newUser, setNewUser] = useState('');
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
    const match = enqueue({ userId: currentUserId, pool, region: me.region, maxWaitMs: fallbackMs });
    startGame(match, pool);
  };

  const white = activeGame ? users[activeGame.whiteId] : undefined;
  const black = activeGame ? users[activeGame.blackId] : undefined;

  const history = pagedHistory(page, 6);
  const filteredTourneys = filteredTournaments({ fideOnly: tourFideOnly, normEligible: tourNorm });

  const title = me.titles.find((t) => t.state !== 'revoked')?.code;
  const topTitle = (u?: typeof me) => u?.titles.find((t) => t.state !== 'revoked')?.code;

  const sitePools = useMemo(() => [
    { id: 'bullet' as const, label: 'Bullet', rating: me.siteRatings.bullet.rating },
    { id: 'blitz' as const, label: 'Blitz', rating: me.siteRatings.blitz.rating },
    { id: 'rapid' as const, label: 'Rapid', rating: me.siteRatings.rapid.rating },
    { id: 'daily' as const, label: 'Daily', rating: me.siteRatings.daily.rating },
  ], [me]);

  return (
    <div style={{ height: '100%', background: '#0e1421', color: '#e8edf5', display: 'grid', gridTemplateColumns: '320px 1fr 360px', gap: 12, padding: 12, overflow: 'auto' }}>
      <aside style={{ background: '#131d31', border: '1px solid #22324c', borderRadius: 10, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>aOS Chess Arena</h3>
        <div style={{ fontSize: 13, marginBottom: 8 }}>
          {title ? <TitleBadge title={title} /> : null}
          {me.username}
        </div>
        <div style={{ fontSize: 12, opacity: 0.78, marginBottom: 8 }}>Site + FIDE are fully separate.</div>

        <h4>Site Ratings</h4>
        {sitePools.map((p) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
            <span>{p.label}</span>
            <strong>{p.rating} (RD {me.siteRatings[p.id].rd})</strong>
          </div>
        ))}

        <h4>FIDE Ratings</h4>
        {(['standard','rapid','blitz'] as const).map((fp) => (
          <div key={fp} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span>{fp}</span>
            <strong>{me.fideRatings[fp].rating ?? 'UNRATED'}</strong>
          </div>
        ))}

        <h4>Matchmaking</h4>
        <div style={{ display: 'grid', gap: 6 }}>
          <select value={pool} onChange={(e) => setPool(e.target.value as SitePool)}>
            <option value="bullet">Bullet</option><option value="blitz">Blitz</option><option value="rapid">Rapid</option><option value="daily">Daily</option>
          </select>
          <label style={{ fontSize: 12 }}>Bot fallback threshold ms</label>
          <input type="number" value={fallbackMs} min={1000} max={15000} onChange={(e) => setFallbackMs(Number(e.target.value))} />
          <button onClick={queueUp}>Find Match (No Dead Queue)</button>
          <small>Status: {queueStatus}</small>
        </div>

        <h4>Accounts</h4>
        <div style={{ display: 'flex', gap: 6 }}>
          <input placeholder="new username" value={newUser} onChange={(e) => setNewUser(e.target.value)} />
          <button onClick={() => {
            if (!newUser.trim()) return;
            const id = registerUser(newUser.trim(), me.region);
            setCurrentUser(id);
            setNewUser('');
          }}>Create</button>
        </div>
      </aside>

      <main style={{ background: '#131d31', border: '1px solid #22324c', borderRadius: 10, padding: 12 }}>
        {activeGame ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                {topTitle(white) ? <TitleBadge title={topTitle(white)!} /> : null}
                {activeGame.whiteName} — {Math.max(0, Math.floor(activeGame.clocksMs.w / 1000))}s
              </div>
              <div>Turn: {activeGame.position.turn === 'w' ? 'White' : 'Black'}</div>
              <div>
                {topTitle(black) ? <TitleBadge title={topTitle(black)!} /> : null}
                {activeGame.blackName} — {Math.max(0, Math.floor(activeGame.clocksMs.b / 1000))}s
              </div>
            </div>
            <Board
              position={activeGame.position}
              disabled={activeGame.position.turn !== (activeGame.whiteId === currentUserId ? 'w' : 'b')}
              onMove={(m) => playMove(m.from, m.to, m.promotion)}
            />
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button onClick={offerDraw}>Offer Draw</button>
              <button onClick={resign}>Resign</button>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>Supports checkmate, stalemate, repetition, 50-move rule, timeouts, and promotions.</div>
          </>
        ) : (
          <div style={{ fontSize: 14, opacity: 0.85 }}>No active game. Queue to start a live/bot-backed game.</div>
        )}

        <section style={{ marginTop: 14 }}>
          <h4>Recent Matches (queryable/paginated)</h4>
          {history.map((m) => (
            <div key={m.id} style={{ borderTop: '1px solid #233451', padding: '6px 0', fontSize: 13 }}>
              <div>{m.whiteName} vs {m.blackName} • {m.result} ({m.reason})</div>
              <div style={{ opacity: 0.8 }}>{m.pool} {m.timeControl} • ΔW {m.ratingDelta.white} / ΔB {m.ratingDelta.black}</div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
            <span>Page {page}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={matches.length <= page * 6}>Next</button>
          </div>
        </section>
      </main>

      <aside style={{ background: '#131d31', border: '1px solid #22324c', borderRadius: 10, padding: 12 }}>
        <h4>Tournaments</h4>
        <label style={{ display: 'block', fontSize: 12 }}><input type="checkbox" checked={tourFideOnly} onChange={(e) => setTourFideOnly(e.target.checked)} /> FIDE only</label>
        <label style={{ display: 'block', fontSize: 12 }}><input type="checkbox" checked={tourNorm} onChange={(e) => setTourNorm(e.target.checked)} /> Norm eligible</label>
        {filteredTourneys.map((t) => (
          <div key={t.id} style={{ borderTop: '1px solid #233451', paddingTop: 6, marginTop: 6, fontSize: 13 }}>
            <strong>{t.name}</strong>
            <div>{t.format} • {t.timeControl}</div>
            <div>{t.siteRated ? 'Site-rated' : ''}{t.siteRated && t.fideRated ? ' + ' : ''}{t.fideRated ? 'FIDE-rated' : ''}</div>
            <div>Range {t.minRating}-{t.maxRating}</div>
          </div>
        ))}

        <h4>Anti-cheat feed</h4>
        {antiCheatEvents.slice(0, 5).map((ev) => (
          <div key={ev.id} style={{ fontSize: 12, borderTop: '1px solid #233451', paddingTop: 5, marginTop: 5 }}>
            {users[ev.userId]?.username ?? ev.userId}: {ev.reason} ({ev.score})
          </div>
        ))}

        <h4>Norm/Title audit</h4>
        <div style={{ fontSize: 12 }}>Norm games tracked: {me.norms.reduce((n, x) => n + x.games, 0)}</div>
        {me.titles.map((t, idx) => (
          <div key={idx} style={{ fontSize: 12 }}>{t.code} — {t.state}</div>
        ))}
      </aside>
    </div>
  );
}

export default ChessApp;
