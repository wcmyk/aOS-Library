export function NeuralApp() {
  return (
    <div className="simple-site">
      <h2>Neural</h2>
      <div className="simple-card">
        <h3>AI Workspace</h3>
        <p>Neural app placeholder kept for branch compatibility and compile safety.</p>
import { useState, useRef, useEffect } from 'react';

// ── Agent definitions ─────────────────────────────────────────────────────────

type AgentId = 'math' | 'automation' | 'coding' | 'general' | 'science';

type Agent = {
  id: AgentId;
  name: string;
  icon: string;
  color: string;
  desc: string;
  systemPrompt: string;
  defaultImg: string;
};

const AGENTS: Agent[] = [
  {
    id: 'math',
    name: 'Axiom',
    icon: '∑',
    color: '#8b5cf6',
    desc: 'Mathematics & Quantitative Reasoning',
    systemPrompt: 'math',
    defaultImg: '',
  },
  {
    id: 'automation',
    name: 'Nexus',
    icon: '⚙',
    color: '#f59e0b',
    desc: 'Workflow Automation & Orchestration',
    systemPrompt: 'automation',
    defaultImg: '',
  },
  {
    id: 'coding',
    name: 'Forge',
    icon: '</> ',
    color: '#4f8cff',
    desc: 'Software Engineering & Code Generation',
    systemPrompt: 'coding',
    defaultImg: '',
  },
  {
    id: 'general',
    name: 'Oracle',
    icon: '◉',
    color: '#34d399',
    desc: 'General-Purpose Assistant',
    systemPrompt: 'general',
    defaultImg: '',
  },
  {
    id: 'science',
    name: 'Nova',
    icon: '⚗',
    color: '#f472b6',
    desc: 'Science, Research & Analysis',
    systemPrompt: 'science',
    defaultImg: '',
  },
];

// ── Training stats (simulated) ────────────────────────────────────────────────

type TrainingStats = {
  epochs: number;
  loss: number;
  accuracy: number;
  tokens: number;
};

function initialStats(id: AgentId): TrainingStats {
  const seed = id.charCodeAt(0) + id.charCodeAt(1);
  return {
    epochs: 24 + (seed % 40),
    loss: parseFloat((0.08 + (seed % 20) * 0.004).toFixed(4)),
    accuracy: parseFloat((88 + (seed % 10) * 0.7).toFixed(1)),
    tokens: 2_400_000 + seed * 180_000,
  };
}

// ── Canned agent responses by domain ─────────────────────────────────────────

const RESPONSES: Record<AgentId, string[]> = {
  math: [
    'To solve this, we apply the fundamental theorem of calculus. The integral evaluates to a closed-form expression using substitution.',
    'This is a classic linear algebra problem. The eigenvalues of the matrix can be found by solving det(A − λI) = 0.',
    'Using Bayes\' theorem: P(A|B) = P(B|A) · P(A) / P(B). Plug in the given prior and likelihood values.',
    'The series converges by the ratio test since the limit of |a_{n+1}/a_n| as n→∞ is less than 1.',
    'Applying the quadratic formula: x = (−b ± √(b²−4ac)) / 2a. With your coefficients, the discriminant is positive so two real roots exist.',
  ],
  automation: [
    'I\'ve analyzed your workflow. The bottleneck is the sequential API calls in steps 3–5. Parallelizing them with Promise.all would reduce total latency by ~60%.',
    'For this recurring task I recommend a cron-based trigger with idempotency keys to safely handle retries without duplicating side effects.',
    'The automation pipeline can be refactored: extract the transformation logic into a reusable function, add a dead-letter queue for failures, and instrument with structured logging.',
    'Based on your description, a webhook-driven architecture with a lightweight state machine would handle this event sequence more reliably than polling.',
    'I can generate the Terraform module for this infrastructure. Do you want me to include a remote backend configuration and lock file as well?',
  ],
  coding: [
    '```typescript\nfunction binarySearch<T>(arr: T[], target: T): number {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >>> 1;\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}\n```\nTime complexity: O(log n). Make sure the input array is sorted.',
    'The bug is a closure issue inside the loop. Replace `var` with `let` or use an IIFE to capture the loop variable correctly at each iteration.',
    'For this use case I\'d recommend a trie data structure over a hash map. It gives O(k) prefix lookup where k is the key length, with better memory locality.',
    'You should memoize this recursive function. Add a `cache: Map<string, number>` and check it before computing. This reduces time complexity from exponential to linear.',
    'The SQL query can be optimized: replace the correlated subquery with a window function — `ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC)`. Index on (user_id, created_at) will make this fast.',
  ],
  general: [
    'That\'s a great question. Let me break it down into three key points: the historical context, the current state, and the practical implications for your use case.',
    'I see two main perspectives here. The first emphasizes efficiency and pragmatism, while the second prioritizes long-term sustainability. Your decision depends on the time horizon you\'re optimizing for.',
    'Based on what you\'ve described, I\'d recommend starting with the simpler approach to validate your assumptions before investing in the more complex solution.',
    'Here\'s a concise summary: the core idea is X, the main trade-off is Y, and the recommended path forward given your constraints is Z.',
    'Interesting — this connects to a broader pattern I\'ve observed. The underlying principle is related to the concept of diminishing returns in systems under load.',
  ],
  science: [
    'This phenomenon is explained by the second law of thermodynamics. Entropy in an isolated system always increases or stays constant, which is why the process is irreversible.',
    'The experimental design has a confounding variable: the control group was not matched for age. A stratified randomization approach would eliminate this bias.',
    'According to current literature, the p-value threshold of 0.05 is being reconsidered in many fields. For this type of study, a Bayesian framework with pre-registered priors might be more appropriate.',
    'The mechanism is well-understood: receptor binding triggers a conformational change that activates the downstream signaling cascade via phosphorylation.',
    'Climate models predict a 2.1°C increase in mean global temperature under RCP 4.5 by 2100. The confidence interval narrows significantly when ocean heat uptake parameterizations are improved.',
  ],
};

function getResponse(agentId: AgentId, msgIndex: number): string {
  const pool = RESPONSES[agentId];
  return pool[msgIndex % pool.length];
}

// ── Message type ──────────────────────────────────────────────────────────────

type Message = {
  role: 'user' | 'agent';
  text: string;
  agentImg?: string; // custom profile image url/emoji if set
};

// ── PROFILE_TRIGGER keyword ────────────────────────────────────────────────────

const PROFILE_TRIGGER = 'active&&&%%%';

// ── Assets folder path for profile images ─────────────────────────────────────

const ASSETS_BASE = `${import.meta.env.BASE_URL}assets/neural/`;

// ── Component ─────────────────────────────────────────────────────────────────

export function NeuralApp() {
  const [activeAgentId, setActiveAgentId] = useState<AgentId>('general');
  const [conversations, setConversations] = useState<Record<AgentId, Message[]>>({
    math: [],
    automation: [],
    coding: [],
    general: [],
    science: [],
  });
  const [profileImages, setProfileImages] = useState<Record<AgentId, string>>({
    math: '',
    automation: '',
    coding: '',
    general: '',
    science: '',
  });
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [trainingStats, setTrainingStats] = useState<Record<AgentId, TrainingStats>>(() => {
    const out = {} as Record<AgentId, TrainingStats>;
    for (const a of AGENTS) out[a.id] = initialStats(a.id);
    return out;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgCountRef = useRef<Record<AgentId, number>>({ math: 0, automation: 0, coding: 0, general: 0, science: 0 });

  const agent = AGENTS.find((a) => a.id === activeAgentId)!;
  const messages = conversations[activeAgentId];
  const currentProfileImg = profileImages[activeAgentId];
  const stats = trainingStats[activeAgentId];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || typing) return;

    // Check for profile image trigger
    if (text.toLowerCase().includes(PROFILE_TRIGGER.toLowerCase())) {
      const afterTrigger = text.substring(text.toLowerCase().indexOf(PROFILE_TRIGGER.toLowerCase()) + PROFILE_TRIGGER.length).trim();
      const imageName = afterTrigger || '';
      const newImg = imageName ? `${ASSETS_BASE}${imageName}` : '';
      setProfileImages((p) => ({ ...p, [activeAgentId]: newImg }));
      const userMsg: Message = { role: 'user', text };
      const agentMsg: Message = {
        role: 'agent',
        text: imageName
          ? `Profile image updated to "${imageName}". If the image is not found in the assets/neural/ folder, the default icon will be shown.`
          : 'Profile image reset to default.',
        agentImg: newImg,
      };
      setConversations((p) => ({ ...p, [activeAgentId]: [...p[activeAgentId], userMsg, agentMsg] }));
      setInput('');
      return;
    }

    const userMsg: Message = { role: 'user', text };
    setConversations((p) => ({ ...p, [activeAgentId]: [...p[activeAgentId], userMsg] }));
    setInput('');
    setTyping(true);

    const idx = msgCountRef.current[activeAgentId];
    msgCountRef.current[activeAgentId] = idx + 1;

    setTimeout(() => {
      const responseText = getResponse(activeAgentId, idx);
      const agentMsg: Message = { role: 'agent', text: responseText, agentImg: currentProfileImg };
      setConversations((p) => ({ ...p, [activeAgentId]: [...p[activeAgentId], agentMsg] }));
      setTyping(false);
      // Slightly bump training stats on each interaction
      setTrainingStats((p) => ({
        ...p,
        [activeAgentId]: {
          ...p[activeAgentId],
          epochs: p[activeAgentId].epochs + 1,
          loss: Math.max(0.01, parseFloat((p[activeAgentId].loss - 0.0003).toFixed(4))),
          accuracy: Math.min(99.9, parseFloat((p[activeAgentId].accuracy + 0.02).toFixed(1))),
          tokens: p[activeAgentId].tokens + Math.floor(text.length * 12),
        },
      }));
    }, 800 + Math.random() * 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const runTrainingStep = () => {
    setTrainingStats((p) => ({
      ...p,
      [activeAgentId]: {
        ...p[activeAgentId],
        epochs: p[activeAgentId].epochs + 5,
        loss: Math.max(0.005, parseFloat((p[activeAgentId].loss - 0.002).toFixed(4))),
        accuracy: Math.min(99.9, parseFloat((p[activeAgentId].accuracy + 0.15).toFixed(1))),
        tokens: p[activeAgentId].tokens + 500_000,
      },
    }));
  };

  function AgentAvatar({ img, icon, color, size = 28 }: { img: string; icon: string; color: string; size?: number }) {
    return (
      <div className="neural-msg-avatar" style={{ width: size, height: size, background: img ? 'transparent' : color, borderRadius: 8 }}>
        {img ? <img src={img} alt="agent" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : icon}
      </div>
    );
  }

  return (
    <div className="neural-shell">
      {/* Header */}
      <div className="neural-header">
        <div className="neural-logo-mark">🧠</div>
        <span className="neural-brand">Neural Studio</span>
        <span className="neural-header-status">aOS AI Platform · {AGENTS.length} agents loaded</span>
      </div>

      <div className="neural-body">
        {/* Sidebar: agent list */}
        <div className="neural-sidebar">
          <div className="neural-sidebar-title">Agents</div>
          {AGENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`neural-agent-btn${activeAgentId === a.id ? ' active' : ''}`}
              onClick={() => setActiveAgentId(a.id)}
            >
              <div className="neural-agent-icon" style={{ background: `${a.color}22`, color: a.color }}>
                {profileImages[a.id]
                  ? <img src={profileImages[a.id]} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  : a.icon
                }
              </div>
              <div className="neural-agent-info">
                <div className="neural-agent-name">{a.name}</div>
                <div className="neural-agent-type">{a.id.charAt(0).toUpperCase() + a.id.slice(1)}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Chat area */}
        <div className="neural-chat">
          <div className="neural-chat-header">
            <div className="neural-active-avatar" style={{ background: currentProfileImg ? 'transparent' : `${agent.color}22` }}>
              {currentProfileImg
                ? <img src={currentProfileImg} alt={agent.name} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : <span style={{ color: agent.color, fontSize: 18 }}>{agent.icon}</span>
              }
            </div>
            <div>
              <div className="neural-active-name">{agent.name}</div>
              <div className="neural-active-desc">{agent.desc}</div>
            </div>
            <div className="neural-profile-hint">Type "active&&&%%% filename.png" to set profile image</div>
          </div>

          <div className="neural-messages">
            {messages.length === 0 && (
              <div style={{ color: '#3e5478', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                Start a conversation with {agent.name}…
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`neural-msg ${msg.role}`}>
                {msg.role === 'agent' && (
                  <div className="neural-msg-avatar" style={{ background: (msg.agentImg || currentProfileImg) ? 'transparent' : `${agent.color}22`, width: 28, height: 28, borderRadius: 8, fontSize: 14, display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden' }}>
                    {(msg.agentImg || currentProfileImg)
                      ? <img src={msg.agentImg || currentProfileImg} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                      : <span style={{color:agent.color}}>{agent.icon}</span>
                    }
                  </div>
                )}
                <div className="neural-msg-bubble" style={{ whiteSpace: 'pre-wrap', fontFamily: msg.text.startsWith('```') ? 'monospace' : 'inherit' }}>
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="neural-msg-avatar" style={{ background: '#0a66c2', width: 28, height: 28, borderRadius: 8, fontSize: 12, display:'flex',alignItems:'center',justifyContent:'center', color:'white', fontWeight:700 }}>
                    U
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div className="neural-msg agent">
                <div className="neural-msg-avatar" style={{ background: `${agent.color}22`, width: 28, height: 28, borderRadius: 8, fontSize: 14, display:'flex',alignItems:'center',justifyContent:'center', color: agent.color }}>
                  {agent.icon}
                </div>
                <div className="neural-msg-bubble" style={{ color: '#5e7399', fontStyle: 'italic' }}>
                  {agent.name} is thinking…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="neural-input-area">
            <input
              className="neural-input"
              placeholder={`Ask ${agent.name} anything…`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={typing}
            />
            <button type="button" className="neural-send-btn" onClick={sendMessage} disabled={!input.trim() || typing}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 2l5 5-5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        {/* Training panel */}
        <div className="neural-training">
          <div className="neural-train-title">Training Status</div>
          <div className="neural-train-stat">
            <span className="neural-train-stat-label">Epochs</span>
            <span className="neural-train-stat-value">{stats.epochs}</span>
          </div>
          <div className="neural-train-stat">
            <span className="neural-train-stat-label">Loss</span>
            <span className="neural-train-stat-value">{stats.loss}</span>
          </div>
          <div className="neural-train-bar">
            <div className="neural-train-bar-fill" style={{ width: `${Math.min(100, (1 - stats.loss / 0.3) * 100)}%` }} />
          </div>
          <div className="neural-train-stat">
            <span className="neural-train-stat-label">Accuracy</span>
            <span className="neural-train-stat-value">{stats.accuracy}%</span>
          </div>
          <div className="neural-train-bar">
            <div className="neural-train-bar-fill" style={{ width: `${stats.accuracy}%`, background: 'linear-gradient(90deg, #34d399, #4f8cff)' }} />
          </div>
          <div className="neural-train-stat">
            <span className="neural-train-stat-label">Tokens</span>
            <span className="neural-train-stat-value">{(stats.tokens / 1_000_000).toFixed(1)}M</span>
          </div>
          <button type="button" className="neural-train-btn" onClick={runTrainingStep}>
            Run Training Step
          </button>

          <div className="neural-profile-img-section">
            <div className="neural-profile-img-label">Profile Image</div>
            <div className="neural-profile-img-preview" style={{ background: currentProfileImg ? 'transparent' : `${agent.color}22` }}>
              {currentProfileImg
                ? <img src={currentProfileImg} alt="profile" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : <span style={{ color: agent.color }}>{agent.icon}</span>
              }
            </div>
            <div className="neural-profile-img-hint">
              To set: type<br />
              <span style={{ color: '#4f8cff', fontFamily: 'monospace', fontSize: 9 }}>active&&&%%% filename</span><br />
              Files go in<br />
              <span style={{ color: '#5e7399', fontSize: 9 }}>public/assets/neural/</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
