import L from 'leaflet';
import { useMapEvents } from 'react-leaflet';

interface MapClickHandlerProps {
  onSetPoint?: (lat: number, lng: number, name?: string) => void;
}

export function MapClickHandler({ onSetPoint }: MapClickHandlerProps) {
  const map = useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;

      const container = L.DomUtil.create('div');
      // Build popup content with an input for name and a Set button
      container.innerHTML = `
        <div style="font-family: sans-serif; min-width: 220px;">
          <div style="font-weight: bold; margin-bottom: 6px; font-size: 14px;">📍 Clicked Location</div>
          <div style="font-size: 13px; color: #333; margin-bottom: 8px;">
            <div><b>Lat:</b> ${lat.toFixed(6)}</div>
            <div><b>Lng:</b> ${lng.toFixed(6)}</div>
          </div>
          <input placeholder="Name this point" style="width:100%;padding:8px;border-radius:6px;border:1px solid #ddd;box-sizing:border-box;margin-bottom:8px" />
        </div>
      `;

      // Prevent map interactions while interacting with popup
      L.DomEvent.disableClickPropagation(container);

      const input = container.querySelector('input') as HTMLInputElement;

      const btn = L.DomUtil.create('button', '', container);
      btn.innerHTML = 'Set Point';
      btn.style.cssText =
        'width:100%;padding:8px 12px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;transition:background .2s;';
      btn.onmouseenter = () => { btn.style.background = '#2563eb'; };
      btn.onmouseleave = () => { btn.style.background = '#3b82f6'; };

      L.DomEvent.on(btn, 'click', (ev) => {
        L.DomEvent.stopPropagation(ev);
        const name = input?.value?.trim();
        map.closePopup();
        onSetPoint?.(lat, lng, name);
      });

      L.popup()
        .setLatLng(e.latlng)
        .setContent(container)
        .openOn(map);
    },
  });
  return null;
}
