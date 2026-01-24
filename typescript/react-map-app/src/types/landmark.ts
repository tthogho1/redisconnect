// Landmark type definitions

export interface Landmark {
  pageId: number;
  title: string;
  lat: number;
  lon: number;
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
  radius: 50000,
  limit: 10,
};

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
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface LandmarkQueryParams {
  lat: number;
  lon: number;
  boundingBox?: BoundingBox;
  radius?: number;
  limit?: number;
}
