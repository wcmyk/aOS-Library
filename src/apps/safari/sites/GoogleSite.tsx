import { useMemo, useState } from 'react';
import { useProfileStore } from '../../../state/useProfileStore';
import { GoogleWordmark, GeminiSpark, GmailM, PolymarketMark } from '../../../data/brands';
import { useSafariStore } from '../../../state/useSafariStore';
import './google.css';



type WebResult = { title: string; url: string; snippet: string };

// Internal-web results so searches land on simulation surfaces
function buildResults(q: string): WebResult[] {
  const query = q.toLowerCase();
  const all: WebResult[] = [
    { title: 'LinkedIn: Jobs, Networking, and Careers', url: 'https://linkedin.com', snippet: `Browse thousands of open roles matching "${q}" at Google, Apple, McKinsey, Amazon and more. Apply with Easy Apply and track recruiter responses.` },
    { title: 'Workday — Employee Self Service', url: 'https://workday.company.io', snippet: 'View your payslips, career profile, time off balances, and tasks awaiting your action in Workday.' },
    { title: 'myADP — Pay statements, W-2s and benefits', url: 'https://my.adp.com', snippet: 'Securely access your pay statements, tax documents, timecard, and retirement savings with ADP.' },
    { title: 'Gmail — Email by Google', url: 'https://mail.google.com', snippet: 'Fast, secure email for your job search: recruiter confirmations, interview invitations, and offer letters in one inbox.' },
    { title: 'Chase Online Banking — Card Services', url: 'https://chase.com', snippet: 'Manage your Sapphire Reserve and Freedom Unlimited cards, view payroll direct deposits, and transfer money.' },
    { title: `${q} — Interview preparation guide`, url: 'https://careers.aos/guides', snippet: `Structured preparation for ${q}: phone screen, panel loops, system design, and behavioral rounds with rubric-based feedback.` },
  ];
  if (/salary|pay|compensation/.test(query)) all.unshift({ title: `${q} — Salary ranges and compensation data`, url: 'https://workday.company.io', snippet: 'Median base pay, bonus structures, and biweekly net pay after federal, state, FICA, and 401(k) deductions.' });
  return all;
}

function aiAnswer(q: string): string {
  return `Here's an overview of "${q}":

• In the aOS workforce simulation, the fastest path is: search openings on LinkedIn → apply → reply to each recruiter email in Outlook or Gmail to schedule the next round → complete interviews → accept the written offer to unlock Workday, ADP, and payroll.

• Once employed, your real work lives in Workday → My Tasks: role-specific deliverables with hard deadlines and complexity ratings. Submitting quality write-ups on time is what earns promotions through the review cycle.

• Pay flows automatically: biweekly checks appear in Workday (payslips + paper-check view), ADP (statements, W-2, 401k), and your Chase checking account.

Want me to break down any single step in more detail?`;
}

export function GoogleSite() {
  const { fullName } = useProfileStore();
  const navigate = useSafariStore((s) => s.navigate);
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [thinking, setThinking] = useState(false);

  const results = useMemo(() => (submitted ? buildResults(submitted) : []), [submitted]);

  // Google's native AI Overview appears for question-like queries, like real Search.
  const showOverview = /^(how|what|why|when|who|where|can|should|is|are|does|do)\b|\?$/i.test(submitted.trim());

  const runSearch = () => {
    if (!query.trim()) return;
    setSubmitted(query.trim());
    setThinking(true);
    setTimeout(() => setThinking(false), 900);
  };

  // ── Landing ──
  if (!submitted) {
    return (
      <div className="go-shell">
        <header className="go-topnav">
          <nav>
            <button type="button" onClick={() => navigate('https://mail.google.com')}>Gmail</button>
            <button type="button">Images</button>
          </nav>
          <div className="go-topnav-right">
            <button type="button" className="go-waffle" title="Google apps">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="#5f6368"><circle cx="3" cy="3" r="1.7"/><circle cx="9" cy="3" r="1.7"/><circle cx="15" cy="3" r="1.7"/><circle cx="3" cy="9" r="1.7"/><circle cx="9" cy="9" r="1.7"/><circle cx="15" cy="9" r="1.7"/><circle cx="3" cy="15" r="1.7"/><circle cx="9" cy="15" r="1.7"/><circle cx="15" cy="15" r="1.7"/></svg>
            </button>
            <div className="go-me">{(fullName[0] ?? 'U').toUpperCase()}</div>
          </div>
        </header>
        <div className="go-center">
          <GoogleWordmark height={64} />
          <div className="go-searchbar">
            <span className="go-search-ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg></span>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              aria-label="Search"
            />
            <span className="go-mic"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M12 14.5a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5.5a3 3 0 0 0 3 3z"/><path fill="#34A853" d="M17.3 11.5a5.3 5.3 0 0 1-10.6 0H5a7 7 0 0 0 6 6.9V21h2v-2.6a7 7 0 0 0 6-6.9z"/></svg></span>
          </div>
          <div className="go-btnrow">
            <button type="button" onClick={() => runSearch()}>Google Search</button>
            <button type="button" onClick={() => { setQuery('how to get promoted fast'); }}>I'm Feeling Lucky</button>
          </div>
          <div className="go-workspace">
            <span className="go-workspace-label">Google Workspace for {fullName.split(' ')[0]}</span>
            <div className="go-workspace-tiles">
              <button type="button" onClick={() => navigate('https://mail.google.com')}><GmailM size={26} /><span>Gmail</span></button>
              <button type="button"><span className="go-tile-drive">▲</span><span>Drive</span></button>
              <button type="button"><span className="go-tile-docs">≡</span><span>Docs</span></button>
              <button type="button"><span className="go-tile-cal">31</span><span>Calendar</span></button>
              <button type="button"><span className="go-tile-meet"><svg width="16" height="16" viewBox="0 0 24 24" fill="#00832d"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h9A1.5 1.5 0 0 1 15 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 17.5zM16 10l5-3.5v11L16 14z"/></svg></span><span>Meet</span></button>
            </div>
          </div>
        </div>
        <footer className="go-footer">
          <span>aOS Simulation Network</span>
          <span className="go-sponsor">Sponsored by <PolymarketMark height={14} /></span>
        </footer>
      </div>
    );
  }

  // ── Results ──
  return (
    <div className="go-shell go-results-shell">
      <header className="go-results-head">
        <button type="button" className="go-results-logo" onClick={() => setSubmitted('')}>
          <GoogleWordmark height={26} />
        </button>
        <div className="go-searchbar go-searchbar-sm">
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runSearch()} />
          <span className="go-search-ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg></span>
        </div>
      </header>
      <div className="go-results-tabs">
        {['All', 'AI Mode', 'Images', 'News', 'Videos', 'Shopping', 'More'].map((t, i) => (
          <button key={t} type="button" className={i === 0 ? 'active' : ''}>{t}</button>
        ))}
      </div>
      <main className="go-results-main">
        <div className="go-results-count">About {(1_240_000 + submitted.length * 73_211).toLocaleString()} results (0.{30 + (submitted.length % 60)} seconds)</div>

        {showOverview && (
          <section className="go-ai-card gemini">
            <header>
              <GeminiSpark size={20} />
              <strong>AI Overview</strong>
            </header>
            {thinking ? (
              <div className="go-ai-thinking"><span /><span /><span /></div>
            ) : (
              <>
                <p>{aiAnswer(submitted)}</p>
                <div className="go-ai-disclaimer">AI responses may include mistakes. <span>Learn more</span></div>
              </>
            )}
          </section>
        )}

        {results.map((r) => (
          <div key={r.url + r.title} className="go-result">
            <div className="go-result-url">{r.url.replace('https://', '')}</div>
            <button type="button" className="go-result-title" onClick={() => navigate(r.url)}>{r.title}</button>
            <p className="go-result-snippet">{r.snippet}</p>
          </div>
        ))}

        <div className="go-result go-result-sponsored">
          <div className="go-result-url">polymarket.com <span className="go-adtag">Sponsored</span></div>
          <div className="go-result-title-static"><PolymarketMark height={18} /></div>
          <p className="go-result-snippet">The world's largest prediction market. What are the odds on your industry's next move?</p>
        </div>
      </main>
    </div>
  );
}
