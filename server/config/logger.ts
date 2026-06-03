/**
 * Minimal dependency-free structured logger.
 *
 * Emits single-line JSON in production (easy to ship to a log aggregator) and
 * human-readable lines in development. Swap the implementation here if a richer
 * logger (pino/winston) is later introduced — call sites stay unchanged.
 */
import { config } from "./env";

type Level = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL: number = config.isProduction ? LEVEL_ORDER.info : LEVEL_ORDER.debug;

function emit(level: Level, message: string, meta?: Record<string, unknown>): void {
  if (LEVEL_ORDER[level] < MIN_LEVEL) return;

  if (config.isProduction) {
    const line = JSON.stringify({ ts: new Date().toISOString(), level, message, ...meta });
    (level === "error" || level === "warn" ? process.stderr : process.stdout).write(line + "\n");
    return;
  }

  const prefix = `[${new Date().toISOString()}] ${level.toUpperCase()}`;
  const extra = meta && Object.keys(meta).length ? " " + JSON.stringify(meta) : "";
  // eslint-disable-next-line no-console
  (level === "error" || level === "warn" ? console.error : console.log)(`${prefix} ${message}${extra}`);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => emit("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => emit("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit("error", message, meta),
};
