# Redis Connection Project

WebSocket + Redis + OpenStreetMap を使用したリアルタイム位置情報共有アプリケーション

## プロジェクト構成

### Python (Flask + WebSocket + Redis)

- `python/flask-websocket-project/` - WebSocket サーバー
  - Flask-SocketIO でリアルタイム通信
  - Redis Geospatial Index で位置情報管理
  - Swagger/OpenAPI ドキュメント生成

### TypeScript (React + OpenStreetMap)

- `typescript/react-map-app/` - フロントエンド
  - React + TypeScript
  - OpenStreetMap (Leaflet)
  - Socket.IO Client
  - リアルタイム位置情報表示

## セットアップ

### 必要な環境

- Python 3.8+
- Node.js 16+
- Redis 7.0+

### Python サーバー

```bash
cd python/flask-websocket-project
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

`.env` ファイルを作成:

```env
HOST=your-redis-host
PORT=6379
REDIS_USERNAME=your-username
PASSWORD=your-password
APP_PORT=5000
```

サーバー起動:

```bash
python app/websocket.py
```

### React アプリケーション

```bash
cd typescript/react-map-app
npm install
npm start
```

## 機能

### WebSocket Server

- ユーザー位置情報の受信と保存 (Redis GEO)
- リアルタイムブロードキャスト
- REST API エンドポイント (GET/POST/DELETE)
- Swagger UI: `http://localhost:5000/apidocs`

### React Client

- ブラウザの位置情報取得
- リアルタイム地図表示
- ユーザーごとのカラーアイコン
- 自動位置更新機能

## API

### WebSocket Events

- `location` - 位置情報送信
- `all_users` - 全ユーザー情報受信
- `user_added` - 新規ユーザー追加通知
- `user_updated` - ユーザー更新通知
- `user_deleted` - ユーザー削除通知

### REST API

- `GET /users` - 全ユーザー取得
- `POST /users` - ユーザー作成
- `DELETE /users/<id>` - ユーザー削除

## ライセンス

MIT
