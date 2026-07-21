import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { apps } from './data/apps';
import { Dock } from './components/Dock';
import { NotificationCenter } from './components/NotificationCenter';
import { MenuBar } from './components/MenuBar';
import { MacSystem } from './components/MacSystem';
import { Spotlight } from './components/Spotlight';
import { WindowFrame } from './components/WindowFrame';
import { useDriveStore, type DriveDocument } from './state/useDriveStore';
import { useShellStore, type WindowState } from './state/useShellStore';
import { useCircuitLabStore } from './state/useCircuitLabStore';
import { useEdenStore } from './state/useEdenStore';
import { useThothWidgetStore } from './state/useThothWidgetStore';
import { useWallpaperStore, wallpaperById } from './state/useWallpaperStore';
import { useThemeStore } from './state/useThemeStore';

const AccelApp = lazy(() => import('./apps/accel/AccelApp').then((m) => ({ default: m.AccelApp })));
const OracleApp = lazy(() => import('./apps/oracle/OracleApp').then((m) => ({ default: m.OracleApp })));
const OutlookApp = lazy(() => import('./apps/outlook/OutlookApp').then((m) => ({ default: m.OutlookApp })));
const SanctumApp = lazy(() => import('./apps/sanctum/SanctumApp').then((m) => ({ default: m.SanctumApp })));
const SafariApp = lazy(() => import('./apps/safari/SafariApp').then((m) => ({ default: m.SafariApp })));
const SpotifyApp = lazy(() => import('./apps/spotify/SpotifyApp').then((m) => ({ default: m.SpotifyApp })));
const VisionApp = lazy(() => import('./apps/vision/VisionApp').then((m) => ({ default: m.VisionApp })));
const SettingsApp = lazy(() => import('./apps/settings/SettingsApp').then((m) => ({ default: m.SettingsApp })));
const CoLabApp = lazy(() => import('./apps/colab/CoLabApp').then((m) => ({ default: m.CoLabApp })));
const WorkHubApp = lazy(() => import('./apps/workhub/WorkHubApp').then((m) => ({ default: m.WorkHubApp })));
const SpaceyApp = lazy(() => import('./apps/spacey/SpaceyApp').then((m) => ({ default: m.SpaceyApp })));
const NeuralApp = lazy(() => import('./apps/neural/NeuralApp').then((m) => ({ default: m.NeuralApp })));
const VirtueApp = lazy(() => import('./apps/virtue/VirtueApp').then((m) => ({ default: m.VirtueApp })));
const BankingApp = lazy(() => import('./apps/banking/BankingApp').then((m) => ({ default: m.BankingApp })));
const RealtorApp = lazy(() => import('./apps/realtor/RealtorApp').then((m) => ({ default: m.RealtorApp })));
const AppCenterApp = lazy(() => import('./apps/appcenter/AppCenterApp').then((m) => ({ default: m.AppCenterApp })));
const RentCafeApp = lazy(() => import('./apps/rentcafe/RentCafeApp').then((m) => ({ default: m.RentCafeApp })));
const PyCharmApp = lazy(() => import('./apps/pycharm/PyCharmApp').then((m) => ({ default: m.PyCharmApp })));
const XcodeApp = lazy(() => import('./apps/xcode/XcodeApp').then((m) => ({ default: m.XcodeApp })));
const TeamsApp = lazy(() => import('./apps/teams/TeamsApp').then((m) => ({ default: m.TeamsApp })));
const VSCodeApp = lazy(() => import('./apps/vscode/VSCodeApp').then((m) => ({ default: m.VSCodeApp })));
const CalendarApp = lazy(() => import('./apps/calendar/CalendarApp').then((m) => ({ default: m.CalendarApp })));
const MessagesApp = lazy(() => import('./apps/messages/MessagesApp').then((m) => ({ default: m.MessagesApp })));
const ZoomApp = lazy(() => import('./apps/zoom/ZoomApp').then((m) => ({ default: m.ZoomApp })));
const CalculatorApp = lazy(() => import('./apps/calculator/CalculatorApp').then((m) => ({ default: m.CalculatorApp })));
const CircuitApp = lazy(() => import('./apps/circuit/CircuitApp').then((m) => ({ default: m.CircuitApp })));
const ChemistryApp = lazy(() => import('./apps/chemistry/ChemistryApp').then((m) => ({ default: m.ChemistryApp })));
const MnemoApp = lazy(() => import('./apps/mnemo/MnemoApp').then((m) => ({ default: m.MnemoApp })));
const ThothWidget = lazy(() => import('./apps/mnemo/ThothWidget').then((m) => ({ default: m.ThothWidget })));
const InventoryApp = lazy(() => import('./apps/inventory/InventoryApp').then((m) => ({ default: m.InventoryApp })));
const NotepadApp = lazy(() => import('./apps/notepad/NotepadApp').then((m) => ({ default: m.NotepadApp })));
const EdenGardenApp = lazy(() => import('./apps/eden/EdenGardenApp').then((m) => ({ default: m.EdenGardenApp })));
const ChessApp = lazy(() => import('./apps/chess/ChessApp').then((m) => ({ default: m.ChessApp })));

const artifacts = [
  { title: 'Roadmap.md', kind: 'Report', updated: '2h ago', detail: 'Phase 1 delivery outline', accent: '#7c8cff' },
  { title: 'Prompt Library', kind: 'Code', updated: '1h ago', detail: 'Reusable prompt snippets', accent: '#a78bfa' },
  { title: 'Logo.svg', kind: 'Image', updated: '5h ago', detail: 'Crystal wing mark', accent: '#70cfff' },
  { title: 'Job Metrics', kind: 'Table', updated: 'Just now', detail: 'Live metrics for running jobs', accent: '#34d399' },
  { title: 'Launch Script', kind: 'Code', updated: 'Yesterday', detail: 'Shell bootstrap and shortcuts', accent: '#fbbf24' },
  { title: 'Quick Look Deck', kind: 'Report', updated: '30m ago', detail: 'Slides preview', accent: '#f472b6' },
];

const jobs = [
  { title: 'python scripts/sync.py', status: 'Running', progress: 68 },
  { title: 'pnpm lint', status: 'Queued', progress: 0 },
  { title: 'npm run build', status: 'Done', progress: 100 },
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

  if (window.appId === 'terminal') {
    return (
      <div className="window-grid">
        {jobs.map((job) => (
          <div key={job.title} className="card">
            <div className="card-title">{job.title}</div>
            <div className="card-subtitle">Process status: {job.status}</div>
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

  if (window.appId === 'neural') return <Suspense fallback={null}><NeuralApp /></Suspense>;
  if (window.appId === 'virtue') return <Suspense fallback={null}><VirtueApp /></Suspense>;
  if (window.appId === 'banking') return <Suspense fallback={null}><BankingApp /></Suspense>;
  if (window.appId === 'realtor') return <Suspense fallback={null}><RealtorApp /></Suspense>;
  if (window.appId === 'spacey') return <Suspense fallback={null}><SpaceyApp /></Suspense>;
  if (window.appId === 'appcenter') return <Suspense fallback={null}><AppCenterApp /></Suspense>;
  if (window.appId === 'rentcafe') return <Suspense fallback={null}><RentCafeApp /></Suspense>;
  if (window.appId === 'pycharm') return <Suspense fallback={null}><PyCharmApp /></Suspense>;
  if (window.appId === 'xcode') return <Suspense fallback={null}><XcodeApp /></Suspense>;
  if (window.appId === 'teams') return <Suspense fallback={null}><TeamsApp /></Suspense>;
  if (window.appId === 'vscode') return <Suspense fallback={null}><VSCodeApp /></Suspense>;
  if (window.appId === 'calendar') return <Suspense fallback={null}><CalendarApp /></Suspense>;
  if (window.appId === 'messages') return <Suspense fallback={null}><MessagesApp /></Suspense>;
  if (window.appId === 'zoom') return <Suspense fallback={null}><ZoomApp /></Suspense>;
  if (window.appId === 'calculator') return <Suspense fallback={null}><CalculatorApp /></Suspense>;
  if (window.appId === 'circuit') return <Suspense fallback={null}><CircuitApp /></Suspense>;
  if (window.appId === 'chemistry') return <Suspense fallback={null}><ChemistryApp /></Suspense>;
  if (window.appId === 'mnemo') return <Suspense fallback={null}><MnemoApp /></Suspense>;
  if (window.appId === 'inventory') return <Suspense fallback={null}><InventoryApp /></Suspense>;
  if (window.appId === 'notepad') return <Suspense fallback={null}><NotepadApp /></Suspense>;
  if (window.appId === 'eden') return <Suspense fallback={null}><EdenGardenApp /></Suspense>;
  if (window.appId === 'chess') return <Suspense fallback={null}><ChessApp /></Suspense>;

  if (window.appId === 'archive') return <Suspense fallback={null}><AccelApp /></Suspense>;
  if (window.appId === 'oracle') return <Suspense fallback={null}><OracleApp /></Suspense>;
  if (window.appId === 'outlook') return <Suspense fallback={null}><OutlookApp /></Suspense>;
  if (window.appId === 'sanctum') return <Suspense fallback={null}><SanctumApp onOpenDocument={onOpenDocument} /></Suspense>;
  if (window.appId === 'vision') return <Suspense fallback={null}><VisionApp /></Suspense>;
  if (window.appId === 'spotify') return <Suspense fallback={null}><SpotifyApp /></Suspense>;
  if (window.appId === 'safari') return <Suspense fallback={null}><SafariApp /></Suspense>;
  if (window.appId === 'settings') return <Suspense fallback={null}><SettingsApp /></Suspense>;
  if (window.appId === 'colab') return <Suspense fallback={null}><CoLabApp /></Suspense>;
  if (window.appId === 'sentinel-flow') return <Suspense fallback={null}><WorkHubApp /></Suspense>;
  if (window.appId === 'neural') return <Suspense fallback={null}><NeuralApp /></Suspense>;

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
  const exportedSystems = useCircuitLabStore((s) => s.exportedSystems);
  const edenUnlocked = useEdenStore((s) => s.unlocked);
  const { widgets } = useThothWidgetStore();
  const wallpaperFile = wallpaperById(useWallpaperStore((s) => s.selectedId)).file;
  const themeMode = useThemeStore((s) => s.mode);

  // System appearance — themed apps restyle via [data-theme] CSS, layout untouched.
  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
  }, [themeMode]);

  // Desktop wallpaper — reactively follows the user's choice in Settings.
  useEffect(() => {
    const el = document.querySelector('.desktop') as HTMLElement | null;
    if (el) {
      el.style.backgroundImage = `url('${wallpaperFile}')`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.backgroundAttachment = 'fixed';
    }
  }, [wallpaperFile]);

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

  const visibleWindows = windows.filter((win) => !win.minimized);
  const runningJobs = jobs.filter((job) => job.status !== 'Done');
  const systemState = runningJobs.length > 0 ? 'Running Jobs' : 'Idle';
  const frontWindow = visibleWindows.slice().sort((a, b) => a.zIndex - b.zIndex).pop();

  const openDriveDocument = (doc: DriveDocument) => {
    setActiveDocument(doc.id);
    openWindow(doc.type === 'spreadsheet' ? 'archive' : 'oracle');
    openWindow('sanctum');
  };

  const visibleApps = useMemo(() => apps.filter((app) => app.id !== 'eden' || edenUnlocked), [edenUnlocked]);

  const commands = useMemo(
    () =>
      visibleApps.map((app) => ({
        id: `open-${app.id}`,
        title: `Open ${app.name}`,
        description: app.description,
        icon: app.icon,
        action: () => {
          openWindow(app.id);
          toggleSpotlight(false);
        },
      })),
    [openWindow, toggleSpotlight, visibleApps],
  );

  return (
    <div className="app-shell">
      <MenuBar
        workspaceName={workspaceName}
        stateText={systemState}
        jobCount={runningJobs.length}
        activeAppName={frontWindow ? visibleApps.find((a) => a.id === frontWindow.appId)?.name : undefined}
        onToggleSpotlight={() => toggleSpotlight(true)}
      />

      <div className="desktop">
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
            chromeless={apps.find((a) => a.id === window.appId)?.frameless}
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

        {exportedSystems.map((system, index) => (
          <div
            key={system.id}
            style={{
              position: 'absolute',
              top: 70 + (index % 5) * 48,
              right: 28 + (Math.floor(index / 5) % 3) * 74,
              fontSize: 22,
              filter: 'drop-shadow(0 3px 8px rgba(0,0,0,.45))',
              animation: 'float 4s ease-in-out infinite',
              pointerEvents: 'none',
            }}
            title={`${system.name} exported from circuit lab`}
          >
            {system.kind === 'drone' ? '✦' : system.kind === 'generator' ? '⚙' : '◆'}
          </div>
        ))}

        {widgets.map((widget) => (
          <Suspense fallback={null} key={widget.id}>
            <ThothWidget widget={widget} />
          </Suspense>
        ))}

        <Dock apps={visibleApps} windows={windows} onLaunch={openWindow} />
        <Suspense fallback={null}><NotificationCenter /></Suspense>
      </div>

      <MacSystem />
    </div>
  );
}
