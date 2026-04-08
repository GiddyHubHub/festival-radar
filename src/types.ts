export interface Festival {
  id: number;
  name: string;
  location: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  startDate: string;
  endDate: string;
  genre: string[];
  website?: string;
  description: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface FilterState {
  radiusKm: number;
  weeksAhead: number;
}
