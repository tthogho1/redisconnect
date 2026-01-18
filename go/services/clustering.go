package services

import (
	"encoding/json"
	"log"
	"sync"

	socketio "github.com/doquangtan/socketio/v4"
	"github.com/tthogho1/redisconnect/go/config"
)

// Redis channel constants for clustering
const (
	UserLocationChannel  = "user:location"
	ChatBroadcastChannel = "chat:broadcast"
	ChatPrivateChannel   = "chat:private"
	UserDeletedChannel   = "user:deleted"
)

// InitializeRedisSubscriptions subscribes to Redis channels for clustering support
func InitializeRedisSubscriptions(io *socketio.Io, userSIDMap map[string]*socketio.Socket, userSIDLock *sync.RWMutex) {
	pubsub := config.Rdb.Subscribe(config.Ctx, ChatBroadcastChannel, ChatPrivateChannel, UserLocationChannel, UserDeletedChannel)
	defer pubsub.Close()

	channel := pubsub.Channel()
	for msg := range channel {
		switch msg.Channel {
		case ChatBroadcastChannel:
			// Handle broadcast messages from other instances
			var chatData map[string]interface{}
			json.Unmarshal([]byte(msg.Payload), &chatData)
			io.Emit("chat_message", chatData)
			log.Printf("📡 Received broadcast message from Redis: %v", chatData)

		case ChatPrivateChannel:
			// Handle private messages directed to users on this instance
			var chatData map[string]interface{}
			json.Unmarshal([]byte(msg.Payload), &chatData)
			toUser, _ := chatData["to"].(string)

			userSIDLock.RLock()
			recipientSocket, exists := userSIDMap[toUser]
			userSIDLock.RUnlock()

			if exists {
				recipientSocket.Emit("chat_message", chatData)
				log.Printf("📡 Delivered private message to local user %s", toUser)
			}

		case UserLocationChannel:
			// Handle location updates from other instances
			var locationData map[string]interface{}
			json.Unmarshal([]byte(msg.Payload), &locationData)
			io.Emit("user_updated", locationData)
			// Logging disabled to reduce log noise

		case UserDeletedChannel:
			// Handle user deletions from other instances
			var deleteData map[string]string
			json.Unmarshal([]byte(msg.Payload), &deleteData)
			io.Emit("user_deleted", deleteData)
			log.Printf("📡 Received user deletion from Redis: %v", deleteData)
		}
	}
}
