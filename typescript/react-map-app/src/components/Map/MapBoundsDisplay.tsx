import React, { useState } from 'react';
import { MapBounds } from '../../types/map';

interface MapBoundsDisplayProps {
  bounds: MapBounds | null;
}

/**
 * Display component for showing current map bounds
 * Shows north, south, east, west coordinates, center position, and zoom level
 */
export function MapBoundsDisplay({ bounds }: MapBoundsDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!bounds) {
    return null;
  }

  return (
    <div className="mb-2.5 p-3 bg-blue-50 rounded-md border border-blue-200 text-sm">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer flex items-center font-semibold text-gray-700 hover:text-blue-600"
      >
        <span className="mr-2 text-blue-500">{isExpanded ? '▼' : '▶'}</span>
        <span className="mr-1.5">📍</span>
        Map Bounds
      </div>
      {isExpanded && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-gray-600">
          <div className="bg-white px-2 py-1 rounded">
            <span className="font-medium">North:</span> {bounds.north.toFixed(6)}
          </div>
          <div className="bg-white px-2 py-1 rounded">
            <span className="font-medium">South:</span> {bounds.south.toFixed(6)}
          </div>
          <div className="bg-white px-2 py-1 rounded">
            <span className="font-medium">East:</span> {bounds.east.toFixed(6)}
          </div>
          <div className="bg-white px-2 py-1 rounded">
            <span className="font-medium">West:</span> {bounds.west.toFixed(6)}
          </div>
          <div className="bg-white px-2 py-1 rounded col-span-2">
            <span className="font-medium">Center:</span> {bounds.center.lat.toFixed(6)},{' '}
            {bounds.center.lng.toFixed(6)}
          </div>
          <div className="bg-white px-2 py-1 rounded col-span-2">
            <span className="font-medium">Zoom:</span> {bounds.zoom}
          </div>
        </div>
      )}
    </div>
  );
}
