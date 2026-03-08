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
    id: 'neural',
    name: 'Neural Studio',
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3CradialGradient id='galaxy' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%23c084fc'/%3E%3Cstop offset='40%25' stop-color='%237c3aed'/%3E%3Cstop offset='100%25' stop-color='%231e1b4b'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='14' fill='url(%23galaxy)'/%3E%3Ccircle cx='32' cy='32' r='8' fill='%23f0abfc' opacity='0.9'/%3E%3Ccircle cx='32' cy='32' r='14' fill='none' stroke='%23c084fc' stroke-width='1.2' opacity='0.6'/%3E%3Ccircle cx='32' cy='32' r='20' fill='none' stroke='%23a855f7' stroke-width='0.8' opacity='0.4'/%3E%3Ccircle cx='32' cy='18' r='2.5' fill='%23f0abfc'/%3E%3Ccircle cx='44' cy='24' r='2' fill='%23e879f9'/%3E%3Ccircle cx='46' cy='38' r='2.5' fill='%23c084fc'/%3E%3Ccircle cx='38' cy='48' r='2' fill='%23f0abfc'/%3E%3Ccircle cx='26' cy='48' r='2.5' fill='%23e879f9'/%3E%3Ccircle cx='18' cy='40' r='2' fill='%23c084fc'/%3E%3Ccircle cx='18' cy='26' r='2.5' fill='%23f0abfc'/%3E%3Ccircle cx='24' cy='16' r='2' fill='%23e879f9'/%3E%3Cline x1='32' y1='18' x2='44' y2='24' stroke='%23c084fc' stroke-width='0.8' opacity='0.5'/%3E%3Cline x1='44' y1='24' x2='46' y2='38' stroke='%23c084fc' stroke-width='0.8' opacity='0.5'/%3E%3Cline x1='46' y1='38' x2='38' y2='48' stroke='%23c084fc' stroke-width='0.8' opacity='0.5'/%3E%3Cline x1='38' y1='48' x2='26' y2='48' stroke='%23c084fc' stroke-width='0.8' opacity='0.5'/%3E%3Cline x1='26' y1='48' x2='18' y2='40' stroke='%23c084fc' stroke-width='0.8' opacity='0.5'/%3E%3Cline x1='18' y1='40' x2='18' y2='26' stroke='%23c084fc' stroke-width='0.8' opacity='0.5'/%3E%3Cline x1='18' y1='26' x2='24' y2='16' stroke='%23c084fc' stroke-width='0.8' opacity='0.5'/%3E%3Cline x1='24' y1='16' x2='32' y2='18' stroke='%23c084fc' stroke-width='0.8' opacity='0.5'/%3E%3Ccircle cx='12' cy='12' r='1.2' fill='%23f0abfc' opacity='0.7'/%3E%3Ccircle cx='52' cy='14' r='1' fill='%23e879f9' opacity='0.6'/%3E%3Ccircle cx='8' cy='48' r='1.5' fill='%23c084fc' opacity='0.5'/%3E%3Ccircle cx='56' cy='52' r='1.2' fill='%23f0abfc' opacity='0.7'/%3E%3C/svg%3E`,
    description: 'Train and interact with 5 specialized AI agents: Math, Automation, Coding, General, Science',
    accent: '#c084fc',
    defaultSize: { width: 900, height: 580 },
  },
  {
    id: 'virtue',
    name: 'Virtue',
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%232f7bff'/%3E%3Cstop offset='1' stop-color='%2366b1ff'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='14' fill='url(%23g)'/%3E%3Cpath d='M18 44l9-15m10 0l9 15M22 37h20M26 22l6 10m6-10l-6 10' stroke='white' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E`,
    description: 'App marketplace for discovering and installing workspace apps',
    accent: '#2f7bff',
    defaultSize: { width: 1180, height: 760 },
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
  {
    id: 'banking',
    name: 'Chase Bank',
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='cg' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%231a6abf'/%3E%3Cstop offset='1' stop-color='%230a4f99'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='14' fill='url(%23cg)'/%3E%3Cpath d='M20 14h6v36h-6zM38 14h6v36h-6zM14 28h36v8H14z' fill='white' opacity='0.95'/%3E%3C/svg%3E`,
    description: 'Full-featured banking app with Chase-like UI, transactions, investments and mortgage',
    accent: '#1a6abf',
    defaultSize: { width: 1100, height: 700 },
  },
  {
    id: 'realtor',
    name: 'HomeFind',
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='rg' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%231a3c5e'/%3E%3Cstop offset='1' stop-color='%232a6496'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='14' fill='url(%23rg)'/%3E%3Cpath d='M32 12L14 28h8v24h20V28h8z' fill='white' opacity='0.95'/%3E%3Crect x='26' y='36' width='12' height='16' rx='2' fill='%231a3c5e'/%3E%3C/svg%3E`,
    description: 'Real estate marketplace with 150+ properties across 250 US locations',
    accent: '#1a3c5e',
    defaultSize: { width: 1200, height: 760 },
  },
  {
    id: 'rentcafe',
    name: 'RentCafe',
    icon: `${BASE_URL}assets/apps/Sanctum.png`,
    description: 'Property, lease, rent, and maintenance management portal',
    accent: '#0b4ea2',
    defaultSize: { width: 1100, height: 700 },
  },
  {
    id: 'appcenter',
    name: 'App Center',
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='ag' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23667eea'/%3E%3Cstop offset='1' stop-color='%23764ba2'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='14' fill='url(%23ag)'/%3E%3Crect x='12' y='12' width='18' height='18' rx='5' fill='white' opacity='0.9'/%3E%3Crect x='34' y='12' width='18' height='18' rx='5' fill='white' opacity='0.9'/%3E%3Crect x='12' y='34' width='18' height='18' rx='5' fill='white' opacity='0.9'/%3E%3Crect x='34' y='34' width='18' height='18' rx='5' fill='white' opacity='0.9'/%3E%3C/svg%3E`,
    description: 'Organize and launch all your apps. Drag to reorder with persistent layout.',
    accent: '#667eea',
    defaultSize: { width: 960, height: 640 },
  },
];
