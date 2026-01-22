import React from 'react';
import { Polyline } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';

interface RouteLayerProps {
  route?: Array<{ lat: number; lon: number }> | null;
}

export const RouteLayer: React.FC<RouteLayerProps> = ({ route }) => {
  if (!route || route.length === 0) return null;

  const latlngs: LatLngExpression[] = route.map(p => [p.lat, p.lon]);

  return <Polyline positions={latlngs} pathOptions={{ color: 'blue', weight: 5 }} />;
};
