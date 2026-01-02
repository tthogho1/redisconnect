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
