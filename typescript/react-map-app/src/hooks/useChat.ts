import { useState } from 'react';
import { Socket } from 'socket.io-client';

interface UseChatProps {
  userName: string;
  socket: Socket | null;
  addChatMessage: (message: any) => void;
}

interface UseChatReturn {
  chatInput: string;
  setChatInput: (input: string) => void;
  selectedUser: string;
  setSelectedUser: (user: string) => void;
  showChat: boolean;
  setShowChat: (show: boolean) => void;
  handleSendMessage: () => void;
}

/**
 * Custom hook for managing chat functionality
 */
export function useChat({ userName, socket, addChatMessage }: UseChatProps): UseChatReturn {
  const [chatInput, setChatInput] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('broadcast');
  const [showChat, setShowChat] = useState<boolean>(false);

  const handleSendMessage = () => {
    if (!chatInput.trim() || !socket || !userName) return;

    const timestamp = new Date().toISOString();

    if (selectedUser === 'broadcast') {
      // Send broadcast message
      socket.emit('chat_broadcast', {
        from: userName,
        from_name: userName,
        message: chatInput,
        timestamp,
      });

      // Add message to local chat immediately
      addChatMessage({
        type: 'broadcast',
        from: userName,
        from_name: userName,
        message: chatInput,
        timestamp,
      });
    } else {
      // Send private message
      socket.emit('chat_private', {
        from: userName,
        from_name: userName,
        to: selectedUser,
        message: chatInput,
        timestamp,
      });

      // Add message to local chat immediately
      addChatMessage({
        type: 'private',
        from: userName,
        from_name: userName,
        to: selectedUser,
        message: chatInput,
        timestamp,
      });
    }

    setChatInput('');
  };

  return {
    chatInput,
    setChatInput,
    selectedUser,
    setSelectedUser,
    showChat,
    setShowChat,
    handleSendMessage,
  };
}
