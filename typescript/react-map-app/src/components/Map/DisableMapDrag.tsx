import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface DisableMapDragProps {
  disabled: boolean;
}

export function DisableMapDrag({ disabled }: DisableMapDragProps) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    // Dragging
    if (disabled) {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      map.boxZoom.disable();
      map.touchZoom.disable();
    } else {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
      map.touchZoom.enable();
    }
  }, [disabled, map]);
  return null;
}
