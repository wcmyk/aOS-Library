import { useEffect, useMemo, useState } from 'react';
import { useDriveStore } from '../../state/useDriveStore';

type OracleView = 'home' | 'editor';
type HomeTab = 'Recent' | 'Shared' | 'All';

export function OracleApp() {
  const { documents, activeDocumentId, setActiveDocument, createDocument, updateDocument } = useDriveStore();
  const wordDocs = documents.filter((doc) => doc.type === 'document');
  const [view, setView] = useState<OracleView>('home');
  const [tab, setTab] = useState<HomeTab>('Recent');
  const [activeId, setActiveId] = useState<string | null>(activeDocumentId ?? wordDocs[0]?.id ?? null);

  useEffect(() => {
    if (activeDocumentId) {
      const exists = wordDocs.some((doc) => doc.id === activeDocumentId);
      if (exists) {
        setActiveId(activeDocumentId);
        setView('editor');
      }
    }
  }, [activeDocumentId, wordDocs]);

  const activeDoc = wordDocs.find((doc) => doc.id === activeId) ?? null;

  const homeDocuments = useMemo(() => {
    if (tab === 'Shared') return wordDocs.filter((doc) => doc.sharedWith.length > 0 || doc.owner !== 'You');
    if (tab === 'Recent') return wordDocs.slice(0, 8);
    return wordDocs;
  }, [wordDocs, tab]);

  const openDocument = (id: string) => {
    setActiveDocument(id);
    setActiveId(id);
    setView('editor');
  };

  const createNewDocument = () => {
    const id = createDocument('Untitled Document');
    setActiveId(id);
    setView('editor');
  };

  if (view === 'home') {
    return (
      <div className="oracle-shell">
        <aside className="oracle-sidebar">
          <h2>Word</h2>
          <button type="button" className="oracle-primary" onClick={createNewDocument}>
            + New blank document
          </button>
          <button type="button" className="oracle-link" onClick={() => setTab('Recent')}>Recent</button>
          <button type="button" className="oracle-link" onClick={() => setTab('Shared')}>Shared</button>
          <button type="button" className="oracle-link" onClick={() => setTab('All')}>All files</button>
        </aside>

        <section className="oracle-home">
          <header className="oracle-home-header">
            <h3>{tab}</h3>
            <span>{homeDocuments.length} files</span>
          </header>
          <div className="oracle-doc-grid">
            <button type="button" className="oracle-template-card" onClick={createNewDocument}>
              <div className="oracle-template-preview" />
              <strong>Blank document</strong>
              <span>Start from scratch</span>
            </button>

            {homeDocuments.map((doc) => (
              <button key={doc.id} type="button" className="oracle-doc-card" onClick={() => openDocument(doc.id)}>
                <div className="oracle-doc-thumb" />
                <strong>{doc.title}</strong>
                <span>{doc.owner} • {new Date(doc.updatedAt).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="oracle-editor-shell">
      <div className="oracle-ribbon">
        <button type="button" onClick={() => setView('home')}>← Back</button>
        <input
          className="oracle-title-input"
          value={activeDoc?.title ?? ''}
          onChange={(event) => activeDoc && updateDocument(activeDoc.id, { title: event.target.value })}
          placeholder="Document title"
        />
        <span>Saved to Sanctum</span>
      </div>

      <div className="oracle-editor-surface">
        <div className="oracle-page">
          <textarea
            className="oracle-textarea"
            value={activeDoc?.content ?? ''}
            onChange={(event) => activeDoc && updateDocument(activeDoc.id, { content: event.target.value })}
            placeholder="Start typing your document..."
          />
        </div>
      </div>
    </div>
  );
}
