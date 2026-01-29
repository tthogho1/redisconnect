import { useCallback, useEffect, useState } from 'react';
import { MapBounds } from '../types/map';
import { Landmark, LandmarkSettings } from '../types/landmark';
import { searchLandmarksNearby } from '../services/wikimediaClient';

interface UseLandmarksReturn {
  landmarks: Landmark[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Check if a landmark is within the given map bounds
 */
function isLandmarkInBounds(landmark: Landmark, bounds: MapBounds): boolean {
  return (
    landmark.lat <= bounds.north &&
    landmark.lat >= bounds.south &&
    landmark.lon <= bounds.east &&
    landmark.lon >= bounds.west
  );
}

/**
 * Custom hook for managing landmarks with FIFO cache (100 item limit)
 * - Adds new landmarks without overwriting existing ones
 * - Removes duplicates by pageId
 * - Removes landmarks outside current map bounds
 * - Maintains max 100 items, removing oldest when limit exceeded
 */
function useLandmarkCache() {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);

  const updateLandmarks = useCallback((newData: Landmark[], currentBounds: MapBounds | null) => {
    setLandmarks((prev) => {
      // Step 1: Remove landmarks outside current bounds
      let filtered = prev;
      if (currentBounds) {
        filtered = prev.filter((landmark) => isLandmarkInBounds(landmark, currentBounds));
      }

      // Step 2: Add new landmarks (avoid duplicates)
      const existingIds = new Set(filtered.map((l) => l.pageId));
      const toAdd = newData.filter((l) => !existingIds.has(l.pageId));
      const combined = [...filtered, ...toAdd];

      // Step 3: Keep last 100 items (FIFO: remove oldest from front)
      return combined.slice(-100);
    });
  }, []);

  return { landmarks, updateLandmarks };
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
  const { landmarks, updateLandmarks } = useLandmarkCache();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch landmarks when map bounds change (same trigger as airports)
  useEffect(() => {
    console.log('useLandmarks effect:', { mapBounds, settings });
    if (mapBounds) {
      const fetchLandmarks = async () => {
        setIsLoading(true);
        setError(null);

        try {
          // Use map center for CirrusSearch with nearcoord
          const { lat, lng } = mapBounds.center;

          console.log('useLandmarks: fetching with', {
            lat,
            lon: lng,
            radius: settings.radius,
            limit: settings.limit,
          });

          const landmarksData = await searchLandmarksNearby({
            lat,
            lon: lng,
            radius: settings.radius,
            limit: settings.limit,
          });

          console.log('Fetched landmarks (search-only):', landmarksData.length);
          updateLandmarks(landmarksData, mapBounds);
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
  }, [mapBounds, settings.radius, settings.limit, updateLandmarks]);

  return {
    landmarks,
    isLoading,
    error,
  };
}
