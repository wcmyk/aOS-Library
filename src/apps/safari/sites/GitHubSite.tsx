import { useState } from 'react';
import { useProfileStore } from '../../../state/useProfileStore';
import './github.css';

// github.com — repository home for the user's project: header with global
// search, repo tabs (Code / Issues / Pull requests / Actions), file tree with
// latest-commit metadata, rendered README, and the About sidebar.

export function GitHubMark({ size = 24, color = '#1f2328' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path fill={color} d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

const Ic = {
  folder: <svg width="16" height="16" viewBox="0 0 16 16" fill="#54aeff"><path d="M1.75 1h5.5c.55 0 1.07.26 1.4.7l.9 1.2a.25.25 0 0 0 .2.1h4.5c.97 0 1.75.78 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25V2.75C0 1.78.78 1 1.75 1z" /></svg>,
  file: <svg width="16" height="16" viewBox="0 0 16 16" fill="#636c76"><path d="M2 1.75C2 .78 2.78 0 3.75 0h6.59c.46 0 .9.18 1.24.51l2.91 2.91c.33.33.51.78.51 1.24v9.59A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .14.11.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5zm6.75.06V4.25c0 .14.11.25.25.25h2.69z" /></svg>,
  star: (filled: boolean) => <svg width="16" height="16" viewBox="0 0 16 16" fill={filled ? '#eac54f' : '#636c76'}><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z" /></svg>,
  eye: <svg width="16" height="16" viewBox="0 0 16 16" fill="#636c76"><path d="M8 2c1.98 0 3.73.9 5.02 1.95 1.29 1.05 2.19 2.3 2.65 3.19a1.9 1.9 0 0 1 0 1.72c-.46.9-1.36 2.14-2.65 3.19C11.73 13.1 9.98 14 8 14s-3.73-.9-5.02-1.95C1.69 11 .79 9.76.33 8.86a1.9 1.9 0 0 1 0-1.72C.79 6.25 1.69 5 2.98 3.95 4.27 2.9 6.02 2 8 2zM8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" /></svg>,
  fork: <svg width="16" height="16" viewBox="0 0 16 16" fill="#636c76"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0zM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0z" /></svg>,
  issue: (color = '#636c76') => <svg width="16" height="16" viewBox="0 0 16 16" fill={color}><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" /><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0z" /></svg>,
  pr: (color = '#636c76') => <svg width="16" height="16" viewBox="0 0 16 16" fill={color}><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354zM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm8.5.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0z" /></svg>,
  play: <svg width="16" height="16" viewBox="0 0 16 16" fill="#636c76"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215z" /></svg>,
  book: <svg width="16" height="16" viewBox="0 0 16 16" fill="#636c76"><path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75z" /></svg>,
  check: <svg width="14" height="14" viewBox="0 0 16 16" fill="#1a7f37"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" /></svg>,
  clock: <svg width="16" height="16" viewBox="0 0 16 16" fill="#636c76"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0zm7.25-3.25v3.06l2.22 2.22a.75.75 0 1 1-1.06 1.06l-2.44-2.44A.75.75 0 0 1 7.25 8V4.75a.75.75 0 0 1 1.5 0z" /></svg>,
};

type RepoTab = 'code' | 'issues' | 'pulls' | 'actions';

const TREE: Array<{ type: 'dir' | 'file'; name: string; msg: string; time: string }> = [
  { type: 'dir', name: '.github/workflows', msg: 'ci: add typecheck and build workflow', time: '2 weeks ago' },
  { type: 'dir', name: 'public/assets', msg: 'assets: add brand banners and people photos', time: 'yesterday' },
  { type: 'dir', name: 'src/apps', msg: 'feat: Teams org-locked tenant sign-in', time: '3 hours ago' },
  { type: 'dir', name: 'src/data', msg: 'feat: Amazon catalog with 100 products', time: '3 hours ago' },
  { type: 'dir', name: 'src/state', msg: 'feat: Claude plan tiers in dev store', time: '2 hours ago' },
  { type: 'file', name: '.gitignore', msg: 'chore: initial scaffold', time: '4 months ago' },
  { type: 'file', name: 'README.md', msg: 'docs: refresh setup instructions', time: 'last week' },
  { type: 'file', name: 'index.html', msg: 'chore: initial scaffold', time: '4 months ago' },
  { type: 'file', name: 'package.json', msg: 'build: bump vite to 6.x', time: '3 weeks ago' },
  { type: 'file', name: 'tsconfig.json', msg: 'chore: strict mode', time: '4 months ago' },
  { type: 'file', name: 'vite.config.ts', msg: 'build: base path for pages deploy', time: '3 weeks ago' },
];

const ISSUES = [
  { n: 214, title: 'Workday check preview clips on small windows', labels: [['bug', '#d73a4a']], time: 'opened 2 days ago', comments: 3 },
  { n: 209, title: 'Add keyboard shortcuts to Safari address bar', labels: [['enhancement', '#a2eeef']], time: 'opened 5 days ago', comments: 1 },
  { n: 198, title: 'Teams: unread badge not clearing after channel read', labels: [['bug', '#d73a4a'], ['good first issue', '#7057ff']], time: 'opened last week', comments: 6 },
];

const PULLS = [
  { n: 93, title: 'Hyper-realistic job simulation: LinkedIn, Outlook, Workday, ADP, Teams, Amazon', branch: 'claude/realistic-job-simulation-ui-64t83x', time: 'opened today', draft: true, comments: 2 },
];

export function GitHubSite() {
  const fullName = useProfileStore((s) => s.fullName);
  const [tab, setTab] = useState<RepoTab>('code');
  const [starred, setStarred] = useState(false);
  const handle = fullName.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '') || 'you';

  return (
    <div className="gh-shell">
      {/* Global header */}
      <header className="gh-header">
        <button type="button" className="gh-hamburger" aria-label="Menu">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#636c76"><path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75zM1.75 12h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5z" /></svg>
        </button>
        <GitHubMark size={32} />
        <nav className="gh-breadcrumb">
          <span className="gh-bc-owner">{handle}</span>
          <span className="gh-bc-sep">/</span>
          <strong>aos-library</strong>
        </nav>
        <div className="gh-header-right">
          <div className="gh-search">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="#636c76"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-1.06 1.06zM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7z" /></svg>
            <span>Type <kbd>/</kbd> to search</span>
          </div>
          <span className="gh-header-divider" />
          <button type="button" className="gh-icon-btn" title="Create new">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="#636c76"><path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2z" /></svg>
          </button>
          <button type="button" className="gh-icon-btn" title="Issues">{Ic.issue()}</button>
          <button type="button" className="gh-icon-btn" title="Pull requests">{Ic.pr()}</button>
          <button type="button" className="gh-icon-btn gh-inbox" title="Notifications">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="#636c76"><path d="M2.8 2.06A1.75 1.75 0 0 1 4.41 1h7.18c.7 0 1.333.417 1.61 1.06l2.74 6.395c.04.093.06.194.06.295v4.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25v-4.5c0-.101.02-.202.06-.295zm1.61.44a.25.25 0 0 0-.23.152L1.887 8H4.75a.75.75 0 0 1 .6.3L6.625 10h2.75l1.275-1.7a.75.75 0 0 1 .6-.3h2.863L11.82 2.652a.25.25 0 0 0-.23-.152z" /></svg>
          </button>
          <span className="gh-avatar">{fullName.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
        </div>
      </header>

      {/* Repo tab bar */}
      <nav className="gh-repo-tabs">
        <button type="button" className={tab === 'code' ? 'active' : ''} onClick={() => setTab('code')}>{Ic.book} Code</button>
        <button type="button" className={tab === 'issues' ? 'active' : ''} onClick={() => setTab('issues')}>{Ic.issue()} Issues <span className="gh-counter">{ISSUES.length}</span></button>
        <button type="button" className={tab === 'pulls' ? 'active' : ''} onClick={() => setTab('pulls')}>{Ic.pr()} Pull requests <span className="gh-counter">{PULLS.length}</span></button>
        <button type="button" className={tab === 'actions' ? 'active' : ''} onClick={() => setTab('actions')}>{Ic.play} Actions</button>
        <button type="button">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#636c76"><path d="M7.467.133a1.748 1.748 0 0 1 1.066 0l5.25 1.68A1.75 1.75 0 0 1 15 3.48V7c0 1.566-.32 3.182-1.303 4.682-.983 1.498-2.585 2.813-5.032 3.855a1.697 1.697 0 0 1-1.33 0c-2.447-1.042-4.049-2.357-5.032-3.855C1.32 10.182 1 8.566 1 7V3.48a1.75 1.75 0 0 1 1.217-1.667z" /></svg>
          Security
        </button>
        <button type="button">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#636c76"><path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.06-1.06l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.06 1.06z" /></svg>
          Insights
        </button>
      </nav>

      <div className="gh-page">
        {tab === 'code' && (
          <div className="gh-code-layout">
            <div className="gh-code-main">
              <div className="gh-repo-title-row">
                <h1>aos-library <span className="gh-visibility">Private</span></h1>
                <div className="gh-repo-actions">
                  <button type="button">{Ic.eye} Watch <span className="gh-counter">4</span></button>
                  <button type="button">{Ic.fork} Fork <span className="gh-counter">2</span></button>
                  <button type="button" onClick={() => setStarred((s) => !s)}>
                    {Ic.star(starred)} {starred ? 'Starred' : 'Star'} <span className="gh-counter">{starred ? 27 : 26}</span>
                  </button>
                </div>
              </div>

              <div className="gh-branch-row">
                <button type="button" className="gh-branch-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="#636c76"><path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628a2.25 2.25 0 0 1-1.5-2.122z" /></svg>
                  main
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="#636c76"><path d="m4.427 7.427 3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427z" /></svg>
                </button>
                <span className="gh-branch-meta"><strong>4</strong> Branches</span>
                <span className="gh-branch-meta"><strong>2</strong> Tags</span>
                <div className="gh-branch-spacer" />
                <div className="gh-gotofile">Go to file</div>
                <button type="button" className="gh-code-btn">
                  Code
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="#fff"><path d="m4.427 7.427 3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427z" /></svg>
                </button>
              </div>

              <div className="gh-filetable">
                <div className="gh-latest-commit">
                  <span className="gh-avatar gh-avatar-sm">{fullName.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
                  <strong>{handle}</strong>
                  <span className="gh-commit-msg">feat: Claude plan tiers, VS Code, and GitHub surfaces</span>
                  <span className="gh-commit-check">{Ic.check}</span>
                  <span className="gh-commit-sha">d366628</span>
                  <span className="gh-commit-time">· 2 hours ago</span>
                  <span className="gh-commit-count">{Ic.clock} <strong>148</strong> Commits</span>
                </div>
                {TREE.map((row) => (
                  <div key={row.name} className="gh-file-row">
                    <span className="gh-file-name">{row.type === 'dir' ? Ic.folder : Ic.file}<span className="gh-file-link">{row.name}</span></span>
                    <span className="gh-file-msg">{row.msg}</span>
                    <span className="gh-file-time">{row.time}</span>
                  </div>
                ))}
              </div>

              <div className="gh-readme">
                <div className="gh-readme-head">
                  <span>README.md</span>
                </div>
                <div className="gh-readme-body">
                  <h1>aOS Library</h1>
                  <p>A desktop-OS style workspace simulator built with React, TypeScript, and Vite. It recreates the tools new graduates meet in their first job — mail, HR platforms, payroll, banking, team chat, and a browser full of enterprise sites — as one coherent simulation.</p>
                  <h2>Getting started</h2>
                  <pre>npm install{'\n'}npm run dev</pre>
                  <h2>Build</h2>
                  <pre>npm run build</pre>
                  <p>Production output is written to <code>dist/</code>.</p>
                </div>
              </div>
            </div>

            <aside className="gh-sidebar">
              <section>
                <h2>About</h2>
                <p>Desktop OS simulator for realistic job-market training: applications, interviews, offers, onboarding, payroll, and day-to-day work tools.</p>
                <div className="gh-topics">
                  {['react', 'typescript', 'vite', 'simulation', 'career'].map((t) => <span key={t}>{t}</span>)}
                </div>
                <ul className="gh-about-list">
                  <li>{Ic.book} Readme</li>
                  <li>{Ic.star(false)} <strong>{starred ? 27 : 26}</strong> stars</li>
                  <li>{Ic.eye} <strong>4</strong> watching</li>
                  <li>{Ic.fork} <strong>2</strong> forks</li>
                </ul>
              </section>
              <section>
                <h2>Releases <span className="gh-counter">2</span></h2>
                <p className="gh-release"><svg width="16" height="16" viewBox="0 0 16 16" fill="#1a7f37"><path d="M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 7.775zm4.5-3.025a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0z" /></svg> <strong>v0.4.2</strong> <span className="gh-latest">Latest</span></p>
                <span className="gh-muted">last week</span>
              </section>
              <section>
                <h2>Languages</h2>
                <div className="gh-langbar">
                  <span style={{ width: '78%', background: '#3178c6' }} />
                  <span style={{ width: '20%', background: '#663399' }} />
                  <span style={{ width: '2%', background: '#e34c26' }} />
                </div>
                <ul className="gh-langs">
                  <li><span className="gh-dot" style={{ background: '#3178c6' }} /> TypeScript <span className="gh-muted">78.0%</span></li>
                  <li><span className="gh-dot" style={{ background: '#663399' }} /> CSS <span className="gh-muted">20.0%</span></li>
                  <li><span className="gh-dot" style={{ background: '#e34c26' }} /> HTML <span className="gh-muted">2.0%</span></li>
                </ul>
              </section>
            </aside>
          </div>
        )}

        {tab === 'issues' && (
          <div className="gh-list-page">
            <div className="gh-list-toolbar">
              <div className="gh-list-search">is:issue state:open</div>
              <button type="button" className="gh-code-btn">New issue</button>
            </div>
            <div className="gh-list">
              <div className="gh-list-head">
                {Ic.issue('#1a7f37')} <strong>{ISSUES.length} Open</strong> <span className="gh-muted">{Ic.check} 41 Closed</span>
              </div>
              {ISSUES.map((it) => (
                <div key={it.n} className="gh-list-row">
                  <span className="gh-row-icon">{Ic.issue('#1a7f37')}</span>
                  <div className="gh-row-main">
                    <span className="gh-row-title">{it.title}</span>
                    {it.labels.map(([label, color]) => (
                      <span key={label} className="gh-label" style={{ background: color, color: label === 'enhancement' ? '#1f2328' : '#fff' }}>{label}</span>
                    ))}
                    <div className="gh-row-sub">#{it.n} · {it.time} by {ISSUES.indexOf(it) % 2 === 0 ? 'mchen-dev' : 'priyak'}</div>
                  </div>
                  <span className="gh-row-comments">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="#636c76"><path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25z" /></svg>
                    {it.comments}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'pulls' && (
          <div className="gh-list-page">
            <div className="gh-list-toolbar">
              <div className="gh-list-search">is:pr state:open</div>
              <button type="button" className="gh-code-btn">New pull request</button>
            </div>
            <div className="gh-list">
              <div className="gh-list-head">
                {Ic.pr('#1a7f37')} <strong>{PULLS.length} Open</strong> <span className="gh-muted">{Ic.check} 38 Closed</span>
              </div>
              {PULLS.map((pr) => (
                <div key={pr.n} className="gh-list-row">
                  <span className="gh-row-icon">{Ic.pr(pr.draft ? '#636c76' : '#1a7f37')}</span>
                  <div className="gh-row-main">
                    <span className="gh-row-title">{pr.title}</span>
                    {pr.draft && <span className="gh-label gh-label-draft">Draft</span>}
                    <div className="gh-row-sub">#{pr.n} · {pr.time} by {handle} · <code>{pr.branch}</code></div>
                  </div>
                  <span className="gh-row-comments">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="#636c76"><path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25z" /></svg>
                    {pr.comments}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'actions' && (
          <div className="gh-list-page">
            <div className="gh-list">
              <div className="gh-list-head"><strong>All workflows</strong> <span className="gh-muted">Showing runs from all workflows</span></div>
              {[
                { ok: true, title: 'feat: Claude plan tiers, VS Code, and GitHub surfaces', wf: 'CI', branch: 'main', time: '2 hours ago', dur: '2m 41s' },
                { ok: true, title: 'feat: Teams org-locked tenant sign-in', wf: 'CI', branch: 'main', time: '3 hours ago', dur: '2m 38s' },
                { ok: false, title: 'wip: amazon checkout charge wiring', wf: 'CI', branch: 'claude/realistic-job-simulation-ui-64t83x', time: 'yesterday', dur: '1m 12s' },
                { ok: true, title: 'assets: add brand banners and people photos', wf: 'CI', branch: 'main', time: 'yesterday', dur: '2m 55s' },
              ].map((run, i) => (
                <div key={i} className="gh-list-row">
                  <span className="gh-row-icon">
                    {run.ok
                      ? <svg width="16" height="16" viewBox="0 0 16 16" fill="#1a7f37"><path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zm3.78-9.72a.751.751 0 0 0-1.06-1.06L6.75 9.19 5.28 7.72a.751.751 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0z" /></svg>
                      : <svg width="16" height="16" viewBox="0 0 16 16" fill="#cf222e"><path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zM5.28 4.22a.751.751 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.751.751 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.751.751 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.751.751 0 0 0-1.06-1.06L8 6.94z" /></svg>}
                  </span>
                  <div className="gh-row-main">
                    <span className="gh-row-title">{run.title}</span>
                    <div className="gh-row-sub">{run.wf} #{148 - i} · <code>{run.branch}</code></div>
                  </div>
                  <span className="gh-row-time">{run.time}<br />{Ic.clock} {run.dur}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
