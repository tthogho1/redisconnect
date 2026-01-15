import { useState, useRef, useCallback } from 'react';
import init, { WebRTCClient } from 'webrtc-wasm';

export function useWebRTC() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  const wasmClientRef = useRef<WebRTCClient | null>(null);
  const clientIdRef = useRef<string | null>(null);

  const initializeWebRTC = useCallback(
    async (
      onStatusChange: (message: string) => void,
      onIceCandidate: (candidateMessage: string) => void
    ) => {
      console.log('[WASM] Initializing...');
      await init();

      const wasmClient = new WebRTCClient();
      console.log('[WASM] Client created');
      wasmClientRef.current = wasmClient;

      // Setup callbacks
      wasmClient.setOnStatusChange((message: string) => {
        onStatusChange(message);
      });

      wasmClient.setOnRemoteStream((clientId: string, stream: MediaStream) => {
        console.log('[WASM] Remote stream received for:', clientId);
        setRemoteStreams(prev => new Map(prev).set(clientId, stream));
      });

      wasmClient.setOnIceCandidate((candidateMessage: string) => {
        console.log('[WASM] Sending ICE candidate via WebSocket');
        onIceCandidate(candidateMessage);
      });

      // Get local stream
      console.log('[WASM] Getting local stream...');
      const stream = await wasmClient.getLocalStream();
      setLocalStream(stream);
      console.log('[WASM] Local stream obtained, tracks:', stream.getTracks().length);

      return wasmClient;
    },
    []
  );

  const handleNewClient = useCallback(async (clientId: string) => {
    const wasmClient = wasmClientRef.current;
    if (!wasmClient) return null;

    console.log('[WASM] Handling new client:', clientId);
    const offerMessage = await wasmClient.handleNewClient(clientId);
    return offerMessage;
  }, []);

  const handleOffer = useCallback(async (clientId: string, sdp: string) => {
    const wasmClient = wasmClientRef.current;
    if (!wasmClient) return null;

    console.log('[WASM] Handling offer from:', clientId);
    const answerMessage = await wasmClient.handleOffer(clientId, sdp);
    return answerMessage;
  }, []);

  const handleAnswer = useCallback(async (clientId: string, sdp: string) => {
    const wasmClient = wasmClientRef.current;
    if (!wasmClient) return;

    console.log('[WASM] Handling answer from:', clientId);
    await wasmClient.handleAnswer(clientId, sdp);
  }, []);

  const handleIceCandidate = useCallback(
    async (
      clientId: string,
      candidate: string,
      sdpMid: string | null,
      sdpMLineIndex: number | null
    ) => {
      const wasmClient = wasmClientRef.current;
      if (!wasmClient) return;

      console.log('[WASM] Handling ICE candidate from:', clientId);
      await wasmClient.handleIceCandidate(clientId, candidate, sdpMid, sdpMLineIndex);
    },
    []
  );

  const handleLeaveClient = useCallback((clientId: string) => {
    const wasmClient = wasmClientRef.current;
    if (!wasmClient) return;

    wasmClient.handleLeaveClient(clientId);
    setRemoteStreams(prev => {
      const next = new Map(prev);
      next.delete(clientId);
      return next;
    });
  }, []);

  const cleanup = useCallback(() => {
    // Stop remote streams
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

    setLocalStream(null);
  }, []);

  return {
    localStream,
    remoteStreams,
    clientIdRef,
    wasmClientRef,
    initializeWebRTC,
    handleNewClient,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handleLeaveClient,
    cleanup,
  };
}
