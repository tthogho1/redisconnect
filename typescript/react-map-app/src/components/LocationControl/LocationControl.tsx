import React, { useState } from 'react';

interface LocationControlProps {
  userName: string;
  onUserNameChange: (name: string) => void;
  intervalSeconds: number;
  onIntervalChange: (seconds: number) => void;
  currentLocation: { lat: number; lon: number } | null;
  onStartTracking: () => void;
  onStopTracking: () => void;
}

/**
 * Location tracking control panel
 */
export function LocationControl({
  userName,
  onUserNameChange,
  intervalSeconds,
  onIntervalChange,
  currentLocation,
  onStartTracking,
  onStopTracking,
}: LocationControlProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-5 p-4 bg-gray-100 rounded-lg">
      <h3
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer flex items-center m-0 font-bold text-lg"
      >
        <span className="mr-2">{isExpanded ? '▼' : '▶'}</span>
        Location Tracking Control
      </h3>
      {isExpanded && (
        <div className="mt-4">
          <div className="mb-2.5">
            <label>
              Your Name:
              <input
                type="text"
                value={userName}
                onChange={e => onUserNameChange(e.target.value)}
                placeholder="Enter your name"
                className="ml-2.5 p-1.5 border border-gray-300 rounded"
              />
            </label>
          </div>
          <div className="mb-2.5">
            <label>
              Update Interval (seconds):
              <input
                type="number"
                value={intervalSeconds}
                onChange={e => onIntervalChange(Number(e.target.value))}
                min="1"
                max="60"
                className="ml-2.5 p-1.5 w-16 border border-gray-300 rounded"
              />
            </label>
          </div>
          <div>
            {!currentLocation ? (
              <button
                onClick={onStartTracking}
                className="px-5 py-2.5 bg-green-500 text-white border-none rounded cursor-pointer hover:bg-green-600"
              >
                Start Tracking
              </button>
            ) : (
              <button
                onClick={onStopTracking}
                className="px-5 py-2.5 bg-red-500 text-white border-none rounded cursor-pointer hover:bg-red-600"
              >
                Stop Tracking
              </button>
            )}
            {currentLocation && (
              <span className="ml-4 text-green-500">
                📍 Tracking active (Lat: {currentLocation.lat.toFixed(4)}, Lon:{' '}
                {currentLocation.lon.toFixed(4)})
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
