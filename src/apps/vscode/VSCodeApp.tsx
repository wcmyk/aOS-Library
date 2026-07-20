import { useMemo, useRef, useState } from 'react';
import './vscode.css';

// Visual Studio Code replica: title bar with centered command center, activity
// bar, explorer, tabbed editor with TypeScript highlighting, integrated
// terminal with a working mini-shell, and the classic blue status bar.

type VFile = { id: string; name: string; path: string; lang: 'ts' | 'tsx' | 'json' | 'md' | 'css'; content: string };

const FILE_APP = `import { useEffect, useState } from 'react';
import { OnboardingChecklist } from './components/OnboardingChecklist';
import { fetchTasks, type Task } from './lib/api';

// New-hire onboarding portal: pulls the employee's first-week tasks
// and tracks completion against the HR deadline.
export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks().then((rows) => {
      setTasks(rows);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="spinner">Loading your onboarding plan…</div>;

  const done = tasks.filter((t) => t.complete).length;
  return (
    <main>
      <h1>Welcome aboard</h1>
      <p>{done} of {tasks.length} tasks complete</p>
      <OnboardingChecklist tasks={tasks} />
    </main>
  );
}
`;

const FILE_CHECKLIST = `import type { Task } from '../lib/api';

export function OnboardingChecklist({ tasks }: { tasks: Task[] }) {
  return (
    <ul className="checklist">
      {tasks.map((task) => (
        <li key={task.id} className={task.complete ? 'done' : ''}>
          <span className="title">{task.title}</span>
          <span className="due">due {task.due}</span>
        </li>
      ))}
    </ul>
  );
}
`;

const FILE_API = `export type Task = {
  id: string;
  title: string;
  due: string;
  complete: boolean;
};

const SEED: Task[] = [
  { id: 't1', title: 'Complete Form I-9 Section 1', due: 'Day 1', complete: true },
  { id: 't2', title: 'Submit Form W-4 elections', due: 'Day 1', complete: true },
  { id: 't3', title: 'Set up direct deposit', due: 'Day 3', complete: false },
  { id: 't4', title: 'Security & compliance training', due: 'Day 5', complete: false },
  { id: 't5', title: 'Meet your onboarding buddy', due: 'Week 1', complete: false },
];

export async function fetchTasks(): Promise<Task[]> {
  // Simulated latency so the loading state is visible in dev.
  await new Promise((r) => setTimeout(r, 400));
  return SEED;
}
`;

const FILE_PKG = `{
  "name": "onboarding-portal",
  "private": true,
  "version": "0.4.2",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "lint": "eslint src"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "typescript": "~5.6.2",
    "vite": "^6.0.1",
    "vitest": "^2.1.8"
  }
}
`;

const FILE_README = `# onboarding-portal

Internal portal that walks new hires through their first-week tasks:
employment paperwork (I-9, W-4, direct deposit), required training, and
intro meetings.

## Getting started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`
`;

const INITIAL_FILES: VFile[] = [
  { id: 'app', name: 'App.tsx', path: 'src/App.tsx', lang: 'tsx', content: FILE_APP },
  { id: 'checklist', name: 'OnboardingChecklist.tsx', path: 'src/components/OnboardingChecklist.tsx', lang: 'tsx', content: FILE_CHECKLIST },
  { id: 'api', name: 'api.ts', path: 'src/lib/api.ts', lang: 'ts', content: FILE_API },
  { id: 'pkg', name: 'package.json', path: 'package.json', lang: 'json', content: FILE_PKG },
  { id: 'readme', name: 'README.md', path: 'README.md', lang: 'md', content: FILE_README },
];

// ── TypeScript highlighting (single-pass tokenizer) ───────────────────────────

const TS_TOKENS = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|\b(import|export|from|const|let|var|function|return|if|else|for|while|of|in|new|await|async|type|interface|extends|implements|class|public|private|readonly|typeof|keyof|as|default|true|false|null|undefined|void|number|string|boolean)\b|\b([A-Z][A-Za-z0-9_]*)\b|([a-zA-Z_$][\w$]*)(?=\()|\b(\d+(?:\.\d+)?)\b/g;

function highlightTs(code: string): string {
  const esc = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc.replace(TS_TOKENS, (m, str, com, kw, typ, fn, num) => {
    if (str) return `<span class="vsc-str">${str}</span>`;
    if (com) return `<span class="vsc-com">${com}</span>`;
    if (kw) return `<span class="vsc-kw">${kw}</span>`;
    if (typ) return `<span class="vsc-typ">${typ}</span>`;
    if (fn) return `<span class="vsc-fn">${fn}</span>`;
    if (num) return `<span class="vsc-num">${num}</span>`;
    return m;
  });
}

// ── Icons (all inline SVG — no emoji anywhere) ────────────────────────────────

const I = {
  files: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 6.5 12.5 2H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h4" /><path d="M12 2v5h5" /><path d="M20 11.5 15.5 7H10v14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1z" /><path d="M15 7v5h5" /></svg>,
  search: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>,
  git: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="6" cy="6" r="2.4" /><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="9" r="2.4" /><path d="M6 8.4v7.2" /><path d="M15.7 9.9c-2.5.7-6 1.6-7.3 4.8" /></svg>,
  run: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7 4.5v15l12-7.5z" /><circle cx="7" cy="19" r="0" /></svg>,
  ext: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1" /><rect x="13" y="3.5" width="7.5" height="7.5" rx="1" /><rect x="3.5" y="13" width="7.5" height="7.5" rx="1" /><path d="M16.8 13.5v6.5M13.5 16.8H20" /></svg>,
  account: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8.5" r="3.6" /><path d="M4.5 20a8 8 0 0 1 15 0" /></svg>,
  gear: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" /></svg>,
  chevron: (open: boolean) => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ transform: open ? 'rotate(90deg)' : 'none' }}><path d="m6 4 4 4-4 4" /></svg>,
  close: <svg width="13" height="13" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.4"><path d="M4 4l8 8M12 4l-8 8" /></svg>,
  bell: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 17h12l-1.5-2v-4.5a4.5 4.5 0 0 0-9 0V15z" /><path d="M10.3 19.5a1.8 1.8 0 0 0 3.4 0" /></svg>,
  branch: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="5" r="2.2" /><circle cx="6" cy="19" r="2.2" /><circle cx="18" cy="8" r="2.2" /><path d="M6 7.2v9.6" /><path d="M15.9 9.5C13.7 10.3 8.6 11.5 7 15" /></svg>,
  sync: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 3.5V8h-4.5" /></svg>,
  err: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8.5" /><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" /></svg>,
  warn: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3.5 21.5 20h-19z" /><path d="M12 10v4.5M12 17.4v.4" /></svg>,
  term: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4.5" width="18" height="15" rx="1.5" /><path d="m7 9.5 3.5 3L7 15.5M13 15.5h4.5" /></svg>,
};

function FileIcon({ lang }: { lang: VFile['lang'] }) {
  if (lang === 'tsx') return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="2" fill="#519aba" /><g stroke="#519aba" strokeWidth="1.2" fill="none"><ellipse cx="12" cy="12" rx="9" ry="3.6" /><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" /></g></svg>;
  if (lang === 'ts') return <svg width="15" height="15" viewBox="0 0 24 24"><rect width="24" height="24" rx="3" fill="#3178c6" /><text x="12" y="16.5" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="Segoe UI, sans-serif">TS</text></svg>;
  if (lang === 'json') return <svg width="15" height="15" viewBox="0 0 24 24"><text x="12" y="17" textAnchor="middle" fontSize="13" fontWeight="700" fill="#cbcb41" fontFamily="monospace">{'{}'}</text></svg>;
  if (lang === 'css') return <svg width="15" height="15" viewBox="0 0 24 24"><rect width="24" height="24" rx="3" fill="#663399" /><text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">CSS</text></svg>;
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#519aba" strokeWidth="1.6"><path d="M4 7h16M4 12h16M4 17h10" /></svg>;
}

// ── Mini shell for the integrated terminal ────────────────────────────────────

function runCommand(cmd: string): string[] {
  const c = cmd.trim();
  if (!c) return [];
  if (c === 'clear') return [' CLEAR'];
  if (c === 'ls') return ['README.md    node_modules    package.json    src    tsconfig.json    vite.config.ts'];
  if (c === 'pwd') return ['/Users/you/dev/onboarding-portal'];
  if (c === 'git status') return ['On branch main', "Your branch is up to date with 'origin/main'.", '', 'Changes not staged for commit:', '  modified:   src/App.tsx', '  modified:   src/lib/api.ts', '', 'no changes added to commit (use "git add" and/or "git commit -a")'];
  if (c === 'git branch') return ['* main', '  feat/deposit-form'];
  if (c.startsWith('npm run build') || c === 'npm run build') return ['> onboarding-portal@0.4.2 build', '> tsc -b && vite build', '', 'vite v6.0.1 building for production...', 'transforming... 214 modules transformed.', 'dist/index.html                  0.46 kB', 'dist/assets/index-B3xk2f.css    12.80 kB', 'dist/assets/index-Dq91mz.js    186.44 kB', 'built in 1.92s'];
  if (c === 'npm test' || c === 'npm run test') return ['> onboarding-portal@0.4.2 test', '> vitest run', '', ' RUN  v2.1.8 /Users/you/dev/onboarding-portal', '', ' PASS  src/lib/api.test.ts (5 tests) 12ms', ' PASS  src/components/OnboardingChecklist.test.tsx (3 tests) 41ms', '', ' Test Files  2 passed (2)', '      Tests  8 passed (8)', '   Duration  1.04s'];
  if (c === 'npm run lint') return ['> onboarding-portal@0.4.2 lint', '> eslint src', ''];
  if (c === 'node -v') return ['v22.11.0'];
  if (c === 'npm -v') return ['10.9.0'];
  if (c === 'whoami') return ['you'];
  if (c.startsWith('echo ')) return [c.slice(5)];
  if (c === 'help') return ['Available: ls, pwd, git status, git branch, npm run build, npm test, npm run lint, node -v, echo, clear'];
  return [`zsh: command not found: ${c.split(' ')[0]}`];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VSCodeApp() {
  const [files, setFiles] = useState<VFile[]>(INITIAL_FILES);
  const [openTabs, setOpenTabs] = useState<string[]>(['app', 'api']);
  const [activeId, setActiveId] = useState('app');
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [foldersOpen, setFoldersOpen] = useState<Record<string, boolean>>({ src: true, components: true, lib: true });
  const [showTerminal, setShowTerminal] = useState(true);
  const [termLines, setTermLines] = useState<string[]>(['Restored session — zsh']);
  const [termInput, setTermInput] = useState('');
  const [cursor, setCursor] = useState({ ln: 1, col: 1 });
  const termScroll = useRef<HTMLDivElement | null>(null);

  const active = files.find((f) => f.id === activeId) ?? files[0];

  const openFile = (id: string) => {
    setOpenTabs((t) => (t.includes(id) ? t : [...t, id]));
    setActiveId(id);
  };
  const closeTab = (id: string) => {
    setOpenTabs((t) => {
      const next = t.filter((x) => x !== id);
      if (id === activeId && next.length) setActiveId(next[next.length - 1]);
      return next;
    });
  };
  const setContent = (val: string) => {
    setFiles((prev) => prev.map((f) => (f.id === activeId ? { ...f, content: val } : f)));
    setDirty((d) => ({ ...d, [activeId]: true }));
  };

  const submitTerm = () => {
    const out = runCommand(termInput);
    if (out[0] === ' CLEAR') { setTermLines([]); setTermInput(''); return; }
    setTermLines((l) => [...l, `you@aos onboarding-portal % ${termInput}`, ...out]);
    setTermInput('');
    setTimeout(() => termScroll.current?.scrollTo({ top: 999999 }), 30);
  };

  const highlighted = useMemo(() => highlightTs(active.content), [active.content]);

  const tree: Array<{ type: 'folder' | 'file'; depth: number; key: string; label: string; fileId?: string; lang?: VFile['lang'] }> = [
    { type: 'folder', depth: 0, key: 'src', label: 'src' },
    ...(foldersOpen.src ? [
      { type: 'folder' as const, depth: 1, key: 'components', label: 'components' },
      ...(foldersOpen.components ? [{ type: 'file' as const, depth: 2, key: 'checklist', label: 'OnboardingChecklist.tsx', fileId: 'checklist', lang: 'tsx' as const }] : []),
      { type: 'folder' as const, depth: 1, key: 'lib', label: 'lib' },
      ...(foldersOpen.lib ? [{ type: 'file' as const, depth: 2, key: 'api', label: 'api.ts', fileId: 'api', lang: 'ts' as const }] : []),
      { type: 'file' as const, depth: 1, key: 'app', label: 'App.tsx', fileId: 'app', lang: 'tsx' as const },
    ] : []),
    { type: 'file', depth: 0, key: 'pkg', label: 'package.json', fileId: 'pkg', lang: 'json' },
    { type: 'file', depth: 0, key: 'readme', label: 'README.md', fileId: 'readme', lang: 'md' },
  ];

  return (
    <div className="vsc-shell">
      {/* Title bar */}
      <div className="vsc-titlebar">
        <div className="vsc-menu">
          {['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'].map((m) => <span key={m}>{m}</span>)}
        </div>
        <div className="vsc-command-center">
          <span className="vsc-cc-icon">{I.search}</span>
          onboarding-portal
        </div>
        <div className="vsc-titlebar-right" />
      </div>

      <div className="vsc-body">
        {/* Activity bar */}
        <div className="vsc-activitybar">
          <button type="button" className="active" title="Explorer">{I.files}</button>
          <button type="button" title="Search">{I.search}</button>
          <button type="button" title="Source Control" className="vsc-badged" data-badge="2">{I.git}</button>
          <button type="button" title="Run and Debug">{I.run}</button>
          <button type="button" title="Extensions">{I.ext}</button>
          <div className="vsc-activity-bottom">
            <button type="button" title="Accounts">{I.account}</button>
            <button type="button" title="Manage">{I.gear}</button>
          </div>
        </div>

        {/* Explorer */}
        <div className="vsc-sidebar">
          <div className="vsc-sidebar-title">EXPLORER</div>
          <div className="vsc-project-row">{I.chevron(true)} <strong>ONBOARDING-PORTAL</strong></div>
          <div className="vsc-tree">
            {tree.map((n) => n.type === 'folder' ? (
              <button key={n.key} type="button" className="vsc-tree-row" style={{ paddingLeft: 10 + n.depth * 12 }}
                onClick={() => setFoldersOpen((o) => ({ ...o, [n.key]: !o[n.key] }))}>
                {I.chevron(!!foldersOpen[n.key])}
                <span className="vsc-folder-name">{n.label}</span>
              </button>
            ) : (
              <button key={n.key} type="button"
                className={`vsc-tree-row vsc-tree-file ${activeId === n.fileId ? 'active' : ''}`}
                style={{ paddingLeft: 24 + n.depth * 12 }}
                onClick={() => n.fileId && openFile(n.fileId)}>
                <FileIcon lang={n.lang ?? 'md'} />
                <span>{n.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor column */}
        <div className="vsc-editor-col">
          <div className="vsc-tabs">
            {openTabs.map((id) => {
              const f = files.find((x) => x.id === id)!;
              return (
                <div key={id} className={`vsc-tab ${id === activeId ? 'active' : ''}`} onClick={() => setActiveId(id)}>
                  <FileIcon lang={f.lang} />
                  <span>{f.name}</span>
                  <button type="button" className={`vsc-tab-close ${dirty[id] ? 'dirty' : ''}`}
                    onClick={(e) => { e.stopPropagation(); closeTab(id); }} aria-label="Close tab">
                    {dirty[id] ? <span className="vsc-dot" /> : I.close}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="vsc-breadcrumbs">
            {active.path.split('/').map((seg, i, arr) => (
              <span key={i}>{seg}{i < arr.length - 1 && <span className="vsc-bc-sep">›</span>}</span>
            ))}
          </div>
          <div className="vsc-editor">
            <pre className="vsc-gutter">{active.content.split('\n').map((_, i) => `${i + 1}\n`).join('')}</pre>
            <div className="vsc-code-stack">
              <pre className="vsc-highlight" dangerouslySetInnerHTML={{ __html: highlighted + '\n' }} />
              <textarea
                className="vsc-input"
                value={active.content}
                spellCheck={false}
                onChange={(e) => setContent(e.target.value)}
                onKeyUp={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  const upto = t.value.slice(0, t.selectionStart);
                  const lines = upto.split('\n');
                  setCursor({ ln: lines.length, col: lines[lines.length - 1].length + 1 });
                }}
                onClick={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  const upto = t.value.slice(0, t.selectionStart);
                  const lines = upto.split('\n');
                  setCursor({ ln: lines.length, col: lines[lines.length - 1].length + 1 });
                }}
              />
            </div>
          </div>

          {/* Terminal panel */}
          {showTerminal && (
            <div className="vsc-panel">
              <div className="vsc-panel-tabs">
                <span>PROBLEMS</span>
                <span>OUTPUT</span>
                <span>DEBUG CONSOLE</span>
                <span className="active">TERMINAL</span>
                <span>PORTS</span>
                <button type="button" className="vsc-panel-close" onClick={() => setShowTerminal(false)} aria-label="Close panel">{I.close}</button>
              </div>
              <div className="vsc-term" ref={termScroll} onClick={() => document.getElementById('vsc-term-input')?.focus()}>
                {termLines.map((l, i) => <div key={i} className="vsc-term-line">{l || ' '}</div>)}
                <div className="vsc-term-prompt">
                  <span className="vsc-term-user">you@aos</span> onboarding-portal %{' '}
                  <input id="vsc-term-input" value={termInput} autoComplete="off" spellCheck={false}
                    onChange={(e) => setTermInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') submitTerm(); }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="vsc-statusbar">
        <span className="vsc-sb-item">{I.branch} main</span>
        <span className="vsc-sb-item">{I.sync}</span>
        <span className="vsc-sb-item">{I.err} 0 {I.warn} 0</span>
        <span className="vsc-sb-spacer" />
        <button type="button" className="vsc-sb-item vsc-sb-btn" onClick={() => setShowTerminal((s) => !s)}>{I.term}</button>
        <span className="vsc-sb-item">Ln {cursor.ln}, Col {cursor.col}</span>
        <span className="vsc-sb-item">Spaces: 2</span>
        <span className="vsc-sb-item">UTF-8</span>
        <span className="vsc-sb-item">LF</span>
        <span className="vsc-sb-item">{active.lang === 'tsx' ? 'TypeScript JSX' : active.lang === 'ts' ? 'TypeScript' : active.lang === 'json' ? 'JSON' : active.lang === 'md' ? 'Markdown' : 'CSS'}</span>
        <span className="vsc-sb-item">Prettier</span>
        <span className="vsc-sb-item">{I.bell}</span>
      </div>
    </div>
  );
}
