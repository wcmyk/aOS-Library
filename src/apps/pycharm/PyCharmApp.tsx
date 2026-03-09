import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Token = {
  type: 'kw' | 'str' | 'cmt' | 'num' | 'fn' | 'tag' | 'attr' | 'op' | 'plain' | 'dec' | 'cls';
  text: string;
};

type ContextMenuState = {
  x: number;
  y: number;
  target: 'file' | 'dir' | 'root';
  path: string;
} | null;

type TerminalLine = { type: 'input' | 'output' | 'error' | 'system'; text: string };

type Dialog =
  | { kind: 'new-file'; parentDir: string }
  | { kind: 'new-dir'; parentDir: string }
  | { kind: 'rename'; path: string; isDir: boolean }
  | null;

// ── Default File System ───────────────────────────────────────────────────────

const DEFAULT_FS: Record<string, string> = {
  'myproject/src/main.py': `from fastapi import FastAPI
from .utils import greet, add

app = FastAPI()


@app.get("/")
async def root():
    return {"message": greet("World")}


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/sum/{a}/{b}")
async def sum_route(a: int, b: int):
    return {"result": add(a, b)}
`,
  'myproject/src/utils.py': `def greet(name: str) -> str:
    """Return a greeting string."""
    return f"Hello, {name}!"


def add(a: int, b: int) -> int:
    """Add two integers."""
    return a + b


def clamp(value: float, lo: float, hi: float) -> float:
    """Clamp a value between lo and hi."""
    return max(lo, min(hi, value))
`,
  'myproject/src/models.py': `from dataclasses import dataclass, field
from typing import Optional, List


@dataclass
class User:
    id: int
    name: str
    email: str
    role: str = "user"
    active: bool = True
    tags: List[str] = field(default_factory=list)

    def display(self) -> str:
        return f"[{self.id}] {self.name} <{self.email}>"


@dataclass
class Project:
    id: int
    title: str
    owner: Optional[User] = None
`,
  'myproject/tests/test_main.py': `import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_sum():
    response = client.get("/sum/3/4")
    assert response.status_code == 200
    assert response.json()["result"] == 7
`,
  'myproject/static/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My App</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="container">
    <h1>Hello from aOS</h1>
    <p class="subtitle">Edit this file and click <strong>Preview</strong> to see changes live.</p>
    <div class="card-row">
      <div class="card">
        <h3>FastAPI</h3>
        <p>High-performance Python web framework.</p>
      </div>
      <div class="card">
        <h3>React</h3>
        <p>Build declarative, component-based UIs.</p>
      </div>
    </div>
    <button onclick="handleClick()">Run Demo</button>
    <p id="output"></p>
  </div>
  <script src="app.js"></script>
</body>
</html>
`,
  'myproject/static/style.css': `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  text-align: center;
  padding: 48px 40px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 600px;
  width: 90%;
}

h1 {
  font-size: 2.2rem;
  margin-bottom: 8px;
  background: linear-gradient(90deg, #7dd3fc, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #94a3b8;
  margin-bottom: 28px;
  font-size: 0.95rem;
}

.card-row {
  display: flex;
  gap: 16px;
  margin-bottom: 28px;
}

.card {
  flex: 1;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  text-align: left;
}

.card h3 {
  font-size: 0.95rem;
  color: #7dd3fc;
  margin-bottom: 6px;
}

.card p {
  font-size: 0.82rem;
  color: #64748b;
}

button {
  padding: 10px 28px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #1d4ed8;
}

#output {
  margin-top: 16px;
  min-height: 24px;
  color: #86efac;
  font-size: 0.9rem;
}
`,
  'myproject/static/app.js': `const messages = [
  "Hello from JavaScript! 👋",
  "aOS is running smoothly! 🚀",
  "Edit index.html to change this page.",
  "HTML + CSS + JS preview is live.",
];

let msgIndex = 0;

function handleClick() {
  const output = document.getElementById("output");
  output.textContent = messages[msgIndex % messages.length];
  msgIndex++;
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("App loaded at", new Date().toLocaleTimeString());
});
`,
  'myproject/requirements.txt': `fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.4.0
pytest>=7.4.0
httpx>=0.25.0
`,
  'myproject/pyproject.toml': `[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-q"

[tool.mypy]
python_version = "3.12"
strict = true
`,
  'myproject/.gitignore': `__pycache__/
*.pyc
.venv/
dist/
.env
*.egg-info/
`,
};

// ── Language Detection ────────────────────────────────────────────────────────

const EXT_LANG: Record<string, string> = {
  py: 'Python',
  js: 'JavaScript',
  ts: 'TypeScript',
  tsx: 'TypeScript JSX',
  jsx: 'JavaScript JSX',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  md: 'Markdown',
  sh: 'Shell',
  txt: 'Plain Text',
  toml: 'TOML',
  gitignore: 'Git',
  yml: 'YAML',
  yaml: 'YAML',
};

const EXT_COLOR: Record<string, string> = {
  py: '#4ec9b0',
  js: '#f7df1e',
  ts: '#3178c6',
  tsx: '#3178c6',
  jsx: '#61dafb',
  html: '#e34c26',
  css: '#563d7c',
  json: '#fbbf24',
  md: '#9ca3af',
  sh: '#86efac',
  toml: '#9f7aea',
  yml: '#f97316',
  yaml: '#f97316',
};

function getExt(path: string) {
  const parts = path.split('.');
  if (parts.length === 1) return '';
  const raw = parts[parts.length - 1].toLowerCase();
  if (path.endsWith('.gitignore')) return 'gitignore';
  return raw;
}

function getLang(path: string) {
  return EXT_LANG[getExt(path)] ?? 'Plain Text';
}

function getColor(path: string) {
  return EXT_COLOR[getExt(path)] ?? '#9ca3af';
}

// ── Syntax Highlighter ────────────────────────────────────────────────────────

const PY_KW = new Set([
  'def','class','import','from','if','elif','else','for','while','return',
  'True','False','None','in','not','and','or','with','as','try','except',
  'finally','raise','pass','break','continue','lambda','yield','async','await',
  'global','nonlocal','del','assert','is','print',
]);
const JS_KW = new Set([
  'const','let','var','function','return','if','else','for','while','do',
  'class','extends','new','this','super','import','export','default','from',
  'async','await','typeof','instanceof','null','undefined','true','false',
  'throw','try','catch','finally','break','continue','switch','case','of','in',
  'static','get','set','yield','void','delete',
]);

function tokenize(code: string, lang: string): Token[][] {
  const lines = code.split('\n');
  return lines.map((line) => tokenizeLine(line, lang));
}

function tokenizeLine(line: string, lang: string): Token[] {
  const l = lang.toLowerCase();
  if (l === 'html') return tokenizeHtml(line);
  if (l === 'css') return tokenizeCss(line);
  if (l.startsWith('javascript') || l.startsWith('typescript')) return tokenizeJs(line);
  if (l === 'python') return tokenizePy(line);
  if (l === 'json') return tokenizeJson(line);
  return [{ type: 'plain', text: line }];
}

function tokenizePy(line: string): Token[] {
  const tokens: Token[] = [];
  let rem = line;
  while (rem.length > 0) {
    // Comment
    if (rem[0] === '#') { tokens.push({ type: 'cmt', text: rem }); break; }
    // Triple-quoted strings (single-line detection only)
    if (rem.startsWith('"""') || rem.startsWith("'''")) {
      const q = rem.slice(0, 3);
      const end = rem.indexOf(q, 3);
      if (end !== -1) { tokens.push({ type: 'str', text: rem.slice(0, end + 3) }); rem = rem.slice(end + 3); continue; }
      tokens.push({ type: 'str', text: rem }); break;
    }
    // f-string prefix
    if ((rem[0] === 'f' || rem[0] === 'F') && (rem[1] === '"' || rem[1] === "'")) {
      const q = rem[1];
      let i = 2;
      while (i < rem.length && rem[i] !== q) { if (rem[i] === '\\') i++; i++; }
      tokens.push({ type: 'str', text: rem.slice(0, i + 1) }); rem = rem.slice(i + 1); continue;
    }
    // Regular strings
    if (rem[0] === '"' || rem[0] === "'") {
      const q = rem[0]; let i = 1;
      while (i < rem.length && rem[i] !== q) { if (rem[i] === '\\') i++; i++; }
      tokens.push({ type: 'str', text: rem.slice(0, i + 1) }); rem = rem.slice(i + 1); continue;
    }
    // Decorator
    if (rem[0] === '@') {
      const m = rem.match(/^@[\w.]+/);
      if (m) { tokens.push({ type: 'dec', text: m[0] }); rem = rem.slice(m[0].length); continue; }
    }
    // Number
    const numM = rem.match(/^\d+(\.\d+)?/);
    if (numM) { tokens.push({ type: 'num', text: numM[0] }); rem = rem.slice(numM[0].length); continue; }
    // Word
    const wordM = rem.match(/^[a-zA-Z_]\w*/);
    if (wordM) {
      const w = wordM[0];
      const type: Token['type'] = PY_KW.has(w) ? 'kw' : rem[w.length] === '(' ? 'fn' : /^[A-Z]/.test(w) ? 'cls' : 'plain';
      tokens.push({ type, text: w }); rem = rem.slice(w.length); continue;
    }
    // Operator
    const opM = rem.match(/^[+\-*/%=<>!&|^~:.]+/);
    if (opM) { tokens.push({ type: 'op', text: opM[0] }); rem = rem.slice(opM[0].length); continue; }
    tokens.push({ type: 'plain', text: rem[0] }); rem = rem.slice(1);
  }
  return tokens;
}

function tokenizeJs(line: string): Token[] {
  const tokens: Token[] = [];
  let rem = line;
  while (rem.length > 0) {
    if (rem.startsWith('//')) { tokens.push({ type: 'cmt', text: rem }); break; }
    if (rem[0] === '"' || rem[0] === "'" || rem[0] === '`') {
      const q = rem[0]; let i = 1;
      while (i < rem.length && rem[i] !== q) { if (rem[i] === '\\') i++; i++; }
      tokens.push({ type: 'str', text: rem.slice(0, i + 1) }); rem = rem.slice(i + 1); continue;
    }
    const numM = rem.match(/^\d+(\.\d+)?/);
    if (numM) { tokens.push({ type: 'num', text: numM[0] }); rem = rem.slice(numM[0].length); continue; }
    const wordM = rem.match(/^[a-zA-Z_$]\w*/);
    if (wordM) {
      const w = wordM[0];
      const type: Token['type'] = JS_KW.has(w) ? 'kw' : rem[w.length] === '(' ? 'fn' : /^[A-Z]/.test(w) ? 'cls' : 'plain';
      tokens.push({ type, text: w }); rem = rem.slice(w.length); continue;
    }
    const opM = rem.match(/^[+\-*/%=<>!&|^~:.?]+/);
    if (opM) { tokens.push({ type: 'op', text: opM[0] }); rem = rem.slice(opM[0].length); continue; }
    tokens.push({ type: 'plain', text: rem[0] }); rem = rem.slice(1);
  }
  return tokens;
}

function tokenizeHtml(line: string): Token[] {
  const tokens: Token[] = [];
  let rem = line;
  while (rem.length > 0) {
    if (rem.startsWith('<!--')) {
      const end = rem.indexOf('-->');
      const text = end !== -1 ? rem.slice(0, end + 3) : rem;
      tokens.push({ type: 'cmt', text }); rem = end !== -1 ? rem.slice(end + 3) : ''; continue;
    }
    if (rem[0] === '<') {
      let i = 1;
      // tag name
      const slash = rem[1] === '/' ? '/' : '';
      const tagMatch = rem.slice(i + (slash ? 1 : 0)).match(/^[\w-]+/);
      tokens.push({ type: 'op', text: rem[0] + slash });
      if (tagMatch) { tokens.push({ type: 'tag', text: tagMatch[0] }); i += tagMatch[0].length + (slash ? 1 : 0); }
      // attrs
      while (i < rem.length && rem[i] !== '>') {
        const attrM = rem.slice(i).match(/^\s+[\w-]+/);
        if (attrM) { tokens.push({ type: 'attr', text: attrM[0] }); i += attrM[0].length; continue; }
        const valM = rem.slice(i).match(/^="[^"]*"/);
        if (valM) { tokens.push({ type: 'str', text: valM[0] }); i += valM[0].length; continue; }
        tokens.push({ type: 'plain', text: rem[i] }); i++;
      }
      if (i < rem.length) { tokens.push({ type: 'op', text: rem[i] }); i++; }
      rem = rem.slice(i); continue;
    }
    const textM = rem.match(/^[^<]+/);
    if (textM) { tokens.push({ type: 'plain', text: textM[0] }); rem = rem.slice(textM[0].length); continue; }
    tokens.push({ type: 'plain', text: rem[0] }); rem = rem.slice(1);
  }
  return tokens;
}

function tokenizeCss(line: string): Token[] {
  const tokens: Token[] = [];
  let rem = line;
  while (rem.length > 0) {
    if (rem.startsWith('/*')) {
      const end = rem.indexOf('*/');
      const text = end !== -1 ? rem.slice(0, end + 2) : rem;
      tokens.push({ type: 'cmt', text }); rem = end !== -1 ? rem.slice(end + 2) : ''; continue;
    }
    if (rem[0] === '"' || rem[0] === "'") {
      const q = rem[0]; let i = 1;
      while (i < rem.length && rem[i] !== q) i++;
      tokens.push({ type: 'str', text: rem.slice(0, i + 1) }); rem = rem.slice(i + 1); continue;
    }
    // Color hex
    const hexM = rem.match(/^#[0-9a-fA-F]{3,8}/);
    if (hexM) { tokens.push({ type: 'num', text: hexM[0] }); rem = rem.slice(hexM[0].length); continue; }
    // Number + unit
    const numM = rem.match(/^\d+(\.\d+)?(px|em|rem|%|vw|vh|s|ms|deg)?/);
    if (numM && numM[0]) { tokens.push({ type: 'num', text: numM[0] }); rem = rem.slice(numM[0].length); continue; }
    // Property name (before colon)
    const propM = rem.match(/^[\w-]+(?=\s*:)/);
    if (propM) { tokens.push({ type: 'attr', text: propM[0] }); rem = rem.slice(propM[0].length); continue; }
    // Selector / at-rule
    const selM = rem.match(/^[@.#\w-]+/);
    if (selM) { tokens.push({ type: 'kw', text: selM[0] }); rem = rem.slice(selM[0].length); continue; }
    tokens.push({ type: 'plain', text: rem[0] }); rem = rem.slice(1);
  }
  return tokens;
}

function tokenizeJson(line: string): Token[] {
  const tokens: Token[] = [];
  let rem = line;
  while (rem.length > 0) {
    if (rem[0] === '"') {
      let i = 1;
      while (i < rem.length && rem[i] !== '"') { if (rem[i] === '\\') i++; i++; }
      // Is it a key (followed by :)?
      const text = rem.slice(0, i + 1);
      const after = rem.slice(i + 1).trimStart();
      tokens.push({ type: after.startsWith(':') ? 'attr' : 'str', text });
      rem = rem.slice(i + 1); continue;
    }
    const m = rem.match(/^(true|false|null)/);
    if (m) { tokens.push({ type: 'kw', text: m[0] }); rem = rem.slice(m[0].length); continue; }
    const numM = rem.match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?/);
    if (numM && numM[0]) { tokens.push({ type: 'num', text: numM[0] }); rem = rem.slice(numM[0].length); continue; }
    tokens.push({ type: 'plain', text: rem[0] }); rem = rem.slice(1);
  }
  return tokens;
}

const TOKEN_COLORS: Record<Token['type'], string> = {
  kw: '#cc7832',
  str: '#6a8759',
  cmt: '#6d6d6d',
  num: '#6897bb',
  fn: '#ffc66d',
  tag: '#e8bf6a',
  attr: '#bababa',
  op: '#cc7832',
  plain: '#a9b7c6',
  dec: '#bbb529',
  cls: '#ffc66d',
};

function HighlightedCode({ tokens, style }: { tokens: Token[]; style?: React.CSSProperties }) {
  return (
    <span style={style}>
      {tokens.map((t, i) => (
        <span key={i} style={{ color: TOKEN_COLORS[t.type] }}>{t.text}</span>
      ))}
    </span>
  );
}

// ── File System Helpers ───────────────────────────────────────────────────────

function getDirs(fs: Record<string, string>): Set<string> {
  const dirs = new Set<string>();
  Object.keys(fs).forEach((p) => {
    const parts = p.split('/');
    for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join('/'));
  });
  return dirs;
}

function getChildren(path: string, allPaths: string[], dirs: Set<string>) {
  const prefix = path === '' ? '' : path + '/';
  const childFiles = allPaths.filter((p) => p.startsWith(prefix) && !p.slice(prefix.length).includes('/'));
  const childDirs = [...dirs].filter((d) => d.startsWith(prefix) && !d.slice(prefix.length).includes('/'));
  return { files: childFiles.sort(), dirs: childDirs.sort() };
}

function parentDir(path: string) {
  const idx = path.lastIndexOf('/');
  return idx === -1 ? '' : path.slice(0, idx);
}

// ── File Icon ─────────────────────────────────────────────────────────────────

function FileIcon({ path, isDir, isOpen }: { path: string; isDir?: boolean; isOpen?: boolean }) {
  if (isDir) return <span style={{ fontSize: 12, marginRight: 4 }}>{isOpen ? '▾' : '▸'}</span>;
  const ext = getExt(path);
  const c = EXT_COLOR[ext] ?? '#9ca3af';
  const labels: Record<string, string> = { py: 'py', js: 'js', ts: 'ts', html: 'ht', css: 'cs', json: '{}', md: 'md', sh: 'sh', toml: 'tm', txt: 'tx' };
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color: c, background: `${c}22`, padding: '1px 3px', borderRadius: 3, marginRight: 5, flexShrink: 0 }}>
      {labels[ext] ?? (ext.slice(0, 2).toUpperCase() || '??')}
    </span>
  );
}

// ── File Tree ─────────────────────────────────────────────────────────────────

function FileTree({
  rootPath,
  allPaths,
  dirs,
  expanded,
  activeTab,
  onSelect,
  onToggleDir,
  onContextMenu,
}: {
  rootPath: string;
  allPaths: string[];
  dirs: Set<string>;
  expanded: Set<string>;
  activeTab: string | null;
  onSelect: (p: string) => void;
  onToggleDir: (p: string) => void;
  onContextMenu: (e: React.MouseEvent, target: 'file' | 'dir', path: string) => void;
}) {
  const { files, dirs: childDirs } = getChildren(rootPath, allPaths, dirs);

  return (
    <div style={{ paddingLeft: rootPath === '' ? 0 : 12 }}>
      {childDirs.map((d) => {
        const name = d.split('/').pop()!;
        const isOpen = expanded.has(d);
        return (
          <div key={d}>
            <div
              className="pycharm-tree-item"
              style={{ display: 'flex', alignItems: 'center', padding: '3px 6px', cursor: 'pointer', borderRadius: 4, userSelect: 'none' }}
              onClick={() => onToggleDir(d)}
              onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, 'dir', d); }}
            >
              <FileIcon path={d} isDir isOpen={isOpen} />
              <span style={{ fontSize: 12, color: '#a9b7c6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
            </div>
            {isOpen && (
              <FileTree
                rootPath={d}
                allPaths={allPaths}
                dirs={dirs}
                expanded={expanded}
                activeTab={activeTab}
                onSelect={onSelect}
                onToggleDir={onToggleDir}
                onContextMenu={onContextMenu}
              />
            )}
          </div>
        );
      })}
      {files.map((f) => {
        const name = f.split('/').pop()!;
        return (
          <div
            key={f}
            className="pycharm-tree-item"
            style={{ display: 'flex', alignItems: 'center', padding: '3px 6px', cursor: 'pointer', borderRadius: 4, background: activeTab === f ? '#214283' : undefined, userSelect: 'none' }}
            onClick={() => onSelect(f)}
            onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, 'file', f); }}
          >
            <FileIcon path={f} />
            <span style={{ fontSize: 12, color: activeTab === f ? '#ffffff' : '#a9b7c6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Code Editor ───────────────────────────────────────────────────────────────

function CodeEditor({
  value,
  onChange,
  lang,
  path,
}: {
  value: string;
  onChange: (v: string) => void;
  lang: string;
  path: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const lines = value.split('\n');
  const tokenLines = useMemo(() => tokenize(value, lang), [value, lang]);

  // Sync textarea scroll to the highlight overlay
  const syncScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Tab key support
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current!;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newValue = value.slice(0, start) + '    ' + value.slice(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
    // Auto-close brackets/quotes
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
    if (pairs[e.key]) {
      const ta = textareaRef.current!;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      if (start === end) {
        e.preventDefault();
        const newValue = value.slice(0, start) + e.key + pairs[e.key] + value.slice(end);
        onChange(newValue);
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 1; });
      }
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', flex: 1, overflow: 'hidden', background: '#2b2b2b' }}>
      {/* Line numbers */}
      <div
        style={{
          width: 52,
          flexShrink: 0,
          background: '#313335',
          borderRight: '1px solid #1e1e1e',
          overflow: 'hidden',
          paddingTop: 10,
          paddingBottom: 10,
          fontSize: 12,
          lineHeight: '21px',
          color: '#606060',
          textAlign: 'right',
          paddingRight: 8,
          userSelect: 'none',
          fontFamily: "'JetBrains Mono','SF Mono','Fira Code',monospace",
        }}
        id={`gutter-${path}`}
      >
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>

      {/* Editor area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Syntax-highlighted overlay (behind textarea) */}
        <div
          ref={preRef}
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            padding: '10px 12px',
            fontSize: 13,
            lineHeight: '21px',
            fontFamily: "'JetBrains Mono','SF Mono','Fira Code',monospace",
            whiteSpace: 'pre',
            overflow: 'hidden',
            pointerEvents: 'none',
            color: '#a9b7c6',
          }}
        >
          {tokenLines.map((toks, i) => (
            <div key={i} style={{ minHeight: 21 }}>
              <HighlightedCode tokens={toks} />
            </div>
          ))}
        </div>

        {/* Textarea (transparent text, on top) */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={() => {
            syncScroll();
            // Sync line number gutter
            const el = document.getElementById(`gutter-${path}`);
            if (el && textareaRef.current) el.scrollTop = textareaRef.current.scrollTop;
          }}
          spellCheck={false}
          style={{
            position: 'absolute',
            inset: 0,
            padding: '10px 12px',
            fontSize: 13,
            lineHeight: '21px',
            fontFamily: "'JetBrains Mono','SF Mono','Fira Code',monospace",
            whiteSpace: 'pre',
            background: 'transparent',
            color: 'transparent',
            caretColor: '#a9b7c6',
            border: 'none',
            outline: 'none',
            resize: 'none',
            overflow: 'auto',
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );
}

// ── Terminal ──────────────────────────────────────────────────────────────────

function Terminal({
  lines,
  input,
  onInput,
  onSubmit,
}: {
  lines: TerminalLine[];
  input: string;
  onInput: (v: string) => void;
  onSubmit: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);

  const lineColors: Record<TerminalLine['type'], string> = {
    input: '#a9b7c6',
    output: '#9ece6a',
    error: '#f7768e',
    system: '#7dcfff',
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1e1f22', fontFamily: "'JetBrains Mono','SF Mono',monospace", fontSize: 12 }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
        {lines.map((l, i) => (
          <div key={i} style={{ color: lineColors[l.type], lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {l.type === 'input' ? <span><span style={{ color: '#5af78e' }}>❯ </span>{l.text}</span> : l.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ borderTop: '1px solid #2d2d2d', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#5af78e', fontSize: 12 }}>❯</span>
        <input
          value={input}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }}
          placeholder="Type a command..."
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#a9b7c6', fontSize: 12, fontFamily: 'inherit' }}
        />
      </div>
    </div>
  );
}

// ── Dialog (New File / New Dir / Rename) ──────────────────────────────────────

function FileDialog({
  dialog,
  onConfirm,
  onCancel,
}: {
  dialog: Exclude<Dialog, null>;
  onConfirm: (name: string, lang?: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(dialog.kind === 'rename' ? dialog.path.split('/').pop()! : '');
  const [lang, setLang] = useState('py');

  const isNewFile = dialog.kind === 'new-file';
  const isNewDir = dialog.kind === 'new-dir';
  const isRename = dialog.kind === 'rename';

  const langExts = Object.entries(EXT_LANG).map(([ext, label]) => ({ ext, label }));

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (isNewFile) {
      const hasExt = trimmed.includes('.');
      onConfirm(hasExt ? trimmed : `${trimmed}.${lang}`, lang);
    } else {
      onConfirm(trimmed);
    }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#3c3f41', border: '1px solid #515658', borderRadius: 8, padding: 20, width: 360, boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb', marginBottom: 14 }}>
          {isNewFile ? 'New File' : isNewDir ? 'New Directory' : 'Rename'}
        </div>
        {isNewFile && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Language / File Type</div>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              style={{ width: '100%', background: '#2b2b2b', color: '#a9b7c6', border: '1px solid #515658', borderRadius: 4, padding: '6px 8px', fontSize: 12 }}
            >
              {langExts.map(({ ext, label }) => (
                <option key={ext} value={ext}>{label} (.{ext})</option>
              ))}
            </select>
          </div>
        )}
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
          {isRename ? 'New name' : isNewDir ? 'Directory name' : 'File name'}
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') onCancel(); }}
          placeholder={isNewFile ? `my_file.${lang}` : isNewDir ? 'my_folder' : ''}
          style={{ width: '100%', background: '#2b2b2b', color: '#a9b7c6', border: '1px solid #515658', borderRadius: 4, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 14 }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onCancel} style={{ padding: '6px 16px', background: '#4c4f52', border: '1px solid #585b5d', borderRadius: 4, color: '#a9b7c6', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
          <button type="button" onClick={handleConfirm} style={{ padding: '6px 16px', background: '#365880', border: '1px solid #4878a8', borderRadius: 4, color: '#ffffff', fontSize: 12, cursor: 'pointer' }}>
            {isRename ? 'Rename' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Context Menu ──────────────────────────────────────────────────────────────

function ContextMenu({
  state,
  onAction,
  onClose,
}: {
  state: ContextMenuState;
  onAction: (action: string, path: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [onClose]);

  if (!state) return null;

  const items: { label: string; action: string; sep?: boolean }[] = [];
  if (state.target === 'file') {
    items.push(
      { label: 'Open', action: 'open' },
      { label: 'Rename...', action: 'rename', sep: true },
      { label: 'Delete', action: 'delete' },
      { label: 'Copy Path', action: 'copy-path', sep: true },
      { label: 'New File Here...', action: 'new-file' },
      { label: 'New Directory Here...', action: 'new-dir' },
    );
  } else if (state.target === 'dir') {
    items.push(
      { label: 'New File...', action: 'new-file' },
      { label: 'New Directory...', action: 'new-dir', sep: true },
      { label: 'Rename...', action: 'rename' },
      { label: 'Delete Directory', action: 'delete', sep: true },
      { label: 'Copy Path', action: 'copy-path' },
    );
  } else {
    items.push(
      { label: 'New File...', action: 'new-file' },
      { label: 'New Directory...', action: 'new-dir' },
    );
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: state.x,
        top: state.y,
        background: '#3c3f41',
        border: '1px solid #515658',
        borderRadius: 6,
        padding: '4px 0',
        minWidth: 200,
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        zIndex: 100,
      }}
    >
      {items.map((item, i) => (
        <div key={i}>
          {item.sep && i > 0 && <div style={{ height: 1, background: '#515658', margin: '4px 0' }} />}
          <div
            className="pycharm-ctx-item"
            style={{ padding: '6px 16px', fontSize: 12, color: '#a9b7c6', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => { onAction(item.action, state.path); onClose(); }}
          >
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── HTML Preview ──────────────────────────────────────────────────────────────

function HtmlPreview({ html, css, js }: { html: string; css?: string; js?: string }) {
  // Inline css/js into HTML before rendering
  const combinedHtml = useMemo(() => {
    let doc = html;
    if (css) {
      const tag = `<style>\n${css}\n</style>`;
      doc = doc.replace(/<link[^>]+rel="stylesheet"[^>]*>/gi, tag);
      if (!doc.includes('<style')) doc = doc.replace('</head>', `${tag}\n</head>`);
    }
    if (js) {
      const tag = `<script>\n${js}\n</script>`;
      doc = doc.replace(/<script[^>]+src="app\.js"[^>]*><\/script>/gi, tag);
      if (!doc.includes('<script')) doc = doc.replace('</body>', `${tag}\n</body>`);
    }
    return doc;
  }, [html, css, js]);

  return (
    <iframe
      srcDoc={combinedHtml}
      sandbox="allow-scripts"
      style={{ width: '100%', height: '100%', border: 'none', background: 'white' }}
      title="HTML Preview"
    />
  );
}

// ── Terminal Command Processor ────────────────────────────────────────────────

function processCommand(
  cmd: string,
  fs: Record<string, string>,
  cwd: string,
): { output: string; type: TerminalLine['type']; newCwd?: string } {
  const parts = cmd.trim().split(/\s+/);
  const exe = parts[0];
  const args = parts.slice(1);

  switch (exe) {
    case 'ls': {
      const dir = args[0] ?? cwd;
      const entries = [
        ...[...getDirs(fs)].filter((d) => d.startsWith(dir + '/') && !d.slice(dir.length + 1).includes('/')).map((d) => d.split('/').pop()! + '/'),
        ...Object.keys(fs).filter((f) => f.startsWith(dir + '/') && !f.slice(dir.length + 1).includes('/')).map((f) => f.split('/').pop()!),
      ];
      return { output: entries.join('  ') || '(empty)', type: 'output' };
    }
    case 'pwd':
      return { output: '/' + cwd, type: 'output' };
    case 'cat': {
      const path = args[0] ? (args[0].startsWith('/') ? args[0].slice(1) : `${cwd}/${args[0]}`) : '';
      const content = fs[path] ?? fs[`${cwd}/${args[0]}`];
      return content != null ? { output: content, type: 'output' } : { output: `cat: ${args[0]}: No such file`, type: 'error' };
    }
    case 'cd': {
      const target = args[0] ?? 'myproject';
      const newDir = target === '..' ? parentDir(cwd) : target.startsWith('/') ? target.slice(1) : `${cwd}/${target}`;
      const exists = [...getDirs(fs)].some((d) => d === newDir) || newDir === '';
      return exists ? { output: '', type: 'output', newCwd: newDir } : { output: `cd: ${target}: No such directory`, type: 'error' };
    }
    case 'python':
    case 'python3': {
      const file = args[0];
      if (!file) return { output: 'Python 3.12.0 (interactive mode not supported)', type: 'system' };
      const filePath = file.startsWith('/') ? file.slice(1) : `${cwd}/${file}`;
      if (!fs[filePath]) return { output: `python: can't open file '${file}': [Errno 2] No such file or directory`, type: 'error' };
      return { output: `Running ${file}...\nHello, World!\n(Simulated Python execution)`, type: 'output' };
    }
    case 'pytest': {
      return {
        output: [
          'collected 3 items',
          '',
          'tests/test_main.py ...                      [100%]',
          '',
          '============================== 3 passed in 0.14s ==============================',
        ].join('\n'),
        type: 'output',
      };
    }
    case 'pip': {
      if (args[0] === 'install' && args[1] === '-r') return { output: `Reading ${args[2] ?? 'requirements.txt'}...\nInstalling packages...\nSuccessfully installed all packages.`, type: 'output' };
      return { output: `pip: running in simulation mode`, type: 'system' };
    }
    case 'uvicorn': {
      return { output: `INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)\nINFO:     Started reloader process\nINFO:     Application startup complete.`, type: 'output' };
    }
    case 'node': {
      const file = args[0];
      if (!file) return { output: 'Welcome to Node.js (simulation)', type: 'system' };
      const filePath = file.startsWith('/') ? file.slice(1) : `${cwd}/${file}`;
      if (!fs[filePath]) return { output: `node: ${file}: No such file or directory`, type: 'error' };
      return { output: `App loaded at ${new Date().toLocaleTimeString()}\n(Simulated Node.js execution)`, type: 'output' };
    }
    case 'echo':
      return { output: args.join(' '), type: 'output' };
    case 'clear':
      return { output: '\x1b[clear]', type: 'system' };
    case 'help':
      return {
        output: [
          'Available commands:',
          '  ls [dir]          List directory contents',
          '  cd <dir>          Change directory',
          '  pwd               Print working directory',
          '  cat <file>        Display file contents',
          '  python <file>     Run a Python file',
          '  pytest            Run test suite',
          '  pip install -r    Install requirements',
          '  uvicorn <module>  Start FastAPI server',
          '  node <file>       Run a JavaScript file',
          '  echo <text>       Print text',
          '  clear             Clear terminal',
        ].join('\n'),
        type: 'system',
      };
    case '':
      return { output: '', type: 'output' };
    default:
      return { output: `${exe}: command not found. Type 'help' for available commands.`, type: 'error' };
  }
}

// ── Main App ──────────────────────────────────────────────────────────────────

export function PyCharmApp() {
  const [fs, setFs] = useState<Record<string, string>>(DEFAULT_FS);
  const [openTabs, setOpenTabs] = useState<string[]>(['myproject/static/index.html', 'myproject/src/main.py']);
  const [activeTab, setActiveTab] = useState<string>('myproject/src/main.py');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['myproject', 'myproject/src', 'myproject/static', 'myproject/tests']));
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [bottomPane, setBottomPane] = useState<'terminal' | 'problems'>('terminal');
  const [termLines, setTermLines] = useState<TerminalLine[]>([
    { type: 'system', text: 'PyCharm Terminal  —  Python 3.12.0' },
    { type: 'system', text: "Type 'help' for available commands." },
    { type: 'output', text: '' },
  ]);
  const [termInput, setTermInput] = useState('');
  const [cwd, setCwd] = useState('myproject');
  const [isRunning, setIsRunning] = useState(false);
  const execIframeRef = useRef<HTMLIFrameElement | null>(null);

  const dirs = useMemo(() => getDirs(fs), [fs]);
  const allPaths = useMemo(() => Object.keys(fs).sort(), [fs]);

  const activeContent = activeTab ? (fs[activeTab] ?? '') : '';
  const activeLang = activeTab ? getLang(activeTab) : 'Plain Text';
  const activeExt = activeTab ? getExt(activeTab) : '';

  // Check if active file is an HTML file (for preview)
  const isHtmlFile = activeExt === 'html';

  // For HTML preview: find associated CSS/JS in the same directory
  const previewCss = useMemo(() => {
    if (!isHtmlFile) return undefined;
    const dir = parentDir(activeTab);
    return Object.entries(fs).find(([p]) => p.startsWith(dir) && getExt(p) === 'css')?.[1];
  }, [isHtmlFile, activeTab, fs]);
  const previewJs = useMemo(() => {
    if (!isHtmlFile) return undefined;
    const dir = parentDir(activeTab);
    return Object.entries(fs).find(([p]) => p.startsWith(dir) && getExt(p) === 'js')?.[1];
  }, [isHtmlFile, activeTab, fs]);

  const openFile = useCallback((path: string) => {
    if (!openTabs.includes(path)) setOpenTabs((t) => [...t, path]);
    setActiveTab(path);
    setShowPreview(false);
  }, [openTabs]);

  const closeTab = useCallback((path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = openTabs.indexOf(path);
    const newTabs = openTabs.filter((t) => t !== path);
    setOpenTabs(newTabs);
    if (activeTab === path) setActiveTab(newTabs[Math.min(idx, newTabs.length - 1)] ?? null!);
  }, [openTabs, activeTab]);

  const updateContent = useCallback((path: string, value: string) => {
    setFs((prev) => ({ ...prev, [path]: value }));
  }, []);

  // Context menu handlers
  const handleContextMenu = useCallback((e: React.MouseEvent, target: 'file' | 'dir', path: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, target, path });
  }, []);

  const handleRootContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, target: 'root', path: 'myproject' });
  }, []);

  const handleContextAction = useCallback((action: string, path: string) => {
    if (action === 'open') { openFile(path); return; }
    if (action === 'copy-path') { navigator.clipboard.writeText(path).catch(() => {}); return; }
    if (action === 'delete') {
      if (fs[path] !== undefined) {
        const newFs = { ...fs };
        delete newFs[path];
        setFs(newFs);
        setOpenTabs((t) => t.filter((tab) => tab !== path));
        if (activeTab === path) setActiveTab(Object.keys(newFs)[0] ?? null!);
      } else {
        // Directory delete
        const newFs = Object.fromEntries(Object.entries(fs).filter(([p]) => !p.startsWith(path + '/')));
        setFs(newFs);
        setOpenTabs((t) => t.filter((tab) => !tab.startsWith(path + '/')));
      }
      return;
    }
    if (action === 'rename') {
      setDialog({ kind: 'rename', path, isDir: fs[path] === undefined });
      return;
    }
    if (action === 'new-file') {
      const parentPath = fs[path] !== undefined ? parentDir(path) : path;
      setDialog({ kind: 'new-file', parentDir: parentPath });
      if (fs[path] === undefined) setExpanded((e) => new Set([...e, path]));
      return;
    }
    if (action === 'new-dir') {
      const parentPath = fs[path] !== undefined ? parentDir(path) : path;
      setDialog({ kind: 'new-dir', parentDir: parentPath });
      if (fs[path] === undefined) setExpanded((e) => new Set([...e, path]));
    }
  }, [fs, openFile, activeTab]);

  const handleDialogConfirm = useCallback((name: string) => {
    if (!dialog) return;
    if (dialog.kind === 'new-file') {
      const fullPath = `${dialog.parentDir}/${name}`;
      setFs((prev) => ({ ...prev, [fullPath]: '' }));
      openFile(fullPath);
    } else if (dialog.kind === 'new-dir') {
      // Just expand to show the new directory (it'll appear once a file is added)
      const fullPath = `${dialog.parentDir}/${name}`;
      setFs((prev) => ({ ...prev, [`${fullPath}/.gitkeep`]: '' }));
      setExpanded((e) => new Set([...e, fullPath]));
    } else if (dialog.kind === 'rename') {
      const oldPath = dialog.path;
      const newPath = `${parentDir(oldPath)}/${name}`;
      if (dialog.isDir) {
        const newFs = Object.fromEntries(
          Object.entries(fs).map(([p, v]) => p.startsWith(oldPath + '/') ? [p.replace(oldPath, newPath), v] : [p, v])
        );
        setFs(newFs);
        setOpenTabs((tabs) => tabs.map((t) => t.startsWith(oldPath + '/') ? t.replace(oldPath, newPath) : t));
        if (activeTab.startsWith(oldPath + '/')) setActiveTab((t) => t.replace(oldPath, newPath));
      } else {
        const content = fs[oldPath] ?? '';
        const newFs = { ...fs, [newPath]: content };
        delete newFs[oldPath];
        setFs(newFs);
        setOpenTabs((tabs) => tabs.map((t) => t === oldPath ? newPath : t));
        if (activeTab === oldPath) setActiveTab(newPath);
      }
    }
    setDialog(null);
  }, [dialog, fs, openFile, activeTab]);

  // Terminal
  const submitCommand = useCallback(() => {
    const cmd = termInput.trim();
    setTermLines((l) => [...l, { type: 'input', text: cmd }]);
    setTermInput('');
    if (cmd === 'clear') { setTermLines([{ type: 'system', text: 'Terminal cleared.' }]); return; }
    const result = processCommand(cmd, fs, cwd);
    if (result.newCwd !== undefined) setCwd(result.newCwd);
    if (result.output) setTermLines((l) => [...l, { type: result.type, text: result.output }]);
  }, [termInput, fs, cwd]);

  // Real code execution via sandboxed iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const data = e.data as { type: string; text?: string };
      if (!data || typeof data !== 'object') return;
      if (data.type === 'output') {
        setTermLines((l) => [...l, { type: 'output', text: data.text ?? '' }]);
      } else if (data.type === 'error') {
        setTermLines((l) => [...l, { type: 'error', text: data.text ?? 'Error' }]);
        setIsRunning(false);
      } else if (data.type === 'done') {
        setTermLines((l) => [...l, { type: 'system', text: '\nProcess finished with exit code 0' }]);
        setIsRunning(false);
      } else if (data.type === 'ready') {
        // Iframe ready — send code to run
        execIframeRef.current?.contentWindow?.postMessage({ type: 'run', code: execIframeRef.current.dataset.code }, '*');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleRun = useCallback(() => {
    if (!activeTab || isRunning) return;
    const ext = getExt(activeTab);
    const code = fs[activeTab] ?? '';
    const filename = activeTab.split('/').pop() ?? activeTab;

    if (ext === 'html') {
      setShowPreview(true);
      return;
    }

    setBottomPane('terminal');
    setIsRunning(true);
    setTermLines((l) => [
      ...l,
      { type: 'system', text: `\n▶ Running ${filename}...` },
    ]);

    if (ext === 'py') {
      const srcdoc = `<!DOCTYPE html><html><head>
<script src="https://skulpt.org/js/skulpt.min.js"><\/script>
<script src="https://skulpt.org/js/skulpt-stdlib.js"><\/script>
<\/head><body><script>
window.addEventListener('message', function(e) {
  if (!e.data || e.data.type !== 'run') return;
  var code = e.data.code;
  Sk.configure({
    output: function(t) { parent.postMessage({ type: 'output', text: t }, '*'); },
    read: function(x) {
      if (Sk.builtinFiles===undefined || Sk.builtinFiles['files'][x]===undefined)
        throw 'File not found: '+x;
      return Sk.builtinFiles['files'][x];
    }
  });
  Sk.misceval.asyncToPromise(function() {
    return Sk.importMainWithBody('<stdin>', false, code, true);
  }).then(function() {
    parent.postMessage({ type: 'done' }, '*');
  }, function(err) {
    parent.postMessage({ type: 'error', text: err.toString() }, '*');
  });
});
parent.postMessage({ type: 'ready' }, '*');
<\/script></body></html>`;
      const iframe = execIframeRef.current!;
      iframe.dataset.code = code;
      iframe.srcdoc = srcdoc;
    } else if (ext === 'js' || ext === 'ts') {
      const srcdoc = `<!DOCTYPE html><html><body><script>
window.console = {
  log: function() { parent.postMessage({ type: 'output', text: Array.from(arguments).map(String).join(' ')+'\\n' }, '*'); },
  error: function() { parent.postMessage({ type: 'error', text: Array.from(arguments).map(String).join(' ')+'\\n' }, '*'); },
  warn: function() { parent.postMessage({ type: 'output', text: '[warn] '+Array.from(arguments).map(String).join(' ')+'\\n' }, '*'); },
  info: function() { parent.postMessage({ type: 'output', text: Array.from(arguments).map(String).join(' ')+'\\n' }, '*'); }
};
window.addEventListener('message', function(e) {
  if (!e.data || e.data.type !== 'run') return;
  try {
    (new Function(e.data.code))();
    parent.postMessage({ type: 'done' }, '*');
  } catch(err) {
    parent.postMessage({ type: 'error', text: err.toString() }, '*');
  }
});
parent.postMessage({ type: 'ready' }, '*');
<\/script></body></html>`;
      const iframe = execIframeRef.current!;
      iframe.dataset.code = code;
      iframe.srcdoc = srcdoc;
    } else {
      setTermLines((l) => [...l, { type: 'error', text: `Cannot run .${ext} files directly. Supported: .py .js .ts .html` }]);
      setIsRunning(false);
    }
  }, [activeTab, isRunning, fs]);

  const toggleDir = useCallback((path: string) => {
    setExpanded((e) => {
      const n = new Set(e);
      n.has(path) ? n.delete(path) : n.add(path);
      return n;
    });
  }, []);

  const problems = useMemo(() => {
    const issues: { file: string; line: number; msg: string; type: 'error' | 'warning' }[] = [];
    Object.entries(fs).forEach(([path, content]) => {
      if (getExt(path) !== 'py') return;
      content.split('\n').forEach((line, i) => {
        if (line.trim().startsWith('print ') && !line.trim().startsWith('print('))
          issues.push({ file: path.split('/').pop()!, line: i + 1, msg: 'Use print() function', type: 'warning' });
        if (line.includes('import *'))
          issues.push({ file: path.split('/').pop()!, line: i + 1, msg: 'Avoid wildcard imports', type: 'warning' });
      });
    });
    return issues;
  }, [fs]);

  return (
    <div
      style={{ height: '100%', background: '#1e1f22', color: '#a9b7c6', display: 'grid', gridTemplateRows: '38px 1fr 200px 24px', fontFamily: "'JetBrains Mono','SF Mono','Fira Code',monospace", overflow: 'hidden', position: 'relative' }}
      onContextMenu={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); } }}
    >
      {/* ── Toolbar ── */}
      <header style={{ background: '#3c3f41', borderBottom: '1px solid #2b2d31', display: 'flex', alignItems: 'center', padding: '0 8px', gap: 4, fontSize: 12, flexShrink: 0 }}>
        <span style={{ color: '#4ec9b0', fontWeight: 700, marginRight: 8, fontSize: 13 }}>PyCharm</span>
        {['File', 'Edit', 'View', 'Navigate', 'Code', 'Refactor', 'Run', 'Tools', 'Help'].map((m) => (
          <button key={m} type="button" style={{ padding: '4px 8px', background: 'none', border: 'none', color: '#a9b7c6', fontSize: 12, cursor: 'pointer', borderRadius: 4 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#4c4f52')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >{m}</button>
        ))}
        <div style={{ flex: 1 }} />
        {isHtmlFile && (
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            style={{ padding: '4px 10px', background: showPreview ? '#365880' : '#4c4f52', border: 'none', color: '#ffffff', borderRadius: 4, fontSize: 11, cursor: 'pointer', marginRight: 4 }}
          >
            ⬛ {showPreview ? 'Preview On' : 'Preview'}
          </button>
        )}
        <button
          type="button"
          onClick={handleRun}
          disabled={isRunning || !activeTab}
          title={`Run ${activeTab ? activeTab.split('/').pop() : ''}`}
          style={{ padding: '4px 12px', background: isRunning ? '#2d6a2d' : '#30a030', border: 'none', color: '#ffffff', borderRadius: 4, fontSize: 11, cursor: isRunning ? 'default' : 'pointer', fontWeight: 600, opacity: !activeTab ? 0.5 : 1 }}
        >
          {isRunning ? '⏳ Running…' : '▶ Run'}
        </button>
      </header>

      {/* ── Main Area ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', overflow: 'hidden' }}>
        {/* Project Sidebar */}
        <aside
          style={{ borderRight: '1px solid #2b2d31', background: '#1e1f22', overflow: 'auto', display: 'flex', flexDirection: 'column' }}
          onContextMenu={handleRootContextMenu}
        >
          <div style={{ padding: '8px 10px 4px', fontSize: 11, color: '#6d6d6d', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>Project</div>
          <div style={{ flex: 1 }}>
            <FileTree
              rootPath=""
              allPaths={allPaths}
              dirs={dirs}
              expanded={expanded}
              activeTab={activeTab}
              onSelect={openFile}
              onToggleDir={toggleDir}
              onContextMenu={handleContextMenu}
            />
          </div>
        </aside>

        {/* Editor + Preview */}
        <div style={{ display: 'grid', gridTemplateColumns: showPreview && isHtmlFile ? '1fr 1fr' : '1fr', overflow: 'hidden' }}>
          {/* Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: showPreview && isHtmlFile ? '1px solid #2b2d31' : 'none' }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', background: '#2b2b2b', borderBottom: '1px solid #1a1a1a', overflow: 'auto', flexShrink: 0 }}>
              {openTabs.map((tab) => {
                const name = tab.split('/').pop()!;
                const isActive = tab === activeTab;
                return (
                  <div
                    key={tab}
                    onClick={() => { setActiveTab(tab); setShowPreview(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px 0 8px', height: 32, cursor: 'pointer', background: isActive ? '#2b2b2b' : '#3c3f41', borderRight: '1px solid #1a1a1a', borderTop: isActive ? `2px solid ${getColor(tab)}` : '2px solid transparent', flexShrink: 0 }}
                  >
                    <FileIcon path={tab} />
                    <span style={{ fontSize: 12, color: isActive ? '#ffffff' : '#888' }}>{name}</span>
                    <button
                      type="button"
                      onClick={(e) => closeTab(tab, e)}
                      style={{ marginLeft: 2, background: 'none', border: 'none', color: '#666', fontSize: 11, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
                    >✕</button>
                  </div>
                );
              })}
              {openTabs.length === 0 && (
                <div style={{ padding: '8px 14px', fontSize: 11, color: '#606060' }}>No files open</div>
              )}
            </div>

            {/* Code Editor */}
            {activeTab && (
              <CodeEditor
                key={activeTab}
                value={activeContent}
                onChange={(v) => updateContent(activeTab, v)}
                lang={activeLang}
                path={activeTab}
              />
            )}
            {!activeTab && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4c4f52', fontSize: 13 }}>
                Open a file from the project panel
              </div>
            )}
          </div>

          {/* HTML Preview Pane */}
          {showPreview && isHtmlFile && (
            <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '6px 12px', background: '#2b2b2b', borderBottom: '1px solid #1a1a1a', fontSize: 11, color: '#6d6d6d', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Live Preview — {activeTab.split('/').pop()}</span>
                <button type="button" onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', color: '#6d6d6d', cursor: 'pointer', fontSize: 13 }}>✕</button>
              </div>
              <HtmlPreview html={activeContent} css={previewCss} js={previewJs} />
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Pane ── */}
      <div style={{ borderTop: '1px solid #2b2d31', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', background: '#2b2b2b', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
          {(['terminal', 'problems'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setBottomPane(tab)}
              style={{ padding: '5px 14px', background: bottomPane === tab ? '#1e1f22' : 'transparent', border: 'none', borderTop: bottomPane === tab ? '2px solid #4ec9b0' : '2px solid transparent', color: bottomPane === tab ? '#e5e7eb' : '#6d6d6d', fontSize: 11, cursor: 'pointer', textTransform: 'capitalize' }}
            >
              {tab === 'problems' ? `Problems (${problems.length})` : 'Terminal'}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {bottomPane === 'terminal' ? (
            <Terminal lines={termLines} input={termInput} onInput={setTermInput} onSubmit={submitCommand} />
          ) : (
            <div style={{ overflow: 'auto', height: '100%', padding: 8 }}>
              {problems.length === 0 && <div style={{ color: '#6d6d6d', fontSize: 12, padding: 8 }}>No problems detected.</div>}
              {problems.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 8px', fontSize: 12, color: p.type === 'error' ? '#f7768e' : '#e0af68', borderRadius: 4 }}>
                  <span>{p.type === 'error' ? '✗' : '⚠'}</span>
                  <span style={{ color: '#a9b7c6' }}>{p.file}:{p.line}</span>
                  <span>{p.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Status Bar ── */}
      <footer style={{ borderTop: '1px solid #1a1a1a', background: '#3c3f41', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', fontSize: 11, color: '#6d6d6d', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ color: getColor(activeTab ?? '') }}>{activeLang}</span>
          <span>UTF-8</span>
          <span>LF</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>{activeTab ? `/${cwd}` : ''}</span>
          <span>Python 3.12</span>
          <span style={{ color: problems.length > 0 ? '#e0af68' : '#6d6d6d' }}>
            {problems.length > 0 ? `⚠ ${problems.length} warning${problems.length > 1 ? 's' : ''}` : '✓ No problems'}
          </span>
        </div>
      </footer>

      {/* ── Hidden Execution Iframe ── */}
      <iframe
        ref={execIframeRef}
        title="code-runner"
        sandbox="allow-scripts"
        style={{ display: 'none', width: 0, height: 0, border: 'none' }}
      />

      {/* ── Context Menu ── */}
      <ContextMenu state={contextMenu} onAction={handleContextAction} onClose={() => setContextMenu(null)} />

      {/* ── File Dialog ── */}
      {dialog && <FileDialog dialog={dialog} onConfirm={handleDialogConfirm} onCancel={() => setDialog(null)} />}

      <style>{`
        .pycharm-tree-item:hover { background: rgba(255,255,255,0.06) !important; }
        .pycharm-ctx-item:hover { background: #365880 !important; color: #ffffff !important; }
      `}</style>
    </div>
  );
}
