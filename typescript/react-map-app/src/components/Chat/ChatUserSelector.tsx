import React from 'react';
import { User } from '../../types/user';

interface ChatUserSelectorProps {
  users: User[];
  currentUserName: string;
  selectedUser: string;
  onUserSelect: (userId: string) => void;
}

/**
 * User selector dropdown for chat recipient
 */
export function ChatUserSelector({
  users,
  currentUserName,
  selectedUser,
  onUserSelect,
}: ChatUserSelectorProps) {
  return (
    <div className="p-2.5 border-b border-gray-200">
      <label>
        Send to:{' '}
        <select
          value={selectedUser}
          onChange={e => onUserSelect(e.target.value)}
          className="p-1.5 ml-1.5 border border-gray-300 rounded"
        >
          <option value="broadcast">Everyone (Broadcast)</option>
          {users
            .filter(u => u.name !== currentUserName)
            .map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
        </select>
      </label>
    </div>
  );
}
