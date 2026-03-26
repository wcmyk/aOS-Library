import React, { useState, useMemo } from 'react';
import { useTheme } from '../theme';
import { useMnemoStore } from '../state/useMnemoStore';
import type { StudySet } from '../types';

// Per-card accent gradients keyed by first char of id
const CARD_ACCENTS: Array<[string, string]> = [
  ['#FDA4AF', '#F43F5E'],
  ['#C4B5FD', '#8B5CF6'],
  ['#6EE7B7', '#10B981'],
  ['#93C5FD', '#3B82F6'],
  ['#FDE68A', '#F59E0B'],
  ['#F9A8D4', '#EC4899'],
  ['#A5F3FC', '#06B6D4'],
  ['#BBF7D0', '#22C55E'],
];

function getAccent(id: string): [string, string] {
  const idx = (id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % CARD_ACCENTS.length;
  return CARD_ACCENTS[idx];
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function formatDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Decorative background elements ──────────────────────────────────────────

function BackgroundDecor({ isDark }: { isDark: boolean }) {
  const opacity = isDark ? 0.06 : 0.55;
  const starColor = isDark ? '#ffffff' : '#F9A8D4';
  const cloudColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)';
  const heartColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(249,168,212,0.45)';

  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden' }}
      viewBox="0 0 900 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Clouds */}
      <ellipse cx="120" cy="520" rx="90" ry="38" fill={cloudColor} />
      <ellipse cx="100" cy="510" rx="55" ry="34" fill={cloudColor} />
      <ellipse cx="160" cy="510" rx="55" ry="34" fill={cloudColor} />
      <ellipse cx="780" cy="70" rx="72" ry="30" fill={cloudColor} />
      <ellipse cx="760" cy="62" rx="44" ry="28" fill={cloudColor} />
      <ellipse cx="820" cy="62" rx="44" ry="28" fill={cloudColor} />
      <ellipse cx="820" cy="480" rx="56" ry="23" fill={cloudColor} />
      <ellipse cx="800" cy="472" rx="35" ry="22" fill={cloudColor} />
      <ellipse cx="848" cy="472" rx="35" ry="22" fill={cloudColor} />

      {/* Stars ✦ */}
      <g fill={starColor} opacity={opacity}>
        <path d="M60 80 L62 72 L64 80 L72 82 L64 84 L62 92 L60 84 L52 82 Z" />
        <path d="M840 200 L842 194 L844 200 L850 202 L844 204 L842 210 L840 204 L834 202 Z" />
        <path d="M300 560 L302 554 L304 560 L310 562 L304 564 L302 570 L300 564 L294 562 Z" />
        <path d="M550 40 L552 34 L554 40 L560 42 L554 44 L552 50 L550 44 L544 42 Z" transform="scale(1.4) translate(-100,0)" />
        <path d="M700 530 L701 526 L702 530 L706 531 L702 532 L701 536 L700 532 L696 531 Z" />
      </g>

      {/* Sparkle dots */}
      <g opacity={isDark ? 0.08 : 0.5}>
        <circle cx="440" cy="55" r="4" fill={starColor} />
        <circle cx="455" cy="45" r="2.5" fill={starColor} />
        <circle cx="465" cy="58" r="3" fill={starColor} />
        <circle cx="200" cy="110" r="3" fill={starColor} />
        <circle cx="660" cy="470" r="4" fill={starColor} />
        <circle cx="675" cy="460" r="2.5" fill={starColor} />
        <circle cx="40" cy="300" r="3.5" fill={starColor} />
      </g>

      {/* Hearts */}
      <g fill={heartColor}>
        <path d="M880 380 C880 370 870 360 860 370 C850 360 840 370 840 380 C840 395 860 410 860 410 C860 410 880 395 880 380 Z" />
        <path d="M55 180 C55 173 49 166 43 173 C37 166 31 173 31 180 C31 191 43 201 43 201 C43 201 55 191 55 180 Z" transform="scale(0.65) translate(30,50)" />
      </g>
    </svg>
  );
}

// ─── Set Card ─────────────────────────────────────────────────────────────────

function SetCard({ studySet, lastStudied }: { studySet: StudySet; lastStudied?: Date }) {
  const { setActiveSet, setView, setStudyMode, deleteSet } = useMnemoStore();
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);

  const [accentA, accentB] = getAccent(studySet.id);

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

  const shadowBase = theme.isDark
    ? '0 2px 12px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)'
    : '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)';
  const shadowHover = theme.isDark
    ? `0 16px 40px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)`
    : `0 16px 40px rgba(0,0,0,0.1), 0 4px 8px ${theme.shadow}`;

  return (
    <div
      style={{
        background: theme.surface,
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? shadowHover : shadowBase,
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${theme.border}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleEdit}
    >
      {/* Gradient accent strip */}
      <div style={{
        height: 6,
        background: `linear-gradient(90deg, ${accentA}, ${accentB})`,
        flexShrink: 0,
      }} />

      <div style={{ padding: '18px 18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <h3 style={{
            margin: 0,
            color: theme.text,
            fontSize: 15,
            fontWeight: 700,
            lineHeight: 1.35,
            flex: 1,
          }}>
            {studySet.title}
          </h3>
          <div style={{
            display: 'flex',
            gap: 1,
            flexShrink: 0,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.15s',
          }}>
            <button
              onClick={handleEdit}
              style={{
                background: 'none', border: 'none',
                color: theme.textMuted, cursor: 'pointer',
                padding: '4px', borderRadius: 6,
                display: 'flex', alignItems: 'center',
              }}
              title="Edit"
            >
              <EditIcon />
            </button>
            <button
              onClick={handleDelete}
              style={{
                background: 'none', border: 'none',
                color: theme.textMuted, cursor: 'pointer',
                padding: '4px', borderRadius: 6,
                display: 'flex', alignItems: 'center',
              }}
              title="Delete"
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        {/* Card count badge + last studied */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            background: theme.primaryMuted,
            color: theme.primary,
            fontSize: 12,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 20,
            whiteSpace: 'nowrap',
          }}>
            {studySet.cards.length} card{studySet.cards.length !== 1 ? 's' : ''}
          </span>
          {lastStudied && (
            <span style={{ color: theme.textMuted, fontSize: 11.5 }}>
              · Last studied {formatDate(lastStudied)}
            </span>
          )}
        </div>

        {/* Tags */}
        {studySet.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {studySet.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  background: 'rgba(167,139,250,0.12)',
                  color: '#8B5CF6',
                  borderRadius: 20,
                  padding: '2px 9px',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {studySet.description && (
          <p style={{
            margin: 0,
            color: theme.textMuted,
            fontSize: 12.5,
            lineHeight: 1.55,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {studySet.description}
          </p>
        )}

        {/* Study button */}
        <button
          onClick={handleStudy}
          style={{
            background: `linear-gradient(135deg, ${accentA}, ${accentB})`,
            color: '#fff',
            border: 'none',
            borderRadius: 50,
            padding: '9px 20px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 12.5,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            alignSelf: 'flex-start',
            marginTop: 'auto',
            paddingTop: 10,
            boxShadow: '0 3px 12px rgba(0,0,0,0.14)',
            transition: 'transform 0.12s, box-shadow 0.12s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.06)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,0.14)';
          }}
        >
          <PlayIcon /> Study
        </button>
      </div>
    </div>
  );
}

// ─── Library ──────────────────────────────────────────────────────────────────

type SortKey = 'recent' | 'alpha' | 'most-studied';

export function Library() {
  const { sets, sessions, setView, setActiveSet, setStudyMode } = useMnemoStore();
  const theme = useTheme();
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

  const handleCreate = () => { setActiveSet(null); setView('create'); };
  const handleImport = () => { setView('import'); };

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (sets.length === 0) {
    return (
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        padding: 40,
        background: theme.bg,
        overflow: 'hidden',
      }}>
        <BackgroundDecor isDark={theme.isDark} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            background: theme.primaryMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 8px 24px ${theme.shadow}`,
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div>
            <h2 style={{ margin: '0 0 10px', color: theme.text, fontSize: 24, fontWeight: 800 }}>No study sets yet</h2>
            <p style={{ margin: 0, color: theme.textMuted, fontSize: 14, lineHeight: 1.6, maxWidth: 320 }}>
              Create a set manually or import from text/CSV to get started.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleCreate}
              style={{
                background: theme.primary,
                color: '#fff',
                border: 'none',
                borderRadius: 50,
                padding: '11px 24px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: `0 4px 16px ${theme.shadow}`,
                fontFamily: 'inherit',
              }}
            >
              <PlusIcon /> Create your first set
            </button>
            <button
              onClick={handleImport}
              style={{
                background: theme.surface,
                color: theme.text,
                border: `1.5px solid ${theme.border}`,
                borderRadius: 50,
                padding: '11px 24px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'inherit',
              }}
            >
              <UploadIcon /> Import
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main library view ────────────────────────────────────────────────────────
  return (
    <div style={{
      flex: 1,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      background: theme.bg,
      overflow: 'hidden',
    }}>
      {/* Decorative background */}
      <BackgroundDecor isDark={theme.isDark} />

      {/* Scrollable content layer */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 28px',
        gap: 22,
        overflowY: 'auto',
      }}>
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{
              margin: 0,
              color: theme.text,
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: -0.5,
              lineHeight: 1.1,
            }}>
              My Library
            </h2>
            <p style={{ margin: '5px 0 0', color: theme.textMuted, fontSize: 13 }}>
              {sets.length} set{sets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <button
              onClick={handleImport}
              style={{
                background: theme.surface,
                color: theme.text,
                border: `1.5px solid ${theme.border}`,
                borderRadius: 50,
                padding: '8px 16px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                fontFamily: 'inherit',
              }}
            >
              <UploadIcon /> Import
            </button>
            <button
              onClick={handleCreate}
              style={{
                background: theme.primary,
                color: '#fff',
                border: 'none',
                borderRadius: 50,
                padding: '8px 18px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: `0 4px 14px ${theme.shadow}`,
                fontFamily: 'inherit',
              }}
            >
              <PlusIcon /> New Set
            </button>
          </div>
        </div>

        {/* Search + sort row */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: theme.surface,
            border: `1.5px solid ${theme.border}`,
            borderRadius: 14,
            padding: '9px 14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <span style={{ color: theme.textMuted, display: 'flex', alignItems: 'center' }}>
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sets..."
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: theme.text,
                fontSize: 14,
                flex: 1,
                fontFamily: 'inherit',
              }}
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            style={{
              background: theme.surface,
              border: `1.5px solid ${theme.border}`,
              borderRadius: 14,
              padding: '9px 14px',
              color: theme.text,
              fontSize: 13,
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              fontFamily: 'inherit',
            }}
          >
            <option value="recent">Most Recent</option>
            <option value="alpha">A–Z</option>
            <option value="most-studied">Most Studied</option>
          </select>
        </div>

        {/* Grid or empty search result */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: theme.textMuted, paddingTop: 48, fontSize: 14 }}>
            No sets match your search.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(265px, 1fr))',
            gap: 18,
          }}>
            {filtered.map((s) => (
              <SetCard key={s.id} studySet={s} lastStudied={lastStudiedMap.get(s.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
