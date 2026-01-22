import { useEffect, useState } from 'react';
import { MapBounds } from '../types/map';
import { Landmark, LandmarkSettings } from '../types/landmark';
<<<<<<< HEAD
import { searchLandmarksNearby } from '../services/wikimediaClient';
=======
import { fetchLandmarksInBounds } from '../services/hasuraClient';
>>>>>>> 34edd2f (WIP: Temporary commit for ongoing work)

interface UseLandmarksReturn {
  landmarks: Landmark[];
  isLoading: boolean;
<<<<<<< HEAD
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

          const landmarksData = await searchLandmarksNearby({
            lat,
            lon: lng,
            radius: settings.radius,
            limit: settings.limit,
          });

          console.log('Fetched landmarks (search-only):', landmarksData.length);
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
=======
}

export function useLandmarks(
  mapBounds: MapBounds | null,
  settings: LandmarkSettings
): UseLandmarksReturn {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (mapBounds) {
      setIsLoading(true);
      const fetchLandmarks = async () => {
        const landmarksData = await fetchLandmarksInBounds({
          minLat: mapBounds.south,
          maxLat: mapBounds.north,
          minLon: mapBounds.west,
          maxLon: mapBounds.east,
          settings,
        });
        setLandmarks(landmarksData);
        setIsLoading(false);
      };
      fetchLandmarks();
    }
  }, [mapBounds, settings]);
>>>>>>> 34edd2f (WIP: Temporary commit for ongoing work)

  return {
    landmarks,
    isLoading,
<<<<<<< HEAD
    error,
=======
>>>>>>> 34edd2f (WIP: Temporary commit for ongoing work)
  };
}
