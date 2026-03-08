import type { VirtueCatalog } from '../../types/virtue';

/**
 * Virtue catalog source of truth.
 *
 * Add apps here (or swap this file to API data) when you're ready to publish your catalog.
 * By default this store intentionally ships with no app inventory.
 */
export const virtueCatalog: VirtueCatalog = {
  apps: [],
  categories: [
    { id: 'productivity', name: 'Productivity', blurb: 'Focused tools for getting meaningful work done.' },
    { id: 'utilities', name: 'Utilities', blurb: 'System helpers, workflow accelerators, and practical tools.' },
    { id: 'creativity', name: 'Creativity', blurb: 'Design, media, and creative expression software.' },
    { id: 'developer-tools', name: 'Developer Tools', blurb: 'Build, test, and ship software with confidence.' },
    { id: 'education', name: 'Education', blurb: 'Learning experiences and structured knowledge tools.' },
  ],
  editorialCards: [],
  featuredCollections: [],
};
