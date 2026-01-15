export interface SignalingMessage {
  type: string;
  payload: any;
}

export interface VideoCallPopupProps {
  wsUrl: string;
  defaultRoomId?: string;
  onClose: () => void;
}
