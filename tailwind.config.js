/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#06111f',
        foreground: '#edf5ff',
        card: 'rgba(10, 25, 47, 0.8)',
        border: 'rgba(148, 163, 184, 0.2)',
        muted: '#94a3b8',
        primary: '#7dd3fc',
        accent: '#a78bfa',
        success: '#34d399',
        warning: '#f59e0b',
        destructive: '#f87171',
      },
      boxShadow: {
        glass: '0 20px 80px rgba(15, 23, 42, 0.45)',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}
