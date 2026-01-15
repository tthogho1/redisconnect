"""Basic connection example."""

import redis
from dotenv import load_dotenv
import os
import json

load_dotenv(override=True)

HOST = os.getenv("HOST")
PORT = int(os.getenv("PORT"))
REDIS_USERNAME = os.getenv("REDIS_USERNAME")
PASSWORD = os.getenv("PASSWORD")

pool = redis.ConnectionPool(
    host=HOST,
    port=PORT,
    decode_responses=True,
    username=REDIS_USERNAME,
    password=PASSWORD,
    max_connections=10,
)

r = redis.Redis(connection_pool=pool)

# Register user information and location data in JSON format
user_locations = {
    "user_001": {"name": "Alice", "latitude": 35.6762, "longitude": 139.6503},
    "user_002": {"name": "Bob", "latitude": 34.6937, "longitude": 135.5023},
    "user_003": {"name": "Charlie", "latitude": 43.0642, "longitude": 141.3469},
}

# Add user locations to Geospatial index
geo_key = "user_locations"
print("Adding users to geospatial index...")
for user_key, user_data in user_locations.items():
    # GEOADD: longitude, latitude, member
    r.geoadd(geo_key, (user_data["longitude"], user_data["latitude"], user_key))
    print(f"Added to geo index: {user_key} - {user_data['name']}")

    # Also save user info separately (for name and additional info)
    user_json = json.dumps(user_data)
    r.set(f"user_info:{user_key}", user_json)

# Data verification
success = r.set("foo", "bar")
# True

result = r.get("foo")
print(f"\nSimple data: {result}")

# Geospatial query examples
print("\n=== Geospatial Query Examples ===")

# 1. Get position of specific user
print("\n1. Get position of user_001:")
pos = r.geopos(geo_key, "user_001")
print(f"Position: {pos}")

# 2. Calculate distance between two points
print("\n2. Distance between user_001 and user_002:")
distance = r.geodist(geo_key, "user_001", "user_002", unit="km")
print(f"Distance: {distance} km")

# 3. Search for users within radius from specific location (50km around Tokyo Station)
print("\n3. Users within 50km of Tokyo Station (35.6812, 139.7671):")
nearby = r.georadius(geo_key, 139.7671, 35.6812, 50, unit="km", withdist=True)
for user, dist in nearby:
    user_info = json.loads(r.get(f"user_info:{user}"))
    print(f"  {user} ({user_info['name']}): {dist} km away")

# 4. Search for other users within radius from specific user
print("\n4. Users within 500km of user_001:")
nearby_users = r.georadiusbymember(geo_key, "user_001", 500, unit="km", withdist=True)
for user, dist in nearby_users:
    user_info = json.loads(r.get(f"user_info:{user}"))
    print(f"  {user} ({user_info['name']}): {dist} km away")

# Retrieve data registered in JSON format
print("\n=== User Information ===")
for user_key in user_locations.keys():
    user_json = r.get(f"user_info:{user_key}")
    user_data = json.loads(user_json)
    print(f"{user_key}: {user_data}")
