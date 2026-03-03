package services

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/tthogho1/redisconnect/go/models"
)

// graphQL request/response types scoped to this file.

type airportsRequest struct {
	Query string `json:"query"`
}

type airportsResponse struct {
	Data struct {
		Airports []models.Airport `json:"airports"`
	} `json:"data"`
	Errors []struct {
		Message string `json:"message"`
	} `json:"errors"`
}

// FetchAirportsInBounds queries the Hasura GraphQL endpoint for airports within
// the given latitude/longitude bounds and returns matching Airport records.
// Heliports and closed airports are excluded.
func FetchAirportsInBounds(ctx context.Context, variables models.AirportsQueryVariables) ([]models.Airport, error) {
	query := fmt.Sprintf(`{
  airports(where: {
    type: { _nin: ["heliport", "closed"] },
    latitude_deg: { _gte: %f, _lte: %f },
    longitude_deg: { _gte: %f, _lte: %f }
  }) {
    name
    type
    iata_code
    icao_code
    latitude_deg
    longitude_deg
    home_link
  }
}`, variables.MinLat, variables.MaxLat, variables.MinLon, variables.MaxLon)

	body, err := json.Marshal(airportsRequest{Query: query})
	if err != nil {
		log.Printf("airports: marshal request: %v", err)
		return []models.Airport{}, err
	}

	endpoint := os.Getenv("HASURA_ENDPOINT")
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		log.Printf("airports: build request: %v", err)
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Hasura-Admin-Secret", os.Getenv("HASURA_ADMIN_SECRET"))

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("airports: http request: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	var result airportsResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Printf("airports: decode response: %v", err)
		return []models.Airport{}, err
	}

	if len(result.Errors) > 0 {
		log.Printf("airports: GraphQL errors: %v", result.Errors)
		return []models.Airport{}, errors.New("GraphQL query failed")
	}

	if result.Data.Airports == nil {
		return []models.Airport{}, nil
	}

	return result.Data.Airports, nil
}
