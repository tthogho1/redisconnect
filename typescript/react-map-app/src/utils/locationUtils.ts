/**
 * Generate random location near a base position
 * @param baseLat - Base latitude
 * @param baseLon - Base longitude
 * @returns Random location within ~1km range
 */
export const generateRandomLocation = (baseLat: number, baseLon: number) => {
  const randomOffset = 0.01; // ~1km range
  return {
    lat: baseLat + (Math.random() - 0.5) * randomOffset,
    lon: baseLon + (Math.random() - 0.5) * randomOffset,
  };
};

/**
 * Default center position (Tokyo)
 */
export const DEFAULT_POSITION: [number, number] = [35.6762, 139.6503];
