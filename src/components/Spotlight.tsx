import { useEffect, useMemo, useState } from 'react';
import type { Command } from '../state/useShellStore';

type SpotlightProps = {
  open: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  commands: Command[];
  onClose: () => void;
};

export function Spotlight({ open, query, onQueryChange, commands, onClose }: SpotlightProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    const value = query.toLowerCase().trim();
    if (!value) return commands;
    return commands.filter(
      (cmd) => cmd.title.toLowerCase().includes(value) || cmd.description.toLowerCase().includes(value),
    );
  }, [commands, query]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((index) => Math.min(filtered.length - 1, index + 1));
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((index) => Math.max(0, index - 1));
      }
      if (event.key === 'Enter') {
        filtered[activeIndex]?.action();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeIndex, filtered, onClose, open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  return (
    <div className="spotlight-overlay" role="presentation" onClick={onClose}>
      <div className="spotlight-panel" role="dialog" aria-modal aria-label="Spotlight" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="spotlight-input"
          placeholder="Ask AngelOS to open apps, start jobs, or search artifacts"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <div className="spotlight-commands scroll-fade">
          {filtered.map((command, index) => (
            <button
              key={command.id}
              className={`command-row ${index === activeIndex ? 'active' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={command.action}
              type="button"
            >
              {command.icon?.includes('/') || command.icon?.includes('.png') || command.icon?.includes('.svg') ? (
                <img src={command.icon} alt="" className="command-icon" style={{ width: 24, height: 24, borderRadius: 6 }} />
              ) : (
                <span className="command-icon">{command.icon ?? '⌘'}</span>
              )}
              <div className="command-body">
                <div className="command-title">{command.title}</div>
                <div className="command-subtitle">{command.description}</div>
              </div>
              <kbd>Enter</kbd>
            </button>
          ))}
        </div>
        <div className="hint-row">
          <span>Type to search actions and windows</span>
          <div>
            <kbd>Esc</kbd> to close
          </div>
        </div>
      </div>
    </div>
  );
}
