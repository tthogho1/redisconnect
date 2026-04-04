import L from 'leaflet';

export const setPointIcon = L.divIcon({
  className: 'set-point-div-icon',
  html: `<div style="font-size:22px;line-height:22px">📍</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  popupAnchor: [0, -22],
});
