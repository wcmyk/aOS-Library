import React, { useState, useMemo } from 'react';
import { useMnemoStore } from '../state/useMnemoStore';
import type { StudySet } from '../types';

const C = {
  bg: '#06111f',
  surface: 'rgba(10,25,47,0.8)',
  border: 'rgba(148,163,184,0.2)',
  text: '#e8ebf0',
  muted: '#94a3b8',
  cyan: '#7dd3fc',
  purple: '#a78bfa',
  green: '#34d399',
  amber: '#f59e0b',
  red: '#ef4444',
};

function BookIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="12" y1="6" x2="16" y2="6" />
      <line x1="12" y1="10" x2="16" y2="10" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function formatDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function SetCard({ studySet, lastStudied }: { studySet: StudySet; lastStudied?: Date }) {
  const { setActiveSet, setView, setStudyMode, deleteSet } = useMnemoStore();

  const handleStudy = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSet(studySet.id);
    setStudyMode('flashcards');
    setView('study');
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSet(studySet.id);
    setView('edit');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${studySet.title}"?`)) {
      deleteSet(studySet.id);
    }
  };

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '20px',
        cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.1s',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = C.cyan;
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = C.border;
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
      onClick={handleEdit}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ margin: 0, color: C.text, fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>
          {studySet.title}
        </h3>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={handleEdit}
            style={{
              background: 'none',
              border: 'none',
              color: C.muted,
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
            }}
            title="Edit"
          >
            <EditIcon />
          </button>
          <button
            onClick={handleDelete}
            style={{
              background: 'none',
              border: 'none',
              color: C.muted,
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
            }}
            title="Delete"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: C.cyan, fontSize: 13, fontWeight: 600 }}>
          {studySet.cards.length} card{studySet.cards.length !== 1 ? 's' : ''}
        </span>
        {lastStudied && (
          <span style={{ color: C.muted, fontSize: 12 }}>
            · Last studied {formatDate(lastStudied)}
          </span>
        )}
      </div>

      {studySet.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {studySet.tags.map((tag) => (
            <span
              key={tag}
              style={{
                background: 'rgba(167,139,250,0.15)',
                color: C.purple,
                borderRadius: 20,
                padding: '2px 10px',
                fontSize: 11,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {studySet.description && (
        <p style={{ margin: 0, color: C.muted, fontSize: 13, lineHeight: 1.5,
          overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {studySet.description}
        </p>
      )}

      <button
        onClick={handleStudy}
        style={{
          background: C.cyan,
          color: '#0a1628',
          border: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          alignSelf: 'flex-start',
          marginTop: 'auto',
        }}
      >
        <PlayIcon /> Study
      </button>
    </div>
  );
}

type SortKey = 'recent' | 'alpha' | 'most-studied';

export function Library() {
  const { sets, sessions, setView, setActiveSet, setStudyMode } = useMnemoStore();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');

  const lastStudiedMap = useMemo(() => {
    const map = new Map<string, Date>();
    for (const session of sessions) {
      const existing = map.get(session.setId);
      const sessionDate = session.startedAt instanceof Date ? session.startedAt : new Date(session.startedAt);
      if (!existing || sessionDate > existing) {
        map.set(session.setId, sessionDate);
      }
    }
    return map;
  }, [sessions]);

  const studyCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of sessions) {
      map.set(session.setId, (map.get(session.setId) ?? 0) + 1);
    }
    return map;
  }, [sessions]);

  const filtered = useMemo(() => {
    let result = sets.filter((s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
    );

    if (sort === 'recent') {
      result = result.slice().sort((a, b) => {
        const aDate = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
        const bDate = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
        return bDate.getTime() - aDate.getTime();
      });
    } else if (sort === 'alpha') {
      result = result.slice().sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'most-studied') {
      result = result.slice().sort(
        (a, b) => (studyCountMap.get(b.id) ?? 0) - (studyCountMap.get(a.id) ?? 0),
      );
    }
    return result;
  }, [sets, search, sort, studyCountMap]);

  const handleCreate = () => {
    setActiveSet(null);
    setView('create');
  };

  const handleImport = () => {
    setView('import');
  };

  if (sets.length === 0) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 40,
      }}>
        <BookIcon />
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 8px', color: C.text, fontSize: 22 }}>No study sets yet</h2>
          <p style={{ margin: 0, color: C.muted, fontSize: 15 }}>
            Create a set manually or import from text/CSV to get started.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleCreate}
            style={{
              background: C.cyan,
              color: '#0a1628',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <PlusIcon /> Create your first set
          </button>
          <button
            onClick={handleImport}
            style={{
              background: 'transparent',
              color: C.cyan,
              border: `1px solid ${C.cyan}`,
              borderRadius: 8,
              padding: '10px 20px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <UploadIcon /> Import
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', gap: 20, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 22, fontWeight: 700 }}>
          My Library
          <span style={{ marginLeft: 10, color: C.muted, fontWeight: 400, fontSize: 16 }}>
            {sets.length} set{sets.length !== 1 ? 's' : ''}
          </span>
        </h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleImport}
            style={{
              background: 'transparent',
              color: C.cyan,
              border: `1px solid ${C.cyan}`,
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <UploadIcon /> Import
          </button>
          <button
            onClick={handleCreate}
            style={{
              background: C.cyan,
              color: '#0a1628',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <PlusIcon /> New Set
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: '8px 14px',
        }}>
          <span style={{ color: C.muted }}><SearchIcon /></span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sets..."
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              color: C.text,
              fontSize: 14,
              flex: 1,
            }}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: '8px 14px',
            color: C.text,
            fontSize: 13,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="recent">Most Recent</option>
          <option value="alpha">A–Z</option>
          <option value="most-studied">Most Studied</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: C.muted, paddingTop: 40, fontSize: 15 }}>
          No sets match your search.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {filtered.map((s) => (
            <SetCard key={s.id} studySet={s} lastStudied={lastStudiedMap.get(s.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
