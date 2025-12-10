package services

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	socketio "github.com/doquangtan/socketio/v4"
)

// RegisterInitialUser registers the HIGMA user at startup
func RegisterInitialUser(io *socketio.Io) {
	userID := "HIGMA"
	latitude := 34.7642462
	longitude := 137.3875706

	log.Printf("📝 Registering initial user: %s", userID)

	DeleteUserFromRedis(userID)

	if err := SaveUserToRedis(userID, userID, latitude, longitude); err != nil {
		return
	}

	log.Printf("✅ HIGMA registered without expiration")
	log.Printf("✅ Registered initial user %s at position [%f, %f]", userID, longitude, latitude)

	io.Emit("user_added", map[string]interface{}{
		"id":        userID,
		"name":      userID,
		"latitude":  latitude,
		"longitude": longitude,
	})
	log.Printf("📡 Broadcasted HIGMA user to all clients")
}

// SendMessageToHIGMA sends a message to HIGMA API and returns the response
func SendMessageToHIGMA(socket *socketio.Socket, fromUser, message, timestamp string) {
	higmaAPIURL := os.Getenv("HIGMA_API_URL")
	if higmaAPIURL == "" {
		log.Println("HIGMA_API_URL not configured")
		return
	}

	reqBody := map[string]interface{}{
		"sender": fromUser,
		"query":  message,
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

	var responseData map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&responseData); err != nil {
		log.Printf("Error decoding HIGMA response: %v", err)
		return
	}

	var replyMessage string
	if reply, ok := responseData["answer"].(string); ok {
		replyMessage = reply
	} else {
		log.Printf("No reply message found in HIGMA response: %+v", responseData)
		return
	}

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
