import { useMemo, useState } from 'react';
import { useDriveStore, type DriveDocument } from '../../state/useDriveStore';

type SanctumAppProps = {
  onOpenDocument: (doc: DriveDocument) => void;
};

export function SanctumApp({ onOpenDocument }: SanctumAppProps) {
  const { documents } = useDriveStore();
  const [filter, setFilter] = useState<'all' | 'document' | 'spreadsheet'>('all');

  const visibleDocuments = useMemo(
    () => documents.filter((doc) => (filter === 'all' ? true : doc.type === filter)),
    [documents, filter],
  );

  const stats = useMemo(() => {
    const shared = documents.filter((doc) => doc.sharedWith.length > 0 || doc.owner !== 'You').length;
    const mine = documents.filter((doc) => doc.owner === 'You').length;
    const spreadsheets = documents.filter((doc) => doc.type === 'spreadsheet').length;
    return { shared, mine, spreadsheets };
  }, [documents]);

  return (
    <div className="sanctum-shell sanctum-shell-upgraded">
      <header className="sanctum-header sanctum-header-upgraded">
        <div>
          <h2>Sanctum Drive</h2>
          <p>Organized cloud workspace for Oracle docs and Accel workbooks</p>
        </div>
        <div className="sanctum-stats">
          <span>{stats.mine} My Files</span>
          <span>{stats.shared} Shared</span>
          <span>{stats.spreadsheets} Workbooks</span>
        </div>
      </header>

      <div className="sanctum-toolbar">
        <button type="button" onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All</button>
        <button type="button" onClick={() => setFilter('document')} className={filter === 'document' ? 'active' : ''}>Documents</button>
        <button type="button" onClick={() => setFilter('spreadsheet')} className={filter === 'spreadsheet' ? 'active' : ''}>Spreadsheets</button>
      </div>

      <section className="sanctum-grid">
        {visibleDocuments.map((doc) => (
          <button key={doc.id} type="button" className="sanctum-card" onClick={() => onOpenDocument(doc)}>
            <div className="sanctum-doc-icon">{doc.type === 'spreadsheet' ? 'X' : 'W'}</div>
            <div>
              <h3>{doc.title}</h3>
              <p>{doc.content.slice(0, 120) || 'No preview available.'}</p>
              <div className="sanctum-meta">
                <span>{doc.owner}</span>
                <span>{doc.folder}</span>
                <span>{doc.type === 'spreadsheet' ? 'Workbook' : 'Document'}</span>
                <span>{new Date(doc.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </button>
        ))}
      </section>
    </div>
  );
}
