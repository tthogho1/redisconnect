package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"sync"

	socketio "github.com/doquangtan/socketio/v4"
	"github.com/gin-gonic/gin"
	"github.com/tthogho1/redisconnect/go/config"
	"github.com/tthogho1/redisconnect/go/handlers"
	"github.com/tthogho1/redisconnect/go/services"
)

var (
	userSIDMap  = make(map[string]*socketio.Socket) // Local user_id -> socket mapping (only for this instance)
	userSIDLock sync.RWMutex
	io          *socketio.Io
)

func main() {
	// Initialize environment
	config.InitEnv()

	// Initialize Redis
	config.InitRedis()

	// Initialize Socket.IO server
	io = socketio.New()

	// Enable authentication (optional)
	io.OnAuthentication(func(params map[string]string) bool {
		return true
	})

	// Initialize Redis Pub/Sub for clustering
	go services.InitializeRedisSubscriptions(io, userSIDMap, &userSIDLock)

	// Socket.IO connection handler
	io.OnConnection(func(socket *socketio.Socket) {
		log.Printf("✅ Client connected: %s", socket.Id)

		// Send all existing users to newly connected client
		allUsers := services.GetAllUsersFromRedis()
		socket.Emit("all_users", allUsers)
		log.Printf("📤 Sent %d users to client %s", len(allUsers), socket.Id)

		// Register event
		socket.On("register", func(event *socketio.EventPayload) {
			handlers.HandleRegister(socket, event, userSIDMap, &userSIDLock)
		})

		// Location event
		socket.On("location", func(event *socketio.EventPayload) {
			handlers.HandleLocation(socket, event, io)
		})

		// Chat broadcast event
		socket.On("chat_broadcast", func(event *socketio.EventPayload) {
			handlers.HandleChatBroadcast(socket, event)
		})

		// Chat private event
		socket.On("chat_private", func(event *socketio.EventPayload) {
			handlers.HandleChatPrivate(socket, event, userSIDMap, &userSIDLock)
		})

		// Disconnect event
		socket.On("disconnect", func(event *socketio.EventPayload) {
			log.Printf("Client disconnected: %s", socket.Id)
			handlers.HandleDisconnect(socket.Id, io, userSIDMap, &userSIDLock)
		})
	})

	// Initialize Redis data
	services.InitializeRedisData()

	// Register initial HIGMA user
	services.RegisterInitialUser(io)

	// Start expired user cleanup goroutine
	go services.CleanupExpiredUsers(func(userID string) {
		io.Emit("user_deleted", map[string]string{"id": userID})
	}, make(map[string]interface{}), &userSIDLock)

	// Setup Gin router
	router := gin.Default()

	// Serve static folder
	router.Static("/static", "./static/static")
	router.Static("/map", "./static")

	// CORS middleware
	router.Use(func(c *gin.Context) {
		 c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		 c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		 c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Origin")
		 c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		 if c.Request.Method == "OPTIONS" {
			  c.AbortWithStatus(204)
			  return
		 }
		 c.Next()
	})
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Origin")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

  //router.Any("/socket.io/*any", gin.WrapH(io.HttpHandler()))
	// Serve static folder (after socket route)
	// router.Static("/static", "./static/static")
	// router.Static("/map", "./static")

	// Health check endpoint for Fly.io
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// REST API endpoints
	router.GET("/users", handlers.GetAllUsers)
	router.POST("/users", func(c *gin.Context) {
		handlers.CreateUser(c, io)
	})
	router.PUT("/users/:user_id", func(c *gin.Context) {
		handlers.UpdateUser(c, io)
	})
	router.DELETE("/users/:user_id", func(c *gin.Context) {
		handlers.DeleteUser(c, io)
	})

	// Start server using combined handler
	// Socket.IO is handled directly by net/http (bypasses Gin) to support WebSocket hijacking
	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	log.Printf("\n==== Go WebSocket Server starting on port %s ====", port)
	log.Printf("WebSocket endpoint: ws://0.0.0.0:%s/socket.io/", port)
	log.Printf("HTTP endpoints: GET/POST /users, DELETE /users/<id>")
	log.Printf("Redis host: %s, port: %s", os.Getenv("REDIS_HOST"), os.Getenv("REDIS_PORT"))

	combinedHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// ✅ 修正: 末尾スラッシュ有無両対応
			if strings.HasPrefix(r.URL.Path, "/socket.io") {
					log.Printf("🔍 Socket.IO match: %s", r.URL.Path)  // デバッグ用
					io.HttpHandler().ServeHTTP(w, r)
					return
			}
			router.ServeHTTP(w, r)
	})

	if err := http.ListenAndServe("0.0.0.0:"+port, combinedHandler); err != nil {
		log.Fatal(err)
	}

}
