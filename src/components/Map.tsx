import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Festival, Coordinates } from '../types';
import { formatDate } from '../utils/geo';

// Fix default marker icons (Leaflet + bundlers need manual URLs)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const HOME_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width:20px;height:20px;background:#e53e3e;border:3px solid white;
    border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface MapProps {
  center: Coordinates | null;
  festivals: Festival[];
  radiusKm: number;
  onFestivalClick: (festival: Festival) => void;
  selectedFestival: Festival | null;
}

export default function Map({
  center,
  festivals,
  radiusKm,
  onFestivalClick,
  selectedFestival,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const homeMarkerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [51.1657, 10.4515], // Germany centre
      zoom: 6,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende',
      maxZoom: 18,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update home marker + radius circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (homeMarkerRef.current) {
      homeMarkerRef.current.remove();
      homeMarkerRef.current = null;
    }
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }

    if (center) {
      homeMarkerRef.current = L.marker([center.lat, center.lng], {
        icon: HOME_ICON,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup('<b>Dein Standort</b>');

      circleRef.current = L.circle([center.lat, center.lng], {
        radius: radiusKm * 1000,
        color: '#e53e3e',
        fillColor: '#e53e3e',
        fillOpacity: 0.06,
        weight: 2,
        dashArray: '6 4',
      }).addTo(map);

      map.flyTo([center.lat, center.lng], radiusKm > 200 ? 5 : radiusKm > 100 ? 6 : 7, {
        duration: 1.2,
      });
    }
  }, [center, radiusKm]);

  // Update festival markers
  useEffect(() => {
    const group = markersRef.current;
    if (!group) return;

    group.clearLayers();

    festivals.forEach((festival) => {
      const isSelected = selectedFestival?.id === festival.id;
      const marker = L.marker([festival.lat, festival.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="
            width:${isSelected ? 18 : 14}px;
            height:${isSelected ? 18 : 14}px;
            background:${isSelected ? '#d97706' : '#4f46e5'};
            border:2px solid white;
            border-radius:50%;
            box-shadow:0 2px 4px rgba(0,0,0,0.3);
            cursor:pointer;
          "></div>`,
          iconSize: [isSelected ? 18 : 14, isSelected ? 18 : 14],
          iconAnchor: [isSelected ? 9 : 7, isSelected ? 9 : 7],
        }),
      });

      marker
        .bindPopup(
          `<div style="min-width:180px">
            <strong style="font-size:14px">${festival.name}</strong><br/>
            <span style="color:#555;font-size:12px">${festival.city}</span><br/>
            <span style="font-size:12px">📅 ${formatDate(festival.startDate)} – ${formatDate(festival.endDate)}</span><br/>
            <span style="font-size:12px">🎵 ${festival.genre.join(', ')}</span>
          </div>`,
          { maxWidth: 260 },
        )
        .on('click', () => onFestivalClick(festival));

      group.addLayer(marker);

      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [festivals, selectedFestival, onFestivalClick]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: 400 }}
    />
  );
}
