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

const SF_SYMBOLS: Record<string, string> = {
  globe: '🌐', heart: '♥️', 'heart.fill': '♥️', star: '⭐', 'star.fill': '⭐',
  bolt: '⚡', sun: '☀️', 'sun.max': '☀️', moon: '🌙', flame: '🔥',
  person: '👤', house: '🏠', gear: '⚙️', bell: '🔔', swift: '🐦',
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
        setConsole((c) => [...c, '❌ error: expressions are not balanced — check braces/quotes in ContentView.swift', 'Build FAILED (0.9s)']);
        setBuilding(false);
      } else {
        setConsole((c) => [...c, '✅ Build Succeeded (1.8s)', 'Installing on iPhone 16 Pro (Simulator)…', 'Launching com.aos.MyFirstApp…']);
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
          <span className="xc-scheme-app">📱 MyFirstApp</span>
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
            <span className="active" title="Project navigator">🗂</span>
            <span title="Search">🔍</span>
            <span title="Issues">⚠️</span>
            <span title="Debug">🐞</span>
          </div>
          <div className="xc-nav-tree">
            <div className="xc-nav-project">▾ 📁 MyFirstApp</div>
            {files.map((f) => (
              <button key={f.id} type="button"
                className={`xc-nav-file ${activeFileId === f.id ? 'active' : ''}`}
                onClick={() => setActiveFileId(f.id)}>
                <span className="xc-file-ic">{f.kind === 'swift' ? '🐦' : f.kind === 'assets' ? '🎨' : '⚙️'}</span>
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
                <div className="xc-asset-tile"><span className="xc-asset-thumb">🖼</span>AppIcon</div>
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
              <div className="xc-phone-statusbar"><span>9:41</span><span>📶 🔋</span></div>
              <div className="xc-phone-app" style={{ gap: preview.spacing }}>
                {preview.nodes.map((n, i) => {
                  if (n.type === 'icon') return <div key={i} className="xc-p-icon">{SF_SYMBOLS[n.name] ?? '❖'}</div>;
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
