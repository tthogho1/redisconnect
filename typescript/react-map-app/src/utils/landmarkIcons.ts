import L from 'leaflet';

// Create numbered landmark icon
const createNumberedIconHtml = (number: number) => `
  <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="13" fill="#3B82F6" stroke="#1E40AF" stroke-width="1"/>
    <text x="14" y="19" font-family="Arial, sans-serif" font-size="${number >= 10 ? 11 : 14}" font-weight="bold" fill="white" text-anchor="middle">${number}</text>
  </svg>
`;

// Landmark with thumbnail icon (shows small image with number badge)
export const createLandmarkIcon = (thumbnailUrl: string | null, number?: number) => {
  const displayNumber = number ?? 0;
  
  if (thumbnailUrl) {
    // Create icon with thumbnail image and number badge
    return L.divIcon({
      html: `
        <div style="
          position: relative;
          width: 36px;
          height: 36px;
        ">
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
          <div style="
            position: absolute;
            top: -6px;
            right: -6px;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background-color: #3B82F6;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${displayNumber >= 10 ? '9px' : '11px'};
            font-weight: bold;
            color: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          ">${displayNumber}</div>
        </div>
      `,
      className: 'landmark-icon',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
    });
  }

  // Default icon with number
  return L.divIcon({
    html: createNumberedIconHtml(displayNumber),
    className: 'landmark-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};
