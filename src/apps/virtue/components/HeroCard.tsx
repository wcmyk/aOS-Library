import type { VirtueEditorialCard } from '../../../types/virtue';

type HeroCardProps = {
  card: VirtueEditorialCard;
  onOpenApp?: (appId: string) => void;
};

export function HeroCard({ card, onOpenApp }: HeroCardProps) {
  return (
    <article
      className={`virtue-hero-card ${card.image ? 'has-image' : ''}`}
      style={card.image ? { backgroundImage: `linear-gradient(180deg, rgba(6,10,20,0.05) 30%, rgba(6,10,20,0.78)), url(${card.image})` } : undefined}
      onClick={() => { if (card.appId) onOpenApp?.(card.appId); }}
      role={card.appId ? 'button' : undefined}
    >
      <small>{card.subtitle || 'FEATURED'}</small>
      <h3>{card.title}</h3>
      {card.description ? <p>{card.description}</p> : null}
      {card.appId ? (
        <button
          type="button"
          className="virtue-subtle-link"
          onClick={(e) => {
            e.stopPropagation();
            if (card.appId) onOpenApp?.(card.appId);
          }}
        >
          View app ›
        </button>
      ) : null}
    </article>
  );
}
