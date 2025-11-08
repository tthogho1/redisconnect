from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flasgger import Swagger
import os
import json
import redis
from dotenv import load_dotenv

load_dotenv(override=True)

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
swagger = Swagger(app)

# Redis connection
HOST = os.getenv("HOST")
PORT = int(os.getenv("PORT", "6379"))
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

GEO_KEY = "user_locations"


def get_all_users_from_redis():
    """Helper function to retrieve all users from Redis GEO index"""
    all_members = r.zrange(GEO_KEY, 0, -1)
    users = []
    for user_id in all_members:
        user_info_json = r.get(f"user_info:{user_id}")
        if user_info_json:
            user_info = json.loads(user_info_json)
            users.append(user_info)
    return users


@socketio.on("connect")
def handle_connect():
    emit("response", {"message": "Connected to WebSocket!"})


@socketio.on("message")
def handle_message(data):
    emit("response", {"message": f"Received message: {data}"}, broadcast=True)


@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected")


# WebSocket event to add/update user location
@socketio.on("location")
def handle_location(data):
    """Receive location payload via WebSocket and store in Redis GEO index.
    Expected JSON fields:
      name: string (required)
      latitude: float (required)
      longitude: float (required)
      id: optional string (if omitted a new id will be generated user_<seq>)
    Emits back 'location_ack' to sender and broadcasts 'user_added' or 'user_updated'.
    """
    if not isinstance(data, dict):
        emit("location_ack", {"error": "Payload must be JSON object"})
        return

    name = data.get("name")
    lat = data.get("latitude")
    lon = data.get("longitude")
    user_id = data.get("id") or name

    errors = []
    if not name:
        errors.append("name is required")

    # Validate and convert latitude
    lat_float = None
    try:
        lat_float = float(lat)
        if lat_float < -90 or lat_float > 90:
            errors.append("latitude must be between -90 and 90")
    except (TypeError, ValueError):
        errors.append("latitude must be a valid number")

    # Validate and convert longitude
    lon_float = None
    try:
        lon_float = float(lon)
        if lon_float < -180 or lon_float > 180:
            errors.append("longitude must be between -180 and 180")
    except (TypeError, ValueError):
        errors.append("longitude must be a valid number")

    if errors:
        emit("location_ack", {"errors": errors})
        return

    # Generate id if new
    new_generated = False
    if not user_id:
        user_id = f"user_{r.incr('user_seq')}"
        new_generated = True

    existing = r.get(f"user_info:{user_id}")

    # GEOADD: Redis geoadd expects mapping of member: (longitude, latitude)
    # Note: longitude comes first, then latitude
    try:
        # r.geoadd(GEO_KEY, mapping={user_id: (lon_float, lat_float)})
        r.geoadd(GEO_KEY, (lon_float, lat_float, user_id))
    except Exception as e:
        emit("location_ack", {"error": f"Failed to store location: {str(e)}"})
        return

    user_doc = {
        "id": user_id,
        "name": name,
        "latitude": lat_float,
        "longitude": lon_float,
    }
    r.set(f"user_info:{user_id}", json.dumps(user_doc))

    # Acknowledge to sender
    # emit("location_ack", {"status": "ok", **user_doc})

    # Broadcast change to all connected clients
    if existing:
        socketio.emit("user_updated", user_doc)
    else:
        socketio.emit("user_added", user_doc)

    # emit all users
    users = get_all_users_from_redis()
    socketio.emit("all_users", users)


"""HTTP endpoints for user management"""


@app.get("/users")
def get_all_users():
    """
    Get all users with their location information from Redis GEO index
    ---
    tags:
      - Users
    responses:
      200:
        description: List of all users with their locations
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: string
              name:
                type: string
              latitude:
                type: number
              longitude:
                type: number
    """
    try:
        users = get_all_users_from_redis()
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# HTTP endpoint to accept user data and store in Redis geospatial index
@app.post("/users")
def create_user():
    """
    Create a user and store location in Redis GEO index
    ---
    tags:
      - Users
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name
            - latitude
            - longitude
          properties:
            id:
              type: string
              example: user_123
            name:
              type: string
              example: Alice
            latitude:
              type: number
              format: float
              example: 35.6762
            longitude:
              type: number
              format: float
              example: 139.6503
    responses:
      201:
        description: User created
      400:
        description: Validation error
    """
    try:
        data = request.get_json(force=True, silent=False) or {}
    except Exception:
        return jsonify({"error": "Invalid JSON"}), 400

    # Validate required fields
    name = data.get("name")
    lat = data.get("latitude")
    lon = data.get("longitude")
    user_id = data.get("id") or name

    errors = []
    if not name:
        errors.append("name is required")
    try:
        lat = float(lat)
    except (TypeError, ValueError):
        errors.append("latitude must be a number")
    try:
        lon = float(lon)
    except (TypeError, ValueError):
        errors.append("longitude must be a number")
    if errors:
        return jsonify({"errors": errors}), 400

    # Store in geospatial index (member -> (lon, lat))
    r.geoadd(GEO_KEY, {user_id: (lon, lat)})

    # Store user info separately
    user_doc = {"id": user_id, "name": name, "latitude": lat, "longitude": lon}
    r.set(f"user_info:{user_id}", json.dumps(user_doc))

    # Optionally notify via WebSocket
    socketio.emit("user_added", user_doc)

    return jsonify(user_doc), 201


@app.delete("/users/<user_id>")
def delete_user(user_id: str):
    """
    Delete a user from Redis GEO index and info store
    ---
    tags:
        - Users
    parameters:
        - in: path
            name: user_id
            schema:
                type: string
            required: true
            description: User identifier
    responses:
        200:
            description: User deleted
        404:
            description: User not found
    """
    # Remove from GEO index
    removed = r.zrem(GEO_KEY, user_id)
    # Remove info
    info_removed = r.delete(f"user_info:{user_id}")

    if not removed and not info_removed:
        return jsonify({"error": "User not found"}), 404

    socketio.emit("user_deleted", {"id": user_id})
    return jsonify({"deleted": True, "id": user_id}), 200


def initialize_redis_data():
    """Initialize Redis with sample user data and geospatial index."""
    # Clear existing data
    r.delete(GEO_KEY)
    for key in r.scan_iter("user_info:*"):
        r.delete(key)
    r.set("user_seq", 0)


if __name__ == "__main__":
    # Initialize Redis data on server launch
    initialize_redis_data()
    app_port = int(os.getenv("APP_PORT", "5000"))
    print(f"\n==== Flask-SocketIO WebSocket Server starting on port {app_port} ====")
    print("Swagger UI: http://localhost:{}/apidocs".format(app_port))
    print("WebSocket endpoint: ws://localhost:{}/ (event: 'location')".format(app_port))
    print("HTTP POST /users, DELETE /users/<id> available.")
    print("Redis host:", HOST, "port:", PORT)
    socketio.run(app, host="0.0.0.0", port=app_port, debug=True)
