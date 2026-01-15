import React from 'react';

interface ConnectionPanelProps {
  roomId: string;
  setRoomId: (id: string) => void;
  status: string;
  isConnected: boolean;
  showConnectionPanel: boolean;
  setShowConnectionPanel: (v: boolean) => void;
  joinRoom: () => void;
  leaveRoom: () => void;
}

export function ConnectionPanel({
  roomId,
  setRoomId,
  status,
  isConnected,
  showConnectionPanel,
  setShowConnectionPanel,
  joinRoom,
  leaveRoom,
}: ConnectionPanelProps) {
  return (
    <div
      className={`transition-all duration-200 ${
        showConnectionPanel ? '' : 'opacity-60'
      } border rounded mb-6 ${showConnectionPanel ? 'bg-gray-50' : 'bg-gray-100'} shadow-sm`}
    >
      <h3
        style={{ userSelect: 'none' }}
        className="flex items-center cursor-pointer select-none text-base font-semibold px-4 py-2 border-b"
      >
        <span
          onClick={e => {
            e.stopPropagation();
            setShowConnectionPanel(!showConnectionPanel);
          }}
          className="mr-2 text-lg"
          aria-label="toggle connection panel"
          tabIndex={0}
          role="button"
        >
          {showConnectionPanel ? '▲' : '▼'}
        </span>
        接続設定
      </h3>
      {showConnectionPanel && (
        <div className="px-4 py-3">
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700">
              Room ID:{' '}
              <input
                type="text"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                className="border rounded px-2 py-1 w-72 focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={isConnected}
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 mb-2">{status}</p>
          {!isConnected ? (
            <button
              onClick={joinRoom}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded shadow"
            >
              接続開始
            </button>
          ) : (
            <button
              onClick={leaveRoom}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded shadow mt-2"
            >
              切断
            </button>
          )}
        </div>
      )}
    </div>
  );
}
