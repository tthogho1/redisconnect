import { useState, useEffect, useRef, useCallback } from 'react';
import { RemoteVideo } from './RemoteVideo';
import { ConnectionPanel } from './ConnectionPanel';
import { useWebRTC } from './useWebRTC';
import { useWebSocket } from './useWebSocket';
import { SignalingMessage, VideoCallPopupProps } from './types';

export function VideoCallPopup({
  wsUrl,
  defaultRoomId = 'test-room',
  onClose,
}: VideoCallPopupProps) {
  const [roomId, setRoomId] = useState(defaultRoomId);
  const [status, setStatus] = useState('Disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const [showConnectionPanel, setShowConnectionPanel] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);

  const {
    localStream,
    remoteStreams,
    clientIdRef,
    initializeWebRTC,
    handleNewClient,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handleLeaveClient,
    cleanup: cleanupWebRTC,
  } = useWebRTC();

  const { sendMessage, connect, disconnect } = useWebSocket();

  const updateStatus = useCallback((message: string) => {
    setStatus(message);
    console.log(message);
  }, []);

  const handleWebSocketMessage = useCallback(
    async (event: MessageEvent) => {
      const message: SignalingMessage = JSON.parse(event.data);
      console.log('Received:', message);

      try {
        switch (message.type) {
          case 'notify-client-id': {
            const payload =
              typeof message.payload === 'string' ? JSON.parse(message.payload) : message.payload;
            clientIdRef.current = payload.client_id;
            updateStatus(`Client ID: ${payload.client_id}`);

            // Join room
            sendMessage({
              type: 'join',
              payload: { room_id: roomId },
            });
            break;
          }

          case 'new-client': {
            const payload =
              typeof message.payload === 'string' ? JSON.parse(message.payload) : message.payload;
            const offerMessage = await handleNewClient(payload.client_id);
            if (offerMessage) {
              console.log('[WASM] Sending offer via WebSocket');
              sendMessage(JSON.parse(offerMessage));
            }
            break;
          }

          case 'offer': {
            const payload =
              typeof message.payload === 'string' ? JSON.parse(message.payload) : message.payload;
            const answerMessage = await handleOffer(payload.client_id, payload.sdp);
            if (answerMessage) {
              console.log('[WASM] Sending answer via WebSocket');
              sendMessage(JSON.parse(answerMessage));
            }
            break;
          }

          case 'answer': {
            const payload =
              typeof message.payload === 'string' ? JSON.parse(message.payload) : message.payload;
            await handleAnswer(payload.client_id, payload.sdp);
            break;
          }

          case 'ice-candidate': {
            const payload =
              typeof message.payload === 'string' ? JSON.parse(message.payload) : message.payload;
            await handleIceCandidate(
              payload.client_id,
              payload.candidate,
              payload.sdpMid || null,
              payload.sdpMLineIndex !== undefined ? payload.sdpMLineIndex : null
            );
            break;
          }

          case 'leave-client': {
            const payload =
              typeof message.payload === 'string' ? JSON.parse(message.payload) : message.payload;
            handleLeaveClient(payload.client_id);
            break;
          }

          case 'ping':
            // Ping response not required
            break;

          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('[WASM] Error handling message:', error);
      }
    },
    [
      roomId,
      sendMessage,
      updateStatus,
      clientIdRef,
      handleNewClient,
      handleOffer,
      handleAnswer,
      handleIceCandidate,
      handleLeaveClient,
    ]
  );

  const joinRoom = useCallback(async () => {
    try {
      updateStatus('Initializing...');

      // Initialize WebRTC
      updateStatus('Accessing camera...');
      await initializeWebRTC(updateStatus, (candidateMessage: string) => {
        sendMessage(JSON.parse(candidateMessage));
      });

      // Connect WebSocket
      updateStatus('Connecting to WebSocket...');
      connect(
        wsUrl,
        () => {
          console.log('[WebSocket] Connected, setting isConnected to true');
          updateStatus('WebSocket connection successful');
          setIsConnected(true);
        },
        handleWebSocketMessage,
        error => {
          updateStatus('WebSocket error: ' + error);
          console.error('WebSocket error:', error);
        },
        () => {
          updateStatus('WebSocket connection closed');
          setIsConnected(false);
        }
      );
    } catch (error) {
      updateStatus('Error: ' + (error as Error).message);
      console.error(error);
    }
  }, [handleWebSocketMessage, updateStatus, wsUrl, initializeWebRTC, sendMessage, connect]);

  const leaveRoom = useCallback(() => {
    // Stop local media tracks
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped track: ${track.kind}`);
      });
      localVideoRef.current.srcObject = null;
    }

    // Cleanup WebRTC
    cleanupWebRTC();

    // Disconnect WebSocket
    disconnect();

    setIsConnected(false);
    updateStatus('Left the room');
  }, [updateStatus, cleanupWebRTC, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);

  // Set local video stream when available
  useEffect(() => {
    console.log(
      '[Video] useEffect triggered - localStream:',
      !!localStream,
      'videoRef:',
      !!localVideoRef.current,
      'isConnected:',
      isConnected
    );
    if (localStream && localVideoRef.current && isConnected) {
      console.log('[Video] Setting local stream to video element');
      localVideoRef.current.srcObject = localStream;
      console.log('[Video] srcObject set successfully');
    }
  }, [localStream, isConnected]);

  const handleClose = () => {
    leaveRoom();
    onClose();
  };

  console.log(
    'VideoPopup render - isConnected:',
    isConnected,
    'remoteStreams:',
    remoteStreams.size
  );

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50"
      onClick={e => {
        // Prevent closing when clicking overlay
        if (e.target === e.currentTarget) {
          console.log('Clicked overlay - not closing');
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl mx-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-bold">Video Call</h2>
          <button
            className="text-2xl font-bold text-gray-400 hover:text-gray-700 transition-colors"
            onClick={handleClose}
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <ConnectionPanel
            roomId={roomId}
            setRoomId={setRoomId}
            status={status}
            isConnected={isConnected}
            showConnectionPanel={showConnectionPanel}
            setShowConnectionPanel={setShowConnectionPanel}
            joinRoom={joinRoom}
            leaveRoom={leaveRoom}
          />

          {isConnected && (
            <div className="mt-[30px] pt-5 border-t-2 border-gray-300">
              <h3 className="mb-[15px] text-lg font-semibold">Video Screen</h3>
              <div className="flex flex-col md:flex-row md:flex-wrap gap-5 md:max-w-4xl mx-auto">
                {Array.from(remoteStreams.entries()).map(([clientId, stream]) => (
                  <div
                    key={clientId}
                    className="bg-black rounded-lg overflow-hidden shadow-md flex flex-col items-center md:basis-1/3 w-full"
                  >
                    <RemoteVideo clientId={clientId} stream={stream} />
                  </div>
                ))}
                <div className="bg-black rounded-lg overflow-hidden shadow-md flex flex-col items-center md:basis-1/3 w-full">
                  <h3 className="bg-black/70 text-white p-2.5 m-0 text-base w-full text-center">
                    Me
                  </h3>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Debug info */}
          <div className="mt-5 text-xs text-gray-400">
            <p>Connection status: {isConnected ? 'Connected' : 'Disconnected'}</p>
            <p>Remote streams: {remoteStreams.size}</p>
            <p>Local stream: {localStream ? 'Available' : 'None'}</p>
            <p>Video element: {localVideoRef.current ? 'Available' : 'None'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
