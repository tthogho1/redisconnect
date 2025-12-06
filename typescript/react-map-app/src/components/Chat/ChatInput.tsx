import React from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

/**
 * Chat input component with send button
 */
export function ChatInput({ value, onChange, onSend }: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSend();
    }
  };

  return (
    <div className="p-2.5 border-t border-gray-200 flex gap-1.5">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
        className="flex-1 p-2 border border-gray-300 rounded"
      />
      <button
        onClick={onSend}
        className="px-4 py-2 bg-green-500 text-white border-none rounded cursor-pointer hover:bg-green-600"
      >
        Send
      </button>
    </div>
  );
}
