import L from 'leaflet';

export const setPointIcon = L.divIcon({
  className: 'set-point-div-icon',
  html: `
    <div style="width:28px;height:28px;border-radius:50%;background:#ef4444;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:block;margin:0 auto"></div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -28],
});
