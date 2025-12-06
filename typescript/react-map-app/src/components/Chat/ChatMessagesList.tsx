import React from 'react';
import { ChatMessage } from '../../types/user';

interface ChatMessagesListProps {
  messages: ChatMessage[];
  currentUserName: string;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Display list of chat messages
 */
export function ChatMessagesList({ messages, currentUserName, chatEndRef }: ChatMessagesListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-2.5 bg-gray-50">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`mb-2.5 p-3 rounded-lg border ${
            msg.from === currentUserName ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
          }`}
        >
          <div className="text-xs text-gray-600 mb-1">
            <strong>{msg.from_name}</strong>
            {msg.type === 'private' && <span className="text-orange-600 ml-1.5">(Private)</span>}
            {msg.type === 'broadcast' && <span className="text-green-600 ml-1.5">(Broadcast)</span>}
          </div>
          <div>{msg.message}</div>
          {msg.timestamp && (
            <div className="text-[10px] text-gray-400 mt-1">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      ))}
      <div ref={chatEndRef} />
    </div>
  );
}
