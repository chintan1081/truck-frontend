import path, { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import express, { Express } from "express";
import { config } from "./config/env";
import { securityHeaders } from "./middleware/security.middleware";
import { requestLogger } from "./middleware/request-logger.middleware";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware";
import { authRouter } from "./modules/auth/auth.routes";
import { chatRouter } from "./modules/chat/chat.routes";
import { buildApiRouter } from "./routes";
// Side-effect import: augments Express's Request type (req.user / req.db).
import "./shared/types";

/**
 * Builds and wires the Express application. Route registration order matters:
 * public auth first, then the authenticated chat endpoint, then the tenant-scoped
 * API. The SPA (Vite in dev, static build in prod) is served last, and the error
 * handler is registered after everything else.
 */
export async function createApp(): Promise<Express> {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", true);

  app.use(cors({
    origin: config.isProduction ? false : "http://localhost:5173",
    credentials: true,
  }));

  app.use(securityHeaders);
  app.use(express.json({ limit: "5mb" }));
  app.use(requestLogger);

  // --- API routes ---
  app.use("/api/auth", authRouter);     // public (login/register)
  app.use("/api/chat", chatRouter);     // authenticated, no tenant DB
  app.use("/api", buildApiRouter());    // authenticated + tenant-scoped CRUD
  app.use("/api", notFoundHandler);     // 404 for unmatched API routes

  // --- Frontend ---
  await mountFrontend(app);

  // Central error handler must be registered last.
  app.use(errorHandler);

  return app;
}

async function mountFrontend(app: Express): Promise<void> {
  if (!config.isProduction) {
    // In development the frontend runs as a separate Vite process (port 5173)
    // that proxies /api to this server. Nothing to mount here.
    return;
  }

  // Production: serve the Vite-built SPA from the same dist/ folder.
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const distPath = __dirname;
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
