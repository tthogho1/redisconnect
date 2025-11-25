# Go WebSocket Server

Flask-SocketIO サーバーの Go 言語実装版です。

## 必要な環境

- Go 1.21 以上
- Redis

## セットアップ

1. 依存パッケージのインストール:

```bash
cd go
go mod download
```

2. 環境変数設定:
   `.env`ファイルを親ディレクトリに作成（または既存のものを使用）

## 実行

```bash
go run main.go
```

## 主な機能

- WebSocket 通信（Socket.IO 互換）
- Redis GEO 機能を使った位置情報管理
- チャット機能（ブロードキャスト・プライベート）
- HIGMA API 連携
- RESTful API（ユーザー管理）

## エンドポイント

### WebSocket

- `ws://localhost:5000/socket.io/`

### REST API

- `GET /users` - 全ユーザー取得
- `POST /users` - ユーザー作成
- `DELETE /users/:user_id` - ユーザー削除

## Python 版との違い

- Socket.IO の実装が異なるため、一部動作が異なる可能性があります
- パフォーマンスと並行処理が Go の特性により向上しています
