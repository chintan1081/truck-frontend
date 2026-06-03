import { configDotenv } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
configDotenv({ path: resolve(__dirname, "../.env") });

export type NodeEnv = "development" | "production" | "test";

const nodeEnv = (process.env.NODE_ENV as NodeEnv) || "development";
const isProduction = nodeEnv === "production";

const config = {
  nodeEnv,
  isProduction,
  isDevelopment: nodeEnv === "development",
  isTest: nodeEnv === "test",

  http: {
    port: Number(process.env.PORT),
    host: process.env.HOST || "0.0.0.0",
  },

  db: {
    url: process.env.DATABASE_URL!,
    schema: process.env.DB_SCHEMA || "public",
    logging: process.env.DB_LOGGING === "true",
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET!,
    tokenTtlSeconds: Number(process.env.JWT_TTL_SECONDS) || 60 * 60 * 12,
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
  },

  rateLimit: {
    windowMs: Number(process.env.AUTH_RATE_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.AUTH_RATE_MAX) || 50,
  },
} as const;

/**
 * Fail fast at boot if production is missing critical secrets. In development we
 * tolerate the baked-in defaults so the app runs out of the box.
 */
export function assertProductionConfig(): void {
  if (!config.isProduction) return;

  const problems: string[] = [];
  if (config.auth.jwtSecret === "dev-only-change-me-flyash-secret-32chars-min" || config.auth.jwtSecret.length < 32) {
    problems.push("JWT_SECRET must be set to a strong value (>= 32 chars) in production");
  }
  if (!process.env.DATABASE_URL) {
    problems.push("DATABASE_URL must be explicitly set in production");
  }

  if (problems.length) {
    throw new Error(`Invalid production configuration:\n  - ${problems.join("\n  - ")}`);
  }
}

export { config };
