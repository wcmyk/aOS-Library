import { FormEvent, useState } from 'react';

type SearchResult = {
  title: string;
  snippet: string;
  url: string;
};

const trendingSearches = [
  'react performance profiling',
  'typescript utility types',
  'llm prompt engineering patterns',
  'vite production optimization',
];

function flattenRelatedTopics(topics: any[]): SearchResult[] {
  const results: SearchResult[] = [];
  for (const topic of topics) {
    if (topic.Topics) {
      results.push(...flattenRelatedTopics(topic.Topics));
      continue;
    }

    const text = topic.Text ?? '';
    const title = text.split(' - ')[0] || 'Result';
    results.push({
      title,
      snippet: text,
      url: topic.FirstURL ?? '#',
    });
  }
  return results;
}

export function VisionApp() {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runSearch = async (nextQuery: string) => {
    const trimmed = nextQuery.trim();
    if (!trimmed) return;

    setActiveQuery(trimmed);
    setLoading(true);
    setError('');
    setSelected(null);

    try {
      const params = new URLSearchParams({ q: trimmed, format: 'json', no_html: '1', no_redirect: '1' });
      const response = await fetch(`https://api.duckduckgo.com/?${params.toString()}`);
      if (!response.ok) throw new Error('Search service unavailable');
      const payload = await response.json();
      const related = flattenRelatedTopics(payload.RelatedTopics ?? []);
      const headlineResult: SearchResult[] = payload.AbstractURL
        ? [{ title: payload.Heading || trimmed, snippet: payload.Abstract || 'Top result', url: payload.AbstractURL }]
        : [];
      const next = [...headlineResult, ...related].slice(0, 12);
      setResults(next);
      setSelected(next[0] ?? null);
    } catch {
      setResults([]);
      setError('Unable to fetch results right now.');
    } finally {
      setLoading(false);
    }
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runSearch(query);
  };

  return (
    <div className="vision-shell">
      <div className="vision-header">
        <span className="vision-chip">Vision Search</span>
      </div>

      <div className="vision-center">
        <h1 className="vision-logo" aria-label="Vision logo">
          <span>V</span><span>i</span><span>s</span><span>i</span><span>o</span><span>n</span>
        </h1>

        <form className="vision-search-form" onSubmit={submitSearch}>
          <input
            className="vision-search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the web in Vision"
            aria-label="Search the web"
          />
          <div className="vision-search-actions">
            <button type="submit" className="vision-primary-btn">Vision Search</button>
            <button type="button" className="vision-secondary-btn" onClick={() => runSearch('I am feeling lucky')}>
              I&apos;m Feeling Curious
            </button>
          </div>
        </form>

        {activeQuery ? (
          <section className="vision-results" aria-live="polite">
            <div className="vision-results-header"><p>Showing results for “{activeQuery}”</p></div>
            {loading && <div className="vision-status">Loading results…</div>}
            {error && <div className="vision-status">{error}</div>}
            {!loading && !error && results.length === 0 && <div className="vision-status">No results found.</div>}
            <div className="vision-result-layout">
              <div className="vision-result-list">
                {results.map((result) => (
                  <button key={`${result.url}-${result.title}`} type="button" className="vision-result" onClick={() => setSelected(result)}>
                    <span className="vision-result-title">{result.title}</span>
                    <p>{result.snippet}</p>
                  </button>
                ))}
              </div>
              <article className="vision-result-preview">
                <h3>{selected?.title ?? 'Select a result'}</h3>
                <p>{selected?.snippet ?? 'Result details stay inside Vision, no external tab required.'}</p>
                {selected && <code>{selected.url}</code>}
              </article>
            </div>
          </section>
        ) : (
          <div className="vision-trending">
            <p>Trending right now</p>
            <div className="vision-tags">
              {trendingSearches.map((item) => (
                <button key={item} type="button" onClick={() => { setQuery(item); runSearch(item); }} className="vision-tag">
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
