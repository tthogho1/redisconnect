package services

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/tthogho1/redisconnect/go/config"
	"github.com/tthogho1/redisconnect/go/models"
)

// GeoKey is the Redis key for geospatial data
const GeoKey = "user_locations"

// InitializeRedisData clears all user data from Redis
func InitializeRedisData() {
	log.Println("🔄 Initializing Redis data...")

	keys, _ := config.Rdb.Keys(config.Ctx, "user_info:*").Result()
	if len(keys) > 0 {
		deleted, _ := config.Rdb.Del(config.Ctx, keys...).Result()
		log.Printf("✅ Deleted %d user_info keys", deleted)
	}

	deleted, _ := config.Rdb.Del(config.Ctx, GeoKey).Result()
	if deleted > 0 {
		log.Printf("✅ Deleted GEO key: %s", GeoKey)
	}

	log.Println("✅ Redis data initialized")
}

// GetAllUsersFromRedis retrieves all users from Redis
func GetAllUsersFromRedis() []models.User {
	keys, err := config.Rdb.Keys(config.Ctx, "user_info:*").Result()
	if err != nil {
		log.Printf("❌ Error getting user keys: %v", err)
		return []models.User{}
	}

	users := []models.User{}
	for _, key := range keys {
		userData, err := config.Rdb.HGetAll(config.Ctx, key).Result()
		if err != nil {
			log.Printf("⚠️ Error getting user data for key %s: %v", key, err)
			continue
		}

		if userData["id"] == "" {
			continue
		}

		user := models.User{
			ID:   userData["id"],
			Name: userData["name"],
		}

		if lat, err := config.Rdb.HGet(config.Ctx, key, "latitude").Float64(); err == nil {
			user.Latitude = lat
		}
		if lon, err := config.Rdb.HGet(config.Ctx, key, "longitude").Float64(); err == nil {
			user.Longitude = lon
		}

		users = append(users, user)
	}

	return users
}

// SaveUserToRedis saves user information and location to Redis
func SaveUserToRedis(userID, name string, latitude, longitude float64) error {
	userKey := fmt.Sprintf("user_info:%s", userID)

	keyType, err := config.Rdb.Type(config.Ctx, userKey).Result()
	if err == nil && keyType != "hash" && keyType != "none" {
		log.Printf("⚠️ Key %s has wrong type (%s), deleting...", userKey, keyType)
		config.Rdb.Del(config.Ctx, userKey)
	}

	userData := map[string]interface{}{
		"id":        userID,
		"name":      name,
		"latitude":  latitude,
		"longitude": longitude,
	}

	if err := config.Rdb.HSet(config.Ctx, userKey, userData).Err(); err != nil {
		log.Printf("❌ Error storing user info: %v", err)
		return err
	}

	if userID != "HIGMA" {
		if err := config.Rdb.Expire(config.Ctx, userKey, 60*time.Second).Err(); err != nil {
			log.Printf("⚠️ Error setting TTL for %s: %v", userKey, err)
		}
	}

	if err := config.Rdb.GeoAdd(config.Ctx, GeoKey, &redis.GeoLocation{
		Name:      userID,
		Longitude: longitude,
		Latitude:  latitude,
	}).Err(); err != nil {
		log.Printf("❌ Error storing location: %v", err)
		return err
	}

	log.Printf("✅ Location saved to Redis: %s (%s) at (%f, %f)", name, userID, latitude, longitude)
	return nil
}

// DeleteUserFromRedis removes a user from Redis
func DeleteUserFromRedis(userID string) error {
	userKey := fmt.Sprintf("user_info:%s", userID)

	if err := config.Rdb.Del(config.Ctx, userKey).Err(); err != nil {
		return err
	}

	if err := config.Rdb.ZRem(config.Ctx, GeoKey, userID).Err(); err != nil {
		return err
	}

	return nil
}

// CleanupExpiredUsers periodically checks for expired users
func CleanupExpiredUsers(onUserExpired func(string), userSIDMap map[string]interface{}, userSIDLock *sync.RWMutex) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	lastKnownUsers := make(map[string]bool)

	for range ticker.C {
		log.Println("🔍 Checking for expired users...")
		currentUsers := GetAllUsersFromRedis()
		currentUserMap := make(map[string]bool)
		log.Printf("📊 Current users in Redis: %d", len(currentUsers))

		for _, user := range currentUsers {
			currentUserMap[user.ID] = true
		}

		for userID := range lastKnownUsers {
			if !currentUserMap[userID] {
				log.Printf("⏰ User %s expired (no update for 60s)", userID)
				config.Rdb.ZRem(config.Ctx, GeoKey, userID)
				
				// Call the callback function
				onUserExpired(userID)

				// Remove from socket map
				userSIDLock.Lock()
				delete(userSIDMap, userID)
				userSIDLock.Unlock()
			}
		}

		lastKnownUsers = currentUserMap
	}
}
