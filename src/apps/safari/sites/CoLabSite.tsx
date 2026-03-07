import { FormEvent, useMemo, useState } from 'react';
import { useMailStore } from '../../../state/useMailStore';
import { useProfileStore } from '../../../state/useProfileStore';

type Message = { from: 'me' | 'manager'; text: string };

function managerReply(company: string, role: string, question: string): string {
  const q = question.toLowerCase();
  if (q.includes('culture')) return `${company} culture favors ownership, fast iteration, and transparent postmortems. In ${role}, we reward clear communication and reliability.`;
  if (q.includes('management') || q.includes('manager')) return `Management style here is high-context and outcome-oriented. You will get weekly 1:1s, project-level autonomy, and explicit performance feedback.`;
  if (q.includes('benefits') || q.includes('pto')) return `Benefits are detailed in your Workday handbook packet. PTO is manager-approved with team coverage planning and no penalty for healthy usage.`;
  return `Great question. For ${company}, the best approach is to align your tasks with the PM board and surface blockers early. I'll help you prioritize for this sprint.`;
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
    setMessages((m) => [...m, { from: 'me', text }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { from: 'manager', text: managerReply(onboarding.company, onboarding.role, text) }]);
    }, 5000);
  };

  return (
    <div className="simple-site">
      <h2>CoLab — {onboarding.company}</h2>
      <p>Logged in as {preferredEmail}. Connected manager: {onboarding.managerName}.</p>
      <div className="simple-card colab-thread">
        {messages.length === 0 && <p>Ask your manager about team priorities, culture, or day-to-day process.</p>}
        {messages.map((m, i) => <p key={i}><strong>{m.from === 'me' ? 'You' : onboarding.managerName}:</strong> {m.text}</p>)}
        {typing && <p><em>{onboarding.managerName} is typing…</em></p>}
      </div>
      <form onSubmit={submit} className="colab-form">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Message your manager" />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
