import { circuitTemplates } from './catalog'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'

interface PaletteProps {
  onAddComponent: (type: (typeof circuitTemplates)[number]['type']) => void
}

export function Palette({ onAddComponent }: PaletteProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Component Palette</CardTitle>
        <CardDescription>Drag-free MVP placement: add a component, then reposition it directly on the canvas.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {circuitTemplates.map((template) => (
          <button
            key={template.type}
            type="button"
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
            onClick={() => onAddComponent(template.type)}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">{template.label}</div>
                <div className="mt-1 text-xs text-slate-300">{template.description}</div>
              </div>
              <Button variant="primary" size="sm">Add</Button>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  )
}
