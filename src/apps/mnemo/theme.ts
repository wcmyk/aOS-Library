import { useMnemoStore } from './state/useMnemoStore';
import type { ThemeColor } from './types';

export const THEMES: Record<ThemeColor, {
  primary: string; primaryMuted: string;
  bg: string; sidebar: string; surface: string;
  border: string; borderMuted: string;
  text: string; textMuted: string;
  shadow: string; isDark: boolean;
}> = {
  blue: {
    primary: '#38BDF8',
    primaryMuted: 'rgba(56,189,248,0.12)',
    bg: '#040E1C',
    sidebar: '#020A14',
    surface: 'rgba(6,18,36,0.95)',
    border: 'rgba(56,189,248,0.18)',
    borderMuted: 'rgba(56,189,248,0.08)',
    text: '#E2F0FB',
    textMuted: '#6A9AB8',
    shadow: 'rgba(56,189,248,0.12)',
    isDark: true,
  },
  pastel_pink: {
    primary: '#F04E98',
    primaryMuted: '#FDEEF6',
    bg: '#FFF3F8',
    sidebar: '#FFFFFF',
    surface: '#FFFFFF',
    border: 'rgba(240,78,152,0.16)',
    borderMuted: 'rgba(240,78,152,0.08)',
    text: '#3B0A28',
    textMuted: '#A0607E',
    shadow: 'rgba(240,78,152,0.14)',
    isDark: false,
  },
  pastel_red: {
    primary: '#F87171',
    primaryMuted: '#FEF2F2',
    bg: '#FFF7F7',
    sidebar: '#FFFFFF',
    surface: '#FFFFFF',
    border: 'rgba(248,113,113,0.16)',
    borderMuted: 'rgba(248,113,113,0.08)',
    text: '#3B0A0A',
    textMuted: '#A06060',
    shadow: 'rgba(248,113,113,0.14)',
    isDark: false,
  },
  forest_green: {
    primary: '#34D399',
    primaryMuted: 'rgba(52,211,153,0.1)',
    bg: '#021A0A',
    sidebar: '#011209',
    surface: 'rgba(3,20,10,0.95)',
    border: 'rgba(52,211,153,0.2)',
    borderMuted: 'rgba(52,211,153,0.08)',
    text: '#D1FAE5',
    textMuted: '#5A9A75',
    shadow: 'rgba(52,211,153,0.12)',
    isDark: true,
  },
  dark_blue: {
    primary: '#818CF8',
    primaryMuted: 'rgba(129,140,248,0.12)',
    bg: '#04051A',
    sidebar: '#030418',
    surface: 'rgba(6,8,28,0.95)',
    border: 'rgba(129,140,248,0.2)',
    borderMuted: 'rgba(129,140,248,0.08)',
    text: '#E0E2FF',
    textMuted: '#6870B8',
    shadow: 'rgba(129,140,248,0.12)',
    isDark: true,
  },
  pastel_purple: {
    primary: '#C084FC',
    primaryMuted: '#F5F0FF',
    bg: '#FBF7FF',
    sidebar: '#FFFFFF',
    surface: '#FFFFFF',
    border: 'rgba(192,132,252,0.16)',
    borderMuted: 'rgba(192,132,252,0.08)',
    text: '#2E0A48',
    textMuted: '#8B5AA0',
    shadow: 'rgba(192,132,252,0.14)',
    isDark: false,
  },
  pastel_yellow: {
    primary: '#F59E0B',
    primaryMuted: '#FFFBEB',
    bg: '#FFFDF4',
    sidebar: '#FFFFFF',
    surface: '#FFFFFF',
    border: 'rgba(245,158,11,0.18)',
    borderMuted: 'rgba(245,158,11,0.08)',
    text: '#3B2800',
    textMuted: '#9B7020',
    shadow: 'rgba(245,158,11,0.14)',
    isDark: false,
  },
  dark_yellow: {
    primary: '#FCD34D',
    primaryMuted: 'rgba(252,211,77,0.12)',
    bg: '#150F00',
    sidebar: '#100B00',
    surface: 'rgba(24,18,2,0.95)',
    border: 'rgba(252,211,77,0.2)',
    borderMuted: 'rgba(252,211,77,0.08)',
    text: '#FEF3C7',
    textMuted: '#8B7040',
    shadow: 'rgba(252,211,77,0.12)',
    isDark: true,
  },
};

export function useTheme() {
  const themeColor = useMnemoStore((s) => s.themeColor);
  return THEMES[themeColor];
}
