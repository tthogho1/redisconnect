import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface DisableMapDragProps {
  disabled: boolean;
}

export function DisableMapDrag({ disabled }: DisableMapDragProps) {
  const map = useMap();
  useEffect(() => {
<<<<<<< HEAD
=======
    if (!map) return;

    // Dragging
>>>>>>> 34edd2f (WIP: Temporary commit for ongoing work)
    if (disabled) {
      map.dragging.disable();
    } else {
      map.dragging.enable();
    }
<<<<<<< HEAD
  }, [disabled, map]);
=======

    // Scroll wheel zoom
    if (disabled) {
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      map.boxZoom.disable();
      map.touchZoom.disable();
    } else {
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
      map.touchZoom.enable();
    }
  }, [disabled, map]);

>>>>>>> 34edd2f (WIP: Temporary commit for ongoing work)
  return null;
}
