import { useState } from 'react'

type TerminalLine = { id: number; kind: 'system' | 'input' | 'output' | 'error'; text: string }
const VALID_USERNAME = 'EDEN'
const VALID_PASSWORD = 'NEDEEDEN'

function getCommandOutput(commandRaw: string): Array<{ kind: TerminalLine['kind']; text: string }> {
  const command = commandRaw.trim().toLowerCase()
  switch (command) {
    case 'help': return [{ kind: 'output', text: 'Available commands: help, about, archive, logs, users, modules, clear, exit' }]
    case 'about': return [{ kind: 'output', text: 'EDENS GARDEN is a fictional sealed archive. No real system access is performed.' }]
    case 'archive': return [{ kind: 'output', text: 'ORCHARD.LOG | ROOT/GENESIS.TXT | VAULT/REDACTED-01 | GLASS-SEED' }]
    case 'logs': return [{ kind: 'output', text: '[00:00:01] bootstrap :: success' }, { kind: 'output', text: '[00:00:03] terminal shell :: ready' }]
    case 'users': return [{ kind: 'output', text: '- EDEN' }, { kind: 'output', text: '- GARDENER' }, { kind: 'output', text: '- ROOT-WITNESS' }]
    case 'modules': return [{ kind: 'output', text: 'Modules are sealed. Simulator provides harmless lore records only.' }]
    case 'clear': return []
    case 'exit': return [{ kind: 'system', text: 'Session terminated.' }]
    default: return [{ kind: 'error', text: `Unknown command: ${commandRaw}` }]
  }
}

export function EdenGardenApp() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [input, setInput] = useState('')
  const [lines, setLines] = useState<TerminalLine[]>([{ id: 0, kind: 'system', text: 'EDENS GARDEN boot sequence initialized.' }])

  const login = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim() === VALID_USERNAME && password === VALID_PASSWORD) {
      setLoggedIn(true)
      setLines((prev) => [...prev, { id: prev.length + 1, kind: 'system', text: 'Authentication successful. Type "help".' }])
      return
    }
    setLines((prev) => [...prev, { id: prev.length + 1, kind: 'error', text: 'Authentication failed.' }])
  }

  const run = (e: React.FormEvent) => {
    e.preventDefault()
    const command = input
    setLines((prev) => [...prev, { id: prev.length + 1, kind: 'input', text: `garden@eden:~$ ${command}` }, ...getCommandOutput(command).map((l, i) => ({ ...l, id: prev.length + i + 2 }))])
    setInput('')
  }

  return (
    <div style={{ height: '100%', background: '#020617', color: '#86efac', padding: 16, fontFamily: 'monospace' }}>
      <div style={{ marginBottom: 10 }}>EDENS GARDEN :: secure shell</div>
      {!loggedIn ? (
        <form onSubmit={login} style={{ display: 'grid', gap: 8 }}>
          <div>Username: EDEN | Password: NEDEEDEN</div>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder='Username' style={{ background: '#000', border: '1px solid #14532d', borderRadius: 8, color: '#86efac', padding: 8 }} />
          <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} placeholder='Password' style={{ background: '#000', border: '1px solid #14532d', borderRadius: 8, color: '#86efac', padding: 8 }} />
          <button type='submit' style={{ width: 130, padding: '8px 10px', borderRadius: 8, border: '1px solid #14532d', background: '#052e16', color: '#86efac' }}>Authenticate</button>
        </form>
      ) : (
        <>
          <div style={{ height: 360, overflow: 'auto', border: '1px solid #14532d', borderRadius: 10, padding: 10, background: '#010706' }}>
            {lines.map((line) => <div key={line.id} style={{ color: line.kind === 'error' ? '#f87171' : line.kind === 'system' ? '#4ade80' : '#86efac' }}>{line.text}</div>)}
          </div>
          <form onSubmit={run} style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder='Enter command' style={{ flex: 1, background: '#000', border: '1px solid #14532d', borderRadius: 8, color: '#86efac', padding: 8 }} />
            <button type='submit' style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #14532d', background: '#052e16', color: '#86efac' }}>Run</button>
          </form>
        </>
      )}
    </div>
  )
}
