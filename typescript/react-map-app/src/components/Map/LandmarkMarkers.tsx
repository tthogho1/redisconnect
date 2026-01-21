import React, { useCallback, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Landmark } from '../../types/landmark';
import { createLandmarkIcon } from '../../utils/landmarkIcons';
import { fetchLandmarkDetails } from '../../services/wikimediaClient';

interface LandmarkMarkersProps {
  landmarks: Landmark[];
}

export const LandmarkMarkers: React.FC<LandmarkMarkersProps> = ({ landmarks }) => {
  const [detailsMap, setDetailsMap] = useState<Record<number, Partial<Landmark>>>({});

  const loadDetails = useCallback(
    async (pageId: number) => {
      if (detailsMap[pageId]) return; // cached
      const details = await fetchLandmarkDetails(pageId);
      if (details) setDetailsMap(prev => ({ ...prev, [pageId]: details }));
    },
    [detailsMap]
  );

  return (
    <>
      {landmarks.map(landmark => {
        const details = detailsMap[landmark.pageId] || {};
        const thumbnailUrl = details.thumbnailUrl ?? landmark.thumbnailUrl ?? null;

        return (
          <Marker
            key={`landmark-${landmark.pageId}`}
            position={[landmark.lat, landmark.lon]}
            icon={createLandmarkIcon(thumbnailUrl)}
          >
            <Popup
              eventHandlers={{
                add: () => {
                  loadDetails(landmark.pageId);
                },
              }}
            >
              <div style={{ maxWidth: '240px' }}>
                <strong>📍 {landmark.title}</strong>
                {thumbnailUrl && (
                  <div style={{ marginTop: '8px' }}>
                    <img
                      src={thumbnailUrl}
                      alt={landmark.title}
                      style={{
                        width: '100%',
                        maxHeight: '160px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                )}
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  Lat: {landmark.lat.toFixed(4)}, Lon: {landmark.lon.toFixed(4)}
                </div>
                {details.description && (
                  <div style={{ marginTop: '6px', fontSize: '13px', color: '#333' }}>
                    {details.description}
                  </div>
                )}
                <div style={{ marginTop: '8px' }}>
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
        );
      })}
    </>
  );
};
