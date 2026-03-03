package services

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"net/url"
	"strconv"

	"github.com/tthogho1/redisconnect/go/models"
)

// WikimediaBaseURL is the base API endpoint for Wikipedia.
const WikimediaBaseURL = "https://en.wikipedia.org/w/api.php"

// --- Internal response structs for JSON decoding ---

type wmCoordinate struct {
	Lat float64 `json:"lat"`
	Lon float64 `json:"lon"`
}

type wmThumbnail struct {
	Source string `json:"source"`
	Width  int    `json:"width"`
	Height int    `json:"height"`
}

type wmPage struct {
	PageID      int64          `json:"pageid"`
	Title       string         `json:"title"`
	Coordinates []wmCoordinate `json:"coordinates"`
	Thumbnail   *wmThumbnail   `json:"thumbnail"`
	Description string         `json:"description"`
}

type wmQuery struct {
	Pages map[string]wmPage `json:"pages"`
}

type wmResponse struct {
	Query *wmQuery `json:"query"`
}

// SearchLandmarksNearby calls the Wikimedia API using nearcoord search
// and returns a slice of Landmark with basic info (no thumbnails).
func SearchLandmarksNearby(ctx context.Context, params models.LandmarkQueryParams) ([]models.Landmark, error) {
	radiusMeters := params.Radius
	if radiusMeters <= 0 {
		radiusMeters = 10000
	}
	km := int(math.Round(float64(radiusMeters) / 1000.0))

	limit := params.Limit
	if limit <= 0 {
		limit = 10
	}
	if limit > 500 {
		limit = 500
	}

	q := url.Values{}
	q.Set("action", "query")
	q.Set("generator", "search")
	q.Set("gsrsearch", fmt.Sprintf("nearcoord:%dkm,%f,%f", km, params.Lat, params.Lon))
	q.Set("gsrlimit", strconv.Itoa(limit))
	q.Set("prop", "coordinates|description")
	q.Set("colimit", strconv.Itoa(limit))
	q.Set("format", "json")
	q.Set("origin", "*")

	reqURL := WikimediaBaseURL + "?" + q.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("wikimedia: build request: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("wikimedia: search request: %w", err)
	}
	defer resp.Body.Close()

	var result wmResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("wikimedia: decode search response: %w", err)
	}

	if result.Query == nil {
		return []models.Landmark{}, nil
	}

	landmarks := make([]models.Landmark, 0, len(result.Query.Pages))
	for _, page := range result.Query.Pages {
		lm := models.Landmark{
			PageID: page.PageID,
			Title:  page.Title,
		}
		if len(page.Coordinates) > 0 {
			lm.Lat = page.Coordinates[0].Lat
			lm.Lon = page.Coordinates[0].Lon
		}
		if page.Description != "" {
			desc := page.Description
			lm.Description = &desc
		}
		landmarks = append(landmarks, lm)
	}

	return landmarks, nil
}

// FetchLandmarkDetails fetches details for a single page ID,
// including thumbnail and description. May return nil if not found.
func FetchLandmarkDetails(ctx context.Context, pageID int64) (*models.Landmark, error) {
	q := url.Values{}
	q.Set("action", "query")
	q.Set("pageids", strconv.FormatInt(pageID, 10))
	q.Set("prop", "pageimages|coordinates|description")
	q.Set("piprop", "thumbnail")
	q.Set("pithumbsize", "200")
	q.Set("format", "json")
	q.Set("origin", "*")

	reqURL := WikimediaBaseURL + "?" + q.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("wikimedia: build request: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("wikimedia: details request: %w", err)
	}
	defer resp.Body.Close()

	var result wmResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("wikimedia: decode details response: %w", err)
	}

	if result.Query == nil || len(result.Query.Pages) == 0 {
		return nil, nil
	}

	// The API returns a single page keyed by its page ID string.
	var page wmPage
	for _, p := range result.Query.Pages {
		page = p
		break
	}

	// PageID of -1 means the page was not found.
	if page.PageID <= 0 {
		return nil, nil
	}

	lm := &models.Landmark{
		PageID: page.PageID,
		Title:  page.Title,
	}

	if len(page.Coordinates) > 0 {
		lm.Lat = page.Coordinates[0].Lat
		lm.Lon = page.Coordinates[0].Lon
	}

	if page.Description != "" {
		desc := page.Description
		lm.Description = &desc
	}

	if page.Thumbnail != nil {
		src := page.Thumbnail.Source
		w := page.Thumbnail.Width
		h := page.Thumbnail.Height
		lm.ThumbnailURL = &src
		lm.ThumbnailWidth = &w
		lm.ThumbnailHeight = &h
	}

	return lm, nil
}
