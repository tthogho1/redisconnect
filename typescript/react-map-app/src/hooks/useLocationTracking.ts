import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { generateRandomLocation, DEFAULT_POSITION } from '../utils/locationUtils';

interface UseLocationTrackingProps {
  userName: string;
  socket: Socket | null;
  intervalSeconds: number;
}

interface UseLocationTrackingReturn {
  currentLocation: { lat: number; lon: number } | null;
  initialMapCenter: { lat: number; lon: number } | null;
  handleStartTracking: () => void;
  handleStopTracking: () => void;
}

/**
 * Custom hook for managing location tracking functionality
 */
export function useLocationTracking({
  userName,
  socket,
  intervalSeconds,
}: UseLocationTrackingProps): UseLocationTrackingReturn {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [initialMapCenter, setInitialMapCenter] = useState<{ lat: number; lon: number } | null>(
    null
  );

  // Periodic location updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (userName && currentLocation && socket) {
      intervalId = setInterval(() => {
        // Try to get current geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            position => {
              const newLocation = {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
              };
              setCurrentLocation(newLocation);

              const locationData = {
                id: userName,
                name: userName,
                latitude: newLocation.lat,
                longitude: newLocation.lon,
              };

              console.log('Sending current location:', locationData);
              socket.emit('location', locationData);
            },
            error => {
              console.error('Geolocation update error:', error);
              // Fallback: use slightly randomized location
              const newLocation = generateRandomLocation(currentLocation.lat, currentLocation.lon);
              setCurrentLocation(newLocation);

              const locationData = {
                id: userName,
                name: userName,
                latitude: newLocation.lat,
                longitude: newLocation.lon,
              };

              console.log('Sending fallback location:', locationData);
              socket.emit('location', locationData);
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            }
          );
        } else {
          // Browser doesn't support geolocation, use random movement
          const newLocation = generateRandomLocation(currentLocation.lat, currentLocation.lon);
          setCurrentLocation(newLocation);

          const locationData = {
            name: userName,
            latitude: newLocation.lat,
            longitude: newLocation.lon,
          };

          console.log('Sending simulated location:', locationData);
          socket.emit('location', locationData);
        }
      }, intervalSeconds * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [userName, currentLocation, intervalSeconds, socket]);

  const handleStartTracking = () => {
    if (!userName.trim()) {
      alert('Please enter your name');
      return;
    }

    // Get current geolocation from browser
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const currentPos = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          console.log('Current location obtained:', currentPos);
          setCurrentLocation(currentPos);
          // Set initial map center only once on first tracking start
          setInitialMapCenter(currentPos);

          // Send initial location to server
          if (socket) {
            const userId = userName; // Use userName as userId
            socket.emit('location', {
              id: userName,
              name: userName,
              latitude: currentPos.lat,
              longitude: currentPos.lon,
            });

            // Register user for chat
            socket.emit('register', { user_id: userId });
          }
        },
        error => {
          console.error('Geolocation error:', error);
          alert(`Failed to get location: ${error.message}\nUsing default location (Tokyo).`);
          // Fallback to default location
          const initialLocation = generateRandomLocation(DEFAULT_POSITION[0], DEFAULT_POSITION[1]);
          setCurrentLocation(initialLocation);

          // Register user for chat even with default location
          if (socket) {
            const userId = userName;
            socket.emit('register', { user_id: userId });
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      alert('This browser does not support geolocation. Using default location.');
      const initialLocation = generateRandomLocation(DEFAULT_POSITION[0], DEFAULT_POSITION[1]);
      setCurrentLocation(initialLocation);

      // Register user for chat
      if (socket) {
        const userId = userName;
        socket.emit('register', { user_id: userId });
      }
    }
  };

  const handleStopTracking = () => {
    setCurrentLocation(null);
  };

  return {
    currentLocation,
    initialMapCenter,
    handleStartTracking,
    handleStopTracking,
  };
}
