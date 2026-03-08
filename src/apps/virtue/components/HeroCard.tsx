import type { VirtueEditorialCard } from '../../../types/virtue';

type HeroCardProps = {
  card: VirtueEditorialCard;
  onOpenApp?: (appId: string) => void;
};

export function HeroCard({ card, onOpenApp }: HeroCardProps) {
  return (
    <article className="virtue-hero-card">
      <small>{card.subtitle || 'FEATURED'}</small>
      <h3>{card.title}</h3>
      {card.description ? <p>{card.description}</p> : null}
      {card.appId ? (
        <button
          type="button"
          className="virtue-subtle-link"
          onClick={() => {
            if (card.appId) onOpenApp?.(card.appId);
          }}
        >
          View app
        </button>
      ) : null}
    </article>
  );
}
