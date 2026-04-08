import { useState, useEffect, useCallback, useMemo, useReducer, useRef } from 'react';
import FestivalMap from './components/Map';
import FilterPanel from './components/FilterPanel';
import FestivalList from './components/FestivalList';
import { festivals as allFestivals } from './data/festivals';
import { geocodePostalCode, haversineDistance, daysUntil } from './utils/geo';
import type { Festival, FilterState, Coordinates } from './types';
import './App.css';

const DEFAULT_FILTERS: FilterState = {
  radiusKm: 100,
  weeksAhead: 13,
};

type GeoState =
  | { status: 'idle'; center: null; error: null }
  | { status: 'loading'; center: null; error: null }
  | { status: 'ready'; center: Coordinates; error: null }
  | { status: 'error'; center: null; error: string };

type GeoAction =
  | { type: 'fetch' }
  | { type: 'resolved'; center: Coordinates }
  | { type: 'failed'; message: string }
  | { type: 'reset' };

const INITIAL_GEO: GeoState = { status: 'idle', center: null, error: null };

function geoReducer(_state: GeoState, action: GeoAction): GeoState {
  switch (action.type) {
    case 'fetch':   return { status: 'loading', center: null, error: null };
    case 'resolved': return { status: 'ready',  center: action.center, error: null };
    case 'failed':  return { status: 'error',   center: null, error: action.message };
    case 'reset':   return INITIAL_GEO;
  }
}

export default function App() {
  const [postalCode, setPostalCode] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [geo, dispatchGeo] = useReducer(geoReducer, INITIAL_GEO);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!postalCode) return;
    let cancelled = false;

    geocodePostalCode(postalCode).then((coords) => {
      if (cancelled) return;
      if (coords) {
        dispatchGeo({ type: 'resolved', center: coords });
      } else {
        dispatchGeo({ type: 'failed', message: `Postleitzahl „${postalCode}" wurde nicht gefunden.` });
      }
    });

    dispatchGeo({ type: 'fetch' });

    return () => {
      cancelled = true;
    };
  }, [postalCode]);

  const handleSearch = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed === postalCode) return;
    setPostalCode(trimmed);
    setSelectedFestival(null);
  }, [inputValue, postalCode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch();
    },
    [handleSearch],
  );

  const { filteredFestivals, distances } = useMemo(() => {
    const distMap = new Map() as Map<number, number>;
    const maxDays = filters.weeksAhead * 7;
    const center = geo.center;

    const filtered = allFestivals.filter((f) => {
      const daysToStart = daysUntil(f.startDate);
      const daysToEnd = daysUntil(f.endDate);
      if (daysToEnd < 0) return false;
      if (daysToStart > maxDays) return false;

      if (center) {
        const dist = haversineDistance(center, { lat: f.lat, lng: f.lng });
        distMap.set(f.id, dist);
        if (dist > filters.radiusKm) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      if (center) {
        const dA = distMap.get(a.id) ?? Infinity;
        const dB = distMap.get(b.id) ?? Infinity;
        if (dA !== dB) return dA - dB;
      }
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    return { filteredFestivals: filtered, distances: distMap };
  }, [geo.center, filters]);

  const handleFestivalSelect = useCallback((festival: Festival) => {
    setSelectedFestival((prev) => (prev?.id === festival.id ? null : festival));
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🎪</span>
            <span className="logo-text">Festival Radar</span>
          </div>

          <div className="search-bar">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Postleitzahl eingeben …"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="search-input"
              maxLength={5}
              aria-label="Postleitzahl"
            />
            <button
              onClick={handleSearch}
              className="search-btn"
              disabled={geo.status === 'loading' || !inputValue.trim()}
              aria-label="Suchen"
            >
              {geo.status === 'loading' ? '…' : '🔍'}
            </button>
          </div>

          <button
            className={`filter-toggle-btn ${filterOpen ? 'active' : ''}`}
            onClick={() => setFilterOpen((o) => !o)}
            aria-label="Filter"
          >
            ⚙️ Filter
            <span className="filter-badge">{filters.radiusKm} km</span>
          </button>
        </div>

        {geo.error && <div className="error-banner">{geo.error}</div>}
      </header>

      <div className={`filter-drawer ${filterOpen ? 'open' : ''}`}>
        <FilterPanel filters={filters} onFiltersChange={setFilters} />
      </div>

      <main className="main-content">
        <div className="map-container">
          <FestivalMap
            center={geo.center}
            festivals={filteredFestivals}
            radiusKm={filters.radiusKm}
            onFestivalClick={handleFestivalSelect}
            selectedFestival={selectedFestival}
          />
        </div>

        <div className="list-sidebar">
          <FestivalList
            festivals={filteredFestivals}
            distances={distances}
            selectedFestival={selectedFestival}
            onSelect={handleFestivalSelect}
            loading={geo.status === 'loading'}
            hasCenter={geo.center !== null}
          />
        </div>
      </main>
    </div>
  );
}
