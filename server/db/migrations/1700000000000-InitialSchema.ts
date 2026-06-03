import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Bootstrap migration. Uses TypeORM's own schema-builder to materialise the schema
 * from the entity metadata that was registered when the DataSource was built.
 * After this runs once, all further schema changes must be added as new
 * migrations generated via `npm run migration:generate`.
 */
export class InitialSchema1700000000000 implements MigrationInterface {
  name = "InitialSchema1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // No-op if tables already exist; this generates whatever's missing.
    await queryRunner.connection.synchronize(false);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Intentionally not implemented — destroying every tenant table is dangerous.
    throw new Error("Down migration not supported for InitialSchema");
  }
}
