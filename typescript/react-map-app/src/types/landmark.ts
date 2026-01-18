// Landmark type definitions for Wikimedia geosearch API

export interface Landmark {
  pageId: number;
  title: string;
  lat: number;
  lon: number;
  thumbnailUrl: string | null;
  thumbnailWidth: number | null;
  thumbnailHeight: number | null;
}

export interface WikimediaGeosearchResponse {
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
      };
    };
  };
  error?: {
    code: string;
    info: string;
  };
}

export interface LandmarkQueryParams {
  lat: number;
  lon: number;
  radius?: number; // default 10000 (meters), max 10000
  limit?: number; // default 10, max 500
}

export interface LandmarkSettings {
  radius: number; // meters (500-10000)
  limit: number; // count (1-50)
}
