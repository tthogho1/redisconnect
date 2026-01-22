import { useEffect, useState, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { User, ChatMessage } from '../types/user';

interface UseWebSocketReturn {
  socket: Socket | null;
  connected: boolean;
  users: User[];
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
}

/**
 * Custom hook for managing WebSocket connection and real-time events
 */
export function useWebSocket(userNameRef: React.RefObject<string>): UseWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Prefer the explicit env var set at build/dev time. If it's missing (for example
    // when serving a static build without baked env), fall back to the page origin
    // so the client connects to the same host that served the app.
    const envUrl = process.env.REACT_APP_WEBSOCKET_URL;
    const origin =
      typeof window !== 'undefined' && window.location ? window.location.origin : undefined;
    console.log('WebSocket env var:', envUrl);
    console.log('Page origin:', origin);
    // Prefer explicit environment variable. If not set, connect back to the page origin.
    // Do NOT force a localhost:5000 fallback here — that causes unexpected attempts
    // to reach a non-running local server when served from a different origin.
    const websocketUrl = envUrl && envUrl.trim() !== '' ? envUrl : origin;
    console.log('🔌 Connecting to Socket.IO server:', websocketUrl);

    // The Go socket.io library (doquangtan/socketio) only supports websocket transport,
    // NOT polling. Force websocket-only to avoid the server returning static file listings.
    const socket = io(websocketUrl || undefined, {
      path: '/socket.io/',
      transports: ['websocket'],
      upgrade: false,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setConnected(true);
      // If we have a current user name, register it with the server so it can bind
      // the socket to the user immediately after connect.
      try {
        const id = userNameRef?.current;
        if (id) {
          socket.emit('register', { id });
          console.log('Sent register for user:', id);
        }
      } catch (err) {
        console.warn('Register emit failed', err);
      }
    });

    socket.on('connect_error', (err: any) => {
      console.error('WebSocket connect_error', err);
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
      // Logging disabled to reduce console noise
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
  }, [userNameRef]);

  const addChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  };

  return {
    socket: socketRef.current,
    connected,
    users,
    chatMessages,
    addChatMessage,
  };
}
