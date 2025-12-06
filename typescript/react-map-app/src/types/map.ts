// Map-related type definitions

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  center: { lat: number; lng: number };
  zoom: number;
}
