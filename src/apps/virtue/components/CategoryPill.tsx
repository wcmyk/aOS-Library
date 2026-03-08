type CategoryPillProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export function CategoryPill({ label, active, onClick }: CategoryPillProps) {
  return (
    <button type="button" className={`virtue-category-pill ${active ? 'active' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}
