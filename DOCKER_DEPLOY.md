# Docker Deployment Guide

A guide for running this project with Docker.

## 📋 Prerequisites

- Docker Desktop installed
- Docker Compose installed

## 🚀 Starting Services

### 1. Build and start all services

```powershell
docker-compose up --build
```

### 2. Start in background

```powershell
docker-compose up -d --build
```

### 3. Start specific services only

```powershell
# Go server only
docker-compose up go-server

# gosignaling only
docker-compose up gosignaling
```

## 🛑 Stopping Services

### Stop all services

```powershell
docker-compose down
```

### Stop and remove data volumes

```powershell
docker-compose down -v
```

## 🔍 Viewing Logs

### All services logs

```powershell
docker-compose logs -f
```

### Specific service logs

```powershell
docker-compose logs -f go-server
docker-compose logs -f gosignaling
```

## 📦 Service Configuration

### 1. **go-server** (Port: 5000)

- WebSocket server + React frontend
- Connects to external Redis Cloud
- Endpoints:
  - `http://localhost:5000` - React app
  - `http://localhost:5000/map` - Map display
  - `ws://localhost:5000/socket.io/` - WebSocket connection

### 2. **gosignaling** (Port: 8080)

- WebRTC signaling server
- Endpoints:
  - `ws://localhost:8080/ws` - WebSocket connection

## ⚙️ Environment Variable Configuration

Create a `.env` file in the project root and set the required environment variables:

```env
# Redis Cloud connection info
REDIS_HOST=redis-xxxxx.c123.us-east-1-4.ec2.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your-redis-password
REDIS_USERNAME=default

# HIGMA API
HIGMA_API_URL=https://your-higma-api.example.com/api
```

**Important**: Redis Cloud connection information is required. Startup will fail if the `.env` file is missing.

## 🔧 Development Usage

### Rebuild after code changes

```powershell
docker-compose up --build go-server
```

### Restart specific service

```powershell
docker-compose restart go-server
```

### Enter container

```powershell
docker exec -it redisconnect-go-server sh
docker exec -it redisconnect-gosignaling sh
```

## 📂 Directory Structure

```
redisconnect/
├── docker-compose.yml          # Main Compose file
├── .dockerignore              # Files to exclude during Docker build
├── go/
│   ├── Dockerfile             # Go server Dockerfile
│   ├── .dockerignore
│   └── main.go
├── gosignaling/
│   ├── Dockerfile             # gosignaling Dockerfile
│   ├── .dockerignore
│   └── main.go
└── typescript/
    └── react-map-app/         # React frontend (used during Docker build)
```

## 🐛 Troubleshooting

### Port already in use

If another service is using the port, modify the port mapping in `docker-compose.yml`:

```yaml
ports:
  - '15000:5000' # external port:container port
```

### Redis connection error

If there are issues connecting to Redis Cloud, check the environment variables:

```powershell
# Check .env file contents
cat .env

# Check Go server logs
docker-compose logs go-server
```

Verify the connection information is correct:

- `REDIS_HOST`: Redis Cloud hostname
- `REDIS_PORT`: Redis Cloud port number
- `REDIS_PASSWORD`: Redis Cloud password

### Build error

Clear cache and rebuild:

```powershell
docker-compose build --no-cache
docker-compose up
```

## 🔄 Update Procedure

1. Make code changes
2. Commit with Git
3. Rebuild Docker image

```powershell
docker-compose down
docker-compose up --build
```

## 📝 Notes

- **Redis Cloud**: This project uses an external Redis Cloud service. Set the connection information in the `.env` file
- **React Build**: The React app is automatically built inside `go/Dockerfile` and copied to the `static` folder
- **Environment Variables**: In production, use the `.env` file to securely manage sensitive information
