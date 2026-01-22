import React from 'react';

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
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
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
          <svg
            className={`h-5 w-5 ${showBounds ? 'text-white' : 'text-gray-500'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
          </svg>
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
          <svg
            className={`h-5 w-5 ${showLocationControl ? 'text-white' : 'text-gray-500'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
          </svg>
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
