import React, { useState } from 'react';
import { useMnemoStore } from './state/useMnemoStore';
import { Library } from './components/Library';
import { SetEditor } from './components/SetEditor';
import { ImportFlow } from './components/ImportFlow';
import { Statistics } from './components/Statistics';
import { FlashcardsMode } from './components/study/Flashcards';
import { LearnMode } from './components/study/LearnMode';
import { TestMode } from './components/study/TestMode';
import { MatchMode } from './components/study/MatchMode';
import { SplitLearning } from './components/study/SplitLearning';
import { TetrisGame } from './components/games/TetrisGame';
import { SpeedMatch } from './components/games/SpeedMatch';
import { MemoryFlip } from './components/games/MemoryFlip';
import { BlastGame } from './components/games/BlastGame';
import type { AppView, StudyMode, AnswerDirection } from './types';

const C = {
  bg: '#06111f',
  sidebar: 'rgba(6,17,31,0.95)',
  sidebarBorder: 'rgba(148,163,184,0.12)',
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

// ─── SVG Icons ─────────────────────────────────────────────────────────────

function IconBooks() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  );
}

function IconCards() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="16" height="12" rx="2"/><path d="M6 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2"/>
    </svg>
  );
}

function IconBrain() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.98-3.5A3 3 0 0 1 4 12a3 3 0 0 1 1-5.67A2.5 2.5 0 0 1 9.5 2Z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.98-3.5A3 3 0 0 0 20 12a3 3 0 0 0-1-5.67A2.5 2.5 0 0 0 14.5 2Z"/>
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  );
}

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}

function IconColumns() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/>
    </svg>
  );
}

function IconGamepad() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/>
      <circle cx="15" cy="11" r="1" fill="currentColor"/><circle cx="17" cy="13" r="1" fill="currentColor"/>
      <path d="M4 8a2 2 0 0 0-2 2v4a6 6 0 0 0 6 6h8a6 6 0 0 0 6-6v-4a2 2 0 0 0-2-2H4Z"/>
    </svg>
  );
}

function IconBarChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function IconTetris() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="5" height="5" rx="1"/><rect x="4" y="10" width="5" height="5" rx="1"/>
      <rect x="10" y="10" width="5" height="5" rx="1"/><rect x="15" y="10" width="5" height="5" rx="1"/>
    </svg>
  );
}

// ─── Settings Panel ──────────────────────────────────────────────────────────

function SettingsPanel() {
  const { answerDirection, setAnswerDirection } = useMnemoStore();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', gap: 24, overflowY: 'auto' }}>
      <h2 style={{ margin: 0, color: C.text, fontSize: 20, fontWeight: 700 }}>Settings</h2>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ margin: 0, color: C.text, fontSize: 15, fontWeight: 600 }}>Study Defaults</h3>
        <div>
          <label style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Default Answer Direction</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['term_to_definition', 'definition_to_term'] as AnswerDirection[]).map((dir) => (
              <button
                key={dir}
                onClick={() => setAnswerDirection(dir)}
                style={{
                  background: answerDirection === dir ? 'rgba(125,211,252,0.15)' : C.surface,
                  border: `1px solid ${answerDirection === dir ? C.cyan : C.border}`,
                  borderRadius: 8,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  color: answerDirection === dir ? C.cyan : C.muted,
                  fontSize: 13,
                  fontWeight: answerDirection === dir ? 600 : 400,
                }}
              >
                {dir === 'term_to_definition' ? 'Term → Definition' : 'Definition → Term'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px' }}>
        <h3 style={{ margin: '0 0 8px', color: C.text, fontSize: 15, fontWeight: 600 }}>About Mnemo</h3>
        <p style={{ margin: 0, color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
          Mnemo is a Quizlet-style study application built for the aOS framework.
          It supports flashcards, adaptive learning, tests, matching games, and more.
        </p>
      </div>
    </div>
  );
}

// ─── Study Hub ────────────────────────────────────────────────────────────────

function StudyHub() {
  const { sets, activeSetId, setStudyMode, studyMode } = useMnemoStore();
  const activeSet = sets.find((s) => s.id === activeSetId);

  const modes: { mode: StudyMode; label: string; desc: string; color: string }[] = [
    { mode: 'flashcards', label: 'Flashcards', desc: 'Classic flip cards with keyboard shortcuts', color: C.cyan },
    { mode: 'learn', label: 'Learn', desc: 'Adaptive mode with multiple question types', color: C.purple },
    { mode: 'test', label: 'Test', desc: 'Generate a timed test with various formats', color: C.amber },
    { mode: 'match', label: 'Match', desc: 'Click matching pairs in a grid', color: C.green },
    { mode: 'split', label: 'Split Learning', desc: 'Organize cards into phases', color: '#818cf8' },
  ];

  if (!activeSet) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: C.muted }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        <p style={{ margin: 0, fontSize: 16 }}>Select a study set from the Library first.</p>
      </div>
    );
  }

  const renderStudyContent = () => {
    switch (studyMode) {
      case 'flashcards': return <FlashcardsMode />;
      case 'learn': return <LearnMode />;
      case 'test': return <TestMode />;
      case 'match': return <MatchMode />;
      case 'split': return <SplitLearning />;
      default: return <FlashcardsMode />;
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Mode selector */}
      <div style={{
        display: 'flex',
        gap: 0,
        padding: '0 20px',
        borderBottom: `1px solid ${C.sidebarBorder}`,
        background: 'rgba(6,17,31,0.5)',
        flexShrink: 0,
        overflowX: 'auto',
      }}>
        {modes.map(({ mode, label, color }) => (
          <button
            key={mode}
            onClick={() => setStudyMode(mode)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: studyMode === mode ? `2px solid ${color}` : '2px solid transparent',
              color: studyMode === mode ? color : C.muted,
              padding: '12px 16px',
              cursor: 'pointer',
              fontWeight: studyMode === mode ? 600 : 400,
              fontSize: 13,
              whiteSpace: 'nowrap',
              marginBottom: -1,
              transition: 'color 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {renderStudyContent()}
      </div>
    </div>
  );
}

// ─── Games Hub ───────────────────────────────────────────────────────────────

function GamesHub() {
  const { sets, activeSetId, studyMode, setStudyMode } = useMnemoStore();
  const activeSet = sets.find((s) => s.id === activeSetId);

  const games: { mode: StudyMode; label: string; desc: string; color: string; icon: React.ReactNode }[] = [
    { mode: 'game_tetris', label: 'Mnemo Tetris', desc: 'Classic Tetris with study questions every 3 pieces', color: C.cyan, icon: <IconTetris /> },
    { mode: 'game_speed', label: 'Speed Match', desc: 'Same or different? 60 seconds, rapid fire', color: C.amber, icon: <IconGamepad /> },
    { mode: 'game_memory', label: 'Memory Flip', desc: 'Match term-definition pairs on a grid', color: C.purple, icon: <IconGrid /> },
    { mode: 'game_blast', label: 'Blast', desc: 'Click the correct definition bubble to blast it', color: C.red, icon: <IconGamepad /> },
  ];

  const gameStudyModes = ['game_tetris', 'game_speed', 'game_memory', 'game_blast'];
  const isInGame = gameStudyModes.includes(studyMode);

  if (isInGame && activeSet) {
    const renderGame = () => {
      switch (studyMode) {
        case 'game_tetris': return <TetrisGame />;
        case 'game_speed': return <SpeedMatch />;
        case 'game_memory': return <MemoryFlip />;
        case 'game_blast': return <BlastGame />;
        default: return null;
      }
    };

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          gap: 0,
          padding: '0 16px',
          borderBottom: `1px solid ${C.sidebarBorder}`,
          background: 'rgba(6,17,31,0.5)',
          flexShrink: 0,
          overflowX: 'auto',
          alignItems: 'center',
        }}>
          {games.map(({ mode, label, color }) => (
            <button
              key={mode}
              onClick={() => setStudyMode(mode)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: studyMode === mode ? `2px solid ${color}` : '2px solid transparent',
                color: studyMode === mode ? color : C.muted,
                padding: '11px 14px',
                cursor: 'pointer',
                fontWeight: studyMode === mode ? 600 : 400,
                fontSize: 12,
                whiteSpace: 'nowrap',
                marginBottom: -1,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {renderGame()}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', gap: 20, overflowY: 'auto' }}>
      <h2 style={{ margin: 0, color: C.text, fontSize: 20, fontWeight: 700 }}>Games</h2>
      {!activeSet && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: `1px solid ${C.amber}`,
          borderRadius: 10,
          padding: '12px 16px',
          color: C.amber,
          fontSize: 13,
        }}>
          Select a study set from the Library to enable games.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {games.map(({ mode, label, desc, color, icon }) => (
          <div
            key={mode}
            onClick={() => {
              if (activeSet) {
                setStudyMode(mode);
              }
            }}
            style={{
              background: C.surface,
              border: `1px solid ${activeSet ? color + '44' : C.border}`,
              borderRadius: 14,
              padding: '20px',
              cursor: activeSet ? 'pointer' : 'default',
              opacity: activeSet ? 1 : 0.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              transition: 'border-color 0.2s, transform 0.1s',
            }}
            onMouseEnter={(e) => { if (activeSet) { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = activeSet ? color + '44' : C.border; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ color, display: 'flex', alignItems: 'center', gap: 8 }}>
              {icon}
              <span style={{ fontSize: 15, fontWeight: 700 }}>{label}</span>
            </div>
            <p style={{ margin: 0, color: C.muted, fontSize: 13, lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

interface NavItem {
  view: AppView;
  label: string;
  icon: React.ReactNode;
  color?: string;
}

const NAV_ITEMS: NavItem[] = [
  { view: 'library', label: 'Library', icon: <IconBooks /> },
  { view: 'create', label: 'Create', icon: <IconPlus />, color: C.cyan },
  { view: 'import', label: 'Import', icon: <IconUpload /> },
  { view: 'study', label: 'Study', icon: <IconCards />, color: C.purple },
  { view: 'games', label: 'Games', icon: <IconGamepad />, color: C.amber },
  { view: 'stats', label: 'Statistics', icon: <IconBarChart /> },
  { view: 'settings', label: 'Settings', icon: <IconSettings /> },
];

function Sidebar() {
  const { activeView, setView, sets, activeSetId } = useMnemoStore();
  const activeSet = sets.find((s) => s.id === activeSetId);

  return (
    <div style={{
      width: 200,
      background: C.sidebar,
      borderRight: `1px solid ${C.sidebarBorder}`,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Brand */}
      <div style={{ padding: '20px 16px 16px', borderBottom: `1px solid ${C.sidebarBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="24" height="24" rx="6" fill="rgba(125,211,252,0.12)" stroke={C.cyan} strokeWidth="1.5"/>
            <path d="M7 20 L10 8 L14 16 L18 10 L21 20" stroke={C.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span style={{ color: C.text, fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>Mnemo</span>
        </div>
      </div>

      {/* Active set indicator */}
      {activeSet && (
        <div style={{
          padding: '10px 14px',
          borderBottom: `1px solid ${C.sidebarBorder}`,
          background: 'rgba(125,211,252,0.04)',
        }}>
          <p style={{ margin: 0, color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>Active Set</p>
          <p style={{ margin: 0, color: C.cyan, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeSet.title}
          </p>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ view, label, icon, color }) => {
          const isActive = activeView === view;
          const accentColor = color ?? C.cyan;
          return (
            <button
              key={view}
              onClick={() => setView(view)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 16px',
                background: isActive ? `rgba(125,211,252,0.08)` : 'none',
                border: 'none',
                borderLeft: isActive ? `2px solid ${accentColor}` : '2px solid transparent',
                color: isActive ? accentColor : C.muted,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                textAlign: 'left',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = C.text; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = C.muted; }}
            >
              {icon}
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ─── Top Bar ─────────────────────────────────────────────────────────────────

function TopBar() {
  const { sets, activeSetId, activeView, answerDirection, setAnswerDirection } = useMnemoStore();
  const activeSet = sets.find((s) => s.id === activeSetId);

  const viewLabels: Record<AppView, string> = {
    library: 'Library',
    create: 'Create Set',
    edit: 'Edit Set',
    import: 'Import',
    study: 'Study',
    games: 'Games',
    stats: 'Statistics',
    settings: 'Settings',
  };

  return (
    <div style={{
      height: 48,
      background: C.sidebar,
      borderBottom: `1px solid ${C.sidebarBorder}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 16,
      flexShrink: 0,
    }}>
      <h1 style={{ margin: 0, color: C.text, fontSize: 14, fontWeight: 600, flex: 1 }}>
        {viewLabels[activeView]}
        {activeSet && (activeView === 'study' || activeView === 'games') && (
          <span style={{ color: C.muted, fontWeight: 400, marginLeft: 8 }}>· {activeSet.title}</span>
        )}
      </h1>

      {(activeView === 'study' || activeView === 'games') && (
        <button
          onClick={() => setAnswerDirection(answerDirection === 'term_to_definition' ? 'definition_to_term' : 'term_to_definition')}
          style={{
            background: 'rgba(167,139,250,0.1)',
            border: `1px solid rgba(167,139,250,0.4)`,
            borderRadius: 6,
            padding: '4px 12px',
            cursor: 'pointer',
            color: C.purple,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {answerDirection === 'term_to_definition' ? 'Term → Def' : 'Def → Term'}
        </button>
      )}
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function MainContent() {
  const { activeView } = useMnemoStore();

  switch (activeView) {
    case 'library': return <Library />;
    case 'create': return <SetEditor />;
    case 'edit': return <SetEditor />;
    case 'import': return <ImportFlow />;
    case 'study': return <StudyHub />;
    case 'games': return <GamesHub />;
    case 'stats': return <Statistics />;
    case 'settings': return <SettingsPanel />;
    default: return <Library />;
  }
}

// ─── MnemoApp ─────────────────────────────────────────────────────────────────

export function MnemoApp() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: C.bg,
      fontFamily: "'SF Pro Display', Inter, system-ui, -apple-system, sans-serif",
      color: C.text,
      overflow: 'hidden',
    }}>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden', background: C.bg }}>
          <MainContent />
        </main>
      </div>
    </div>
  );
}
