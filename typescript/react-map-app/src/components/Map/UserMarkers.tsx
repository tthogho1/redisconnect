import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { User } from '../../types/user';
import { getUserIcon } from '../../utils/mapIcons';

interface UserMarkersProps {
  users: User[];
}

export const UserMarkers: React.FC<UserMarkersProps> = ({ users }) => {
  return (
    <>
      {users.map((user, index) => (
        <Marker
          key={user.id}
          position={[user.latitude, user.longitude]}
          icon={getUserIcon(user.id, index)}
        >
          <Popup>
            <strong>{user.name}</strong>
            <br />
            ID: {user.id}
            <br />
            Lat: {user.latitude.toFixed(4)}, Lon: {user.longitude.toFixed(4)}
          </Popup>
        </Marker>
      ))}
    </>
  );
};
