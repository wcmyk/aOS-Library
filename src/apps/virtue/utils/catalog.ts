import type { VirtueApp, VirtueSortMode } from '../../../types/virtue';

export function filterApps(apps: VirtueApp[], query: string, selectedCategory: string | null): VirtueApp[] {
  const normalizedQuery = query.trim().toLowerCase();
  return apps.filter((app) => {
    const categoryMatch = selectedCategory ? app.category === selectedCategory : true;
    if (!categoryMatch) return false;
    if (!normalizedQuery) return true;
    return [app.name, app.developer, app.category, app.tagline, app.description]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery);
  });
}

export function sortApps(apps: VirtueApp[], mode: VirtueSortMode): VirtueApp[] {
  return [...apps].sort((a, b) => {
    if (mode === 'name-desc') return b.name.localeCompare(a.name);
    if (mode === 'rating-desc') return (b.rating ?? 0) - (a.rating ?? 0);
    if (mode === 'updated-desc') return (b.lastUpdated ?? '').localeCompare(a.lastUpdated ?? '');
    return a.name.localeCompare(b.name);
  });
}
