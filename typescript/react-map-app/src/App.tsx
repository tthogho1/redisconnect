import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import io, { Socket } from 'socket.io-client';
import './App.css';
import { VideoCallPopup } from './components/VideoCall/VideoCallPopup';
import { MapBoundsTracker, MapBoundsDisplay } from './components/Map';
import { ChatWindow } from './components/Chat';
import { LocationControl } from './components/LocationControl';
import { MapBounds } from './types/map';
import { User, ChatMessage } from './types/user';
import { Airport } from './types/airport';
import { getUserIcon } from './utils/mapIcons';
import { createAirportIcon } from './utils/airportIcons';
import { generateRandomLocation, DEFAULT_POSITION } from './utils/locationUtils';
import { fetchAirportsInBounds } from './services/hasuraClient';

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [connected, setConnected] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(5);
  const socketRef = useRef<Socket | null>(null);
  const userNameRef = useRef<string>(''); // Keep track of current userName for socket listeners

  // Update userNameRef when userName changes
  useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  // Map bounds state
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);

  // Airports state
  const [airports, setAirports] = useState<Airport[]>([]);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('broadcast');
  const [showChat, setShowChat] = useState<boolean>(false);

  // Video call state
  const [showVideoCall, setShowVideoCall] = useState<boolean>(false);

  // WebSocket connection - only once
  useEffect(() => {
    const websocketUrl = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:5000';
    console.log('🔌 Connecting to Socket.IO server:', websocketUrl);

    const socket = io(websocketUrl, {
      transports: ['websocket'],
      upgrade: false,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    // Listen for all users data
    socket.on('all_users', (data: User[]) => {
      console.log('Received all users:', data);
      setUsers(data);
    });

    // Listen for user added
    socket.on('user_added', (user: User) => {
      console.log('User added:', user);
      setUsers(prevUsers => [...prevUsers, user]);
    });

    // Listen for user updated
    socket.on('user_updated', (user: User) => {
      console.log('User updated:', user);
      setUsers(prevUsers => {
        const exists = prevUsers.some(u => u.id === user.id);
        if (exists) {
          // Update existing user
          return prevUsers.map(u => (u.id === user.id ? user : u));
        } else {
          // Add new user if not exists
          return [...prevUsers, user];
        }
      });
    });

    // Listen for user deleted
    socket.on('user_deleted', (data: { id: string }) => {
      console.log('User deleted:', data.id);
      setUsers(prevUsers => prevUsers.filter(u => u.id !== data.id));
    });

    // Listen for chat messages
    socket.on('chat_message', (data: ChatMessage) => {
      console.log('Chat message received:', data);
      // Only add messages from other users to avoid duplicates
      // (we already add our own messages immediately when sending)
      setChatMessages(prev => {
        // Check if this is our own message by comparing from field with current userName
        const isOwnMessage = data.from === userNameRef.current;
        if (isOwnMessage) {
          // Skip our own messages since we already added them locally
          console.log('Skipping own message to avoid duplicate');
          return prev;
        }
        return [...prev, data];
      });
    });

    // Listen for chat errors
    socket.on('chat_error', (data: { error: string }) => {
      console.error('Chat error:', data.error);
      alert(`Chat error: ${data.error}`);
    });

    // Listen for register acknowledgment
    socket.on('register_ack', (data: any) => {
      console.log('Register ack:', data);
    });

    return () => {
      socket.disconnect();
    };
  }, []); // Empty dependency array - connect only once

  // Periodic location updates - separate effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (userName && currentLocation && socketRef.current) {
      intervalId = setInterval(() => {
        // Try to get current geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            position => {
              const newLocation = {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
              };
              setCurrentLocation(newLocation);

              const locationData = {
                id: userName,
                name: userName,
                latitude: newLocation.lat,
                longitude: newLocation.lon,
              };

              console.log('Sending current location:', locationData);
              socketRef.current?.emit('location', locationData);
            },
            error => {
              console.error('Geolocation update error:', error);
              // Fallback: use slightly randomized location
              const newLocation = generateRandomLocation(currentLocation.lat, currentLocation.lon);
              setCurrentLocation(newLocation);

              const locationData = {
                id: userName,
                name: userName,
                latitude: newLocation.lat,
                longitude: newLocation.lon,
              };

              console.log('Sending fallback location:', locationData);
              socketRef.current?.emit('location', locationData);
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            }
          );
        } else {
          // Browser doesn't support geolocation, use random movement
          const newLocation = generateRandomLocation(currentLocation.lat, currentLocation.lon);
          setCurrentLocation(newLocation);

          const locationData = {
            name: userName,
            latitude: newLocation.lat,
            longitude: newLocation.lon,
          };

          console.log('Sending simulated location:', locationData);
          socketRef.current?.emit('location', locationData);
        }
      }, intervalSeconds * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [userName, currentLocation, intervalSeconds]); // Dependencies for location updates only

  // Fetch airports when map bounds change
  useEffect(() => {
    if (mapBounds) {
      const fetchAirports = async () => {
        const airportsData = await fetchAirportsInBounds({
          minLat: mapBounds.south,
          maxLat: mapBounds.north,
          minLon: mapBounds.west,
          maxLon: mapBounds.east,
        });
        console.log('Fetched airports:', airportsData.length);
        setAirports(airportsData);
      };

      fetchAirports();
    }
  }, [mapBounds]);

  const handleStartTracking = () => {
    if (!userName.trim()) {
      alert('Please enter your name');
      return;
    }

    // Get current geolocation from browser
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const currentPos = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          console.log('Current location obtained:', currentPos);
          setCurrentLocation(currentPos);

          // Send initial location to server
          if (socketRef.current) {
            const userId = userName; // Use userName as userId
            socketRef.current.emit('location', {
              id: userName,
              name: userName,
              latitude: currentPos.lat,
              longitude: currentPos.lon,
            });

            // Register user for chat
            socketRef.current.emit('register', { user_id: userId });
          }
        },
        error => {
          console.error('Geolocation error:', error);
          alert(
            `位置情報の取得に失敗しました: ${error.message}\nデフォルト位置（東京）を使用します。`
          );
          // Fallback to default location
          const initialLocation = generateRandomLocation(DEFAULT_POSITION[0], DEFAULT_POSITION[1]);
          setCurrentLocation(initialLocation);

          // Register user for chat even with default location
          if (socketRef.current) {
            const userId = userName;
            socketRef.current.emit('register', { user_id: userId });
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      alert('このブラウザは位置情報取得に対応していません。デフォルト位置を使用します。');
      const initialLocation = generateRandomLocation(DEFAULT_POSITION[0], DEFAULT_POSITION[1]);
      setCurrentLocation(initialLocation);

      // Register user for chat
      if (socketRef.current) {
        const userId = userName;
        socketRef.current.emit('register', { user_id: userId });
      }
    }
  };

  const handleStopTracking = () => {
    setCurrentLocation(null);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !socketRef.current || !userName) return;

    const timestamp = new Date().toISOString();

    if (selectedUser === 'broadcast') {
      // Send broadcast message
      socketRef.current.emit('chat_broadcast', {
        from: userName,
        from_name: userName,
        message: chatInput,
        timestamp,
      });

      // Add message to local chat immediately
      setChatMessages(prev => [
        ...prev,
        {
          type: 'broadcast',
          from: userName,
          from_name: userName,
          message: chatInput,
          timestamp,
        },
      ]);
    } else {
      // Send private message
      socketRef.current.emit('chat_private', {
        from: userName,
        from_name: userName,
        to: selectedUser,
        message: chatInput,
        timestamp,
      });

      // Add message to local chat immediately
      setChatMessages(prev => [
        ...prev,
        {
          type: 'private',
          from: userName,
          from_name: userName,
          to: selectedUser,
          message: chatInput,
          timestamp,
        },
      ]);
    }

    setChatInput('');
  };

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
