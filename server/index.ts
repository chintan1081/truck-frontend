import "reflect-metadata";
import type { Server } from "http";
import { config, assertProductionConfig } from "./config/env";
import { logger } from "./config/logger";
import { createApp } from "./app";
import { getDataSource, closeDataSource } from "./db/data-source";

async function startServer(): Promise<void> {
  assertProductionConfig();

  // Initialise the database connection before accepting requests.
  await getDataSource();

  const app = await createApp();
  const server = app.listen(config.http.port, config.http.host, () => {
    logger.info("Server listening", {
      url: `http://localhost:${config.http.port}`,
      env: config.nodeEnv,
    });
  });

  registerGracefulShutdown(server);
}

function registerGracefulShutdown(server: Server): void {
  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("Shutting down", { signal });

    server.close(async () => {
      await closeDataSource();
      logger.info("Shutdown complete");
      process.exit(0);
    });

    // Force-exit if connections don't drain in time.
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled promise rejection", { reason: String(reason) });
  });
  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception", { message: err.message, stack: err.stack });
  });
}

startServer().catch((err) => {
  logger.error("Fatal: server failed to start", {
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  process.exit(1);
});
