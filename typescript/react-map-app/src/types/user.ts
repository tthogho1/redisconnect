// User and Chat related type definitions

export interface User {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface ChatMessage {
  type: 'broadcast' | 'private';
  from: string;
  from_name: string;
  to?: string;
  message: string;
  timestamp?: string;
}
