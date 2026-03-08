import { useEffect, useRef, useState } from 'react';
import { useColabStore, generateManagerResponse, type ColabMessage } from '../../state/useColabStore';
import { useProfileStore } from '../../state/useProfileStore';
import { REAL_COMPANIES } from '../../data/companies';

type Channel = { id: string; name: string; type: 'channel' | 'dm' };

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function ColabApp() {
  const { messages, typing, addMessage, setTyping } = useColabStore();
  const { firstName, lastName, avatarColor, acceptedJob } = useProfileStore();
  const [activeChannel, setActiveChannel] = useState<string>('general');
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const hasJob = !!acceptedJob;
  const company = acceptedJob?.company ?? '';
  const domain = acceptedJob?.domain ?? '';
  const role = acceptedJob?.role ?? '';
  const managerName = acceptedJob?.managerName ?? 'Your Manager';
  const initials = ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase() || 'U';
  const userName = firstName && lastName ? `${firstName} ${lastName}` : 'You';
  const managerInitials = managerName.split(' ').map(s => s[0]).join('').toUpperCase();
  const managerEmail = managerName.toLowerCase().replace(' ', '.') + `@${domain}`;

  // Find company archetype
  const companyData = REAL_COMPANIES.find(c => c.domain === domain);
  const archetype = companyData?.archetype ?? 'tech';

  const channels: Channel[] = hasJob ? [
    { id: 'general', name: 'general', type: 'channel' },
    { id: 'engineering', name: 'engineering', type: 'channel' },
    { id: 'announcements', name: 'announcements', type: 'channel' },
    { id: `dm-${domain}`, name: managerName, type: 'dm' },
  ] : [];

  const channelKey = `${domain}::${activeChannel}`;
  const channelMessages: ColabMessage[] = messages[channelKey] ?? [];
  const isTyping = typing[channelKey] ?? false;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages, isTyping]);

  // Seed welcome messages on first visit
  useEffect(() => {
    if (!hasJob) return;
    const key = `${domain}::general`;
    if (!messages[key] || messages[key].length === 0) {
      addMessage(key, {
        from: 'system',
        text: `Welcome to ${company} on CoLab. This is the beginning of the #general channel.`,
        time: new Date().toISOString(),
        channel: key,
      });
      addMessage(key, {
        from: 'manager',
        text: `Hey team — please welcome ${userName || 'our newest team member'} who just joined as ${role}! ${userName ? `${firstName},` : ''} feel free to introduce yourself here or ping me directly.`,
        time: new Date().toISOString(),
        channel: key,
      });
    }
    const dmKey = `${domain}::dm-${domain}`;
    if (!messages[dmKey] || messages[dmKey].length === 0) {
      addMessage(dmKey, {
        from: 'manager',
        text: `Hi${firstName ? ` ${firstName}` : ''}! I'm ${managerName}, Director of Engineering here at ${company}. I saw you just joined — welcome! Don't hesitate to message me with any questions as you're getting started. I've got a 1:1 on the calendar for us this week.`,
        time: new Date().toISOString(),
        channel: dmKey,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasJob, domain]);

  const send = () => {
    const text = input.trim();
    if (!text || !hasJob) return;
    setInput('');

    addMessage(channelKey, {
      from: 'user',
      text,
      time: new Date().toISOString(),
      channel: channelKey,
    });

    // Only manager responds in DM channel or general
    const isDm = activeChannel.startsWith('dm-');
    if (!isDm && activeChannel !== 'general') return;

    setTyping(channelKey, true);
    setTimeout(() => {
      setTyping(channelKey, false);
      const response = generateManagerResponse(text, domain, role, managerName, archetype);
      addMessage(channelKey, {
        from: 'manager',
        text: response,
        time: new Date().toISOString(),
        channel: channelKey,
      });
    }, 5000);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!hasJob) {
    return (
      <div className="colab-shell colab-empty">
        <div className="colab-logo">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="#5865f2"/>
            <path d="M8 12h24M8 20h16M8 28h20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          CoLab
        </div>
        <div className="colab-empty-title">No active workspace</div>
        <div className="colab-empty-desc">
          Accept a job offer via Outlook to activate your CoLab workspace and connect with your manager.
        </div>
      </div>
    );
  }

  return (
    <div className="colab-shell">
      {/* Sidebar */}
      <aside className="colab-sidebar">
        <div className="colab-workspace">
          <div className="colab-workspace-name">{company}</div>
          <div className="colab-workspace-domain">{domain}</div>
        </div>

        <div className="colab-section-label">Channels</div>
        {channels.filter(c => c.type === 'channel').map((ch) => (
          <button
            key={ch.id}
            type="button"
            className={`colab-channel-btn${activeChannel === ch.id ? ' active' : ''}`}
            onClick={() => setActiveChannel(ch.id)}
          >
            <span className="colab-hash">#</span>
            {ch.name}
          </button>
        ))}

        <div className="colab-section-label">Direct Messages</div>
        {channels.filter(c => c.type === 'dm').map((ch) => (
          <button
            key={ch.id}
            type="button"
            className={`colab-channel-btn${activeChannel === ch.id ? ' active' : ''}`}
            onClick={() => setActiveChannel(ch.id)}
          >
            <span className="colab-dm-dot" />
            {ch.name}
          </button>
        ))}

        <div className="colab-sidebar-footer">
          <div className="colab-user-chip" style={{ background: avatarColor }}>
            {initials}
          </div>
          <div className="colab-user-info">
            <div className="colab-user-name">{userName}</div>
            <div className="colab-user-status">Active</div>
          </div>
        </div>
      </aside>

      {/* Main chat */}
      <div className="colab-main">
        {/* Channel header */}
        <div className="colab-chat-header">
          {activeChannel.startsWith('dm-') ? (
            <>
              <div className="colab-dm-avatar">{managerInitials}</div>
              <div>
                <div className="colab-chat-title">{managerName}</div>
                <div className="colab-chat-sub">Director of Engineering · {managerEmail}</div>
              </div>
            </>
          ) : (
            <>
              <span className="colab-header-hash">#</span>
              <div>
                <div className="colab-chat-title">{activeChannel}</div>
                <div className="colab-chat-sub">{company}</div>
              </div>
            </>
          )}
        </div>

        {/* Messages */}
        <div className="colab-messages">
          {channelMessages.length === 0 && (
            <div className="colab-no-msgs">No messages yet. Say something!</div>
          )}
          {channelMessages.map((msg) => {
            const isUser = msg.from === 'user';
            const isSystem = msg.from === 'system';
            if (isSystem) return (
              <div key={msg.id} className="colab-system-msg">{msg.text}</div>
            );
            return (
              <div key={msg.id} className={`colab-msg${isUser ? ' colab-msg-user' : ''}`}>
                <div
                  className="colab-msg-avatar"
                  style={{ background: isUser ? avatarColor : '#e05c00' }}
                >
                  {isUser ? initials : managerInitials}
                </div>
                <div className="colab-msg-body">
                  <div className="colab-msg-meta">
                    <span className="colab-msg-name">{isUser ? userName : managerName}</span>
                    <span className="colab-msg-time">{timeAgo(msg.time)}</span>
                  </div>
                  <div className="colab-msg-text">{msg.text}</div>
                </div>
              </div>
            );
          })}
          {isTyping && (
            <div className="colab-msg">
              <div className="colab-msg-avatar" style={{ background: '#e05c00' }}>{managerInitials}</div>
              <div className="colab-msg-body">
                <div className="colab-msg-meta">
                  <span className="colab-msg-name">{managerName}</span>
                </div>
                <div className="colab-typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="colab-input-area">
          <textarea
            className="colab-input"
            placeholder={`Message ${activeChannel.startsWith('dm-') ? managerName : `#${activeChannel}`}`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
          />
          <button type="button" className="colab-send-btn" onClick={send} disabled={!input.trim()}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 8l13-7-4 7 4 7-13-7z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
