import { Landmark } from '../types/landmark';

/**
 * The Go backend is typically the same origin that serves the app.
 * Override with REACT_APP_API_URL if needed (e.g. local dev against a remote backend).
 */
const API_BASE =
  process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');

/** Single item sent to POST /summarize */
export interface SummarizeRequestItem {
  url: string;
  target_tokens: number;
}

/** Single item returned from POST /summarize */
export interface SummarizeResponseItem {
  url: string;
  summary: string;
  token_count: number;
  target_tokens: number;
}

/**
 * Build Wikipedia URLs from the selected landmark IDs and call the
 * Go `/summarize` endpoint (which proxies to HuggingFace).
 *
 * @param landmarks     Full landmark list
 * @param selectedIds   The pageIds the user has checked
 * @param targetTokens  Desired summary length per article (default 150)
 * @returns             Array of summarised results
 */
export async function summarizeLandmarks(
  landmarks: Landmark[],
  selectedIds: number[],
  targetTokens = 150,
): Promise<SummarizeResponseItem[]> {
  const selected = landmarks.filter((l) => selectedIds.includes(l.pageId));

  if (selected.length === 0) {
    throw new Error('No landmarks selected');
  }
  if (selected.length > 5) {
    throw new Error('Please select 5 or fewer landmarks to summarize');
  }

  const body: SummarizeRequestItem[] = selected.map((l) => ({
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(l.title)}`,
    target_tokens: targetTokens,
  }));

  const resp = await fetch(`${API_BASE}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Summarize request failed (${resp.status}): ${errBody}`);
  }

  const data: SummarizeResponseItem[] = await resp.json();
  return data;
}
