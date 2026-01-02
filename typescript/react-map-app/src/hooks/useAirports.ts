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
export function useAirports(): UseAirportsReturn {
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [airports, setAirports] = useState<Airport[]>([]);

  // Fetch airports when map bounds change
  useEffect(() => {
    if (mapBounds) {
      const fetchAirports = async () => {
        const airportsData = await fetchAirportsInBounds({
          minLat: mapBounds.south,
          maxLat: mapBounds.north,
          minLon: mapBounds.west,
          maxLon: mapBounds.east,
        });
        console.log('Fetched airports:', airportsData.length);
        setAirports(airportsData);
      };

      fetchAirports();
    }
  }, [mapBounds]);

  return {
    airports,
    mapBounds,
    setMapBounds,
  };
}
