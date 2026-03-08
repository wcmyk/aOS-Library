export type VirtueView = 'discover' | 'apps' | 'categories' | 'updates' | 'purchased' | 'search' | 'detail';

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

export interface VirtueCatalog {
  apps: VirtueApp[];
  categories: VirtueCategory[];
  editorialCards: VirtueEditorialCard[];
  featuredCollections: VirtueCollection[];
  spotlight?: {
    title: string;
    subtitle?: string;
    description?: string;
    image?: string;
    appId?: string;
  };
}
