import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProfilePhotoToUsers1700000000001 implements MigrationInterface {
  name = "AddProfilePhotoToUsers1700000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profilePhoto" text`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "profilePhoto"`
    );
  }
}
