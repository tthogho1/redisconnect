package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/tthogho1/redisconnect/go/models"
	"github.com/tthogho1/redisconnect/go/services"
)

// FetchAirportsInBounds handles POST /fetchairportsinbounds.
// It binds the JSON body to AirportsQueryVariables and delegates to
// services.FetchAirportsInBounds.
func FetchAirportsInBounds(c *gin.Context) {
	var vars models.AirportsQueryVariables
	if err := c.ShouldBindJSON(&vars); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	airports, err := services.FetchAirportsInBounds(c.Request.Context(), vars)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, airports)
}
