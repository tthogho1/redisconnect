import React from 'react';
import { Landmark } from '../../types/landmark';

interface LandmarkActionPanelProps {
  landmarks: Landmark[];
  selectedIds: number[];
  vehicle: 'car' | 'bike' | 'foot';
  onVehicleChange: (v: 'car' | 'bike' | 'foot') => void;
  onCheckRoute: () => void;
  onClose: () => void;
  onSummarize?: (landmarks: Landmark[], selectedIds: number[]) => void;
  summarizing?: boolean;
}

export function LandmarkActionPanel({
  landmarks,
  selectedIds,
  vehicle,
  onVehicleChange,
  onCheckRoute,
  onClose,
  onSummarize,
  summarizing = false,
}: LandmarkActionPanelProps) {
  const handleSummarize = () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one landmark to summarize.');
      return;
    }
    if (selectedIds.length > 5) {
      alert('Please select 5 or fewer landmarks.');
      return;
    }

    if (onSummarize) {
      onSummarize(landmarks, selectedIds);
    }
  };

  return (
    <div className="p-3 border-t space-y-3">
      {/* Vehicle mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
        <div className="flex items-center gap-3">
          {(['car', 'bike', 'foot'] as const).map((v) => (
            <label key={v} className="flex items-center gap-2">
              <input
                type="radio"
                name="vehicle"
                value={v}
                checked={vehicle === v}
                onChange={() => onVehicleChange(v)}
              />
              <span className="capitalize">{v}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={onCheckRoute}
          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Check Route
        </button>

        <button
            onClick={handleSummarize}
            disabled={summarizing}
            className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            title="It takes time to get information."
            >
            {summarizing ? 'Summarizing…' : 'Summarize'}
        </button>

        <button
          onClick={onClose}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}
