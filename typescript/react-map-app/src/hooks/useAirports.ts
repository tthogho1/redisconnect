import { useEffect, useState } from 'react';
import { MapBounds } from '../types/map';
import { Airport } from '../types/airport';
import { fetchAirportsInBounds } from '../services/hasuraClient';

interface UseAirportsReturn {
  airports: Airport[];
  mapBounds: MapBounds | null;
  setMapBounds: (bounds: MapBounds | null) => void;
}

/**
 * Custom hook for fetching and managing airports based on map bounds
 */
export function useAirports(airportTypes?: string[]): UseAirportsReturn {
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [airports, setAirports] = useState<Airport[]>([]);

  // Fetch airports when map bounds or filter types change
  // If no airport types selected, skip fetch and return empty
  useEffect(() => {
    if (!airportTypes || airportTypes.length === 0) {
      setAirports([]);
      return;
    }
    if (mapBounds) {
      const fetchAirports = async () => {
        const airportsData = await fetchAirportsInBounds(
          {
            minLat: mapBounds.south,
            maxLat: mapBounds.north,
            minLon: mapBounds.west,
            maxLon: mapBounds.east,
          },
          airportTypes
        );
        console.log('Fetched airports:', airportsData.length);
        setAirports(airportsData);
      };

      fetchAirports();
    }
  }, [mapBounds, JSON.stringify(airportTypes || [])]);

  return {
    airports,
    mapBounds,
    setMapBounds,
  };
}
