import { useEffect } from 'react';
import { useMapEvents } from 'react-leaflet';
import { MapBounds } from '../../types/map';

interface MapBoundsTrackerProps {
  onBoundsChange: (bounds: MapBounds) => void;
}

/**
 * Component to track map bounds and notify parent when bounds change
 * Tracks both map movement (pan) and zoom events
 */
export function MapBoundsTracker({ onBoundsChange }: MapBoundsTrackerProps) {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      const center = map.getCenter();
      const zoom = map.getZoom();

      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
        center: { lat: center.lat, lng: center.lng },
        zoom: zoom,
      });
    },
    zoomend: () => {
      const bounds = map.getBounds();
      const center = map.getCenter();
      const zoom = map.getZoom();

      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
        center: { lat: center.lat, lng: center.lng },
        zoom: zoom,
      });
    },
  });

  // Get initial bounds on mount
  useEffect(() => {
    const bounds = map.getBounds();
    const center = map.getCenter();
    const zoom = map.getZoom();

    onBoundsChange({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
      center: { lat: center.lat, lng: center.lng },
      zoom: zoom,
    });
  }, []);

  return null;
}
