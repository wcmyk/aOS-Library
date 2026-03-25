import { useMemo, useState } from 'react'
import { useEdenStore } from '../../state/useEdenStore'

const EDEN_FILENAME = 'EDEN'
const CODE_TRIGGER = 'import React, { useMemo, useRef, useState } from "react";'

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function NotepadApp() {
  const [filename, setFilename] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const unlock = useEdenStore((s) => s.unlock)

  const canUnlock = useMemo(() => filename.trim() === EDEN_FILENAME && noteBody.includes(CODE_TRIGGER), [filename, noteBody])

  const exportNote = () => {
    if (!canUnlock) {
      downloadFile(noteBody, `${filename || 'untitled'}.txt`, 'text/plain')
      return
    }
    const payload = {
      appId: 'EDENS_GARDEN_SIM',
      title: 'EDENS GARDEN',
      version: 1,
      createdAt: new Date().toISOString(),
      unlockSource: { filename: EDEN_FILENAME, trigger: CODE_TRIGGER },
    }
    downloadFile(JSON.stringify(payload, null, 2), 'EDENS GARDEN.dmg', 'application/json')
    unlock()
  }

  return (
    <div style={{ height: '100%', padding: 16, background: '#0a0f1d', color: '#e2e8f0', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 10 }}>
      <div style={{ fontWeight: 700 }}>Notepad</div>
      <div style={{ display: 'grid', gap: 10, gridTemplateRows: 'auto 1fr' }}>
        <input value={filename} onChange={(e) => setFilename(e.target.value)} placeholder='File name' style={{ borderRadius: 10, border: '1px solid #334155', background: '#111827', color: 'white', padding: '10px 12px' }} />
        <textarea value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder='Write your note or EDEN unlock code...' style={{ width: '100%', borderRadius: 12, border: '1px solid #334155', background: '#020617', color: '#bae6fd', padding: 12, fontFamily: 'monospace' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: canUnlock ? '#34d399' : '#94a3b8', fontSize: 12 }}>{canUnlock ? 'EDEN trigger detected. Export will install EDENS GARDEN.' : 'Standard export mode.'}</span>
        <button onClick={exportNote} style={{ border: 'none', background: '#2563eb', color: 'white', borderRadius: 10, padding: '9px 12px' }}>Export</button>
      </div>
    </div>
  )
}
