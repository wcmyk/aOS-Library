import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDriveStore } from '../../state/useDriveStore';

type OracleView = 'home' | 'editor';
type HomeTab = 'Recent' | 'Shared' | 'All';
type RibbonTab = 'Home' | 'Insert' | 'Layout' | 'References' | 'Review' | 'View';

// ── Micro SVG icons (no emoji) ────────────────────────────────────────────────

const SvgIcon = ({ d, size = 14, stroke = false }: { d: string; size?: number; stroke?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={stroke ? 'none' : 'currentColor'}
    stroke={stroke ? 'currentColor' : undefined} strokeWidth={stroke ? '1.6' : undefined}
    strokeLinecap={stroke ? 'round' : undefined} strokeLinejoin={stroke ? 'round' : undefined}>
    <path d={d} />
  </svg>
);

const ICONS = {
  bold:         'M3 2h5.5a3.5 3.5 0 0 1 0 7H3V2zm0 7h6a3.5 3.5 0 0 1 0 7H3V9z',
  italic:       'M6 2h6l-1 2H9.5L6.5 14H8l-1 2H1l1-2h1.5L5.5 4H4z',
  underline:    'M3 1h2v7a3 3 0 0 0 6 0V1h2v7a5 5 0 0 1-10 0V1zm-1 13h12v2H2z',
  strikethrough:'M0 8h16v1.5H0zm3 3h2.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5H13c0 2.5-2 4-5 4s-5-1.5-5-4zm2-7c0-1.4 1.1-2.5 2.5-2.5S10 2.6 10 4H7.5C7.5 3.2 7 2.5 6 2.5 4.9 2.5 4.5 3.2 4.5 4H5z',
  alignLeft:    'M2 4h12v1.5H2zm0 4h8v1.5H2zm0 4h10v1.5H2z',
  alignCenter:  'M2 4h12v1.5H2zm3 4h6v1.5H5zm-1 4h8v1.5H4z',
  alignRight:   'M2 4h12v1.5H2zm5 4h7v1.5H7zm-1 4h9v1.5H6z',
  alignJustify: 'M2 4h12v1.5H2zm0 4h12v1.5H2zm0 4h12v1.5H2z',
  bulletList:   'M3 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm0 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm0 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM5 3.5h9V5.5H5zm0 4h9v2H5zm0 4h9v2H5z',
  numberedList: 'M2.5 1v3H1V2H0V1zM0 8.5A1.5 1.5 0 0 1 3 8.5h0A1.5 1.5 0 0 1 1.5 10h0l1.5 2H0v-1h2l-1.5-2A1.5 1.5 0 0 1 0 8.5zm0 7H3v-1H0zm5-12h9V5.5H5zm0 4h9v2H5zm0 4h9v2H5z',
  indent:       'M1 2h14v2H1zm4 4h10v2H5zm0 4h10v2H5zM1 13l4-3.5v7z',
  outdent:      'M1 2h14v2H1zm4 4h10v2H5zm0 4h10v2H5zM5 8.5L1 12l4 3.5z',
  link:         'M4 9.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-1.5-4A3.5 3.5 0 0 1 6 2h1v2H6a1.5 1.5 0 0 0 0 3h1v2H6a3.5 3.5 0 0 1-3.5-3.5zm9 0A3.5 3.5 0 0 0 8 2H7v2h1a1.5 1.5 0 0 1 0 3H7v2h1a3.5 3.5 0 0 0 3.5-3.5z',
  image:        'M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3zm5.5 4a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0zM1 12l3-4 2 2.5 3-4L13 12H1z',
  table:        'M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm7 0v4H1V2h6zm0 5H1v4h6V7zm1 4h6V7H8v4zm6 1H8v4h6v-4zm-7 4v-4H1v4h6z',
  undo:         'M5.5 5.5L4 7A6 6 0 1 1 3 9.8L4.5 8.3A4.5 4.5 0 1 0 5.5 5.5zM4 1v6H1L4 1z',
  redo:         'M10.5 5.5L12 7A6 6 0 1 0 13 9.8L11.5 8.3A4.5 4.5 0 1 1 10.5 5.5zM12 1v6h3L12 1z',
  heading:      'M2 2h2v5h6V2h2v12h-2V9H4v5H2z',
  close:        'M3.5 3.5l9 9M12.5 3.5l-9 9',
  search:       'M11 11l3 3M7 12A5 5 0 1 1 7 2a5 5 0 0 1 0 10z',
  newDoc:       'M3 1h7l4 4v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zm7 0v4h4M7 7v6M4 10h6',
  spreadsheet:  'M1 3h14v10H1zm4 0v10M9 3v10M1 7h14',
  clock:        'M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1zm0 3v4l3 2',
  people:       'M6 7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 2c-3.3 0-5 1.8-5 3v1h10v-1c0-1.2-1.7-3-5-3zm7-9a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm2 8h-4c.7.6 1 1.5 1 2.5v.5h3v-.5c0-1-.3-1.9-1-2.5z',
  folder:       'M1 3h5l2 2h7a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z',
  download:     'M8 1v10M4 7l4 4 4-4M2 14h12',
  check:        'M2 8l4 4 8-8',
  footnote:     'M3 2h10v8H3zm4 8v5M5 13h6',
  cite:         'M4 1v14M12 1v14M4 8h8',
  pageBreak:    'M1 8h6m2 0h6M8 1v14',
  toc:          'M2 3h3v2H2zm5 0h7v2H7zM2 7h3v2H2zm5 0h5v2H7zM2 11h3v2H2zm5 0h7v2H7z',
  wordCount:    'M2 3h12v2H2zm0 4h8v2H2zm0 4h10v2H2z',
  pin:          'M9 1l5 5-7 3-4 5-1-1 5-4L4 4z',
  export:       'M11 3l3 3-3 3M2 8h12M8 1v6',
};

function ToolbarBtn({
  title, active, onClick, children, disabled,
}: { title: string; active?: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      className={`ora-tb-btn${active ? ' active' : ''}`}
      onMouseDown={(e) => { e.preventDefault(); if (!disabled) onClick(); }}
    >
      {children}
    </button>
  );
}

function Divider() { return <div className="ora-tb-divider" />; }

// ── Accel Import Modal ────────────────────────────────────────────────────────

function AccelImportModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (html: string) => void;
}) {
  const { documents } = useDriveStore();
  const sheets = documents.filter((d) => d.type === 'spreadsheet');
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);

  const parseTsv = (content: string): string[][] => {
    const rows = content.split('\n').filter((r) => r.trim()).map((r) => r.split('\t'));
    return rows.slice(0, 20);
  };

  const selectSheet = (id: string) => {
    setSelected(id);
    const doc = sheets.find((s) => s.id === id);
    if (doc) setPreview(parseTsv(doc.content));
  };

  const buildTable = () => {
    if (!selected || preview.length === 0) return;
    const rows = preview;
    let html = '<table style="border-collapse:collapse;width:100%;margin:12px 0;font-size:13px">';
    rows.forEach((row, ri) => {
      html += '<tr>';
      row.forEach((cell) => {
        const tag = ri === 0 ? 'th' : 'td';
        const style = ri === 0
          ? 'border:1px solid #c7c7c7;padding:6px 10px;background:#f2f2f2;font-weight:600;text-align:left'
          : 'border:1px solid #c7c7c7;padding:6px 10px';
        html += `<${tag} style="${style}">${cell || '&nbsp;'}</${tag}>`;
      });
      html += '</tr>';
    });
    html += '</table>';
    onImport(html);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 6, width: 640, maxHeight: 520,
        display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a2e' }}>Import from Accel</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Select a spreadsheet to insert as a table</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 4 }}>
            <SvgIcon d={ICONS.close} size={16} stroke />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', flex: 1, overflow: 'hidden' }}>
          {/* Sheet list */}
          <div style={{ borderRight: '1px solid #e0e0e0', overflowY: 'auto', padding: '8px 0' }}>
            {sheets.length === 0 && (
              <div style={{ padding: '20px 16px', fontSize: 12, color: '#888', textAlign: 'center' }}>
                No spreadsheets found.<br />Create one in Accel first.
              </div>
            )}
            {sheets.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => selectSheet(s.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '9px 16px',
                  background: selected === s.id ? '#e8f0fe' : 'none',
                  border: 'none', borderLeft: selected === s.id ? '3px solid #2b579a' : '3px solid transparent',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a2e' }}>{s.title}</span>
                <span style={{ fontSize: 11, color: '#888' }}>{s.owner} · {new Date(s.updatedAt).toLocaleDateString()}</span>
              </button>
            ))}
          </div>

          {/* Preview pane */}
          <div style={{ overflowY: 'auto', padding: 16 }}>
            {preview.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa', fontSize: 13 }}>
                Select a spreadsheet to preview
              </div>
            ) : (
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                {preview.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => {
                      const Tag = ri === 0 ? 'th' : 'td';
                      return (
                        <Tag key={ci} style={{
                          border: '1px solid #ddd', padding: '4px 8px',
                          background: ri === 0 ? '#f5f5f5' : 'white',
                          fontWeight: ri === 0 ? 600 : 400, textAlign: 'left',
                          maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{cell || '\u00a0'}</Tag>
                      );
                    })}
                  </tr>
                ))}
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: 8, background: '#fafafa' }}>
          <button type="button" onClick={onClose}
            style={{ padding: '6px 16px', background: 'none', border: '1px solid #ccc', borderRadius: 3, fontSize: 13, cursor: 'pointer', color: '#333' }}>
            Cancel
          </button>
          <button type="button" onClick={buildTable} disabled={!selected || preview.length === 0}
            style={{ padding: '6px 16px', background: selected ? '#2b579a' : '#c0c0c0', border: 'none', borderRadius: 3, fontSize: 13, cursor: selected ? 'pointer' : 'default', color: '#fff', fontWeight: 500 }}>
            Insert Table
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Table Size Picker ─────────────────────────────────────────────────────────

function TablePicker({ onSelect }: { onSelect: (rows: number, cols: number) => void }) {
  const [hover, setHover] = useState<[number, number]>([0, 0]);
  const MAX = 8;
  return (
    <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #d0d0d0', borderRadius: 4, padding: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100 }}>
      <div style={{ fontSize: 11, color: '#666', marginBottom: 6, textAlign: 'center' }}>{hover[0]} × {hover[1]}</div>
      {Array.from({ length: MAX }, (_, r) => (
        <div key={r} style={{ display: 'flex' }}>
          {Array.from({ length: MAX }, (_, c) => (
            <div
              key={c}
              onMouseEnter={() => setHover([r + 1, c + 1])}
              onClick={() => onSelect(r + 1, c + 1)}
              style={{
                width: 14, height: 14, margin: 1,
                background: r < hover[0] && c < hover[1] ? '#2b579a33' : '#f0f0f0',
                border: r < hover[0] && c < hover[1] ? '1px solid #2b579a88' : '1px solid #ccc',
                cursor: 'pointer', borderRadius: 1,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Editor View ───────────────────────────────────────────────────────────────

function OracleEditor({ docId, onBack }: { docId: string; onBack: () => void }) {
  const { documents, updateDocument } = useDriveStore();
  const doc = documents.find((d) => d.id === docId) ?? null;
  const editorRef = useRef<HTMLDivElement>(null);
  const [ribbonTab, setRibbonTab] = useState<RibbonTab>('Home');
  const [fontFamily, setFontFamily] = useState('Georgia');
  const [fontSize, setFontSize] = useState('12');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('#FFFF00');
  const [showColorPicker, setShowColorPicker] = useState<'text' | 'highlight' | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showAccelModal, setShowAccelModal] = useState(false);
  const [showFindBar, setShowFindBar] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [zoom, setZoom] = useState(100);
  const savedRangeRef = useRef<Range | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (editorRef.current && doc) {
      if (!editorRef.current.dataset.loaded) {
        editorRef.current.innerHTML = doc.content || '<p><br></p>';
        editorRef.current.dataset.loaded = 'true';
        updateWordCount();
      }
    }
  }, [doc?.id]);

  const updateWordCount = () => {
    const text = editorRef.current?.innerText ?? '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(text.length);
  };

  const saveContent = useCallback(() => {
    if (!doc || !editorRef.current) return;
    setIsSaving(true);
    updateDocument(doc.id, { content: editorRef.current.innerHTML });
    updateWordCount();
    setTimeout(() => { setIsSaving(false); setLastSaved(new Date()); }, 300);
  }, [doc]);

  const handleInput = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(saveContent, 400);
  }, [saveContent]);

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    saveContent();
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) { sel.removeAllRanges(); sel.addRange(savedRangeRef.current); }
  };

  const insertLink = () => {
    restoreSelection();
    if (linkUrl) {
      if (linkText) {
        const a = `<a href="${linkUrl}" target="_blank">${linkText}</a>`;
        exec('insertHTML', a);
      } else {
        exec('createLink', linkUrl);
      }
    }
    setShowLinkModal(false);
    setLinkUrl(''); setLinkText('');
  };

  const applyHeading = (tag: string) => {
    exec('formatBlock', `<${tag}>`);
  };

  const applyFontSize = (size: string) => {
    setFontSize(size);
    exec('fontSize', '7');
    editorRef.current?.querySelectorAll('font[size="7"]').forEach((el) => {
      const span = document.createElement('span');
      span.style.fontSize = `${size}pt`;
      span.innerHTML = (el as HTMLElement).innerHTML;
      el.replaceWith(span);
    });
  };

  const insertTable = (rows: number, cols: number) => {
    let html = '<table style="border-collapse:collapse;width:100%;margin:8px 0;font-size:12pt">';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        const tag = r === 0 ? 'th' : 'td';
        const style = r === 0
          ? 'border:1px solid #acacac;padding:6px 10px;background:#f2f2f2;font-weight:600;text-align:left;min-width:60px'
          : 'border:1px solid #acacac;padding:6px 10px;min-width:60px';
        html += `<${tag} style="${style}">&nbsp;</${tag}>`;
      }
      html += '</tr>';
    }
    html += '</table><p><br></p>';
    exec('insertHTML', html);
    setShowTablePicker(false);
  };

  const insertFootnote = () => {
    const num = (editorRef.current?.querySelectorAll('sup.fn').length ?? 0) + 1;
    const sup = `<sup class="fn" style="color:#2b579a;cursor:pointer;font-size:0.7em">[${num}]</sup>`;
    exec('insertHTML', sup);
  };

  const insertCitation = () => {
    const citation = `<span style="color:#666;font-size:0.9em">(Author, ${new Date().getFullYear()})</span>`;
    exec('insertHTML', citation);
  };

  const insertPageBreak = () => {
    exec('insertHTML', '<div style="page-break-after:always;border-top:1px dashed #ccc;margin:20px 0;height:0"></div><p><br></p>');
  };

  const insertTOC = () => {
    const el = editorRef.current;
    if (!el) return;
    const headings = Array.from(el.querySelectorAll('h1,h2,h3')).map((h, i) => {
      const id = `toc-h-${i}`;
      (h as HTMLElement).id = id;
      return { text: (h as HTMLElement).innerText, level: parseInt(h.tagName[1]), id };
    });
    if (headings.length === 0) { alert('Add headings first to generate a table of contents.'); return; }
    let html = '<div style="border:1px solid #ddd;padding:16px;margin:12px 0;border-radius:4px;background:#fafafa">';
    html += '<div style="font-weight:700;font-size:12pt;margin-bottom:10px;color:#1a1a2e">Table of Contents</div>';
    headings.forEach((h) => {
      const indent = (h.level - 1) * 20;
      html += `<div style="padding-left:${indent}px;margin:3px 0;font-size:${h.level === 1 ? 11 : 10}pt"><a href="#${h.id}" style="color:#2b579a;text-decoration:none">${h.text}</a></div>`;
    });
    html += '</div><p><br></p>';
    exec('insertHTML', html);
  };

  const handleFind = () => {
    if (!findQuery) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).find?.(findQuery, false, false, true);
  };

  const FONT_FAMILIES = ['Georgia', 'Times New Roman', 'Arial', 'Helvetica', 'Verdana', 'Calibri', 'Garamond', 'Courier New', 'Inter', 'Palatino'];
  const FONT_SIZES   = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '36', '48', '72'];
  const TEXT_COLORS  = ['#000000', '#1f2937', '#7f1d1d', '#7c2d12', '#713f12', '#14532d', '#1e3a5f', '#312e81', '#4a1d96', '#ffffff'];
  const HIGHLIGHT_COLORS = ['#FFF59D', '#B9F6CA', '#B3E5FC', '#F8BBD0', '#FFE0B2', '#E0E0E0', 'transparent'];

  if (!doc) return null;

  return (
    <div className="ora-editor-shell">
      {/* Title Bar */}
      <div className="ora-titlebar">
        <button type="button" className="ora-back-btn" onClick={onBack} title="Back to documents">
          <SvgIcon d="M11 2L5 8l6 6" size={16} stroke />
        </button>
        <div className="ora-titlebar-center">
          <input
            className="ora-doc-title"
            value={doc.title}
            onChange={(e) => updateDocument(doc.id, { title: e.target.value })}
            placeholder="Document title"
          />
          <div className="ora-save-status">
            {isSaving ? (
              <span style={{ color: '#888' }}>Saving...</span>
            ) : lastSaved ? (
              <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}>
                <SvgIcon d={ICONS.check} size={11} stroke /> Saved
              </span>
            ) : null}
          </div>
        </div>
        <div className="ora-titlebar-actions">
          <button type="button" className="ora-tb-btn" title="Find (Ctrl+F)" onClick={() => setShowFindBar(v => !v)}>
            <SvgIcon d={ICONS.search} size={14} stroke />
          </button>
          <button type="button" className="ora-share-btn" onClick={saveContent}>Save</button>
          <button type="button" className="ora-export-btn" title="Export">
            <SvgIcon d={ICONS.export} size={14} stroke />
          </button>
        </div>
      </div>

      {/* Find Bar */}
      {showFindBar && (
        <div style={{ background: '#f5f6fa', borderBottom: '1px solid #d0d4e4', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>Find:</span>
          <input
            autoFocus
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleFind(); if (e.key === 'Escape') setShowFindBar(false); }}
            placeholder="Search in document..."
            style={{ flex: 1, fontSize: 12, border: '1px solid #d0d4e4', borderRadius: 3, padding: '4px 8px', outline: 'none' }}
          />
          <button type="button" onClick={handleFind} style={{ padding: '4px 12px', background: '#2b579a', border: 'none', borderRadius: 3, color: '#fff', fontSize: 12, cursor: 'pointer' }}>Find</button>
          <button type="button" onClick={() => setShowFindBar(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
            <SvgIcon d={ICONS.close} size={14} stroke />
          </button>
        </div>
      )}

      {/* Ribbon Tabs */}
      <div className="ora-ribbon-tabs">
        {(['Home', 'Insert', 'Layout', 'References', 'Review', 'View'] as RibbonTab[]).map((t) => (
          <button key={t} type="button" className={`ora-ribbon-tab${ribbonTab === t ? ' active' : ''}`} onClick={() => setRibbonTab(t)}>{t}</button>
        ))}
      </div>

      {/* Ribbon Toolbar */}
      <div className="ora-ribbon">
        {ribbonTab === 'Home' && (
          <>
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Clipboard</div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Undo (Ctrl+Z)" onClick={() => exec('undo')}><SvgIcon d={ICONS.undo} /></ToolbarBtn>
                <ToolbarBtn title="Redo (Ctrl+Y)" onClick={() => exec('redo')}><SvgIcon d={ICONS.redo} /></ToolbarBtn>
              </div>
            </div>
            <Divider />
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Font</div>
              <div className="ora-tb-row">
                <select className="ora-tb-select" value={fontFamily} onChange={(e) => { setFontFamily(e.target.value); exec('fontName', e.target.value); }} style={{ width: 120 }}>
                  {FONT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <select className="ora-tb-select" value={fontSize} onChange={(e) => applyFontSize(e.target.value)} style={{ width: 46 }}>
                  {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Bold (Ctrl+B)" onClick={() => exec('bold')}><strong style={{ fontSize: 13 }}>B</strong></ToolbarBtn>
                <ToolbarBtn title="Italic (Ctrl+I)" onClick={() => exec('italic')}><em style={{ fontSize: 13 }}>I</em></ToolbarBtn>
                <ToolbarBtn title="Underline (Ctrl+U)" onClick={() => exec('underline')}><u style={{ fontSize: 13 }}>U</u></ToolbarBtn>
                <ToolbarBtn title="Strikethrough" onClick={() => exec('strikeThrough')}><s style={{ fontSize: 11 }}>S</s></ToolbarBtn>
                <ToolbarBtn title="Subscript" onClick={() => exec('subscript')}><span style={{ fontSize: 11 }}>x<sub>2</sub></span></ToolbarBtn>
                <ToolbarBtn title="Superscript" onClick={() => exec('superscript')}><span style={{ fontSize: 11 }}>x<sup>2</sup></span></ToolbarBtn>
              </div>
              <div className="ora-tb-row" style={{ position: 'relative' }}>
                {/* Text Color */}
                <div style={{ position: 'relative' }}>
                  <button type="button" className="ora-tb-btn ora-color-btn" title="Font Color"
                    onMouseDown={(e) => { e.preventDefault(); saveSelection(); setShowColorPicker(v => v === 'text' ? null : 'text'); }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: textColor === '#ffffff' ? '#e8ebf4' : textColor }}>A</span>
                    <span className="ora-color-swatch" style={{ background: textColor }} />
                  </button>
                  {showColorPicker === 'text' && (
                    <div className="ora-color-palette">
                      {TEXT_COLORS.map((c) => (
                        <button key={c} type="button" className="ora-color-dot" style={{ background: c, border: c === '#ffffff' ? '1px solid #aaa' : '1px solid transparent' }}
                          onMouseDown={(e) => { e.preventDefault(); restoreSelection(); setTextColor(c); exec('foreColor', c); setShowColorPicker(null); }} />
                      ))}
                    </div>
                  )}
                </div>
                {/* Highlight */}
                <div style={{ position: 'relative' }}>
                  <button type="button" className="ora-tb-btn ora-color-btn" title="Text Highlight Color"
                    onMouseDown={(e) => { e.preventDefault(); saveSelection(); setShowColorPicker(v => v === 'highlight' ? null : 'highlight'); }}>
                    <span style={{ fontWeight: 700, fontSize: 11 }}>ab</span>
                    <span className="ora-color-swatch" style={{ background: highlightColor === 'transparent' ? 'repeating-linear-gradient(45deg,#ccc,#ccc 2px,white 2px,white 6px)' : highlightColor }} />
                  </button>
                  {showColorPicker === 'highlight' && (
                    <div className="ora-color-palette">
                      {HIGHLIGHT_COLORS.map((c) => (
                        <button key={c} type="button" className="ora-color-dot" title={c === 'transparent' ? 'No highlight' : c}
                          style={{ background: c === 'transparent' ? 'repeating-linear-gradient(45deg,#ccc,#ccc 2px,white 2px,white 6px)' : c, border: '1px solid rgba(0,0,0,0.15)' }}
                          onMouseDown={(e) => { e.preventDefault(); restoreSelection(); setHighlightColor(c); exec('hiliteColor', c === 'transparent' ? 'transparent' : c); setShowColorPicker(null); }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Divider />
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Styles</div>
              <div className="ora-tb-row">
                {[['Normal', 'p'], ['H1', 'h1'], ['H2', 'h2'], ['H3', 'h3']].map(([label, tag]) => (
                  <ToolbarBtn key={label} title={`Apply ${label}`} onClick={() => applyHeading(tag)}>
                    <span style={{ fontSize: label === 'H1' ? 12 : label === 'H2' ? 11 : 10 }}>{label}</span>
                  </ToolbarBtn>
                ))}
              </div>
            </div>
            <Divider />
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Paragraph</div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Align Left (Ctrl+L)" onClick={() => exec('justifyLeft')}><SvgIcon d={ICONS.alignLeft} /></ToolbarBtn>
                <ToolbarBtn title="Center (Ctrl+E)" onClick={() => exec('justifyCenter')}><SvgIcon d={ICONS.alignCenter} /></ToolbarBtn>
                <ToolbarBtn title="Align Right (Ctrl+R)" onClick={() => exec('justifyRight')}><SvgIcon d={ICONS.alignRight} /></ToolbarBtn>
                <ToolbarBtn title="Justify (Ctrl+J)" onClick={() => exec('justifyFull')}><SvgIcon d={ICONS.alignJustify} /></ToolbarBtn>
              </div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Bullet List" onClick={() => exec('insertUnorderedList')}><SvgIcon d={ICONS.bulletList} /></ToolbarBtn>
                <ToolbarBtn title="Numbered List" onClick={() => exec('insertOrderedList')}><SvgIcon d={ICONS.numberedList} /></ToolbarBtn>
                <ToolbarBtn title="Decrease Indent" onClick={() => exec('outdent')}><SvgIcon d={ICONS.outdent} /></ToolbarBtn>
                <ToolbarBtn title="Increase Indent" onClick={() => exec('indent')}><SvgIcon d={ICONS.indent} /></ToolbarBtn>
              </div>
            </div>
          </>
        )}

        {ribbonTab === 'Insert' && (
          <>
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Table</div>
              <div className="ora-tb-row" style={{ position: 'relative' }}>
                <ToolbarBtn title="Insert Table" onClick={() => setShowTablePicker(v => !v)}>
                  <SvgIcon d={ICONS.table} /> Table
                </ToolbarBtn>
                {showTablePicker && <TablePicker onSelect={insertTable} />}
              </div>
            </div>
            <Divider />
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Data</div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Import dataset from Accel spreadsheet" onClick={() => setShowAccelModal(true)}>
                  <SvgIcon d={ICONS.spreadsheet} stroke /> Import from Accel
                </ToolbarBtn>
              </div>
            </div>
            <Divider />
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Links & Media</div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Insert Hyperlink (Ctrl+K)" onClick={() => { saveSelection(); setShowLinkModal(true); }}>
                  <SvgIcon d={ICONS.link} /> Link
                </ToolbarBtn>
                <ToolbarBtn title="Insert Image from URL" onClick={() => {
                  const url = prompt('Image URL:');
                  if (url) exec('insertImage', url);
                }}>
                  <SvgIcon d={ICONS.image} /> Image
                </ToolbarBtn>
              </div>
            </div>
            <Divider />
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Elements</div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Insert Horizontal Rule" onClick={() => exec('insertHorizontalRule')}>
                  <span style={{ fontSize: 11 }}>&#8213; Rule</span>
                </ToolbarBtn>
                <ToolbarBtn title="Insert Page Break" onClick={insertPageBreak}>
                  <SvgIcon d={ICONS.pageBreak} stroke /> Break
                </ToolbarBtn>
              </div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Insert code block" onClick={() => exec('insertHTML', '<pre style="background:#f4f4f4;border:1px solid #ddd;padding:10px 14px;border-radius:4px;font-family:Consolas,monospace;font-size:12px;overflow:auto;margin:8px 0;color:#1a1a2e">// code</pre><p><br></p>')}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11 }}>&lt;/&gt; Code</span>
                </ToolbarBtn>
                <ToolbarBtn title="Insert blockquote" onClick={() => exec('insertHTML', '<blockquote style="border-left:4px solid #2b579a;margin:12px 0;padding:8px 16px;color:#555;font-style:italic;background:#f8f9fc">Quote text</blockquote><p><br></p>')}>
                  <span style={{ fontSize: 11 }}>" Quote</span>
                </ToolbarBtn>
              </div>
            </div>
          </>
        )}

        {ribbonTab === 'Layout' && (
          <>
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Page Setup</div>
              <div className="ora-tb-row">
                {(['Letter', 'A4', 'Legal'] as const).map((sz) => (
                  <ToolbarBtn key={sz} title={`${sz} page size`} onClick={() => {}}>
                    <span style={{ fontSize: 11 }}>{sz}</span>
                  </ToolbarBtn>
                ))}
              </div>
            </div>
            <Divider />
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Line Spacing</div>
              <div className="ora-tb-row">
                {['1.0', '1.5', '2.0', '2.5'].map((v) => (
                  <ToolbarBtn key={v} title={`Line spacing ${v}`} onClick={() => {
                    exec('insertHTML', `<div style="line-height:${v}">`);
                  }}>
                    <span style={{ fontSize: 11 }}>{v}x</span>
                  </ToolbarBtn>
                ))}
              </div>
            </div>
            <Divider />
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Format</div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Clear formatting" onClick={() => exec('removeFormat')}>
                  <span style={{ fontSize: 11 }}>Clear Format</span>
                </ToolbarBtn>
              </div>
            </div>
          </>
        )}

        {ribbonTab === 'References' && (
          <>
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Table of Contents</div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Insert Table of Contents" onClick={insertTOC}>
                  <SvgIcon d={ICONS.toc} /> Insert TOC
                </ToolbarBtn>
              </div>
            </div>
            <Divider />
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Footnotes</div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Insert footnote marker" onClick={insertFootnote}>
                  <SvgIcon d={ICONS.footnote} stroke /> Footnote
                </ToolbarBtn>
              </div>
            </div>
            <Divider />
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Citations</div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Insert in-text citation (Author, Year)" onClick={insertCitation}>
                  <SvgIcon d={ICONS.cite} stroke /> Cite
                </ToolbarBtn>
              </div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Insert APA reference list block" onClick={() => exec('insertHTML', '<div style="margin-top:24px;border-top:2px solid #1a1a2e;padding-top:12px"><div style="font-weight:700;font-size:14pt;text-align:center;margin-bottom:12px">References</div><p style="padding-left:2em;text-indent:-2em;margin:6px 0">Author, A. A. (Year). <em>Title of work.</em> Publisher. https://doi.org/xxxxx</p></div><p><br></p>')}>
                  <span style={{ fontSize: 11 }}>APA</span>
                </ToolbarBtn>
                <ToolbarBtn title="Insert MLA reference list block" onClick={() => exec('insertHTML', '<div style="margin-top:24px;border-top:2px solid #1a1a2e;padding-top:12px"><div style="font-weight:700;font-size:14pt;text-align:center;margin-bottom:12px">Works Cited</div><p style="padding-left:2em;text-indent:-2em;margin:6px 0">Author, First Name. <em>Title of Work.</em> Publisher, Year.</p></div><p><br></p>')}>
                  <span style={{ fontSize: 11 }}>MLA</span>
                </ToolbarBtn>
              </div>
            </div>
          </>
        )}

        {ribbonTab === 'Review' && (
          <>
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Proofing</div>
              <div className="ora-tb-row">
                <span className="ora-tb-info">{wordCount.toLocaleString()} words</span>
                <span className="ora-tb-info">{charCount.toLocaleString()} chars</span>
              </div>
              <div className="ora-tb-row">
                <span className="ora-tb-info">~{Math.ceil(wordCount / 250)} min read</span>
                <span className="ora-tb-info">~{Math.ceil(wordCount / 300)} pages</span>
              </div>
            </div>
            <Divider />
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Comments</div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Add comment" onClick={() => exec('insertHTML', '<mark style="background:#fff9c4;border-bottom:2px solid #f59e0b;padding:1px 2px" title="Comment">[Comment]</mark>')}>
                  <span style={{ fontSize: 11 }}>+ Comment</span>
                </ToolbarBtn>
              </div>
            </div>
          </>
        )}

        {ribbonTab === 'View' && (
          <>
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Zoom</div>
              <div className="ora-tb-row">
                {[75, 100, 125, 150].map((z) => (
                  <ToolbarBtn key={z} title={`Zoom ${z}%`} active={zoom === z} onClick={() => setZoom(z)}>
                    <span style={{ fontSize: 11 }}>{z}%</span>
                  </ToolbarBtn>
                ))}
              </div>
            </div>
            <Divider />
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Show</div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Outline panel (shows headings)" onClick={() => {}}>
                  <SvgIcon d={ICONS.toc} /> Outline
                </ToolbarBtn>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="ora-modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="ora-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ora-modal-title">Insert Hyperlink</div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#555' }}>Display text (optional)</span>
              <input className="ora-modal-input" placeholder="Link text" value={linkText} onChange={(e) => setLinkText(e.target.value)} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#555' }}>URL</span>
              <input className="ora-modal-input" placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && insertLink()} autoFocus />
            </label>
            <div className="ora-modal-actions">
              <button type="button" className="ora-modal-cancel" onClick={() => setShowLinkModal(false)}>Cancel</button>
              <button type="button" className="ora-modal-ok" onClick={insertLink}>Insert</button>
            </div>
          </div>
        </div>
      )}

      {/* Accel Import Modal */}
      {showAccelModal && (
        <AccelImportModal
          onClose={() => setShowAccelModal(false)}
          onImport={(html) => { exec('insertHTML', html); }}
        />
      )}

      {/* Editor Surface */}
      <div className="ora-editor-surface" onClick={() => setShowColorPicker(null)}>
        <div className="ora-page" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
          <div
            ref={editorRef}
            className="ora-content-editable"
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onBlur={saveContent}
            style={{ fontFamily, fontSize: `${fontSize}pt` }}
          />
        </div>
        <DocumentOutline editorRef={editorRef} />
      </div>

      {/* Status Bar */}
      <div className="ora-statusbar">
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>{wordCount.toLocaleString()} words</span>
          <span style={{ color: '#c0c4d6' }}>|</span>
          <span>{charCount.toLocaleString()} characters</span>
          <span style={{ color: '#c0c4d6' }}>|</span>
          <span>~{Math.ceil(wordCount / 250)} min read</span>
        </span>
        <span>
          {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Sanctum'}
          <span style={{ marginLeft: 12, color: '#c0c4d6' }}>|</span>
          <span style={{ marginLeft: 12 }}>{fontFamily} {fontSize}pt</span>
        </span>
      </div>
    </div>
  );
}

// ── Document Outline ──────────────────────────────────────────────────────────

function DocumentOutline({ editorRef }: { editorRef: React.RefObject<HTMLDivElement | null> }) {
  const [headings, setHeadings] = useState<{ text: string; level: number; id: string }[]>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const el = editorRef.current;
        if (!el) return;
        const hs = Array.from(el.querySelectorAll('h1,h2,h3,h4')).map((h, i) => {
          const id = `ora-h-${i}`;
          (h as HTMLElement).id = id;
          return { text: (h as HTMLElement).innerText, level: parseInt(h.tagName[1]), id };
        });
        setHeadings(hs);
      }, 250);
    });
    if (editorRef.current) observer.observe(editorRef.current, { childList: true, subtree: true, characterData: true });
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [editorRef]);

  if (headings.length === 0) return null;

  return (
    <div className="ora-outline">
      <div className="ora-outline-title">Outline</div>
      {headings.map((h) => (
        <button key={h.id} type="button" className="ora-outline-item"
          style={{ paddingLeft: (h.level - 1) * 10 + 8 }}
          onClick={() => document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' })}>
          {h.text || '(untitled)'}
        </button>
      ))}
    </div>
  );
}

// ── Template Icons (SVG, no emoji) ────────────────────────────────────────────

function BlankIcon() {
  return (
    <svg width="36" height="44" viewBox="0 0 36 44" fill="none">
      <rect x="1" y="1" width="34" height="42" rx="2" fill="white" stroke="#d0d4e4" strokeWidth="1.5" />
      <path d="M23 1v9h9" stroke="#d0d4e4" strokeWidth="1.5" fill="none" />
      <rect x="5" y="14" width="20" height="2" rx="1" fill="#d0d4e4" />
      <rect x="5" y="19" width="26" height="1.5" rx="0.75" fill="#e8eaf0" />
      <rect x="5" y="23" width="24" height="1.5" rx="0.75" fill="#e8eaf0" />
      <rect x="5" y="27" width="22" height="1.5" rx="0.75" fill="#e8eaf0" />
    </svg>
  );
}
function ResearchIcon() {
  return (
    <svg width="36" height="44" viewBox="0 0 36 44" fill="none">
      <rect x="1" y="1" width="34" height="42" rx="2" fill="#f8f9ff" stroke="#c7d2fe" strokeWidth="1.5" />
      <path d="M23 1v9h9" stroke="#c7d2fe" strokeWidth="1.5" fill="none" />
      <rect x="10" y="14" width="16" height="2" rx="1" fill="#6366f1" />
      <rect x="5" y="19" width="26" height="1.5" rx="0.75" fill="#c7d2fe" />
      <rect x="5" y="23" width="24" height="1.5" rx="0.75" fill="#c7d2fe" />
      <rect x="5" y="28" width="10" height="1.5" rx="0.75" fill="#c7d2fe" />
      <rect x="5" y="33" width="26" height="1.5" rx="0.75" fill="#c7d2fe" />
      <rect x="5" y="37" width="20" height="1.5" rx="0.75" fill="#c7d2fe" />
    </svg>
  );
}
function MeetingIcon() {
  return (
    <svg width="36" height="44" viewBox="0 0 36 44" fill="none">
      <rect x="1" y="1" width="34" height="42" rx="2" fill="#f0fdf4" stroke="#86efac" strokeWidth="1.5" />
      <path d="M23 1v9h9" stroke="#86efac" strokeWidth="1.5" fill="none" />
      <rect x="5" y="14" width="20" height="2" rx="1" fill="#16a34a" />
      <rect x="5" y="19" width="2" height="2" rx="1" fill="#16a34a" />
      <rect x="9" y="19" width="18" height="2" rx="1" fill="#bbf7d0" />
      <rect x="5" y="24" width="2" height="2" rx="1" fill="#16a34a" />
      <rect x="9" y="24" width="22" height="2" rx="1" fill="#bbf7d0" />
      <rect x="5" y="29" width="2" height="2" rx="1" fill="#16a34a" />
      <rect x="9" y="29" width="16" height="2" rx="1" fill="#bbf7d0" />
      <rect x="5" y="36" width="22" height="1.5" rx="0.75" fill="#bbf7d0" />
    </svg>
  );
}
function ProjectIcon() {
  return (
    <svg width="36" height="44" viewBox="0 0 36 44" fill="none">
      <rect x="1" y="1" width="34" height="42" rx="2" fill="#fff7ed" stroke="#fdba74" strokeWidth="1.5" />
      <path d="M23 1v9h9" stroke="#fdba74" strokeWidth="1.5" fill="none" />
      <rect x="5" y="14" width="18" height="2" rx="1" fill="#ea580c" />
      <rect x="5" y="20" width="26" height="8" rx="1" fill="#fed7aa" stroke="#fdba74" strokeWidth="0.8" />
      <rect x="7" y="22" width="12" height="1.5" rx="0.75" fill="#ea580c" opacity="0.6" />
      <rect x="5" y="31" width="10" height="1.5" rx="0.75" fill="#fdba74" />
      <rect x="17" y="31" width="10" height="1.5" rx="0.75" fill="#fdba74" />
      <rect x="5" y="35" width="24" height="1.5" rx="0.75" fill="#fdba74" />
    </svg>
  );
}
function LabIcon() {
  return (
    <svg width="36" height="44" viewBox="0 0 36 44" fill="none">
      <rect x="1" y="1" width="34" height="42" rx="2" fill="#faf5ff" stroke="#d8b4fe" strokeWidth="1.5" />
      <path d="M23 1v9h9" stroke="#d8b4fe" strokeWidth="1.5" fill="none" />
      <rect x="5" y="14" width="22" height="2" rx="1" fill="#7c3aed" />
      <rect x="5" y="19" width="26" height="8" rx="1" fill="#ede9fe" />
      <rect x="7" y="21" width="14" height="1.5" rx="0.75" fill="#7c3aed" opacity="0.5" />
      <rect x="7" y="24" width="10" height="1.5" rx="0.75" fill="#7c3aed" opacity="0.5" />
      <rect x="5" y="30" width="12" height="4" rx="1" fill="#ede9fe" />
      <rect x="19" y="30" width="12" height="4" rx="1" fill="#ede9fe" />
      <rect x="5" y="37" width="26" height="1.5" rx="0.75" fill="#d8b4fe" />
    </svg>
  );
}

// ── Home View ─────────────────────────────────────────────────────────────────

export function OracleApp() {
  const { documents, activeDocumentId, setActiveDocument, createDocument } = useDriveStore();
  const wordDocs = documents.filter((d) => d.type === 'document');
  const [view, setView] = useState<OracleView>('home');
  const [tab, setTab] = useState<HomeTab>('Recent');
  const [activeId, setActiveId] = useState<string | null>(activeDocumentId ?? wordDocs[0]?.id ?? null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (activeDocumentId) {
      const exists = wordDocs.some((d) => d.id === activeDocumentId);
      if (exists) { setActiveId(activeDocumentId); setView('editor'); }
    }
  }, [activeDocumentId]);

  const homeDocuments = useMemo(() => {
    let list = tab === 'Shared' ? wordDocs.filter((d) => d.sharedWith.length > 0 || d.owner !== 'You')
      : tab === 'Recent' ? wordDocs.slice(0, 12)
      : wordDocs;
    if (search.trim()) list = list.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [wordDocs, tab, search]);

  const openDocument = (id: string) => { setActiveDocument(id); setActiveId(id); setView('editor'); };
  const createFromTemplate = (content: string, title: string) => {
    const id = createDocument(title);
    // Content will be set on first load via the editor
    setActiveId(id);
    setView('editor');
  };

  const TEMPLATES = [
    { label: 'Blank Document', desc: 'Start from scratch', Icon: BlankIcon, color: '#2b579a', content: '' },
    { label: 'Research Paper', desc: 'APA / MLA format with abstract and references', Icon: ResearchIcon, color: '#6366f1', content: '' },
    { label: 'Meeting Notes', desc: 'Agenda, attendees, and action items', Icon: MeetingIcon, color: '#16a34a', content: '' },
    { label: 'Project Brief', desc: 'Goals, scope, timeline, and stakeholders', Icon: ProjectIcon, color: '#ea580c', content: '' },
    { label: 'Lab Report', desc: 'Hypothesis, methods, results, and discussion', Icon: LabIcon, color: '#7c3aed', content: '' },
  ];

  if (view === 'editor' && activeId) {
    return <OracleEditor docId={activeId} onBack={() => { setView('home'); setActiveDocument(null); }} />;
  }

  return (
    <div className="oracle-shell">
      {/* Sidebar */}
      <aside className="oracle-sidebar">
        <div className="ora-brand">
          <img src="/assets/apps/Oracle.png" alt="Oracle" width={20} height={20} style={{ borderRadius: 3 }} />
          <span className="ora-brand-name">Oracle</span>
        </div>

        <button type="button" className="oracle-primary" onClick={() => createFromTemplate('', 'Untitled Document')}>
          New Document
        </button>

        <div className="ora-nav-section" style={{ marginTop: 16 }}>
          {([
            ['Recent', ICONS.clock],
            ['Shared', ICONS.people],
            ['All', ICONS.folder],
          ] as [HomeTab, string][]).map(([t, icon]) => (
            <button key={t} type="button" className={`oracle-link${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              <SvgIcon d={icon} size={13} />
              <span>{t}</span>
            </button>
          ))}
        </div>

        <div className="ora-sidebar-section" style={{ marginTop: 20 }}>Templates</div>
        <div className="ora-template-list">
          {TEMPLATES.slice(1).map((tmpl) => (
            <button key={tmpl.label} type="button" className="ora-template-pill" onClick={() => createFromTemplate(tmpl.content, tmpl.label)}>
              <span style={{ color: tmpl.color, fontSize: 11, fontWeight: 600 }}>{tmpl.label}</span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', padding: '12px 0', borderTop: '1px solid #2a3050' }}>
          <div style={{ fontSize: 11, color: '#8899b8', padding: '0 4px' }}>
            {wordDocs.length} document{wordDocs.length !== 1 ? 's' : ''}
          </div>
        </div>
      </aside>

      {/* Main */}
      <section className="oracle-home">
        <header className="oracle-home-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1a1a2e' }}>{tab}</h3>
            <span style={{ fontSize: 12, color: '#8899b8' }}>{homeDocuments.length} documents</span>
          </div>
          <div style={{ position: 'relative' }}>
            <SvgIcon d={ICONS.search} size={14} stroke />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              style={{ paddingLeft: 28, paddingRight: 10, paddingTop: 6, paddingBottom: 6, fontSize: 12, border: '1px solid #d0d4e4', borderRadius: 4, outline: 'none', width: 200 }}
            />
          </div>
        </header>

        {/* Template Row */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#8899b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>New from template</div>
          <div className="ora-templates-row">
            {TEMPLATES.map((tmpl) => (
              <button key={tmpl.label} type="button" className="oracle-template-card" onClick={() => createFromTemplate(tmpl.content, tmpl.label)}>
                <div className="ora-template-icon">
                  <tmpl.Icon />
                </div>
                <strong style={{ fontSize: 12 }}>{tmpl.label}</strong>
                <span style={{ fontSize: 11 }}>{tmpl.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Document List */}
        <div className="ora-doc-section-title">{tab} documents</div>
        {homeDocuments.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#8899b8', fontSize: 13 }}>
            No documents found.
          </div>
        ) : (
          <div className="oracle-doc-grid">
            {homeDocuments.map((doc) => (
              <button key={doc.id} type="button" className="oracle-doc-card" onClick={() => openDocument(doc.id)}>
                <div className="oracle-doc-thumb">
                  <div className="ora-doc-thumb-lines">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="ora-doc-thumb-line" style={{ width: `${88 - i * 8}%`, opacity: i === 0 ? 0.8 : 0.35 }} />
                    ))}
                  </div>
                </div>
                <div className="ora-doc-card-body">
                  <strong style={{ fontSize: 12 }}>{doc.title}</strong>
                  <span style={{ fontSize: 11 }}>{doc.owner} · {new Date(doc.updatedAt).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
