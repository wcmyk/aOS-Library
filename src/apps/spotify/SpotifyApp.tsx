import { useMemo, useState } from 'react';

const tracks = [
  { id: 't1', name: 'Midnight Drive', artist: 'AOS Waves', duration: '3:28' },
  { id: 't2', name: 'Neon Focus', artist: 'Signal Bloom', duration: '4:01' },
  { id: 't3', name: 'Lofi Merge', artist: 'Patch Notes', duration: '2:49' },
  { id: 't4', name: 'Cloudline', artist: 'Astra Harbor', duration: '3:55' },
];

export function SpotifyApp() {
  const [activeId, setActiveId] = useState(tracks[0].id);
  const [playing, setPlaying] = useState(true);
  const active = useMemo(() => tracks.find((track) => track.id === activeId) ?? tracks[0], [activeId]);

  return (
    <div className="spotify-shell">
      <aside className="spotify-sidebar">
        <h2>Spotify</h2>
        <button type="button" className="spotify-pill">Made For You</button>
        <button type="button" className="spotify-pill">Discover Weekly</button>
        <button type="button" className="spotify-pill">Focus Flow</button>
      </aside>
      <section className="spotify-main">
        <header className="spotify-header-card">
          <p>Now playing</p>
          <h3>{active.name}</h3>
          <span>{active.artist}</span>
        </header>
        <div className="spotify-track-list">
          {tracks.map((track) => (
            <button key={track.id} type="button" className={`spotify-track ${track.id === activeId ? 'active' : ''}`} onClick={() => setActiveId(track.id)}>
              <div>
                <strong>{track.name}</strong>
                <span>{track.artist}</span>
              </div>
              <span>{track.duration}</span>
            </button>
          ))}
        </div>
      </section>
      <footer className="spotify-player">
        <div>
          <strong>{active.name}</strong>
          <span>{active.artist}</span>
        </div>
        <button type="button" onClick={() => setPlaying((state) => !state)}>{playing ? 'Pause' : 'Play'}</button>
      </footer>
    </div>
  );
}
