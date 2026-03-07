import { useEffect, useState } from 'react';

export type MenuBarProps = {
  workspaceName: string;
  stateText: string;
  jobCount: number;
  onToggleSpotlight: () => void;
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

export function MenuBar({ workspaceName, stateText, jobCount, onToggleSpotlight }: MenuBarProps) {
  const [clock, setClock] = useState(() => formatTime(new Date()));
  const [agentActive, setAgentActive] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setClock(formatTime(new Date())), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const pulse = setInterval(() => setAgentActive((v) => !v), 12000);
    return () => clearInterval(pulse);
  }, []);

  return (
    <header className="menubar">
      <div className="menubar-left">
        <span>aOS</span>
        <span className="menubar-state">{workspaceName}</span>
        <span className="menubar-state">{stateText}</span>
      </div>

      <div className="menubar-center" />

      <div className="menubar-right">
        <div className="menubar-pill">Jobs: {jobCount}</div>
        <div className="menubar-pill">{agentActive ? 'Agent: Active' : 'Agent: Idle'}</div>
        <div className="menubar-pill">{clock}</div>
        <button className="menubar-pill" onClick={onToggleSpotlight} type="button">
          ⌘ Space
        </button>
      </div>
    </header>
  );
}
