import React, { useRef, useEffect } from 'react';
import { User, ChatMessage } from '../../types/user';
import { ChatUserSelector } from './ChatUserSelector';
import { ChatMessagesList } from './ChatMessagesList';
import { ChatInput } from './ChatInput';

interface ChatWindowProps {
  users: User[];
  currentUserName: string;
  messages: ChatMessage[];
  selectedUser: string;
  chatInput: string;
  onUserSelect: (userId: string) => void;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
}

/**
 * Complete chat window with user selector, messages list, and input
 */
export function ChatWindow({
  users,
  currentUserName,
  messages,
  selectedUser,
  chatInput,
  onUserSelect,
  onInputChange,
  onSendMessage,
}: ChatWindowProps) {
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="fixed bottom-20 right-5 w-[350px] h-[500px] bg-white border border-gray-300 rounded-lg shadow-xl flex flex-col z-[1000]">
      {/* Chat Header */}
      <div className="p-4 bg-blue-500 text-white rounded-t-lg font-bold">💬 Chat</div>

      {/* User Selection */}
      <ChatUserSelector
        users={users}
        currentUserName={currentUserName}
        selectedUser={selectedUser}
        onUserSelect={onUserSelect}
      />

      {/* Chat Messages */}
      <ChatMessagesList
        messages={messages}
        currentUserName={currentUserName}
        chatEndRef={chatEndRef}
      />

      {/* Chat Input */}
      <ChatInput value={chatInput} onChange={onInputChange} onSend={onSendMessage} />
    </div>
  );
}
