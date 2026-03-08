export type ShellApp = {
  id: string;
  name: string;
  icon: string;
  description: string;
  accent: string;
  defaultSize: { width: number; height: number };
};

const BASE_URL = import.meta.env.BASE_URL;

export const apps: ShellApp[] = [

  {
    id: 'sentinel-flow',
    name: 'SentinelFlow',
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%23111a2b'/%3E%3Cpath d='M10 18h44v7H10zM10 29h30v7H10zM10 40h22v7H10z' fill='%233b82f6'/%3E%3Ccircle cx='48' cy='43' r='8' fill='%2393c5fd'/%3E%3C/svg%3E`,
    description: 'Enterprise work management platform for operations and PMO teams',
    accent: '#3b82f6',
    defaultSize: { width: 1380, height: 820 },
  },
  {
    id: 'spotify',
    name: 'Spotify',
    icon: `${BASE_URL}assets/apps/spotify.svg`,
    description: 'Music player with playlist and now-playing controls',
    accent: '#1db954',
    defaultSize: { width: 920, height: 580 },
  },
  {
    id: 'safari',
    name: 'Safari',
    icon: `${BASE_URL}assets/apps/safari.svg`,
    description: 'Mac-style browser shell for custom AoS websites',
    accent: '#2563eb',
    defaultSize: { width: 1120, height: 700 },
  },

  {
    id: 'colab',
    name: 'CoLab',
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%235b5fc7'/%3E%3Cpath d='M17 20h30a5 5 0 0 1 5 5v16a5 5 0 0 1-5 5H27l-10 8v-8h0a5 5 0 0 1-5-5V25a5 5 0 0 1 5-5z' fill='white' opacity='0.96'/%3E%3Ccircle cx='28' cy='33' r='3' fill='%235b5fc7'/%3E%3Ccircle cx='36' cy='33' r='3' fill='%235b5fc7'/%3E%3Ccircle cx='44' cy='33' r='3' fill='%235b5fc7'/%3E%3C/svg%3E`,
    description: 'Company-scoped team chat and collaboration workspace',
    accent: '#5b5fc7',
    defaultSize: { width: 1100, height: 700 },
  },
  {
    id: 'vision',
    name: 'Vision',
    icon: `${BASE_URL}assets/apps/vision.svg`,
    description: 'Google-style search with a polished workspace-native UI',
    accent: '#4f8cff',
    defaultSize: { width: 980, height: 640 },
  },
  {
    id: 'artifact-explorer',
    name: 'Artifact Explorer',
    icon: `${BASE_URL}assets/apps/artifact-explorer.png`,
    description: 'Browse artifacts, previews, and metadata',
    accent: '#7c8cff',
    defaultSize: { width: 820, height: 520 },
  },
  {
    id: 'job-monitor',
    name: 'Job Monitor',
    icon: `${BASE_URL}assets/apps/job-monitor.png`,
    description: 'Queued and running jobs with live logs',
    accent: '#4ade80',
    defaultSize: { width: 720, height: 460 },
  },
  {
    id: 'agent-console',
    name: 'Agent Console',
    icon: `${BASE_URL}assets/apps/agent-console.png`,
    description: 'Conversation and command console for agents',
    accent: '#f59e0b',
    defaultSize: { width: 680, height: 420 },
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: `${BASE_URL}assets/apps/settings.png`,
    description: 'Workspace, wallpaper, and keyboard shortcuts',
    accent: '#60a5fa',
    defaultSize: { width: 520, height: 420 },
  },
  {
    id: 'oracle',
    name: 'Oracle',
    icon: `${BASE_URL}assets/apps/Oracle.png`,
    description: 'Document editor and word processor',
    accent: '#2b579a',
    defaultSize: { width: 900, height: 600 },
  },
  {
    id: 'archive',
    name: 'Accel',
    icon: `${BASE_URL}assets/apps/Archive.png`,
    description: 'Advanced spreadsheet workspace synced with Sanctum',
    accent: '#d4a017',
    defaultSize: { width: 1000, height: 650 },
  },
  {
    id: 'herald',
    name: 'Herald',
    icon: `${BASE_URL}assets/apps/Herald.png`,
    description: 'Presentation and slide creator',
    accent: '#d24726',
    defaultSize: { width: 920, height: 580 },
  },
  {
    id: 'index',
    name: 'Index',
    icon: `${BASE_URL}assets/apps/Index.png`,
    description: 'Database management and queries',
    accent: '#a4373a',
    defaultSize: { width: 850, height: 550 },
  },
  {
    id: 'outlook',
    name: 'Outlook',
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='8' fill='%230078d4'/%3E%3Crect x='7' y='15' width='34' height='23' rx='3' fill='white' opacity='0.95'/%3E%3Cpath d='M7 19l17 12 17-12' stroke='%230078d4' stroke-width='2.5' fill='none' stroke-linejoin='round'/%3E%3Ctext x='24' y='13' font-family='Arial,sans-serif' font-weight='bold' font-size='9' fill='white' text-anchor='middle'%3EOutlook%3C/text%3E%3C/svg%3E`,
    description: 'Email client for workspace communications',
    accent: '#0078d4',
    defaultSize: { width: 1100, height: 680 },
  },
  {
    id: 'sanctum',
    name: 'Sanctum',
    icon: `${BASE_URL}assets/apps/Sanctum.png`,
    description: 'Cloud storage and file sync',
    accent: '#0364b8',
    defaultSize: { width: 780, height: 520 },
  },
];
