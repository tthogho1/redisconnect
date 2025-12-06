import L from 'leaflet';

// Color palette for different users
export const USER_COLORS = [
  '#FF5733', // Red-Orange
  '#33FF57', // Green
  '#3357FF', // Blue
  '#FF33F5', // Pink
  '#F5FF33', // Yellow
  '#33F5FF', // Cyan
  '#FF8C33', // Orange
  '#8C33FF', // Purple
  '#33FF8C', // Mint
  '#FF3333', // Red
];

// HIGMAアイコン用のURLを.envから取得
const HIGMA_ICON_URL = process.env.REACT_APP_HIGMA_ICON_PATH || '/channels4_profile.jpg';

/**
 * Create custom colored icon for map markers
 */
export const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 14px;
      ">📍</div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

/**
 * Get user icon by index or special icon for HIGMA
 */
export const getUserIcon = (userId: string, index: number) => {
  if (userId === 'HIGMA') {
    return L.icon({
      iconUrl: HIGMA_ICON_URL,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });
  }
  const color = USER_COLORS[index % USER_COLORS.length];
  return createColoredIcon(color);
};
