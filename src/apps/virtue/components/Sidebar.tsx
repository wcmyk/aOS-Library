import type { ReactNode } from 'react';
import type { VirtueView } from '../../../types/virtue';
import {
  ArcadeIcon,
  CategoriesIcon,
  CreateIcon,
  DevelopIcon,
  DiscoverIcon,
  PlayIcon,
  SearchIcon,
  UpdatesIcon,
  WorkIcon,
} from './icons';

const NAV_ITEMS: { id: Exclude<VirtueView, 'detail' | 'search' | 'apps' | 'purchased'>; label: string; icon: ReactNode }[] = [
  { id: 'discover', label: 'Discover', icon: <DiscoverIcon /> },
  { id: 'arcade', label: 'Arcade', icon: <ArcadeIcon /> },
  { id: 'create', label: 'Create', icon: <CreateIcon /> },
  { id: 'work', label: 'Work', icon: <WorkIcon /> },
  { id: 'play', label: 'Play', icon: <PlayIcon /> },
  { id: 'develop', label: 'Develop', icon: <DevelopIcon /> },
  { id: 'categories', label: 'Categories', icon: <CategoriesIcon /> },
  { id: 'updates', label: 'Updates', icon: <UpdatesIcon /> },
];

type SidebarProps = {
  activeView: VirtueView;
  onChangeView: (view: Exclude<VirtueView, 'detail'>) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  updateCount: number;
  userName: string;
  userInitials: string;
};

export function Sidebar({
  activeView,
  onChangeView,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  updateCount,
  userName,
  userInitials,
}: SidebarProps) {
  return (
    <aside className="virtue-sidebar" aria-label="App Store navigation">
      <div className="mas-search">
        <SearchIcon />
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          aria-label="Search the App Store"
          onFocus={() => onChangeView('search')}
          onChange={(event) => {
            onSearchChange(event.target.value);
            if (activeView !== 'search') onChangeView('search');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSearchSubmit();
          }}
        />
      </div>

      <nav>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activeView === item.id ? 'active' : ''}
            onClick={() => onChangeView(item.id)}
          >
            <span className="mas-nav-ic" aria-hidden="true">
              {item.icon}
            </span>
            <span className="mas-nav-label">{item.label}</span>
            {item.id === 'updates' && updateCount > 0 ? <span className="mas-badge">{updateCount}</span> : null}
          </button>
        ))}
      </nav>

      <div className="mas-sidebar-foot">
        <div className="mas-me" aria-hidden="true">
          {userInitials}
        </div>
        <span>{userName}</span>
      </div>
    </aside>
  );
}
