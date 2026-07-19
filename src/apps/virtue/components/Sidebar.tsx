import type { VirtueView } from '../../../types/virtue';

const NAV_ITEMS: { id: Exclude<VirtueView, 'detail'>; label: string; icon: string }[] = [
  { id: 'discover', label: 'Discover', icon: '✦' },
  { id: 'apps', label: 'Apps', icon: '▦' },
  { id: 'categories', label: 'Categories', icon: '☰' },
  { id: 'updates', label: 'Updates', icon: '⟳' },
  { id: 'purchased', label: 'Purchased', icon: '⤓' },
];

type SidebarProps = {
  activeView: VirtueView;
  onChangeView: (view: Exclude<VirtueView, 'detail'>) => void;
};

export function Sidebar({ activeView, onChangeView }: SidebarProps) {
  return (
    <aside className="virtue-sidebar" aria-label="App Store navigation">
      <button type="button" className="mas-search-trigger" onClick={() => onChangeView('search')}>
        <span>🔍</span> Search
      </button>
      <nav>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activeView === item.id ? 'active' : ''}
            onClick={() => onChangeView(item.id)}
          >
            <span className="mas-nav-ic">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="mas-sidebar-foot">
        <div className="mas-me">W</div>
        <span>Workspace User</span>
      </div>
    </aside>
  );
}
