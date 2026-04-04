import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { setPointIcon } from './icon';

type SetPoint = { lat: number; lon: number; name?: string } | null;

interface Props {
  point: SetPoint;
  onClear: () => void;
  onRename: (name: string) => void;
}

export function SetPointMarker({ point, onClear, onRename }: Props) {
  const [nameInput, setNameInput] = React.useState<string>('');

  React.useEffect(() => {
    setNameInput(point?.name || '');
  }, [point]);

  if (!point) return null;
  const { lat, lon, name } = point;

  return (
    <Marker position={[lat, lon]} icon={setPointIcon}>
      <Popup>
        <div style={{ fontFamily: 'sans-serif', minWidth: 220 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 'bold', marginBottom: 6, fontSize: 14 }}>Set Point</div>
            {name ? (
              <div style={{ fontSize: 12, color: '#666' }}>{name}</div>
            ) : null}
          </div>

          <div style={{ fontSize: 13, color: '#333', marginBottom: 10 }}>
            <div><b>Lat:</b> {lat.toFixed(6)}</div>
            <div><b>Lon:</b> {lon.toFixed(6)}</div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter name"
              style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => onRename(nameInput.trim())}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Save
            </button>

            <button
              onClick={onClear}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Clear
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
