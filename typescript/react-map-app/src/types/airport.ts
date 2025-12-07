export interface Airport {
  name: string;
  type: string;
  iata_code: string | null;
  icao_code: string | null;
  latitude_deg: number;
  longitude_deg: number;
  home_link: string | null;
}

export interface AirportsQueryVariables {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}
