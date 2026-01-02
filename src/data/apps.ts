export type ShellApp = {
  id: string;
  name: string;
  icon: string;
  description: string;
  accent: string;
  defaultSize: { width: number; height: number };
};

export const apps: ShellApp[] = [
  {
    id: 'artifact-explorer',
    name: 'Artifact Explorer',
    icon: '🗂️',
    description: 'Browse artifacts, previews, and metadata',
    accent: '#7c8cff',
    defaultSize: { width: 820, height: 520 },
  },
  {
    id: 'job-monitor',
    name: 'Job Monitor',
    icon: '📊',
    description: 'Queued and running jobs with live logs',
    accent: '#4ade80',
    defaultSize: { width: 720, height: 460 },
  },
  {
    id: 'agent-console',
    name: 'Agent Console',
    icon: '🤖',
    description: 'Conversation and command console for agents',
    accent: '#f59e0b',
    defaultSize: { width: 680, height: 420 },
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: '⚙️',
    description: 'Workspace, wallpaper, and keyboard shortcuts',
    accent: '#60a5fa',
    defaultSize: { width: 520, height: 420 },
  },
];
