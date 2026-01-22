<<<<<<< HEAD
// Landmark type definitions for Wikimedia CirrusSearch API

=======
// Landmark型の定義
>>>>>>> 34edd2f (WIP: Temporary commit for ongoing work)
export interface Landmark {
  pageId: number;
  title: string;
  lat: number;
  lon: number;
<<<<<<< HEAD
  thumbnailUrl: string | null;
  thumbnailWidth: number | null;
  thumbnailHeight: number | null;
  description?: string;
}

// CirrusSearch API response for search results
export interface WikimediaCirrusSearchResponse {
  query?: {
    search: Array<{
      pageid: number;
      title: string;
      snippet?: string;
    }>;
  };
  continue?: {
    sroffset: number;
    continue: string;
  };
  error?: {
    code: string;
    info: string;
  };
}

// Response for page details (coordinates and images)
export interface WikimediaPageDetailsResponse {
  query?: {
    pages: {
      [pageId: string]: {
        pageid: number;
        title: string;
        thumbnail?: {
          source: string;
          width: number;
          height: number;
        };
        coordinates?: Array<{
          lat: number;
          lon: number;
        }>;
        description?: string;
      };
    };
  };
  error?: {
    code: string;
    info: string;
  };
}

export interface BoundingBox {
  north: number; // top latitude
  south: number; // bottom latitude
  east: number; // right longitude
  west: number; // left longitude
}

export interface LandmarkQueryParams {
  lat: number;
  lon: number;
  boundingBox?: BoundingBox; // For CirrusSearch bbox query
  radius?: number; // fallback radius in meters (no 10km limit with CirrusSearch)
  limit?: number; // default 10, max 500
}

export interface LandmarkSettings {
  radius: number; // meters (500-50000+ supported with CirrusSearch)
  limit: number; // count (1-50)
}
=======
  thumbnailUrl?: string | null;
  thumbnailWidth?: number | null;
  thumbnailHeight?: number | null;
  description?: string | null;
  [key: string]: any;
}

export interface LandmarkSettings {
  radius: number; // meters
  limit: number; // max results
}

export const landmarkSettings: LandmarkSettings = {
  radius: 50000, // 50km
  limit: 10,
};
>>>>>>> 34edd2f (WIP: Temporary commit for ongoing work)
