import { useRef, useCallback } from 'react';
import { SignalingMessage } from './types';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback((message: SignalingMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('[sendMessage] Sending:', message.type, message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('[sendMessage] WebSocket not ready');
    }
  }, []);

  const connect = useCallback(
    (
      wsUrl: string,
      onOpen: () => void,
      onMessage: (event: MessageEvent) => void,
      onError: (error: Event) => void,
      onClose: () => void
    ) => {
      console.log('[WebSocket] Connecting to:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        onOpen();
      };

      ws.onmessage = onMessage;
      ws.onerror = onError;
      ws.onclose = onClose;

      return ws;
    },
    []
  );

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  return {
    wsRef,
    sendMessage,
    connect,
    disconnect,
  };
}
