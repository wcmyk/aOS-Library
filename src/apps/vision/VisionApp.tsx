import { FormEvent, useMemo, useState } from 'react';

type SearchResult = { title: string; snippet: string; url: string };
type SearchTab = 'all' | 'images' | 'videos' | 'news';

const TRENDING = ['react performance profiling', 'typescript utility types', 'llm prompt engineering patterns', 'vite production optimization'];
const QUICK_LINKS: SearchResult[] = [
  { title: 'ChatGPT', snippet: 'Open ChatGPT directly from Vision.', url: 'https://chatgpt.com' },
  { title: 'YouTube', snippet: 'Watch videos and tutorials.', url: 'https://www.youtube.com' },
];
const BLOCKED_DOMAINS = ['youtube.com', 'youtu.be', 'chatgpt.com', 'chat.openai.com', 'openai.com'];

function strHash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h % 360; }
function domainFrom(url: string) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } }
function faviconLetter(url: string) { return domainFrom(url).charAt(0).toUpperCase(); }
function isLikelyBlocked(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return BLOCKED_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch { return false; }
}
function flattenTopics(topics: any[]): SearchResult[] {
  return topics.flatMap((t) => t.Topics ? flattenTopics(t.Topics) : [{
    title: (t.Text ?? '').split(' - ')[0] || 'Result',
    snippet: t.Text ?? '',
    url: t.FirstURL ?? '#',
  }]);
}

export function VisionApp() {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<SearchTab>('all');
  const [activeResult, setActiveResult] = useState<SearchResult | null>(null);

  const runSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true); setError(''); setTab('all');
    setActiveQuery(trimmed);
    try {
      const params = new URLSearchParams({ q: trimmed, format: 'json', no_html: '1', no_redirect: '1' });
      const res = await fetch(`https://api.duckduckgo.com/?${params}`);
      const data = await res.json();
      const headline: SearchResult[] = data.AbstractURL ? [{ title: data.Heading || trimmed, snippet: data.Abstract || '', url: data.AbstractURL }] : [];
      const fetched = [...headline, ...flattenTopics(data.RelatedTopics ?? [])].filter((r) => r.url && r.url !== '#').slice(0, 12);
      const merged = [...QUICK_LINKS, ...fetched];
      setResults(merged);
      setActiveResult(merged[0] ?? null);
    } catch {
      setResults(QUICK_LINKS);
      setActiveResult(QUICK_LINKS[0]);
      setError('Search service unavailable. Showing quick access links.');
    } finally { setLoading(false); }
  };

  const onSubmit = (e: FormEvent) => { e.preventDefault(); runSearch(query); };
  const showBlockedHint = activeResult ? isLikelyBlocked(activeResult.url) : false;

  const mediaResults = useMemo(() => results.slice(0, 6), [results]);

  if (activeQuery) {
    return (
      <div className="vsn-shell vsn-results-view">
        <div className="vsn-topbar">
          <span className="vsn-logo-sm"><span>V</span><span>i</span><span>s</span><span>i</span><span>o</span><span>n</span></span>
          <form className="vsn-topbar-form" onSubmit={onSubmit}>
            <input className="vsn-topbar-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Vision" />
            <button type="submit" className="vsn-search-icon-btn">Search</button>
          </form>
        </div>

        <div className="vsn-tabs">
          {(['all', 'images', 'videos', 'news'] as SearchTab[]).map((t) => (
            <button key={t} type="button" className={`vsn-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        <div className="vsn-body">
          <div className="vsn-main-col">
            {loading && <div className="vsn-status">Searching…</div>}
            {error && <div className="vsn-status vsn-error">{error}</div>}
            {!loading && tab === 'all' && results.map((r, i) => (
              <div key={i} className={`vsn-result-card${activeResult?.url === r.url ? ' vsn-result-active' : ''}`} onClick={() => setActiveResult(r)}>
                <div className="vsn-result-source-row">
                  <span className="vsn-favicon" style={{ background: `hsl(${strHash(r.url)}deg 55% 38%)` }}>{faviconLetter(r.url)}</span>
                  <span className="vsn-source-name">{domainFrom(r.url)}</span>
                </div>
                <div className="vsn-result-title">{r.title}</div>
                <div className="vsn-result-snippet">{r.snippet}</div>
              </div>
            ))}
            {!loading && (tab === 'images' || tab === 'videos' || tab === 'news') && (
              <div className="vsn-video-list">
                {mediaResults.map((r, i) => (
                  <div key={i} className="vsn-video-card" onClick={() => setActiveResult(r)}>
                    <div className="vsn-video-thumb" style={{ background: `linear-gradient(135deg, hsl(${strHash(r.url)}deg 40% 20%), hsl(${strHash(r.url) + 70}deg 50% 30%))` }} />
                    <div className="vsn-video-meta"><div className="vsn-video-title">{r.title}</div><div className="vsn-video-channel">{domainFrom(r.url)}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activeResult && (
            <aside className="vsn-knowledge vsn-knowledge-wide">
              <div className="vsn-knowledge-heading">In-app reader</div>
              <div className="vsn-knowledge-answer">{activeResult.title}</div>
              <div className="vsn-knowledge-body">{activeResult.snippet || 'No preview snippet is available for this result.'}</div>
              <div className="vsn-knowledge-link"><a href={activeResult.url} target="_blank" rel="noreferrer" className="vsn-link-btn">Open source in new tab</a></div>
              {showBlockedHint ? (
                <div className="vsn-status">This site blocks embedded iframes. Use "Open source in new tab" for full access (ChatGPT/YouTube included).</div>
              ) : (
                <iframe title={activeResult.title} src={activeResult.url} className="vsn-inline-frame" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
              )}
            </aside>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="vsn-shell vsn-home-view">
      <div className="vsn-home-center">
        <h1 className="vsn-home-logo"><span>V</span><span>i</span><span>s</span><span>i</span><span>o</span><span>n</span></h1>
        <form className="vsn-home-form" onSubmit={onSubmit}>
          <div className="vsn-home-input-wrap">
            <input className="vsn-home-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Vision" />
          </div>
          <div className="vsn-home-actions">
            <button type="submit" className="vsn-home-primary-btn">Vision Search</button>
            <button type="button" className="vsn-home-secondary-btn" onClick={() => runSearch(TRENDING[Math.floor(Math.random() * TRENDING.length)])}>I am Feeling Curious</button>
          </div>
        </form>
      </div>
    </div>
  );
}
