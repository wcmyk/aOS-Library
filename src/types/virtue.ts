export type VirtueCategory = {
  id: string;
  name: string;
  blurb?: string;
  artwork?: string;
};

export type VirtueEditorialCard = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  appId?: string;
};

export type VirtueCollection = {
  id: string;
  title: string;
  appIds: string[];
};

export type VirtueApp = {
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
};

export type VirtueCatalog = {
  apps: VirtueApp[];
  categories: VirtueCategory[];
  editorialCards: VirtueEditorialCard[];
  featuredCollections: VirtueCollection[];
};

export type VirtueInstallState = 'not_installed' | 'installing' | 'installed' | 'update_available';

export type VirtueView = 'discover' | 'apps' | 'categories' | 'updates' | 'purchased' | 'search' | 'detail';
