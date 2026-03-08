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
  vocab: number;
};

type LanguageModel = {
  unigram: Record<string, number>;
  bigram: Record<string, Record<string, number>>;
  starts: string[];
  tokenCount: number;
  vocabSize: number;
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

const AGENT_CORPUS: Record<AgentId, string[]> = {
  math: [
    'To solve an equation, isolate variables and verify each algebraic transformation keeps equality intact.',
    'Proof strategy depends on structure. Direct proof, contradiction, and induction are all useful tools.',
    'For optimization, define constraints clearly and test boundary behavior before relying on calculus alone.',
  ],
  automation: [
    'Reliable workflows separate triggering, validation, execution, and retry behavior.',
    'Idempotent jobs and queue based processing reduce failure amplification in distributed systems.',
    'Observability matters: collect latency, error rate, and throughput metrics for each workflow stage.',
  ],
  coding: [
    'Strong code starts with clear interfaces, typed boundaries, and focused modules with single purpose.',
    'Debugging is faster when you reproduce minimal failing cases and inspect state transitions deterministically.',
    'Performance work should begin with measurement, then targeted optimization, then regression tests.',
  ],
  general: [
    'Useful answers combine a direct recommendation, rationale, and practical next steps.',
    'Tradeoffs often matter more than absolute choices, especially under time and resource constraints.',
    'Good communication mirrors user goals, constraints, and the expected level of detail.',
  ],
  science: [
    'Scientific reasoning starts with hypotheses, controlled variables, and measurable outcomes.',
    'Interpret results with uncertainty in mind and avoid overclaiming from small sample sizes.',
    'Reproducibility requires explicit methods, clear assumptions, and transparent data handling.',
  ],
};

const emptyConversations: Record<AgentId, Message[]> = {
  math: [],
  automation: [],
  coding: [],
  general: [],
  science: [],
};

const TOKEN_RE = /[a-zA-Z0-9']+/g;

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(TOKEN_RE) ?? []).filter(Boolean);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function trainLanguageModel(lines: string[]): LanguageModel {
  const unigram: Record<string, number> = {};
  const bigram: Record<string, Record<string, number>> = {};
  const starts: string[] = [];

  let tokenCount = 0;

  for (const line of lines) {
    for (const sentence of splitSentences(line)) {
      const words = ['<s>', ...tokenize(sentence), '</s>'];
      if (words.length > 2) starts.push(words[1]);
      for (let i = 1; i < words.length; i++) {
        const prev = words[i - 1];
        const cur = words[i];

        unigram[cur] = (unigram[cur] ?? 0) + 1;
        tokenCount += 1;

        if (!bigram[prev]) bigram[prev] = {};
        bigram[prev][cur] = (bigram[prev][cur] ?? 0) + 1;
      }
    }
  }

  return {
    unigram,
    bigram,
    starts,
    tokenCount,
    vocabSize: Object.keys(unigram).length,
  };
}

function crossEntropy(lines: string[], model: LanguageModel): number {
  const vocab = Math.max(model.vocabSize, 1);
  let nll = 0;
  let n = 0;

  for (const line of lines) {
    for (const sentence of splitSentences(line)) {
      const words = ['<s>', ...tokenize(sentence), '</s>'];
      for (let i = 1; i < words.length; i++) {
        const prev = words[i - 1];
        const cur = words[i];
        const nexts = model.bigram[prev] ?? {};
        const total = Object.values(nexts).reduce((a, b) => a + b, 0);
        const count = nexts[cur] ?? 0;
        const prob = (count + 1) / (total + vocab);
        nll += -Math.log(prob);
        n += 1;
      }
    }
  }

  return n === 0 ? 0 : nll / n;
}

function pickWeighted(candidates: Record<string, number>, seed: number): string {
  const entries = Object.entries(candidates);
  if (entries.length === 0) return '</s>';
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  if (total <= 0) return entries[0][0];

  let cursor = seed % total;
  for (const [token, count] of entries) {
    cursor -= count;
    if (cursor < 0) return token;
  }
  return entries[entries.length - 1][0];
}

function hashText(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h >>> 0);
}

function generateSentence(model: LanguageModel, prompt: string, maxTokens = 18): string {
  const promptTokens = tokenize(prompt);
  const candidateStart = promptTokens.find((t) => model.unigram[t]);
  const seed = hashText(prompt + String(model.tokenCount));

  let cur = candidateStart || model.starts[seed % Math.max(model.starts.length, 1)] || 'analysis';
  const out: string[] = [cur];

  for (let i = 1; i < maxTokens; i++) {
    const nextMap = model.bigram[cur] ?? model.bigram['<s>'] ?? {};
    const nxt = pickWeighted(nextMap, seed + i * 17);
    if (!nxt || nxt === '</s>') break;
    out.push(nxt);
    cur = nxt;
  }

  return out.join(' ');
}

function retrieveContext(lines: string[], prompt: string): string[] {
  const promptSet = new Set(tokenize(prompt));
  const scored = lines
    .map((line) => {
      const tokens = tokenize(line);
      const overlap = tokens.reduce((acc, t) => acc + (promptSet.has(t) ? 1 : 0), 0);
      return { line, score: overlap };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 2).map((s) => s.line);
}

function buildReply(agent: Agent, prompt: string, model: LanguageModel, dataset: string[]): string {
  const context = retrieveContext(dataset, prompt).join(' ');
  const sentenceA = generateSentence(model, `${prompt} ${context}`);
  const sentenceB = generateSentence(model, `${agent.desc} ${prompt}`);

  const preface = prompt.trim().endsWith('?')
    ? `Good question. ${agent.name} analyzed your request.`
    : `${agent.name} processed your request and generated a response.`;

  return `${preface} ${sentenceA}. ${sentenceB}.`;
}

function computeStats(dataset: string[], model: LanguageModel, epochs: number): TrainingStats {
  const entropy = crossEntropy(dataset, model);
  const loss = Number(entropy.toFixed(3));
  const accuracy = Number(Math.max(40, Math.min(99.5, 100 - entropy * 18)).toFixed(1));

  return {
    epochs,
    loss,
    accuracy,
    tokens: model.tokenCount,
    vocab: model.vocabSize,
  };
}

export function NeuralApp() {
  const [activeAgentId, setActiveAgentId] = useState<AgentId>('general');
  const [conversations, setConversations] = useState<Record<AgentId, Message[]>>(emptyConversations);
  const [datasets, setDatasets] = useState<Record<AgentId, string[]>>(AGENT_CORPUS);
  const [models, setModels] = useState<Record<AgentId, LanguageModel>>({
    math: trainLanguageModel(AGENT_CORPUS.math),
    automation: trainLanguageModel(AGENT_CORPUS.automation),
    coding: trainLanguageModel(AGENT_CORPUS.coding),
    general: trainLanguageModel(AGENT_CORPUS.general),
    science: trainLanguageModel(AGENT_CORPUS.science),
  });
  const [epochsByAgent, setEpochsByAgent] = useState<Record<AgentId, number>>({
    math: 1,
    automation: 1,
    coding: 1,
    general: 1,
    science: 1,
  });
  const [profileImages, setProfileImages] = useState<Record<AgentId, string>>({ math: '', automation: '', coding: '', general: '', science: '' });
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const activeAgent = useMemo(() => AGENTS.find((a) => a.id === activeAgentId) ?? AGENTS[0], [activeAgentId]);
  const messages = conversations[activeAgentId] ?? [];
  const stats = useMemo(
    () => computeStats(datasets[activeAgentId], models[activeAgentId], epochsByAgent[activeAgentId]),
    [activeAgentId, datasets, models, epochsByAgent]
  );

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
      const model = models[activeAgentId];
      const dataset = datasets[activeAgentId];
      const response = buildReply(activeAgent, text, model, dataset);

      const trainingLine = `User: ${text} Agent: ${response}`;
      const nextDataset = [...dataset, trainingLine];
      const nextModel = trainLanguageModel(nextDataset);

      setConversations((prev) => ({ ...prev, [activeAgentId]: [...prev[activeAgentId], { role: 'agent', text: response }] }));
      setDatasets((prev) => ({ ...prev, [activeAgentId]: nextDataset }));
      setModels((prev) => ({ ...prev, [activeAgentId]: nextModel }));
      setEpochsByAgent((prev) => ({ ...prev, [activeAgentId]: prev[activeAgentId] + 1 }));
      setTyping(false);
    }, 650);
  };

  const runTrainingStep = () => {
    const dataset = datasets[activeAgentId];
    const augmentation = [
      `${activeAgent.name} focuses on ${activeAgent.desc.toLowerCase()}.`,
      `When uncertain, ${activeAgent.name} asks for constraints and success criteria before final recommendations.`,
      `${activeAgent.name} response style is concise, practical, and grounded in evidence.`,
    ];
    const nextDataset = [...dataset, ...augmentation];
    const nextModel = trainLanguageModel(nextDataset);

    setDatasets((prev) => ({ ...prev, [activeAgentId]: nextDataset }));
    setModels((prev) => ({ ...prev, [activeAgentId]: nextModel }));
    setEpochsByAgent((prev) => ({ ...prev, [activeAgentId]: prev[activeAgentId] + 5 }));
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
          <div className="neural-stat"><span>Vocabulary</span><strong>{stats.vocab}</strong></div>
          <button type="button" className="neural-train-btn" onClick={runTrainingStep}>Run Training Step</button>
          <p className="neural-hint">Conversation quality improves as each agent trains on your prompts and prior dialogue. Profile switch: <code>active&&&%%% filename.png</code></p>
        </aside>
      </div>
    </div>
  );
}
