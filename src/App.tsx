import { useEffect, useMemo, useState } from 'react';
import { apps } from './data/apps';
import { Dock } from './components/Dock';
import { MenuBar } from './components/MenuBar';
import { Spotlight } from './components/Spotlight';
import { WindowFrame } from './components/WindowFrame';
import { AccelApp, OracleApp, SafariApp, SanctumApp, SpotifyApp, VisionApp } from './apps';
import { useDriveStore, type DriveDocument } from './state/useDriveStore';
import { useShellStore, type WindowState } from './state/useShellStore';

const artifacts = [
  { title: 'Roadmap.md', kind: 'Report', updated: '2h ago', detail: 'Phase 1 delivery outline', accent: '#7c8cff' },
  { title: 'Prompt Library', kind: 'Code', updated: '1h ago', detail: 'Reusable prompt snippets', accent: '#a78bfa' },
  { title: 'Logo.svg', kind: 'Image', updated: '5h ago', detail: 'Crystal wing mark', accent: '#70cfff' },
  { title: 'Job Metrics', kind: 'Table', updated: 'Just now', detail: 'Live metrics for running jobs', accent: '#34d399' },
  { title: 'Launch Script', kind: 'Code', updated: 'Yesterday', detail: 'Shell bootstrap and shortcuts', accent: '#fbbf24' },
  { title: 'Quick Look Deck', kind: 'Report', updated: '30m ago', detail: 'Slides preview', accent: '#f472b6' },
];

const jobs = [
  { title: 'Summarize latest artifact', status: 'Running', progress: 68 },
  { title: 'Index workspace embeddings', status: 'Queued', progress: 0 },
  { title: 'Compile prompt library', status: 'Done', progress: 100 },
];

const agentLog = [
  { time: '08:12', text: 'Watching workspace for new artifacts' },
  { time: '08:18', text: 'Queued embedding refresh for repo' },
  { time: '08:26', text: 'Pushing status updates to menu bar' },
];

const getStatusColor = (status: string) => {
  if (status === 'Running') return '#34d399';
  if (status === 'Queued') return '#facc15';
  return '#94a3b8';
};

const DesktopIcon = ({ label, icon }: { label: string; icon: string }) => (
  <div className="desktop-icon">
    <img src={icon} alt={label} style={{ width: 64, height: 64, borderRadius: 12 }} />
    <div className="card-title">{label}</div>
  </div>
);

function renderWindowContent(window: WindowState, onOpenDocument: (doc: DriveDocument) => void) {
  if (window.appId === 'artifact-explorer') {
    return (
      <div className="window-grid">
        {artifacts.map((artifact) => (
          <div key={artifact.title} className="card">
            <div className="pill" style={{ borderColor: `${artifact.accent}33`, background: `${artifact.accent}16` }}>
              {artifact.kind}
            </div>
            <div className="card-title">{artifact.title}</div>
            <div className="card-subtitle">{artifact.detail}</div>
            <div className="window-footer">
              <span>Updated {artifact.updated}</span>
              <span className="badge">Preview</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (window.appId === 'job-monitor') {
    return (
      <div className="window-grid">
        {jobs.map((job) => (
          <div key={job.title} className="card">
            <div className="card-title">{job.title}</div>
            <div className="card-subtitle">Status: {job.status}</div>
            <div style={{ marginTop: 8, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)' }}>
              <div
                style={{
                  width: `${job.progress}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: getStatusColor(job.status),
                }}
              />
            </div>
          </div>
        ))}
        <div className="card">
          <div className="pill" style={{ background: 'rgba(112,207,255,0.18)', borderColor: 'rgba(112,207,255,0.28)' }}>
            Live Logs
          </div>
          <div className="card-subtitle" style={{ marginTop: 6 }}>
            {agentLog.map((log) => (
              <div key={log.time} style={{ marginBottom: 4 }}>
                <strong>{log.time}</strong> — {log.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (window.appId === 'agent-console') {
    return (
      <div className="window-grid">
        <div className="card">
          <div className="card-title">Recent Commands</div>
          <div className="card-subtitle">Open Sanctum, Open Safari, Play Focus Flow</div>
        </div>
        <div className="card">
          <div className="card-title">Agent Activity</div>
          {agentLog.map((entry) => (
            <div key={entry.time} className="card-subtitle" style={{ marginBottom: 6 }}>
              <strong>{entry.time}</strong> — {entry.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (window.appId === 'archive') return <AccelApp />;
  if (window.appId === 'oracle') return <OracleApp />;
  if (window.appId === 'sanctum') return <SanctumApp onOpenDocument={onOpenDocument} />;
  if (window.appId === 'vision') return <VisionApp />;
  if (window.appId === 'spotify') return <SpotifyApp />;
  if (window.appId === 'safari') return <SafariApp />;

  if (window.appId === 'oracle') {
    return <OracleApp />;
  }

  if (window.appId === 'sanctum') {
    return <SanctumApp />;
  }

  if (window.appId === 'vision') {
    return <VisionApp />;
  }

  return (
    <div className="window-grid">
      <div className="card">
        <div className="card-title">Personalize</div>
        <div className="card-subtitle">Switch wallpaper, tweak glass opacity, and keyboard shortcuts.</div>
      </div>
    </div>
  );
}

export default function App() {
  const {
    windows,
    workspaceName,
    spotlightOpen,
    spotlightQuery,
    toggleSpotlight,
    setSpotlightQuery,
    openWindow,
    focusWindow,
    closeWindow,
    minimizeWindow,
    moveWindow,
    resizeWindow,
    toggleMaximizeWindow,
  } = useShellStore();
  const setActiveDocument = useDriveStore((state) => state.setActiveDocument);

  const [agentActive, setAgentActive] = useState(true);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.code === 'Space') {
        event.preventDefault();
        toggleSpotlight(true);
        setSpotlightQuery('');
      }
      if (event.key === 'Escape' && spotlightOpen) {
        toggleSpotlight(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [spotlightOpen, toggleSpotlight, setSpotlightQuery]);

  useEffect(() => {
    const pulse = setInterval(() => setAgentActive((value) => !value), 12000);
    return () => clearInterval(pulse);
  }, []);

  const visibleWindows = windows.filter((win) => !win.minimized);
  const runningJobs = jobs.filter((job) => job.status !== 'Done');
  const systemState = runningJobs.length > 0 ? 'Running Jobs' : 'Idle';

  const openDriveDocument = (doc: DriveDocument) => {
    setActiveDocument(doc.id);
    openWindow(doc.type === 'spreadsheet' ? 'archive' : 'oracle');
    openWindow('sanctum');
  };

  const commands = useMemo(
    () =>
      apps.map((app) => ({
        id: `open-${app.id}`,
        title: `Open ${app.name}`,
        description: app.description,
        icon: app.icon,
        action: () => {
          openWindow(app.id);
          toggleSpotlight(false);
        },
      })),
    [openWindow, toggleSpotlight],
  );

  return (
    <div className="app-shell">
      <MenuBar
        workspaceName={workspaceName}
        stateText={systemState}
        jobCount={runningJobs.length}
        agentActive={agentActive}
        onToggleSpotlight={() => toggleSpotlight(true)}
      />

      <div className="desktop">
        <div className="desktop-icons">
          <DesktopIcon label="Workspace" icon={`${import.meta.env.BASE_URL}assets/desktop/workspace.png`} />
          <DesktopIcon label="Latest Job" icon={`${import.meta.env.BASE_URL}assets/desktop/latest-job.png`} />
          <DesktopIcon label="Artifacts" icon={`${import.meta.env.BASE_URL}assets/desktop/artifacts.png`} />
        </div>

        {visibleWindows.map((window) => (
          <WindowFrame
            key={window.id}
            frame={window}
            onClose={closeWindow}
            onMinimize={minimizeWindow}
            onMove={moveWindow}
            onResize={resizeWindow}
            onFocus={focusWindow}
            onToggleMaximize={toggleMaximizeWindow}
          >
            {renderWindowContent(window, openDriveDocument)}
          </WindowFrame>
        ))}

        <Spotlight
          open={spotlightOpen}
          query={spotlightQuery}
          onQueryChange={setSpotlightQuery}
          commands={commands}
          onClose={() => toggleSpotlight(false)}
        />

        <Dock apps={apps} windows={windows} onLaunch={openWindow} />
      </div>
    </div>
  );
}
