package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	socketio "github.com/doquangtan/socketio/v4"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/joho/godotenv"
)

var (
	ctx         = context.Background()
	rdb         *redis.Client
	userSIDMap  = make(map[string]*socketio.Socket) // user_id -> socket
	userSIDLock sync.RWMutex
	geoKey      = "user_locations"
	io          *socketio.Io
)

// User represents user information
type User struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

// ChatMessage represents a chat message
type ChatMessage struct {
	Type      string `json:"type"`
	From      string `json:"from"`
	FromName  string `json:"from_name"`
	To        string `json:"to,omitempty"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp,omitempty"`
}

// LocationData represents location update data
type LocationData struct {
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	ID        string  `json:"id,omitempty"`
}

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize Redis
	initRedis()
	
	// Initialize Socket.IO server
	io = socketio.New()

	// Enable authentication (optional)
	io.OnAuthentication(func(params map[string]string) bool {
		// Accept all connections
		return true
	})

	// Socket.IO connection handler
	io.OnConnection(func(socket *socketio.Socket) {
		log.Printf("✅ Client connected: %s", socket.Id)

		// Send all existing users to newly connected client
		allUsers := getAllUsersFromRedis()
		socket.Emit("all_users", allUsers)
		log.Printf("📤 Sent %d users to client %s", len(allUsers), socket.Id)

		// Register event
		socket.On("register", func(event *socketio.EventPayload) {
			handleRegister(socket, event)
		})

		// Location event
		socket.On("location", func(event *socketio.EventPayload) {
			handleLocation(socket, event)
		})

		// Chat broadcast event
		socket.On("chat_broadcast", func(event *socketio.EventPayload) {
			handleChatBroadcast(socket, event)
		})

		// Chat private event
		socket.On("chat_private", func(event *socketio.EventPayload) {
			handleChatPrivate(socket, event)
		})

		// Disconnect event
		socket.On("disconnect", func(event *socketio.EventPayload) {
			log.Printf("Client disconnected: %s", socket.Id)
			handleDisconnect(socket.Id)
		})
	})

	// Initialize Redis data
	initializeRedisData()

	// Register initial HIGMA user
	registerInitialUser()

	// Start expired user cleanup goroutine
	go cleanupExpiredUsers()

	// Setup Gin router
	router := gin.Default()

  // staticフォルダ公開
	router.Static("/static", "./static/static")
  router.Static("/map", "./static")

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Socket.IO endpoint - use Any to handle all methods
	router.Any("/socket.io/*any", func(c *gin.Context) {
		io.HttpHandler().ServeHTTP(c.Writer, c.Request)
	})

	// REST API endpoints
	router.GET("/users", getAllUsers)
	router.POST("/users", createUser)
	router.DELETE("/users/:user_id", deleteUser)

	// Start server
	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "5000"
	}

	log.Printf("\n==== Go WebSocket Server starting on port %s ====", port)
	log.Printf("WebSocket endpoint: ws://localhost:%s/socket.io/", port)
	log.Printf("HTTP endpoints: GET/POST /users, DELETE /users/<id>")
	log.Printf("Redis host: %s, port: %s", os.Getenv("HOST"), os.Getenv("PORT"))

	if err := router.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

func initRedis() {
	host := os.Getenv("HOST")
	if host == "" {
		host = "127.0.0.1"
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "6379"
	}
	password := os.Getenv("PASSWORD")
	username := os.Getenv("REDIS_USERNAME")

	rdb = redis.NewClient(&redis.Options{
		Addr:     host + ":" + port,
		Username: username,
		Password: password,
		DB:       0,
	})

	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("Could not connect to Redis: %v", err)
	}
	log.Println("Successfully connected to Redis")
}

func initializeRedisData() {
	log.Println("🔄 Initializing Redis data...")
	
	// Delete all user-related keys
	keys, _ := rdb.Keys(ctx, "user_info:*").Result()
	if len(keys) > 0 {
		deleted, _ := rdb.Del(ctx, keys...).Result()
		log.Printf("✅ Deleted %d user_info keys", deleted)
	}
	
	// Delete GEO key
	deleted, _ := rdb.Del(ctx, geoKey).Result()
	if deleted > 0 {
		log.Printf("✅ Deleted GEO key: %s", geoKey)
	}
	
	log.Println("✅ Redis data initialized")
}

func registerInitialUser() {
	userID := "HIGMA"
	latitude := 34.7642462
	longitude := 137.3875706

	log.Printf("📝 Registering initial user: %s", userID)

	// Delete any existing HIGMA data first
	userKey := fmt.Sprintf("user_info:%s", userID)
	rdb.Del(ctx, userKey)
	rdb.ZRem(ctx, geoKey, userID)

	// Add to GEO index
	err := rdb.GeoAdd(ctx, geoKey, &redis.GeoLocation{
		Name:      userID,
		Longitude: longitude,
		Latitude:  latitude,
	}).Err()

	if err != nil {
		log.Printf("❌ Error adding HIGMA to GEO: %v", err)
		return
	}
	log.Printf("✅ Added HIGMA to GEO index")

	// Store user info as Hash
	userData := map[string]interface{}{
		"id":        userID,
		"name":      userID,
		"latitude":  latitude,
		"longitude": longitude,
	}

	err = rdb.HSet(ctx, userKey, userData).Err()
	if err != nil {
		log.Printf("❌ Error storing HIGMA user info: %v", err)
		return
	}

	// HIGMA does not expire - set no TTL
	log.Printf("✅ HIGMA registered without expiration")

	log.Printf("✅ Registered initial user %s at position [%f, %f]", userID, longitude, latitude)

	// Broadcast HIGMA to all connected clients
	io.Emit("user_added", map[string]interface{}{
		"id":        userID,
		"name":      userID,
		"latitude":  latitude,
		"longitude": longitude,
	})
	log.Printf("📡 Broadcasted HIGMA user to all clients")
}

func handleRegister(socket *socketio.Socket, event *socketio.EventPayload) {
	log.Printf("📥 Register event received, data length: %d", len(event.Data))
	var data map[string]interface{}
	
	if len(event.Data) > 0 {
		log.Printf("Event data[0]: %+v (type: %T)", event.Data[0], event.Data[0])
		var ok bool
		data, ok = event.Data[0].(map[string]interface{})
		if !ok {
			log.Printf("❌ Invalid register data format, received type: %T", event.Data[0])
			return
		}
	}

	userID, ok := data["user_id"].(string)
	if !ok {
		log.Printf("❌ user_id not found in register data: %+v", data)
		return
	}

	// Store socket in map
	userSIDLock.Lock()
	userSIDMap[userID] = socket
	userSIDLock.Unlock()

	log.Printf("✅ User registered: %s (socket: %s)", userID, socket.Id)
	
	// Send acknowledgement
	socket.Emit("register_ack", map[string]interface{}{
		"status":  "ok",
		"user_id": userID,
	})
}

func handleLocation(socket *socketio.Socket, event *socketio.EventPayload) {
	log.Printf("📍 Location event received, data length: %d", len(event.Data))
	var data map[string]interface{}
	
	if len(event.Data) > 0 {
		log.Printf("Event data[0]: %+v (type: %T)", event.Data[0], event.Data[0])
		var ok bool
		data, ok = event.Data[0].(map[string]interface{})
		if !ok {
			log.Printf("❌ Invalid location data format, received type: %T", event.Data[0])
			return
		}
	}

	userID, _ := data["id"].(string)
	name, _ := data["name"].(string)
	latitude, _ := data["latitude"].(float64)
	longitude, _ := data["longitude"].(float64)

	// Store user info
	userKey := fmt.Sprintf("user_info:%s", userID)
	
	// Check if key exists with wrong type and delete it
	keyType, err := rdb.Type(ctx, userKey).Result()
	if err == nil && keyType != "hash" && keyType != "none" {
		log.Printf("⚠️ Key %s has wrong type (%s), deleting...", userKey, keyType)
		rdb.Del(ctx, userKey)
	}
	
	userData := map[string]interface{}{
		"id":        userID,
		"name":      name,
		"latitude":  latitude,
		"longitude": longitude,
	}

	if err := rdb.HSet(ctx, userKey, userData).Err(); err != nil {
		log.Printf("❌ Error storing user info: %v", err)
		return
	}

	// Set TTL to 60 seconds - key will expire if not updated
	// But don't set TTL for HIGMA user (permanent)
	if userID != "HIGMA" {
		if err := rdb.Expire(ctx, userKey, 60*time.Second).Err(); err != nil {
			log.Printf("⚠️ Error setting TTL for %s: %v", userKey, err)
		}
	}

	// Store geospatial location
	if err := rdb.GeoAdd(ctx, geoKey, &redis.GeoLocation{
		Name:      userID,
		Longitude: longitude,
		Latitude:  latitude,
	}).Err(); err != nil {
		log.Printf("❌ Error storing location: %v", err)
		return
	}

	log.Printf("✅ Location saved to Redis: %s (%s) at (%f, %f)", name, userID, latitude, longitude)

	// Broadcast to all clients
	io.Emit("user_updated", data)
	
	// Send acknowledgement
	socket.Emit("location_ack", map[string]interface{}{
		"status": "ok",
	})
}

func handleChatBroadcast(socket *socketio.Socket, event *socketio.EventPayload) {
	log.Printf("💬 Chat broadcast event received, data length: %d", len(event.Data))
	var data map[string]interface{}
	
	if len(event.Data) > 0 {
		var ok bool
		data, ok = event.Data[0].(map[string]interface{})
		if !ok {
			log.Printf("❌ Invalid chat broadcast data format, received type: %T", event.Data[0])
			return
		}
	}

	fromUser, _ := data["from"].(string)
	fromName, _ := data["from_name"].(string)
	message, _ := data["message"].(string)
	timestamp, _ := data["timestamp"].(string)

	log.Printf("Chat broadcast from %s (%s): %s", fromName, fromUser, message)

	// Broadcast to all clients
	io.Emit("chat_message", map[string]interface{}{
		"type":      "broadcast",
		"from":      fromUser,
		"from_name": fromName,
		"message":   message,
		"timestamp": timestamp,
	})
}

func handleChatPrivate(socket *socketio.Socket, event *socketio.EventPayload) {
	log.Printf("💬 Chat private event received, data length: %d", len(event.Data))
	var data map[string]interface{}
	
	if len(event.Data) > 0 {
		var ok bool
		data, ok = event.Data[0].(map[string]interface{})
		if !ok {
			log.Printf("❌ Invalid chat private data format, received type: %T", event.Data[0])
			return
		}
	}

	fromUser, _ := data["from"].(string)
	fromName, _ := data["from_name"].(string)
	toUser, _ := data["to"].(string)
	message, _ := data["message"].(string)
	timestamp, _ := data["timestamp"].(string)

	log.Printf("Chat private from %s (%s) to %s: %s", fromName, fromUser, toUser, message)

	// Check if recipient is HIGMA
	if toUser == "HIGMA" {
		go sendMessageToHIGMA(socket, fromUser, message, timestamp)
		// Don't try to deliver to HIGMA socket since it's a virtual user
		log.Printf("Message sent to HIGMA API from %s", fromUser)
		return
	}

	// Send to recipient
	userSIDLock.RLock()
	recipientSocket, exists := userSIDMap[toUser]
	userSIDLock.RUnlock()

	if exists {
		recipientSocket.Emit("chat_message", map[string]interface{}{
			"type":      "private",
			"from":      fromUser,
			"from_name": fromName,
			"to":        toUser,
			"message":   message,
			"timestamp": timestamp,
		})
		log.Printf("Private message delivered to %s", toUser)
	} else {
		log.Printf("Recipient %s not found", toUser)
		socket.Emit("chat_error", map[string]interface{}{
			"error":   "User not connected",
			"user_id": toUser,
		})
	}
}

func sendMessageToHIGMA(socket *socketio.Socket, fromUser, message, timestamp string) {
	higmaAPIURL := os.Getenv("HIGMA_API_URL")
	if higmaAPIURL == "" {
		log.Println("HIGMA_API_URL not configured")
		return
	}

	reqBody := map[string]interface{}{
		"sender":  fromUser,
		"query": message,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		log.Printf("Error marshaling HIGMA request: %v", err)
		return
	}

	resp, err := http.Post(higmaAPIURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Error calling HIGMA API: %v", err)
		return
	}
	defer resp.Body.Close()

	log.Printf("HIGMA API called successfully for message from %s (status: %d)", fromUser, resp.StatusCode)

	// Read response body
	var responseData map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&responseData); err != nil {
		log.Printf("Error decoding HIGMA response: %v", err)
		return
	}

	// Extract reply message from response
	var replyMessage string
	if reply, ok := responseData["answer"].(string); ok {
		replyMessage = reply
	} else {
		log.Printf("No reply message found in HIGMA response: %+v", responseData)
		return
	}

	// Send HIGMA's reply back to the user
	socket.Emit("chat_message", map[string]interface{}{
		"type":      "private",
		"from":      "HIGMA",
		"from_name": "HIGMA",
		"to":        fromUser,
		"message":   replyMessage,
		"timestamp": time.Now().Format(time.RFC3339),
	})

	log.Printf("HIGMA reply sent to %s: %s", fromUser, replyMessage)
}

func handleDisconnect(socketID string) {
	// Remove from userSIDMap
	userSIDLock.Lock()
	for userID, socket := range userSIDMap {
		if socket.Id == socketID {
			delete(userSIDMap, userID)
			log.Printf("Removed user %s from map", userID)
			break
		}
	}
	userSIDLock.Unlock()
}

// Cleanup expired users from Redis and notify clients
func cleanupExpiredUsers() {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	lastKnownUsers := make(map[string]bool)

	for range ticker.C {
		log.Println("🔍 Checking for expired users...")
		currentUsers := getAllUsersFromRedis()
		currentUserMap := make(map[string]bool)
		log.Printf("📊 Current users in Redis: %d", len(currentUsers))

		// Build map of current users
		for _, user := range currentUsers {
			currentUserMap[user.ID] = true
		}

		// Find users that were present before but are now gone
		for userID := range lastKnownUsers {
			if !currentUserMap[userID] {
				// User expired
				log.Printf("⏰ User %s expired (no update for 60s)", userID)
				
				// Remove from GEO index
				rdb.ZRem(ctx, geoKey, userID)
				
				// Broadcast deletion to all clients
				io.Emit("user_deleted", map[string]string{"id": userID})
				
				// Remove from socket map
				userSIDLock.Lock()
				delete(userSIDMap, userID)
				userSIDLock.Unlock()
			}
		}

		// Update last known users
		lastKnownUsers = currentUserMap
	}
}

// Helper function to get all users from Redis
func getAllUsersFromRedis() []User {
	keys, err := rdb.Keys(ctx, "user_info:*").Result()
	if err != nil {
		log.Printf("❌ Error getting user keys: %v", err)
		return []User{}
	}

	users := []User{}
	for _, key := range keys {
		userData, err := rdb.HGetAll(ctx, key).Result()
		if err != nil {
			log.Printf("⚠️ Error getting user data for key %s: %v", key, err)
			continue
		}

		if userData["id"] == "" {
			continue
		}

		user := User{
			ID:   userData["id"],
			Name: userData["name"],
		}

		// Get latitude and longitude from hash
		if lat, err := rdb.HGet(ctx, key, "latitude").Float64(); err == nil {
			user.Latitude = lat
		}
		if lon, err := rdb.HGet(ctx, key, "longitude").Float64(); err == nil {
			user.Longitude = lon
		}

		users = append(users, user)
	}

	return users
}

// REST API Handlers
func getAllUsers(c *gin.Context) {
	users := getAllUsersFromRedis()
	c.JSON(http.StatusOK, users)
}

func createUser(c *gin.Context) {
	var user User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userKey := fmt.Sprintf("user_info:%s", user.ID)
	userData := map[string]interface{}{
		"id":        user.ID,
		"name":      user.Name,
		"latitude":  user.Latitude,
		"longitude": user.Longitude,
	}

	if err := rdb.HSet(ctx, userKey, userData).Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := rdb.GeoAdd(ctx, geoKey, &redis.GeoLocation{
		Name:      user.ID,
		Longitude: user.Longitude,
		Latitude:  user.Latitude,
	}).Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Broadcast new user to all clients
	io.Emit("user_added", user)

	c.JSON(http.StatusCreated, user)
}

func deleteUser(c *gin.Context) {
	userID := c.Param("user_id")
	userKey := fmt.Sprintf("user_info:%s", userID)

	if err := rdb.Del(ctx, userKey).Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := rdb.ZRem(ctx, geoKey, userID).Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Broadcast user deletion
	io.Emit("user_deleted", map[string]string{"id": userID})

	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
}
