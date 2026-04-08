import type { FilterState } from '../types';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (next: FilterState) => void;
}

const RADIUS_OPTIONS = [25, 50, 100, 150, 200, 300, 500];
const WEEKS_OPTIONS = [
  { label: 'Nächste 2 Wochen', value: 2 },
  { label: 'Nächste 4 Wochen', value: 4 },
  { label: 'Nächste 8 Wochen', value: 8 },
  { label: 'Nächste 3 Monate', value: 13 },
  { label: 'Nächste 6 Monate', value: 26 },
  { label: 'Nächstes Jahr', value: 52 },
];

export default function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  return (
    <aside className="filter-panel">
      <h2 className="filter-title">
        <span className="filter-icon">⚙️</span> Filter
      </h2>

      <div className="filter-section">
        <label className="filter-label">
          📍 Radius: <strong>{filters.radiusKm} km</strong>
        </label>
        <input
          type="range"
          min={10}
          max={500}
          step={10}
          value={filters.radiusKm}
          onChange={(e) =>
            onFiltersChange({ ...filters, radiusKm: Number(e.target.value) })
          }
          className="range-slider"
        />
        <div className="radius-presets">
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              className={`preset-btn ${filters.radiusKm === r ? 'active' : ''}`}
              onClick={() => onFiltersChange({ ...filters, radiusKm: r })}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">📅 Zeitraum</label>
        <div className="weeks-options">
          {WEEKS_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              className={`weeks-btn ${filters.weeksAhead === value ? 'active' : ''}`}
              onClick={() => onFiltersChange({ ...filters, weeksAhead: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
