# 🎪 Festival Radar

Eine statische Web-App, mit der du Festivals in deiner Nähe findest.

## Features

- **PLZ-Suche** – Gib deine Postleitzahl ein; die Koordinaten werden über die [Nominatim-API](https://nominatim.org) aufgelöst
- **Radius-Filter** – Schieberegler von 10 bis 500 km; der gewählte Umkreis wird auf der Karte als gestrichelter Kreis dargestellt
- **Zeitraum-Filter** – Von „Nächste 2 Wochen" bis „Nächstes Jahr"
- **Genre-Filter** – Einzelne Genres ein-/ausblenden oder alle auf einmal (de)aktivieren
- **Interaktive Karte** (Leaflet + OpenStreetMap) – Farbige Marker pro Genre, Popup mit Festival-Details
- **Festival-Karten** – Sortiert nach Entfernung; Klick zoomt die Karte auf das Festival

## Starten

Da es sich um eine reine Static-Site handelt, reicht ein lokaler HTTP-Server:

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .
```

Dann im Browser <http://localhost:8080> öffnen.

## Struktur

```
index.html          Haupt-HTML
css/style.css       Styles (dark theme, responsive)
js/festivals.js     Festival-Datensatz (2026)
js/app.js           Logik: Geocoding, Filter, Karte, Karten-Rendering
```

## Datenquelle

Festivalangaben sind Beispieldaten für die Saison 2026. Kartendaten © [OpenStreetMap](https://openstreetmap.org/copyright).
