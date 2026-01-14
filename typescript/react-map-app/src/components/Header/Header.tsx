import React from 'react';
import { FaGlobe, FaMap, FaLocationArrow } from 'react-icons/fa';

interface HeaderProps {
  connected: boolean;
  userCount: number;
  airportCount: number;
  showBounds: boolean;
  onToggleBounds: () => void;
  showLocationControl: boolean;
  onToggleLocationControl: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  connected,
  userCount,
  airportCount,
  showBounds,
  onToggleBounds,
  showLocationControl,
  onToggleLocationControl,
}) => {
  return (
    <header className="bg-gray-200 border-b border-gray-200 px-4 py-2 flex flex-wrap items-center justify-between sticky top-0 z-[2000] shadow-sm gap-y-2">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 text-white p-2 rounded-lg">
          <FaGlobe className="h-6 w-6" />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onToggleBounds}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
            showBounds
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          }`}
        >
          <FaMap className={showBounds ? 'text-white' : 'text-gray-500'} />
          Map Bounds
        </button>

        <button
          onClick={onToggleLocationControl}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
            showLocationControl
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          }`}
        >
          <FaLocationArrow className={showLocationControl ? 'text-white' : 'text-gray-500'} />
          Tracking
        </button>
      </div>

      <div className="flex items-center gap-4 w-full justify-end sm:w-auto sm:ml-6 mt-2 sm:mt-0">
        <div className="flex items-center gap-2">
          <span className={`flex h-3 w-3 relative`}>
            {connected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            ></span>
          </span>
          <span className={`text-sm font-medium ${connected ? 'text-green-700' : 'text-red-700'}`}>
            {connected ? 'System Online' : 'Disconnected'}
          </span>
        </div>

        <div className="h-6 w-px bg-gray-300"></div>

        <div className="flex gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <span>👥</span> <strong>{userCount}</strong>{' '}
            <span className="hidden sm:inline">Users</span>
          </span>
          <span className="flex items-center gap-1">
            <span>✈️</span> <strong>{airportCount}</strong>{' '}
            <span className="hidden sm:inline">Airports</span>
          </span>
        </div>
      </div>
    </header>
  );
};
