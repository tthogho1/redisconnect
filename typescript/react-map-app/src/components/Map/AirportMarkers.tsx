import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Airport } from '../../types/airport';
import { createAirportIcon } from '../../utils/airportIcons';

interface AirportMarkersProps {
  airports: Airport[];
}

export const AirportMarkers: React.FC<AirportMarkersProps> = ({ airports }) => {
  return (
    <>
      {airports.map((airport, index) => (
        <Marker
          key={`airport-${index}`}
          position={[airport.latitude_deg, airport.longitude_deg]}
          icon={createAirportIcon(airport.type)}
        >
          <Popup>
            <strong>✈️ {airport.name}</strong>
            <br />
            Type: {airport.type}
            <br />
            {airport.iata_code && (
              <>
                IATA: {airport.iata_code}
                <br />
              </>
            )}
            {airport.icao_code && (
              <>
                ICAO: {airport.icao_code}
                <br />
              </>
            )}
            Lat: {airport.latitude_deg.toFixed(4)}, Lon: {airport.longitude_deg.toFixed(4)}
            {airport.home_link && (
              <>
                <br />
                <a href={airport.home_link} target="_blank" rel="noopener noreferrer">
                  Website
                </a>
              </>
            )}
          </Popup>
        </Marker>
      ))}
    </>
  );
};
