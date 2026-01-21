package handlers

import (
	"encoding/json"
	"net/http"

	socketio "github.com/doquangtan/socketio/v4"
	"github.com/gin-gonic/gin"
	"github.com/tthogho1/redisconnect/go/config"
	"github.com/tthogho1/redisconnect/go/models"
	"github.com/tthogho1/redisconnect/go/services"
)

// GetAllUsers returns all users from Redis
func GetAllUsers(c *gin.Context) {
	users := services.GetAllUsersFromRedis()
	c.JSON(http.StatusOK, users)
}

// CreateUser creates a new user
func CreateUser(c *gin.Context, io *socketio.Io) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := services.SaveUserToRedis(user.ID, user.Name, user.Latitude, user.Longitude); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	io.Emit("user_added", user)

	c.JSON(http.StatusCreated, user)
}

// DeleteUser deletes a user
func DeleteUser(c *gin.Context, io *socketio.Io) {
	userID := c.Param("user_id")

	if err := services.DeleteUserFromRedis(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	deleteData := map[string]string{"id": userID}
	deleteJSON, _ := json.Marshal(deleteData)
	config.Rdb.Publish(config.Ctx, services.UserDeletedChannel, string(deleteJSON))

	io.Emit("user_deleted", deleteData)

	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
}

// UpdateUser updates an existing user's info (name and/or location)
func UpdateUser(c *gin.Context, io *socketio.Io) {
	userID := c.Param("user_id")

	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ensure path user_id and payload ID are consistent when provided
	if user.ID != "" && user.ID != userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user ID in path and body do not match"})
		return
	}

	// Use name from payload if provided
	name := user.Name
	if name == "" {
		name = userID
	}

	if err := services.SaveUserToRedis(userID, name, user.Latitude, user.Longitude); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Publish update to other instances and notify connected clients
	locationData := map[string]interface{}{
		"id":        userID,
		"name":      name,
		"latitude":  user.Latitude,
		"longitude": user.Longitude,
	}
	locationJSON, _ := json.Marshal(locationData)
	config.Rdb.Publish(config.Ctx, services.UserLocationChannel, string(locationJSON))

	io.Emit("user_updated", locationData)

	c.JSON(http.StatusOK, locationData)
}
