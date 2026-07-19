export type VirtueView =
  | 'discover'
  | 'arcade'
  | 'create'
  | 'work'
  | 'play'
  | 'develop'
  | 'apps'
  | 'categories'
  | 'updates'
  | 'purchased'
  | 'search'
  | 'detail';

/** A section reachable from the sidebar that renders a themed browse grid. */
export type VirtueSection = 'arcade' | 'create' | 'work' | 'play' | 'develop';

export type VirtueInstallState = 'not_installed' | 'installing' | 'installed' | 'update_available';

export type VirtueLayoutMode = 'grid' | 'list';

export type VirtueSortMode = 'name-asc' | 'name-desc' | 'rating-desc' | 'updated-desc';

export interface VirtueCategory {
  id: string;
  name: string;
  blurb?: string;
  artwork?: string;
}

export interface VirtueEditorialCard {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  appId?: string;
}

export interface VirtueCollection {
  id: string;
  title: string;
  subtitle?: string;
  appIds: string[];
}

export interface VirtueApp {
  id: string;
  name: string;
  developer: string;
  tagline?: string;
  description?: string;
  longDescription?: string;
  category: string;
  icon?: string;
  heroImage?: string;
  screenshots: string[];
  version?: string;
  size?: string;
  rating?: number;
  reviewsCount?: number;
  ageRating?: string;
  releaseNotes?: string;
  lastUpdated?: string;
  featured?: boolean;
  installed?: boolean;
  price?: string;
  isFree?: boolean;
  bundleId?: string;
  compatibility?: string[];
  permissions?: string[];
  website?: string;
  supportUrl?: string;
  updateAvailable?: boolean;
  owned?: boolean;
}

export interface VirtueDiscoverHero {
  eyebrow: string;
  title: string;
  description: string;
  image?: string;
  /** App opened when the hero is clicked. */
  appId?: string;
  /** App icon that floats over the hero artwork. */
  iconAppId?: string;
}

export interface VirtueDiscoverCard {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  /** 'cluster' renders a ring of app icons, 'image' renders a single circular artwork. */
  kind: 'cluster' | 'image';
  image?: string;
  appId?: string;
  /** Icons used when kind === 'cluster'. */
  appIds?: string[];
}

export interface VirtueDiscover {
  hero: VirtueDiscoverHero;
  cards: VirtueDiscoverCard[];
  bestNewTitle: string;
  bestNewAppIds: string[];
}

export interface VirtueCatalog {
  apps: VirtueApp[];
  categories: VirtueCategory[];
  editorialCards: VirtueEditorialCard[];
  featuredCollections: VirtueCollection[];
  discover?: VirtueDiscover;
  /** Maps a sidebar section to the category ids it aggregates. */
  sections?: Partial<Record<VirtueSection, { title: string; blurb: string; categoryIds: string[] }>>;
  spotlight?: {
    title: string;
    subtitle?: string;
    description?: string;
    image?: string;
    appId?: string;
  };
}
