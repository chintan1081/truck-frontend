/**
 * Helpers for parsing/clamping pagination query parameters so every list
 * endpoint behaves consistently and is protected from absurd page sizes.
 */

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = parseInt(String(value), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export interface PageParams {
  limit: number;
  offset: number;
}

export function parsePageParams(
  query: Record<string, unknown>,
  opts: { defaultLimit?: number; maxLimit?: number } = {}
): PageParams {
  const maxLimit = opts.maxLimit ?? 500;
  const defaultLimit = opts.defaultLimit ?? 200;
  return {
    limit: clampInt(query.limit, 1, maxLimit, defaultLimit),
    offset: clampInt(query.offset, 0, 1_000_000, 0),
  };
}
