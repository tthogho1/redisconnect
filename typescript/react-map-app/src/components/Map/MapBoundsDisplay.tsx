import React, { useState } from 'react';
import { MapBounds } from '../../types/map';
import { LandmarkSettings } from '../../types/landmark';
import { GeocodingResult } from '../../types/geocoding';
import { searchLocation } from '../../services/nominatimClient';

interface MapBoundsDisplayProps {
  bounds: MapBounds | null;
  landmarkSettings: LandmarkSettings;
  onLandmarkSettingsChange: (settings: LandmarkSettings) => void;
  onLocationSelect: (lat: number, lon: number) => void;
}

/**
 * Display component for showing current map bounds
 * Shows north, south, east, west coordinates, center position, and zoom level
 * Also allows configuration of landmark search settings and geocoding
 */
export function MapBoundsDisplay({
  bounds,
  landmarkSettings,
  onLandmarkSettingsChange,
  onLocationSelect,
}: MapBoundsDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLandmarkSettingsExpanded, setIsLandmarkSettingsExpanded] = useState(false);
  const [isGeocodingExpanded, setIsGeocodingExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  if (!bounds) {
    return null;
  }

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Math.max(Number(e.target.value), 1000), 100000);
    console.log('MapBoundsDisplay: radius changed ->', value);
    onLandmarkSettingsChange({ ...landmarkSettings, radius: value });
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Math.max(Number(e.target.value), 1), 200);
    console.log('MapBoundsDisplay: limit changed ->', value);
    onLandmarkSettingsChange({ ...landmarkSettings, limit: value });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchLocation(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleResultClick = (result: GeocodingResult) => {
    onLocationSelect(result.lat, result.lon);
    setSearchResults([]);
    setSearchQuery('');
  };

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

      {/* Location Search (Geocoding) */}
      <div className="mt-3 border-t border-blue-200 pt-3">
        <div
          onClick={() => setIsGeocodingExpanded(!isGeocodingExpanded)}
          className="cursor-pointer flex items-center font-semibold text-gray-700 hover:text-blue-600"
        >
          <span className="mr-2 text-blue-500">{isGeocodingExpanded ? '▼' : '▶'}</span>
          <span className="mr-1.5">🔍</span>
          Location Search
        </div>
        {isGeocodingExpanded && (
          <div className="mt-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search place, address, country..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isSearching ? '...' : 'Search'}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white border border-gray-200 rounded max-h-48 overflow-y-auto">
                {searchResults.map(result => (
                  <div
                    key={result.placeId}
                    onClick={() => handleResultClick(result)}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-700 text-sm truncate">
                      {result.displayName.split(',')[0]}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{result.displayName}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Landmark Settings */}
      <div className="mt-3 border-t border-blue-200 pt-3">
        <div
          onClick={() => setIsLandmarkSettingsExpanded(!isLandmarkSettingsExpanded)}
          className="cursor-pointer flex items-center font-semibold text-gray-700 hover:text-blue-600"
        >
          <span className="mr-2 text-blue-500">{isLandmarkSettingsExpanded ? '▼' : '▶'}</span>
          <span className="mr-1.5">🏛️</span>
          Landmark Settings
        </div>
        {isLandmarkSettingsExpanded && (
          <div className="mt-3 grid grid-cols-1 gap-3 text-gray-600">
            <div className="bg-white px-3 py-2 rounded">
              <label className="block font-medium mb-1">
                Search Radius:{' '}
                {landmarkSettings.radius >= 1000
                  ? `${(landmarkSettings.radius / 1000).toFixed(1)}km`
                  : `${landmarkSettings.radius}m`}
              </label>
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={landmarkSettings.radius}
                onChange={handleRadiusChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>1km</span>
                <span>100km</span>
              </div>
            </div>
            <div className="bg-white px-3 py-2 rounded">
              <label className="block font-medium mb-1">
                Max Results: {landmarkSettings.limit}
              </label>
              <input
                type="range"
                min="1"
                max="200"
                step="5"
                value={landmarkSettings.limit}
                onChange={handleLimitChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>1</span>
                <span>200</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
