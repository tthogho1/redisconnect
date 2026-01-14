import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Identify the current user with a distinct icon
const currentUserIcon = L.divIcon({
  className: 'current-user-icon',
  html: `
    <div style="
      background-color: #2563eb;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 10px rgba(37, 99, 235, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    ">
      👤
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
});

interface CurrentLocationMarkerProps {
  currentLocation: { lat: number; lon: number } | null;
  userName: string;
}

export const CurrentLocationMarker: React.FC<CurrentLocationMarkerProps> = ({
  currentLocation,
  userName,
}) => {
  if (!currentLocation) return null;

  return (
    <Marker
      position={[currentLocation.lat, currentLocation.lon]}
      icon={currentUserIcon}
      zIndexOffset={1000}
    >
      <Popup>
        <strong>{userName || 'You'}</strong>
        <br />
        <span className="text-blue-600 font-bold">Current Location</span>
        <br />
        Lat: {currentLocation.lat.toFixed(4)}, Lon: {currentLocation.lon.toFixed(4)}
      </Popup>
    </Marker>
  );
};
