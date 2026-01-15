# Docker Compose Usage Guide

## Local Development Environment

For local development, use `docker-compose.local.yml`:

```powershell
# Build and start with local settings
docker-compose -f docker-compose.local.yml up --build

# Start in background
docker-compose -f docker-compose.local.yml up -d --build

# Stop
docker-compose -f docker-compose.local.yml down
```

## Production Environment

For production, set environment variables in the `.env` file:

### 1. Create .env file

```env
REDIS_HOST=your-redis-host.redis-cloud.com
REDIS_PORT=12345
REDIS_PASSWORD=your-password
REDIS_USERNAME=default
HIGMA_API_URL=https://your-api.example.com/api/chat
```

### 2. Start with docker-compose

```powershell
# Start with .env file loaded
docker-compose up --build

# Start in background
docker-compose up -d --build

# Stop
docker-compose down
```

## File Structure

- `docker-compose.yml` - For production (uses environment variables, tracked in Git)
- `docker-compose.local.yml` - For local development (contains sensitive information, not tracked in Git)
- `.env` - Production environment variables (not tracked in Git)

## Important Notes

⚠️ **Important**: `docker-compose.local.yml` and `.env` files contain sensitive information, so do not commit them to the Git repository. These files are added to `.gitignore`.
