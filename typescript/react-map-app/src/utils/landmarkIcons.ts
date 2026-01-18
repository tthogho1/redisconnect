import L from 'leaflet';

// Default landmark icon (Wikipedia logo style - blue circle with W)
const defaultLandmarkIconHtml = `
  <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="13" fill="#3B82F6" stroke="#1E40AF" stroke-width="1"/>
    <text x="14" y="19" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">W</text>
  </svg>
`;

// Landmark with thumbnail icon (shows small image)
export const createLandmarkIcon = (thumbnailUrl: string | null) => {
  if (thumbnailUrl) {
    // Create icon with thumbnail image
    return L.divIcon({
      html: `
        <div style="
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid #3B82F6;
          background-color: white;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ">
          <img 
            src="${thumbnailUrl}" 
            alt="landmark" 
            style="width: 100%; height: 100%; object-fit: cover;"
            onerror="this.style.display='none'"
          />
        </div>
      `,
      className: 'landmark-icon',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
    });
  }

  // Default icon without thumbnail
  return L.divIcon({
    html: defaultLandmarkIconHtml,
    className: 'landmark-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};
