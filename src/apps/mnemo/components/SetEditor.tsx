import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMnemoStore } from '../state/useMnemoStore';
import type { Flashcard } from '../types';

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

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

interface CardRowProps {
  card: Flashcard;
  index: number;
  total: number;
  setId: string;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function CardRow({ card, index, total, setId, onDelete, onMoveUp, onMoveDown }: CardRowProps) {
  const { updateCard } = useMnemoStore();
  const [term, setTerm] = useState(card.term);
  const [definition, setDefinition] = useState(card.definition);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (field: 'term' | 'definition', value: string) => {
    if (field === 'term') setTerm(value);
    else setDefinition(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateCard(setId, card.id, { [field]: value });
    }, 500);
  };

  useEffect(() => {
    setTerm(card.term);
    setDefinition(card.definition);
  }, [card.term, card.definition]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    padding: '8px 12px',
    color: C.text,
    fontSize: 14,
    width: '100%',
    outline: 'none',
    resize: 'vertical',
    minHeight: 40,
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
    }}>
      <span style={{ color: C.muted, fontSize: 12, minWidth: 20, paddingTop: 10, textAlign: 'center' }}>
        {index + 1}
      </span>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ display: 'block', color: C.muted, fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Term</label>
          <textarea
            value={term}
            onChange={(e) => handleChange('term', e.target.value)}
            style={inputStyle}
            rows={2}
            onFocus={(e) => (e.target.style.borderColor = C.cyan)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
        </div>
        <div>
          <label style={{ display: 'block', color: C.muted, fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Definition</label>
          <textarea
            value={definition}
            onChange={(e) => handleChange('definition', e.target.value)}
            style={inputStyle}
            rows={2}
            onFocus={(e) => (e.target.style.borderColor = C.cyan)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          style={{
            background: 'none',
            border: 'none',
            color: index === 0 ? 'rgba(148,163,184,0.3)' : C.muted,
            cursor: index === 0 ? 'default' : 'pointer',
            padding: 4,
            borderRadius: 4,
            display: 'flex',
          }}
        >
          <ArrowUpIcon />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          style={{
            background: 'none',
            border: 'none',
            color: index === total - 1 ? 'rgba(148,163,184,0.3)' : C.muted,
            cursor: index === total - 1 ? 'default' : 'pointer',
            padding: 4,
            borderRadius: 4,
            display: 'flex',
          }}
        >
          <ArrowDownIcon />
        </button>
        <button
          onClick={onDelete}
          style={{
            background: 'none',
            border: 'none',
            color: C.red,
            cursor: 'pointer',
            padding: 4,
            borderRadius: 4,
            display: 'flex',
          }}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

export function SetEditor() {
  const { sets, activeSetId, createSet, updateSet, addCard, deleteCard, reorderCards, setActiveSet, setView, importCards } = useMnemoStore();

  const isCreate = !activeSetId;
  const existingSet = sets.find((s) => s.id === activeSetId);

  const [title, setTitle] = useState(existingSet?.title ?? '');
  const [description, setDescription] = useState(existingSet?.description ?? '');
  const [tagsInput, setTagsInput] = useState(existingSet?.tags.join(', ') ?? '');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [savedSetId, setSavedSetId] = useState<string | null>(activeSetId);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (existingSet) {
      setTitle(existingSet.title);
      setDescription(existingSet.description);
      setTagsInput(existingSet.tags.join(', '));
    }
  }, [activeSetId]);

  const activeSet = savedSetId ? sets.find((s) => s.id === savedSetId) : null;

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value);
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    titleDebounceRef.current = setTimeout(() => {
      if (savedSetId) {
        updateSet(savedSetId, { title: value });
      }
    }, 500);
  }, [savedSetId, updateSet]);

  const handleDescChange = useCallback((value: string) => {
    setDescription(value);
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    titleDebounceRef.current = setTimeout(() => {
      if (savedSetId) {
        updateSet(savedSetId, { description: value });
      }
    }, 500);
  }, [savedSetId, updateSet]);

  const handleTagsChange = useCallback((value: string) => {
    setTagsInput(value);
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    titleDebounceRef.current = setTimeout(() => {
      if (savedSetId) {
        const tags = value.split(',').map((t) => t.trim()).filter(Boolean);
        updateSet(savedSetId, { tags });
      }
    }, 500);
  }, [savedSetId, updateSet]);

  const handleSaveSet = () => {
    if (!title.trim()) return;
    if (isCreate || !savedSetId) {
      const newSet = createSet(title.trim(), description.trim());
      setSavedSetId(newSet.id);
      setActiveSet(newSet.id);
    } else {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      updateSet(savedSetId, { title: title.trim(), description: description.trim(), tags });
    }
  };

  const handleAddCard = () => {
    if (!savedSetId) {
      handleSaveSet();
      return;
    }
    addCard(savedSetId, '', '');
  };

  const handleDeleteCard = (cardId: string) => {
    if (!savedSetId) return;
    deleteCard(savedSetId, cardId);
  };

  const handleMoveCard = (index: number, direction: 'up' | 'down') => {
    if (!activeSet) return;
    const newOrder = activeSet.cards.map((c) => c.id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newOrder.length) return;
    [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
    reorderCards(savedSetId!, newOrder);
  };

  const parseBulkText = (text: string): { term: string; definition: string }[] => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const tabIdx = line.indexOf('\t');
        if (tabIdx !== -1) {
          return { term: line.slice(0, tabIdx).trim(), definition: line.slice(tabIdx + 1).trim() };
        }
        const dashIdx = line.indexOf(' - ');
        if (dashIdx !== -1) {
          return { term: line.slice(0, dashIdx).trim(), definition: line.slice(dashIdx + 3).trim() };
        }
        const commaIdx = line.indexOf(',');
        if (commaIdx !== -1) {
          return { term: line.slice(0, commaIdx).trim(), definition: line.slice(commaIdx + 1).trim() };
        }
        return { term: line, definition: '' };
      })
      .filter((p) => p.term);
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    const pairs = parseBulkText(bulkText);
    if (!savedSetId) {
      const newSet = createSet(title.trim() || 'New Set', description.trim());
      setSavedSetId(newSet.id);
      setActiveSet(newSet.id);
      importCards(newSet.id, pairs);
    } else {
      importCards(savedSetId, pairs);
    }
    setBulkText('');
    setBulkMode(false);
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '10px 14px',
    color: C.text,
    fontSize: 14,
    width: '100%',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', gap: 20, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 20, fontWeight: 700 }}>
          {isCreate ? 'Create New Set' : 'Edit Set'}
        </h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setView('library')}
            style={{
              background: 'transparent',
              color: C.muted,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveSet}
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
            <SaveIcon /> Save
          </button>
        </div>
      </div>

      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        <div>
          <label style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Title *</label>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Spanish Vocabulary"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = C.cyan)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
        </div>
        <div>
          <label style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</label>
          <input
            value={description}
            onChange={(e) => handleDescChange(e.target.value)}
            placeholder="Optional description..."
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = C.cyan)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
        </div>
        <div>
          <label style={{ display: 'block', color: C.muted, fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tags (comma separated)</label>
          <input
            value={tagsInput}
            onChange={(e) => handleTagsChange(e.target.value)}
            placeholder="e.g. language, spanish, vocabulary"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = C.cyan)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: C.text, fontSize: 16, fontWeight: 600 }}>
          Cards {activeSet ? `(${activeSet.cards.length})` : ''}
        </h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setBulkMode((v) => !v)}
            style={{
              background: bulkMode ? C.purple : 'transparent',
              color: bulkMode ? '#fff' : C.purple,
              border: `1px solid ${C.purple}`,
              borderRadius: 8,
              padding: '7px 14px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Bulk Paste
          </button>
          <button
            onClick={handleAddCard}
            style={{
              background: C.cyan,
              color: '#0a1628',
              border: 'none',
              borderRadius: 8,
              padding: '7px 14px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <PlusIcon /> Add Card
          </button>
        </div>
      </div>

      {bulkMode && (
        <div style={{
          background: C.surface,
          border: `1px solid ${C.purple}`,
          borderRadius: 12,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>
            Paste pairs separated by tab, comma, or " - ". One pair per line.
            <br />Example: <code style={{ color: C.purple }}>photosynthesis\tthe process plants use to make food</code>
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="term[tab]definition&#10;term2[tab]definition2&#10;..."
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: '10px 14px',
              color: C.text,
              fontSize: 13,
              width: '100%',
              minHeight: 120,
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'monospace',
              boxSizing: 'border-box',
            }}
          />
          {bulkText.trim() && (
            <div style={{ color: C.muted, fontSize: 12 }}>
              Preview: {parseBulkText(bulkText).length} pairs detected
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleBulkImport}
              disabled={!bulkText.trim()}
              style={{
                background: C.purple,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                cursor: bulkText.trim() ? 'pointer' : 'default',
                fontWeight: 700,
                fontSize: 13,
                opacity: bulkText.trim() ? 1 : 0.5,
              }}
            >
              Import {bulkText.trim() ? parseBulkText(bulkText).length : 0} Cards
            </button>
            <button
              onClick={() => { setBulkMode(false); setBulkText(''); }}
              style={{
                background: 'transparent',
                color: C.muted,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {activeSet && activeSet.cards.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {activeSet.cards.map((card, index) => (
            <CardRow
              key={card.id}
              card={card}
              index={index}
              total={activeSet.cards.length}
              setId={savedSetId!}
              onDelete={() => handleDeleteCard(card.id)}
              onMoveUp={() => handleMoveCard(index, 'up')}
              onMoveDown={() => handleMoveCard(index, 'down')}
            />
          ))}
        </div>
      ) : !bulkMode && (
        <div style={{
          textAlign: 'center',
          color: C.muted,
          padding: '40px',
          border: `2px dashed ${C.border}`,
          borderRadius: 12,
          fontSize: 15,
        }}>
          No cards yet. Click "Add Card" or use "Bulk Paste" to get started.
        </div>
      )}

      <button
        onClick={handleAddCard}
        style={{
          background: 'transparent',
          color: C.cyan,
          border: `2px dashed ${C.border}`,
          borderRadius: 10,
          padding: '16px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.cyan)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
      >
        <PlusIcon /> Add another card
      </button>
    </div>
  );
}

// Need to expose parseBulkText for the bulk import button inside the component
function parseBulkText(text: string): { term: string; definition: string }[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const tabIdx = line.indexOf('\t');
      if (tabIdx !== -1) return { term: line.slice(0, tabIdx).trim(), definition: line.slice(tabIdx + 1).trim() };
      const dashIdx = line.indexOf(' - ');
      if (dashIdx !== -1) return { term: line.slice(0, dashIdx).trim(), definition: line.slice(dashIdx + 3).trim() };
      const commaIdx = line.indexOf(',');
      if (commaIdx !== -1) return { term: line.slice(0, commaIdx).trim(), definition: line.slice(commaIdx + 1).trim() };
      return { term: line, definition: '' };
    })
    .filter((p) => p.term);
}
