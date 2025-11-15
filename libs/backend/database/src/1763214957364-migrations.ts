import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1763214957364 implements MigrationInterface {
    name = 'Migrations1763214957364'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."scheduled_shifts_status_enum" AS ENUM(
                'scheduled',
                'started',
                'on_break',
                'completed',
                'no_show',
                'cancelled'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "scheduled_shifts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "modifiedAt" TIMESTAMP DEFAULT now(),
                "employeeId" uuid NOT NULL,
                "startTime" TIMESTAMP NOT NULL,
                "endTime" TIMESTAMP NOT NULL,
                "role" character varying(50),
                "counterId" uuid,
                "status" "public"."scheduled_shifts_status_enum" NOT NULL DEFAULT 'scheduled',
                "notes" text,
                "isRecurring" boolean NOT NULL DEFAULT false,
                "recurringShiftId" uuid,
                "shiftType" character varying(50) NOT NULL DEFAULT 'REGULAR',
                "priority" character varying(50) NOT NULL DEFAULT 'MEDIUM',
                "requiredSkills" text NOT NULL DEFAULT '',
                "estimatedBreakMinutes" integer NOT NULL DEFAULT '30',
                "createdBy" uuid NOT NULL,
                CONSTRAINT "PK_552c8a299a757cbf90090691be4" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_33fa3fd4caeca2eb3cc91d61a9" ON "scheduled_shifts" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_3a4a2d5dd8eb70e3616c2088ac" ON "scheduled_shifts" ("counterId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_7eb14c0fd7aa9edf93147dc471" ON "scheduled_shifts" ("status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_93e41f4755ec0e6e820c880b59" ON "scheduled_shifts" ("employeeId", "startTime")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."shift_swap_requests_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')
        `);
        await queryRunner.query(`
            CREATE TABLE "shift_swap_requests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "requestingEmployeeId" uuid NOT NULL,
                "targetEmployeeId" uuid NOT NULL,
                "requestingShiftId" uuid NOT NULL,
                "targetShiftId" uuid NOT NULL,
                "status" "public"."shift_swap_requests_status_enum" NOT NULL DEFAULT 'PENDING',
                "reason" text,
                "approvedBy" uuid,
                "approvedAt" TIMESTAMP,
                CONSTRAINT "PK_65b212b948b24350cffb8c4cec4" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_7e1050d3b3e118f789d3b55e0d" ON "shift_swap_requests" ("requestingEmployeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_de80437f8cfde182f3f0978d27" ON "shift_swap_requests" ("targetEmployeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_792f177920af6055b1de95a353" ON "shift_swap_requests" ("requestingShiftId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_7cb0fd037c816f2fcbda05735f" ON "shift_swap_requests" ("targetShiftId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5644f8910d85b4fc166918cae4" ON "shift_swap_requests" ("targetEmployeeId", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_beca1c4cdc67955be24f05335b" ON "shift_swap_requests" ("requestingEmployeeId", "status")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."attendance_records_status_enum" AS ENUM(
                'PRESENT',
                'ABSENT',
                'LATE',
                'EARLY_DEPARTURE',
                'PARTIAL'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "attendance_records" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "employeeId" uuid NOT NULL,
                "shiftId" uuid,
                "date" TIMESTAMP NOT NULL,
                "clockIn" TIMESTAMP,
                "clockOut" TIMESTAMP,
                "status" "public"."attendance_records_status_enum" NOT NULL DEFAULT 'PRESENT',
                "hoursWorked" numeric(5, 2),
                "notes" text,
                "geoLocation" jsonb,
                "deviceInfo" jsonb,
                CONSTRAINT "PK_946920332f5bc9efad3f3023b96" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_2f86d1ade33d4dbc029e216904" ON "attendance_records" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6fe9e80bee61d5ac47a27d40f2" ON "attendance_records" ("shiftId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6fe9e80bee61d5ac47a27d40f2" ON "attendance_records" ("shiftId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_22624a7cd14d0f97d0bff5fb7b" ON "attendance_records" ("employeeId", "date")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."certification_records_status_enum" AS ENUM('ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED')
        `);
        await queryRunner.query(`
            CREATE TABLE "certification_records" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "employeeId" uuid NOT NULL,
                "certificationName" character varying(255) NOT NULL,
                "certificationBody" character varying(255) NOT NULL,
                "issueDate" TIMESTAMP NOT NULL,
                "expiryDate" TIMESTAMP,
                "certificateNumber" character varying(255) NOT NULL,
                "status" "public"."certification_records_status_enum" NOT NULL DEFAULT 'ACTIVE',
                "renewalRequired" boolean NOT NULL DEFAULT false,
                "renewalReminderSent" boolean NOT NULL DEFAULT false,
                "skillsValidated" text,
                "attachmentUrl" text,
                CONSTRAINT "PK_21c2e7c74b489846538dcca2693" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e94d51cc49452d128287c07eb1" ON "certification_records" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_2734a36c63b3a3cca0f632aeb5" ON "certification_records" ("expiryDate")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_73714be6cadc16ad4c64d8c7bf" ON "certification_records" ("employeeId", "status")
        `);
        await queryRunner.query(`
            CREATE TABLE "employee_goals" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "employeeId" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "description" text NOT NULL,
                "category" character varying(50) NOT NULL,
                "targetDate" TIMESTAMP NOT NULL,
                "status" character varying(50) NOT NULL,
                "progress" numeric(5, 2) NOT NULL DEFAULT '0',
                "assignedBy" uuid,
                "milestones" jsonb,
                "notes" text,
                CONSTRAINT "PK_5419985e4b5ad0e7648981a8bab" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_91b88aeb88c18d2ea80ecb8db1" ON "employee_goals" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d636332f202ee8e055f0295bfb" ON "employee_goals" ("targetDate")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_07ce95dbc18f519c5f2caebdec" ON "employee_goals" ("employeeId", "status")
        `);
        await queryRunner.query(`
            CREATE TABLE "CafeHostnames" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "hostname" character varying NOT NULL,
                "isPrimary" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "cafeId" uuid NOT NULL,
                CONSTRAINT "UQ_0d5a461d8a3ea7272811947c76c" UNIQUE ("hostname"),
                CONSTRAINT "PK_8218e96474b2dce002864798076" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_0d5a461d8a3ea7272811947c76" ON "CafeHostnames" ("hostname")
        `);
        await queryRunner.query(`
            ALTER TABLE "Users"
            ALTER COLUMN "sub"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "scheduled_shifts"
            ADD CONSTRAINT "FK_33fa3fd4caeca2eb3cc91d61a99" FOREIGN KEY ("employeeId") REFERENCES "Employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "scheduled_shifts"
            ADD CONSTRAINT "FK_3a4a2d5dd8eb70e3616c2088ace" FOREIGN KEY ("counterId") REFERENCES "Counters"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "scheduled_shifts"
            ADD CONSTRAINT "FK_bef557a1d011dd2d088c5860860" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "shift_swap_requests"
            ADD CONSTRAINT "FK_7e1050d3b3e118f789d3b55e0d2" FOREIGN KEY ("requestingEmployeeId") REFERENCES "Employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "shift_swap_requests"
            ADD CONSTRAINT "FK_de80437f8cfde182f3f0978d27d" FOREIGN KEY ("targetEmployeeId") REFERENCES "Employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "shift_swap_requests"
            ADD CONSTRAINT "FK_792f177920af6055b1de95a353a" FOREIGN KEY ("requestingShiftId") REFERENCES "scheduled_shifts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "shift_swap_requests"
            ADD CONSTRAINT "FK_7cb0fd037c816f2fcbda05735f6" FOREIGN KEY ("targetShiftId") REFERENCES "scheduled_shifts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "shift_swap_requests"
            ADD CONSTRAINT "FK_4ad61966c2e300696a305ab9195" FOREIGN KEY ("approvedBy") REFERENCES "Users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "attendance_records"
            ADD CONSTRAINT "FK_2f86d1ade33d4dbc029e216904a" FOREIGN KEY ("employeeId") REFERENCES "Employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "attendance_records"
            ADD CONSTRAINT "FK_6fe9e80bee61d5ac47a27d40f2c" FOREIGN KEY ("shiftId") REFERENCES "scheduled_shifts"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "certification_records"
            ADD CONSTRAINT "FK_e94d51cc49452d128287c07eb11" FOREIGN KEY ("employeeId") REFERENCES "Employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "employee_goals"
            ADD CONSTRAINT "FK_91b88aeb88c18d2ea80ecb8db13" FOREIGN KEY ("employeeId") REFERENCES "Employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "employee_goals"
            ADD CONSTRAINT "FK_bb839039b91fe413ab4d722ce95" FOREIGN KEY ("assignedBy") REFERENCES "Users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "CafeHostnames"
            ADD CONSTRAINT "FK_03a0791236e4e5bbc88253c0ed9" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "CafeHostnames" DROP CONSTRAINT "FK_03a0791236e4e5bbc88253c0ed9"
        `);
        await queryRunner.query(`
            ALTER TABLE "employee_goals" DROP CONSTRAINT "FK_bb839039b91fe413ab4d722ce95"
        `);
        await queryRunner.query(`
            ALTER TABLE "employee_goals" DROP CONSTRAINT "FK_91b88aeb88c18d2ea80ecb8db13"
        `);
        await queryRunner.query(`
            ALTER TABLE "certification_records" DROP CONSTRAINT "FK_e94d51cc49452d128287c07eb11"
        `);
        await queryRunner.query(`
            ALTER TABLE "attendance_records" DROP CONSTRAINT "FK_6fe9e80bee61d5ac47a27d40f2c"
        `);
        await queryRunner.query(`
            ALTER TABLE "attendance_records" DROP CONSTRAINT "FK_2f86d1ade33d4dbc029e216904a"
        `);
        await queryRunner.query(`
            ALTER TABLE "shift_swap_requests" DROP CONSTRAINT "FK_4ad61966c2e300696a305ab9195"
        `);
        await queryRunner.query(`
            ALTER TABLE "shift_swap_requests" DROP CONSTRAINT "FK_7cb0fd037c816f2fcbda05735f6"
        `);
        await queryRunner.query(`
            ALTER TABLE "shift_swap_requests" DROP CONSTRAINT "FK_792f177920af6055b1de95a353a"
        `);
        await queryRunner.query(`
            ALTER TABLE "shift_swap_requests" DROP CONSTRAINT "FK_de80437f8cfde182f3f0978d27d"
        `);
        await queryRunner.query(`
            ALTER TABLE "shift_swap_requests" DROP CONSTRAINT "FK_7e1050d3b3e118f789d3b55e0d2"
        `);
        await queryRunner.query(`
            ALTER TABLE "scheduled_shifts" DROP CONSTRAINT "FK_bef557a1d011dd2d088c5860860"
        `);
        await queryRunner.query(`
            ALTER TABLE "scheduled_shifts" DROP CONSTRAINT "FK_3a4a2d5dd8eb70e3616c2088ace"
        `);
        await queryRunner.query(`
            ALTER TABLE "scheduled_shifts" DROP CONSTRAINT "FK_33fa3fd4caeca2eb3cc91d61a99"
        `);
        await queryRunner.query(`
            ALTER TABLE "Users"
            ALTER COLUMN "sub" DROP NOT NULL
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_0d5a461d8a3ea7272811947c76"
        `);
        await queryRunner.query(`
            DROP TABLE "CafeHostnames"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_07ce95dbc18f519c5f2caebdec"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d636332f202ee8e055f0295bfb"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_91b88aeb88c18d2ea80ecb8db1"
        `);
        await queryRunner.query(`
            DROP TABLE "employee_goals"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_73714be6cadc16ad4c64d8c7bf"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_2734a36c63b3a3cca0f632aeb5"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e94d51cc49452d128287c07eb1"
        `);
        await queryRunner.query(`
            DROP TABLE "certification_records"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."certification_records_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_22624a7cd14d0f97d0bff5fb7b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6fe9e80bee61d5ac47a27d40f2"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6fe9e80bee61d5ac47a27d40f2"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_2f86d1ade33d4dbc029e216904"
        `);
        await queryRunner.query(`
            DROP TABLE "attendance_records"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."attendance_records_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_beca1c4cdc67955be24f05335b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5644f8910d85b4fc166918cae4"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7cb0fd037c816f2fcbda05735f"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_792f177920af6055b1de95a353"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_de80437f8cfde182f3f0978d27"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7e1050d3b3e118f789d3b55e0d"
        `);
        await queryRunner.query(`
            DROP TABLE "shift_swap_requests"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."shift_swap_requests_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_93e41f4755ec0e6e820c880b59"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7eb14c0fd7aa9edf93147dc471"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3a4a2d5dd8eb70e3616c2088ac"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_33fa3fd4caeca2eb3cc91d61a9"
        `);
        await queryRunner.query(`
            DROP TABLE "scheduled_shifts"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."scheduled_shifts_status_enum"
        `);
    }

}
