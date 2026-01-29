import { renderHook, act } from '@testing-library/react';
import { useLandmarks } from '../useLandmarks';
import { Landmark } from '../../types/landmark';
import { MapBounds } from '../../types/map';
import * as wikimediaClient from '../../services/wikimediaClient';

// Mock the wikimediaClient
jest.mock('../../services/wikimediaClient');

describe('useLandmarkCache FIFO behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockLandmarks = (start: number, count: number): Landmark[] => {
    return Array.from({ length: count }, (_, i) => ({
      pageId: start + i,
      title: `Landmark ${start + i}`,
      lat: 35.0 + i * 0.001,
      lon: 139.0 + i * 0.001,
      thumbnailUrl: null,
      thumbnailWidth: null,
      thumbnailHeight: null,
      description: null,
    }));
  };

  const createMockMapBounds = (lat: number, lng: number): MapBounds => ({
    north: lat + 0.1,
    south: lat - 0.1,
    east: lng + 0.1,
    west: lng - 0.1,
    center: { lat, lng },
    zoom: 10,
  });

  it('Test 1: Initial 50 items → length=50', async () => {
    const mockData = createMockLandmarks(0, 50);
    (wikimediaClient.searchLandmarksNearby as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() =>
      useLandmarks(createMockMapBounds(35, 139))
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.landmarks.length).toBe(50);
    expect(result.current.landmarks[0].pageId).toBe(0);
    expect(result.current.landmarks[49].pageId).toBe(49);
    console.log('✅ Test 1 passed: Initial 50 items');
  });

  it('Test 2: Same 50 items → length=50 (duplicates skipped)', async () => {
    const mockData = createMockLandmarks(0, 50);
    (wikimediaClient.searchLandmarksNearby as jest.Mock).mockResolvedValue(mockData);

    const { result, rerender } = renderHook(() =>
      useLandmarks(createMockMapBounds(35, 139))
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.landmarks.length).toBe(50);

    // Fetch same data again
    rerender();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.landmarks.length).toBe(50);
    console.log('✅ Test 2 passed: Duplicates skipped');
  });

  it('Test 3: New 60 items → length=100 (oldest 10 removed)', async () => {
    let callCount = 0;
    (wikimediaClient.searchLandmarksNearby as jest.Mock).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(createMockLandmarks(0, 50));
      } else {
        return Promise.resolve(createMockLandmarks(50, 60));
      }
    });

    const { result, rerender } = renderHook(
      ({ bounds }) => useLandmarks(bounds),
      { initialProps: { bounds: createMockMapBounds(35, 139) } }
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.landmarks.length).toBe(50);

    // Trigger second fetch with different center
    rerender({ bounds: createMockMapBounds(36, 140) });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.landmarks.length).toBe(100);
    // First 10 (pageId 0-9) should be removed, keeping 10-109
    expect(result.current.landmarks[0].pageId).toBe(10);
    expect(result.current.landmarks[99].pageId).toBe(109);
    console.log('✅ Test 3 passed: 100 items limit, oldest removed');
  });

  it('Test 4: Verify FIFO - newest items remain', async () => {
    let callCount = 0;
    (wikimediaClient.searchLandmarksNearby as jest.Mock).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(createMockLandmarks(0, 50));
      } else {
        return Promise.resolve(createMockLandmarks(50, 60));
      }
    });

    const { result, rerender } = renderHook(
      ({ bounds }) => useLandmarks(bounds),
      { initialProps: { bounds: createMockMapBounds(35, 139) } }
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    rerender({ bounds: createMockMapBounds(36, 140) });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const pageIds = result.current.landmarks.map((l) => l.pageId);

    // Oldest (0-9) should be removed
    expect(pageIds.includes(0)).toBe(false);
    expect(pageIds.includes(9)).toBe(false);

    // Newest (50-109) should be present
    expect(pageIds.includes(50)).toBe(true);
    expect(pageIds.includes(109)).toBe(true);

    // Middle range (10-49) should be present
    expect(pageIds.includes(10)).toBe(true);
    expect(pageIds.includes(49)).toBe(true);

    console.log('✅ Test 4 passed: FIFO verified - newest 100 remain');
  });
});
