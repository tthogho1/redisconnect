import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Landmark } from '../../types/landmark';
import { createLandmarkIcon } from '../../utils/landmarkIcons';

interface LandmarkMarkersProps {
  landmarks: Landmark[];
}

export const LandmarkMarkers: React.FC<LandmarkMarkersProps> = ({ landmarks }) => {
  return (
    <>
      {landmarks.map(landmark => (
        <Marker
          key={`landmark-${landmark.pageId}`}
          position={[landmark.lat, landmark.lon]}
          icon={createLandmarkIcon(landmark.thumbnailUrl)}
        >
          <Popup>
            <div style={{ maxWidth: '200px' }}>
              <strong>📍 {landmark.title}</strong>
              {landmark.thumbnailUrl && (
                <div style={{ marginTop: '8px' }}>
                  <img
                    src={landmark.thumbnailUrl}
                    alt={landmark.title}
                    style={{
                      width: '100%',
                      maxHeight: '150px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              )}
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                Lat: {landmark.lat.toFixed(4)}, Lon: {landmark.lon.toFixed(4)}
              </div>
              <div style={{ marginTop: '4px' }}>
                <a
                  href={`https://en.wikipedia.org/wiki/${encodeURIComponent(landmark.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#3B82F6', fontSize: '12px' }}
                >
                  View on Wikipedia →
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};
