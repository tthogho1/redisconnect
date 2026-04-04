import React, { useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { Header } from './components/Header/Header';
import { VideoCallPopup } from './components/VideoCall/VideoCallPopup';

import {
  MapBoundsTracker,
  MapBoundsDisplay,
  MapCenterController,
  UserMarkers,
  AirportMarkers,
  CurrentLocationMarker,
  LandmarkMarkers,
  DisableMapDrag,
  LandmarkListOverlay,
  RouteLayer,
  MapClickHandler,
  SetPointMarker,
} from './components/Map';

import { ChatWindow } from './components/Chat';
import { LocationControl } from './components/LocationControl';
import { DEFAULT_POSITION } from './utils/locationUtils';
import { useWebSocket, useLocationTracking, useChat, useAirports, useLandmarks } from './hooks';
import { LandmarkSettings, Landmark } from './types/landmark';
import { summarizeLandmarks, SummarizeResponseItem } from './services/summarizeClient';

const SIGNALING_URL = process.env.REACT_APP_SIGNALING_URL || 'ws://localhost:8080/ws';

function App() {
  const [userName, setUserName] = useState<string>('');
  const [intervalSeconds, setIntervalSeconds] = useState<number>(5);
  const [showVideoCall, setShowVideoCall] = useState<boolean>(false);
  const [showBounds, setShowBounds] = useState<boolean>(false);
  const [showLocationControl, setShowLocationControl] = useState<boolean>(true);
  const [targetMapCenter, setTargetMapCenter] = useState<{ lat: number; lon: number } | null>(null);
  const [landmarkSettings, setLandmarkSettings] = useState<LandmarkSettings>({
    radius: 10000,
    limit: 10,
  });
  const [showChat, setShowChat] = useState<boolean>(false);
  const userNameRef = useRef<string>('');

  // Update userNameRef when userName changes
  React.useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  // Custom hooks for managing different concerns
  const { socket, connected, users, chatMessages, addChatMessage } = useWebSocket(userNameRef);
  // Airport filters state: Large, Middle, Small, Heliport
  const [airportFilters, setAirportFilters] = useState<{ large: boolean; middle: boolean; small: boolean; heliport: boolean }>({
    large: true,
    middle: true,
    small: true,
    heliport: true,
  });

  const airportTypes = React.useMemo(() => {
    const types: string[] = [];
    if (airportFilters.large) types.push('large_airport');
    if (airportFilters.middle) types.push('medium_airport');
    if (airportFilters.small) types.push('small_airport');
    if (airportFilters.heliport) types.push('heliport');
    return types;
  }, [airportFilters]);

  const { airports, mapBounds, setMapBounds } = useAirports(airportTypes);
  const { landmarks, isLoading: isLandmarksLoading } = useLandmarks(mapBounds, landmarkSettings);
  const [showLandmarkList, setShowLandmarkList] = useState<boolean>(false);
  const [selectedLandmarkIds, setSelectedLandmarkIds] = useState<number[]>([]);
  const [setPoint, setSetPoint] = useState<{ lat: number; lon: number; name?: string } | null>(null);
  const [routeCoords, setRouteCoords] = useState<Array<{ lat: number; lon: number }>>([]);
  const [summaries, setSummaries] = useState<SummarizeResponseItem[] | null>(null);
  const [summarizing, setSummarizing] = useState<boolean>(false);
  const { currentLocation, initialMapCenter, handleStartTracking, handleStopTracking } =
    useLocationTracking({
      userName,
      socket,
      intervalSeconds,
    });

  // Chat hook
  const {
    chatInput,
    setChatInput,
    selectedUser,
    setSelectedUser,
    handleSendMessage,
  } = useChat({
    socket,
    userName,
    addChatMessage,
  });

  // Merge manual set point into landmarks so it appears in markers and list
  const allLandmarks = useMemo(() => {
    if (!setPoint) return landmarks;
    const manual: Landmark = {
      pageId: -1,
      title: setPoint.name || 'Set Point',
      lat: setPoint.lat,
      lon: setPoint.lon,
    };
    return [manual, ...landmarks];
  }, [setPoint, landmarks]);

  return (
    <div className="App font-sans min-h-screen flex flex-col bg-gray-50">
      <Header
        connected={connected}
        userCount={users.length}
        airportCount={airports.length}
        showBounds={showBounds}
        onToggleBounds={() => setShowBounds(!showBounds)}
        showLocationControl={showLocationControl}
        onToggleLocationControl={() => setShowLocationControl(!showLocationControl)}
        onAirportFilterChange={(filters: { large: boolean; middle: boolean; small: boolean; heliport: boolean }) => {
          setAirportFilters(filters);
        }}
      />

      <main className="flex-1 p-5 max-w-[1920px] mx-auto w-full relative">
        {/* Map Bounds Display */}
        {showBounds && (
          <MapBoundsDisplay
            bounds={mapBounds}
            landmarkSettings={landmarkSettings}
            onLandmarkSettingsChange={setLandmarkSettings}
            onLocationSelect={(lat, lon) => setTargetMapCenter({ lat, lon })}
          />
        )}

        {/* Location Tracking Control */}
        {showLocationControl && (
          <LocationControl
            userName={userName}
            onUserNameChange={setUserName}
            intervalSeconds={intervalSeconds}
            onIntervalChange={setIntervalSeconds}
            currentLocation={currentLocation}
            onStartTracking={handleStartTracking}
            onStopTracking={handleStopTracking}
          />
        )}

        <div className="relative">
          <MapContainer
            center={DEFAULT_POSITION}
            zoom={13}
            style={{ height: '100vh', width: '100%' }}
          >
            <DisableMapDrag disabled={isLandmarksLoading || showLandmarkList} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapBoundsTracker onBoundsChange={setMapBounds} />
            <MapCenterController center={targetMapCenter || initialMapCenter} zoom={15} />
            <CurrentLocationMarker currentLocation={currentLocation} userName={userName} />
            <UserMarkers users={users.filter(u => u.id !== userName)} />
            <AirportMarkers airports={airports} />
            <LandmarkMarkers landmarks={allLandmarks} />
            <RouteLayer route={routeCoords} />
            <MapClickHandler
              onSetPoint={(lat, lng, name) => {
                // Do not call external routing services — set the map center and store the point locally
                setRouteCoords([]);
                const point = { lat, lon: lng, name: name || undefined };
                setSetPoint(point);
                setTargetMapCenter(point);
              }}
            />
            <SetPointMarker
              point={setPoint}
              onClear={() => setSetPoint(null)}
              onRename={(name) => {
                setSetPoint((p) => (p ? { ...p, name } : p));
              }}
            />
          </MapContainer>

          {/* Move to Current Location Button */}
          {currentLocation && (
            <button
              className="absolute top-4 right-4 z-[1000] bg-white/30 hover:bg-white/50 backdrop-blur-md text-gray-800 p-3 rounded-full border border-white/40 shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                if (currentLocation) {
                  setTargetMapCenter({ ...currentLocation });
                }
              }}
              title="Move to Current Location"
              disabled={!currentLocation}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
            </button>
          )}

          {/* Landmark List Button - always visible */}
          <button
            className="absolute top-20 right-4 z-[1000] bg-white/30 hover:bg-white/50 backdrop-blur-md text-gray-800 p-3 rounded-full border border-white/40 shadow-lg transition-all duration-300 transform hover:scale-105"
            onClick={() => setShowLandmarkList(true)}
            title="Show Landmarks"
          >
            📍
          </button>

          {/* Landmark list overlay */}
          <LandmarkListOverlay
            isOpen={showLandmarkList}
            landmarks={allLandmarks}
            selectedIds={selectedLandmarkIds}
            onChange={setSelectedLandmarkIds}
            onClose={() => setShowLandmarkList(false)}
            onRouteReady={async (points: Array<{ lat: number; lon: number }>, vehicle: 'car' | 'bike' | 'foot') => {
              try {
                const { getRoute } = await import('./services/graphhopperClient');
                const route = await getRoute(points, vehicle);
                setRouteCoords(route);
                // Close overlay after drawing route
                setShowLandmarkList(false);
              } catch (err: any) {
                console.error('Route error', err);
                alert(err?.message || String(err));
              }
            }}
            onSummarize={async (landmarks, selectedIds) => {
              setSummarizing(true);
              try {
                const results = await summarizeLandmarks(landmarks, selectedIds);
                setSummaries(results);
              } catch (e: any) {
                alert(e.message || 'Summarize failed');
              } finally {
                setSummarizing(false);
              }
            }}
            summarizing={summarizing}
          />
        </div>

        {/* Chat Toggle Button */}
        {currentLocation && (
          <button
            onClick={() => setShowChat(!showChat)}
            className="fixed bottom-5 right-5 px-6 py-4 bg-blue-500 text-white rounded-full cursor-pointer shadow-lg text-base font-bold hover:bg-blue-600 z-[1000]"
          >
            💬 {showChat ? 'Hide Chat' : 'Show Chat'}
          </button>
        )}

        {/* Video Call Toggle Button */}
        {currentLocation && (
          <button
            onClick={() => setShowVideoCall(!showVideoCall)}
            className="fixed bottom-5 right-[200px] px-6 py-4 bg-green-500 text-white rounded-full cursor-pointer shadow-lg text-base font-bold hover:bg-green-600 z-[1000]"
          >
            📹 {showVideoCall ? 'Hide Video' : 'Video Call'}
          </button>
        )}

        {/* Summary Modal - Centered on map */}
        {summaries && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 z-[1500]"
              onClick={() => setSummaries(null)}
            />
            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-[1600] pointer-events-none">
              <div className="bg-white rounded-lg shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col pointer-events-auto relative mx-4">
                <button
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl leading-none"
                  onClick={() => setSummaries(null)}
                >
                  ✕
                </button>
                <h2 className="text-xl font-bold mb-4 text-gray-800">Landmark Summaries</h2>
                <div className="space-y-4 overflow-auto flex-1">
                  {summaries.map((s) => (
                    <div key={s.url} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition">
                      <p className="font-semibold text-sm text-blue-600 truncate mb-2">
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {s.url}
                        </a>
                      </p>
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{s.summary}</p>
                      <p className="mt-2 text-xs text-gray-500">
                        {s.token_count} / {s.target_tokens} tokens
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Chat Window */}
        {showChat && currentLocation && (
          <ChatWindow
            messages={chatMessages}
            chatInput={chatInput}
            onInputChange={setChatInput}
            onSendMessage={handleSendMessage}
            selectedUser={selectedUser}
            onUserSelect={setSelectedUser}
            users={users}
            currentUserName={userName}
          />
        )}

        {/* Video Call Popup */}
        {showVideoCall && currentLocation && (
          <VideoCallPopup
            wsUrl={SIGNALING_URL}
            defaultRoomId={userName || 'default-room'}
            onClose={() => setShowVideoCall(false)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
