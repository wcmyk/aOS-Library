import { useEffect, useMemo, useRef, useState } from 'react';

type AgentId = 'math' | 'automation' | 'coding' | 'general' | 'science';

type Agent = {
  id: AgentId;
  name: string;
  icon: string;
  color: string;
  desc: string;
};

type Message = {
  role: 'user' | 'agent';
  text: string;
};

type TrainingStats = {
  epochs: number;
  loss: number;
  accuracy: number;
  tokens: number;
};

const PROFILE_TRIGGER = 'active&&&%%%';
const ASSETS_BASE = `${import.meta.env.BASE_URL}assets/neural/`;

const AGENTS: Agent[] = [
  { id: 'math', name: 'Axiom', icon: '∑', color: '#8b5cf6', desc: 'Math reasoning and problem solving' },
  { id: 'automation', name: 'Nexus', icon: '⚙', color: '#f59e0b', desc: 'Automation design and workflow orchestration' },
  { id: 'coding', name: 'Forge', icon: '</>', color: '#4f8cff', desc: 'Code generation, debugging, and architecture' },
  { id: 'general', name: 'Orbit', icon: '◉', color: '#34d399', desc: 'General knowledge and everyday tasks' },
  { id: 'science', name: 'Nova', icon: '⚗', color: '#f472b6', desc: 'Science research and technical analysis' },
];

const RESPONSES: Record<AgentId, string[]> = {
  math: [
    'Great question. I can break it down step by step and provide a full derivation if you want.',
    'For this one, use substitution first, simplify, and then evaluate boundaries at the end.',
  ],
  automation: [
    'I recommend splitting this workflow into trigger, validation, execution, and retry layers.',
    'A queue + idempotency key pattern will make this robust under retries and partial failure.',
  ],
  coding: [
    'I can generate the code path for this. Tell me your language and constraints.',
    'You can improve this by extracting reusable helpers and adding strict input typing.',
  ],
  general: [
    'Here is the short answer first, then I can provide a deeper explanation if needed.',
    'I see two good options. I can compare trade-offs based on speed vs quality.',
  ],
  science: [
    'Let us frame a hypothesis, define variables, and choose an evaluation method.',
    'I can summarize the scientific consensus and highlight current open questions.',
  ],
};

const initStats = (id: AgentId): TrainingStats => {
  const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return {
    epochs: 12 + (seed % 24),
    loss: Number((0.22 - (seed % 7) * 0.01).toFixed(3)),
    accuracy: Number((82 + (seed % 12) * 0.7).toFixed(1)),
    tokens: 900_000 + seed * 7_000,
  };
};

const defaultTrainingStats: Record<AgentId, TrainingStats> = {
  math: initStats('math'),
  automation: initStats('automation'),
  coding: initStats('coding'),
  general: initStats('general'),
  science: initStats('science'),
};

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
  const [trainingStats, setTrainingStats] = useState<Record<AgentId, TrainingStats>>(defaultTrainingStats);
  const [profileImages, setProfileImages] = useState<Record<AgentId, string>>({ math: '', automation: '', coding: '', general: '', science: '' });
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const activeAgent = useMemo(() => AGENTS.find((a) => a.id === activeAgentId) ?? AGENTS[0], [activeAgentId]);
  const messages = conversations[activeAgentId] ?? [];
  const stats = trainingStats[activeAgentId];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || typing) return;

    const triggerIdx = text.toLowerCase().indexOf(PROFILE_TRIGGER.toLowerCase());
    if (triggerIdx !== -1) {
      const filename = text.slice(triggerIdx + PROFILE_TRIGGER.length).trim();
      const imagePath = filename ? `${ASSETS_BASE}${filename}` : '';

      setProfileImages((prev) => ({ ...prev, [activeAgentId]: imagePath }));
      setConversations((prev) => ({
        ...prev,
        [activeAgentId]: [
          ...prev[activeAgentId],
          { role: 'user', text },
          {
            role: 'agent',
            text: filename
              ? `Updated profile image for ${activeAgent.name} to ${filename}.`
              : `Reset ${activeAgent.name} profile image to default icon.`,
          },
        ],
      }));
      setInput('');
      return;
    }

    setConversations((prev) => ({ ...prev, [activeAgentId]: [...prev[activeAgentId], { role: 'user', text }] }));
    setInput('');
    setTyping(true);

    window.setTimeout(() => {
      const replyPool = RESPONSES[activeAgentId];
      const response = replyPool[(messages.length + text.length) % replyPool.length];

      setConversations((prev) => ({ ...prev, [activeAgentId]: [...prev[activeAgentId], { role: 'agent', text: response }] }));
      setTrainingStats((prev) => ({
        ...prev,
        [activeAgentId]: {
          ...prev[activeAgentId],
          epochs: prev[activeAgentId].epochs + 1,
          loss: Math.max(0.02, Number((prev[activeAgentId].loss - 0.002).toFixed(3))),
          accuracy: Math.min(99.9, Number((prev[activeAgentId].accuracy + 0.1).toFixed(1))),
          tokens: prev[activeAgentId].tokens + Math.max(200, text.length * 10),
        },
      }));
      setTyping(false);
    }, 650);
  };

  const runTrainingStep = () => {
    setTrainingStats((prev) => ({
      ...prev,
      [activeAgentId]: {
        ...prev[activeAgentId],
        epochs: prev[activeAgentId].epochs + 5,
        loss: Math.max(0.01, Number((prev[activeAgentId].loss - 0.01).toFixed(3))),
        accuracy: Math.min(99.9, Number((prev[activeAgentId].accuracy + 0.3).toFixed(1))),
        tokens: prev[activeAgentId].tokens + 250_000,
      },
    }));
  };

  const currentImage = profileImages[activeAgentId];

  return (
    <div className="neural-shell">
      <div className="neural-header">
        <div className="neural-logo-mark">🧠</div>
        <div>
          <div className="neural-brand">Neural Studio</div>
          <div className="neural-sub">Train and chat with 5 specialized agents</div>
        </div>
      </div>

      <div className="neural-layout">
        <aside className="neural-agents">
          {AGENTS.map((agent) => (
            <button key={agent.id} className={`neural-agent${agent.id === activeAgentId ? ' active' : ''}`} onClick={() => setActiveAgentId(agent.id)} type="button">
              <span className="neural-agent-glyph" style={{ background: `${agent.color}22`, color: agent.color }}>
                {profileImages[agent.id] ? <img src={profileImages[agent.id]} alt={agent.name} /> : agent.icon}
              </span>
              <span>
                <strong>{agent.name}</strong>
                <small>{agent.desc}</small>
              </span>
            </button>
          ))}
        </aside>

        <section className="neural-chat">
          <div className="neural-chat-head">
            <div className="neural-avatar" style={{ background: currentImage ? 'transparent' : `${activeAgent.color}22` }}>
              {currentImage ? <img src={currentImage} alt={activeAgent.name} /> : <span style={{ color: activeAgent.color }}>{activeAgent.icon}</span>}
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
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
              placeholder={`Message ${activeAgent.name}...`}
              className="neural-input"
            />
            <button type="button" className="neural-send" onClick={sendMessage}>Send</button>
          </div>
        </section>

        <aside className="neural-train">
          <h4>Training</h4>
          <div className="neural-stat"><span>Epochs</span><strong>{stats.epochs}</strong></div>
          <div className="neural-stat"><span>Loss</span><strong>{stats.loss}</strong></div>
          <div className="neural-stat"><span>Accuracy</span><strong>{stats.accuracy}%</strong></div>
          <div className="neural-stat"><span>Tokens</span><strong>{(stats.tokens / 1_000_000).toFixed(2)}M</strong></div>
          <button type="button" className="neural-train-btn" onClick={runTrainingStep}>Run Training Step</button>
          <p className="neural-hint">Profile switch: <code>active&&&%%% filename.png</code><br />Assets path: <code>public/assets/neural/</code></p>
        </aside>
      </div>
    </div>
  );
}
