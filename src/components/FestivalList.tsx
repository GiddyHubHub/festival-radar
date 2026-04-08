import type { Festival } from '../types';
import { formatDate, daysUntil } from '../utils/geo';

interface FestivalCardProps {
  festival: Festival;
  distance: number | null;
  isSelected: boolean;
  onClick: () => void;
}

function FestivalCard({ festival, distance, isSelected, onClick }: FestivalCardProps) {
  const days = daysUntil(festival.startDate);
  const dayLabel =
    days === 0
      ? 'Heute!'
      : days === 1
        ? 'Morgen!'
        : days < 0
          ? `Vor ${Math.abs(days)} Tagen`
          : `In ${days} Tagen`;

  const urgency = days >= 0 && days <= 7 ? 'urgent' : days >= 0 && days <= 21 ? 'soon' : '';

  return (
    <div
      className={`festival-card ${isSelected ? 'selected' : ''} ${urgency}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="card-header">
        <h3 className="card-name">{festival.name}</h3>
        {distance !== null && (
          <span className="card-distance">{Math.round(distance)} km</span>
        )}
      </div>
      <div className="card-location">
        📍 {festival.city} — {festival.location}
      </div>
      <div className="card-dates">
        📅 {formatDate(festival.startDate)} – {formatDate(festival.endDate)}
        <span className={`day-label ${urgency}`}>{dayLabel}</span>
      </div>
      <div className="card-genres">
        {festival.genre.map((g) => (
          <span key={g} className="genre-tag">
            {g}
          </span>
        ))}
      </div>
      {festival.website && (
        <a
          href={festival.website}
          target="_blank"
          rel="noopener noreferrer"
          className="card-link"
          onClick={(e) => e.stopPropagation()}
        >
          Website →
        </a>
      )}
    </div>
  );
}

interface FestivalListProps {
  festivals: Festival[];
  distances: Map<number, number>;
  selectedFestival: Festival | null;
  onSelect: (festival: Festival) => void;
  loading: boolean;
  hasCenter: boolean;
}

export default function FestivalList({
  festivals,
  distances,
  selectedFestival,
  onSelect,
  loading,
  hasCenter,
}: FestivalListProps) {
  if (loading) {
    return (
      <div className="list-placeholder">
        <div className="spinner" />
        <p>Standort wird ermittelt …</p>
      </div>
    );
  }

  if (!hasCenter) {
    return (
      <div className="list-placeholder">
        <p className="placeholder-hint">
          Gib oben deine Postleitzahl ein, um Festivals in deiner Nähe zu finden.
        </p>
      </div>
    );
  }

  if (festivals.length === 0) {
    return (
      <div className="list-placeholder">
        <p className="placeholder-hint">
          Keine Festivals gefunden. Versuche einen größeren Radius oder Zeitraum.
        </p>
      </div>
    );
  }

  return (
    <div className="festival-list">
      <p className="list-count">
        {festivals.length} Festival{festivals.length !== 1 ? 's' : ''} gefunden
      </p>
      {festivals.map((f) => (
        <FestivalCard
          key={f.id}
          festival={f}
          distance={distances.get(f.id) ?? null}
          isSelected={selectedFestival?.id === f.id}
          onClick={() => onSelect(f)}
        />
      ))}
    </div>
  );
}
