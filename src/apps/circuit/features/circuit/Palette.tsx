import { circuitTemplates } from './catalog'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'

interface PaletteProps {
  onAddComponent: (type: (typeof circuitTemplates)[number]['type']) => void
}

const componentColors: Record<string, { accent: string; bg: string }> = {
  battery: { accent: '#38bdf8', bg: 'rgba(56,189,248,0.08)' },
  resistor: { accent: '#c084fc', bg: 'rgba(192,132,252,0.08)' },
  led: { accent: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
  switch: { accent: '#94a3b8', bg: 'rgba(148,163,184,0.08)' },
  capacitor: { accent: '#38bdf8', bg: 'rgba(56,189,248,0.06)' },
}

const componentIcons: Record<string, JSX.Element> = {
  battery: (
    <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
      <line x1="0" y1="11" x2="10" y2="11" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="5" x2="10" y2="17" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
      <line x1="15" y1="2" x2="15" y2="20" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="5" x2="20" y2="17" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
      <line x1="25" y1="2" x2="25" y2="20" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="25" y1="11" x2="36" y2="11" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  resistor: (
    <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
      <line x1="0" y1="11" x2="6" y2="11" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="6" y="6" width="24" height="10" rx="3" fill="rgba(192,132,252,0.1)" stroke="#c084fc" strokeWidth="1.5" />
      <line x1="30" y1="11" x2="36" y2="11" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  led: (
    <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
      <line x1="0" y1="11" x2="8" y2="11" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="8,3 8,19 24,11" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="24" y1="3" x2="24" y2="19" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="11" x2="36" y2="11" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  switch: (
    <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
      <line x1="0" y1="11" x2="8" y2="11" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="11" r="2.5" fill="#94a3b8" />
      <line x1="10" y1="11" x2="26" y2="5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="28" cy="11" r="2.5" fill="#94a3b8" />
      <line x1="28" y1="11" x2="36" y2="11" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  capacitor: (
    <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
      <line x1="0" y1="11" x2="13" y2="11" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="3" x2="13" y2="19" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="23" y1="3" x2="23" y2="19" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="23" y1="11" x2="36" y2="11" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
}

export function Palette({ onAddComponent }: PaletteProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Component Palette</CardTitle>
        <CardDescription>Click to add a component to the canvas.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {circuitTemplates.map((template) => {
          const { accent, bg } = componentColors[template.type] ?? { accent: '#94a3b8', bg: 'rgba(148,163,184,0.08)' }
          const icon = componentIcons[template.type]
          return (
            <button
              key={template.type}
              type="button"
              className="rounded-2xl border border-white/[0.07] p-3 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]"
              style={{ background: bg }}
              onClick={() => onAddComponent(template.type)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-16 flex-shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-slate-950/40">
                  {icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold" style={{ color: accent }}>
                      {template.label}
                    </div>
                    <Button variant="primary" size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400 leading-4">{template.description}</div>
                </div>
              </div>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
