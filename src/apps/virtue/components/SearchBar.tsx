import { type FormEvent } from 'react';

type SearchBarProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
};

export function SearchBar({ query, onQueryChange, onSubmit }: SearchBarProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="virtue-searchbar" onSubmit={handleSubmit} role="search" aria-label="Search apps">
      <span aria-hidden="true">⌕</span>
      <input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search apps, developers, categories"
        aria-label="Search apps, developers, categories"
      />
    </form>
  );
}
