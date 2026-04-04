package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/tthogho1/redisconnect/go/models"
)

// FetchLandmarksInBounds queries the Wikimedia API for pages near the
// geographic bounds and returns a slice of Landmark with coordinates,
// thumbnail and description.
func FetchLandmarksInBounds(ctx context.Context, vars models.FetchLandmarksInBoundsVars) ([]models.Landmark, error) {
	centerLat := (vars.MinLat + vars.MaxLat) / 2.0
	centerLon := (vars.MinLon + vars.MaxLon) / 2.0

	radiusMeters := vars.Settings.Radius
	if radiusMeters <= 0 {
		radiusMeters = 50000 // default 50km
	}
	radiusKm := int(math.Round(float64(radiusMeters) / 1000.0))
	if radiusKm < 1 {
		radiusKm = 1
	}

	limit := vars.Settings.Limit
	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	log.Printf("FetchLandmarksInBounds: vars=%+v center=(%f,%f) radiusMeters=%d radiusKm=%d limit=%d",
		vars, centerLat, centerLon, radiusMeters, radiusKm, limit)

	gsrsearch := fmt.Sprintf(
		"nearcoord:%dkm,%f,%f hastemplate:\"Coord\"",
		radiusKm,
		centerLat,
		centerLon,
	)

	q := url.Values{}
	q.Set("action", "query")
	q.Set("generator", "search")
	q.Set("gsrsearch", gsrsearch)
	q.Set("gsrlimit", strconv.Itoa(limit))
	q.Set("prop", "coordinates|description|pageimages")
	q.Set("piprop", "thumbnail")
	q.Set("pithumbsize", "200")
	q.Set("format", "json")
	q.Set("origin", "*")

	reqURL := WikimediaBaseURL + "?" + q.Encode()

	log.Printf("FetchLandmarksInBounds: reqURL=%s", reqURL)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return []models.Landmark{}, fmt.Errorf("landmarks: build request: %w", err)
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "redisconnect/0.1 (github.com/tthogho1/redisconnect; contact:tthogho1@gmail.com)")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return []models.Landmark{}, fmt.Errorf("landmarks: http request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body for logging and robust decode errors.
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return []models.Landmark{}, fmt.Errorf("landmarks: read response body: %w", err)
	}

	log.Printf("FetchLandmarksInBounds: http status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(bodyBytes)))

	if resp.StatusCode != http.StatusOK {
		return []models.Landmark{}, fmt.Errorf("landmarks: http %d: %s", resp.StatusCode, strings.TrimSpace(string(bodyBytes)))
	}

	var result wmResponse
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		return []models.Landmark{}, fmt.Errorf("landmarks: decode response: %w; body=%s", err, strings.TrimSpace(string(bodyBytes)))
	}

	if result.Query == nil {
		return []models.Landmark{}, nil
	}

	landmarks := make([]models.Landmark, 0, len(result.Query.Pages))
	for _, page := range result.Query.Pages {
		if len(page.Coordinates) == 0 {
			continue
		}

		landmark := models.Landmark{
			PageID: page.PageID,
			Title:  page.Title,
			Lat:    page.Coordinates[0].Lat,
			Lon:    page.Coordinates[0].Lon,
		}

		if page.Thumbnail != nil {
			src := page.Thumbnail.Source
			w := page.Thumbnail.Width
			h := page.Thumbnail.Height
			landmark.ThumbnailURL = &src
			landmark.ThumbnailWidth = &w
			landmark.ThumbnailHeight = &h
		}

		if page.Description != "" {
			desc := page.Description
			landmark.Description = &desc
		}

		landmarks = append(landmarks, landmark)
	}

	if len(landmarks) > limit {
		landmarks = landmarks[:limit]
	}

	return landmarks, nil
}
