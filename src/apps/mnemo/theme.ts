import { useMnemoStore } from './state/useMnemoStore';
import type { ThemeColor } from './types';

export const THEMES: Record<ThemeColor, {
  primary: string; primaryMuted: string;
  bg: string; sidebar: string; surface: string;
  border: string; borderMuted: string;
}> = {
  blue:          { primary: '#7dd3fc', primaryMuted: 'rgba(125,211,252,0.15)', bg: '#05101e', sidebar: 'rgba(4,11,22,0.97)',  surface: 'rgba(8,20,40,0.85)',  border: 'rgba(125,211,252,0.22)', borderMuted: 'rgba(125,211,252,0.1)' },
  pastel_pink:   { primary: '#f9a8d4', primaryMuted: 'rgba(249,168,212,0.15)', bg: '#190b14', sidebar: 'rgba(22,8,18,0.97)',  surface: 'rgba(38,14,28,0.85)', border: 'rgba(249,168,212,0.22)', borderMuted: 'rgba(249,168,212,0.1)' },
  pastel_red:    { primary: '#fca5a5', primaryMuted: 'rgba(252,165,165,0.15)', bg: '#1a0808', sidebar: 'rgba(20,5,5,0.97)',   surface: 'rgba(36,10,10,0.85)', border: 'rgba(252,165,165,0.22)', borderMuted: 'rgba(252,165,165,0.1)' },
  forest_green:  { primary: '#86efac', primaryMuted: 'rgba(134,239,172,0.15)', bg: '#051509', sidebar: 'rgba(4,14,7,0.97)',   surface: 'rgba(8,26,13,0.85)',  border: 'rgba(134,239,172,0.22)', borderMuted: 'rgba(134,239,172,0.1)' },
  dark_blue:     { primary: '#818cf8', primaryMuted: 'rgba(129,140,248,0.15)', bg: '#07071e', sidebar: 'rgba(5,5,22,0.97)',   surface: 'rgba(10,10,35,0.85)', border: 'rgba(129,140,248,0.22)', borderMuted: 'rgba(129,140,248,0.1)' },
  pastel_purple: { primary: '#c4b5fd', primaryMuted: 'rgba(196,181,253,0.15)', bg: '#0e0a1a', sidebar: 'rgba(12,7,22,0.97)',  surface: 'rgba(22,14,38,0.85)', border: 'rgba(196,181,253,0.22)', borderMuted: 'rgba(196,181,253,0.1)' },
  pastel_yellow: { primary: '#fef08a', primaryMuted: 'rgba(254,240,138,0.15)', bg: '#181600', sidebar: 'rgba(18,16,0,0.97)',  surface: 'rgba(30,27,5,0.85)',  border: 'rgba(254,240,138,0.22)', borderMuted: 'rgba(254,240,138,0.1)' },
  dark_yellow:   { primary: '#fcd34d', primaryMuted: 'rgba(252,211,77,0.15)',  bg: '#180f00', sidebar: 'rgba(18,10,0,0.97)',  surface: 'rgba(30,18,3,0.85)',  border: 'rgba(252,211,77,0.22)',  borderMuted: 'rgba(252,211,77,0.1)'  },
};

export function useTheme() {
  const themeColor = useMnemoStore((s) => s.themeColor);
  return THEMES[themeColor];
}
