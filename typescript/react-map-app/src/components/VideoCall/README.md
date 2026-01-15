# VideoCall Component

Video call component using WebRTC

## Overview

This component provides peer-to-peer video calling functionality using WebSocket signaling server and WebAssembly (WASM).

## File Structure

```
src/components/VideoCall/
├── VideoCallPopup.tsx      # Main component
├── VideoCallPopup.css      # Stylesheet
└── index.ts               # Export definitions
```

## Usage

### Basic Usage

```tsx
import { VideoCallPopup } from './components/VideoCall';

function MyApp() {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div>
      <button onClick={() => setShowPopup(true)}>Start Video Call</button>

      {showPopup && (
        <VideoCallPopup wsUrl="ws://localhost:5000/connect" onClose={() => setShowPopup(false)} />
      )}
    </div>
  );
}
```

### Props

| Prop            | Type         | Required | Default       | Description                     |
| --------------- | ------------ | -------- | ------------- | ------------------------------- |
| `wsUrl`         | `string`     | ✓        | -             | WebSocket signaling server URL  |
| `onClose`       | `() => void` | ✓        | -             | Callback when closing the popup |
| `defaultRoomId` | `string`     | -        | `'test-room'` | Default room ID                 |

## Porting to Other React Apps

### Required Files

1. **Component Files**

   - Copy the entire `src/components/VideoCall/` folder

2. **WASM Files**

   - Copy the `webrtc-wasm/pkg/` folder
   - Or adjust the path according to your project's build system

3. **Type Definition Files (Optional)**
   - `src/vite-env.d.ts` (if using environment variables)

### Installation Steps

1. **Copy Files**

   ```bash
   # Run in the target React project
   cp -r /path/to/gosignaling-react/src/components/VideoCall ./src/components/
   cp -r /path/to/gosignaling-react/webrtc-wasm ./
   ```

2. **Adjust Import Paths**

   Check the WASM import path in `VideoCallPopup.tsx`:

   ```tsx
   import init, { WebRTCClient } from '../../../webrtc-wasm/pkg/webrtc_wasm';
   ```

   Adjust the path according to your project structure.

3. **Import CSS**

   Import globally or within the component as needed:

   ```tsx
   import './components/VideoCall/VideoCallPopup.css';
   ```

4. **Set Environment Variables (Optional)**

   Create a `.env` file:

   ```
   VITE_WS_URL=ws://your-server.com/connect
   ```

### Dependencies

- React 18+
- TypeScript (recommended)

### Using with Next.js

When using with Next.js, configure as a client component:

```tsx
'use client';

import { VideoCallPopup } from './components/VideoCall';
```

You may also need to load WASM files dynamically.

## Features

- ✅ Local video stream display
- ✅ Remote video stream display (multi-peer support)
- ✅ WebSocket signaling
- ✅ ICE candidate exchange
- ✅ Room management
- ✅ Camera/microphone stop
- ✅ Popup UI

## Customization

### Changing Styles

Edit `VideoCallPopup.css` to customize the design.

### Removing Debug Information

For production environments, we recommend removing debug information (console.log, debug displays) from the component.

## Troubleshooting

### Camera Not Starting

- Check browser camera permissions
- Ensure running on HTTPS or localhost

### WebSocket Connection Error

- Verify the signaling server is running
- Check that `wsUrl` is correct
- Check CORS settings

### Video Not Displaying

- Check browser console for errors
- Verify `localStream` and `isConnected` states
- Confirm ICE candidate exchange is working correctly

## License

This component follows the license of the original project.
