import { useEffect, useMemo, useRef, useState } from 'react';
import { useCompanyStore, type EmployerAccount } from '../../state/useCompanyStore';
import { useProfileStore } from '../../state/useProfileStore';
import { useMessagesStore } from '../../state/useMessagesStore';
import { buildPerson, personPhoto } from '../../data/people';
import { CompanyLogo } from '../../data/brands';
import { generateRoleTasks } from '../../data/simulator/roleTasks';
import './teams.css';

// Microsoft Teams replica. Access is org-scoped: you can only sign in to the
// tenant of an organization that employs you, using the company credentials
// delivered with your offer. Each tenant has its own teams, channels, and
// people — there is no cross-organization access.

type TmsView = 'activity' | 'chat' | 'teams' | 'calendar' | 'calls' | 'files';

type SeededMessage = { author: string; role: string; minutesAgo: number; text: string };

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

const COLLEAGUE_NAMES = [
  'Elena Vasquez', 'Marcus Thornton', 'Priya Hartwell', 'Darius Chen',
  'Naomi Calloway', 'Rafael Iyer', 'Ingrid Voss', 'Omar Mensah',
  'Serena Brandt', 'Levi Okafor', 'Mei Fontaine', 'Theo Aldridge',
];

function colleaguesFor(account: EmployerAccount): Array<{ name: string; role: string }> {
  const h = hash(account.companyName);
  const roles = ['Senior Engineer', 'Product Manager', 'Engineering Manager', 'Designer', 'Analyst', 'Staff Engineer'];
  return Array.from({ length: 6 }, (_, i) => ({
    name: COLLEAGUE_NAMES[(h + i * 3) % COLLEAGUE_NAMES.length],
    role: roles[(h + i) % roles.length],
  }));
}

function seededChannelMessages(account: EmployerAccount, channel: string): SeededMessage[] {
  const people = colleaguesFor(account);
  const tasks = generateRoleTasks(account);
  const t0 = tasks[0]?.title ?? 'the quarterly deliverable';
  const t1 = tasks[1]?.title ?? 'the review';
  if (channel === 'General') {
    return [
      { author: account.managerName, role: 'Manager', minutesAgo: 260, text: `Morning team. Standup notes are in the wiki. Two things for today: ${t0.toLowerCase().replace(/\.$/, '')} is the priority, and please get your timesheets in by 5pm — payroll cutoff is tonight.` },
      { author: people[0].name, role: people[0].role, minutesAgo: 214, text: 'On it. I pushed the branch late last night, review comments welcome before noon.' },
      { author: people[1].name, role: people[1].role, minutesAgo: 187, text: `Reminder that the ${account.department.toUpperCase()} sync moved to 2:30 today because of the all-hands. Same link as usual.` },
      { author: people[2].name, role: people[2].role, minutesAgo: 95, text: `Welcome to the new joiners this week. Say hi to the team, and drop your intro in the Social channel when you get a minute.` },
      { author: account.managerName, role: 'Manager', minutesAgo: 42, text: `@${'{new hire}'} — once your laptop is set up, grab the onboarding checklist from Files. Your first task is already assigned in Workday; deadline is real, so flag me early if you're blocked.` },
    ];
  }
  if (channel === 'Social') {
    return [
      { author: people[3].name, role: people[3].role, minutesAgo: 300, text: 'Coffee run at 3 for anyone in the office. Orders in thread.' },
      { author: people[4].name, role: people[4].role, minutesAgo: 250, text: 'The Thursday trivia team needs a fourth. No skill required, historically we lose anyway.' },
      { author: people[0].name, role: people[0].role, minutesAgo: 120, text: 'New joiners: intro thread here. Name, team, and the most niche thing you know a lot about.' },
    ];
  }
  // Department channel
  return [
    { author: people[5].name, role: people[5].role, minutesAgo: 280, text: `Heads up: staging deploy window is 1-2pm. If ${t1.toLowerCase().replace(/\.$/, '')} needs a rebase, do it before then.` },
    { author: people[1].name, role: people[1].role, minutesAgo: 230, text: 'Dashboards refreshed. The anomaly from Friday is gone after the pipeline fix — root cause doc linked in Files.' },
    { author: account.managerName, role: 'Manager', minutesAgo: 140, text: `Priorities this sprint have not changed: 1) ${t0} 2) ${t1} 3) tech debt only if the first two are green. Questions in thread.` },
    { author: people[2].name, role: people[2].role, minutesAgo: 60, text: 'PSA: the client demo recording is up. Sales flagged two feature asks — triage tomorrow.' },
  ];
}

function fmtAgo(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`;
  const h = Math.floor(minutes / 60);
  return `${h}h ago`;
}

const RAIL: Array<{ id: TmsView; label: string; icon: JSX.Element }> = [
  { id: 'activity', label: 'Activity', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a7 7 0 0 0-7 7v4l-1.6 2.4A1 1 0 0 0 4.2 18h15.6a1 1 0 0 0 .8-1.6L19 14v-4a7 7 0 0 0-7-7zm0 18a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 21z"/></svg> },
  { id: 'chat', label: 'Chat', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.6 1.3 4.9 3.4 6.5L4 21.5a.6.6 0 0 0 .8.7l4-1.8c1 .3 2.1.4 3.2.4 5.5 0 10-3.9 10-8.7S17.5 3 12 3z"/></svg> },
  { id: 'teams', label: 'Teams', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 11a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 9 11zm8 .5A2.75 2.75 0 1 0 14.25 8.75 2.75 2.75 0 0 0 17 11.5zM2 19c0-3.1 3.1-4.7 7-4.7s7 1.6 7 4.7v1H2zm15.6-3.3c2.2.3 4.4 1.5 4.4 3.6V20h-3v-1c0-1.3-.5-2.4-1.4-3.3z"/></svg> },
  { id: 'calendar', label: 'Calendar', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3v1H7V3H5v1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3zM4 9h16v9H4z"/></svg> },
  { id: 'calls', label: 'Calls', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 3.2a1.7 1.7 0 0 1 2 .5l1.8 2.4a1.7 1.7 0 0 1-.1 2.2l-1 1a12.6 12.6 0 0 0 5.4 5.4l1-1a1.7 1.7 0 0 1 2.2-.1l2.4 1.8a1.7 1.7 0 0 1 .5 2l-.7 1.7a2 2 0 0 1-2.2 1.2C11.5 19.9 4.1 12.5 2.7 6.1a2 2 0 0 1 1.2-2.2z"/></svg> },
  { id: 'files', label: 'Files', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg> },
];

export function TeamsApp() {
  const accounts = useCompanyStore((s) => s.employerAccounts);
  const fullName = useProfileStore((s) => s.fullName);
  const [sessionAccountId, setSessionAccountId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const issueVerificationCode = useMessagesStore((s) => s.issueVerificationCode);
  const [mfa, setMfa] = useState<{ accountId: string; code: string } | null>(null);
  const [mfaInput, setMfaInput] = useState('');
  const [view, setView] = useState<TmsView>('teams');
  const [channel, setChannel] = useState('General');
  const [chatTarget, setChatTarget] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [posted, setPosted] = useState<Record<string, Array<{ text: string; at: number }>>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const account = accounts.find((a) => a.id === sessionAccountId) ?? null;
  const colleagues = useMemo(() => (account ? colleaguesFor(account) : []), [account]);
  const channels = useMemo(() => account ? ['General', `${account.department}-team`, 'Social'] : [], [account]);
  const messages = useMemo(() => account ? seededChannelMessages(account, channel === channels[1] ? 'dept' : channel) : [], [account, channel, channels]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 999999 });
  }, [messages, posted, channel]);

  // ── Sign-in (org-scoped) ──
  if (!account) {
    return (
      <div className="tms-shell tms-login-shell">
        <div className="tms-login-card">
          <div className="tms-login-logo">
            <svg width="46" height="46" viewBox="0 0 48 48">
              <rect x="2" y="10" width="28" height="28" rx="5" fill="#5059C9" />
              <text x="16" y="30" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff" fontFamily="Segoe UI, sans-serif">T</text>
              <circle cx="38" cy="17" r="6" fill="#7B83EB" />
              <path d="M30 26h14a2 2 0 0 1 2 2v5a8 8 0 0 1-8 8h-1a8 8 0 0 1-7-4.1z" fill="#7B83EB" />
            </svg>
          </div>
          <h1>Microsoft Teams</h1>
          {mfa ? (
            <>
              <p className="tms-login-sub">Verify your identity</p>
              <div className="tms-login-note">
                We texted a verification code to your phone on file. Open <strong>Messages</strong> to
                read it, then enter it below.
              </div>
              <input
                className="tms-login-input"
                inputMode="numeric"
                placeholder="6-digit code"
                value={mfaInput}
                maxLength={6}
                onChange={(e) => setMfaInput(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') document.getElementById('tms-mfa-btn')?.click(); }}
              />
              <button id="tms-mfa-btn" type="button" className="tms-primary" onClick={() => {
                if (mfaInput === mfa.code) {
                  setSessionAccountId(mfa.accountId);
                  setMfa(null); setMfaInput(''); setPassword(''); setError('');
                } else {
                  setError("That code doesn't match. Check the latest text in Messages.");
                }
              }}>Verify</button>
              {error && <div className="tms-login-error">{error}</div>}
              <button type="button" className="tms-linklike" onClick={() => {
                const acc = accounts.find((a) => a.id === mfa.accountId);
                if (acc) setMfa({ accountId: acc.id, code: issueVerificationCode('teams', acc.companyName) });
                setError('');
              }}>Resend code</button>
            </>
          ) : accounts.length === 0 ? (
            <>
              <p className="tms-login-sub">Teams access is provisioned by your employer.</p>
              <div className="tms-login-note">
                You do not belong to any organization yet. Accept a job offer and your company
                credentials (delivered in the offer packet) will unlock that organization's tenant.
                You can only access the Teams workspace of an organization that employs you.
              </div>
            </>
          ) : (
            <>
              <p className="tms-login-sub">Sign in with your work account.</p>
              <div className="tms-org-list">
                {accounts.map((acc) => (
                  <label key={acc.id} className={`tms-org ${selectedId === acc.id ? 'active' : ''}`}>
                    <input type="radio" checked={selectedId === acc.id} onChange={() => { setSelectedId(acc.id); setError(''); }} />
                    <CompanyLogo company={acc.companyName} size={34} />
                    <div>
                      <div className="tms-org-name">{acc.companyName}</div>
                      <div className="tms-org-email">{acc.companyEmail}</div>
                    </div>
                  </label>
                ))}
              </div>
              <input
                className="tms-login-input"
                type="password"
                placeholder="Password (from your offer packet)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') document.getElementById('tms-signin-btn')?.click(); }}
              />
              <button id="tms-signin-btn" type="button" className="tms-primary" onClick={() => {
                const acc = accounts.find((a) => a.id === selectedId);
                if (!acc) { setError('Select your organization.'); return; }
                if (acc.outlookPassword !== password) { setError("That password doesn't match this organization's account. Check your offer packet."); return; }
                setMfa({ accountId: acc.id, code: issueVerificationCode('teams', acc.companyName) });
                setError('');
              }}>Sign in</button>
              {error && <div className="tms-login-error">{error}</div>}
              <div className="tms-login-note">
                Each organization is a separate tenant. Signing in to {selectedId ? (accounts.find((a) => a.id === selectedId)?.companyName ?? 'this organization') : 'an organization'} gives you
                access to that tenant only — never to other companies' teams.
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const draftKey = view === 'chat' ? `chat-${account.id}-${chatTarget}` : `ch-${account.id}-${channel}`;
  const postedHere = posted[draftKey] ?? [];

  const send = () => {
    const text = (drafts[draftKey] ?? '').trim();
    if (!text) return;
    setPosted((p) => ({ ...p, [draftKey]: [...(p[draftKey] ?? []), { text, at: Date.now() }] }));
    setDrafts((d) => ({ ...d, [draftKey]: '' }));
  };

  const chatPartner = colleagues[chatTarget];

  return (
    <div className="tms-shell">
      {/* Title bar */}
      <header className="tms-topbar">
        <div className="tms-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21.41 18.59l-5.27-5.28A6.83 6.83 0 0 0 17 10a7 7 0 1 0-7 7 6.83 6.83 0 0 0 3.31-.86l5.28 5.27a2 2 0 0 0 2.82-2.82zM5 10a5 5 0 1 1 5 5 5 5 0 0 1-5-5z"/></svg>
            <input placeholder={`Search ${account.companyName} (Ctrl+E)`} />
        </div>
        <div className="tms-topbar-right">
          <span className="tms-org-chip"><CompanyLogo company={account.companyName} size={18} /> {account.companyName}</span>
          <button type="button" className="tms-signout" onClick={() => setSessionAccountId(null)}>Sign out</button>
          <img className="tms-me" src={personPhoto(fullName)} alt="" />
        </div>
      </header>

      <div className="tms-main">
        {/* App rail */}
        <nav className="tms-rail">
          {RAIL.map((r) => (
            <button key={r.id} type="button" className={view === r.id ? 'active' : ''} onClick={() => setView(r.id)}>
              {r.icon}
              <span>{r.label}</span>
            </button>
          ))}
        </nav>

        {/* Secondary pane */}
        {view === 'teams' && (
          <aside className="tms-list">
            <div className="tms-list-head">Teams</div>
            <div className="tms-team">
              <div className="tms-team-header">
                <CompanyLogo company={account.companyName} size={30} />
                <span>{account.companyName.length > 22 ? `${account.companyName.slice(0, 22)}…` : account.companyName}</span>
              </div>
              {channels.map((ch) => (
                <button key={ch} type="button" className={`tms-channel ${channel === ch ? 'active' : ''}`} onClick={() => setChannel(ch)}>
                  {ch}
                </button>
              ))}
            </div>
            <div className="tms-list-note">Tenant: {account.domain} — visible to {account.companyName} members only.</div>
          </aside>
        )}
        {view === 'chat' && (
          <aside className="tms-list">
            <div className="tms-list-head">Chat</div>
            {colleagues.map((c, i) => (
              <button key={c.name + i} type="button" className={`tms-chat-row ${chatTarget === i ? 'active' : ''}`} onClick={() => setChatTarget(i)}>
                <img src={personPhoto(c.name)} alt="" />
                <div>
                  <div className="tms-chat-name">{c.name}</div>
                  <div className="tms-chat-sub">{c.role}</div>
                </div>
              </button>
            ))}
          </aside>
        )}
        {(view === 'activity' || view === 'calendar' || view === 'calls' || view === 'files') && (
          <aside className="tms-list">
            <div className="tms-list-head">{RAIL.find((r) => r.id === view)?.label}</div>
            {view === 'activity' && (
              <div className="tms-activity">
                <div className="tms-activity-row"><img src={personPhoto(account.managerName)} alt="" /><span><strong>{account.managerName}</strong> mentioned you in General</span></div>
                <div className="tms-activity-row"><img src={personPhoto(colleagues[0]?.name ?? 'A')} alt="" /><span><strong>{colleagues[0]?.name}</strong> reacted to your message</span></div>
              </div>
            )}
            {view === 'calendar' && (
              <div className="tms-cal">
                <div className="tms-cal-item"><strong>Standup</strong><span>9:30 AM — {account.department}-team</span></div>
                <div className="tms-cal-item"><strong>{account.department.toUpperCase()} Sync</strong><span>2:30 PM — moved from 2:00</span></div>
                <div className="tms-cal-item"><strong>1:1 with {account.managerName}</strong><span>Thursday 11:00 AM</span></div>
              </div>
            )}
            {view === 'calls' && <div className="tms-empty-side">No recent calls.</div>}
            {view === 'files' && (
              <div className="tms-files">
                <div className="tms-file-row">Onboarding-Checklist.docx</div>
                <div className="tms-file-row">Sprint-Priorities.xlsx</div>
                <div className="tms-file-row">RootCause-Pipeline.pdf</div>
              </div>
            )}
          </aside>
        )}

        {/* Content */}
        <main className="tms-content">
          {view === 'teams' && (
            <>
              <div className="tms-content-head">
                <h2>{channel}</h2>
                <span className="tms-content-sub">{account.companyName} · {colleagues.length + 2} members</span>
              </div>
              <div className="tms-thread" ref={scrollRef}>
                {messages.map((m, i) => (
                  <div key={i} className="tms-msg">
                    <img src={personPhoto(m.author)} alt="" />
                    <div className="tms-msg-body">
                      <div className="tms-msg-meta"><strong>{m.author}</strong><span>{m.role}</span><span>{fmtAgo(m.minutesAgo)}</span></div>
                      <div className="tms-msg-card">{m.text.replace('{new hire}', fullName.split(' ')[0])}</div>
                    </div>
                  </div>
                ))}
                {postedHere.map((m, i) => (
                  <div key={`me-${i}`} className="tms-msg tms-msg-mine">
                    <img src={personPhoto(fullName)} alt="" />
                    <div className="tms-msg-body">
                      <div className="tms-msg-meta"><strong>{fullName}</strong><span>{account.title}</span><span>just now</span></div>
                      <div className="tms-msg-card mine">{m.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="tms-composer">
                <input
                  value={drafts[draftKey] ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [draftKey]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder={`Start a post in ${channel}`}
                />
                <button type="button" onClick={send} aria-label="Send">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 11l18-8-8 18-2.5-7.5z"/></svg>
                </button>
              </div>
            </>
          )}

          {view === 'chat' && chatPartner && (
            <>
              <div className="tms-content-head tms-chat-head">
                <img src={personPhoto(chatPartner.name)} alt="" />
                <div>
                  <h2>{chatPartner.name}</h2>
                  <span className="tms-content-sub">{chatPartner.role} · {account.companyName}</span>
                </div>
              </div>
              <div className="tms-thread" ref={scrollRef}>
                <div className="tms-msg">
                  <img src={personPhoto(chatPartner.name)} alt="" />
                  <div className="tms-msg-body">
                    <div className="tms-msg-meta"><strong>{chatPartner.name}</strong><span>{fmtAgo(80)}</span></div>
                    <div className="tms-msg-card">Hey {fullName.split(' ')[0]}, welcome aboard. Ping me if you get stuck on environment setup — took me a full day when I joined.</div>
                  </div>
                </div>
                {postedHere.map((m, i) => (
                  <div key={`me-${i}`} className="tms-msg tms-msg-mine">
                    <img src={personPhoto(fullName)} alt="" />
                    <div className="tms-msg-body">
                      <div className="tms-msg-meta"><strong>You</strong><span>just now</span></div>
                      <div className="tms-msg-card mine">{m.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="tms-composer">
                <input
                  value={drafts[draftKey] ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [draftKey]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder={`Message ${chatPartner.name.split(' ')[0]}`}
                />
                <button type="button" onClick={send} aria-label="Send">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 11l18-8-8 18-2.5-7.5z"/></svg>
                </button>
              </div>
            </>
          )}

          {view !== 'teams' && view !== 'chat' && (
            <div className="tms-placeholder">
              <h2>{RAIL.find((r) => r.id === view)?.label}</h2>
              <p>Select an item from the pane on the left.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
