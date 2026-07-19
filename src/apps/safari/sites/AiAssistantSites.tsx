import { useRef, useState } from 'react';
import { useProfileStore } from '../../../state/useProfileStore';
import { useDevStore, AI_PLANS, CLAUDE_PLANS, CLAUDE_ENTERPRISE_ORGS, type AiService, type ClaudePlan } from '../../../state/useDevStore';
import { useCompanyStore } from '../../../state/useCompanyStore';
import { ClaudeSpark, ChatGptKnot, GeminiSpark } from '../../../data/brands';
import './aiassistants.css';

// claude.ai / chatgpt.com / gemini.google.com — each gated behind its
// subscription (managed in Settings → Subscriptions, billed through Chase).

type Msg = { role: 'user' | 'assistant'; text: string };

function assistantReply(service: AiService, q: string): string {
  const query = q.toLowerCase();
  if (/promot/i.test(query)) {
    return 'Promotions in the simulation are earned through work quality and tenure. After onboarding, complete the assignments in Workday → My Tasks before their deadlines, then reply PROMOTION% to a work email from your company domain. Each additional % escalates the review level. Your new title and compensation flow to Workday, ADP, and payroll automatically.';
  }
  if (/job|apply|interview|offer/.test(query)) {
    return 'The hiring loop mirrors real life: find a role on LinkedIn Jobs and apply, then manage the process from your inbox — reply ATS100 to schedule the phone screen, MANAGER100 for the director round, PANELS100 for the panel, send a thank-you note after the panel, and reply "I Accept" to the written offer. Acceptance provisions your company email, Workday tenant, and biweekly payroll.';
  }
  if (/pay|salary|check|money|bank/.test(query)) {
    return 'Pay runs on a biweekly cycle from your start date. Gross pay divides your base salary by 26; federal, state, OASDI, Medicare, 401(k), and medical premiums come out pre-tax where applicable. You can inspect every line item in Workday (including a printed check view), reconcile statements in myADP, and watch deposits land in Chase Total Checking.';
  }
  if (/task|deadline|work/.test(query)) {
    return "Your active assignments live in Workday → My Tasks, sorted by deadline. Each has a brief, an expected deliverable, an estimated effort, and a complexity rating. Submissions need a written summary — treat it like a real handoff to your manager: what you did, where the deliverable lives, and what's at risk.";
  }
  const persona = service === 'claude'
    ? "I'd break this down as follows"
    : service === 'chatgpt'
      ? 'Great question — here are the key points'
      : 'Here is a concise answer';
  return `${persona}:\n\n“${q}” in the context of your workforce simulation touches a few systems. LinkedIn drives applications, your inbox (Outlook/Gmail) drives process, Workday holds your career and deliverables, and ADP/Chase hold the money. Tell me which part you're working through — applications, interviews, tasks, or pay — and I'll walk you through the exact steps.`;
}

const SERVICE_META: Record<AiService, {
  wordmark: string;
  icon: (size: number) => JSX.Element;
  accent: string;
  placeholder: string;
  greeting: (name: string) => string;
  model: string;
}> = {
  claude: {
    wordmark: 'Claude',
    icon: (s) => <ClaudeSpark size={s} />,
    accent: '#D97757',
    placeholder: 'How can Claude help you today?',
    greeting: (n) => `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${n}`,
    model: 'Claude Fable 5',
  },
  chatgpt: {
    wordmark: 'ChatGPT',
    icon: (s) => <ChatGptKnot size={s} />,
    accent: '#10a37f',
    placeholder: 'Ask anything',
    greeting: () => 'What can I help with?',
    model: 'GPT-5',
  },
  gemini: {
    wordmark: 'Gemini',
    icon: (s) => <GeminiSpark size={s} />,
    accent: '#4285F4',
    placeholder: 'Ask Gemini',
    greeting: (n) => `Hello, ${n}`,
    model: 'Gemini 3 Pro',
  },
};

function AiChatSite({ service }: { service: AiService }) {
  const fullName = useProfileStore((s) => s.fullName);
  const sub = useDevStore((s) => s.subscriptions[service]);
  const subscribe = useDevStore((s) => s.subscribe);
  const employerAccounts = useCompanyStore((s) => s.employerAccounts);
  const enterpriseOrg = service === 'claude'
    ? employerAccounts.find((a) => (a.employmentStatus === 'active' || a.employmentStatus === 'onboarding') && CLAUDE_ENTERPRISE_ORGS.test(a.companyName))
    : undefined;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const meta = SERVICE_META[service];
  const plan = AI_PLANS[service];
  const firstName = fullName.split(' ')[0];

  const send = () => {
    const q = input.trim();
    if (!q || typing) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'assistant', text: assistantReply(service, q) }]);
      setTyping(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 60);
    }, 900);
    setTimeout(() => scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 60);
  };

  // ── Paywall ──
  if (!sub.active) {
    if (service === 'claude') {
      return (
        <div className={`ai-shell ai-${service}`}>
          <div className="ai-paywall ai-paywall-wide">
            <div className="ai-paywall-icon">{meta.icon(44)}</div>
            <h1>Claude</h1>
            <p className="ai-paywall-sub">Choose the plan that works for you. Personal plans bill your Chase checking account monthly.</p>
            {enterpriseOrg && (
              <div className="ai-enterprise-banner">
                <div>
                  <strong>{enterpriseOrg.companyName} provides Claude Enterprise</strong>
                  <span>Your organization covers Claude for employees, with SSO, expanded context, and enterprise data controls. No personal billing.</span>
                </div>
                <button type="button" className="ai-subscribe-btn" style={{ background: meta.accent }}
                  onClick={() => subscribe('claude', 'enterprise')}>
                  Continue with {enterpriseOrg.companyName} work account
                </button>
              </div>
            )}
            <div className="ai-plan-grid">
              {(['pro', 'max', 'team'] as ClaudePlan[]).map((pl) => {
                const info = CLAUDE_PLANS[pl];
                const monthly = pl === 'team' ? info.monthly * 5 : info.monthly;
                return (
                  <div key={pl} className={`ai-plan-card ${pl === 'max' ? 'featured' : ''}`}>
                    {pl === 'max' && <span className="ai-plan-flag">Most capable</span>}
                    <div className="ai-plan-name">{info.label}</div>
                    <div className="ai-plan-price">${info.monthly.toFixed(0)}<span>{info.perSeat ? '/seat/month' : '/month'}</span></div>
                    <ul>
                      <li>{info.blurb}</li>
                      <li>Access to {meta.model}</li>
                      <li>{pl === 'team' ? `Billed as $${monthly}/month for 5 seats` : 'Cancel anytime in Settings'}</li>
                    </ul>
                    <button type="button" className="ai-subscribe-btn" style={{ background: meta.accent }} onClick={() => subscribe('claude', pl)}>
                      Subscribe to {info.label}
                    </button>
                  </div>
                );
              })}
              <div className="ai-plan-card ai-plan-enterprise">
                <div className="ai-plan-name">Claude Enterprise</div>
                <div className="ai-plan-price">Custom</div>
                <ul>
                  <li>{CLAUDE_PLANS.enterprise.blurb}</li>
                  <li>SSO, audit logs, and admin console</li>
                  <li>{enterpriseOrg ? `Provided by ${enterpriseOrg.companyName}` : 'Available through participating employers'}</li>
                </ul>
                <button type="button" className="ai-subscribe-btn ai-subscribe-outline" disabled={!enterpriseOrg}
                  onClick={() => enterpriseOrg && subscribe('claude', 'enterprise')}>
                  {enterpriseOrg ? 'Activate via employer' : 'Contact sales'}
                </button>
              </div>
            </div>
            <span className="ai-plan-fine">Manage anytime in Settings → Subscriptions.</span>
          </div>
        </div>
      );
    }
    return (
      <div className={`ai-shell ai-${service}`}>
        <div className="ai-paywall">
          <div className="ai-paywall-icon">{meta.icon(44)}</div>
          <h1>{meta.wordmark}</h1>
          <p className="ai-paywall-sub">Sign in to continue. A {plan.plan} subscription is required to chat with {meta.wordmark}.</p>
          <div className="ai-plan-card">
            <div className="ai-plan-name">{plan.plan}</div>
            <div className="ai-plan-price">${plan.monthly.toFixed(2)}<span>/month</span></div>
            <ul>
              <li>Access to {meta.model}</li>
              <li>Higher usage limits and faster responses</li>
              <li>Billed monthly to your Chase checking account</li>
            </ul>
            <button type="button" className="ai-subscribe-btn" style={{ background: meta.accent }} onClick={() => subscribe(service)}>
              Subscribe to {plan.plan}
            </button>
            <span className="ai-plan-fine">Manage anytime in Settings → Subscriptions. Cancel whenever.</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Chat ──
  return (
    <div className={`ai-shell ai-${service}`}>
      <header className="ai-header">
        <span className="ai-header-brand">{meta.icon(20)} <strong>{meta.wordmark}</strong></span>
        <span className="ai-header-model">{meta.model} ▾</span>
        <span className="ai-header-plan">{service === 'claude' && sub.plan ? CLAUDE_PLANS[sub.plan].label : plan.plan}</span>
      </header>
      <div className="ai-scroll" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="ai-greeting">
            {meta.icon(36)}
            <h1>{meta.greeting(firstName)}</h1>
          </div>
        ) : (
          <div className="ai-thread">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>
                {m.role === 'assistant' && <span className="ai-msg-icon">{meta.icon(18)}</span>}
                <div className="ai-msg-bubble">{m.text}</div>
              </div>
            ))}
            {typing && (
              <div className="ai-msg assistant">
                <span className="ai-msg-icon">{meta.icon(18)}</span>
                <div className="ai-msg-bubble ai-typing"><span /><span /><span /></div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="ai-composer">
        <textarea
          rows={1}
          value={input}
          placeholder={meta.placeholder}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button type="button" className="ai-send" style={{ background: meta.accent }} onClick={send} aria-label="Send">↑</button>
      </div>
      <div className="ai-footnote">{meta.wordmark} can make mistakes. Consider checking important information.</div>
    </div>
  );
}

export function ClaudeSite() { return <AiChatSite service="claude" />; }
export function ChatGptSite() { return <AiChatSite service="chatgpt" />; }
export function GeminiSite() { return <AiChatSite service="gemini" />; }
