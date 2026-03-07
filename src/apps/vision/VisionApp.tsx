import { FormEvent, useMemo, useState } from 'react';

const quickLinks = [
  { title: 'Gmail', href: 'https://mail.google.com' },
  { title: 'Images', href: 'https://images.google.com' },
  { title: 'Maps', href: 'https://maps.google.com' },
  { title: 'YouTube', href: 'https://youtube.com' },
];

const trendingSearches = [
  'react performance profiling',
  'typescript utility types',
  'llm prompt engineering patterns',
  'vite production optimization',
];

export function VisionApp() {
  const [query, setQuery] = useState('');

  const searchUrl = useMemo(() => {
    const params = new URLSearchParams({ q: query.trim() || 'Google' });
    return `https://www.google.com/search?${params.toString()}`;
  }, [query]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="vision-shell">
      <div className="vision-header">
        <span className="vision-chip">Vision Search</span>
        <div className="vision-links">
          {quickLinks.map((link) => (
            <a key={link.title} href={link.href} target="_blank" rel="noreferrer" className="vision-link">
              {link.title}
            </a>
          ))}
        </div>
      </div>

      <div className="vision-center">
        <h1 className="vision-logo" aria-label="Vision logo">
          <span>V</span>
          <span>i</span>
          <span>s</span>
          <span>i</span>
          <span>o</span>
          <span>n</span>
        </h1>

        <form className="vision-search-form" onSubmit={submitSearch}>
          <input
            className="vision-search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Google with Vision"
            aria-label="Search Google"
          />
          <div className="vision-search-actions">
            <button type="submit" className="vision-primary-btn">
              Vision Search
            </button>
            <button
              type="button"
              className="vision-secondary-btn"
              onClick={() => window.open('https://www.google.com/doodles', '_blank', 'noopener,noreferrer')}
            >
              I&apos;m Feeling Curious
            </button>
          </div>
        </form>

        <div className="vision-trending">
          <p>Trending right now</p>
          <div className="vision-tags">
            {trendingSearches.map((item) => (
              <button key={item} type="button" onClick={() => setQuery(item)} className="vision-tag">
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
