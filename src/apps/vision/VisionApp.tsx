import { FormEvent, useState } from 'react';

type SearchResult = {
  title: string;
  snippet: string;
  url: string;
};

type SearchTab = 'all' | 'images' | 'videos' | 'news';

const TRENDING = [
  'react performance profiling',
  'typescript utility types',
  'llm prompt engineering patterns',
  'vite production optimization',
];

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

function domainFrom(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url.split('/')[0] ?? url; }
}

function breadcrumb(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return u.hostname.replace(/^www\./, '');
    return `${u.hostname.replace(/^www\./, '')} › ${parts.join(' › ')}`;
  } catch { return url; }
}

function faviconLetter(url: string): string {
  return domainFrom(url).charAt(0).toUpperCase();
}

function flattenRelatedTopics(topics: any[]): SearchResult[] {
  const results: SearchResult[] = [];
  for (const topic of topics) {
    if (topic.Topics) { results.push(...flattenRelatedTopics(topic.Topics)); continue; }
    const text = topic.Text ?? '';
    results.push({ title: text.split(' - ')[0] || 'Result', snippet: text, url: topic.FirstURL ?? '#' });
  }
  return results;
}

const IMAGE_SIZES = [
  '1280×720','960×540','800×600','1920×1080','640×480',
  '1200×630','640×360','1600×900','512×512','300×250',
  '1024×768','800×800','480×320','1080×1080','720×480','2560×1440',
];

function ImageResults({ query }: { query: string }) {
  return (
    <div className="vsn-img-grid">
      {Array.from({ length: 16 }, (_, i) => {
        const h = strHash(query + i);
        return (
          <div key={i} className="vsn-img-tile" style={{
            background: `linear-gradient(135deg, hsl(${h % 360}deg 45% 22%), hsl(${(h + 60) % 360}deg 55% 32%))`,
          }}>
            <span className="vsn-img-label">{query} — {i + 1}</span>
            <span className="vsn-img-size">{IMAGE_SIZES[i % IMAGE_SIZES.length]}</span>
          </div>
        );
      })}
    </div>
  );
}

const VIDEO_SOURCES = ['YouTube','Vimeo','Daily Motion','TED','Coursera','Khan Academy'];
const VIDEO_DURATIONS = ['4:32','12:07','7:51','23:14','1:45:03','9:28'];
const VIDEO_VIEWS = ['1.2M views','847K views','312K views','5.4M views','94K views','2.1M views'];
const VIDEO_LABELS = ['Complete Guide','Tutorial','Deep Dive','Overview','Advanced Topics','Explained'];

function VideoResults({ query }: { query: string }) {
  return (
    <div className="vsn-video-list">
      {Array.from({ length: 6 }, (_, i) => {
        const h = strHash(query + 'vid' + i);
        return (
          <div key={i} className="vsn-video-card">
            <div className="vsn-video-thumb" style={{
              background: `linear-gradient(135deg, hsl(${h % 360}deg 45% 18%), hsl(${(h + 80) % 360}deg 55% 28%))`,
            }}>
              <div className="vsn-video-play">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="white"><path d="M5 3l11 6-11 6z" /></svg>
              </div>
              <span className="vsn-video-dur">{VIDEO_DURATIONS[i % VIDEO_DURATIONS.length]}</span>
              <span className="vsn-video-src">{VIDEO_SOURCES[i % VIDEO_SOURCES.length]}</span>
            </div>
            <div className="vsn-video-meta">
              <div className="vsn-video-title">{query} — {VIDEO_LABELS[i % VIDEO_LABELS.length]}</div>
              <div className="vsn-video-channel">{query.split(' ')[0] ?? 'Channel'} Academy</div>
              <div className="vsn-video-stats">{VIDEO_VIEWS[i % VIDEO_VIEWS.length]} · {[2,5,14,30,90,180][i % 6]} days ago</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function VisionApp() {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [abstract, setAbstract] = useState<{ heading: string; text: string; url: string; answer: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<SearchTab>('all');
  const [activeResult, setActiveResult] = useState<SearchResult | null>(null);

  const runSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setActiveQuery(trimmed);
    setLoading(true);
    setError('');
    setAbstract(null);
    setTab('all');
    setActiveResult(null);
    try {
      const params = new URLSearchParams({ q: trimmed, format: 'json', no_html: '1', no_redirect: '1' });
      const res = await fetch(`https://api.duckduckgo.com/?${params}`);
      if (!res.ok) throw new Error('unavailable');
      const data = await res.json();
      const headline: SearchResult[] = data.AbstractURL
        ? [{ title: data.Heading || trimmed, snippet: data.Abstract || '', url: data.AbstractURL }]
        : [];
      setResults([...headline, ...flattenRelatedTopics(data.RelatedTopics ?? [])].slice(0, 12));
      if (data.AbstractText) {
        setAbstract({ heading: data.Heading || trimmed, text: data.AbstractText, url: data.AbstractURL || '', answer: data.Answer || '' });
      }
    } catch {
      setResults([]);
      setError('Search service unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => { e.preventDefault(); runSearch(query); };

  // ── Results view ──────────────────────────────────────────────────────────
  if (activeQuery) {
    return (
      <div className="vsn-shell vsn-results-view">
        <div className="vsn-topbar">
          <span className="vsn-logo-sm">
            <span>V</span><span>i</span><span>s</span><span>i</span><span>o</span><span>n</span>
          </span>
          <form className="vsn-topbar-form" onSubmit={onSubmit}>
            <input
              className="vsn-topbar-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Vision"
            />
            {query && (
              <button type="button" className="vsn-clear-btn" onClick={() => setQuery('')}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l10 10M11 1L1 11" />
                </svg>
              </button>
            )}
            <button type="submit" className="vsn-search-icon-btn">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="6.5" cy="6.5" r="4.5" /><path d="M10 10l3.5 3.5" />
              </svg>
            </button>
          </form>
        </div>

        <div className="vsn-tabs">
          {(['all','images','videos','news'] as SearchTab[]).map((t) => (
            <button key={t} type="button" className={`vsn-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="vsn-body">
          <div className="vsn-main-col">
            {loading && <div className="vsn-status">Searching…</div>}
            {error && <div className="vsn-status vsn-error">{error}</div>}
            {!loading && !error && (
              <>
                {tab === 'all' && (results.length === 0
                  ? <div className="vsn-status">No results found.</div>
                  : results.map((r, i) => {
                      const domain = domainFrom(r.url);
                      const hue = strHash(domain);
                      const isClickable = r.url && r.url !== '#';
                      return (
                        <div
                          key={i}
                          className="vsn-result-card"
                          style={{ cursor: isClickable ? 'pointer' : 'default' }}
                          onClick={() => isClickable && setActiveResult(r)}
                        >
                          <div className="vsn-result-source-row">
                            <span className="vsn-favicon" style={{ background: `hsl(${hue}deg 55% 38%)` }}>{faviconLetter(r.url)}</span>
                            <div className="vsn-source-info">
                              <span className="vsn-source-name">{domain}</span>
                              <span className="vsn-breadcrumb">{breadcrumb(r.url)}</span>
                            </div>
                          </div>
                          <div className="vsn-result-title">{r.title}</div>
                          <div className="vsn-result-snippet">{r.snippet}</div>
                        </div>
                      );
                    })
                )}
                {tab === 'images' && <ImageResults query={activeQuery} />}
                {tab === 'videos' && <VideoResults query={activeQuery} />}
                {tab === 'news' && (results.length === 0
                  ? <div className="vsn-status">No results found.</div>
                  : results.map((r, i) => {
                      const domain = domainFrom(r.url);
                      const hue = strHash(domain);
                      const isClickable = r.url && r.url !== '#';
                      return (
                        <div
                          key={i}
                          className="vsn-result-card vsn-news-card"
                          style={{ cursor: isClickable ? 'pointer' : 'default' }}
                          onClick={() => isClickable && setActiveResult(r)}
                        >
                          <div className="vsn-news-meta">
                            <span className="vsn-favicon vsn-favicon-sm" style={{ background: `hsl(${hue}deg 55% 38%)` }}>{faviconLetter(r.url)}</span>
                            <span className="vsn-source-name">{domain}</span>
                            <span className="vsn-news-date">{[2,5,1,14,3,7,21,0,10,4,6,8][i % 12]} days ago</span>
                          </div>
                          <div className="vsn-result-title">{r.title}</div>
                          <div className="vsn-result-snippet">{r.snippet}</div>
                        </div>
                      );
                    })
                )}
              </>
            )}
          </div>


          {activeResult && (
            <aside className="vsn-knowledge">
              <div className="vsn-knowledge-heading">In-app reader</div>
              <div className="vsn-knowledge-answer">{activeResult.title}</div>
              <div className="vsn-knowledge-body">{activeResult.snippet || 'This source does not expose a preview snippet. You can still continue browsing in-app.'}</div>
              <div className="vsn-knowledge-link">
                <div className="vsn-breadcrumb">{activeResult.url}</div>
              </div>
              <iframe title={activeResult.title} src={activeResult.url} className="vsn-inline-frame" sandbox="allow-scripts allow-same-origin allow-forms" />
            </aside>
          )}

          {abstract && tab === 'all' && (
            <aside className="vsn-knowledge">
              <div className="vsn-knowledge-heading">{abstract.heading}</div>
              {abstract.answer && <div className="vsn-knowledge-answer">{abstract.answer}</div>}
              <div className="vsn-knowledge-body">{abstract.text}</div>
              {abstract.url && <div className="vsn-knowledge-link"><button type="button" className="vsn-link-btn" onClick={() => setActiveResult({ title: abstract.heading, snippet: abstract.text, url: abstract.url })}>{abstract.url}</button></div>}
              <div className="vsn-knowledge-chips">
                <span className="vsn-kchip">Summary</span>
                <span className="vsn-kchip">Related</span>
                <span className="vsn-kchip">Factsheet</span>
              </div>
            </aside>
          )}
        </div>
      </div>
    );
  }

  // ── Home view ─────────────────────────────────────────────────────────────
  return (
    <div className="vsn-shell vsn-home-view">
      <div className="vsn-home-center">
        <h1 className="vsn-home-logo">
          <span>V</span><span>i</span><span>s</span><span>i</span><span>o</span><span>n</span>
        </h1>
        <form className="vsn-home-form" onSubmit={onSubmit}>
          <div className="vsn-home-input-wrap">
            <input
              className="vsn-home-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Vision"
            />
            <button type="submit" className="vsn-home-search-btn">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="7.5" cy="7.5" r="5.5" /><path d="M12 12l4 4" />
              </svg>
            </button>
          </div>
          <div className="vsn-home-actions">
            <button type="submit" className="vsn-home-primary-btn">Vision Search</button>
            <button type="button" className="vsn-home-secondary-btn" onClick={() => runSearch(TRENDING[Math.floor(Math.random() * TRENDING.length)])}>
              I am Feeling Curious
            </button>
          </div>
        </form>
        <div className="vsn-trending-section">
          <p className="vsn-trending-label">Trending searches</p>
          <div className="vsn-trending-tags">
            {TRENDING.map((t) => (
              <button key={t} type="button" className="vsn-trending-tag" onClick={() => { setQuery(t); runSearch(t); }}>{t}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
