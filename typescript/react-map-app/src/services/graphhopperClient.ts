export interface GHPoint {
  lat: number;
  lon: number;
}

const GH_API_KEY = process.env.REACT_APP_GRAPH_HOPPER_API_KEY;
const GH_BASE = process.env.REACT_APP_GRAPH_HOPPER_BASE_URL || 'https://graphhopper.com/api/1';

export async function getRoute(points: GHPoint[], vehicle: 'car' | 'bike' | 'foot') {
  if (!GH_API_KEY) throw new Error('GRAPH_HOPPER_API_KEY is not set in env');
  if (!points || points.length < 2) throw new Error('At least two points are required');

  const params = new URLSearchParams();
  params.set('vehicle', vehicle);
  params.set('points_encoded', 'false');
  // Add each point as point=lat,lon
  for (const p of points) {
    params.append('point', `${p.lat},${p.lon}`);
  }
  params.set('key', GH_API_KEY);

  const url = `${GH_BASE}/route?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GraphHopper request failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  // Try to parse coordinates from response
  // Typical shape: data.paths[0].points.coordinates -> [[lon,lat], ...]
  const path = data?.paths?.[0];
  if (!path) throw new Error('No route path returned');

  let coords: number[][] | undefined;
  if (path.points && path.points.coordinates) coords = path.points.coordinates;
  else if (path.points && Array.isArray(path.points)) coords = path.points as number[][];
  else if (
    path.points &&
    path.points.type === 'LineString' &&
    Array.isArray(path.points.coordinates)
  )
    coords = path.points.coordinates;

  if (!coords && path.snapped_waypoints && path.snapped_waypoints.coordinates)
    coords = path.snapped_waypoints.coordinates;

  if (!coords) throw new Error('Unable to parse coordinates from GraphHopper response');

  // Convert to {lat, lon} array. GraphHopper coordinates are usually [lon, lat].
  const out: GHPoint[] = coords.map(c => {
    // c is [x, y] where one is lon and the other is lat
    const a = Math.abs(c[0]);
    const b = Math.abs(c[1]);
    // Latitude values are <= 90 normally
    if (a <= 90 && b <= 90) {
      // ambiguous: assume [lat, lon] if first within [-90,90] and second within [-180,180]
      if (Math.abs(c[1]) > 180) return { lat: c[0], lon: c[1] };
    }
    // If first value magnitude > 90 assume it's lon
    if (a > 90) return { lat: c[1], lon: c[0] };
    // Fallback: assume [lon, lat]
    return { lat: c[1], lon: c[0] };
  });

  return out;
}
