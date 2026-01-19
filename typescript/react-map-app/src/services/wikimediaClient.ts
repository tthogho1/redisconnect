import {
  Landmark,
  WikimediaCirrusSearchResponse,
  WikimediaPageDetailsResponse,
  LandmarkQueryParams,
  BoundingBox,
} from '../types/landmark';

const WIKIMEDIA_ENDPOINT = 'https://en.wikipedia.org/w/api.php';

/**
 * Calculate bounding box from center point and radius
 * @param lat - Center latitude
 * @param lon - Center longitude
 * @param radiusMeters - Radius in meters
 * @returns Bounding box coordinates
 */
function calculateBoundingBox(lat: number, lon: number, radiusMeters: number): BoundingBox {
  // Earth's radius in meters
  const earthRadius = 6371000;

  // Convert radius to degrees (approximate)
  const latDelta = (radiusMeters / earthRadius) * (180 / Math.PI);
  const lonDelta =
    (radiusMeters / (earthRadius * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);

  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lon + lonDelta,
    west: lon - lonDelta,
  };
}

/**
 * Fetch landmarks using CirrusSearch API with bounding box
 * CirrusSearch allows larger search areas than the 10km limit of geosearch
 * Uses pagination to fetch more than 10 results
 * @param params - Query parameters including lat, lon, and optional radius/boundingBox
 * @returns Array of landmarks with title, coordinates, and thumbnail
 */
export async function fetchLandmarksNearby(params: LandmarkQueryParams): Promise<Landmark[]> {
  const { lat, lon, boundingBox, radius = 10000, limit = 10 } = params;

  // Calculate bounding box if not provided
  const bbox = boundingBox || calculateBoundingBox(lat, lon, radius);

  // Build CirrusSearch query with bounding box filter
  // Search for articles with coordinates (landmarks) using incategory or hastemplate filters
  const searchQuery = `nearcoord:${Math.round(radius / 1000)}km,${lat},${lon} hastemplate:"Coord"`;

  // CirrusSearch has srlimit max of 50 per request, so we need to paginate
  const PAGE_SIZE = 50;
  const allPageIds: number[] = [];
  let sroffset = 0;
  let continueToken: string | undefined;
  let remaining = limit;

  try {
    // Step 1: Fetch all page IDs using pagination
    while (remaining > 0) {
      const currentLimit = Math.min(remaining, PAGE_SIZE);

      const searchParams = new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: searchQuery,
        srlimit: currentLimit.toString(),
        srwhat: 'text',
        format: 'json',
        origin: '*', // Required for CORS
      });

      // Add pagination parameters if not first request
      if (sroffset > 0) {
        searchParams.set('sroffset', sroffset.toString());
      }
      if (continueToken) {
        searchParams.set('continue', continueToken);
      }

      const searchUrl = `${WIKIMEDIA_ENDPOINT}?${searchParams.toString()}`;

      const searchResponse = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!searchResponse.ok) {
        throw new Error(`HTTP error! status: ${searchResponse.status}`);
      }

      const searchResult: WikimediaCirrusSearchResponse = await searchResponse.json();

      // Handle API errors
      if (searchResult.error) {
        console.error('Wikimedia CirrusSearch API error:', searchResult.error);
        throw new Error(
          `Wikimedia API error: ${searchResult.error.code} - ${searchResult.error.info}`
        );
      }

      // No results found
      if (!searchResult.query?.search || searchResult.query.search.length === 0) {
        break;
      }

      // Collect page IDs
      const pageIds = searchResult.query.search.map(page => page.pageid);
      allPageIds.push(...pageIds);

      // Check if more pages available
      if (searchResult.continue) {
        sroffset = searchResult.continue.sroffset;
        continueToken = searchResult.continue.continue;
        remaining -= pageIds.length;
      } else {
        // No more results
        break;
      }
    }

    if (allPageIds.length === 0) {
      return [];
    }

    // Step 2: Get page details (coordinates and thumbnails) for found pages
    // MediaWiki API allows up to 50 pageids per request, so we batch them
    const DETAILS_BATCH_SIZE = 50;
    const allLandmarks: Landmark[] = [];

    for (let i = 0; i < allPageIds.length; i += DETAILS_BATCH_SIZE) {
      const batchIds = allPageIds.slice(i, i + DETAILS_BATCH_SIZE);
      const pageIdsStr = batchIds.join('|');

      const detailsParams = new URLSearchParams({
        action: 'query',
        pageids: pageIdsStr,
        prop: 'pageimages|coordinates|description',
        piprop: 'thumbnail',
        pithumbsize: '100',
        format: 'json',
        origin: '*',
      });

      const detailsUrl = `${WIKIMEDIA_ENDPOINT}?${detailsParams.toString()}`;

      const detailsResponse = await fetch(detailsUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!detailsResponse.ok) {
        throw new Error(`HTTP error! status: ${detailsResponse.status}`);
      }

      const detailsResult: WikimediaPageDetailsResponse = await detailsResponse.json();

      if (detailsResult.error) {
        console.error('Wikimedia page details API error:', detailsResult.error);
        throw new Error(
          `Wikimedia API error: ${detailsResult.error.code} - ${detailsResult.error.info}`
        );
      }

      if (!detailsResult.query?.pages) {
        continue;
      }

      // Transform response to Landmark array
      const landmarks: Landmark[] = Object.values(detailsResult.query.pages)
        .filter(page => page.coordinates && page.coordinates.length > 0)
        .map(page => ({
          pageId: page.pageid,
          title: page.title,
          lat: page.coordinates![0].lat,
          lon: page.coordinates![0].lon,
          thumbnailUrl: page.thumbnail?.source || null,
          thumbnailWidth: page.thumbnail?.width || null,
          thumbnailHeight: page.thumbnail?.height || null,
          description: page.description,
        }));

      allLandmarks.push(...landmarks);
    }

    return allLandmarks;
  } catch (error) {
    console.error('Failed to fetch landmarks:', error);
    return [];
  }
}
