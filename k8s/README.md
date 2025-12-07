# Kubernetes Deployment for RedisConnect with Kind

This directory contains Kubernetes manifests for deploying RedisConnect application to a Kind cluster.

## Prerequisites

1. Kind cluster created and running
2. Docker images loaded into Kind:
   ```bash
   kind load docker-image redisconnect-go-server:latest redisconnect-gosignaling:latest --name dev
   ```

## Files

- `redisconnect-pod.yaml` - Pod definition with both go-server and gosignaling containers
- `redisconnect-service.yaml` - Service to expose the Pod
- `redisconnect-secrets.yaml` - Secret template for Redis and HIGMA credentials

## Setup Instructions

### 1. Create Secrets

First, encode your credentials to base64:

**PowerShell:**

```powershell
# Redis Host
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("your-redis-host"))

# Redis Password
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("your-redis-password"))

# HIGMA API URL
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("https://your-higma-api-url"))
```

**Linux/Mac:**

```bash
echo -n "your-redis-host" | base64
echo -n "your-redis-password" | base64
echo -n "https://your-higma-api-url" | base64
```

Update `redisconnect-secrets.yaml` with the encoded values, then apply:

```bash
kubectl apply -f k8s/redisconnect-secrets.yaml
```

### 2. Deploy Pod and Service

```bash
# Apply Pod configuration
kubectl apply -f k8s/redisconnect-pod.yaml

# Apply Service configuration
kubectl apply -f k8s/redisconnect-service.yaml
```

### 3. Verify Deployment

```bash
# Check Pod status
kubectl get pods

# Check logs for go-server
kubectl logs redisconnect -c go-server

# Check logs for gosignaling
kubectl logs redisconnect -c gosignaling

# Check Service
kubectl get services
```

### 4. Access Applications

Since we're using NodePort services, you can access the applications at:

- **Go Server**: http://localhost:30500
- **GoSignaling WebSocket**: ws://localhost:30808/ws

If using Kind with a custom cluster name (e.g., `dev`), ensure port mappings are configured in your Kind cluster config.

## Architecture

The Pod contains two containers:

- **go-server**: Main application server with Socket.IO (port 5000)
- **gosignaling**: WebRTC signaling server (port 8080)

Both containers share the same network namespace within the Pod, allowing localhost communication between them if needed.

## Resource Limits

### go-server

- Requests: 128Mi memory, 250m CPU
- Limits: 256Mi memory, 500m CPU

### gosignaling

- Requests: 64Mi memory, 100m CPU
- Limits: 128Mi memory, 250m CPU

## Health Checks

Both containers have liveness and readiness probes configured:

- **go-server**: HTTP probes on port 5000
- **gosignaling**: TCP probes on port 8080

## Updating

To update the deployment after building new images:

```bash
# Build new images
docker build -t redisconnect-go-server:latest -f go/Dockerfile .
docker build -t redisconnect-gosignaling:latest -f gosignaling/Dockerfile ./gosignaling

# Load into Kind
kind load docker-image redisconnect-go-server:latest redisconnect-gosignaling:latest --name dev

# Delete and recreate the Pod
kubectl delete pod redisconnect
kubectl apply -f k8s/redisconnect-pod.yaml
```

## Cleanup

```bash
# Delete all resources
kubectl delete -f k8s/redisconnect-service.yaml
kubectl delete -f k8s/redisconnect-pod.yaml
kubectl delete -f k8s/redisconnect-secrets.yaml
```

## Troubleshooting

### Pod not starting

```bash
kubectl describe pod redisconnect
```

### Container logs

```bash
# Go server logs
kubectl logs redisconnect -c go-server -f

# GoSignaling logs
kubectl logs redisconnect -c gosignaling -f
```

### Execute commands in container

```bash
kubectl exec -it redisconnect -c go-server -- /bin/sh
kubectl exec -it redisconnect -c gosignaling -- /bin/sh
```

### Port forwarding (alternative to NodePort)

```bash
# Forward go-server port
kubectl port-forward pod/redisconnect 5000:5000

# Forward gosignaling port (in another terminal)
kubectl port-forward pod/redisconnect 8080:8080
```
