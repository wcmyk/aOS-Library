import type { VirtueCatalog } from '../../types/virtue';

/**
 * Virtue catalog source.
 * Add your app objects to `apps` when you are ready to publish inventory.
 */
export const virtueCatalog: VirtueCatalog = {
  apps: [],
  categories: [
    { id: 'productivity', name: 'Productivity', blurb: 'Build tools for focused work.' },
    { id: 'utilities', name: 'Utilities', blurb: 'Reliable utilities and workflows.' },
    { id: 'creativity', name: 'Creativity', blurb: 'Design, media, and storytelling.' },
    { id: 'developer-tools', name: 'Developer Tools', blurb: 'Ship, test, and monitor software.' },
    { id: 'education', name: 'Education', blurb: 'Learning experiences and study tools.' },
  ],
  editorialCards: [],
  featuredCollections: [],
};
