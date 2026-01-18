import { GeocodingResult, NominatimResponse } from '../types/geocoding';

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';

/**
 * Search for a location using OpenStreetMap Nominatim API
 * @param query - Search query (landmark, country, address)
 * @param limit - Maximum number of results (default 5)
 * @returns Array of geocoding results
 */
export async function searchLocation(query: string, limit: number = 5): Promise<GeocodingResult[]> {
  if (!query.trim()) {
    return [];
  }

  const queryParams = new URLSearchParams({
    q: query,
    format: 'json',
    limit: limit.toString(),
    addressdetails: '1',
  });

  const url = `${NOMINATIM_ENDPOINT}?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        // Nominatim requires a User-Agent header
        'User-Agent': 'ReactMapApp/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const results: NominatimResponse[] = await response.json();

    // Transform response to GeocodingResult array
    return results.map(result => ({
      placeId: result.place_id,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      displayName: result.display_name,
      type: result.type,
      importance: result.importance,
      boundingBox: result.boundingbox,
    }));
  } catch (error) {
    console.error('Failed to search location:', error);
    return [];
  }
}
