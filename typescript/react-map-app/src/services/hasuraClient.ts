import { Airport, AirportsQueryVariables } from '../types/airport';
import { Landmark } from '../types/landmark';

const HASURA_ENDPOINT = process.env.REACT_APP_HASURA_ENDPOINT || '';
const HASURA_ADMIN_SECRET = process.env.REACT_APP_HASURA_ADMIN_SECRET || '';

export async function fetchAirportsInBounds(variables: AirportsQueryVariables): Promise<Airport[]> {
  const query = `
    query {
      airports(
        where: {
          type: { _nin: ["heliport", "closed"] }
          latitude_deg: { _gte: ${variables.minLat}, _lte: ${variables.maxLat} }
          longitude_deg: { _gte: ${variables.minLon}, _lte: ${variables.maxLon} }
        }
      ) {
        name
        type
        iata_code
        icao_code
        latitude_deg
        longitude_deg
        home_link
      }
    }
  `;

  try {
    const response = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({
        query,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error('GraphQL query failed');
    }

    return result.data.airports || [];
  } catch (error) {
    console.error('Failed to fetch airports:', error);
    return [];
  }
}

export async function fetchLandmarksInBounds(vars: {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  settings?: { radius?: number; limit?: number };
}): Promise<Landmark[]> {
  // Compute a center point from bounds
  const centerLat = (vars.minLat + vars.maxLat) / 2;
  const centerLon = (vars.minLon + vars.maxLon) / 2;
  const radius = vars.settings?.radius ?? 50000; // meters
  const limit = Math.min(vars.settings?.limit ?? 10, 50);

  const radiusKm = Math.max(1, Math.round(radius / 1000));
  const gsrsearch = `nearcoord:${radiusKm}km,${centerLat},${centerLon} hastemplate:\"Coord\"`;

  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch,
    gsrlimit: limit.toString(),
    prop: 'coordinates|description|pageimages',
    piprop: 'thumbnail',
    pithumbsize: '200',
    format: 'json',
    origin: '*',
  });

  const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`;

  try {
    const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (!data || !data.query || !data.query.pages) return [];

    const pages = Object.values<any>(data.query.pages)
      .filter((p: any) => p.coordinates && p.coordinates.length > 0)
      .map((p: any) => ({
        pageId: p.pageid,
        title: p.title,
        lat: p.coordinates[0].lat,
        lon: p.coordinates[0].lon,
        thumbnailUrl: p.thumbnail?.source || null,
        thumbnailWidth: p.thumbnail?.width || null,
        thumbnailHeight: p.thumbnail?.height || null,
        description: p.description || null,
      }))
      .slice(0, limit);

    return pages as Landmark[];
  } catch (err) {
    console.error('Failed to fetch landmarks:', err);
    return [];
  }
}
