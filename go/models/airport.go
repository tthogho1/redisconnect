package models

// Airport represents one airport result from the Hasura GraphQL endpoint.
type Airport struct {
	Name         string  `json:"name"`
	Type         string  `json:"type"`
	IataCode     *string `json:"iata_code,omitempty"`
	IcaoCode     *string `json:"icao_code,omitempty"`
	LatitudeDeg  float64 `json:"latitude_deg"`
	LongitudeDeg float64 `json:"longitude_deg"`
	HomeLink     *string `json:"home_link,omitempty"`
}

// AirportsQueryVariables holds the bounding-box parameters for FetchAirportsInBounds.
type AirportsQueryVariables struct {
	MinLat float64 `json:"minLat"`
	MaxLat float64 `json:"maxLat"`
	MinLon float64 `json:"minLon"`
	MaxLon float64 `json:"maxLon"`
}
