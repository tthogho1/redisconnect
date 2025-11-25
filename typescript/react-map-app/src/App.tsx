import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import io, { Socket } from 'socket.io-client';
import './App.css';
import { VideoCallPopup } from './components/VideoCall/VideoCallPopup';

// Create custom colored icons for different users (separate from default)
const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 14px;
      ">📍</div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// Color palette for different users
const userColors = [
  '#FF5733', // Red-Orange
  '#33FF57', // Green
  '#3357FF', // Blue
  '#FF33F5', // Pink
  '#F5FF33', // Yellow
  '#33F5FF', // Cyan
  '#FF8C33', // Orange
  '#8C33FF', // Purple
  '#33FF8C', // Mint
  '#FF3333', // Red
];

// Create custom image icon for HIGMA
const createHigmaIcon = () => {
  return L.icon({
    iconUrl: '/channels4_profile.jpg',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

// Function to get user icon by index or special icon for HIGMA
const getUserIcon = (userId: string, index: number) => {
  if (userId === 'HIGMA') {
    return createHigmaIcon();
  }
  const color = userColors[index % userColors.length];
  return createColoredIcon(color);
};

interface User {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface ChatMessage {
  type: 'broadcast' | 'private';
  from: string;
  from_name: string;
  to?: string;
  message: string;
  timestamp?: string;
}

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [connected, setConnected] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(5);
  const socketRef = useRef<Socket | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('broadcast');
  const [showChat, setShowChat] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Video call state
  const [showVideoCall, setShowVideoCall] = useState<boolean>(false);

  // Default center position (Tokyo)
  const defaultPosition: [number, number] = [35.6762, 139.6503];

  // Generate random location near current position
  const generateRandomLocation = (baseLat: number, baseLon: number) => {
    const randomOffset = 0.01; // ~1km range
    return {
      lat: baseLat + (Math.random() - 0.5) * randomOffset,
      lon: baseLon + (Math.random() - 0.5) * randomOffset,
    };
  };

  // WebSocket connection - only once
  useEffect(() => {
    //const socket = io(process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:5000');
    const socket = io(process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:5000', {
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
      setChatMessages(prev => [...prev, data]);
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

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
          const initialLocation = generateRandomLocation(defaultPosition[0], defaultPosition[1]);
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
      const initialLocation = generateRandomLocation(defaultPosition[0], defaultPosition[1]);
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
        message: chatInput,
        timestamp,
      });
    } else {
      // Send private message
      socketRef.current.emit('chat_private', {
        from: userName,
        to: selectedUser,
        message: chatInput,
        timestamp,
      });
    }

    setChatInput('');
  };

  return (
    <div className="App">
      <h1>OpenStreetMap with WebSocket</h1>
      <div style={{ marginBottom: '10px' }}>
        Status: {connected ? '🟢 Connected' : '🔴 Disconnected'} | Users: {users.length}
      </div>

      <div
        style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}
      >
        <h3>Location Tracking Control</h3>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Your Name:
            <input
              type="text"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="Enter your name"
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Update Interval (seconds):
            <input
              type="number"
              value={intervalSeconds}
              onChange={e => setIntervalSeconds(Number(e.target.value))}
              min="1"
              max="60"
              style={{ marginLeft: '10px', padding: '5px', width: '60px' }}
            />
          </label>
        </div>
        <div>
          {!currentLocation ? (
            <button
              onClick={handleStartTracking}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Start Tracking
            </button>
          ) : (
            <button
              onClick={handleStopTracking}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Stop Tracking
            </button>
          )}
          {currentLocation && (
            <span style={{ marginLeft: '15px', color: '#4CAF50' }}>
              📍 Tracking active (Lat: {currentLocation.lat.toFixed(4)}, Lon:{' '}
              {currentLocation.lon.toFixed(4)})
            </span>
          )}
        </div>
      </div>

      <MapContainer center={defaultPosition} zoom={13} style={{ height: '600px', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
      </MapContainer>

      {/* Chat Toggle Button */}
      {currentLocation && (
        <button
          onClick={() => setShowChat(!showChat)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '15px 25px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            fontSize: '16px',
            fontWeight: 'bold',
            zIndex: 1000,
          }}
        >
          💬 {showChat ? 'Hide Chat' : 'Show Chat'}
        </button>
      )}

      {/* Video Call Toggle Button */}
      {currentLocation && (
        <button
          onClick={() => setShowVideoCall(!showVideoCall)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '200px',
            padding: '15px 25px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            fontSize: '16px',
            fontWeight: 'bold',
            zIndex: 1000,
          }}
        >
          📹 {showVideoCall ? 'Hide Video' : 'Video Call'}
        </button>
      )}

      {/* Chat Window */}
      {showChat && currentLocation && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '350px',
            height: '500px',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              padding: '15px',
              backgroundColor: '#2196F3',
              color: 'white',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              fontWeight: 'bold',
            }}
          >
            💬 Chat
          </div>

          {/* User Selection */}
          <div style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
            <label>
              Send to:{' '}
              <select
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
                style={{ padding: '5px', marginLeft: '5px' }}
              >
                <option value="broadcast">Everyone (Broadcast)</option>
                {users
                  .filter(u => u.name !== userName)
                  .map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          {/* Chat Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px',
              backgroundColor: '#f9f9f9',
            }}
          >
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '10px',
                  padding: '8px 12px',
                  backgroundColor: msg.from === userName ? '#E3F2FD' : '#FFF',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                }}
              >
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  <strong>{msg.from_name}</strong>
                  {msg.type === 'private' && (
                    <span style={{ color: '#FF5722', marginLeft: '5px' }}>(Private)</span>
                  )}
                  {msg.type === 'broadcast' && (
                    <span style={{ color: '#4CAF50', marginLeft: '5px' }}>(Broadcast)</span>
                  )}
                </div>
                <div>{msg.message}</div>
                {msg.timestamp && (
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div
            style={{ padding: '10px', borderTop: '1px solid #eee', display: 'flex', gap: '5px' }}
          >
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                padding: '8px 15px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Video Call Popup */}
      {showVideoCall && currentLocation && (
        <VideoCallPopup
          wsUrl={process.env.REACT_APP_SIGNALING_URL || 'ws://localhost:8080/ws'}
          defaultRoomId={userName || 'default-room'}
          onClose={() => setShowVideoCall(false)}
        />
      )}
    </div>
  );
}

export default App;
