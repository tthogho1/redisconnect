package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/tthogho1/redisconnect/go/models"
	"github.com/tthogho1/redisconnect/go/services"
)

// FetchLandmarks handles POST /fetchlandmarks.
// It binds the JSON body to FetchLandmarksInBoundsVars and delegates to
// services.FetchLandmarksInBounds.
func FetchLandmarks(c *gin.Context) {
	var vars models.FetchLandmarksInBoundsVars
	if err := c.ShouldBindJSON(&vars); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	landmarks, err := services.FetchLandmarksInBounds(c.Request.Context(), vars)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, landmarks)
}
