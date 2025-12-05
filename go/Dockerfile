# Multi-stage build for Go server with React frontend

# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy gosignaling webrtc-wasm (required dependency)
COPY gosignaling/webrtc-wasm ./gosignaling/webrtc-wasm

# Copy React app package files
COPY typescript/react-map-app/package*.json ./typescript/react-map-app/

# Install dependencies
WORKDIR /app/typescript/react-map-app
RUN npm ci

# Copy React source code
COPY typescript/react-map-app/ ./

# Build React app
RUN npm run build

# Stage 2: Build Go server
FROM golang:1.22-alpine AS go-builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy go.mod and go.sum
COPY go/go.mod go/go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY go/ ./

# Build Go binary
RUN CGO_ENABLED=0 GOOS=linux go build -o server main.go

# Stage 3: Final runtime image
FROM alpine:latest

WORKDIR /app

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates

# Copy Go binary from builder
COPY --from=go-builder /app/server .

# Copy React build from frontend builder
COPY --from=frontend-builder /app/typescript/react-map-app/build ./static

# Note: .env file should be provided via environment variables or docker-compose
# Don't copy .env file into the image for security reasons

# Expose port
EXPOSE 5000

# Run the server
CMD ["./server"]
