# Redis Connection Project

Real-time location sharing application using WebSocket + Redis + OpenStreetMap

## Project Structure

### Python (Flask + WebSocket + Redis)

- `python/flask-websocket-project/` - WebSocket Server
  - Real-time communication with Flask-SocketIO
  - Location management with Redis Geospatial Index
  - Swagger/OpenAPI documentation generation

### TypeScript (React + OpenStreetMap)

- `typescript/react-map-app/` - Frontend
  - React + TypeScript
  - OpenStreetMap (Leaflet)
  - Socket.IO Client
  - Real-time location display

## Setup

### Requirements

- Python 3.8+
- Node.js 16+
- Redis 7.0+

### Python Server

```bash
cd python/flask-websocket-project
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

Create `.env` file:

```env
HOST=your-redis-host
PORT=6379
REDIS_USERNAME=your-username
PASSWORD=your-password
APP_PORT=5000
```

Start server:

```bash
python app/websocket.py
```

### React Application

```bash
cd typescript/react-map-app
npm install
npm start
```

## Features

### WebSocket Server

- Receive and save user location (Redis GEO)
- Real-time broadcast
- REST API endpoints (GET/POST/DELETE)
- Swagger UI: `http://localhost:5000/apidocs`

### React Client

- Browser geolocation
- Real-time map display
- Color icons for each user
- Auto location update
- **Landmark display:**
  - Nearby landmarks are fetched from Wikimedia geosearch API and shown on the map with thumbnails and Wikipedia links.
  - Search radius and result count can be adjusted from the UI.
- **Geocoding search:**
  - Search for places, addresses, or countries using OpenStreetMap Nominatim API.
  - Jump to searched location on the map.
- **Hasura GraphQL integration:**
  - Airport data is fetched from Hasura GraphQL endpoint using environment variables for endpoint and secret.

## API

### WebSocket Events

- `location` - Send location
- `all_users` - Receive all users info
- `user_added` - New user notification
- `user_updated` - User update notification
- `user_deleted` - User deletion notification

### REST API

- `GET /users` - Get all users
- `POST /users` - Create user
- `DELETE /users/<id>` - Delete user

## License

MIT
