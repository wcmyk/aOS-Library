type EmptyStateProps = {
  title: string;
  message: string;
  compact?: boolean;
};

export function EmptyState({ title, message, compact = false }: EmptyStateProps) {
  return (
    <section className={`virtue-empty-state ${compact ? 'compact' : ''}`} aria-live="polite">
      <span className="virtue-empty-pill">Virtue</span>
      <h3>{title}</h3>
      <p>{message}</p>
    </section>
  );
}
