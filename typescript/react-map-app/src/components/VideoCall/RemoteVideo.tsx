import { useRef, useEffect } from 'react';

export interface RemoteVideoProps {
  clientId: string;
  stream: MediaStream;
}

export function RemoteVideo({ clientId, stream }: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [clientId, stream]);

  return (
    <>
      <h3 className="bg-black/70 text-white p-2.5 m-0 text-base w-full text-center">
        Peer: {clientId.substring(0, 8)}
      </h3>
      <video ref={videoRef} autoPlay playsInline className="w-full h-auto object-cover" />
    </>
  );
}
