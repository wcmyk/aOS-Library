import { useEffect, useMemo, useRef, useState } from 'react';

type AgentId = 'math' | 'automation' | 'coding' | 'general' | 'science';

type Agent = {
  id: AgentId;
  name: string;
  icon: string;
  color: string;
  desc: string;
};

type Message = { role: 'user' | 'agent'; text: string };

const AGENTS: Agent[] = [
  { id: 'math', name: 'Axiom', icon: '∑', color: '#8b5cf6', desc: 'Math reasoning and problem solving' },
  { id: 'automation', name: 'Nexus', icon: '⚙', color: '#f59e0b', desc: 'Automation design and workflow orchestration' },
  { id: 'coding', name: 'Forge', icon: '</>', color: '#4f8cff', desc: 'Code generation, debugging, and architecture' },
  { id: 'general', name: 'Orbit', icon: '◉', color: '#34d399', desc: 'General knowledge and everyday tasks' },
  { id: 'science', name: 'Nova', icon: '⚗', color: '#f472b6', desc: 'Science research and technical analysis' },
];

const emptyConversations: Record<AgentId, Message[]> = {
  math: [],
  automation: [],
  coding: [],
  general: [],
  science: [],
};

export function NeuralApp() {
  const [activeAgentId, setActiveAgentId] = useState<AgentId>('general');
  const [conversations, setConversations] = useState<Record<AgentId, Message[]>>(emptyConversations);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const [temperature, setTemperature] = useState(0.8);
  const [topK, setTopK] = useState(40);
  const [topP, setTopP] = useState(0.9);
  const [maxTokens, setMaxTokens] = useState(120);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'ok' | 'down'>('unknown');
  const endRef = useRef<HTMLDivElement>(null);

  const activeAgent = useMemo(() => AGENTS.find((a) => a.id === activeAgentId) ?? AGENTS[0], [activeAgentId]);
  const messages = conversations[activeAgentId] ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then((r) => r.json())
      .then((d) => setApiStatus(d?.ok ? 'ok' : 'down'))
      .catch(() => setApiStatus('down'));
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || typing) return;

    setConversations((prev) => ({ ...prev, [activeAgentId]: [...prev[activeAgentId], { role: 'user', text }] }));
    setInput('');
    setTyping(true);

    try {
      const prompt = `[Agent:${activeAgent.name}] ${activeAgent.desc}\n${text}`;
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          temperature,
          top_k: topK,
          top_p: topP,
          max_new_tokens: maxTokens,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.detail || 'Chat request failed');
      }

      setApiStatus('ok');
      setConversations((prev) => ({
        ...prev,
        [activeAgentId]: [...prev[activeAgentId], { role: 'agent', text: payload.reply || '(empty reply)' }],
      }));
    } catch (err) {
      setApiStatus('down');
      const msg = err instanceof Error ? err.message : 'unknown error';
      setConversations((prev) => ({
        ...prev,
        [activeAgentId]: [...prev[activeAgentId], { role: 'agent', text: `API error: ${msg}` }],
      }));
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="neural-shell">
      <div className="neural-header">
        <div className="neural-logo-mark">🧠</div>
        <div>
          <div className="neural-brand">Neural Studio</div>
          <div className="neural-sub">Scratch-trained local LM via FastAPI · status: {apiStatus}</div>
        </div>
      </div>

      <div className="neural-layout">
        <aside className="neural-agents">
          {AGENTS.map((agent) => (
            <button key={agent.id} className={`neural-agent${agent.id === activeAgentId ? ' active' : ''}`} onClick={() => setActiveAgentId(agent.id)} type="button">
              <span className="neural-agent-glyph" style={{ background: `${agent.color}22`, color: agent.color }}>{agent.icon}</span>
              <span>
                <strong>{agent.name}</strong>
                <small>{agent.desc}</small>
              </span>
            </button>
          ))}
        </aside>

        <section className="neural-chat">
          <div className="neural-chat-head">
            <div className="neural-avatar" style={{ background: `${activeAgent.color}22` }}>
              <span style={{ color: activeAgent.color }}>{activeAgent.icon}</span>
            </div>
            <div>
              <div className="neural-active-title">{activeAgent.name}</div>
              <div className="neural-active-desc">{activeAgent.desc}</div>
            </div>
          </div>

          <div className="neural-log">
            {messages.map((m, i) => <div key={i} className={`neural-bubble ${m.role}`}>{m.text}</div>)}
            {typing && <div className="neural-bubble agent">{activeAgent.name} is thinking…</div>}
            <div ref={endRef} />
          </div>

          <div className="neural-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void sendMessage(); }}
              placeholder={`Message ${activeAgent.name}...`}
              className="neural-input"
            />
            <button type="button" className="neural-send" onClick={() => void sendMessage()}>Send</button>
          </div>
        </section>

        <aside className="neural-train">
          <h4>Generation controls</h4>
          <div className="neural-stat"><span>Temperature</span><strong>{temperature.toFixed(2)}</strong></div>
          <input type="range" min="0.1" max="1.5" step="0.05" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} />
          <div className="neural-stat"><span>Top-k</span><strong>{topK}</strong></div>
          <input type="range" min="1" max="100" step="1" value={topK} onChange={(e) => setTopK(Number(e.target.value))} />
          <div className="neural-stat"><span>Top-p</span><strong>{topP.toFixed(2)}</strong></div>
          <input type="range" min="0.1" max="1" step="0.05" value={topP} onChange={(e) => setTopP(Number(e.target.value))} />
          <div className="neural-stat"><span>Max new tokens</span><strong>{maxTokens}</strong></div>
          <input type="range" min="16" max="256" step="8" value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))} />
          <p className="neural-hint">Backend expected at <code>http://localhost:8000/chat</code>. Use <code>MODEL_BACKEND=scratch</code> or <code>MODEL_BACKEND=finetuned</code> when starting the API.</p>
        </aside>
      </div>
    </div>
  );
}
