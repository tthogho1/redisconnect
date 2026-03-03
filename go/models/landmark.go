package models

// Landmark represents one Wikipedia landmark result.
type Landmark struct {
	PageID          int64   `json:"pageId"`
	Title           string  `json:"title"`
	Lat             float64 `json:"lat"`
	Lon             float64 `json:"lon"`
	ThumbnailURL    *string `json:"thumbnailUrl"`    // nil if not present
	ThumbnailWidth  *int    `json:"thumbnailWidth"`  // nil if not present
	ThumbnailHeight *int    `json:"thumbnailHeight"` // nil if not present
	Description     *string `json:"description"`     // nil if not present
}

// BoundingBox corresponds to { north, south, east, west }.
type BoundingBox struct {
	North float64 `json:"north"`
	South float64 `json:"south"`
	East  float64 `json:"east"`
	West  float64 `json:"west"`
}

// LandmarkQueryParams is the input to SearchLandmarksNearby.
type LandmarkQueryParams struct {
	Lat         float64      `json:"lat"`                   // required
	Lon         float64      `json:"lon"`                   // required
	BoundingBox *BoundingBox `json:"boundingBox,omitempty"` // optional
	Radius      int          `json:"radius,omitempty"`      // meters, default 10000
	Limit       int          `json:"limit,omitempty"`       // default 10, max 500
}

// FetchLandmarksInBoundsVars is the input to FetchLandmarksInBounds.
type FetchLandmarksInBoundsVars struct {
	MinLat   float64 `json:"minLat"` // south
	MaxLat   float64 `json:"maxLat"` // north
	MinLon   float64 `json:"minLon"` // west
	MaxLon   float64 `json:"maxLon"` // east
	Settings struct {
		Radius int `json:"radius,omitempty"` // meters, default 50000
		Limit  int `json:"limit,omitempty"`  // default 10, max 50
	} `json:"settings,omitempty"`
}
