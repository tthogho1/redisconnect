import { Landmark, WikimediaGeosearchResponse, LandmarkQueryParams } from '../types/landmark';

const WIKIMEDIA_ENDPOINT = 'https://en.wikipedia.org/w/api.php';

/**
 * Fetch landmarks near a given coordinate using Wikimedia geosearch API
 * @param params - Query parameters including lat, lon, and optional radius
 * @returns Array of landmarks with title, coordinates, and thumbnail
 */
export async function fetchLandmarksNearby(params: LandmarkQueryParams): Promise<Landmark[]> {
  const { lat, lon, radius = 10000, limit = 10 } = params;

  // Build query URL with all required parameters
  const queryParams = new URLSearchParams({
    action: 'query',
    generator: 'geosearch',
    ggscoord: `${lat}|${lon}`,
    ggsradius: radius.toString(),
    ggslimit: limit.toString(),
    prop: 'pageimages|coordinates',
    piprop: 'thumbnail',
    pithumbsize: '100',
    format: 'json',
    origin: '*', // Required for CORS
  });

  const url = `${WIKIMEDIA_ENDPOINT}?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: WikimediaGeosearchResponse = await response.json();

    // Handle API errors
    if (result.error) {
      console.error('Wikimedia API error:', result.error);
      throw new Error(`Wikimedia API error: ${result.error.code} - ${result.error.info}`);
    }

    // No results found
    if (!result.query?.pages) {
      return [];
    }

    // Transform response to Landmark array
    const landmarks: Landmark[] = Object.values(result.query.pages)
      .filter(page => page.coordinates && page.coordinates.length > 0)
      .map(page => ({
        pageId: page.pageid,
        title: page.title,
        lat: page.coordinates![0].lat,
        lon: page.coordinates![0].lon,
        thumbnailUrl: page.thumbnail?.source || null,
        thumbnailWidth: page.thumbnail?.width || null,
        thumbnailHeight: page.thumbnail?.height || null,
      }));

    return landmarks;
  } catch (error) {
    console.error('Failed to fetch landmarks:', error);
    return [];
  }
}
