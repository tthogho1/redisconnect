# Go WebSocket Server

Go language implementation of the Flask-SocketIO server.

## Requirements

- Go 1.21 or higher
- Redis

## Setup

1. Install dependencies:

```bash
cd go
go mod download
```

2. Environment variable configuration:
   Create a `.env` file in the parent directory (or use an existing one)

## Run

```bash
go run main.go
```

## Main Features

- WebSocket communication (Socket.IO compatible)
- Location management using Redis GEO features
- Chat functionality (broadcast and private)
- HIGMA API integration
- RESTful API (user management)

## Endpoints

### WebSocket

- `ws://localhost:5000/socket.io/`

### REST API

- `GET /users` - Get all users
- `POST /users` - Create user
- `DELETE /users/:user_id` - Delete user

## Differences from Python Version

- Some behavior may differ due to different Socket.IO implementation
- Performance and concurrency improved due to Go's characteristics
