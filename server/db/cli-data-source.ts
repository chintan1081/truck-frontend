/**
 * Standalone DataSource used by the TypeORM CLI for `migration:generate` / `migration:run`.
 * Run via:
 *   npm run migration:generate -- server/db/migrations/SomeName
 *   npm run migration:run
 *
 * Targets a single schema (DB_SCHEMA / MIGRATION_SCHEMA, default "public") and
 * always requires DATABASE_URL.
 */
import "reflect-metadata";
import { DataSource } from "typeorm";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { ENTITIES } from "./entities";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL must be set when invoking the TypeORM CLI");
}

export default new DataSource({
  type: "postgres",
  url,
  schema: process.env.MIGRATION_SCHEMA || process.env.DB_SCHEMA || "public",
  synchronize: false,
  logging: true,
  entities: ENTITIES as any,
  migrations: [path.join(__dirname, "migrations", "*.{ts,js}")],
  migrationsTableName: "_migrations",
});
