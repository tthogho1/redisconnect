import React, { useEffect } from 'react';
import { Landmark } from '../../types/landmark';
import { LandmarkActionPanel } from './LandmarkActionPanel';

interface LandmarkListOverlayProps {
  isOpen: boolean;
  landmarks: Landmark[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  onClose: () => void;
  onRouteReady?: (
    coords: Array<{ lat: number; lon: number }>,
    vehicle: 'car' | 'bike' | 'foot'
  ) => void;
  onSummarize?: (landmarks: Landmark[], selectedIds: number[]) => void;
  summarizing?: boolean;
}

export function LandmarkListOverlay({
  isOpen,
  landmarks,
  selectedIds,
  onChange,
  onClose,
  onRouteReady,
  onSummarize,
  summarizing = false,
}: LandmarkListOverlayProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const [topOffset, setTopOffset] = React.useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    function updateOffset() {
      const header = document.querySelector('header');
      const h = header ? header.getBoundingClientRect().height : 0;
      setTopOffset(h);
    }

    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, [isOpen]);

  // Hook must be called unconditionally to satisfy rules-of-hooks
  const [vehicle, setVehicle] = React.useState<'car' | 'bike' | 'foot'>('car');

  if (!isOpen) return null;

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter(x => x !== id));
    else onChange([...selectedIds, id]);
  };

  const handleCheckRoute = async () => {
    // Collect selected landmarks coordinates
    const selected = landmarks.filter(l => selectedIds.includes(l.pageId));
    if (selected.length < 2) {
      alert('Please select at least two landmarks to check a route.');
      return;
    }

    const points = selected.map(l => ({ lat: l.lat, lon: l.lon }));
    // Call parent handler if provided
    if (onRouteReady) onRouteReady(points.concat(), vehicle);
  };

  return (
    <>
      <style>{`.landmark-list-scroll::-webkit-scrollbar{width:10px}.landmark-list-scroll::-webkit-scrollbar-track{background:transparent}.landmark-list-scroll::-webkit-scrollbar-thumb{background:rgba(107,114,128,0.6);border-radius:6px}.landmark-list-scroll{scrollbar-width:thin;scrollbar-color:rgba(107,114,128,0.6) transparent}`}</style>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-[1100]" onClick={() => onClose()} />

      {/* Right side panel */}
      <div
        className="fixed right-0 w-80 bg-white shadow-lg z-[1200] flex flex-col"
        style={{ top: topOffset ? `${topOffset}px` : undefined, height: topOffset ? `calc(100% - ${topOffset}px)` : '100%' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Landmarks</h3>
          <button
            aria-label="Close landmarks"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        </div>

        <div className="p-3 overflow-auto flex-1 landmark-list-scroll">
          {landmarks.length === 0 ? (
            <div className="text-sm text-gray-500">No landmarks</div>
          ) : (
            <ul className="space-y-2">
              {landmarks.map((l, index) => (
                <li
                  key={`lm-${l.pageId}`}
                  className="flex items-center"
                  data-lat={l.lat}
                  data-lon={l.lon}
                >
                  <label className="flex items-center cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(l.pageId)}
                      onChange={() => toggle(l.pageId)}
                      className="mr-3"
                    />
                    <span className="inline-flex items-center justify-center w-5 h-5 mr-2 text-xs font-bold text-white bg-blue-600 rounded-full">
                      {index + 1}
                    </span>
                    <a
                      href={`https://en.wikipedia.org/wiki/${encodeURIComponent(l.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {l.title}
                    </a>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <LandmarkActionPanel
          landmarks={landmarks}
          selectedIds={selectedIds}
          vehicle={vehicle}
          onVehicleChange={setVehicle}
          onCheckRoute={handleCheckRoute}
          onClose={onClose}
          onSummarize={onSummarize}
          summarizing={summarizing}
        />
      </div>
    </>
  );
}
