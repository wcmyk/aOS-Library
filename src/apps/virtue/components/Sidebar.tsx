import type { VirtueView } from '../../../types/virtue';

const NAV_ITEMS: { id: Exclude<VirtueView, 'detail'>; label: string }[] = [
  { id: 'discover', label: 'Discover' },
  { id: 'apps', label: 'Apps' },
  { id: 'categories', label: 'Categories' },
  { id: 'updates', label: 'Updates' },
  { id: 'purchased', label: 'Purchased' },
  { id: 'search', label: 'Search' },
];

type SidebarProps = {
  activeView: VirtueView;
  onChangeView: (view: Exclude<VirtueView, 'detail'>) => void;
};

export function Sidebar({ activeView, onChangeView }: SidebarProps) {
  return (
    <aside className="virtue-sidebar" aria-label="Virtue navigation">
      <header className="virtue-brand">
        <div className="virtue-brand-logo" aria-hidden="true">V</div>
        <div>
          <strong>Virtue</strong>
          <small>App Store</small>
        </div>
      </header>
      <nav>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activeView === item.id ? 'active' : ''}
            onClick={() => onChangeView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
