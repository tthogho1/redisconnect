import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapCenterControllerProps {
  center: { lat: number; lon: number } | null;
  zoom?: number;
}

/**
 * Component that updates map center when the center prop changes
 * Only moves the map once when center is set for the first time
 */
export const MapCenterController: React.FC<MapCenterControllerProps> = ({ center, zoom = 13 }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      console.log('Moving map to center:', center);
      map.setView([center.lat, center.lon], zoom);
    }
  }, [center, map, zoom]);

  return null;
};
