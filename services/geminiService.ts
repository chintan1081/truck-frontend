import { api, ApiError } from './api/client';

/**
 * AI features are proxied through the authenticated backend (/api/chat/*) so the
 * Gemini API key never reaches the browser. This module keeps a small client-side
 * cache and a cooldown so a quota error doesn't hammer the server.
 */

const insightCache: Record<string, string> = {};
let last429Time = 0;
const COOLDOWN_PERIOD = 60000; // 1 minute cooldown after a quota error

function isCoolingDown(): boolean {
  return Date.now() - last429Time < COOLDOWN_PERIOD;
}

function isQuotaError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 429;
}

export async function getFinancialInsights(data: any): Promise<string> {
  const cacheKey = JSON.stringify(data);
  if (insightCache[cacheKey]) return insightCache[cacheKey];

  if (isCoolingDown()) {
    return "The AI intelligence engine is currently on a scheduled cooldown to prevent rate-limit exhaustion. Detailed financial dashboards are available below for manual review.";
  }

  try {
    const { text } = await api.post<{ text: string }>('chat/insights', { data });
    const result = text || 'No insights generated.';
    insightCache[cacheKey] = result;
    return result;
  } catch (error) {
    console.error('AI insight error:', error);
    if (isQuotaError(error)) {
      last429Time = Date.now();
      return "AI Insight quota reached for this period. To maintain system performance, automated analysis is temporarily paused. Please check back later.";
    }
    return "The intelligence engine is currently calibrating. Please refer to the raw data visualizations.";
  }
}

export async function parseDieselBill(base64Image: string): Promise<Record<string, any> | null> {
  if (isCoolingDown()) {
    console.warn('Skipping OCR due to rate limit cooldown.');
    return null;
  }

  try {
    const { data } = await api.post<{ data: Record<string, any> | null }>('chat/parse-bill', { image: base64Image });
    return data;
  } catch (error) {
    console.error('Bill OCR error:', error);
    if (isQuotaError(error)) last429Time = Date.now();
    return null;
  }
}
