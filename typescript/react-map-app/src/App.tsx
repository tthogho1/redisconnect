import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
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
    <div className="App p-5 font-sans">
      <h1 className="text-center text-gray-800 mb-5 text-2xl font-bold">
        OpenStreetMap with WebSocket
      </h1>
      <div className="mb-2.5">
        Status: {connected ? '🟢 Connected' : '🔴 Disconnected'} | Users: {users.length} | Airports:{' '}
        {airports.length}
      </div>

      {/* Map Bounds Display */}
      <MapBoundsDisplay bounds={mapBounds} />

      {/* Location Tracking Control */}
      <LocationControl
        userName={userName}
        onUserNameChange={setUserName}
        intervalSeconds={intervalSeconds}
        onIntervalChange={setIntervalSeconds}
        currentLocation={currentLocation}
        onStartTracking={handleStartTracking}
        onStopTracking={handleStopTracking}
      />

      <MapContainer center={DEFAULT_POSITION} zoom={13} style={{ height: '600px', width: '100%' }}>
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
    </div>
  );
}

export default App;
