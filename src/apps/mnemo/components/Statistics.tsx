import { useMnemoStore } from '../state/useMnemoStore';

const S = {
  root: { height: '100%', overflowY: 'auto' as const, background: '#06111f', padding: 24 },
  hdr: { fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 },
  stat: { background: 'rgba(10,25,47,0.8)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: 18 },
  statVal: { fontSize: 28, fontWeight: 800, color: '#7dd3fc', fontFamily: 'monospace', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#475569' },
  section: { fontSize: 13, fontWeight: 600, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 12, marginTop: 8 },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: { textAlign: 'left' as const, padding: '8px 12px', color: '#475569', fontWeight: 600, borderBottom: '1px solid rgba(148,163,184,0.1)', fontSize: 11 },
  td: { padding: '10px 12px', color: '#94a3b8', borderBottom: '1px solid rgba(148,163,184,0.06)' },
  bar: { height: 6, background: 'rgba(148,163,184,0.1)', borderRadius: 3, marginTop: 6 },
};

export function Statistics() {
  const { sets, sessions } = useMnemoStore();

  const totalCards = sets.reduce((sum, s) => sum + s.cards.length, 0);
  const totalSessions = sessions.length;
  const avgAccuracy = sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length : 0;

  const recentSessions = [...sessions].reverse().slice(0, 10);

  const setMastery = sets.map((set) => {
    const setSessions = sessions.filter((s) => s.setId === set.id);
    const lastSession = setSessions[setSessions.length - 1];
    const mastery = lastSession ? lastSession.accuracy : 0;
    return { set, mastery, sessionCount: setSessions.length };
  });

  return (
    <div style={S.root}>
      <div style={S.hdr}>Statistics</div>

      <div style={S.grid}>
        <div style={S.stat}><div style={S.statVal}>{sets.length}</div><div style={S.statLabel}>Study Sets</div></div>
        <div style={S.stat}><div style={S.statVal}>{totalCards}</div><div style={S.statLabel}>Total Cards</div></div>
        <div style={S.stat}><div style={S.statVal}>{totalSessions}</div><div style={S.statLabel}>Sessions</div></div>
        <div style={S.stat}><div style={{ ...S.statVal, color: avgAccuracy >= 0.7 ? '#34d399' : avgAccuracy >= 0.5 ? '#f59e0b' : '#ef4444' }}>{Math.round(avgAccuracy * 100)}%</div><div style={S.statLabel}>Avg Accuracy</div></div>
      </div>

      {setMastery.length > 0 && (
        <>
          <div style={S.section}>Set Mastery</div>
          <div style={{ marginBottom: 24 }}>
            {setMastery.map(({ set, mastery, sessionCount }) => (
              <div key={set.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{set.title}</span>
                  <span style={{ fontSize: 12, color: '#475569' }}>{sessionCount} sessions · {Math.round(mastery * 100)}%</span>
                </div>
                <div style={S.bar}><div style={{ height: '100%', borderRadius: 3, background: mastery >= 0.7 ? '#34d399' : mastery >= 0.5 ? '#f59e0b' : '#7dd3fc', width: `${mastery * 100}%`, transition: 'width 0.4s ease' }} /></div>
              </div>
            ))}
          </div>
        </>
      )}

      {recentSessions.length > 0 && (
        <>
          <div style={S.section}>Recent Sessions</div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Set</th>
                <th style={S.th}>Mode</th>
                <th style={S.th}>Accuracy</th>
                <th style={S.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s) => {
                const set = sets.find((st) => st.id === s.setId);
                return (
                  <tr key={s.id}>
                    <td style={S.td}>{set?.title ?? 'Unknown'}</td>
                    <td style={{ ...S.td, color: '#7dd3fc' }}>{s.mode.replace('_', ' ')}</td>
                    <td style={{ ...S.td, color: s.accuracy >= 0.7 ? '#34d399' : s.accuracy >= 0.5 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>{Math.round(s.accuracy * 100)}%</td>
                    <td style={S.td}>{new Date(s.startedAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {sets.length === 0 && (
        <div style={{ textAlign: 'center', color: '#334155', paddingTop: 60, fontSize: 14 }}>No study data yet. Create a set and start studying!</div>
      )}
    </div>
  );
}
