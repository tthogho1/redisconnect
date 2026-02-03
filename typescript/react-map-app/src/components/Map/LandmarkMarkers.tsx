import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Landmark } from '../../types/landmark';
import { createLandmarkIcon } from '../../utils/landmarkIcons';
import { fetchLandmarkDetails } from '../../services/wikimediaClient';

interface LandmarkMarkersProps {
  landmarks: Landmark[];
}

export const LandmarkMarkers: React.FC<LandmarkMarkersProps> = ({ landmarks }) => {
  const [detailsMap, setDetailsMap] = useState<Record<number, Partial<Landmark>>>({});
  const [fadingOutIds, setFadingOutIds] = useState<Set<number>>(new Set());
  const [displayedLandmarks, setDisplayedLandmarks] = useState<Landmark[]>([]);
  const prevLandmarksRef = useRef<Landmark[]>([]);

  // Detect removed landmarks and trigger fade-out animation
  useEffect(() => {
    const currentIds = new Set(landmarks.map((l) => l.pageId));
    const prevIds = new Set(prevLandmarksRef.current.map((l) => l.pageId));

    // Find landmarks that were removed
    const removedIds = new Set<number>();
    prevIds.forEach((id) => {
      if (!currentIds.has(id)) {
        removedIds.add(id);
      }
    });

    if (removedIds.size > 0) {
      // Start fade-out animation for removed landmarks
      setFadingOutIds(removedIds);

      // After animation completes (500ms), remove from displayed list
      setTimeout(() => {
        setDisplayedLandmarks(landmarks);
        setFadingOutIds(new Set());
      }, 500);
    } else {
      // No fade-out needed, update immediately
      setDisplayedLandmarks(landmarks);
    }

    prevLandmarksRef.current = landmarks;
  }, [landmarks]);

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
      {displayedLandmarks.map((landmark, index) => {
        const details = detailsMap[landmark.pageId] || {};
        const thumbnailUrl = details.thumbnailUrl ?? landmark.thumbnailUrl ?? null;
        const isFadingOut = fadingOutIds.has(landmark.pageId);

        return (
          <Marker
            key={`landmark-${landmark.pageId}`}
            position={[landmark.lat, landmark.lon]}
            icon={createLandmarkIcon(thumbnailUrl, index + 1)}
            opacity={isFadingOut ? 0 : 1}
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
