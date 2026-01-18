// Geocoding type definitions for Nominatim API

export interface GeocodingResult {
  placeId: number;
  lat: number;
  lon: number;
  displayName: string;
  type: string;
  importance: number;
  boundingBox: [string, string, string, string]; // [south, north, west, east]
}

export interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  boundingbox: [string, string, string, string];
}
