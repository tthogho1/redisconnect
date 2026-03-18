package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/tthogho1/redisconnect/go/models"
	"github.com/tthogho1/redisconnect/go/services"
)

// SearchLandmarksNearby handles POST /searchlandmarksnearby.
// It binds the JSON body to LandmarkQueryParams and delegates to
// services.SearchLandmarksNearby.
func SearchLandmarksNearby(c *gin.Context) {
	var params models.LandmarkQueryParams
	if err := c.ShouldBindJSON(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	landmarks, err := services.SearchLandmarksNearby(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, landmarks)
}
