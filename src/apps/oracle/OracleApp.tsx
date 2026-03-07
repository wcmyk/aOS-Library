import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDriveStore } from '../../state/useDriveStore';

type OracleView = 'home' | 'editor';
type HomeTab = 'Recent' | 'Shared' | 'All';
type RibbonTab = 'Home' | 'Insert' | 'Format' | 'Review' | 'View';

// ── Toolbar icon SVGs ──────────────────────────────────────────────────────────

const Icon = ({ d, size = 14 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
    <path d={d} />
  </svg>
);

const ICONS = {
  bold: 'M3 2h5.5a3.5 3.5 0 0 1 0 7H3V2zm0 7h6a3.5 3.5 0 0 1 0 7H3V9z',
  italic: 'M6 2h6l-1 2H9.5L6.5 14H8l-1 2H1l1-2h1.5L5.5 4H4z',
  underline: 'M3 1h2v7a3 3 0 0 0 6 0V1h2v7a5 5 0 0 1-10 0V1zm-1 13h12v2H2z',
  strikethrough: 'M0 8h16v1.5H0zm3 3h2.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5H13c0 2.5-2 4-5 4s-5-1.5-5-4zm2-7c0-1.4 1.1-2.5 2.5-2.5S10 2.6 10 4H7.5C7.5 3.2 7 2.5 6 2.5 4.9 2.5 4.5 3.2 4.5 4H5z',
  alignLeft: 'M2 4h12v1.5H2zm0 4h8v1.5H2zm0 4h10v1.5H2z',
  alignCenter: 'M2 4h12v1.5H2zm3 4h6v1.5H5zm-1 4h8v1.5H4z',
  alignRight: 'M2 4h12v1.5H2zm5 4h7v1.5H7zm-1 4h9v1.5H6z',
  alignJustify: 'M2 4h12v1.5H2zm0 4h12v1.5H2zm0 4h12v1.5H2z',
  bulletList: 'M3 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm0 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm0 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM5 3.5h9V5.5H5zm0 4h9v2H5zm0 4h9v2H5z',
  numberedList: 'M2.5 1v3H1V2H0V1zM0 9.5A1.5 1.5 0 0 1 1.5 8 1.5 1.5 0 0 1 3 9.5 1.5 1.5 0 0 1 1.5 11 1.5 1.5 0 0 1 0 9.5zm1.5-.5a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1zm-1.5 5H3v1H0v-1zM5 3.5h9V5.5H5zm0 4h9v2H5zm0 4h9v2H5z',
  indent: 'M1 2h14v2H1zm4 4h10v2H5zm0 4h10v2H5zM1 13l4-3.5v7z',
  outdent: 'M1 2h14v2H1zm4 4h10v2H5zm0 4h10v2H5zM5 8.5L1 12l4 3.5z',
  link: 'M4 9.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-1.5-4A3.5 3.5 0 0 1 6 2h1v2H6a1.5 1.5 0 0 0 0 3h1v2H6a3.5 3.5 0 0 1-3.5-3.5zm9 0A3.5 3.5 0 0 0 8 2H7v2h1a1.5 1.5 0 0 1 0 3H7v2h1a3.5 3.5 0 0 0 3.5-3.5zm-6 7A3.5 3.5 0 0 1 2 9h2a1.5 1.5 0 0 0 3 0h2a3.5 3.5 0 0 1-7 0z',
  image: 'M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3zm5.5 4a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0zM1 12l3-4 2 2.5 3-4L13 12H1z',
  table: 'M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm7 0v4H1V2h6zm0 5H1v4h6V7zm1 4h6V7H8v4zm6 1H8v4h6v-4zm-7 4v-4H1v4h6z',
  undo: 'M5.5 5.5L4 7A6 6 0 1 1 3 9.8L4.5 8.3A4.5 4.5 0 1 0 5.5 5.5zM4 1v6H1L4 1z',
  redo: 'M10.5 5.5L12 7A6 6 0 1 0 13 9.8L11.5 8.3A4.5 4.5 0 1 1 10.5 5.5zM12 1v6h3L12 1z',
  heading: 'M2 2h2v5h6V2h2v12h-2V9H4v5H2z',
  wordCount: 'M2 3h12v2H2zm0 4h8v2H2zm0 4h10v2H2z',
  fullscreen: 'M1 1h5v2H3v3H1zm9 0h5v5h-2V3h-3zM1 10h2v3h3v2H1zm13 3h-3v2h5v-5h-2z',
};

function ToolbarBtn({
  title, active, onClick, children,
}: { title: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      className={`ora-tb-btn${active ? ' active' : ''}`}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="ora-tb-divider" />;
}

// ── Editor View ───────────────────────────────────────────────────────────────

function OracleEditor({
  docId, onBack,
}: { docId: string; onBack: () => void }) {
  const { documents, updateDocument } = useDriveStore();
  const doc = documents.find((d) => d.id === docId) ?? null;
  const editorRef = useRef<HTMLDivElement>(null);
  const [ribbonTab, setRibbonTab] = useState<RibbonTab>('Home');
  const [fontFamily, setFontFamily] = useState('Georgia');
  const [fontSize, setFontSize] = useState('16');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  const [showColorPicker, setShowColorPicker] = useState<'text' | 'highlight' | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize editor content
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
    updateDocument(doc.id, { content: editorRef.current.innerHTML });
    updateWordCount();
  }, [doc]);

  // Debounced version for onInput — avoids saving on every keystroke
  const handleInput = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(saveContent, 300);
  }, [saveContent]);

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    saveContent();
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  const insertLink = () => {
    restoreSelection();
    if (linkUrl) exec('createLink', linkUrl);
    setShowLinkModal(false);
    setLinkUrl('');
  };

  const applyHeading = (level: string) => {
    if (level === 'p') exec('formatBlock', '<p>');
    else exec('formatBlock', `<h${level}>`);
  };

  const applyFontSize = (size: string) => {
    setFontSize(size);
    exec('fontSize', '7');
    // Override the font size via span replacement
    editorRef.current?.querySelectorAll('font[size="7"]').forEach((el) => {
      const span = document.createElement('span');
      span.style.fontSize = `${size}px`;
      span.innerHTML = (el as HTMLElement).innerHTML;
      el.replaceWith(span);
    });
  };

  const presets = [
    { label: 'H1', cmd: '1' }, { label: 'H2', cmd: '2' },
    { label: 'H3', cmd: '3' }, { label: 'Normal', cmd: 'p' },
  ];

  const FONT_FAMILIES = ['Georgia', 'Times New Roman', 'Arial', 'Helvetica', 'Verdana', 'Courier New', 'Inter', 'Garamond'];
  const FONT_SIZES = ['10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48'];
  const TEXT_COLORS = ['#000000', '#1a1a1a', '#c0392b', '#e67e22', '#f39c12', '#27ae60', '#2980b9', '#8e44ad', '#ffffff'];
  const HIGHLIGHT_COLORS = ['#ffff00', '#90ee90', '#add8e6', '#ffb6c1', '#ffa500', '#e0e0e0', 'transparent'];

  if (!doc) return null;

  return (
    <div className="ora-editor-shell">
      {/* Title Bar */}
      <div className="ora-titlebar">
        <button type="button" className="ora-back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11 2L5 8l6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </button>
        <input
          className="ora-doc-title"
          value={doc.title}
          onChange={(e) => updateDocument(doc.id, { title: e.target.value })}
          placeholder="Document title"
        />
        <div className="ora-titlebar-actions">
          <span className="ora-saved-badge">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4.5" stroke="#4ade80" strokeWidth="1" />
              <path d="M3 5l1.5 1.5L7 3.5" stroke="#4ade80" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Saved to Sanctum
          </span>
          <button type="button" className="ora-share-btn">Share</button>
        </div>
      </div>

      {/* Ribbon Tabs */}
      <div className="ora-ribbon-tabs">
        {(['Home', 'Insert', 'Format', 'Review', 'View'] as RibbonTab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`ora-ribbon-tab${ribbonTab === t ? ' active' : ''}`}
            onClick={() => setRibbonTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Ribbon Toolbar */}
      <div className="ora-ribbon">
        {ribbonTab === 'Home' && (
          <>
            {/* Clipboard Group */}
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Clipboard</div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Undo (Ctrl+Z)" onClick={() => exec('undo')}><Icon d={ICONS.undo} /></ToolbarBtn>
                <ToolbarBtn title="Redo (Ctrl+Y)" onClick={() => exec('redo')}><Icon d={ICONS.redo} /></ToolbarBtn>
              </div>
            </div>
            <Divider />

            {/* Font Group */}
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Font</div>
              <div className="ora-tb-row">
                <select
                  className="ora-tb-select"
                  value={fontFamily}
                  onChange={(e) => { setFontFamily(e.target.value); exec('fontName', e.target.value); }}
                  style={{ width: 110 }}
                >
                  {FONT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <select
                  className="ora-tb-select"
                  value={fontSize}
                  onChange={(e) => applyFontSize(e.target.value)}
                  style={{ width: 50 }}
                >
                  {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Bold (Ctrl+B)" onClick={() => exec('bold')}><strong>B</strong></ToolbarBtn>
                <ToolbarBtn title="Italic (Ctrl+I)" onClick={() => exec('italic')}><em>I</em></ToolbarBtn>
                <ToolbarBtn title="Underline (Ctrl+U)" onClick={() => exec('underline')}><u>U</u></ToolbarBtn>
                <ToolbarBtn title="Strikethrough" onClick={() => exec('strikeThrough')}><s>S</s></ToolbarBtn>
                <ToolbarBtn title="Subscript" onClick={() => exec('subscript')}>x₂</ToolbarBtn>
                <ToolbarBtn title="Superscript" onClick={() => exec('superscript')}>x²</ToolbarBtn>
              </div>
              <div className="ora-tb-row">
                {/* Text Color */}
                <div className="ora-color-picker-wrap" style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="ora-tb-btn ora-color-btn"
                    title="Text Color"
                    onMouseDown={(e) => { e.preventDefault(); saveSelection(); setShowColorPicker(showColorPicker === 'text' ? null : 'text'); }}
                  >
                    <span style={{ fontWeight: 700, color: textColor === '#000000' ? '#e8ebf4' : textColor }}>A</span>
                    <span className="ora-color-swatch" style={{ background: textColor }} />
                  </button>
                  {showColorPicker === 'text' && (
                    <div className="ora-color-palette">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="ora-color-dot"
                          style={{ background: c, border: c === '#ffffff' ? '1px solid #555' : undefined }}
                          onMouseDown={(e) => { e.preventDefault(); restoreSelection(); setTextColor(c); exec('foreColor', c); setShowColorPicker(null); }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Highlight Color */}
                <div className="ora-color-picker-wrap" style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="ora-tb-btn ora-color-btn"
                    title="Highlight Color"
                    onMouseDown={(e) => { e.preventDefault(); saveSelection(); setShowColorPicker(showColorPicker === 'highlight' ? null : 'highlight'); }}
                  >
                    <span style={{ fontWeight: 700 }}>ab</span>
                    <span className="ora-color-swatch" style={{ background: highlightColor === 'transparent' ? 'none' : highlightColor, border: '1px solid rgba(255,255,255,0.2)' }} />
                  </button>
                  {showColorPicker === 'highlight' && (
                    <div className="ora-color-palette">
                      {HIGHLIGHT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="ora-color-dot"
                          style={{ background: c === 'transparent' ? 'none' : c, border: '1px solid rgba(255,255,255,0.3)' }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            restoreSelection();
                            setHighlightColor(c);
                            if (c === 'transparent') exec('hiliteColor', 'transparent');
                            else exec('hiliteColor', c);
                            setShowColorPicker(null);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Divider />

            {/* Paragraph Group */}
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Paragraph</div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Align Left" onClick={() => exec('justifyLeft')}><Icon d={ICONS.alignLeft} /></ToolbarBtn>
                <ToolbarBtn title="Center" onClick={() => exec('justifyCenter')}><Icon d={ICONS.alignCenter} /></ToolbarBtn>
                <ToolbarBtn title="Align Right" onClick={() => exec('justifyRight')}><Icon d={ICONS.alignRight} /></ToolbarBtn>
                <ToolbarBtn title="Justify" onClick={() => exec('justifyFull')}><Icon d={ICONS.alignJustify} /></ToolbarBtn>
              </div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Bullet List" onClick={() => exec('insertUnorderedList')}><Icon d={ICONS.bulletList} /></ToolbarBtn>
                <ToolbarBtn title="Numbered List" onClick={() => exec('insertOrderedList')}><Icon d={ICONS.numberedList} /></ToolbarBtn>
                <ToolbarBtn title="Decrease Indent" onClick={() => exec('outdent')}><Icon d={ICONS.outdent} /></ToolbarBtn>
                <ToolbarBtn title="Increase Indent" onClick={() => exec('indent')}><Icon d={ICONS.indent} /></ToolbarBtn>
              </div>
            </div>
            <Divider />

            {/* Styles Group */}
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Styles</div>
              <div className="ora-tb-row">
                {presets.map((p) => (
                  <ToolbarBtn key={p.label} title={`Apply ${p.label}`} onClick={() => applyHeading(p.cmd)}>
                    {p.label}
                  </ToolbarBtn>
                ))}
              </div>
            </div>
          </>
        )}

        {ribbonTab === 'Insert' && (
          <>
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Media</div>
              <div className="ora-tb-row">
                <ToolbarBtn
                  title="Insert Link"
                  onClick={() => { saveSelection(); setShowLinkModal(true); }}
                >
                  <Icon d={ICONS.link} /> Link
                </ToolbarBtn>
                <ToolbarBtn title="Insert Image (URL)" onClick={() => {
                  const url = prompt('Image URL:');
                  if (url) exec('insertImage', url);
                }}>
                  <Icon d={ICONS.image} /> Image
                </ToolbarBtn>
              </div>
            </div>
            <Divider />
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Structure</div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Insert Horizontal Rule" onClick={() => exec('insertHorizontalRule')}>
                  — Rule
                </ToolbarBtn>
                <ToolbarBtn title="Insert Table (3×3)" onClick={() => {
                  const rows = 3; const cols = 3;
                  let html = '<table style="border-collapse:collapse;width:100%;margin:8px 0">';
                  for (let r = 0; r < rows; r++) {
                    html += '<tr>';
                    for (let c = 0; c < cols; c++) {
                      html += `<td style="border:1px solid #ccc;padding:8px;min-width:80px">${r === 0 ? `<strong>Col ${c + 1}</strong>` : '&nbsp;'}</td>`;
                    }
                    html += '</tr>';
                  }
                  html += '</table>';
                  exec('insertHTML', html);
                }}>
                  <Icon d={ICONS.table} /> Table
                </ToolbarBtn>
              </div>
            </div>
            <Divider />
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Callouts</div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Info Callout" onClick={() => exec('insertHTML', '<div style="background:rgba(59,130,246,0.1);border-left:3px solid #3b82f6;padding:10px 14px;border-radius:4px;margin:8px 0">ℹ️ Info note</div><p><br></p>')}>ℹ️ Info</ToolbarBtn>
                <ToolbarBtn title="Warning Callout" onClick={() => exec('insertHTML', '<div style="background:rgba(245,158,11,0.1);border-left:3px solid #f59e0b;padding:10px 14px;border-radius:4px;margin:8px 0">⚠️ Warning</div><p><br></p>')}>⚠️ Warn</ToolbarBtn>
                <ToolbarBtn title="Code Block" onClick={() => exec('insertHTML', '<pre style="background:#1e2330;color:#e2e8f0;padding:12px;border-radius:6px;font-family:monospace;font-size:13px;overflow:auto;margin:8px 0">// code here</pre><p><br></p>')}>{'</>'} Code</ToolbarBtn>
              </div>
            </div>
          </>
        )}

        {ribbonTab === 'Format' && (
          <>
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Clear</div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Remove Formatting" onClick={() => exec('removeFormat')}>
                  ✕ Clear Format
                </ToolbarBtn>
              </div>
            </div>
            <Divider />
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Line Spacing</div>
              <div className="ora-tb-row">
                {['1', '1.5', '2', '2.5'].map((v) => (
                  <ToolbarBtn key={v} title={`Line spacing ${v}`} onClick={() => {
                    exec('insertHTML', `<div style="line-height:${v}">`);
                  }}>
                    {v}×
                  </ToolbarBtn>
                ))}
              </div>
            </div>
          </>
        )}

        {ribbonTab === 'Review' && (
          <div className="ora-tb-group">
            <div className="ora-tb-group-label">Proofing</div>
            <div className="ora-tb-row">
              <span className="ora-tb-info">Words: {wordCount}</span>
              <span className="ora-tb-info">Chars: {charCount}</span>
              <span className="ora-tb-info">~{Math.ceil(wordCount / 200)} min read</span>
            </div>
          </div>
        )}

        {ribbonTab === 'View' && (
          <>
            <div className="ora-tb-group">
              <div className="ora-tb-group-label">Page Layout</div>
              <div className="ora-tb-row">
                <ToolbarBtn title="Focus Mode" onClick={() => {
                  const surface = document.querySelector('.ora-editor-surface');
                  surface?.classList.toggle('focus-mode');
                }}>
                  🔲 Focus
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
            <div className="ora-modal-title">Insert Link</div>
            <input
              className="ora-modal-input"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && insertLink()}
              autoFocus
            />
            <div className="ora-modal-actions">
              <button type="button" className="ora-modal-cancel" onClick={() => setShowLinkModal(false)}>Cancel</button>
              <button type="button" className="ora-modal-ok" onClick={insertLink}>Insert</button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Surface */}
      <div
        className="ora-editor-surface"
        onClick={() => { setShowColorPicker(null); }}
      >
        <div className="ora-page">
          <div
            ref={editorRef}
            className="ora-content-editable"
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onBlur={saveContent}
            style={{ fontFamily, fontSize: `${fontSize}px` }}
          />
        </div>

        {/* Floating Document Outline */}
        <DocumentOutline editorRef={editorRef} />
      </div>

      {/* Status Bar */}
      <div className="ora-statusbar">
        <span>{wordCount} words · {charCount} characters · ~{Math.ceil(wordCount / 200)} min read</span>
        <span>Saved to Sanctum · {new Date(doc.updatedAt).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

// ── Document Outline Panel ────────────────────────────────────────────────────

function DocumentOutline({ editorRef }: { editorRef: React.RefObject<HTMLDivElement | null> }) {
  const [headings, setHeadings] = useState<{ text: string; level: number; id: string }[]>([]);

  useEffect(() => {
    const debounce = { timer: null as ReturnType<typeof setTimeout> | null };
    const observer = new MutationObserver(() => {
      if (debounce.timer) clearTimeout(debounce.timer);
      debounce.timer = setTimeout(() => {
        const el = editorRef.current;
        if (!el) return;
        const hs = Array.from(el.querySelectorAll('h1,h2,h3,h4')).map((h, i) => {
          const id = `ora-heading-${i}`;
          (h as HTMLElement).id = id;
          return {
            text: (h as HTMLElement).innerText,
            level: parseInt(h.tagName.replace('H', '')),
            id,
          };
        });
        setHeadings(hs);
      }, 200);
    });
    if (editorRef.current) {
      observer.observe(editorRef.current, { childList: true, subtree: true, characterData: true });
    }
    return () => {
      observer.disconnect();
      if (debounce.timer) clearTimeout(debounce.timer);
    };
  }, [editorRef]);

  if (headings.length === 0) return null;

  return (
    <div className="ora-outline">
      <div className="ora-outline-title">Outline</div>
      {headings.map((h) => (
        <button
          key={h.id}
          type="button"
          className="ora-outline-item"
          style={{ paddingLeft: (h.level - 1) * 12 + 8 }}
          onClick={() => document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' })}
        >
          {h.text || '(untitled)'}
        </button>
      ))}
    </div>
  );
}

// ── Home View ─────────────────────────────────────────────────────────────────

export function OracleApp() {
  const { documents, activeDocumentId, setActiveDocument, createDocument } = useDriveStore();
  const wordDocs = documents.filter((d) => d.type === 'document');
  const [view, setView] = useState<OracleView>('home');
  const [tab, setTab] = useState<HomeTab>('Recent');
  const [activeId, setActiveId] = useState<string | null>(activeDocumentId ?? wordDocs[0]?.id ?? null);

  useEffect(() => {
    if (activeDocumentId) {
      const exists = wordDocs.some((d) => d.id === activeDocumentId);
      if (exists) { setActiveId(activeDocumentId); setView('editor'); }
    }
  }, [activeDocumentId]);

  const homeDocuments = useMemo(() => {
    if (tab === 'Shared') return wordDocs.filter((d) => d.sharedWith.length > 0 || d.owner !== 'You');
    if (tab === 'Recent') return wordDocs.slice(0, 8);
    return wordDocs;
  }, [wordDocs, tab]);

  const openDocument = (id: string) => { setActiveDocument(id); setActiveId(id); setView('editor'); };
  const createNewDocument = () => { const id = createDocument('Untitled Document'); setActiveId(id); setView('editor'); };

  const TEMPLATES = [
    { label: 'Blank', desc: 'Start from scratch', icon: '📄', color: '#2b579a' },
    { label: 'Research Paper', desc: 'APA / MLA format', icon: '🔬', color: '#6b21a8' },
    { label: 'Meeting Notes', desc: 'Agenda + actions', icon: '📋', color: '#065f46' },
    { label: 'Project Brief', desc: 'Goals and timeline', icon: '🚀', color: '#7c2d12' },
  ];

  if (view === 'editor' && activeId) {
    return <OracleEditor docId={activeId} onBack={() => setView('home')} />;
  }

  return (
    <div className="oracle-shell">
      <aside className="oracle-sidebar">
        <div className="ora-brand">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect width="20" height="20" rx="4" fill="#2b579a" />
            <rect x="3" y="4" width="14" height="2" rx="1" fill="white" opacity="0.9" />
            <rect x="3" y="8" width="14" height="2" rx="1" fill="white" opacity="0.75" />
            <rect x="3" y="12" width="9" height="2" rx="1" fill="white" opacity="0.75" />
            <rect x="3" y="16" width="6" height="1.5" rx="0.75" fill="white" opacity="0.5" />
          </svg>
          <span className="ora-brand-name">Oracle</span>
        </div>

        <button type="button" className="oracle-primary" onClick={createNewDocument}>
          + New document
        </button>

        <div className="ora-nav-section">
          {(['Recent', 'Shared', 'All'] as HomeTab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`oracle-link${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'Recent' && '🕐 '}
              {t === 'Shared' && '👥 '}
              {t === 'All' && '📁 '}
              {t}
            </button>
          ))}
        </div>

        <div className="ora-sidebar-section">Templates</div>
        <div className="ora-template-list">
          {TEMPLATES.slice(1).map((tmpl) => (
            <button key={tmpl.label} type="button" className="ora-template-pill" onClick={createNewDocument}>
              <span>{tmpl.icon}</span> {tmpl.label}
            </button>
          ))}
        </div>
      </aside>

      <section className="oracle-home">
        <header className="oracle-home-header">
          <h3>{tab}</h3>
          <span>{homeDocuments.length} files</span>
        </header>

        {/* Templates Row */}
        <div className="ora-templates-row">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.label}
              type="button"
              className="oracle-template-card"
              onClick={createNewDocument}
            >
              <div className="ora-template-icon" style={{ background: `${tmpl.color}30`, color: tmpl.color }}>
                <span style={{ fontSize: 24 }}>{tmpl.icon}</span>
              </div>
              <strong>{tmpl.label}</strong>
              <span>{tmpl.desc}</span>
            </button>
          ))}
        </div>

        {/* Document Grid */}
        <div className="ora-doc-section-title">
          {tab} documents
          <span style={{ fontSize: 12, fontWeight: 400, color: '#8899b8' }}> · {homeDocuments.length} files</span>
        </div>
        <div className="oracle-doc-grid">
          {homeDocuments.map((doc) => (
            <button key={doc.id} type="button" className="oracle-doc-card" onClick={() => openDocument(doc.id)}>
              <div className="oracle-doc-thumb">
                <div className="ora-doc-thumb-lines">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="ora-doc-thumb-line" style={{ width: `${80 - i * 8}%` }} />
                  ))}
                </div>
              </div>
              <div className="ora-doc-card-body">
                <strong>{doc.title}</strong>
                <span>{doc.owner} · {new Date(doc.updatedAt).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
