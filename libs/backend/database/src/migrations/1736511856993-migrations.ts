import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1736511856993 implements MigrationInterface {
  name = 'Migrations1736511856993';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add guid to "event"."GameUserMembership"
    await queryRunner.query(`
        ALTER TABLE "event"."GameUserMemberships"
        ADD COLUMN "id" uuid NOT NULL DEFAULT uuid_generate_v4();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "event"."GameUserMemberships"
        DROP COLUMN "id";
    `);
  }
}
