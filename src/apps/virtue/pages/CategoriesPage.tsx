import type { VirtueApp, VirtueCategory } from '../../../types/virtue';
import { EmptyState } from '../components/EmptyState';

type CategoriesPageProps = {
  categories: VirtueCategory[];
  apps: VirtueApp[];
  onOpenCategory: (categoryId: string) => void;
};

export function CategoriesPage({ categories, apps, onOpenCategory }: CategoriesPageProps) {
  if (categories.length === 0) {
    return <EmptyState title="No categories configured" message="Define categories in your Virtue catalog configuration to browse by collection." />;
  }

  return (
    <section className="virtue-categories-grid">
      {categories.map((category) => (
        <button key={category.id} type="button" className="virtue-category-card" onClick={() => onOpenCategory(category.id)}>
          <h4>{category.name}</h4>
          <p>{category.blurb || 'Browse this category.'}</p>
          <span>{apps.filter((app) => app.category === category.id).length} apps</span>
        </button>
      ))}
    </section>
  );
}
