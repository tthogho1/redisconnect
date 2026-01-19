import { useEffect, useState } from 'react';
import { MapBounds } from '../types/map';
import { Landmark, LandmarkSettings } from '../types/landmark';
import { fetchLandmarksNearby } from '../services/wikimediaClient';

interface UseLandmarksReturn {
  landmarks: Landmark[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for fetching and managing landmarks based on map bounds
 * Uses CirrusSearch API which supports larger search areas than the 10km limit of geosearch
 * Triggered at the same time as airport fetching (on map move)
 */
export function useLandmarks(
  mapBounds: MapBounds | null,
  settings: LandmarkSettings = { radius: 50000, limit: 10 } // CirrusSearch supports larger radius
): UseLandmarksReturn {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch landmarks when map bounds change (same trigger as airports)
  useEffect(() => {
    if (mapBounds) {
      const fetchLandmarks = async () => {
        setIsLoading(true);
        setError(null);

        try {
          // Use map center for CirrusSearch with nearcoord
          const { lat, lng } = mapBounds.center;

          const landmarksData = await fetchLandmarksNearby({
            lat,
            lon: lng,
            radius: settings.radius,
            limit: settings.limit,
          });

          console.log('Fetched landmarks:', landmarksData.length);
          setLandmarks(landmarksData);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch landmarks';
          setError(errorMessage);
          console.error('Landmarks fetch error:', errorMessage);
        } finally {
          setIsLoading(false);
        }
      };

      fetchLandmarks();
    }
  }, [mapBounds, settings.radius, settings.limit]);

  return {
    landmarks,
    isLoading,
    error,
  };
}
