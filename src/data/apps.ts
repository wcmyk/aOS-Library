export type ShellApp = {
  id: string;
  name: string;
  icon: string;
  description: string;
  accent: string;
  defaultSize: { width: number; height: number };
  dockHidden?: boolean;
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
    id: 'terminal',
    name: 'Terminal',
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='tg' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23111827'/%3E%3Cstop offset='1' stop-color='%230f766e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='14' fill='url(%23tg)'/%3E%3Cpath d='M14 21l12 11-12 11' stroke='%23a7f3d0' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3Crect x='31' y='40' width='20' height='4' rx='2' fill='%23a7f3d0'/%3E%3C/svg%3E`,
    description: 'Developer terminal with job status and logs',
    accent: '#14b8a6',
    defaultSize: { width: 720, height: 460 },
  },
  {
    id: 'neural',
    name: 'Neural Studio',
    icon: `${BASE_URL}assets/apps/neural-ai.svg`,
    description: 'Train and interact with 5 specialized AI agents: Math, Automation, Coding, General, Science',
    accent: '#c084fc',
    defaultSize: { width: 900, height: 580 },
  },
  {
    id: 'virtue',
    name: 'Virtue',
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='asg' x1='0' y1='0' x2='0.5' y2='1'%3E%3Cstop offset='0' stop-color='%231BAEFF'/%3E%3Cstop offset='1' stop-color='%230066CC'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='14' fill='url(%23asg)'/%3E%3Cpath d='M32 12L20 44M32 12L44 44' stroke='white' stroke-width='5.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3Cline x1='23' y1='33' x2='41' y2='33' stroke='white' stroke-width='4.5' stroke-linecap='round'/%3E%3C/svg%3E`,
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
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23003087'/%3E%3Cpath d='M20 8L44 8L56 20L56 44L44 56L20 56L8 44L8 20Z' fill='none' stroke='white' stroke-width='3'/%3E%3Cline x1='8' y1='32' x2='56' y2='32' stroke='white' stroke-width='3'/%3E%3Cline x1='32' y1='8' x2='32' y2='56' stroke='white' stroke-width='3'/%3E%3C/svg%3E`,
    description: 'Full-featured banking app with Chase-like UI, transactions, investments and mortgage',
    accent: '#1a6abf',
    defaultSize: { width: 1100, height: 700 },
  },
  {
    id: 'realtor',
    name: 'HomeFind',
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='hfg' x1='0' y1='0' x2='0.4' y2='1'%3E%3Cstop offset='0' stop-color='%2340C057'/%3E%3Cstop offset='1' stop-color='%232F9E44'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='14' fill='url(%23hfg)'/%3E%3Cpath d='M32 10L8 32H16V54H28V40H36V54H48V32H56Z' fill='white' opacity='0.97'/%3E%3Ccircle cx='44' cy='18' r='9' fill='white' opacity='0.95'/%3E%3Ccircle cx='44' cy='18' r='5' fill='%232F9E44'/%3E%3Cpath d='M44 28L38 40' stroke='white' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E`,
    description: 'Real estate marketplace with 150+ properties across 250 US locations',
    accent: '#e63946',
    defaultSize: { width: 1200, height: 760 },
  },
  {
    id: 'pycharm',
    name: 'PyCharm',
    icon: `${BASE_URL}assets/apps/vscode.png`,
    description: 'Professional Python IDE with project explorer and integrated terminal',
    accent: '#00c389',
    defaultSize: { width: 1220, height: 760 },
  },
  {
    id: 'rentcafe',
    name: 'RentCafe',
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='rcg' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23FF7B00'/%3E%3Cstop offset='1' stop-color='%23E85500'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='14' fill='url(%23rcg)'/%3E%3Crect x='8' y='28' width='48' height='28' rx='2' fill='white' opacity='0.97'/%3E%3Crect x='16' y='16' width='32' height='16' rx='2' fill='white' opacity='0.92'/%3E%3Crect x='22' y='8' width='20' height='12' rx='2' fill='white' opacity='0.82'/%3E%3Crect x='12' y='32' width='8' height='6' rx='1' fill='%23E85500'/%3E%3Crect x='28' y='32' width='8' height='6' rx='1' fill='%23E85500'/%3E%3Crect x='44' y='32' width='8' height='6' rx='1' fill='%23E85500'/%3E%3Crect x='12' y='42' width='8' height='6' rx='1' fill='%23E85500'/%3E%3Crect x='44' y='42' width='8' height='6' rx='1' fill='%23E85500'/%3E%3Crect x='27' y='42' width='10' height='14' rx='2' fill='%23E85500'/%3E%3Crect x='20' y='20' width='6' height='6' rx='1' fill='%23E85500'/%3E%3Crect x='38' y='20' width='6' height='6' rx='1' fill='%23E85500'/%3E%3C/svg%3E`,
    description: 'Property, lease, rent, and maintenance management portal',
    accent: '#0a9396',
    defaultSize: { width: 1100, height: 700 },
  },
  {
    id: 'calculator',
    name: 'Calculator',
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='cg' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23232323'/%3E%3Cstop offset='1' stop-color='%23111'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='14' fill='url(%23cg)'/%3E%3Crect x='10' y='10' width='18' height='10' rx='3' fill='%23636363'/%3E%3Crect x='10' y='24' width='10' height='10' rx='3' fill='%233a3a3a'/%3E%3Crect x='24' y='24' width='10' height='10' rx='3' fill='%233a3a3a'/%3E%3Crect x='38' y='24' width='16' height='10' rx='3' fill='%23ff9f0a'/%3E%3Crect x='10' y='38' width='10' height='10' rx='3' fill='%233a3a3a'/%3E%3Crect x='24' y='38' width='10' height='10' rx='3' fill='%233a3a3a'/%3E%3Crect x='38' y='38' width='10' height='10' rx='3' fill='%23ff9f0a'/%3E%3Crect x='10' y='48' width='24' height='6' rx='3' fill='%233a3a3a'/%3E%3Crect x='38' y='48' width='10' height='6' rx='3' fill='%23ff9f0a'/%3E%3C/svg%3E`,
    description: 'Multi-mode calculator: Basic, Scientific, Financial, Programmer, Statistics, Conversion, Currency',
    accent: '#ff9f0a',
    defaultSize: { width: 380, height: 580 },
    dockHidden: true,
  },
  {
    id: 'appcenter',
    name: 'App Center',
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='lpg' x1='0' y1='0' x2='0.5' y2='1'%3E%3Cstop offset='0' stop-color='%23FF7A00'/%3E%3Cstop offset='1' stop-color='%23CC2200'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='14' fill='url(%23lpg)'/%3E%3Cpath d='M32 9C32 9 43 19 43 33L32 38 21 33C21 19 32 9 32 9Z' fill='white' opacity='0.97'/%3E%3Ccircle cx='32' cy='27' r='5' fill='%23CC2200'/%3E%3Cpath d='M21 33L15 41 21 39Z' fill='white' opacity='0.85'/%3E%3Cpath d='M43 33L49 41 43 39Z' fill='white' opacity='0.85'/%3E%3Cellipse cx='32' cy='43' rx='5' ry='3' fill='%23FFAA00' opacity='0.9'/%3E%3C/svg%3E`,
    description: 'Organize and launch all your apps. Drag to reorder with persistent layout.',
    accent: '#667eea',
    defaultSize: { width: 960, height: 640 },
  },
];
