# Docker Compose 使用方法

## ローカル開発環境

ローカル開発では `docker-compose.local.yml` を使用してください：

```powershell
# ローカル設定でビルド・起動
docker-compose -f docker-compose.local.yml up --build

# バックグラウンド起動
docker-compose -f docker-compose.local.yml up -d --build

# 停止
docker-compose -f docker-compose.local.yml down
```

## 本番環境

本番環境では `.env` ファイルに環境変数を設定して使用します：

### 1. .env ファイルを作成

```env
REDIS_HOST=your-redis-host.redis-cloud.com
REDIS_PORT=12345
REDIS_PASSWORD=your-password
REDIS_USERNAME=default
HIGMA_API_URL=https://your-api.example.com/api/chat
```

### 2. docker-compose で起動

```powershell
# .env ファイルを読み込んで起動
docker-compose up --build

# バックグラウンド起動
docker-compose up -d --build

# 停止
docker-compose down
```

## ファイル構成

- `docker-compose.yml` - 本番用（環境変数を使用、Git で管理）
- `docker-compose.local.yml` - ローカル開発用（機密情報を含む、Git で管理しない）
- `.env` - 本番環境変数（Git で管理しない）

## 注意事項

⚠️ **重要**: `docker-compose.local.yml` と `.env` ファイルには機密情報が含まれるため、Git リポジトリにコミットしないでください。これらのファイルは `.gitignore` に追加されています。
