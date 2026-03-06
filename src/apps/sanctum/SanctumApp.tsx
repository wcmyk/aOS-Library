import { useMemo } from 'react';
import { useDriveStore } from '../../state/useDriveStore';

export function SanctumApp() {
  const { documents } = useDriveStore();

  const stats = useMemo(() => {
    const shared = documents.filter((doc) => doc.sharedWith.length > 0 || doc.owner !== 'You').length;
    const mine = documents.filter((doc) => doc.owner === 'You').length;
    const totalWords = documents.reduce((acc, doc) => acc + doc.content.split(/\s+/).filter(Boolean).length, 0);
    return { shared, mine, totalWords };
  }, [documents]);

  return (
    <div className="sanctum-shell">
      <header className="sanctum-header">
        <div>
          <h2>Sanctum Drive</h2>
          <p>Cloud documents synced from Oracle</p>
        </div>
        <div className="sanctum-stats">
          <span>{stats.mine} My Files</span>
          <span>{stats.shared} Shared</span>
          <span>{stats.totalWords.toLocaleString()} Words</span>
        </div>
      </header>

      <section className="sanctum-grid">
        {documents.map((doc) => (
          <article key={doc.id} className="sanctum-card">
            <div className="sanctum-doc-icon">W</div>
            <div>
              <h3>{doc.title}</h3>
              <p>{doc.content.slice(0, 120) || 'No preview available.'}</p>
              <div className="sanctum-meta">
                <span>{doc.owner}</span>
                <span>{doc.folder}</span>
                <span>{new Date(doc.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
