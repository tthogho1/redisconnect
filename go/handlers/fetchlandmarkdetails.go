package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/tthogho1/redisconnect/go/services"
)

// FetchLandmarkDetails handles POST /fetchlandmarkdetails.
// It binds the JSON body to a pageId field and delegates to
// services.FetchLandmarkDetails.
func FetchLandmarkDetails(c *gin.Context) {
	var body struct {
		PageID int64 `json:"pageId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	landmark, err := services.FetchLandmarkDetails(c.Request.Context(), body.PageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if landmark == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "landmark not found"})
		return
	}

	c.JSON(http.StatusOK, landmark)
}
