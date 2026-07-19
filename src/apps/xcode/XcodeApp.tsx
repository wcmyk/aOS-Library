import { useMemo, useRef, useState } from 'react';
import './xcode.css';

// Swift iOS development environment simulation: project navigator, Swift
// editor with syntax highlighting, live SwiftUI canvas on a simulated iPhone,
// and a build console. The canvas parses a friendly subset of SwiftUI
// (Text / Image(systemName:) / Button / VStack spacing, colors, font sizes)
// so edits genuinely change the running "app".

type ProjectFile = { id: string; name: string; kind: 'swift' | 'assets' | 'plist'; content: string };

const CONTENT_VIEW = `import SwiftUI

struct ContentView: View {
    @State private var taps = 0

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "globe")
                .imageScale(.large)
                .foregroundStyle(.tint)
            Text("Hello, aOS graduate!")
                .font(.title)
                .bold()
            Text("Your first iOS app is running.")
                .foregroundStyle(.secondary)
            Button("Tap count: \\(taps)") {
                taps += 1
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
`;

const APP_ENTRY = `import SwiftUI

@main
struct MyFirstAppApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
`;

const INITIAL_FILES: ProjectFile[] = [
  { id: 'content', name: 'ContentView.swift', kind: 'swift', content: CONTENT_VIEW },
  { id: 'app', name: 'MyFirstAppApp.swift', kind: 'swift', content: APP_ENTRY },
  { id: 'assets', name: 'Assets.xcassets', kind: 'assets', content: '' },
  { id: 'plist', name: 'Info.plist', kind: 'plist', content: '<plist>\n  <key>CFBundleDisplayName</key>\n  <string>MyFirstApp</string>\n</plist>' },
];

// ── Swift syntax highlighting (lightweight tokenizer) ─────────────────────────

// Single-pass tokenizer: one combined regex so later token classes can never
// match inside HTML inserted for earlier ones.
const SWIFT_TOKENS = /("(?:[^"\\]|\\.)*")|(\/\/[^\n]*)|(@\w+)|\b(import|struct|class|enum|protocol|extension|var|let|func|return|if|else|guard|switch|case|default|for|in|while|private|public|internal|static|some|body|init|self|true|false|nil)\b|\.(\w+)(?=\()|\b(\d+(?:\.\d+)?)\b/g;

function highlightSwift(code: string): string {
  const esc = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc.replace(SWIFT_TOKENS, (m, str, com, attr, kw, fn, num) => {
    if (str) return `<span class="xc-str">${str}</span>`;
    if (com) return `<span class="xc-com">${com}</span>`;
    if (attr) return `<span class="xc-attr">${attr}</span>`;
    if (kw) return `<span class="xc-kw">${kw}</span>`;
    if (fn) return `.<span class="xc-fn">${fn}</span>`;
    if (num) return `<span class="xc-num">${num}</span>`;
    return m;
  });
}

// ── SwiftUI mini-interpreter for the canvas ───────────────────────────────────

type PreviewNode =
  | { type: 'text'; value: string; title: boolean; bold: boolean; secondary: boolean }
  | { type: 'icon'; name: string }
  | { type: 'button'; label: string };

function parsePreview(code: string): { nodes: PreviewNode[]; spacing: number } {
  const nodes: PreviewNode[] = [];
  const spacingMatch = code.match(/VStack\(spacing:\s*(\d+)/);
  const spacing = spacingMatch ? Math.min(40, parseInt(spacingMatch[1], 10)) : 12;
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const textM = line.match(/Text\("([^"]*)"\)/);
    if (textM) {
      const lookahead = lines.slice(i + 1, i + 4).join(' ');
      nodes.push({
        type: 'text',
        value: textM[1].replace(/\\\((\w+)\)/g, '0'),
        title: /\.font\(\.(largeTitle|title)\)/.test(line + lookahead),
        bold: /\.bold\(\)/.test(line + lookahead),
        secondary: /\.foregroundStyle\(\.secondary\)/.test(line + lookahead),
      });
      continue;
    }
    const iconM = line.match(/Image\(systemName:\s*"([^"]*)"\)/);
    if (iconM) { nodes.push({ type: 'icon', name: iconM[1] }); continue; }
    const btnM = line.match(/Button\("([^"]*)"\)/);
    if (btnM) { nodes.push({ type: 'button', label: btnM[1].replace(/\\\((\w+)\)/g, '') }); }
  }
  return { nodes, spacing };
}

const SF = (body: string) => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    dangerouslySetInnerHTML={{ __html: body }} />
);
const SF_SYMBOLS: Record<string, JSX.Element> = {
  globe: SF('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.7 2.3 4 5.2 4 8.5s-1.3 6.2-4 8.5c-2.7-2.3-4-5.2-4-8.5s1.3-6.2 4-8.5z"/>'),
  heart: SF('<path d="M12 20s-7-4.6-9-9c-1.2-2.7.6-6 3.8-6 2 0 3.6 1.2 5.2 3.4C13.6 6.2 15.2 5 17.2 5c3.2 0 5 3.3 3.8 6-2 4.4-9 9-9 9z"/>'),
  'heart.fill': SF('<path fill="currentColor" d="M12 20s-7-4.6-9-9c-1.2-2.7.6-6 3.8-6 2 0 3.6 1.2 5.2 3.4C13.6 6.2 15.2 5 17.2 5c3.2 0 5 3.3 3.8 6-2 4.4-9 9-9 9z"/>'),
  star: SF('<path d="M12 4.5 14.3 9.3l5.2.7-3.8 3.6.9 5.2L12 16.3l-4.6 2.5.9-5.2L4.5 10l5.2-.7z"/>'),
  'star.fill': SF('<path fill="currentColor" d="M12 4.5 14.3 9.3l5.2.7-3.8 3.6.9 5.2L12 16.3l-4.6 2.5.9-5.2L4.5 10l5.2-.7z"/>'),
  bolt: SF('<path d="M13 3 5 13.5h5L11 21l8-10.5h-5z"/>'),
  sun: SF('<circle cx="12" cy="12" r="4"/><path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7"/>'),
  'sun.max': SF('<circle cx="12" cy="12" r="4"/><path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7"/>'),
  moon: SF('<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>'),
  flame: SF('<path d="M12 3s5.5 4.2 5.5 9.5a5.5 5.5 0 0 1-11 0C6.5 9.5 9 8 9.5 5.5c1.2 1 2 2.4 2.5 4C13 8 12 5 12 3z"/>'),
  person: SF('<circle cx="12" cy="8.5" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>'),
  house: SF('<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/>'),
  gear: SF('<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18"/>'),
  bell: SF('<path d="M6 17h12l-1.5-2v-4.5a4.5 4.5 0 0 0-9 0V15z"/><path d="M10.3 19.5a1.8 1.8 0 0 0 3.4 0"/>'),
  swift: SF('<path fill="#f05138" stroke="none" d="M4 15c4 3 9 3.5 12 1.5 1.5 1 2.5 2 3 3.5.5-2 .2-3.7-.8-5.2C19.5 11 19 6.5 15.5 4c1.5 2.5 1.6 5 .8 7C14 9 11 6.8 8 5.5c2 2.5 4.5 4.8 6.5 6.5C11 12.5 7 12 4 9.5c1 2.3 2.8 4.2 5 5.5-1.7.3-3.4.2-5 0z"/>'),
};

// ── Component ─────────────────────────────────────────────────────────────────

export function XcodeApp() {
  const [files, setFiles] = useState<ProjectFile[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState('content');
  const [console_, setConsole] = useState<string[]>(['Ready. Press ▶ to build and run MyFirstApp on iPhone 16 Pro.']);
  const [building, setBuilding] = useState(false);
  const [running, setRunning] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const buildTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFile = files.find((f) => f.id === activeFileId) ?? files[0];
  const contentSource = files.find((f) => f.id === 'content')?.content ?? '';
  const preview = useMemo(() => parsePreview(contentSource), [contentSource]);

  const setContent = (val: string) => {
    setFiles((prev) => prev.map((f) => (f.id === activeFileId ? { ...f, content: val } : f)));
  };

  const run = () => {
    if (building) return;
    setBuilding(true);
    setRunning(false);
    setTapCount(0);
    const hasError = /Text\([^"]*$/m.test(contentSource) || (contentSource.split('{').length !== contentSource.split('}').length);
    const steps: Array<[number, string]> = [
      [0, '▸ Build MyFirstApp (iphonesimulator, arm64) — Debug'],
      [280, 'Planning build — resolved Swift 6.0 toolchain'],
      [640, 'Compiling ContentView.swift'],
      [980, 'Compiling MyFirstAppApp.swift'],
      [1280, 'Linking MyFirstApp.app'],
      [1560, 'Processing Info.plist · Copying Assets.xcassets'],
    ];
    setConsole([]);
    steps.forEach(([ms, msg]) => setTimeout(() => setConsole((c) => [...c, msg]), ms));
    buildTimer.current = setTimeout(() => {
      if (hasError) {
        setConsole((c) => [...c, 'error: expressions are not balanced — check braces/quotes in ContentView.swift', 'Build FAILED (0.9s)']);
        setBuilding(false);
      } else {
        setConsole((c) => [...c, 'Build Succeeded (1.8s)', 'Installing on iPhone 16 Pro (Simulator)…', 'Launching com.aos.MyFirstApp…']);
        setBuilding(false);
        setRunning(true);
      }
    }, 1900);
  };

  const stop = () => {
    if (buildTimer.current) clearTimeout(buildTimer.current);
    setBuilding(false);
    setRunning(false);
    setConsole((c) => [...c, '■ Stopped MyFirstApp.']);
  };

  return (
    <div className="xc-shell">
      {/* Toolbar */}
      <div className="xc-toolbar">
        <div className="xc-run-controls">
          <button type="button" className="xc-run" onClick={run} disabled={building} title="Run">▶</button>
          <button type="button" className="xc-stop" onClick={stop} title="Stop">■</button>
        </div>
        <div className="xc-scheme">
          <span className="xc-scheme-app"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M10.5 5h3"/></svg> MyFirstApp</span>
          <span className="xc-scheme-sep">›</span>
          <span>iPhone 16 Pro</span>
        </div>
        <div className="xc-status">
          {building ? <span className="xc-status-building">Building… <span className="xc-spinner" /></span>
            : running ? <span className="xc-status-ok">Running MyFirstApp on iPhone 16 Pro</span>
            : <span>Ready</span>}
        </div>
        <div className="xc-toolbar-right">
          <button type="button" title="Library">＋</button>
          <button type="button" title="Inspectors">◧</button>
        </div>
      </div>

      <div className="xc-main">
        {/* Navigator */}
        <aside className="xc-navigator">
          <div className="xc-nav-tabs">
            <span className="active" title="Project navigator"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3.5 7h17v13h-17z"/><path d="M7 7V4.5h10V7M3.5 11h17"/></svg></span>
            <span title="Search"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg></span>
            <span title="Issues"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3.5 21.5 20h-19z"/><path d="M12 10v4.5M12 17.4v.4"/></svg></span>
            <span title="Debug"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><ellipse cx="12" cy="14.5" rx="5" ry="6"/><circle cx="12" cy="6" r="2.5"/><path d="m4 12 4 1.5M4 18l4-.5M20 12l-4 1.5M20 18l-4-.5M12 8.5v12"/></svg></span>
          </div>
          <div className="xc-nav-tree">
            <div className="xc-nav-project">▾ <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3.5 6A1.5 1.5 0 0 1 5 4.5h4l2 2.5h8A1.5 1.5 0 0 1 20.5 8.5V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z"/></svg> MyFirstApp</div>
            {files.map((f) => (
              <button key={f.id} type="button"
                className={`xc-nav-file ${activeFileId === f.id ? 'active' : ''}`}
                onClick={() => setActiveFileId(f.id)}>
                <span className="xc-file-ic">{f.kind === 'swift' ? <svg width="13" height="13" viewBox="0 0 24 24" fill="#f05138"><path d="M4 15c4 3 9 3.5 12 1.5 1.5 1 2.5 2 3 3.5.5-2 .2-3.7-.8-5.2C19.5 11 19 6.5 15.5 4c1.5 2.5 1.6 5 .8 7C14 9 11 6.8 8 5.5c2 2.5 4.5 4.8 6.5 6.5C11 12.5 7 12 4 9.5c1 2.3 2.8 4.2 5 5.5-1.7.3-3.4.2-5 0z"/></svg> : f.kind === 'assets' ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="1.8"><rect x="3.5" y="5" width="17" height="14" rx="1.5"/><circle cx="8.5" cy="10" r="1.5"/><path d="m5 18 5-5 3 3 3.5-3.5 3 3"/></svg> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18"/></svg>}</span>
                {f.name}
              </button>
            ))}
          </div>
        </aside>

        {/* Editor + console */}
        <section className="xc-center">
          <div className="xc-breadcrumb">MyFirstApp › MyFirstApp › <strong>{activeFile.name}</strong>{activeFile.id === 'content' && ' › ContentView › body'}</div>
          <div className="xc-editor-wrap">
            {activeFile.kind === 'swift' || activeFile.kind === 'plist' ? (
              <div className="xc-editor">
                <pre className="xc-gutter">{activeFile.content.split('\n').map((_, i) => `${i + 1}\n`).join('')}</pre>
                <div className="xc-code-stack">
                  <pre className="xc-highlight" dangerouslySetInnerHTML={{ __html: highlightSwift(activeFile.content) + '\n' }} />
                  <textarea
                    className="xc-input"
                    value={activeFile.content}
                    onChange={(e) => setContent(e.target.value)}
                    spellCheck={false}
                  />
                </div>
              </div>
            ) : (
              <div className="xc-assets">
                <div className="xc-asset-tile"><span className="xc-asset-thumb"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3.5" y="5" width="17" height="14" rx="1.5"/><circle cx="8.5" cy="10" r="1.5"/><path d="m5 18 5-5 3 3 3.5-3.5 3 3"/></svg></span>AppIcon</div>
                <div className="xc-asset-tile"><span className="xc-asset-thumb" style={{ background: '#2f7cf6' }} />AccentColor</div>
              </div>
            )}
          </div>
          <div className="xc-console">
            <div className="xc-console-head">
              <span>Console — MyFirstApp</span>
              <button type="button" onClick={() => setConsole([])}>Clear</button>
            </div>
            <pre className="xc-console-body">{console_.join('\n')}</pre>
          </div>
        </section>

        {/* Canvas / simulator */}
        <aside className="xc-canvas">
          <div className="xc-canvas-head">
            <span>Canvas</span>
            <span className="xc-canvas-mode">{running ? 'Live' : 'Preview'}</span>
          </div>
          <div className="xc-phone">
            <div className="xc-phone-island" />
            <div className="xc-phone-screen">
              <div className="xc-phone-statusbar"><span>9:41</span><span className="xc-status-ics"><svg width="13" height="9" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="0.8"/><rect x="5" y="5.5" width="3" height="6.5" rx="0.8"/><rect x="10" y="3" width="3" height="9" rx="0.8"/><rect x="15" y="0" width="3" height="12" rx="0.8"/></svg> <svg width="19" height="9" viewBox="0 0 26 12" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="0.6" y="0.6" width="21" height="10.8" rx="3"/><rect x="2.6" y="2.6" width="14" height="6.8" rx="1.4" fill="currentColor" stroke="none"/><path d="M23.5 4v4a2.2 2.2 0 0 0 0-4z" fill="currentColor" stroke="none"/></svg></span></div>
              <div className="xc-phone-app" style={{ gap: preview.spacing }}>
                {preview.nodes.map((n, i) => {
                  if (n.type === 'icon') return <div key={i} className="xc-p-icon">{SF_SYMBOLS[n.name] ?? SF_SYMBOLS.star}</div>;
                  if (n.type === 'button') {
                    return (
                      <button key={i} type="button" className="xc-p-button"
                        onClick={() => running && setTapCount((c) => c + 1)}>
                        {n.label.includes('Tap count') ? `Tap count: ${tapCount}` : n.label}
                      </button>
                    );
                  }
                  return (
                    <div key={i} className={`xc-p-text ${n.title ? 'title' : ''} ${n.bold ? 'bold' : ''} ${n.secondary ? 'secondary' : ''}`}>
                      {n.value}
                    </div>
                  );
                })}
                {preview.nodes.length === 0 && <div className="xc-p-text secondary">Add SwiftUI views to ContentView to see them here.</div>}
              </div>
              <div className="xc-phone-homebar" />
            </div>
          </div>
          <div className="xc-canvas-tip">Edit <code>ContentView.swift</code> and the canvas updates live. Press ▶ to build &amp; interact.</div>
        </aside>
      </div>
    </div>
  );
}
