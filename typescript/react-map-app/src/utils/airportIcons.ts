import L from 'leaflet';

// Large airport icon (red airplane)
const largeAirportIconHtml = `
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#DC2626" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
  </svg>
`;

// Small airport icon (blue airplane)
const smallAirportIconHtml = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#2563EB" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
  </svg>
`;

// Default airport icon (gray airplane)
const defaultAirportIconHtml = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#6B7280" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
  </svg>
`;

export const createAirportIcon = (type: string) => {
  let iconHtml: string;
  let iconSize: [number, number];
  let iconAnchor: [number, number];
  let popupAnchor: [number, number];

  if (type === 'large_airport') {
    iconHtml = largeAirportIconHtml;
    iconSize = [32, 32];
    iconAnchor = [16, 16];
    popupAnchor = [0, -16];
  } else if (type === 'small_airport') {
    iconHtml = smallAirportIconHtml;
    iconSize = [20, 20];
    iconAnchor = [10, 10];
    popupAnchor = [0, -10];
  } else {
    iconHtml = defaultAirportIconHtml;
    iconSize = [24, 24];
    iconAnchor = [12, 12];
    popupAnchor = [0, -12];
  }

  return L.divIcon({
    html: iconHtml,
    className: 'airport-icon',
    iconSize,
    iconAnchor,
    popupAnchor,
  });
};
