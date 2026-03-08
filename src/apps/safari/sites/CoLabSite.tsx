import { FormEvent, useMemo, useState } from 'react';
import { useMailStore } from '../../../state/useMailStore';
import { useProfileStore } from '../../../state/useProfileStore';

type Message = { from: 'me' | 'manager'; text: string; ts: string };

function timeLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function smartManagerReply(company: string, role: string, question: string): string {
  const q = question.toLowerCase();

  if (q.includes('weed') || q.includes('drug') || q.includes('high') || q.includes('smoke')) {
    return `I can’t approve that. ${company} policy requires employees to be fit for duty and compliant with workplace and local legal standards. If you need time off or support, request PTO or contact HR confidentially.`;
  }

  if ((q.includes('not work') || q.includes('skip work') || q.includes('avoid work') || q.includes('do nothing'))) {
    return `I can’t support avoiding work expectations. Let’s instead rebalance your priorities for this sprint and remove blockers so you can deliver sustainably.`;
  }

  if (q.includes('culture')) {
    return `For ${company}, culture is built on accountability, clear written updates, and respectful collaboration. In ${role}, success is measured by delivery quality, communication, and reliable follow-through.`;
  }

  if (q.includes('management') || q.includes('manager')) {
    return `My management style is outcome-focused and supportive: weekly 1:1s, clear expectations, and fast unblock support. I expect transparent status updates and early risk escalation.`;
  }

  if (q.includes('benefits') || q.includes('pto') || q.includes('vacation')) {
    return `Benefits and PTO rules are in your Workday handbook packet. Operationally: submit PTO early, coordinate team coverage, and we’ll approve based on delivery timing.`;
  }

  if (q.includes('pay') || q.includes('salary') || q.includes('bonus')) {
    return `Compensation questions should go through People Ops for official policy details. I can help with performance expectations that map to bonus and promotion outcomes.`;
  }

  return `Good question. For ${company}, the practical path is: align this with your project board, post a concise update in CoLab, and flag blockers within 24 hours so we can keep sprint commitments healthy.`;
}

export function CoLabSite() {
  const emails = useMailStore((s) => s.emails);
  const { preferredEmail } = useProfileStore();
  const onboarding = useMemo(() => emails.find((e) => e.jobMeta?.stage === 'onboarding')?.jobMeta, [emails]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);

  if (!onboarding) return <div className="simple-site"><h2>CoLab</h2><p>No company account detected. Accept an offer to activate your tenant.</p></div>;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: 'me', text, ts: timeLabel() }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [
        ...m,
        { from: 'manager', text: smartManagerReply(onboarding.company, onboarding.role, text), ts: timeLabel() },
      ]);
    }, 5000);
  };

  return (
    <div className="simple-site">
      <h2>CoLab — {onboarding.company}</h2>
      <p>Logged in as {preferredEmail}. Connected manager: {onboarding.managerName}.</p>
      <div className="simple-card colab-thread">
        {messages.length === 0 && <p>Ask your manager about team priorities, culture, policy, or delivery blockers.</p>}
        {messages.map((m, i) => <p key={i}><strong>{m.from === 'me' ? 'You' : onboarding.managerName}:</strong> {m.text} <span style={{ color: '#7f95bb', fontSize: 11 }}>({m.ts})</span></p>)}
        {typing && <p><em>{onboarding.managerName} is typing…</em></p>}
      </div>
      <form onSubmit={submit} className="colab-form">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Message your manager" />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
