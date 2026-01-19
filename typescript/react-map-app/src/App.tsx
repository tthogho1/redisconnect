import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { FaRegDotCircle } from 'react-icons/fa';
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
} from './components/Map';
import { ChatWindow } from './components/Chat';
import { LocationControl } from './components/LocationControl';
import { DEFAULT_POSITION } from './utils/locationUtils';
import { useWebSocket, useLocationTracking, useChat, useAirports, useLandmarks } from './hooks';
import { LandmarkSettings } from './types/landmark';

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
  const userNameRef = useRef<string>('');

  // Update userNameRef when userName changes
  React.useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  // Custom hooks for managing different concerns
  const { socket, connected, users, chatMessages, addChatMessage } = useWebSocket(userNameRef);
  const { airports, mapBounds, setMapBounds } = useAirports();
  const { landmarks, isLoading: isLandmarksLoading } = useLandmarks(mapBounds, landmarkSettings);
  const { currentLocation, initialMapCenter, handleStartTracking, handleStopTracking } =
    useLocationTracking({
      userName,
      socket,
      intervalSeconds,
    });
  const {
    chatInput,
    setChatInput,
    selectedUser,
    setSelectedUser,
    showChat,
    setShowChat,
    handleSendMessage,
  } = useChat({
    userName,
    socket,
    addChatMessage,
  });

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
            style={{ height: '600px', width: '100%' }}
          >
            <DisableMapDrag disabled={isLandmarksLoading} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapBoundsTracker onBoundsChange={setMapBounds} />
            <MapCenterController center={targetMapCenter || initialMapCenter} zoom={15} />
            <CurrentLocationMarker currentLocation={currentLocation} userName={userName} />
            <UserMarkers users={users.filter(u => u.id !== userName)} />
            <AirportMarkers airports={airports} />
            <LandmarkMarkers landmarks={landmarks} />
          </MapContainer>

          {/* Move to Current Location Button */}
          {currentLocation && (
            <button
              className="absolute top-4 right-4 z-[1000] bg-white/30 hover:bg-white/50 backdrop-blur-md text-gray-800 p-3 rounded-full border border-white/40 shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                if (currentLocation) {
                  // Create a new object to trigger re-render even if same location
                  setTargetMapCenter({ ...currentLocation });
                  console.log('Moving map to current location:', currentLocation);
                } else {
                  console.log('No current location available');
                }
              }}
              title="Move to Current Location"
              disabled={!currentLocation}
            >
              <FaRegDotCircle className="w-6 h-6" />
            </button>
          )}
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
