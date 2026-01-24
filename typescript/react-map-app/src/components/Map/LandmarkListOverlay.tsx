import React, { useEffect } from 'react';
import { Landmark } from '../../types/landmark';

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
}

export function LandmarkListOverlay({
  isOpen,
  landmarks,
  selectedIds,
  onChange,
  onClose,
  onRouteReady,
}: LandmarkListOverlayProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

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
        className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-[1200] flex flex-col"
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
              {landmarks.map(l => (
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
                    <span className="text-sm text-gray-800">{l.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-3 border-t space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="vehicle"
                  value="car"
                  checked={vehicle === 'car'}
                  onChange={() => setVehicle('car')}
                />
                <span>Car</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="vehicle"
                  value="bike"
                  checked={vehicle === 'bike'}
                  onChange={() => setVehicle('bike')}
                />
                <span>Bike</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="vehicle"
                  value="foot"
                  checked={vehicle === 'foot'}
                  onChange={() => setVehicle('foot')}
                />
                <span>Foot</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleCheckRoute}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Check Route
            </button>

            <button
              onClick={onClose}
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
