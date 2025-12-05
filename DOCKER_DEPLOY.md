# Docker デプロイメントガイド

このプロジェクトを Docker で実行するためのガイドです。

## 📋 前提条件

- Docker Desktop がインストールされていること
- Docker Compose がインストールされていること

## 🚀 起動方法

### 1. 全サービスをビルド・起動

```powershell
docker-compose up --build
```

### 2. バックグラウンドで起動

```powershell
docker-compose up -d --build
```

### 3. 特定のサービスのみ起動

```powershell
# Go サーバーのみ
docker-compose up go-server

# gosignaling のみ
docker-compose up gosignaling
```

## 🛑 停止方法

### すべてのサービスを停止

```powershell
docker-compose down
```

### データボリュームも削除して停止

```powershell
docker-compose down -v
```

## 🔍 ログ確認

### すべてのサービスのログ

```powershell
docker-compose logs -f
```

### 特定のサービスのログ

```powershell
docker-compose logs -f go-server
docker-compose logs -f gosignaling
```

## 📦 サービス構成

### 1. **go-server** (ポート: 5000)

- WebSocket サーバー + React フロントエンド
- 外部 Redis Cloud に接続
- エンドポイント:
  - `http://localhost:5000` - React アプリ
  - `http://localhost:5000/map` - マップ表示
  - `ws://localhost:5000/socket.io/` - WebSocket 接続

### 2. **gosignaling** (ポート: 8080)

- WebRTC シグナリングサーバー
- エンドポイント:
  - `ws://localhost:8080/ws` - WebSocket 接続

## ⚙️ 環境変数の設定

プロジェクトルートに `.env` ファイルを作成して、必要な環境変数を設定してください：

```env
# Redis Cloud 接続情報
REDIS_HOST=redis-xxxxx.c123.us-east-1-4.ec2.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your-redis-password
REDIS_USERNAME=default

# HIGMA API
HIGMA_API_URL=https://your-higma-api.example.com/api
```

**重要**: Redis Cloud の接続情報は必須です。`.env` ファイルがない場合は起動に失敗します。

## 🔧 開発時の使い方

### コードを変更した後の再ビルド

```powershell
docker-compose up --build go-server
```

### 特定のサービスを再起動

```powershell
docker-compose restart go-server
```

### コンテナに入る

````powershell
```powershell
docker exec -it redisconnect-go-server sh
docker exec -it redisconnect-gosignaling sh
````

## 📂 ディレクトリ構造

```
redisconnect/
├── docker-compose.yml          # メインの Compose ファイル
├── .dockerignore              # Docker ビルド時の除外ファイル
├── go/
│   ├── Dockerfile             # Go サーバーの Dockerfile
│   ├── .dockerignore
│   └── main.go
├── gosignaling/
│   ├── Dockerfile             # gosignaling の Dockerfile
│   ├── .dockerignore
│   └── main.go
└── typescript/
    └── react-map-app/         # React フロントエンド (Docker ビルド時に使用)
```

## 🐛 トラブルシューティング

### ポートが使用中の場合

他のサービスがポートを使用している場合、`docker-compose.yml` のポートマッピングを変更してください：

```yaml
ports:
  - '15000:5000' # 外部ポート:コンテナポート
```

### Redis 接続エラー

Redis Cloud への接続に問題がある場合、環境変数を確認してください：

```powershell
# .env ファイルの内容を確認
cat .env

# Go サーバーのログを確認
docker-compose logs go-server
```

接続情報が正しいことを確認：

- `REDIS_HOST`: Redis Cloud のホスト名
- `REDIS_PORT`: Redis Cloud のポート番号
- `REDIS_PASSWORD`: Redis Cloud のパスワード

### ビルドエラー

キャッシュをクリアして再ビルド：

```powershell
docker-compose build --no-cache
docker-compose up
```

## 🔄 更新手順

1. コードを変更
2. Git でコミット
3. Docker イメージを再ビルド

```powershell
docker-compose down
docker-compose up --build
```

## 📝 注意事項

- **Redis Cloud**: このプロジェクトは外部の Redis Cloud サービスを使用します。`.env` ファイルに接続情報を設定してください
- **React ビルド**: `go/Dockerfile` 内で React アプリが自動的にビルドされ、`static` フォルダにコピーされます
- **環境変数**: 本番環境では `.env` ファイルを使用し、機密情報を安全に管理してください
