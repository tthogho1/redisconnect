import { useState, useEffect, useRef, useCallback } from 'react';
import init, { WebRTCClient } from 'webrtc-wasm';
import './VideoCallPopup.css';

interface SignalingMessage {
  type: string;
  payload: any;
}

export interface VideoCallPopupProps {
  wsUrl: string;
  defaultRoomId?: string;
  onClose: () => void;
}

export function VideoCallPopup({
  wsUrl,
  defaultRoomId = 'test-room',
  onClose,
}: VideoCallPopupProps) {
  const [roomId, setRoomId] = useState(defaultRoomId);
  const [status, setStatus] = useState('未接続');
  const [isConnected, setIsConnected] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const wasmClientRef = useRef<WebRTCClient | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const clientIdRef = useRef<string | null>(null);

  const updateStatus = useCallback((message: string) => {
    setStatus(message);
    console.log(message);
  }, []);

  const sendMessage = useCallback((message: SignalingMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('[sendMessage] Sending:', message.type, message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('[sendMessage] WebSocket not ready');
    }
  }, []);

  const handleWebSocketMessage = useCallback(
    async (event: MessageEvent) => {
      const message: SignalingMessage = JSON.parse(event.data);
      console.log('Received:', message);

      const wasmClient = wasmClientRef.current;
      if (!wasmClient) return;

      try {
        switch (message.type) {
          case 'notify-client-id': {
            const payload =
              typeof message.payload === 'string' ? JSON.parse(message.payload) : message.payload;
            clientIdRef.current = payload.client_id;
            updateStatus(`クライアントID: ${payload.client_id}`);

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
            console.log('[WASM] Handling new client:', payload.client_id);
            const offerMessage = await wasmClient.handleNewClient(payload.client_id);
            if (offerMessage && wsRef.current) {
              console.log('[WASM] Sending offer via WebSocket');
              wsRef.current.send(offerMessage);
            }
            break;
          }

          case 'offer': {
            const payload =
              typeof message.payload === 'string' ? JSON.parse(message.payload) : message.payload;
            console.log('[WASM] Handling offer from:', payload.client_id);
            const answerMessage = await wasmClient.handleOffer(payload.client_id, payload.sdp);
            if (answerMessage && wsRef.current) {
              console.log('[WASM] Sending answer via WebSocket');
              wsRef.current.send(answerMessage);
            }
            break;
          }

          case 'answer': {
            const payload =
              typeof message.payload === 'string' ? JSON.parse(message.payload) : message.payload;
            console.log('[WASM] Handling answer from:', payload.client_id);
            await wasmClient.handleAnswer(payload.client_id, payload.sdp);
            break;
          }

          case 'ice-candidate': {
            const payload =
              typeof message.payload === 'string' ? JSON.parse(message.payload) : message.payload;
            console.log('[WASM] Handling ICE candidate from:', payload.client_id);
            await wasmClient.handleIceCandidate(
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
            wasmClient.handleLeaveClient(payload.client_id);
            setRemoteStreams(prev => {
              const next = new Map(prev);
              next.delete(payload.client_id);
              return next;
            });
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
    [roomId, sendMessage, updateStatus]
  );

  const joinRoom = useCallback(async () => {
    try {
      updateStatus('初期化中...');

      // Initialize WASM
      console.log('[WASM] Initializing...');
      await init();

      const wasmClient = new WebRTCClient();
      console.log('[WASM] Client created');
      wasmClientRef.current = wasmClient;

      // Setup callbacks
      wasmClient.setOnStatusChange((message: string) => {
        updateStatus(message);
      });

      wasmClient.setOnRemoteStream((clientId: string, stream: MediaStream) => {
        console.log('[WASM] Remote stream received for:', clientId);
        setRemoteStreams(prev => new Map(prev).set(clientId, stream));
      });

      wasmClient.setOnIceCandidate((candidateMessage: string) => {
        console.log('[WASM] Sending ICE candidate via WebSocket');
        if (wsRef.current) {
          wsRef.current.send(candidateMessage);
        }
      });

      // Get local stream
      console.log('[WASM] Getting local stream...');
      updateStatus('カメラにアクセス中...');
      const stream = await wasmClient.getLocalStream();
      setLocalStream(stream);
      console.log('[WASM] Local stream obtained, tracks:', stream.getTracks().length);
      updateStatus('WebSocketに接続中...');

      // Connect WebSocket
      console.log('[WebSocket] Connecting to:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected, setting isConnected to true');
        updateStatus('WebSocket接続成功');
        setIsConnected(true);
      };

      ws.onmessage = handleWebSocketMessage;

      ws.onerror = error => {
        updateStatus('WebSocketエラー: ' + error);
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        updateStatus('WebSocket接続が切断されました');
        setIsConnected(false);
      };
    } catch (error) {
      updateStatus('エラー: ' + (error as Error).message);
      console.error(error);
    }
  }, [handleWebSocketMessage, updateStatus, wsUrl]);

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

    // Stop remote streams - use ref to avoid dependency
    setRemoteStreams(prev => {
      prev.forEach(stream => {
        stream.getTracks().forEach(track => track.stop());
      });
      return new Map();
    });

    if (wasmClientRef.current) {
      wasmClientRef.current.close();
      wasmClientRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setLocalStream(null);
    setIsConnected(false);
    updateStatus('退出しました');
  }, [updateStatus]);

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
      className="popup-overlay"
      onClick={e => {
        // Prevent closing when clicking overlay
        if (e.target === e.currentTarget) {
          console.log('Clicked overlay - not closing');
        }
      }}
    >
      <div className="popup-content">
        <div className="popup-header">
          <h2>ビデオ通話</h2>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="popup-body">
          <div className="connection-panel">
            <h3>接続設定</h3>
            <div style={{ marginBottom: '20px' }}>
              <label>
                Room ID:{' '}
                <input
                  type="text"
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                  style={{ width: '300px' }}
                  disabled={isConnected}
                />
              </label>
            </div>
            <p className="status">{status}</p>
            {!isConnected ? (
              <button onClick={joinRoom} className="connect-button">
                接続開始
              </button>
            ) : (
              <button
                onClick={leaveRoom}
                className="disconnect-button"
                style={{ marginTop: '10px' }}
              >
                切断
              </button>
            )}
          </div>

          {isConnected && (
            <div className="video-section">
              <h3 style={{ marginBottom: '15px' }}>ビデオ画面</h3>
              <div className="videos">
                <div className="video-container">
                  <h3>自分</h3>
                  <video ref={localVideoRef} autoPlay muted playsInline className="video" />
                </div>
                {Array.from(remoteStreams.entries()).map(([clientId, stream]) => (
                  <RemoteVideo key={clientId} clientId={clientId} stream={stream} />
                ))}
              </div>
            </div>
          )}

          {/* Debug info */}
          <div style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>
            <p>接続状態: {isConnected ? '接続中' : '未接続'}</p>
            <p>リモートストリーム数: {remoteStreams.size}</p>
            <p>ローカルストリーム: {localStream ? 'あり' : 'なし'}</p>
            <p>ビデオ要素: {localVideoRef.current ? 'あり' : 'なし'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RemoteVideoProps {
  clientId: string;
  stream: MediaStream;
}

function RemoteVideo({ clientId, stream }: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      console.log('[RemoteVideo] Setting stream for:', clientId);
      videoRef.current.srcObject = stream;
    }
  }, [clientId, stream]);

  return (
    <div className="video-container">
      <h3>Peer: {clientId.substring(0, 8)}</h3>
      <video ref={videoRef} autoPlay playsInline className="video" />
    </div>
  );
}
