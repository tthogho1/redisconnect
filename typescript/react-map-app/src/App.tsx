import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { FaGlobe, FaMap, FaLocationArrow, FaRegDotCircle } from 'react-icons/fa';
import './App.css';
import { VideoCallPopup } from './components/VideoCall/VideoCallPopup';
import { MapBoundsTracker, MapBoundsDisplay, MapCenterController } from './components/Map';
import { ChatWindow } from './components/Chat';
import { LocationControl } from './components/LocationControl';
import { getUserIcon } from './utils/mapIcons';
import { createAirportIcon } from './utils/airportIcons';
import { DEFAULT_POSITION } from './utils/locationUtils';
import { useWebSocket, useLocationTracking, useChat, useAirports } from './hooks';

function App() {
  const [userName, setUserName] = useState<string>('');
  const [intervalSeconds, setIntervalSeconds] = useState<number>(5);
  const [showVideoCall, setShowVideoCall] = useState<boolean>(false);
  const [showBounds, setShowBounds] = useState<boolean>(false);
  const [showLocationControl, setShowLocationControl] = useState<boolean>(true);
  const userNameRef = useRef<string>('');

  // Update userNameRef when userName changes
  React.useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  // Custom hooks for managing different concerns
  const { socket, connected, users, chatMessages, addChatMessage } = useWebSocket(userNameRef);
  const { airports, mapBounds, setMapBounds } = useAirports();
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
      <header className="bg-gray-200 border-b border-gray-200 px-6 py-0 flex items-center justify-between sticky top-0 z-[2000] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <FaGlobe className="h-6 w-6" />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setShowBounds(!showBounds)}
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
            onClick={() => setShowLocationControl(!showLocationControl)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
              showLocationControl
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <FaLocationArrow className={showLocationControl ? 'text-white' : 'text-gray-500'} />
            Tracking
          </button>

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
            <span
              className={`text-sm font-medium ${connected ? 'text-green-700' : 'text-red-700'}`}
            >
              {connected ? 'System Online' : 'Disconnected'}
            </span>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          <div className="flex gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <span>👥</span> <strong>{users.length}</strong>{' '}
              <span className="hidden sm:inline">Users</span>
            </span>
            <span className="flex items-center gap-1">
              <span>✈️</span> <strong>{airports.length}</strong>{' '}
              <span className="hidden sm:inline">Airports</span>
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-5 max-w-[1920px] mx-auto w-full relative">
        {/* Map Bounds Display */}
        {showBounds && <MapBoundsDisplay bounds={mapBounds} />}

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
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapBoundsTracker onBoundsChange={setMapBounds} />
            <MapCenterController center={initialMapCenter} zoom={15} />
            {users.map((user, index) => (
              <Marker
                key={user.id}
                position={[user.latitude, user.longitude]}
                icon={getUserIcon(user.id, index)}
              >
                <Popup>
                  <strong>{user.name}</strong>
                  <br />
                  ID: {user.id}
                  <br />
                  Lat: {user.latitude.toFixed(4)}, Lon: {user.longitude.toFixed(4)}
                </Popup>
              </Marker>
            ))}
            {airports.map((airport, index) => (
              <Marker
                key={`airport-${index}`}
                position={[airport.latitude_deg, airport.longitude_deg]}
                icon={createAirportIcon(airport.type)}
              >
                <Popup>
                  <strong>✈️ {airport.name}</strong>
                  <br />
                  Type: {airport.type}
                  <br />
                  {airport.iata_code && (
                    <>
                      IATA: {airport.iata_code}
                      <br />
                    </>
                  )}
                  {airport.icao_code && (
                    <>
                      ICAO: {airport.icao_code}
                      <br />
                    </>
                  )}
                  Lat: {airport.latitude_deg.toFixed(4)}, Lon: {airport.longitude_deg.toFixed(4)}
                  {airport.home_link && (
                    <>
                      <br />
                      <a href={airport.home_link} target="_blank" rel="noopener noreferrer">
                        Website
                      </a>
                    </>
                  )}
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Transparent Overlay Button */}
          <button
            className="absolute top-4 right-4 z-[1000] bg-white/30 hover:bg-white/50 backdrop-blur-md text-gray-800 p-3 rounded-full border border-white/40 shadow-lg transition-all duration-300 transform hover:scale-105"
            onClick={() => console.log('Circle button clicked')}
            title="Action Button"
          >
            <FaRegDotCircle className="w-6 h-6" />
          </button>
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
        {showVideoCall &&
          currentLocation &&
          (() => {
            const signalingUrl = process.env.REACT_APP_SIGNALING_URL || 'ws://localhost:8080/ws';
            console.log('📹 Connecting to WebRTC signaling server:', signalingUrl);
            return (
              <VideoCallPopup
                wsUrl={signalingUrl}
                defaultRoomId={userName || 'default-room'}
                onClose={() => setShowVideoCall(false)}
              />
            );
          })()}
      </main>
    </div>
  );
}

export default App;
