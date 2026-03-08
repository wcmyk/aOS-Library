type Props = { title: string; message: string };

export function EmptyState({ title, message }: Props) {
  return (
    <div className="virtue-empty">
      <div className="virtue-empty-badge">Virtue</div>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
