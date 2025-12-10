package handlers

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	socketio "github.com/doquangtan/socketio/v4"
	"github.com/tthogho1/redisconnect/go/config"
	"github.com/tthogho1/redisconnect/go/services"
)

// HandleRegister handles user registration events
func HandleRegister(socket *socketio.Socket, event *socketio.EventPayload, userSIDMap map[string]*socketio.Socket, userSIDLock *sync.RWMutex) {
	log.Printf("📥 Register event received, data length: %d", len(event.Data))
	var data map[string]interface{}

	if len(event.Data) > 0 {
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

	userSIDLock.Lock()
	userSIDMap[userID] = socket
	userSIDLock.Unlock()

	registrationData := map[string]interface{}{
		"user_id":    userID,
		"socket_id":  socket.Id,
		"registered": time.Now().Unix(),
	}
	registrationJSON, _ := json.Marshal(registrationData)
	config.Rdb.Set(config.Ctx, "user:registration:"+userID, string(registrationJSON), 5*time.Minute)

	log.Printf("✅ User registered: %s (socket: %s)", userID, socket.Id)

	socket.Emit("register_ack", map[string]interface{}{
		"status":  "ok",
		"user_id": userID,
	})
}

// HandleLocation handles user location updates
func HandleLocation(socket *socketio.Socket, event *socketio.EventPayload, io *socketio.Io) {
	log.Printf("📍 Location event received, data length: %d", len(event.Data))
	var data map[string]interface{}

	if len(event.Data) > 0 {
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

	if err := services.SaveUserToRedis(userID, name, latitude, longitude); err != nil {
		return
	}

	locationData := map[string]interface{}{
		"id":        userID,
		"name":      name,
		"latitude":  latitude,
		"longitude": longitude,
	}
	locationJSON, _ := json.Marshal(locationData)
	config.Rdb.Publish(config.Ctx, services.UserLocationChannel, string(locationJSON))

	io.Emit("user_updated", locationData)

	socket.Emit("location_ack", map[string]interface{}{
		"status": "ok",
	})
}

// HandleChatBroadcast handles broadcast chat messages
func HandleChatBroadcast(socket *socketio.Socket, event *socketio.EventPayload) {
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

	chatData := map[string]interface{}{
		"type":      "broadcast",
		"from":      fromUser,
		"from_name": fromName,
		"message":   message,
		"timestamp": timestamp,
	}
	chatJSON, _ := json.Marshal(chatData)
	config.Rdb.Publish(config.Ctx, services.ChatBroadcastChannel, string(chatJSON))
}

// HandleChatPrivate handles private chat messages
func HandleChatPrivate(socket *socketio.Socket, event *socketio.EventPayload, userSIDMap map[string]*socketio.Socket, userSIDLock *sync.RWMutex) {
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

	if toUser == "HIGMA" {
		go services.SendMessageToHIGMA(socket, fromUser, message, timestamp)
		log.Printf("Message sent to HIGMA API from %s", fromUser)
		return
	}

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
		log.Printf("Private message delivered to %s (local)", toUser)
	} else {
		chatData := map[string]interface{}{
			"type":      "private",
			"from":      fromUser,
			"from_name": fromName,
			"to":        toUser,
			"message":   message,
			"timestamp": timestamp,
		}
		chatJSON, _ := json.Marshal(chatData)
		config.Rdb.Publish(config.Ctx, services.ChatPrivateChannel, string(chatJSON))
		log.Printf("Private message published to Redis for %s (may be on another instance)", toUser)
	}
}

// HandleDisconnect handles client disconnection
func HandleDisconnect(socketID string, userSIDMap map[string]*socketio.Socket, userSIDLock *sync.RWMutex) {
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
