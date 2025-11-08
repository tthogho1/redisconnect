# Flask WebSocket + Redis Geospatial Example

A minimal Flask + Flask-SocketIO server with Redis integration for geospatial indexing of user locations, plus Swagger (OpenAPI) docs.

## Features

- WebSocket server using Flask-SocketIO
- HTTP POST `/users` to add a user with latitude/longitude into a Redis GEO index
- HTTP DELETE `/users/<id>` to remove a user from the index and key-value store
- Broadcast `user_added` and `user_deleted` events to connected WebSocket clients
- Swagger UI (via Flasgger) for interactive API documentation

## Requirements

- Python 3.9+
- Redis server accessible from the app

## Setup

1. Create and activate a virtual environment (Windows PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Configure environment variables in a `.env` file at repo root or this folder:

```
HOST=127.0.0.1
PORT=6379
REDIS_USERNAME=
PASSWORD=
```

## Run

Start the server:

```powershell
python .\app\websocket.py
```

It will listen on `http://127.0.0.1:5000` (and `0.0.0.0:5000`).

## API

### POST /users

Create a user and store location in Redis GEO index.

- Body JSON: `{ "name": "Alice", "latitude": 35.6762, "longitude": 139.6503, "id": "user_123" (optional) }`
- Returns: `201 Created` with user JSON `{ id, name, latitude, longitude }`

### DELETE /users/<id>

Delete a user from the geospatial index and info store.

- Returns: `200 OK` on success; `404 Not Found` if user doesn't exist

## WebSocket Events

- `user_added`: emitted with `{ id, name, latitude, longitude }`
- `user_deleted`: emitted with `{ id }`

## Swagger UI

Open Swagger UI in your browser at:

```
http://127.0.0.1:5000/apidocs
```

## Notes

- GEOADD is used with `GEO_KEY = "user_locations"`.
- User metadata is stored at keys like `user_info:{id}`.
- Ensure your Redis instance is reachable using the environment variables above.
