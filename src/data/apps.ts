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
    icon: '/assets/apps/artifact-explorer.png',
    description: 'Browse artifacts, previews, and metadata',
    accent: '#7c8cff',
    defaultSize: { width: 820, height: 520 },
  },
  {
    id: 'job-monitor',
    name: 'Job Monitor',
    icon: '/assets/apps/job-monitor.png',
    description: 'Queued and running jobs with live logs',
    accent: '#4ade80',
    defaultSize: { width: 720, height: 460 },
  },
  {
    id: 'agent-console',
    name: 'Agent Console',
    icon: '/assets/apps/agent-console.png',
    description: 'Conversation and command console for agents',
    accent: '#f59e0b',
    defaultSize: { width: 680, height: 420 },
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: '/assets/apps/settings.png',
    description: 'Workspace, wallpaper, and keyboard shortcuts',
    accent: '#60a5fa',
    defaultSize: { width: 520, height: 420 },
  },
  {
    id: 'oracle',
    name: 'Oracle',
    icon: '/assets/apps/Oracle.png',
    description: 'Document editor and word processor',
    accent: '#2b579a',
    defaultSize: { width: 900, height: 600 },
  },
  {
    id: 'archive',
    name: 'Archive',
    icon: '/assets/apps/Archive.png',
    description: 'Spreadsheet and data analysis',
    accent: '#217346',
    defaultSize: { width: 1000, height: 650 },
  },
  {
    id: 'herald',
    name: 'Herald',
    icon: '/assets/apps/Herald.png',
    description: 'Presentation and slide creator',
    accent: '#d24726',
    defaultSize: { width: 920, height: 580 },
  },
  {
    id: 'index',
    name: 'Index',
    icon: '/assets/apps/Index.png',
    description: 'Database management and queries',
    accent: '#a4373a',
    defaultSize: { width: 850, height: 550 },
  },
  {
    id: 'sanctum',
    name: 'Sanctum',
    icon: '/assets/apps/Sanctum.png',
    description: 'Cloud storage and file sync',
    accent: '#0364b8',
    defaultSize: { width: 780, height: 520 },
  },
];
