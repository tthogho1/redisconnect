# VideoCall Component

WebRTC を使用したビデオ通話コンポーネント

## 概要

このコンポーネントは、WebSocket シグナリングサーバーと WebAssembly (WASM) を使用して、ピアツーピアのビデオ通話機能を提供します。

## ファイル構成

```
src/components/VideoCall/
├── VideoCallPopup.tsx      # メインコンポーネント
├── VideoCallPopup.css      # スタイルシート
└── index.ts               # エクスポート定義
```

## 使用方法

### 基本的な使い方

```tsx
import { VideoCallPopup } from './components/VideoCall';

function MyApp() {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div>
      <button onClick={() => setShowPopup(true)}>ビデオ通話を開始</button>

      {showPopup && (
        <VideoCallPopup wsUrl="ws://localhost:5000/connect" onClose={() => setShowPopup(false)} />
      )}
    </div>
  );
}
```

### Props

| Prop            | 型           | 必須 | デフォルト    | 説明                                         |
| --------------- | ------------ | ---- | ------------- | -------------------------------------------- |
| `wsUrl`         | `string`     | ✓    | -             | WebSocket シグナリングサーバーの URL         |
| `onClose`       | `() => void` | ✓    | -             | ポップアップを閉じる時に呼ばれるコールバック |
| `defaultRoomId` | `string`     | -    | `'test-room'` | デフォルトのルーム ID                        |

## 他の React アプリへの移植

### 必要なファイル

1. **コンポーネントファイル**

   - `src/components/VideoCall/` フォルダ全体をコピー

2. **WASM ファイル**

   - `webrtc-wasm/pkg/` フォルダをコピー
   - または、プロジェクトのビルドシステムに合わせてパスを調整

3. **型定義ファイル（オプション）**
   - `src/vite-env.d.ts` （環境変数を使用する場合）

### インストール手順

1. **ファイルをコピー**

   ```bash
   # 移植先のReactプロジェクトで実行
   cp -r /path/to/gosignaling-react/src/components/VideoCall ./src/components/
   cp -r /path/to/gosignaling-react/webrtc-wasm ./
   ```

2. **import パスを調整**

   `VideoCallPopup.tsx` の WASM import パスを確認：

   ```tsx
   import init, { WebRTCClient } from '../../../webrtc-wasm/pkg/webrtc_wasm';
   ```

   プロジェクト構造に合わせてパスを変更してください。

3. **CSS をインポート**

   必要に応じて、グローバル CSS またはコンポーネント内でインポート：

   ```tsx
   import './components/VideoCall/VideoCallPopup.css';
   ```

4. **環境変数の設定（オプション）**

   `.env` ファイルを作成：

   ```
   VITE_WS_URL=ws://your-server.com/connect
   ```

### 依存関係

- React 18+
- TypeScript（推奨）

### Next.js での使用

Next.js で使用する場合は、クライアントコンポーネントとして設定：

```tsx
'use client';

import { VideoCallPopup } from './components/VideoCall';
```

また、WASM ファイルの読み込みを動的にする必要がある場合があります。

## 機能

- ✅ ローカルビデオストリーム表示
- ✅ リモートビデオストリーム表示（複数ピア対応）
- ✅ WebSocket シグナリング
- ✅ ICE candidate 交換
- ✅ ルーム管理
- ✅ カメラ・マイクの停止
- ✅ ポップアップ UI

## カスタマイズ

### スタイルの変更

`VideoCallPopup.css` を編集して、デザインをカスタマイズできます。

### デバッグ情報の削除

本番環境では、コンポーネント内のデバッグ情報（console.log、デバッグ表示）を削除することをお勧めします。

## トラブルシューティング

### カメラが起動しない

- ブラウザのカメラ権限を確認
- HTTPS または localhost で実行していることを確認

### WebSocket 接続エラー

- シグナリングサーバーが起動していることを確認
- `wsUrl` が正しいことを確認
- CORS 設定を確認

### ビデオが表示されない

- ブラウザのコンソールでエラーを確認
- `localStream` と `isConnected` の状態を確認
- ICE candidate の交換が正常に行われているか確認

## ライセンス

このコンポーネントは、元のプロジェクトのライセンスに従います。
