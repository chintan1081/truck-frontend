import "reflect-metadata";
import { DataSource } from "typeorm";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import { config } from "../config/env";
import { logger } from "../config/logger";
import { ENTITIES } from "./entities";

/**
 * Single shared database connection.
 *
 * All tables live in one schema. Per-user isolation is enforced at the query
 * level: every user-owned row carries a `userId` foreign key (see OwnedEntity)
 * and repositories filter by the authenticated user's id. The connection is
 * created once and reused for the process lifetime.
 */

// Resolved relative to this file so the path is stable regardless of the
// process working directory (tsx from root, esbuild bundle in dist/, etc.).
const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_GLOB = [path.join(__dirname, "migrations", "*.{ts,js}")];

let appDataSource: DataSource | null = null;
let initPromise: Promise<DataSource> | null = null;

function buildDataSource(): DataSource {
  return new DataSource({
    type: "postgres",
    url: config.db.url,
    schema: config.db.schema,
    synchronize: false,
    migrationsRun: true,
    migrations: MIGRATIONS_GLOB,
    migrationsTableName: "_migrations",
    logging: config.db.logging,
    entities: ENTITIES as any,
  });
}

/**
 * Returns the initialised application DataSource, creating it on first use.
 * Concurrent callers during startup share a single initialise promise.
 */
export async function getDataSource(): Promise<DataSource> {
  if (appDataSource && appDataSource.isInitialized) return appDataSource;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const ds = buildDataSource();
    await ds.initialize();
    appDataSource = ds;
    logger.info("Database connected", { schema: config.db.schema });
    return ds;
  })();

  return initPromise;
}

/** Closes the connection. Called during graceful shutdown. */
export async function closeDataSource(): Promise<void> {
  if (appDataSource?.isInitialized) {
    await appDataSource.destroy();
  }
  appDataSource = null;
  initPromise = null;
  logger.info("Database connection closed");
}
