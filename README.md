# 🎪 Festival Radar

Eine interaktive Webanwendung, mit der du Musikfestivals in deiner Nähe entdecken kannst. Gib einfach deine Postleitzahl ein und sieh auf der Karte, welche Festivals im gewünschten Umkreis stattfinden.

![Festival Radar Screenshot](https://github.com/user-attachments/assets/1ad9d62e-5259-48a8-ba70-23b309671ca9)

## Features

- **📍 Standortsuche per PLZ** – Gib deine Postleitzahl ein; die Karte springt direkt auf deinen Standort (Geocoding via OpenStreetMap Nominatim)
- **🗺️ Interaktive Karte** – Alle Festivals werden als Marker auf einer Leaflet-Karte angezeigt; ein Radius-Kreis visualisiert den Suchbereich
- **⚙️ Filter-Optionen** – Klappbares Filter-Menü mit:
  - Radius-Schieberegler + Schnellauswahl (25 – 500 km)
  - Zeitraum-Filter (nächste 2 Wochen bis 1 Jahr)
- **📋 Festival-Liste** – Ergebnisse sortiert nach Entfernung und Datum mit Distanz-Badge, Countdown, Genre-Tags und Website-Link
- **📱 Responsiv** – Optimiert für Desktop (Karte + Seitenspalte) und Mobile (gestapeltes Layout)

## Datensatz

Die App enthält 25 echte deutsche Musikfestivals (Rock am Ring, Wacken Open Air, Hurricane, Lollapalooza Berlin, Melt!, Fusion, Nature One u.v.m.).

## Tech Stack

| Technologie | Version |
|---|---|
| React | 19 |
| TypeScript | 6 |
| Vite | 8 |
| Leaflet | 1.9 |

## Lokale Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Produktions-Build erstellen
npm run build

# Lint prüfen
npm run lint
```

Der Dev-Server läuft dann unter `http://localhost:5173`.

## Projektstruktur

```
src/
├── components/
│   ├── Map.tsx          # Leaflet-Karte mit Markern und Radius-Kreis
│   ├── FilterPanel.tsx  # Filter-Optionen (Radius + Zeitraum)
│   └── FestivalList.tsx # Festival-Karten-Liste
├── data/
│   └── festivals.ts     # Datensatz mit 25 deutschen Festivals
├── utils/
│   └── geo.ts           # Haversine-Formel, PLZ-Geocoding, Datumshelfer
├── types.ts             # TypeScript-Typen
├── App.tsx              # Haupt-Komponente
└── App.css              # Styles
```
