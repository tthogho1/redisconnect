import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface DisableMapDragProps {
  disabled: boolean;
}

export function DisableMapDrag({ disabled }: DisableMapDragProps) {
  const map = useMap();
  useEffect(() => {
    if (disabled) {
      map.dragging.disable();
    } else {
      map.dragging.enable();
    }
  }, [disabled, map]);
  return null;
}
