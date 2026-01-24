import { useEffect, useRef } from 'react';
import { useMapEvents } from 'react-leaflet';
import { MapBounds } from '../../types/map';

interface MapBoundsTrackerProps {
  onBoundsChange: (bounds: MapBounds) => void;
}

/**
 * Debounced MapBoundsTracker
 * - Debounces moveend/zoomend to avoid rapid repeated updates
 * - Emits initial bounds once map is ready
 */
export function MapBoundsTracker({ onBoundsChange }: MapBoundsTrackerProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // register handlers — handlers will run later so using map here is safe
  const map = useMapEvents({
    moveend: () => {
      if (!map) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const bounds = map.getBounds();
        const center = map.getCenter();
        const zoom = map.getZoom();
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
          center: { lat: center.lat, lng: center.lng },
          zoom,
        });
      }, 300);
    },
    zoomend: () => {
      if (!map) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const bounds = map.getBounds();
        const center = map.getCenter();
        const zoom = map.getZoom();
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
          center: { lat: center.lat, lng: center.lng },
          zoom,
        });
      }, 300);
    },
  });

  // initial bounds once map is available
  useEffect(() => {
    if (!map) return;
    const bounds = map.getBounds();
    const center = map.getCenter();
    const zoom = map.getZoom();
    onBoundsChange({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
      center: { lat: center.lat, lng: center.lng },
      zoom,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return null;
}
