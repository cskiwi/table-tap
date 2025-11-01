import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialDatabase1761996016181 implements MigrationInterface {
    name = 'InitialDatabase1761996016181'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."EmployeeWorkingHours_dayofweek_enum" AS ENUM(
                'monday',
                'tuesday',
                'wednesday',
                'thursday',
                'friday',
                'saturday',
                'sunday'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "EmployeeWorkingHours" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "employeeId" uuid NOT NULL,
                "dayOfWeek" "public"."EmployeeWorkingHours_dayofweek_enum" NOT NULL,
                "isWorking" boolean NOT NULL DEFAULT false,
                "startTime" character varying,
                "endTime" character varying,
                CONSTRAINT "PK_26f3966434e527226458a075c6a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_166fdf71fca58968f2c4a2f109" ON "EmployeeWorkingHours" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_6e0a1bfb3fa53d5119f0e8bec9" ON "EmployeeWorkingHours" ("employeeId", "dayOfWeek")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."TimeSheets_status_enum" AS ENUM(
                'scheduled',
                'started',
                'on_break',
                'completed',
                'no_show',
                'cancelled'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "TimeSheets" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "cafeId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "shiftDate" date NOT NULL,
                "status" "public"."TimeSheets_status_enum" NOT NULL DEFAULT 'scheduled',
                "scheduledStartTime" TIME,
                "scheduledEndTime" TIME,
                "scheduledHours" integer,
                "actualStartTime" TIMESTAMP,
                "actualEndTime" TIMESTAMP,
                "actualHours" numeric(5, 2),
                "breakMinutes" numeric(5, 2),
                "paidBreakMinutes" numeric(5, 2),
                "hourlyRate" numeric(10, 2),
                "regularPay" numeric(10, 2),
                "overtimePay" numeric(10, 2),
                "totalPay" numeric(10, 2),
                "position" character varying,
                "countersWorked" text,
                "isApproved" boolean NOT NULL DEFAULT false,
                "approvedById" uuid,
                "approvedAt" TIMESTAMP,
                "notes" text,
                "employeeNotes" text,
                CONSTRAINT "PK_67632a0762528dd8152ce60c72b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ce7723486df238f84c1078b673" ON "TimeSheets" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e0b92ebc9e4c1ba3c116922c59" ON "TimeSheets" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_3a8be6468163f483ce4229cb48" ON "TimeSheets" ("employeeId", "shiftDate")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_6d7cbc95ac475d5fe24822a97c" ON "TimeSheets" ("cafeId", "employeeId", "shiftDate")
        `);
        await queryRunner.query(`
            CREATE TABLE "TimeEntries" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "timeSheetId" uuid NOT NULL,
                "entryType" character varying NOT NULL,
                "timestamp" TIMESTAMP NOT NULL,
                "location" character varying,
                "method" character varying,
                "notes" text,
                "latitude" numeric(10, 8),
                "longitude" numeric(11, 8),
                "isAdjusted" boolean NOT NULL DEFAULT false,
                "originalTimestamp" TIMESTAMP,
                "adjustmentReason" character varying,
                "adjustedById" uuid,
                "adjustedAt" TIMESTAMP,
                CONSTRAINT "PK_4480ad8f7098a2517bdd1d13128" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1dfb871e5bd4374243368deec9" ON "TimeEntries" ("timeSheetId")
        `);
        await queryRunner.query(`
            CREATE TABLE "EmployeeEmergencyContact" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "employeeId" uuid NOT NULL,
                "name" character varying NOT NULL,
                "relationship" character varying NOT NULL,
                "phone" character varying NOT NULL,
                "alternatePhone" character varying,
                "email" character varying,
                "address" text,
                CONSTRAINT "PK_3077ee1784dd639a67eca53155f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_f067ac5dc265f4e9069bb8063c" ON "EmployeeEmergencyContact" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."Employees_position_enum" AS ENUM(
                'customer',
                'employee',
                'supervisor',
                'manager',
                'admin',
                'owner',
                'cashier',
                'barista',
                'kitchen',
                'kitchen_staff',
                'waiter',
                'server',
                'cleaner'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."Employees_status_enum" AS ENUM(
                'active',
                'inactive',
                'on_break',
                'off_duty',
                'sick_leave',
                'vacation',
                'terminated'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "Employees" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "cafeId" uuid NOT NULL,
                "userId" uuid,
                "employeeId" character varying NOT NULL,
                "badgeNumber" character varying,
                "firstName" character varying NOT NULL,
                "lastName" character varying NOT NULL,
                "email" character varying,
                "phone" character varying,
                "position" "public"."Employees_position_enum" NOT NULL DEFAULT 'employee',
                "status" "public"."Employees_status_enum" NOT NULL DEFAULT 'active',
                "hireDate" date NOT NULL,
                "terminationDate" date,
                "hourlyRate" numeric(10, 2),
                "salary" numeric(10, 2),
                "payType" character varying,
                "countersAccess" text,
                "maxHoursPerWeek" integer,
                "canProcessPayments" boolean NOT NULL DEFAULT false,
                "canRefundOrders" boolean NOT NULL DEFAULT false,
                "canCancelOrders" boolean NOT NULL DEFAULT false,
                "canViewReports" boolean NOT NULL DEFAULT false,
                "canManageInventory" boolean NOT NULL DEFAULT false,
                "discountLimit" numeric(10, 2),
                "isClockedIn" boolean NOT NULL DEFAULT false,
                "lastClockIn" TIMESTAMP,
                "lastClockOut" TIMESTAMP,
                "currentCounterId" uuid,
                "emergencyContactName" character varying,
                "emergencyContactPhone" character varying,
                "notes" text,
                CONSTRAINT "UQ_6b8f7af3befe258c2bb6ed5a45d" UNIQUE ("employeeId"),
                CONSTRAINT "UQ_d759e52714d921c866f6fd299aa" UNIQUE ("email"),
                CONSTRAINT "PK_42cbd69fa6c59f000fdc0c07bb9" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6700509e032755f15eeca2aad8" ON "Employees" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_26991f337433972a0848d61541" ON "Employees" ("userId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_6b8f7af3befe258c2bb6ed5a45" ON "Employees" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ce87cac81a226be1e6992051d9" ON "Employees" ("firstName")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_47fd6f6b6c4025b2ee42bb8dfe" ON "Employees" ("lastName")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_f9c63acc5a12f74368c4c57e8e" ON "Employees" ("email")
            WHERE "email" IS NOT NULL
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_44b74604cbc981f4e99c18b0d8" ON "Employees" ("cafeId", "status")
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyAccountBadges" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "loyaltyAccountId" uuid NOT NULL,
                "badgeId" character varying NOT NULL,
                "name" character varying NOT NULL,
                "description" text NOT NULL,
                "icon" character varying NOT NULL,
                "earnedAt" TIMESTAMP NOT NULL,
                "category" character varying NOT NULL,
                CONSTRAINT "PK_3e8866c35c3f0a963ef262e6c9e" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c45b20581c5eca570d4ebe3f31" ON "LoyaltyAccountBadges" ("loyaltyAccountId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_70dd76efdeaf58d129fab6693a" ON "LoyaltyAccountBadges" ("loyaltyAccountId", "badgeId")
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyAccountChallengeProgresses" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "loyaltyAccountId" uuid NOT NULL,
                "challengeId" uuid NOT NULL,
                "progress" integer NOT NULL,
                "target" integer NOT NULL,
                "startedAt" TIMESTAMP NOT NULL,
                "completedAt" TIMESTAMP,
                CONSTRAINT "PK_a07b05d52224d66b70001616566" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_667d5d8808293c63a6930ff884" ON "LoyaltyAccountChallengeProgresses" ("loyaltyAccountId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8b482393c0f76d45917900c9d2" ON "LoyaltyAccountChallengeProgresses" ("challengeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1c287d5f20aa4e7fdaba6dfd98" ON "LoyaltyAccountChallengeProgresses" ("loyaltyAccountId", "challengeId")
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyAccountPreferences" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "loyaltyAccountId" uuid NOT NULL,
                "emailNotifications" boolean DEFAULT false,
                "smsNotifications" boolean DEFAULT false,
                "pushNotifications" boolean DEFAULT false,
                "marketingEmails" boolean DEFAULT false,
                "birthdayReminders" boolean DEFAULT false,
                "pointsExpiry" boolean DEFAULT false,
                "newRewards" boolean DEFAULT false,
                CONSTRAINT "REL_e6554298583b056388476fe607" UNIQUE ("loyaltyAccountId"),
                CONSTRAINT "PK_d8e8cd26e382fa97f59a9839bc7" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_e6554298583b056388476fe607" ON "LoyaltyAccountPreferences" ("loyaltyAccountId")
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyTierBenefits" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "loyaltyTierId" uuid NOT NULL,
                "freeItemsPerMonth" integer,
                "freeItemCategories" text,
                "earlyAccess" boolean DEFAULT false,
                "exclusiveOffers" boolean DEFAULT false,
                "personalizedService" boolean DEFAULT false,
                "birthdayBonus" numeric(10, 2),
                "birthdayFreeItem" boolean DEFAULT false,
                "doublePointsDays" text,
                "specialEventInvites" boolean DEFAULT false,
                "customizations" boolean DEFAULT false,
                CONSTRAINT "REL_c47f24ed12a0f8b80666e00671" UNIQUE ("loyaltyTierId"),
                CONSTRAINT "PK_dc0359cb1f2bd14685cb43c8778" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_c47f24ed12a0f8b80666e00671" ON "LoyaltyTierBenefits" ("loyaltyTierId")
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyTiers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "cafeId" uuid NOT NULL,
                "name" character varying NOT NULL,
                "description" text,
                "level" integer NOT NULL,
                "color" character varying NOT NULL DEFAULT '#6B7280',
                "icon" character varying,
                "pointsRequired" numeric(10, 2) NOT NULL DEFAULT '0',
                "totalSpendRequired" numeric(10, 2) NOT NULL DEFAULT '0',
                "ordersRequired" integer NOT NULL DEFAULT '0',
                "pointsMultiplier" numeric(5, 4) NOT NULL DEFAULT '1',
                "discountPercentage" numeric(5, 4) NOT NULL DEFAULT '0',
                "freeDeliveryThreshold" numeric(10, 2) NOT NULL DEFAULT '0',
                "priority" integer NOT NULL DEFAULT '0',
                "validityDays" integer NOT NULL DEFAULT '365',
                "maintenanceSpendRequired" numeric(10, 2) NOT NULL DEFAULT '0',
                "isActive" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_06cac9bf33e6c7b569c7fd1916c" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6427596aaf89c0e101a7dbbb7b" ON "LoyaltyTiers" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_cb6a16f517e1e77120c55399f3" ON "LoyaltyTiers" ("level")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e586dc9b168d5289860113c47b" ON "LoyaltyTiers" ("cafeId", "isActive")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_14e8596806a56b248531fcc37e" ON "LoyaltyTiers" ("cafeId", "level")
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyTransactionMetadata" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "transactionId" uuid NOT NULL,
                "productIds" text,
                "categoryIds" text,
                "multiplierApplied" numeric(5, 2),
                "promotionId" uuid,
                "rewardId" uuid,
                "rewardName" character varying,
                "discountAmount" numeric(10, 2),
                "referredUserId" uuid,
                "referrerUserId" uuid,
                "previousTierId" uuid,
                "newTierId" uuid,
                CONSTRAINT "REL_8207c6ba54814f10e54aa7cef9" UNIQUE ("transactionId"),
                CONSTRAINT "PK_b968f3e4771b1879d22426043fc" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_8207c6ba54814f10e54aa7cef9" ON "LoyaltyTransactionMetadata" ("transactionId")
        `);
        await queryRunner.query(`
            CREATE TABLE "OrderItemCustomizations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "orderItemId" uuid NOT NULL,
                "size" character varying,
                "temperature" character varying,
                "milkType" character varying,
                "sweetness" character varying,
                "extras" text,
                "removals" text,
                CONSTRAINT "REL_34d28176cf129c2161491f5ac8" UNIQUE ("orderItemId"),
                CONSTRAINT "PK_9412081da780bfa96adc3955dbc" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_34d28176cf129c2161491f5ac8" ON "OrderItemCustomizations" ("orderItemId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."OrderItemCounterStatuses_status_enum" AS ENUM('pending', 'in_progress', 'completed')
        `);
        await queryRunner.query(`
            CREATE TABLE "OrderItemCounterStatuses" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "orderItemId" uuid NOT NULL,
                "counterId" uuid NOT NULL,
                "status" "public"."OrderItemCounterStatuses_status_enum" NOT NULL DEFAULT 'pending',
                "startedAt" TIMESTAMP,
                "completedAt" TIMESTAMP,
                CONSTRAINT "PK_0b6c446249e531df9b872fda62d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_741b58f16b0913337961fad157" ON "OrderItemCounterStatuses" ("orderItemId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_27b0f5459dbfbfdcb9b1bd1cb6" ON "OrderItemCounterStatuses" ("counterId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_2616de054e96787d4d15d75f93" ON "OrderItemCounterStatuses" ("orderItemId", "counterId")
        `);
        await queryRunner.query(`
            CREATE TABLE "ProductAttributes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "productId" uuid NOT NULL,
                "size" text,
                "temperature" text,
                "milkType" text,
                "sweetness" text,
                "extras" text,
                "allergens" text,
                "nutritionInfo" text,
                CONSTRAINT "PK_13d353f1a408ab557e20f42feb7" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_b385a5e148ac0a4916369292e1" ON "ProductAttributes" ("productId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."StockMovements_movementtype_enum" AS ENUM(
                'purchase',
                'sale',
                'waste',
                'adjustment',
                'transfer',
                'return'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "StockMovements" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "cafeId" uuid NOT NULL,
                "productId" uuid NOT NULL,
                "movementType" "public"."StockMovements_movementtype_enum" NOT NULL,
                "quantity" numeric(10, 2) NOT NULL,
                "previousQuantity" numeric(10, 2) NOT NULL,
                "newQuantity" numeric(10, 2) NOT NULL,
                "unitCost" numeric(10, 2),
                "totalCost" numeric(10, 2),
                "referenceId" character varying,
                "referenceType" character varying,
                "reason" text,
                "notes" text,
                "performedById" uuid,
                "batchNumber" character varying,
                "expiryDate" date,
                "supplier" character varying,
                CONSTRAINT "PK_7232f0c6a9c63efd42afb48804b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f4fb4e183bd9ee4a2622096e6e" ON "StockMovements" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f7dee9c8a2f39d6fc4b10f986f" ON "StockMovements" ("productId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_7c4b62060a9ccc86406743d405" ON "StockMovements" ("productId", "movementType")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1591c08b8d537b1bb3321760e4" ON "StockMovements" ("cafeId", "productId")
        `);
        await queryRunner.query(`
            CREATE TABLE "Stock" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "cafeId" uuid NOT NULL,
                "productId" uuid NOT NULL,
                "currentQuantity" numeric(10, 2) NOT NULL DEFAULT '0',
                "reservedQuantity" numeric(10, 2) NOT NULL DEFAULT '0',
                "minLevel" numeric(10, 2) NOT NULL DEFAULT '0',
                "maxLevel" numeric(10, 2) NOT NULL DEFAULT '0',
                "reorderLevel" numeric(10, 2) NOT NULL DEFAULT '0',
                "reorderQuantity" numeric(10, 2) NOT NULL DEFAULT '0',
                "averageCost" numeric(10, 2),
                "lastCost" numeric(10, 2),
                "unitCost" numeric(10, 2),
                "sku" character varying,
                "category" character varying,
                "supplier" character varying,
                "expiryDate" TIMESTAMP,
                "minimumStock" numeric(10, 2) NOT NULL DEFAULT '0',
                "maximumStock" numeric(10, 2),
                "location" character varying,
                "unit" character varying,
                "isActive" boolean NOT NULL DEFAULT true,
                "lowStockAlert" boolean NOT NULL DEFAULT false,
                "outOfStockAlert" boolean NOT NULL DEFAULT false,
                "status" character varying DEFAULT 'active',
                "lastRestockedAt" TIMESTAMP,
                "lastSoldAt" TIMESTAMP,
                CONSTRAINT "UQ_9ee732e1cc687f8a67c5d12fcc1" UNIQUE ("sku"),
                CONSTRAINT "PK_2725537b7bbe40073a50986598d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_08518d80e907e6318dc3c92ac6" ON "Stock" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_17b0ef39058eca67f3bcd9aa49" ON "Stock" ("productId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_c442ad54cfaaf16727b1b7ccdb" ON "Stock" ("cafeId", "productId")
        `);
        await queryRunner.query(`
            CREATE TABLE "InventoryAlertMetadata" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "alertId" uuid NOT NULL,
                "previousQuantity" numeric(10, 2),
                "expectedRestock" TIMESTAMP,
                "autoReorderTriggered" boolean DEFAULT false,
                "supplierNotified" boolean DEFAULT false,
                "estimatedOutOfStockDate" TIMESTAMP,
                CONSTRAINT "REL_765861d496786455de81335078" UNIQUE ("alertId"),
                CONSTRAINT "PK_214d73982e21dd8e954dfa2f94d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_765861d496786455de81335078" ON "InventoryAlertMetadata" ("alertId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."InventoryAlerts_type_enum" AS ENUM(
                'LOW_STOCK',
                'OUT_OF_STOCK',
                'EXPIRING_SOON',
                'EXPIRED',
                'OVER_STOCK',
                'REORDER_NEEDED',
                'QUALITY_ISSUE',
                'PRICE_CHANGE',
                'TEMPERATURE',
                'EQUIPMENT'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."InventoryAlerts_severity_enum" AS ENUM('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
        `);
        await queryRunner.query(`
            CREATE TABLE "InventoryAlerts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "cafeId" uuid NOT NULL,
                "stockId" uuid NOT NULL,
                "type" "public"."InventoryAlerts_type_enum" NOT NULL,
                "severity" "public"."InventoryAlerts_severity_enum" NOT NULL,
                "title" character varying NOT NULL,
                "message" text NOT NULL,
                "currentStock" numeric(10, 2) NOT NULL,
                "minimumStock" numeric(10, 2),
                "reorderLevel" numeric(10, 2),
                "expiryDate" TIMESTAMP,
                "itemName" character varying NOT NULL,
                "sku" character varying,
                "category" character varying,
                "resolved" boolean NOT NULL DEFAULT false,
                "resolvedAt" TIMESTAMP,
                "resolvedByUserId" uuid,
                "resolutionNotes" text,
                "actionUrl" character varying,
                "actionLabel" character varying,
                "acknowledged" boolean NOT NULL DEFAULT false,
                "acknowledgedAt" TIMESTAMP,
                "acknowledgedByUserId" uuid,
                CONSTRAINT "PK_e7325f756803ca8dc8ecf5b4adc" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_9e8a2391fcefd257bdbb2529c9" ON "InventoryAlerts" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_407344b46e1f5376ed3cf2d476" ON "InventoryAlerts" ("stockId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d886ce872af0b9c2bd39350e4a" ON "InventoryAlerts" ("cafeId", "type")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_9c5d50724b926aca028b92e937" ON "InventoryAlerts" ("cafeId", "severity")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_44d5d29e38090f39cb7e2fdf3c" ON "InventoryAlerts" ("cafeId", "resolved")
        `);
        await queryRunner.query(`
            CREATE TABLE "Purchases" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "cafeId" uuid NOT NULL,
                "purchaseNumber" character varying NOT NULL,
                "supplierInvoiceNumber" character varying,
                "supplierId" uuid,
                "supplierName" character varying NOT NULL,
                "supplierEmail" character varying,
                "supplierPhone" character varying,
                "supplierAddress" text,
                "orderDate" date NOT NULL,
                "expectedDeliveryDate" date,
                "actualDeliveryDate" date,
                "status" character varying NOT NULL DEFAULT 'pending',
                "subtotal" numeric(10, 2) NOT NULL,
                "taxAmount" numeric(10, 2),
                "taxRate" numeric(5, 2),
                "shippingCost" numeric(10, 2),
                "discountAmount" numeric(10, 2),
                "totalAmount" numeric(10, 2) NOT NULL,
                "isPaid" boolean NOT NULL DEFAULT false,
                "paidDate" date,
                "paymentMethod" character varying,
                "paymentReference" character varying,
                "createdById" uuid,
                "approvedById" uuid,
                "approvedAt" TIMESTAMP,
                "notes" text,
                "deliveryInstructions" text,
                "attachments" text,
                CONSTRAINT "UQ_92c54f5fa6a90a0819fa83c2109" UNIQUE ("purchaseNumber"),
                CONSTRAINT "PK_00390719c1ac6a45d5c161d4d51" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_899b00052061e1b9a38e34dfbe" ON "Purchases" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_92c54f5fa6a90a0819fa83c210" ON "Purchases" ("purchaseNumber")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_84130443f81572f0b1f1600917" ON "Purchases" ("cafeId", "purchaseNumber")
        `);
        await queryRunner.query(`
            CREATE TABLE "PurchaseItems" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "purchaseId" uuid NOT NULL,
                "productId" uuid,
                "productName" character varying NOT NULL,
                "productSku" character varying,
                "category" character varying,
                "quantity" numeric(10, 2) NOT NULL,
                "unitCost" numeric(10, 2) NOT NULL,
                "totalCost" numeric(10, 2) NOT NULL,
                "unit" character varying,
                "batchNumber" character varying,
                "expiryDate" date,
                "notes" text,
                CONSTRAINT "PK_71afdc7bbf12f2b9f62e49d1be0" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_380e1a22e1e8470a27cdf2b07c" ON "PurchaseItems" ("purchaseId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."Products_category_enum" AS ENUM(
                'coffee',
                'tea',
                'cold_drinks',
                'hot_drinks',
                'alcoholic',
                'food',
                'snacks',
                'desserts',
                'breakfast',
                'lunch',
                'dinner',
                'specialty',
                'seasonal'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."Products_status_enum" AS ENUM(
                'active',
                'inactive',
                'out_of_stock',
                'discontinued',
                'seasonal_unavailable'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "Products" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "cafeId" uuid NOT NULL,
                "name" character varying NOT NULL,
                "description" character varying,
                "sku" character varying,
                "category" "public"."Products_category_enum" NOT NULL,
                "status" "public"."Products_status_enum" NOT NULL DEFAULT 'active',
                "basePrice" numeric(10, 2) NOT NULL,
                "discountPrice" numeric(10, 2),
                "taxRate" numeric(5, 2),
                "image" character varying,
                "isAvailable" boolean NOT NULL DEFAULT true,
                "isFeatured" boolean NOT NULL DEFAULT false,
                "sortOrder" integer NOT NULL DEFAULT '0',
                "trackInventory" boolean NOT NULL DEFAULT false,
                "stockQuantity" integer,
                "minStockLevel" integer,
                "tags" text,
                "countersRequired" text,
                "preparationTime" integer,
                CONSTRAINT "UQ_eb2e6c7c03ea341ff8fcbcdb6f7" UNIQUE ("sku"),
                CONSTRAINT "PK_36a07cc432789830e7fb7b58a83" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f937407f1f51448fd5e30cf911" ON "Products" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_26c9336d231c4e90419a5954bd" ON "Products" ("name")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_d47501bbb68f7b8e87c41bed31" ON "Products" ("sku")
            WHERE "sku" IS NOT NULL
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_73672ec2e00a65cc52afa58887" ON "Products" ("cafeId", "category")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."OrderItems_preparationstatus_enum" AS ENUM(
                'pending',
                'in_progress',
                'completed',
                'on_hold',
                'cancelled'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "OrderItems" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "orderId" uuid NOT NULL,
                "productId" uuid NOT NULL,
                "quantity" integer NOT NULL,
                "unitPrice" numeric(10, 2) NOT NULL,
                "totalPrice" numeric(10, 2) NOT NULL,
                "productName" character varying NOT NULL,
                "productDescription" character varying,
                "productSku" character varying,
                "specialInstructions" text,
                "allergiesNotes" text,
                "basePrice" numeric(10, 2),
                "customizationPrice" numeric(10, 2),
                "discountAmount" numeric(10, 2),
                "countersRequired" text,
                "preparationStatus" "public"."OrderItems_preparationstatus_enum" DEFAULT 'pending',
                "preparationStartTime" TIMESTAMP,
                "preparationEndTime" TIMESTAMP,
                CONSTRAINT "PK_567f75d7ff079b9ab3e6dd33708" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f91820d35e8129e7dd09881d88" ON "OrderItems" ("orderId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f11d5c16edede51cea87a8c4bf" ON "OrderItems" ("productId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."OrderWorkflowSteps_status_enum" AS ENUM('pending', 'in_progress', 'completed')
        `);
        await queryRunner.query(`
            CREATE TABLE "OrderWorkflowSteps" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "orderId" uuid NOT NULL,
                "stepName" character varying NOT NULL,
                "status" "public"."OrderWorkflowSteps_status_enum" NOT NULL DEFAULT 'pending',
                "assignedCounterId" uuid,
                "startedAt" TIMESTAMP,
                "completedAt" TIMESTAMP,
                "sortOrder" integer NOT NULL DEFAULT '0',
                CONSTRAINT "PK_48124e4cf755954102e455ffb04" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c88f3cf369a93dca66e5bdbb41" ON "OrderWorkflowSteps" ("orderId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_13024b1902491c3c9bae575d78" ON "OrderWorkflowSteps" ("orderId", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_438168ff4de2cfc3d5a2a1beaa" ON "OrderWorkflowSteps" ("orderId", "stepName")
        `);
        await queryRunner.query(`
            CREATE TABLE "CreditRestrictions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "creditId" uuid NOT NULL,
                "minOrderAmount" numeric(10, 2),
                "maxUsageCount" integer,
                "validProducts" text,
                "validCategories" text,
                "validDays" text,
                "validTimeStart" character varying,
                "validTimeEnd" character varying,
                CONSTRAINT "REL_b9e488b63f651827b2a9c12d3d" UNIQUE ("creditId"),
                CONSTRAINT "PK_e8bfa9b2f86c7297e9b13726ddd" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_b9e488b63f651827b2a9c12d3d" ON "CreditRestrictions" ("creditId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."Credits_transactiontype_enum" AS ENUM(
                'purchase',
                'refund',
                'credit_add',
                'credit_deduct',
                'stock_purchase',
                'adjustment',
                'void',
                'discount',
                'surcharge'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "Credits" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "cafeId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "transactionType" "public"."Credits_transactiontype_enum" NOT NULL,
                "amount" numeric(10, 2) NOT NULL,
                "balanceBefore" numeric(10, 2) NOT NULL,
                "balanceAfter" numeric(10, 2) NOT NULL,
                "orderId" uuid,
                "referenceId" character varying,
                "referenceType" character varying,
                "description" character varying,
                "notes" text,
                "source" character varying,
                "performedById" uuid,
                "expiresAt" TIMESTAMP,
                "promotionCode" character varying,
                "usageCount" integer,
                CONSTRAINT "PK_e9b24c08e0cd53724e708188615" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1c422be773dea8459e68b8f57c" ON "Credits" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4d8f1a1f5061e65f6c599816e5" ON "Credits" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_53a053fb4483675ade1bd30412" ON "Credits" ("userId", "transactionType")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5b3f2897bf253623e9e31937de" ON "Credits" ("cafeId", "userId")
        `);
        await queryRunner.query(`
            CREATE TABLE "PaymentProviderData" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "paymentId" uuid NOT NULL,
                "qrCode" character varying,
                "qrExpiry" TIMESTAMP,
                "last4" character varying,
                "cardType" character varying,
                "authCode" character varying,
                "walletType" character varying,
                "providerResponse" text,
                CONSTRAINT "REL_b93d086efba962b98e664a9a6a" UNIQUE ("paymentId"),
                CONSTRAINT "PK_ba2f512f2125b4a3d4e3839d281" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_b93d086efba962b98e664a9a6a" ON "PaymentProviderData" ("paymentId")
        `);
        await queryRunner.query(`
            CREATE TABLE "PaymentReceiptData" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "paymentId" uuid NOT NULL,
                "customerEmail" character varying,
                "customerPhone" character varying,
                "printedAt" TIMESTAMP,
                "emailedAt" TIMESTAMP,
                CONSTRAINT "REL_bd1c38910d9e7f7a53cac2dcee" UNIQUE ("paymentId"),
                CONSTRAINT "PK_be9dc25c4b965df0d0c7851e05b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_bd1c38910d9e7f7a53cac2dcee" ON "PaymentReceiptData" ("paymentId")
        `);
        await queryRunner.query(`
            CREATE TABLE "PaymentMetadata" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "paymentId" uuid NOT NULL,
                "verificationResult" text,
                "verifiedAt" TIMESTAMP,
                "verificationError" text,
                "lastVerificationAttempt" TIMESTAMP,
                "error" text,
                "errorOccurredAt" TIMESTAMP,
                "refundErrorMessage" text,
                "refundAttemptedAt" TIMESTAMP,
                "refundAttemptedAmount" numeric(10, 2),
                "webhookId" character varying,
                "webhookReceivedAt" TIMESTAMP,
                "webhookPayload" text,
                "ipAddress" character varying,
                "userAgent" text,
                "gatewayResponse" text,
                "gatewayTransactionId" character varying,
                "notes" text,
                "processingSource" character varying,
                "retryCount" integer,
                "lastRetryAt" TIMESTAMP,
                "auditTrail" json,
                CONSTRAINT "REL_28231f3bd7122736ec0e7e2113" UNIQUE ("paymentId"),
                CONSTRAINT "PK_aa238a33055920c11a7f448bd13" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_28231f3bd7122736ec0e7e2113" ON "PaymentMetadata" ("paymentId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."Payments_method_enum" AS ENUM(
                'qr',
                'payconic',
                'cash',
                'credit',
                'card',
                'credit_card',
                'debit_card',
                'mobile',
                'mobile_payment',
                'voucher',
                'gift_card',
                'store_credit',
                'split_payment'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."Payments_status_enum" AS ENUM(
                'pending',
                'processing',
                'authorized',
                'captured',
                'completed',
                'failed',
                'cancelled',
                'refunded',
                'partially_refunded'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."Payments_type_enum" AS ENUM(
                'purchase',
                'refund',
                'credit_add',
                'credit_deduct',
                'stock_purchase',
                'adjustment',
                'void',
                'discount',
                'surcharge'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "Payments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "orderId" uuid NOT NULL,
                "userId" uuid,
                "method" "public"."Payments_method_enum" NOT NULL,
                "status" "public"."Payments_status_enum" NOT NULL DEFAULT 'pending',
                "type" "public"."Payments_type_enum" NOT NULL DEFAULT 'purchase',
                "amount" numeric(10, 2) NOT NULL,
                "transactionId" character varying,
                "externalTransactionId" character varying,
                "paymentProvider" character varying,
                "authorizationId" character varying,
                "authorizedAt" TIMESTAMP,
                "capturedAt" TIMESTAMP,
                "failureReason" character varying,
                "failureCode" character varying,
                "refundedAmount" numeric(10, 2),
                "refundedAt" TIMESTAMP,
                "refundReason" character varying,
                "processedByEmployeeId" uuid,
                "processedAt" TIMESTAMP,
                "processorResponse" character varying,
                "notes" text,
                "receiptNumber" character varying,
                CONSTRAINT "PK_50c3077812277d7b8c68c54d61a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "orderId" ON "Payments" ("orderId")
        `);
        await queryRunner.query(`
            CREATE INDEX "userId" ON "Payments" ("userId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "transactionId" ON "Payments" ("transactionId")
            WHERE "transactionId" IS NOT NULL
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0cb7b81de6e8f9f84a7c5a40bf" ON "Payments" ("method", "status")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."Orders_status_enum" AS ENUM(
                'pending',
                'confirmed',
                'preparing',
                'ready',
                'delivered',
                'cancelled',
                'refunded',
                'failed'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."Orders_priority_enum" AS ENUM('low', 'normal', 'high', 'urgent', 'rush')
        `);
        await queryRunner.query(`
            CREATE TABLE "Orders" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "cafeId" uuid NOT NULL,
                "orderNumber" character varying NOT NULL,
                "status" "public"."Orders_status_enum" NOT NULL DEFAULT 'pending',
                "customerId" uuid,
                "customerName" character varying,
                "customerPhone" character varying,
                "customerEmail" character varying,
                "createdByEmployeeId" uuid,
                "assignedStaffId" uuid,
                "subtotal" numeric(10, 2) NOT NULL,
                "taxAmount" numeric(10, 2) NOT NULL DEFAULT '0',
                "serviceCharge" numeric(10, 2) NOT NULL DEFAULT '0',
                "discountAmount" numeric(10, 2) NOT NULL DEFAULT '0',
                "totalAmount" numeric(10, 2) NOT NULL,
                "total" numeric(10, 2) NOT NULL,
                "orderType" character varying,
                "tableNumber" character varying,
                "notes" text,
                "specialInstructions" text,
                "priority" "public"."Orders_priority_enum" DEFAULT 'normal',
                "counterId" uuid,
                "estimatedPrepTime" integer,
                "confirmedAt" TIMESTAMP,
                "preparingAt" TIMESTAMP,
                "readyAt" TIMESTAMP,
                "deliveredAt" TIMESTAMP,
                "cancelledAt" TIMESTAMP,
                "source" character varying,
                "isPaid" boolean NOT NULL DEFAULT false,
                CONSTRAINT "UQ_69cbec8966ebb42d2fc88f5e37e" UNIQUE ("orderNumber"),
                CONSTRAINT "PK_ce8e3c4d56e47ff9c8189c26213" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_718ff5452f643301a09d8f184b" ON "Orders" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_69cbec8966ebb42d2fc88f5e37" ON "Orders" ("orderNumber")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f4a5166f839fe35ace8ad64d15" ON "Orders" ("customerId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_29440a57137fd29752d6195809" ON "Orders" ("cafeId", "orderNumber")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_468561b66624a9e04f0e7827be" ON "Orders" ("cafeId", "status")
        `);
        await queryRunner.query(`
            CREATE TABLE "SalesTopProducts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "salesAnalyticsId" uuid NOT NULL,
                "productId" uuid NOT NULL,
                "productName" character varying NOT NULL,
                "quantitySold" integer NOT NULL,
                "revenue" numeric(12, 2) NOT NULL,
                "growthRate" numeric(7, 2) NOT NULL,
                CONSTRAINT "PK_b7e9b26ea6cbf6f575bb9c3ba45" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ce76e2301435b2eb00cfe2b6e6" ON "SalesTopProducts" ("salesAnalyticsId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f5f59f3f3e3d2952ae515824c4" ON "SalesTopProducts" ("productId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_64f17c4a6dc3070362b4623d18" ON "SalesTopProducts" ("salesAnalyticsId", "productId")
        `);
        await queryRunner.query(`
            CREATE TABLE "SalesCategoryBreakdowns" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "salesAnalyticsId" uuid NOT NULL,
                "category" character varying NOT NULL,
                "quantitySold" integer NOT NULL,
                "revenue" numeric(12, 2) NOT NULL,
                "percentage" numeric(5, 2) NOT NULL,
                CONSTRAINT "PK_9d2da31b1fb367699bd1bda9a89" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ee50236c81fb76216c08deb076" ON "SalesCategoryBreakdowns" ("salesAnalyticsId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ecb42a81652dd64881d17fc081" ON "SalesCategoryBreakdowns" ("salesAnalyticsId", "category")
        `);
        await queryRunner.query(`
            CREATE TABLE "SalesPaymentMethodBreakdowns" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "salesAnalyticsId" uuid NOT NULL,
                "card" numeric(12, 2) NOT NULL DEFAULT '0',
                "cash" numeric(12, 2) NOT NULL DEFAULT '0',
                "digital" numeric(12, 2) NOT NULL DEFAULT '0',
                "other" numeric(12, 2) NOT NULL DEFAULT '0',
                CONSTRAINT "REL_bc29c6042feeeb8a0de96dc3a8" UNIQUE ("salesAnalyticsId"),
                CONSTRAINT "PK_e843731593a7627606d42f89129" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_bc29c6042feeeb8a0de96dc3a8" ON "SalesPaymentMethodBreakdowns" ("salesAnalyticsId")
        `);
        await queryRunner.query(`
            CREATE TABLE "SalesOrderTypeBreakdowns" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "salesAnalyticsId" uuid NOT NULL,
                "dineIn" numeric(12, 2) NOT NULL DEFAULT '0',
                "takeaway" numeric(12, 2) NOT NULL DEFAULT '0',
                "delivery" numeric(12, 2) NOT NULL DEFAULT '0',
                CONSTRAINT "REL_091884982c56155d20d83728c9" UNIQUE ("salesAnalyticsId"),
                CONSTRAINT "PK_c86d082ee152abd1e2df7ebf4e6" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_091884982c56155d20d83728c9" ON "SalesOrderTypeBreakdowns" ("salesAnalyticsId")
        `);
        await queryRunner.query(`
            CREATE TABLE "SalesPeakHours" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "salesAnalyticsId" uuid NOT NULL,
                "hour" integer NOT NULL,
                "orderCount" integer NOT NULL,
                "revenue" numeric(12, 2) NOT NULL,
                CONSTRAINT "PK_5f257036e1b7d6df591e294759f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ae866ddcccfd6ca8e7ee604222" ON "SalesPeakHours" ("salesAnalyticsId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_114bdb76b34c068434c5a248d2" ON "SalesPeakHours" ("salesAnalyticsId", "hour")
        `);
        await queryRunner.query(`
            CREATE TABLE "SalesAnalytics" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "cafeId" uuid NOT NULL,
                "periodType" character varying NOT NULL,
                "periodStart" TIMESTAMP NOT NULL,
                "periodEnd" TIMESTAMP NOT NULL,
                "totalRevenue" numeric(12, 2) NOT NULL DEFAULT '0',
                "netRevenue" numeric(12, 2) NOT NULL DEFAULT '0',
                "taxCollected" numeric(12, 2) NOT NULL DEFAULT '0',
                "serviceCharges" numeric(12, 2) NOT NULL DEFAULT '0',
                "discountsGiven" numeric(12, 2) NOT NULL DEFAULT '0',
                "refundsIssued" numeric(12, 2) NOT NULL DEFAULT '0',
                "totalOrders" integer NOT NULL DEFAULT '0',
                "completedOrders" integer NOT NULL DEFAULT '0',
                "cancelledOrders" integer NOT NULL DEFAULT '0',
                "averageOrderValue" numeric(10, 2) NOT NULL DEFAULT '0',
                "averageOrderTime" numeric(10, 2) NOT NULL DEFAULT '0',
                "uniqueCustomers" integer NOT NULL DEFAULT '0',
                "newCustomers" integer NOT NULL DEFAULT '0',
                "returningCustomers" integer NOT NULL DEFAULT '0',
                "revenueGrowthRate" numeric(7, 2) NOT NULL DEFAULT '0',
                "orderGrowthRate" numeric(7, 2) NOT NULL DEFAULT '0',
                "additionalMetrics" text,
                CONSTRAINT "PK_529235950cfe71c82f15b685495" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_394d18bc1501426bb7d12f3f4b" ON "SalesAnalytics" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_d1d18fb91ec1c0f958844ad0d9" ON "SalesAnalytics" ("cafeId", "periodType", "periodEnd")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5cb9c1ad1db11c13d2fc1b5c15" ON "SalesAnalytics" ("cafeId", "periodType", "periodStart")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."LoyaltyTransactions_type_enum" AS ENUM(
                'earned',
                'redeemed',
                'expired',
                'adjusted',
                'bonus',
                'referral',
                'birthday',
                'anniversary',
                'challenge',
                'promotion'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."LoyaltyTransactions_status_enum" AS ENUM('pending', 'completed', 'cancelled', 'expired')
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyTransactions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "cafeId" uuid NOT NULL,
                "loyaltyAccountId" uuid NOT NULL,
                "type" "public"."LoyaltyTransactions_type_enum" NOT NULL,
                "status" "public"."LoyaltyTransactions_status_enum" NOT NULL DEFAULT 'completed',
                "points" numeric(10, 2) NOT NULL,
                "pointsBalance" numeric(10, 2) NOT NULL DEFAULT '0',
                "orderId" uuid,
                "orderAmount" numeric(10, 2),
                "earnRate" numeric(5, 4),
                "expiresAt" TIMESTAMP,
                "expiredAt" TIMESTAMP,
                "description" character varying NOT NULL,
                "notes" text,
                "processedByUserId" uuid,
                "processedAt" TIMESTAMP,
                "externalTransactionId" character varying,
                "externalSystem" character varying,
                CONSTRAINT "PK_039f797adb818d57f068ab7b8ed" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_84f6e4759a2683f5900578bfac" ON "LoyaltyTransactions" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5c974dcecb09641c15683dce96" ON "LoyaltyTransactions" ("loyaltyAccountId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f895c326abb723bec51a4486ac" ON "LoyaltyTransactions" ("type", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1baadf557e31744c112d321bd8" ON "LoyaltyTransactions" ("cafeId", "loyaltyAccountId")
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyAccounts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "cafeId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "loyaltyNumber" character varying NOT NULL,
                "currentPoints" numeric(10, 2) NOT NULL DEFAULT '0',
                "lifetimePoints" numeric(10, 2) NOT NULL DEFAULT '0',
                "pointsRedeemed" numeric(10, 2) NOT NULL DEFAULT '0',
                "currentTierId" uuid,
                "tierAchievedAt" TIMESTAMP,
                "tierExpiresAt" TIMESTAMP,
                "totalSpent" numeric(10, 2) NOT NULL DEFAULT '0',
                "yearlySpent" numeric(10, 2) NOT NULL DEFAULT '0',
                "totalOrders" integer NOT NULL DEFAULT '0',
                "yearlyOrders" integer NOT NULL DEFAULT '0',
                "lastActivityAt" TIMESTAMP,
                "lastOrderAt" TIMESTAMP,
                "birthDate" date,
                "anniversaryDate" date,
                "lastBirthdayRewardAt" TIMESTAMP,
                "lastAnniversaryRewardAt" TIMESTAMP,
                "referralCount" integer NOT NULL DEFAULT '0',
                "referralBonusEarned" numeric(10, 2) NOT NULL DEFAULT '0',
                "referredByUserId" uuid,
                "isActive" boolean NOT NULL DEFAULT true,
                "isVip" boolean NOT NULL DEFAULT false,
                "notes" text,
                CONSTRAINT "UQ_30905ef63c531a7c4a7fa8074b6" UNIQUE ("loyaltyNumber"),
                CONSTRAINT "PK_e0322ddc5b93510c666e124cc97" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_58023135b1fe13d166e35edcf2" ON "LoyaltyAccounts" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_047be8ee22b0ff378ae4b12684" ON "LoyaltyAccounts" ("userId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_30905ef63c531a7c4a7fa8074b" ON "LoyaltyAccounts" ("loyaltyNumber")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_450ef210edb5f0ea91676dd8fa" ON "LoyaltyAccounts" ("cafeId", "currentTierId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_a548f4f080ba5839f018680c89" ON "LoyaltyAccounts" ("cafeId", "userId")
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyChallengeEligibility" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "challengeId" uuid NOT NULL,
                "minTierLevel" integer,
                "maxTierLevel" integer,
                "eligibleTierLevels" text,
                "newMembersOnly" boolean DEFAULT false,
                "existingMembersOnly" boolean DEFAULT false,
                "vipMembersOnly" boolean DEFAULT false,
                "minOrdersLast30Days" integer,
                "maxOrdersLast30Days" integer,
                "minSpendLast30Days" numeric(10, 2),
                "ageGroups" text,
                "locations" text,
                "excludePreviousWinners" boolean DEFAULT false,
                "excludeRecentParticipants" integer,
                CONSTRAINT "REL_ba6e1b5edefb1d18b86a259068" UNIQUE ("challengeId"),
                CONSTRAINT "PK_615af7c721eede4d10f992f4313" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_ba6e1b5edefb1d18b86a259068" ON "LoyaltyChallengeEligibility" ("challengeId")
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyChallengeGoals" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "challengeId" uuid NOT NULL,
                "targetValue" numeric(10, 2),
                "minimumOrderValue" numeric(10, 2),
                "requiredProductIds" text,
                "requiredCategoryIds" text,
                "uniqueProductsCount" integer,
                "uniqueCategoriesCount" integer,
                "consecutiveDays" integer,
                "dailyTarget" numeric(10, 2),
                "weeklyTarget" numeric(10, 2),
                "referralsNeeded" integer,
                "reviewsNeeded" integer,
                "socialShares" integer,
                "customMetric" character varying,
                "customTarget" numeric(10, 2),
                CONSTRAINT "REL_94a085e67445c9833372047037" UNIQUE ("challengeId"),
                CONSTRAINT "PK_082578ceb46d40d78571246014a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_94a085e67445c9833372047037" ON "LoyaltyChallengeGoals" ("challengeId")
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyChallengeMilestones" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "challengeId" uuid NOT NULL,
                "percentage" integer NOT NULL,
                "title" character varying NOT NULL,
                "description" text NOT NULL,
                "rewardPoints" integer,
                "rewardBadgeId" uuid,
                "rewardMessage" text,
                "sortOrder" integer NOT NULL DEFAULT '0',
                CONSTRAINT "PK_612499200b2c46c57e94185ad3b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_3ab16c7f0c221053538ef0001c" ON "LoyaltyChallengeMilestones" ("challengeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f4f86c679fd95dc7e1ba64b3fe" ON "LoyaltyChallengeMilestones" ("challengeId", "sortOrder")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_e532ac4b31b0f53fdc8ea1478c" ON "LoyaltyChallengeMilestones" ("challengeId", "percentage")
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyChallengeRewards" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "challengeId" uuid NOT NULL,
                "completionPoints" integer,
                "milestonePoints" text,
                "badgeId" uuid,
                "badgeName" character varying,
                "rewardId" uuid,
                "freeItemId" uuid,
                "discountPercentage" numeric(5, 2),
                "discountAmount" numeric(10, 2),
                "tierBonusMultiplier" numeric(5, 2),
                "temporaryTierUpgrade" integer,
                "temporaryTierDays" integer,
                "experienceType" character varying,
                "experienceValue" character varying,
                CONSTRAINT "REL_50482931def0a62eee28ba021f" UNIQUE ("challengeId"),
                CONSTRAINT "PK_6cb41d18422b1216845fdeebba7" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_50482931def0a62eee28ba021f" ON "LoyaltyChallengeRewards" ("challengeId")
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyChallengeTrackingRules" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "challengeId" uuid NOT NULL,
                "countOnlyCompletedOrders" boolean DEFAULT true,
                "countOnlyPaidOrders" boolean DEFAULT true,
                "minimumOrderValue" numeric(10, 2),
                "resetOnFailedDay" boolean DEFAULT false,
                "allowMissedDays" integer,
                "trackingStartTime" character varying,
                "trackingEndTime" character varying,
                "excludeRefunds" boolean DEFAULT true,
                "excludeCancellations" boolean DEFAULT true,
                "excludeEmployeeOrders" boolean DEFAULT true,
                CONSTRAINT "REL_8343c13bc507061fb0a2ccba84" UNIQUE ("challengeId"),
                CONSTRAINT "PK_86701824aa917984d3106f47043" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_8343c13bc507061fb0a2ccba84" ON "LoyaltyChallengeTrackingRules" ("challengeId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."LoyaltyChallenges_type_enum" AS ENUM(
                'order_count',
                'spend_amount',
                'points_earned',
                'product_variety',
                'category_exploration',
                'consecutive_days',
                'weekly_visits',
                'monthly_goal',
                'referral_count',
                'review_count',
                'social_sharing',
                'custom'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."LoyaltyChallenges_status_enum" AS ENUM(
                'draft',
                'active',
                'paused',
                'completed',
                'expired'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."LoyaltyChallenges_difficulty_enum" AS ENUM('easy', 'medium', 'hard', 'expert')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."LoyaltyChallenges_frequency_enum" AS ENUM(
                'one_time',
                'daily',
                'weekly',
                'monthly',
                'seasonal'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyChallenges" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "cafeId" uuid NOT NULL,
                "name" character varying NOT NULL,
                "description" text,
                "shortDescription" text,
                "icon" character varying,
                "image" character varying,
                "type" "public"."LoyaltyChallenges_type_enum" NOT NULL,
                "status" "public"."LoyaltyChallenges_status_enum" NOT NULL DEFAULT 'draft',
                "difficulty" "public"."LoyaltyChallenges_difficulty_enum" NOT NULL,
                "frequency" "public"."LoyaltyChallenges_frequency_enum" NOT NULL,
                "startDate" TIMESTAMP,
                "endDate" TIMESTAMP,
                "durationDays" integer NOT NULL DEFAULT '30',
                "priority" integer NOT NULL DEFAULT '0',
                "color" character varying NOT NULL DEFAULT '#3B82F6',
                "tags" text NOT NULL DEFAULT '',
                "participantCount" integer NOT NULL DEFAULT '0',
                "completionCount" integer NOT NULL DEFAULT '0',
                "totalPointsAwarded" numeric(10, 2) NOT NULL DEFAULT '0',
                "lastCompletedAt" TIMESTAMP,
                "isActive" boolean NOT NULL DEFAULT true,
                "isVisible" boolean NOT NULL DEFAULT true,
                "isFeatured" boolean NOT NULL DEFAULT false,
                "autoStart" boolean NOT NULL DEFAULT false,
                "allowMultipleParticipants" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_a6f4f94fb10666b277e54691369" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_7fd25bcd575c8b837d15de0f5f" ON "LoyaltyChallenges" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8c71b50c9b634deac0a5605616" ON "LoyaltyChallenges" ("startDate", "endDate")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_de944bc5ea7deb865cb89a4aa0" ON "LoyaltyChallenges" ("type", "difficulty")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8bda1a88293022885b3b732f6b" ON "LoyaltyChallenges" ("cafeId", "isActive")
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyPromotionRules" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "promotionId" uuid NOT NULL,
                "pointsMultiplier" numeric(5, 2),
                "bonusPoints" integer,
                "minimumSpend" numeric(10, 2),
                "maximumBonusPoints" integer,
                "eligibleTierLevels" text,
                "newMembersOnly" boolean DEFAULT false,
                "firstTimeCustomers" boolean DEFAULT false,
                "inactiveCustomers" boolean DEFAULT false,
                "inactiveDays" integer,
                "maxUsesPerCustomer" integer,
                "maxUsesTotal" integer,
                "maxUsesPerDay" integer,
                "eligibleProductIds" text,
                "eligibleCategoryIds" text,
                "excludeProductIds" text,
                "excludeCategoryIds" text,
                "eligibleDaysOfWeek" text,
                "eligibleHoursStart" character varying,
                "eligibleHoursEnd" character varying,
                "requiresCouponCode" boolean DEFAULT false,
                "couponCode" character varying,
                "stackableWithOtherPromotions" boolean DEFAULT false,
                CONSTRAINT "REL_3160e8db146a1d02cfdb1d01ca" UNIQUE ("promotionId"),
                CONSTRAINT "PK_75b970ec1002dcc260548276d08" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_3160e8db146a1d02cfdb1d01ca" ON "LoyaltyPromotionRules" ("promotionId")
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyPromotionTargeting" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "promotionId" uuid NOT NULL,
                "locations" text,
                "excludeLocations" text,
                "customerSegments" text,
                "loyaltyTiers" text,
                "ageGroups" text,
                "genderTargeting" text,
                "orderFrequency" character varying,
                "averageOrderValueMin" numeric(10, 2),
                "averageOrderValueMax" numeric(10, 2),
                "preferredCategories" text,
                "lastOrderDaysMin" integer,
                "lastOrderDaysMax" integer,
                "customAttributes" json,
                CONSTRAINT "REL_ff6cd3f35626a9ae187fb88e1c" UNIQUE ("promotionId"),
                CONSTRAINT "PK_4d6ebb8bc8e5e8171bb2d0f57e4" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_ff6cd3f35626a9ae187fb88e1c" ON "LoyaltyPromotionTargeting" ("promotionId")
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyPromotionMessaging" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "promotionId" uuid NOT NULL,
                "notificationTitle" character varying,
                "notificationMessage" text,
                "emailSubject" character varying,
                "emailContent" text,
                "smsMessage" text,
                "ctaText" character varying,
                "ctaUrl" character varying,
                "bannerImage" character varying,
                "iconUrl" character varying,
                "backgroundColor" character varying,
                "textColor" character varying,
                CONSTRAINT "REL_813b8d7453b1238cdac01b0589" UNIQUE ("promotionId"),
                CONSTRAINT "PK_49ec65378464918d90ab873c645" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_813b8d7453b1238cdac01b0589" ON "LoyaltyPromotionMessaging" ("promotionId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."LoyaltyPromotions_type_enum" AS ENUM(
                'double_points',
                'bonus_points',
                'points_multiplier',
                'tier_fast_track',
                'birthday_special',
                'anniversary_special',
                'referral_bonus',
                'challenge_bonus',
                'new_member_bonus',
                'reactivation_bonus'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."LoyaltyPromotions_status_enum" AS ENUM(
                'draft',
                'scheduled',
                'active',
                'paused',
                'completed',
                'cancelled'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."LoyaltyPromotions_trigger_enum" AS ENUM(
                'order_placed',
                'payment_completed',
                'birthday',
                'anniversary',
                'referral_successful',
                'tier_achieved',
                'challenge_completed',
                'first_order',
                'return_customer',
                'manual'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyPromotions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "cafeId" uuid NOT NULL,
                "name" character varying NOT NULL,
                "description" text,
                "image" character varying,
                "type" "public"."LoyaltyPromotions_type_enum" NOT NULL,
                "status" "public"."LoyaltyPromotions_status_enum" NOT NULL DEFAULT 'draft',
                "trigger" "public"."LoyaltyPromotions_trigger_enum" NOT NULL,
                "startDate" TIMESTAMP,
                "endDate" TIMESTAMP,
                "timesTriggered" integer NOT NULL DEFAULT '0',
                "successfulRedemptions" integer NOT NULL DEFAULT '0',
                "totalPointsAwarded" numeric(10, 2) NOT NULL DEFAULT '0',
                "totalRevenue" numeric(10, 2) NOT NULL DEFAULT '0',
                "lastTriggeredAt" TIMESTAMP,
                "isActive" boolean NOT NULL DEFAULT true,
                "requiresApproval" boolean NOT NULL DEFAULT false,
                "priority" integer NOT NULL DEFAULT '0',
                "internalNotes" text,
                CONSTRAINT "PK_c6ddf4e2573a76af0bdb4588493" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b48efae8cb7aacd0f015f205e4" ON "LoyaltyPromotions" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5e37f971fd2a3e636d03f5504c" ON "LoyaltyPromotions" ("startDate", "endDate")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_eaef60bfd3c90dbc80e9fa8f8c" ON "LoyaltyPromotions" ("type", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_99936079d07aae7f4495927078" ON "LoyaltyPromotions" ("cafeId", "isActive")
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyRewardRedemptionMetadata" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "redemptionId" uuid NOT NULL,
                "rewardName" character varying,
                "rewardDescription" text,
                "rewardType" character varying,
                "pointsCost" integer,
                "appliedToOrderId" uuid,
                "discountAmount" numeric(10, 2),
                "freeProductId" uuid,
                "location" character varying,
                "processedByStaffId" uuid,
                CONSTRAINT "REL_12f7d8a4f0158562c8b1cc0d68" UNIQUE ("redemptionId"),
                CONSTRAINT "PK_fa2378f29ea5113623ec79b802e" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_12f7d8a4f0158562c8b1cc0d68" ON "LoyaltyRewardRedemptionMetadata" ("redemptionId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."LoyaltyRewardRedemptions_status_enum" AS ENUM(
                'pending',
                'approved',
                'redeemed',
                'cancelled',
                'expired'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyRewardRedemptions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "cafeId" uuid NOT NULL,
                "loyaltyAccountId" uuid NOT NULL,
                "rewardId" uuid NOT NULL,
                "orderId" uuid,
                "status" "public"."LoyaltyRewardRedemptions_status_enum" NOT NULL DEFAULT 'pending',
                "pointsUsed" numeric(10, 2) NOT NULL,
                "discountAmount" numeric(10, 2),
                "cashValue" numeric(10, 2),
                "redemptionCode" character varying NOT NULL,
                "approvedAt" TIMESTAMP,
                "redeemedAt" TIMESTAMP,
                "expiresAt" TIMESTAMP,
                "cancelledAt" TIMESTAMP,
                "approvedByUserId" uuid,
                "redeemedByUserId" uuid,
                "notes" text,
                "cancellationReason" text,
                CONSTRAINT "UQ_8d66dfff929b06640688a6d5538" UNIQUE ("redemptionCode"),
                CONSTRAINT "PK_fe1dceebc4d0f18b910d5c84310" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8dcf22a3916ad9bc16e689600c" ON "LoyaltyRewardRedemptions" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ea9b3f7ae9991076c2c7483d4b" ON "LoyaltyRewardRedemptions" ("loyaltyAccountId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5a27db7b5e9b48fc123fe34529" ON "LoyaltyRewardRedemptions" ("rewardId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_8d66dfff929b06640688a6d553" ON "LoyaltyRewardRedemptions" ("redemptionCode")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_3e6a563e9db69270c749767fed" ON "LoyaltyRewardRedemptions" ("cafeId", "loyaltyAccountId")
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyRewardApplicableProducts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "loyaltyRewardId" uuid NOT NULL,
                "productIds" text,
                "categoryIds" text,
                "excludeProductIds" text,
                "excludeCategoryIds" text,
                CONSTRAINT "REL_8a94bbf8b2b42ca4d4ea10e185" UNIQUE ("loyaltyRewardId"),
                CONSTRAINT "PK_cb0432e28c9feb47883862e29ff" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_8a94bbf8b2b42ca4d4ea10e185" ON "LoyaltyRewardApplicableProducts" ("loyaltyRewardId")
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyRewardSpecialProperties" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "loyaltyRewardId" uuid NOT NULL,
                "freeProductId" uuid,
                "freeProductName" character varying,
                "experienceType" character varying,
                "experienceLocation" character varying,
                "experienceDuration" integer,
                "itemSku" character varying,
                "itemSize" character varying,
                "itemColor" character varying,
                "upgradeToTierLevel" integer,
                "upgradeDuration" integer,
                "bonusPointsAmount" numeric(10, 2),
                "bonusPointsMultiplier" numeric(5, 4),
                CONSTRAINT "REL_c1512d61065183a640669d6150" UNIQUE ("loyaltyRewardId"),
                CONSTRAINT "PK_1b23284200f34b2d5a98e4501ae" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_c1512d61065183a640669d6150" ON "LoyaltyRewardSpecialProperties" ("loyaltyRewardId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."LoyaltyRewards_type_enum" AS ENUM(
                'discount_percentage',
                'discount_fixed',
                'free_item',
                'free_delivery',
                'bonus_points',
                'tier_upgrade',
                'experience',
                'merchandise',
                'cash_credit'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."LoyaltyRewards_category_enum" AS ENUM(
                'food',
                'beverage',
                'discount',
                'delivery',
                'experience',
                'merchandise',
                'points',
                'vip'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."LoyaltyRewards_status_enum" AS ENUM('active', 'inactive', 'expired', 'out_of_stock')
        `);
        await queryRunner.query(`
            CREATE TABLE "LoyaltyRewards" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "cafeId" uuid NOT NULL,
                "name" character varying NOT NULL,
                "description" text,
                "image" character varying,
                "type" "public"."LoyaltyRewards_type_enum" NOT NULL,
                "category" "public"."LoyaltyRewards_category_enum" NOT NULL,
                "status" "public"."LoyaltyRewards_status_enum" NOT NULL DEFAULT 'active',
                "pointsCost" numeric(10, 2) NOT NULL,
                "cashValue" numeric(10, 2),
                "discountPercentage" numeric(5, 4),
                "discountAmount" numeric(10, 2),
                "validFrom" TIMESTAMP,
                "validUntil" TIMESTAMP,
                "totalQuantity" integer NOT NULL DEFAULT '-1',
                "redeemedQuantity" integer NOT NULL DEFAULT '0',
                "maxRedemptionsPerUser" integer NOT NULL DEFAULT '1',
                "maxRedemptionsPerDay" integer NOT NULL DEFAULT '1',
                "requiredTierLevels" text NOT NULL DEFAULT '',
                "minimumSpend" numeric(10, 2) NOT NULL DEFAULT '0',
                "terms" text,
                "canCombineWithOtherOffers" boolean NOT NULL DEFAULT true,
                "requiresApproval" boolean NOT NULL DEFAULT false,
                "priority" integer NOT NULL DEFAULT '0',
                "isVisible" boolean NOT NULL DEFAULT true,
                "isActive" boolean NOT NULL DEFAULT true,
                "isFeatured" boolean NOT NULL DEFAULT false,
                "viewCount" integer NOT NULL DEFAULT '0',
                "redemptionCount" integer NOT NULL DEFAULT '0',
                "lastRedeemedAt" TIMESTAMP,
                CONSTRAINT "PK_ebddb4868dbeb7f98b3f2de9da9" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_7e3e0cf20ccff117ebed78e109" ON "LoyaltyRewards" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_cd3d87553d97bf774cf4750f1a" ON "LoyaltyRewards" ("validFrom", "validUntil")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_fb24e81287c16ee7cb5b1ebe20" ON "LoyaltyRewards" ("category", "type")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c69c7a0951b6ad6e96149cf343" ON "LoyaltyRewards" ("cafeId", "isActive")
        `);
        await queryRunner.query(`
            CREATE TABLE "ConfigurationValidation" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "configurationId" uuid NOT NULL,
                "required" boolean DEFAULT false,
                "minLength" integer,
                "maxLength" integer,
                "min" numeric(20, 10),
                "max" numeric(20, 10),
                "pattern" character varying,
                "enumValues" text,
                "schema" text,
                CONSTRAINT "REL_f87760062413f2f99af91553c7" UNIQUE ("configurationId"),
                CONSTRAINT "PK_c5a668d06c8f1c59fa041faeb61" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_f87760062413f2f99af91553c7" ON "ConfigurationValidation" ("configurationId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."CafeBusinessHours_dayofweek_enum" AS ENUM(
                'monday',
                'tuesday',
                'wednesday',
                'thursday',
                'friday',
                'saturday',
                'sunday'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "CafeBusinessHours" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "cafeId" uuid NOT NULL,
                "dayOfWeek" "public"."CafeBusinessHours_dayofweek_enum" NOT NULL,
                "isOpen" boolean NOT NULL DEFAULT false,
                "openTime" character varying,
                "closeTime" character varying,
                CONSTRAINT "PK_50193a3f0f6db29e7060486a104" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_73fb8356c04585452ab6091246" ON "CafeBusinessHours" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_073740206c617ee43433673e0d" ON "CafeBusinessHours" ("cafeId", "dayOfWeek")
        `);
        await queryRunner.query(`
            CREATE TABLE "CafeSettings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "cafeId" uuid NOT NULL,
                "currency" character varying DEFAULT 'USD',
                "timezone" character varying DEFAULT 'UTC',
                "taxRate" numeric(5, 4),
                "serviceCharge" numeric(5, 4),
                "enableGlassTracking" boolean DEFAULT false,
                "enableCredits" boolean DEFAULT false,
                "workflowSteps" text,
                "paymentMethods" text,
                "orderPrefix" character varying,
                "receiptFooter" text,
                CONSTRAINT "PK_8946a03d12aadbb895de413c65b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_4946644326333a75eb064d67d3" ON "CafeSettings" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."Users_role_enum" AS ENUM(
                'customer',
                'employee',
                'supervisor',
                'manager',
                'admin',
                'owner',
                'cashier',
                'barista',
                'kitchen',
                'kitchen_staff',
                'waiter',
                'server',
                'cleaner'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."Users_status_enum" AS ENUM(
                'active',
                'inactive',
                'suspended',
                'pending_verification',
                'banned'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "Users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "cafeId" uuid NOT NULL,
                "sub" character varying NOT NULL,
                "email" character varying,
                "phone" character varying,
                "firstName" character varying,
                "lastName" character varying,
                "slug" character varying NOT NULL,
                "avatar" character varying,
                "role" "public"."Users_role_enum" NOT NULL DEFAULT 'customer',
                "status" "public"."Users_status_enum" NOT NULL DEFAULT 'active',
                "creditBalance" numeric(10, 2) NOT NULL DEFAULT '0',
                "isVip" boolean NOT NULL DEFAULT false,
                "loyaltyNumber" character varying,
                CONSTRAINT "UQ_92296d4acf305474bdf6e033325" UNIQUE ("sub"),
                CONSTRAINT "UQ_3c3ab3f49a87e6ddb607f3c4945" UNIQUE ("email"),
                CONSTRAINT "PK_16d4f7d636df336db11d87413e3" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_22149f679893ad21ae9782c6f0" ON "Users" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_92296d4acf305474bdf6e03332" ON "Users" ("sub")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_c75e2e4931c3af1378d5443756" ON "Users" ("email")
            WHERE "email" IS NOT NULL
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_83841eeb21acd71c8422eb5796" ON "Users" ("phone")
            WHERE "phone" IS NOT NULL
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_7cf0772bcfdec5a968f30e1d6e" ON "Users" ("firstName")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_cfc69e3e413e4dd82e8578f539" ON "Users" ("lastName")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_d7b88224b4713f50fabf2a6d3f" ON "Users" ("slug")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_cd09a2e0b5c8f0d9ab7ab8d340" ON "Users" ("cafeId", "role")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_3d813296faf4e2cdd3cfcd64b4" ON "Users" ("firstName", "lastName")
        `);
        await queryRunner.query(`
            CREATE TABLE "UserPreferences" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "userId" uuid NOT NULL,
                "emailNotifications" boolean DEFAULT true,
                "pushNotifications" boolean DEFAULT true,
                "smsNotifications" boolean DEFAULT false,
                "language" character varying DEFAULT 'en',
                "theme" character varying DEFAULT 'light',
                "timezone" character varying DEFAULT 'UTC',
                CONSTRAINT "PK_cc3107400805135c48b8035b693" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_5f8256554b2eec66fda266f625" ON "UserPreferences" ("userId")
        `);
        await queryRunner.query(`
            CREATE TABLE "Configurations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "cafeId" uuid NOT NULL,
                "key" character varying NOT NULL,
                "category" character varying,
                "displayName" character varying,
                "description" character varying,
                "value" json NOT NULL,
                "defaultValue" json,
                "dataType" character varying NOT NULL DEFAULT 'object',
                "isActive" boolean NOT NULL DEFAULT true,
                "isReadOnly" boolean NOT NULL DEFAULT false,
                "isSystem" boolean NOT NULL DEFAULT false,
                "requiresRestart" boolean NOT NULL DEFAULT false,
                "inputType" character varying,
                "lastModifiedById" uuid,
                "previousValue" json,
                "group" character varying,
                "sortOrder" integer NOT NULL DEFAULT '0',
                CONSTRAINT "PK_07f0562e3292e084a7e835c4405" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_394cdac1170d2c8c241593ce11" ON "Configurations" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_9be3c8e45f4d0c4ebc86435bbe" ON "Configurations" ("cafeId", "key")
        `);
        await queryRunner.query(`
            CREATE TABLE "ConfigurationUIOptions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "configurationId" uuid NOT NULL,
                "placeholder" character varying,
                "helpText" text,
                "rows" integer,
                "step" numeric(10, 2),
                "multiselect" boolean DEFAULT false,
                "sortable" boolean DEFAULT false,
                CONSTRAINT "REL_dd0fd6e08972702655a14e3591" UNIQUE ("configurationId"),
                CONSTRAINT "PK_1fe4742a89c3a1f327640fcd134" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_dd0fd6e08972702655a14e3591" ON "ConfigurationUIOptions" ("configurationId")
        `);
        await queryRunner.query(`
            CREATE TABLE "ConfigurationUIOption" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "uiOptionsId" uuid NOT NULL,
                "label" character varying NOT NULL,
                "value" text NOT NULL,
                "description" text,
                "sortOrder" integer NOT NULL DEFAULT '0',
                CONSTRAINT "PK_e96806dd9446f0bcb32d81cbdcb" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5da746e50a43064012ce3059ab" ON "ConfigurationUIOption" ("uiOptionsId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_f740c3e2a0fd7067ae8f13f157" ON "ConfigurationUIOption" ("uiOptionsId", "sortOrder")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."CounterWorkingHours_dayofweek_enum" AS ENUM(
                'monday',
                'tuesday',
                'wednesday',
                'thursday',
                'friday',
                'saturday',
                'sunday'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "CounterWorkingHours" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "counterId" uuid NOT NULL,
                "dayOfWeek" "public"."CounterWorkingHours_dayofweek_enum" NOT NULL,
                "isOpen" boolean NOT NULL DEFAULT false,
                "startTime" character varying,
                "endTime" character varying,
                CONSTRAINT "PK_d5ad2d72b422a1762478c216275" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1f986dcf48892bf923fa71a1fd" ON "CounterWorkingHours" ("counterId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_c89a457efc44198f6a8130de31" ON "CounterWorkingHours" ("counterId", "dayOfWeek")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."Counters_type_enum" AS ENUM(
                'kitchen',
                'bar',
                'coffee',
                'pastry',
                'cold_prep',
                'hot_prep',
                'assembly',
                'pickup'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."Counters_status_enum" AS ENUM(
                'active',
                'inactive',
                'maintenance',
                'offline',
                'full'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "Counters" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "cafeId" uuid NOT NULL,
                "name" character varying NOT NULL,
                "description" character varying,
                "type" "public"."Counters_type_enum" NOT NULL,
                "status" "public"."Counters_status_enum" NOT NULL DEFAULT 'active',
                "label" character varying,
                "color" character varying,
                "sortOrder" integer NOT NULL DEFAULT '0',
                "isActive" boolean NOT NULL DEFAULT true,
                "autoAcceptOrders" boolean NOT NULL DEFAULT false,
                "requiresConfirmation" boolean NOT NULL DEFAULT false,
                "maxConcurrentOrders" integer,
                "productCategories" text,
                "averagePrepTime" integer,
                "equipment" text,
                "notes" text,
                "currentLoad" integer,
                "lastActiveAt" TIMESTAMP,
                CONSTRAINT "PK_81880bec5c7b2c3eb9aeafd894d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_3993d0ba11dee4fe7635e9491b" ON "Counters" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4b06ae8406e3225932f61360c9" ON "Counters" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b7110f4b4504111686af8a7385" ON "Counters" ("cafeId", "isActive")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_24efdd6f1a6f1815f6a2223e01" ON "Counters" ("cafeId", "type")
        `);
        await queryRunner.query(`
            CREATE TABLE "CounterCapabilities" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "counterId" uuid NOT NULL,
                "canAcceptOrders" boolean DEFAULT false,
                "canProcessPayments" boolean DEFAULT false,
                "canPrintReceipts" boolean DEFAULT false,
                "canManageInventory" boolean DEFAULT false,
                "supportedPaymentMethods" text,
                "supportedOrderTypes" text,
                "printerConfig" text,
                CONSTRAINT "PK_cccf0fb72c993495012b175f1ed" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_481bb9173f282a31c394890376" ON "CounterCapabilities" ("counterId")
        `);
        await queryRunner.query(`
            CREATE TABLE "Cafes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "name" character varying NOT NULL,
                "description" character varying,
                "slug" character varying NOT NULL,
                "address" character varying,
                "city" character varying,
                "country" character varying,
                "zipCode" character varying,
                "email" character varying,
                "phone" character varying,
                "logo" character varying,
                "website" character varying,
                "isActive" boolean NOT NULL DEFAULT true,
                "status" character varying DEFAULT 'active',
                CONSTRAINT "UQ_e3c3a644db189cc9b5c8bfb8910" UNIQUE ("slug"),
                CONSTRAINT "PK_7d1e9350ab9168d18982ba3232c" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_a6d61c848877c624ef7f287615" ON "Cafes" ("name")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_e3c3a644db189cc9b5c8bfb891" ON "Cafes" ("slug")
        `);
        await queryRunner.query(`
            CREATE TABLE "AdminWorkflowSettings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "adminSettingsId" uuid NOT NULL,
                "defaultSteps" text,
                "autoProgressEnabled" boolean DEFAULT false,
                "requireStaffAssignment" boolean DEFAULT true,
                "stepCompletionAction" character varying,
                CONSTRAINT "REL_42588e28d14015d7426205b993" UNIQUE ("adminSettingsId"),
                CONSTRAINT "PK_caf44ddec4e322fdb6da6fbba3f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_42588e28d14015d7426205b993" ON "AdminWorkflowSettings" ("adminSettingsId")
        `);
        await queryRunner.query(`
            CREATE TABLE "AdminReportingSettings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "adminSettingsId" uuid NOT NULL,
                "dailyReportTime" character varying DEFAULT '09:00',
                "weeklyReportDay" character varying DEFAULT 'monday',
                "monthlyReportDay" integer DEFAULT '1',
                "autoGenerateReports" boolean DEFAULT false,
                "reportRecipients" text,
                "includeSalesReport" boolean DEFAULT true,
                "includeInventoryReport" boolean DEFAULT true,
                "includeEmployeeReport" boolean DEFAULT false,
                CONSTRAINT "REL_ff1cff8ed3fd26477547e7c85f" UNIQUE ("adminSettingsId"),
                CONSTRAINT "PK_aefcf90e0cec985646ca74ee8a0" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_ff1cff8ed3fd26477547e7c85f" ON "AdminReportingSettings" ("adminSettingsId")
        `);
        await queryRunner.query(`
            CREATE TABLE "AdminSettings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "cafeId" uuid NOT NULL,
                "businessName" character varying,
                "timezone" character varying NOT NULL DEFAULT 'UTC',
                "currency" character varying NOT NULL DEFAULT 'USD',
                "taxRate" numeric(5, 2) NOT NULL DEFAULT '0',
                "serviceCharge" numeric(5, 2) NOT NULL DEFAULT '0',
                "locale" character varying NOT NULL DEFAULT 'en-US',
                "autoAssignOrders" boolean NOT NULL DEFAULT false,
                "orderTimeout" integer NOT NULL DEFAULT '30',
                "maxOrdersPerCustomer" integer NOT NULL DEFAULT '10',
                "enableQualityControl" boolean NOT NULL DEFAULT false,
                "enableInventoryTracking" boolean NOT NULL DEFAULT true,
                "requirePaymentConfirmation" boolean NOT NULL DEFAULT true,
                "allowCancellations" boolean NOT NULL DEFAULT true,
                "enableLoyaltyProgram" boolean NOT NULL DEFAULT false,
                "emailEnabled" boolean NOT NULL DEFAULT true,
                "smsEnabled" boolean NOT NULL DEFAULT false,
                "pushEnabled" boolean NOT NULL DEFAULT true,
                "criticalAlertsOnly" boolean NOT NULL DEFAULT false,
                "notificationEmail" character varying,
                "notificationPhone" character varying,
                "lowStockThreshold" integer NOT NULL DEFAULT '10',
                "orderDelayThreshold" integer NOT NULL DEFAULT '30',
                "paymentProviders" text,
                "inventorySystem" character varying,
                "accountingSystem" character varying,
                "deliveryProviders" text,
                "posSystem" character varying,
                "paymentGateway" character varying,
                "lastUpdatedByUserId" uuid,
                CONSTRAINT "PK_3b3328a1250bdedf03ab0e7a700" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_67d7869c6df5f45a8f6cb9f4c5" ON "AdminSettings" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE TABLE "AdminDisplaySettings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "adminSettingsId" uuid NOT NULL,
                "theme" character varying DEFAULT 'light',
                "primaryColor" character varying DEFAULT '#3B82F6',
                "secondaryColor" character varying DEFAULT '#10B981',
                "logoUrl" character varying,
                "showBranding" boolean DEFAULT true,
                "fontFamily" character varying DEFAULT 'Roboto',
                "density" character varying DEFAULT 'comfortable',
                CONSTRAINT "REL_4df5bf3eb243837c4368e6a60e" UNIQUE ("adminSettingsId"),
                CONSTRAINT "PK_64bd4739cbe0d9f764d6c99b27b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_4df5bf3eb243837c4368e6a60e" ON "AdminDisplaySettings" ("adminSettingsId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."AdminNotifications_type_enum" AS ENUM(
                'LOW_STOCK',
                'ORDER_ALERT',
                'EMPLOYEE_ALERT',
                'SYSTEM_ALERT',
                'REVENUE_MILESTONE',
                'REPORT_READY',
                'INVENTORY_ALERT',
                'PAYMENT_ISSUE',
                'QUALITY_ALERT'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."AdminNotifications_severity_enum" AS ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL')
        `);
        await queryRunner.query(`
            CREATE TABLE "AdminNotifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "cafeId" uuid NOT NULL,
                "userId" uuid,
                "type" "public"."AdminNotifications_type_enum" NOT NULL,
                "severity" "public"."AdminNotifications_severity_enum" NOT NULL DEFAULT 'INFO',
                "title" character varying NOT NULL,
                "message" text NOT NULL,
                "read" boolean NOT NULL DEFAULT false,
                "readAt" TIMESTAMP,
                "actionUrl" character varying,
                "actionLabel" character varying,
                "actionType" character varying,
                "sourceId" character varying,
                "sourceType" character varying,
                "emailSent" boolean NOT NULL DEFAULT false,
                "emailSentAt" TIMESTAMP,
                "smsSent" boolean NOT NULL DEFAULT false,
                "smsSentAt" TIMESTAMP,
                "pushSent" boolean NOT NULL DEFAULT false,
                "pushSentAt" TIMESTAMP,
                "expiresAt" TIMESTAMP,
                CONSTRAINT "PK_e898f9d5d912238395efd89c083" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_498a77456322758df65e9cc845" ON "AdminNotifications" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_1c6215da9159793a8114df6ad1" ON "AdminNotifications" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_50c3ac400188c6a94aba420b80" ON "AdminNotifications" ("userId", "read")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ea70f93b460b0d104d5d620db5" ON "AdminNotifications" ("cafeId", "severity")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_a77d5ad658e4862819272417e1" ON "AdminNotifications" ("cafeId", "type")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_08d7d1b323d8dd304e3f94cb01" ON "AdminNotifications" ("cafeId", "read")
        `);
        await queryRunner.query(`
            CREATE TABLE "AdminNotificationData" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "notificationId" uuid NOT NULL,
                "orderId" uuid,
                "employeeId" uuid,
                "stockId" uuid,
                "amount" numeric(10, 2),
                "priority" character varying,
                "requiresAction" boolean DEFAULT false,
                "expiresAt" TIMESTAMP,
                "additionalInfo" text,
                CONSTRAINT "REL_6d31215f0fb72ff6462dc39a9f" UNIQUE ("notificationId"),
                CONSTRAINT "PK_a6453885fee5ea556bfb5a61459" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_6d31215f0fb72ff6462dc39a9f" ON "AdminNotificationData" ("notificationId")
        `);
        await queryRunner.query(`
            CREATE TABLE "Glasses" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "cafeId" uuid NOT NULL,
                "glassNumber" character varying NOT NULL,
                "rfidTag" character varying,
                "qrCode" character varying,
                "type" character varying,
                "capacity" integer,
                "material" character varying,
                "color" character varying,
                "status" character varying NOT NULL DEFAULT 'available',
                "currentCustomerId" uuid,
                "currentOrderId" uuid,
                "currentLocation" character varying,
                "lastIssuedAt" TIMESTAMP,
                "lastReturnedAt" TIMESTAMP,
                "lastCleanedAt" TIMESTAMP,
                "usageCount" integer NOT NULL DEFAULT '0',
                "depositAmount" numeric(10, 2),
                "isActive" boolean NOT NULL DEFAULT true,
                "purchaseDate" date,
                "purchaseCost" numeric(10, 2),
                "notes" text,
                CONSTRAINT "UQ_a81b910a0f45cf0da0a7efc2a38" UNIQUE ("glassNumber"),
                CONSTRAINT "UQ_d74ed90f8d08dd3612457aa8a7a" UNIQUE ("rfidTag"),
                CONSTRAINT "PK_d22ec150a9553344f2020affc17" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_520b293cd8e6f26ed2c106eafe" ON "Glasses" ("cafeId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_a81b910a0f45cf0da0a7efc2a3" ON "Glasses" ("glassNumber")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_67acb8ade7046581d475322256" ON "Glasses" ("rfidTag")
            WHERE "rfidTag" IS NOT NULL
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_63ed523be38b69f7192db0acf5" ON "Glasses" ("cafeId", "status")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_f12c12663c81e0d14aeb2b54a4" ON "Glasses" ("cafeId", "rfidTag")
        `);
        await queryRunner.query(`
            CREATE TABLE "GlassMovements" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "glassId" uuid NOT NULL,
                "movementType" character varying NOT NULL,
                "orderId" uuid,
                "customerId" uuid,
                "employeeId" uuid,
                "notes" text,
                "location" character varying,
                CONSTRAINT "PK_39094648a01dc564e5fd58e40a8" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e496e00dfe653a768f36462aff" ON "GlassMovements" ("glassId")
        `);
        await queryRunner.query(`
            ALTER TABLE "EmployeeWorkingHours"
            ADD CONSTRAINT "FK_166fdf71fca58968f2c4a2f1094" FOREIGN KEY ("employeeId") REFERENCES "Employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "TimeSheets"
            ADD CONSTRAINT "FK_ce7723486df238f84c1078b673d" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "TimeSheets"
            ADD CONSTRAINT "FK_e0b92ebc9e4c1ba3c116922c592" FOREIGN KEY ("employeeId") REFERENCES "Employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "TimeEntries"
            ADD CONSTRAINT "FK_1dfb871e5bd4374243368deec9e" FOREIGN KEY ("timeSheetId") REFERENCES "TimeSheets"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Employees"
            ADD CONSTRAINT "FK_6700509e032755f15eeca2aad8e" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Employees"
            ADD CONSTRAINT "FK_26991f337433972a0848d61541d" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyAccountBadges"
            ADD CONSTRAINT "FK_c45b20581c5eca570d4ebe3f31e" FOREIGN KEY ("loyaltyAccountId") REFERENCES "LoyaltyAccounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyAccountChallengeProgresses"
            ADD CONSTRAINT "FK_667d5d8808293c63a6930ff8849" FOREIGN KEY ("loyaltyAccountId") REFERENCES "LoyaltyAccounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyAccountPreferences"
            ADD CONSTRAINT "FK_e6554298583b056388476fe607f" FOREIGN KEY ("loyaltyAccountId") REFERENCES "LoyaltyAccounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyTierBenefits"
            ADD CONSTRAINT "FK_c47f24ed12a0f8b80666e006711" FOREIGN KEY ("loyaltyTierId") REFERENCES "LoyaltyTiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyTiers"
            ADD CONSTRAINT "FK_6427596aaf89c0e101a7dbbb7b2" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyTransactionMetadata"
            ADD CONSTRAINT "FK_8207c6ba54814f10e54aa7cef96" FOREIGN KEY ("transactionId") REFERENCES "LoyaltyTransactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "OrderItemCustomizations"
            ADD CONSTRAINT "FK_34d28176cf129c2161491f5ac8d" FOREIGN KEY ("orderItemId") REFERENCES "OrderItems"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "OrderItemCounterStatuses"
            ADD CONSTRAINT "FK_741b58f16b0913337961fad157f" FOREIGN KEY ("orderItemId") REFERENCES "OrderItems"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "OrderItemCounterStatuses"
            ADD CONSTRAINT "FK_27b0f5459dbfbfdcb9b1bd1cb63" FOREIGN KEY ("counterId") REFERENCES "Counters"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "ProductAttributes"
            ADD CONSTRAINT "FK_b385a5e148ac0a4916369292e1c" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "StockMovements"
            ADD CONSTRAINT "FK_f4fb4e183bd9ee4a2622096e6eb" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "StockMovements"
            ADD CONSTRAINT "FK_f7dee9c8a2f39d6fc4b10f986f0" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "StockMovements"
            ADD CONSTRAINT "FK_7fa02371da5f12dfbe35b4107e1" FOREIGN KEY ("performedById") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Stock"
            ADD CONSTRAINT "FK_08518d80e907e6318dc3c92ac61" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Stock"
            ADD CONSTRAINT "FK_17b0ef39058eca67f3bcd9aa49e" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "InventoryAlertMetadata"
            ADD CONSTRAINT "FK_765861d496786455de81335078f" FOREIGN KEY ("alertId") REFERENCES "InventoryAlerts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "InventoryAlerts"
            ADD CONSTRAINT "FK_9e8a2391fcefd257bdbb2529c93" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "InventoryAlerts"
            ADD CONSTRAINT "FK_407344b46e1f5376ed3cf2d476a" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "InventoryAlerts"
            ADD CONSTRAINT "FK_618eed7ff1e3a1c6cdbc5e1c019" FOREIGN KEY ("resolvedByUserId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "InventoryAlerts"
            ADD CONSTRAINT "FK_8728df345cade18da681518b6c1" FOREIGN KEY ("acknowledgedByUserId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Purchases"
            ADD CONSTRAINT "FK_899b00052061e1b9a38e34dfbe3" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Purchases"
            ADD CONSTRAINT "FK_e073d6badd49f4ea7186c50e2b9" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Purchases"
            ADD CONSTRAINT "FK_80d9c264da6577fc64a8bf36da1" FOREIGN KEY ("approvedById") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "PurchaseItems"
            ADD CONSTRAINT "FK_380e1a22e1e8470a27cdf2b07c7" FOREIGN KEY ("purchaseId") REFERENCES "Purchases"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Products"
            ADD CONSTRAINT "FK_f937407f1f51448fd5e30cf911c" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "OrderItems"
            ADD CONSTRAINT "FK_f91820d35e8129e7dd09881d886" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "OrderItems"
            ADD CONSTRAINT "FK_f11d5c16edede51cea87a8c4bfd" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "OrderWorkflowSteps"
            ADD CONSTRAINT "FK_c88f3cf369a93dca66e5bdbb41a" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "CreditRestrictions"
            ADD CONSTRAINT "FK_b9e488b63f651827b2a9c12d3d5" FOREIGN KEY ("creditId") REFERENCES "Credits"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Credits"
            ADD CONSTRAINT "FK_1c422be773dea8459e68b8f57ce" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Credits"
            ADD CONSTRAINT "FK_4d8f1a1f5061e65f6c599816e58" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Credits"
            ADD CONSTRAINT "FK_48ec110d5df757644d79a23bce0" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Credits"
            ADD CONSTRAINT "FK_9aa0784676909b4652d60fbcf9d" FOREIGN KEY ("performedById") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "PaymentProviderData"
            ADD CONSTRAINT "FK_b93d086efba962b98e664a9a6a0" FOREIGN KEY ("paymentId") REFERENCES "Payments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "PaymentReceiptData"
            ADD CONSTRAINT "FK_bd1c38910d9e7f7a53cac2dcee0" FOREIGN KEY ("paymentId") REFERENCES "Payments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "PaymentMetadata"
            ADD CONSTRAINT "FK_28231f3bd7122736ec0e7e21134" FOREIGN KEY ("paymentId") REFERENCES "Payments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Payments"
            ADD CONSTRAINT "FK_d9d9f8079c3f8909154154ce334" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Payments"
            ADD CONSTRAINT "FK_61e80a03a53cf7b8a01aed56451" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Payments"
            ADD CONSTRAINT "FK_7b8c3afc25ede2302da3e710453" FOREIGN KEY ("processedByEmployeeId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Orders"
            ADD CONSTRAINT "FK_718ff5452f643301a09d8f184b7" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Orders"
            ADD CONSTRAINT "FK_f4a5166f839fe35ace8ad64d150" FOREIGN KEY ("customerId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Orders"
            ADD CONSTRAINT "FK_630fccb39e9caa4eaf2536f6c88" FOREIGN KEY ("createdByEmployeeId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Orders"
            ADD CONSTRAINT "FK_3036a371b9da2fb32181b253b40" FOREIGN KEY ("assignedStaffId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "SalesTopProducts"
            ADD CONSTRAINT "FK_ce76e2301435b2eb00cfe2b6e69" FOREIGN KEY ("salesAnalyticsId") REFERENCES "SalesAnalytics"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "SalesCategoryBreakdowns"
            ADD CONSTRAINT "FK_ee50236c81fb76216c08deb076f" FOREIGN KEY ("salesAnalyticsId") REFERENCES "SalesAnalytics"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "SalesPaymentMethodBreakdowns"
            ADD CONSTRAINT "FK_bc29c6042feeeb8a0de96dc3a88" FOREIGN KEY ("salesAnalyticsId") REFERENCES "SalesAnalytics"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "SalesOrderTypeBreakdowns"
            ADD CONSTRAINT "FK_091884982c56155d20d83728c97" FOREIGN KEY ("salesAnalyticsId") REFERENCES "SalesAnalytics"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "SalesPeakHours"
            ADD CONSTRAINT "FK_ae866ddcccfd6ca8e7ee6042229" FOREIGN KEY ("salesAnalyticsId") REFERENCES "SalesAnalytics"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "SalesAnalytics"
            ADD CONSTRAINT "FK_394d18bc1501426bb7d12f3f4bb" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyTransactions"
            ADD CONSTRAINT "FK_84f6e4759a2683f5900578bfac7" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyTransactions"
            ADD CONSTRAINT "FK_5c974dcecb09641c15683dce96e" FOREIGN KEY ("loyaltyAccountId") REFERENCES "LoyaltyAccounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyTransactions"
            ADD CONSTRAINT "FK_d13242fa19136bb2fa3e95f6412" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyTransactions"
            ADD CONSTRAINT "FK_080f13f14977d80d7d968325bd9" FOREIGN KEY ("processedByUserId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyAccounts"
            ADD CONSTRAINT "FK_58023135b1fe13d166e35edcf2c" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyAccounts"
            ADD CONSTRAINT "FK_047be8ee22b0ff378ae4b12684c" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyAccounts"
            ADD CONSTRAINT "FK_f62556f6c7e86558cb65625c472" FOREIGN KEY ("currentTierId") REFERENCES "LoyaltyTiers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyAccounts"
            ADD CONSTRAINT "FK_17bc44ed7d3ab936a0f83b5a168" FOREIGN KEY ("referredByUserId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyChallengeEligibility"
            ADD CONSTRAINT "FK_ba6e1b5edefb1d18b86a2590680" FOREIGN KEY ("challengeId") REFERENCES "LoyaltyChallenges"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyChallengeGoals"
            ADD CONSTRAINT "FK_94a085e67445c9833372047037b" FOREIGN KEY ("challengeId") REFERENCES "LoyaltyChallenges"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyChallengeMilestones"
            ADD CONSTRAINT "FK_3ab16c7f0c221053538ef0001c3" FOREIGN KEY ("challengeId") REFERENCES "LoyaltyChallenges"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyChallengeRewards"
            ADD CONSTRAINT "FK_50482931def0a62eee28ba021fc" FOREIGN KEY ("challengeId") REFERENCES "LoyaltyChallenges"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyChallengeTrackingRules"
            ADD CONSTRAINT "FK_8343c13bc507061fb0a2ccba842" FOREIGN KEY ("challengeId") REFERENCES "LoyaltyChallenges"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyChallenges"
            ADD CONSTRAINT "FK_7fd25bcd575c8b837d15de0f5f1" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyPromotionRules"
            ADD CONSTRAINT "FK_3160e8db146a1d02cfdb1d01ca3" FOREIGN KEY ("promotionId") REFERENCES "LoyaltyPromotions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyPromotionTargeting"
            ADD CONSTRAINT "FK_ff6cd3f35626a9ae187fb88e1c5" FOREIGN KEY ("promotionId") REFERENCES "LoyaltyPromotions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyPromotionMessaging"
            ADD CONSTRAINT "FK_813b8d7453b1238cdac01b05897" FOREIGN KEY ("promotionId") REFERENCES "LoyaltyPromotions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyPromotions"
            ADD CONSTRAINT "FK_b48efae8cb7aacd0f015f205e46" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewardRedemptionMetadata"
            ADD CONSTRAINT "FK_12f7d8a4f0158562c8b1cc0d680" FOREIGN KEY ("redemptionId") REFERENCES "LoyaltyRewardRedemptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewardRedemptions"
            ADD CONSTRAINT "FK_8dcf22a3916ad9bc16e689600ca" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewardRedemptions"
            ADD CONSTRAINT "FK_ea9b3f7ae9991076c2c7483d4b7" FOREIGN KEY ("loyaltyAccountId") REFERENCES "LoyaltyAccounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewardRedemptions"
            ADD CONSTRAINT "FK_5a27db7b5e9b48fc123fe345298" FOREIGN KEY ("rewardId") REFERENCES "LoyaltyRewards"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewardRedemptions"
            ADD CONSTRAINT "FK_2a10a4ac6905cf169b306cf42e5" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewardRedemptions"
            ADD CONSTRAINT "FK_8265e5d9e9ad889040bfc2e098b" FOREIGN KEY ("approvedByUserId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewardRedemptions"
            ADD CONSTRAINT "FK_4f76d07149b7e2631fc6717ab75" FOREIGN KEY ("redeemedByUserId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewardApplicableProducts"
            ADD CONSTRAINT "FK_8a94bbf8b2b42ca4d4ea10e185b" FOREIGN KEY ("loyaltyRewardId") REFERENCES "LoyaltyRewards"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewardSpecialProperties"
            ADD CONSTRAINT "FK_c1512d61065183a640669d61503" FOREIGN KEY ("loyaltyRewardId") REFERENCES "LoyaltyRewards"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewards"
            ADD CONSTRAINT "FK_7e3e0cf20ccff117ebed78e1091" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "ConfigurationValidation"
            ADD CONSTRAINT "FK_f87760062413f2f99af91553c7a" FOREIGN KEY ("configurationId") REFERENCES "Configurations"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "CafeBusinessHours"
            ADD CONSTRAINT "FK_73fb8356c04585452ab6091246d" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "CafeSettings"
            ADD CONSTRAINT "FK_4946644326333a75eb064d67d3e" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Users"
            ADD CONSTRAINT "FK_22149f679893ad21ae9782c6f01" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Configurations"
            ADD CONSTRAINT "FK_394cdac1170d2c8c241593ce11d" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Configurations"
            ADD CONSTRAINT "FK_b43921043d37ea2a84c0ed949bf" FOREIGN KEY ("lastModifiedById") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "ConfigurationUIOptions"
            ADD CONSTRAINT "FK_dd0fd6e08972702655a14e35918" FOREIGN KEY ("configurationId") REFERENCES "Configurations"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "ConfigurationUIOption"
            ADD CONSTRAINT "FK_5da746e50a43064012ce3059ab8" FOREIGN KEY ("uiOptionsId") REFERENCES "ConfigurationUIOptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "CounterWorkingHours"
            ADD CONSTRAINT "FK_1f986dcf48892bf923fa71a1fd1" FOREIGN KEY ("counterId") REFERENCES "Counters"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Counters"
            ADD CONSTRAINT "FK_3993d0ba11dee4fe7635e9491b4" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "AdminWorkflowSettings"
            ADD CONSTRAINT "FK_42588e28d14015d7426205b9937" FOREIGN KEY ("adminSettingsId") REFERENCES "AdminSettings"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "AdminReportingSettings"
            ADD CONSTRAINT "FK_ff1cff8ed3fd26477547e7c85f1" FOREIGN KEY ("adminSettingsId") REFERENCES "AdminSettings"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "AdminSettings"
            ADD CONSTRAINT "FK_67d7869c6df5f45a8f6cb9f4c5d" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "AdminSettings"
            ADD CONSTRAINT "FK_567ea8de76cd2f84132082b9d25" FOREIGN KEY ("lastUpdatedByUserId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "AdminDisplaySettings"
            ADD CONSTRAINT "FK_4df5bf3eb243837c4368e6a60e6" FOREIGN KEY ("adminSettingsId") REFERENCES "AdminSettings"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "AdminNotifications"
            ADD CONSTRAINT "FK_498a77456322758df65e9cc8457" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "AdminNotifications"
            ADD CONSTRAINT "FK_1c6215da9159793a8114df6ad1e" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "AdminNotificationData"
            ADD CONSTRAINT "FK_6d31215f0fb72ff6462dc39a9f3" FOREIGN KEY ("notificationId") REFERENCES "AdminNotifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Glasses"
            ADD CONSTRAINT "FK_520b293cd8e6f26ed2c106eafee" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Glasses"
            ADD CONSTRAINT "FK_70c4dc35daa074b9d7cbee234c7" FOREIGN KEY ("currentCustomerId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Glasses"
            ADD CONSTRAINT "FK_ac130ca1a66f014ee7fa6d7d1ee" FOREIGN KEY ("currentOrderId") REFERENCES "Orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "GlassMovements"
            ADD CONSTRAINT "FK_e496e00dfe653a768f36462aff0" FOREIGN KEY ("glassId") REFERENCES "Glasses"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "GlassMovements"
            ADD CONSTRAINT "FK_0f42e38983d38a74010c2f70e9e" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "GlassMovements"
            ADD CONSTRAINT "FK_f88db7545d4115951e02feab17c" FOREIGN KEY ("customerId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "GlassMovements"
            ADD CONSTRAINT "FK_2217d1732c3e8247ae70b7fa545" FOREIGN KEY ("employeeId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "GlassMovements" DROP CONSTRAINT "FK_2217d1732c3e8247ae70b7fa545"
        `);
        await queryRunner.query(`
            ALTER TABLE "GlassMovements" DROP CONSTRAINT "FK_f88db7545d4115951e02feab17c"
        `);
        await queryRunner.query(`
            ALTER TABLE "GlassMovements" DROP CONSTRAINT "FK_0f42e38983d38a74010c2f70e9e"
        `);
        await queryRunner.query(`
            ALTER TABLE "GlassMovements" DROP CONSTRAINT "FK_e496e00dfe653a768f36462aff0"
        `);
        await queryRunner.query(`
            ALTER TABLE "Glasses" DROP CONSTRAINT "FK_ac130ca1a66f014ee7fa6d7d1ee"
        `);
        await queryRunner.query(`
            ALTER TABLE "Glasses" DROP CONSTRAINT "FK_70c4dc35daa074b9d7cbee234c7"
        `);
        await queryRunner.query(`
            ALTER TABLE "Glasses" DROP CONSTRAINT "FK_520b293cd8e6f26ed2c106eafee"
        `);
        await queryRunner.query(`
            ALTER TABLE "AdminNotificationData" DROP CONSTRAINT "FK_6d31215f0fb72ff6462dc39a9f3"
        `);
        await queryRunner.query(`
            ALTER TABLE "AdminNotifications" DROP CONSTRAINT "FK_1c6215da9159793a8114df6ad1e"
        `);
        await queryRunner.query(`
            ALTER TABLE "AdminNotifications" DROP CONSTRAINT "FK_498a77456322758df65e9cc8457"
        `);
        await queryRunner.query(`
            ALTER TABLE "AdminDisplaySettings" DROP CONSTRAINT "FK_4df5bf3eb243837c4368e6a60e6"
        `);
        await queryRunner.query(`
            ALTER TABLE "AdminSettings" DROP CONSTRAINT "FK_567ea8de76cd2f84132082b9d25"
        `);
        await queryRunner.query(`
            ALTER TABLE "AdminSettings" DROP CONSTRAINT "FK_67d7869c6df5f45a8f6cb9f4c5d"
        `);
        await queryRunner.query(`
            ALTER TABLE "AdminReportingSettings" DROP CONSTRAINT "FK_ff1cff8ed3fd26477547e7c85f1"
        `);
        await queryRunner.query(`
            ALTER TABLE "AdminWorkflowSettings" DROP CONSTRAINT "FK_42588e28d14015d7426205b9937"
        `);
        await queryRunner.query(`
            ALTER TABLE "Counters" DROP CONSTRAINT "FK_3993d0ba11dee4fe7635e9491b4"
        `);
        await queryRunner.query(`
            ALTER TABLE "CounterWorkingHours" DROP CONSTRAINT "FK_1f986dcf48892bf923fa71a1fd1"
        `);
        await queryRunner.query(`
            ALTER TABLE "ConfigurationUIOption" DROP CONSTRAINT "FK_5da746e50a43064012ce3059ab8"
        `);
        await queryRunner.query(`
            ALTER TABLE "ConfigurationUIOptions" DROP CONSTRAINT "FK_dd0fd6e08972702655a14e35918"
        `);
        await queryRunner.query(`
            ALTER TABLE "Configurations" DROP CONSTRAINT "FK_b43921043d37ea2a84c0ed949bf"
        `);
        await queryRunner.query(`
            ALTER TABLE "Configurations" DROP CONSTRAINT "FK_394cdac1170d2c8c241593ce11d"
        `);
        await queryRunner.query(`
            ALTER TABLE "Users" DROP CONSTRAINT "FK_22149f679893ad21ae9782c6f01"
        `);
        await queryRunner.query(`
            ALTER TABLE "CafeSettings" DROP CONSTRAINT "FK_4946644326333a75eb064d67d3e"
        `);
        await queryRunner.query(`
            ALTER TABLE "CafeBusinessHours" DROP CONSTRAINT "FK_73fb8356c04585452ab6091246d"
        `);
        await queryRunner.query(`
            ALTER TABLE "ConfigurationValidation" DROP CONSTRAINT "FK_f87760062413f2f99af91553c7a"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewards" DROP CONSTRAINT "FK_7e3e0cf20ccff117ebed78e1091"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewardSpecialProperties" DROP CONSTRAINT "FK_c1512d61065183a640669d61503"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewardApplicableProducts" DROP CONSTRAINT "FK_8a94bbf8b2b42ca4d4ea10e185b"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewardRedemptions" DROP CONSTRAINT "FK_4f76d07149b7e2631fc6717ab75"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewardRedemptions" DROP CONSTRAINT "FK_8265e5d9e9ad889040bfc2e098b"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewardRedemptions" DROP CONSTRAINT "FK_2a10a4ac6905cf169b306cf42e5"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewardRedemptions" DROP CONSTRAINT "FK_5a27db7b5e9b48fc123fe345298"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewardRedemptions" DROP CONSTRAINT "FK_ea9b3f7ae9991076c2c7483d4b7"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewardRedemptions" DROP CONSTRAINT "FK_8dcf22a3916ad9bc16e689600ca"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewardRedemptionMetadata" DROP CONSTRAINT "FK_12f7d8a4f0158562c8b1cc0d680"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyPromotions" DROP CONSTRAINT "FK_b48efae8cb7aacd0f015f205e46"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyPromotionMessaging" DROP CONSTRAINT "FK_813b8d7453b1238cdac01b05897"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyPromotionTargeting" DROP CONSTRAINT "FK_ff6cd3f35626a9ae187fb88e1c5"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyPromotionRules" DROP CONSTRAINT "FK_3160e8db146a1d02cfdb1d01ca3"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyChallenges" DROP CONSTRAINT "FK_7fd25bcd575c8b837d15de0f5f1"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyChallengeTrackingRules" DROP CONSTRAINT "FK_8343c13bc507061fb0a2ccba842"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyChallengeRewards" DROP CONSTRAINT "FK_50482931def0a62eee28ba021fc"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyChallengeMilestones" DROP CONSTRAINT "FK_3ab16c7f0c221053538ef0001c3"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyChallengeGoals" DROP CONSTRAINT "FK_94a085e67445c9833372047037b"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyChallengeEligibility" DROP CONSTRAINT "FK_ba6e1b5edefb1d18b86a2590680"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyAccounts" DROP CONSTRAINT "FK_17bc44ed7d3ab936a0f83b5a168"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyAccounts" DROP CONSTRAINT "FK_f62556f6c7e86558cb65625c472"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyAccounts" DROP CONSTRAINT "FK_047be8ee22b0ff378ae4b12684c"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyAccounts" DROP CONSTRAINT "FK_58023135b1fe13d166e35edcf2c"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyTransactions" DROP CONSTRAINT "FK_080f13f14977d80d7d968325bd9"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyTransactions" DROP CONSTRAINT "FK_d13242fa19136bb2fa3e95f6412"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyTransactions" DROP CONSTRAINT "FK_5c974dcecb09641c15683dce96e"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyTransactions" DROP CONSTRAINT "FK_84f6e4759a2683f5900578bfac7"
        `);
        await queryRunner.query(`
            ALTER TABLE "SalesAnalytics" DROP CONSTRAINT "FK_394d18bc1501426bb7d12f3f4bb"
        `);
        await queryRunner.query(`
            ALTER TABLE "SalesPeakHours" DROP CONSTRAINT "FK_ae866ddcccfd6ca8e7ee6042229"
        `);
        await queryRunner.query(`
            ALTER TABLE "SalesOrderTypeBreakdowns" DROP CONSTRAINT "FK_091884982c56155d20d83728c97"
        `);
        await queryRunner.query(`
            ALTER TABLE "SalesPaymentMethodBreakdowns" DROP CONSTRAINT "FK_bc29c6042feeeb8a0de96dc3a88"
        `);
        await queryRunner.query(`
            ALTER TABLE "SalesCategoryBreakdowns" DROP CONSTRAINT "FK_ee50236c81fb76216c08deb076f"
        `);
        await queryRunner.query(`
            ALTER TABLE "SalesTopProducts" DROP CONSTRAINT "FK_ce76e2301435b2eb00cfe2b6e69"
        `);
        await queryRunner.query(`
            ALTER TABLE "Orders" DROP CONSTRAINT "FK_3036a371b9da2fb32181b253b40"
        `);
        await queryRunner.query(`
            ALTER TABLE "Orders" DROP CONSTRAINT "FK_630fccb39e9caa4eaf2536f6c88"
        `);
        await queryRunner.query(`
            ALTER TABLE "Orders" DROP CONSTRAINT "FK_f4a5166f839fe35ace8ad64d150"
        `);
        await queryRunner.query(`
            ALTER TABLE "Orders" DROP CONSTRAINT "FK_718ff5452f643301a09d8f184b7"
        `);
        await queryRunner.query(`
            ALTER TABLE "Payments" DROP CONSTRAINT "FK_7b8c3afc25ede2302da3e710453"
        `);
        await queryRunner.query(`
            ALTER TABLE "Payments" DROP CONSTRAINT "FK_61e80a03a53cf7b8a01aed56451"
        `);
        await queryRunner.query(`
            ALTER TABLE "Payments" DROP CONSTRAINT "FK_d9d9f8079c3f8909154154ce334"
        `);
        await queryRunner.query(`
            ALTER TABLE "PaymentMetadata" DROP CONSTRAINT "FK_28231f3bd7122736ec0e7e21134"
        `);
        await queryRunner.query(`
            ALTER TABLE "PaymentReceiptData" DROP CONSTRAINT "FK_bd1c38910d9e7f7a53cac2dcee0"
        `);
        await queryRunner.query(`
            ALTER TABLE "PaymentProviderData" DROP CONSTRAINT "FK_b93d086efba962b98e664a9a6a0"
        `);
        await queryRunner.query(`
            ALTER TABLE "Credits" DROP CONSTRAINT "FK_9aa0784676909b4652d60fbcf9d"
        `);
        await queryRunner.query(`
            ALTER TABLE "Credits" DROP CONSTRAINT "FK_48ec110d5df757644d79a23bce0"
        `);
        await queryRunner.query(`
            ALTER TABLE "Credits" DROP CONSTRAINT "FK_4d8f1a1f5061e65f6c599816e58"
        `);
        await queryRunner.query(`
            ALTER TABLE "Credits" DROP CONSTRAINT "FK_1c422be773dea8459e68b8f57ce"
        `);
        await queryRunner.query(`
            ALTER TABLE "CreditRestrictions" DROP CONSTRAINT "FK_b9e488b63f651827b2a9c12d3d5"
        `);
        await queryRunner.query(`
            ALTER TABLE "OrderWorkflowSteps" DROP CONSTRAINT "FK_c88f3cf369a93dca66e5bdbb41a"
        `);
        await queryRunner.query(`
            ALTER TABLE "OrderItems" DROP CONSTRAINT "FK_f11d5c16edede51cea87a8c4bfd"
        `);
        await queryRunner.query(`
            ALTER TABLE "OrderItems" DROP CONSTRAINT "FK_f91820d35e8129e7dd09881d886"
        `);
        await queryRunner.query(`
            ALTER TABLE "Products" DROP CONSTRAINT "FK_f937407f1f51448fd5e30cf911c"
        `);
        await queryRunner.query(`
            ALTER TABLE "PurchaseItems" DROP CONSTRAINT "FK_380e1a22e1e8470a27cdf2b07c7"
        `);
        await queryRunner.query(`
            ALTER TABLE "Purchases" DROP CONSTRAINT "FK_80d9c264da6577fc64a8bf36da1"
        `);
        await queryRunner.query(`
            ALTER TABLE "Purchases" DROP CONSTRAINT "FK_e073d6badd49f4ea7186c50e2b9"
        `);
        await queryRunner.query(`
            ALTER TABLE "Purchases" DROP CONSTRAINT "FK_899b00052061e1b9a38e34dfbe3"
        `);
        await queryRunner.query(`
            ALTER TABLE "InventoryAlerts" DROP CONSTRAINT "FK_8728df345cade18da681518b6c1"
        `);
        await queryRunner.query(`
            ALTER TABLE "InventoryAlerts" DROP CONSTRAINT "FK_618eed7ff1e3a1c6cdbc5e1c019"
        `);
        await queryRunner.query(`
            ALTER TABLE "InventoryAlerts" DROP CONSTRAINT "FK_407344b46e1f5376ed3cf2d476a"
        `);
        await queryRunner.query(`
            ALTER TABLE "InventoryAlerts" DROP CONSTRAINT "FK_9e8a2391fcefd257bdbb2529c93"
        `);
        await queryRunner.query(`
            ALTER TABLE "InventoryAlertMetadata" DROP CONSTRAINT "FK_765861d496786455de81335078f"
        `);
        await queryRunner.query(`
            ALTER TABLE "Stock" DROP CONSTRAINT "FK_17b0ef39058eca67f3bcd9aa49e"
        `);
        await queryRunner.query(`
            ALTER TABLE "Stock" DROP CONSTRAINT "FK_08518d80e907e6318dc3c92ac61"
        `);
        await queryRunner.query(`
            ALTER TABLE "StockMovements" DROP CONSTRAINT "FK_7fa02371da5f12dfbe35b4107e1"
        `);
        await queryRunner.query(`
            ALTER TABLE "StockMovements" DROP CONSTRAINT "FK_f7dee9c8a2f39d6fc4b10f986f0"
        `);
        await queryRunner.query(`
            ALTER TABLE "StockMovements" DROP CONSTRAINT "FK_f4fb4e183bd9ee4a2622096e6eb"
        `);
        await queryRunner.query(`
            ALTER TABLE "ProductAttributes" DROP CONSTRAINT "FK_b385a5e148ac0a4916369292e1c"
        `);
        await queryRunner.query(`
            ALTER TABLE "OrderItemCounterStatuses" DROP CONSTRAINT "FK_27b0f5459dbfbfdcb9b1bd1cb63"
        `);
        await queryRunner.query(`
            ALTER TABLE "OrderItemCounterStatuses" DROP CONSTRAINT "FK_741b58f16b0913337961fad157f"
        `);
        await queryRunner.query(`
            ALTER TABLE "OrderItemCustomizations" DROP CONSTRAINT "FK_34d28176cf129c2161491f5ac8d"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyTransactionMetadata" DROP CONSTRAINT "FK_8207c6ba54814f10e54aa7cef96"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyTiers" DROP CONSTRAINT "FK_6427596aaf89c0e101a7dbbb7b2"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyTierBenefits" DROP CONSTRAINT "FK_c47f24ed12a0f8b80666e006711"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyAccountPreferences" DROP CONSTRAINT "FK_e6554298583b056388476fe607f"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyAccountChallengeProgresses" DROP CONSTRAINT "FK_667d5d8808293c63a6930ff8849"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyAccountBadges" DROP CONSTRAINT "FK_c45b20581c5eca570d4ebe3f31e"
        `);
        await queryRunner.query(`
            ALTER TABLE "Employees" DROP CONSTRAINT "FK_26991f337433972a0848d61541d"
        `);
        await queryRunner.query(`
            ALTER TABLE "Employees" DROP CONSTRAINT "FK_6700509e032755f15eeca2aad8e"
        `);
        await queryRunner.query(`
            ALTER TABLE "TimeEntries" DROP CONSTRAINT "FK_1dfb871e5bd4374243368deec9e"
        `);
        await queryRunner.query(`
            ALTER TABLE "TimeSheets" DROP CONSTRAINT "FK_e0b92ebc9e4c1ba3c116922c592"
        `);
        await queryRunner.query(`
            ALTER TABLE "TimeSheets" DROP CONSTRAINT "FK_ce7723486df238f84c1078b673d"
        `);
        await queryRunner.query(`
            ALTER TABLE "EmployeeWorkingHours" DROP CONSTRAINT "FK_166fdf71fca58968f2c4a2f1094"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e496e00dfe653a768f36462aff"
        `);
        await queryRunner.query(`
            DROP TABLE "GlassMovements"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f12c12663c81e0d14aeb2b54a4"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_63ed523be38b69f7192db0acf5"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_67acb8ade7046581d475322256"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a81b910a0f45cf0da0a7efc2a3"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_520b293cd8e6f26ed2c106eafe"
        `);
        await queryRunner.query(`
            DROP TABLE "Glasses"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6d31215f0fb72ff6462dc39a9f"
        `);
        await queryRunner.query(`
            DROP TABLE "AdminNotificationData"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_08d7d1b323d8dd304e3f94cb01"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a77d5ad658e4862819272417e1"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ea70f93b460b0d104d5d620db5"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_50c3ac400188c6a94aba420b80"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1c6215da9159793a8114df6ad1"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_498a77456322758df65e9cc845"
        `);
        await queryRunner.query(`
            DROP TABLE "AdminNotifications"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."AdminNotifications_severity_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."AdminNotifications_type_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_4df5bf3eb243837c4368e6a60e"
        `);
        await queryRunner.query(`
            DROP TABLE "AdminDisplaySettings"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_67d7869c6df5f45a8f6cb9f4c5"
        `);
        await queryRunner.query(`
            DROP TABLE "AdminSettings"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ff1cff8ed3fd26477547e7c85f"
        `);
        await queryRunner.query(`
            DROP TABLE "AdminReportingSettings"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_42588e28d14015d7426205b993"
        `);
        await queryRunner.query(`
            DROP TABLE "AdminWorkflowSettings"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e3c3a644db189cc9b5c8bfb891"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a6d61c848877c624ef7f287615"
        `);
        await queryRunner.query(`
            DROP TABLE "Cafes"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_481bb9173f282a31c394890376"
        `);
        await queryRunner.query(`
            DROP TABLE "CounterCapabilities"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_24efdd6f1a6f1815f6a2223e01"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b7110f4b4504111686af8a7385"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_4b06ae8406e3225932f61360c9"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3993d0ba11dee4fe7635e9491b"
        `);
        await queryRunner.query(`
            DROP TABLE "Counters"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."Counters_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."Counters_type_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c89a457efc44198f6a8130de31"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1f986dcf48892bf923fa71a1fd"
        `);
        await queryRunner.query(`
            DROP TABLE "CounterWorkingHours"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."CounterWorkingHours_dayofweek_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f740c3e2a0fd7067ae8f13f157"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5da746e50a43064012ce3059ab"
        `);
        await queryRunner.query(`
            DROP TABLE "ConfigurationUIOption"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_dd0fd6e08972702655a14e3591"
        `);
        await queryRunner.query(`
            DROP TABLE "ConfigurationUIOptions"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_9be3c8e45f4d0c4ebc86435bbe"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_394cdac1170d2c8c241593ce11"
        `);
        await queryRunner.query(`
            DROP TABLE "Configurations"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5f8256554b2eec66fda266f625"
        `);
        await queryRunner.query(`
            DROP TABLE "UserPreferences"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3d813296faf4e2cdd3cfcd64b4"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_cd09a2e0b5c8f0d9ab7ab8d340"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d7b88224b4713f50fabf2a6d3f"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_cfc69e3e413e4dd82e8578f539"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7cf0772bcfdec5a968f30e1d6e"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_83841eeb21acd71c8422eb5796"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c75e2e4931c3af1378d5443756"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_92296d4acf305474bdf6e03332"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_22149f679893ad21ae9782c6f0"
        `);
        await queryRunner.query(`
            DROP TABLE "Users"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."Users_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."Users_role_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_4946644326333a75eb064d67d3"
        `);
        await queryRunner.query(`
            DROP TABLE "CafeSettings"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_073740206c617ee43433673e0d"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_73fb8356c04585452ab6091246"
        `);
        await queryRunner.query(`
            DROP TABLE "CafeBusinessHours"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."CafeBusinessHours_dayofweek_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f87760062413f2f99af91553c7"
        `);
        await queryRunner.query(`
            DROP TABLE "ConfigurationValidation"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c69c7a0951b6ad6e96149cf343"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_fb24e81287c16ee7cb5b1ebe20"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_cd3d87553d97bf774cf4750f1a"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7e3e0cf20ccff117ebed78e109"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyRewards"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."LoyaltyRewards_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."LoyaltyRewards_category_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."LoyaltyRewards_type_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c1512d61065183a640669d6150"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyRewardSpecialProperties"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8a94bbf8b2b42ca4d4ea10e185"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyRewardApplicableProducts"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3e6a563e9db69270c749767fed"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8d66dfff929b06640688a6d553"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5a27db7b5e9b48fc123fe34529"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ea9b3f7ae9991076c2c7483d4b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8dcf22a3916ad9bc16e689600c"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyRewardRedemptions"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."LoyaltyRewardRedemptions_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_12f7d8a4f0158562c8b1cc0d68"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyRewardRedemptionMetadata"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_99936079d07aae7f4495927078"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_eaef60bfd3c90dbc80e9fa8f8c"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5e37f971fd2a3e636d03f5504c"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b48efae8cb7aacd0f015f205e4"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyPromotions"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."LoyaltyPromotions_trigger_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."LoyaltyPromotions_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."LoyaltyPromotions_type_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_813b8d7453b1238cdac01b0589"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyPromotionMessaging"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ff6cd3f35626a9ae187fb88e1c"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyPromotionTargeting"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3160e8db146a1d02cfdb1d01ca"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyPromotionRules"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8bda1a88293022885b3b732f6b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_de944bc5ea7deb865cb89a4aa0"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8c71b50c9b634deac0a5605616"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7fd25bcd575c8b837d15de0f5f"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyChallenges"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."LoyaltyChallenges_frequency_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."LoyaltyChallenges_difficulty_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."LoyaltyChallenges_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."LoyaltyChallenges_type_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8343c13bc507061fb0a2ccba84"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyChallengeTrackingRules"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_50482931def0a62eee28ba021f"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyChallengeRewards"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e532ac4b31b0f53fdc8ea1478c"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f4f86c679fd95dc7e1ba64b3fe"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3ab16c7f0c221053538ef0001c"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyChallengeMilestones"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_94a085e67445c9833372047037"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyChallengeGoals"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ba6e1b5edefb1d18b86a259068"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyChallengeEligibility"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a548f4f080ba5839f018680c89"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_450ef210edb5f0ea91676dd8fa"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_30905ef63c531a7c4a7fa8074b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_047be8ee22b0ff378ae4b12684"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_58023135b1fe13d166e35edcf2"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyAccounts"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1baadf557e31744c112d321bd8"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f895c326abb723bec51a4486ac"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5c974dcecb09641c15683dce96"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_84f6e4759a2683f5900578bfac"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyTransactions"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."LoyaltyTransactions_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."LoyaltyTransactions_type_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5cb9c1ad1db11c13d2fc1b5c15"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d1d18fb91ec1c0f958844ad0d9"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_394d18bc1501426bb7d12f3f4b"
        `);
        await queryRunner.query(`
            DROP TABLE "SalesAnalytics"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_114bdb76b34c068434c5a248d2"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ae866ddcccfd6ca8e7ee604222"
        `);
        await queryRunner.query(`
            DROP TABLE "SalesPeakHours"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_091884982c56155d20d83728c9"
        `);
        await queryRunner.query(`
            DROP TABLE "SalesOrderTypeBreakdowns"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_bc29c6042feeeb8a0de96dc3a8"
        `);
        await queryRunner.query(`
            DROP TABLE "SalesPaymentMethodBreakdowns"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ecb42a81652dd64881d17fc081"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ee50236c81fb76216c08deb076"
        `);
        await queryRunner.query(`
            DROP TABLE "SalesCategoryBreakdowns"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_64f17c4a6dc3070362b4623d18"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f5f59f3f3e3d2952ae515824c4"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ce76e2301435b2eb00cfe2b6e6"
        `);
        await queryRunner.query(`
            DROP TABLE "SalesTopProducts"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_468561b66624a9e04f0e7827be"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_29440a57137fd29752d6195809"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f4a5166f839fe35ace8ad64d15"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_69cbec8966ebb42d2fc88f5e37"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_718ff5452f643301a09d8f184b"
        `);
        await queryRunner.query(`
            DROP TABLE "Orders"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."Orders_priority_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."Orders_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_0cb7b81de6e8f9f84a7c5a40bf"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."transactionId"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."userId"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."orderId"
        `);
        await queryRunner.query(`
            DROP TABLE "Payments"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."Payments_type_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."Payments_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."Payments_method_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_28231f3bd7122736ec0e7e2113"
        `);
        await queryRunner.query(`
            DROP TABLE "PaymentMetadata"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_bd1c38910d9e7f7a53cac2dcee"
        `);
        await queryRunner.query(`
            DROP TABLE "PaymentReceiptData"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b93d086efba962b98e664a9a6a"
        `);
        await queryRunner.query(`
            DROP TABLE "PaymentProviderData"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5b3f2897bf253623e9e31937de"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_53a053fb4483675ade1bd30412"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_4d8f1a1f5061e65f6c599816e5"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1c422be773dea8459e68b8f57c"
        `);
        await queryRunner.query(`
            DROP TABLE "Credits"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."Credits_transactiontype_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b9e488b63f651827b2a9c12d3d"
        `);
        await queryRunner.query(`
            DROP TABLE "CreditRestrictions"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_438168ff4de2cfc3d5a2a1beaa"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_13024b1902491c3c9bae575d78"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c88f3cf369a93dca66e5bdbb41"
        `);
        await queryRunner.query(`
            DROP TABLE "OrderWorkflowSteps"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."OrderWorkflowSteps_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f11d5c16edede51cea87a8c4bf"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f91820d35e8129e7dd09881d88"
        `);
        await queryRunner.query(`
            DROP TABLE "OrderItems"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."OrderItems_preparationstatus_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_73672ec2e00a65cc52afa58887"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d47501bbb68f7b8e87c41bed31"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_26c9336d231c4e90419a5954bd"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f937407f1f51448fd5e30cf911"
        `);
        await queryRunner.query(`
            DROP TABLE "Products"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."Products_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."Products_category_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_380e1a22e1e8470a27cdf2b07c"
        `);
        await queryRunner.query(`
            DROP TABLE "PurchaseItems"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_84130443f81572f0b1f1600917"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_92c54f5fa6a90a0819fa83c210"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_899b00052061e1b9a38e34dfbe"
        `);
        await queryRunner.query(`
            DROP TABLE "Purchases"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_44d5d29e38090f39cb7e2fdf3c"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_9c5d50724b926aca028b92e937"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d886ce872af0b9c2bd39350e4a"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_407344b46e1f5376ed3cf2d476"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_9e8a2391fcefd257bdbb2529c9"
        `);
        await queryRunner.query(`
            DROP TABLE "InventoryAlerts"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."InventoryAlerts_severity_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."InventoryAlerts_type_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_765861d496786455de81335078"
        `);
        await queryRunner.query(`
            DROP TABLE "InventoryAlertMetadata"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c442ad54cfaaf16727b1b7ccdb"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_17b0ef39058eca67f3bcd9aa49"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_08518d80e907e6318dc3c92ac6"
        `);
        await queryRunner.query(`
            DROP TABLE "Stock"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1591c08b8d537b1bb3321760e4"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7c4b62060a9ccc86406743d405"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f7dee9c8a2f39d6fc4b10f986f"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f4fb4e183bd9ee4a2622096e6e"
        `);
        await queryRunner.query(`
            DROP TABLE "StockMovements"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."StockMovements_movementtype_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b385a5e148ac0a4916369292e1"
        `);
        await queryRunner.query(`
            DROP TABLE "ProductAttributes"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_2616de054e96787d4d15d75f93"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_27b0f5459dbfbfdcb9b1bd1cb6"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_741b58f16b0913337961fad157"
        `);
        await queryRunner.query(`
            DROP TABLE "OrderItemCounterStatuses"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."OrderItemCounterStatuses_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_34d28176cf129c2161491f5ac8"
        `);
        await queryRunner.query(`
            DROP TABLE "OrderItemCustomizations"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8207c6ba54814f10e54aa7cef9"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyTransactionMetadata"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_14e8596806a56b248531fcc37e"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e586dc9b168d5289860113c47b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_cb6a16f517e1e77120c55399f3"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6427596aaf89c0e101a7dbbb7b"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyTiers"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c47f24ed12a0f8b80666e00671"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyTierBenefits"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e6554298583b056388476fe607"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyAccountPreferences"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1c287d5f20aa4e7fdaba6dfd98"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8b482393c0f76d45917900c9d2"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_667d5d8808293c63a6930ff884"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyAccountChallengeProgresses"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_70dd76efdeaf58d129fab6693a"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c45b20581c5eca570d4ebe3f31"
        `);
        await queryRunner.query(`
            DROP TABLE "LoyaltyAccountBadges"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_44b74604cbc981f4e99c18b0d8"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f9c63acc5a12f74368c4c57e8e"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_47fd6f6b6c4025b2ee42bb8dfe"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ce87cac81a226be1e6992051d9"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6b8f7af3befe258c2bb6ed5a45"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_26991f337433972a0848d61541"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6700509e032755f15eeca2aad8"
        `);
        await queryRunner.query(`
            DROP TABLE "Employees"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."Employees_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."Employees_position_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f067ac5dc265f4e9069bb8063c"
        `);
        await queryRunner.query(`
            DROP TABLE "EmployeeEmergencyContact"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1dfb871e5bd4374243368deec9"
        `);
        await queryRunner.query(`
            DROP TABLE "TimeEntries"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6d7cbc95ac475d5fe24822a97c"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3a8be6468163f483ce4229cb48"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e0b92ebc9e4c1ba3c116922c59"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ce7723486df238f84c1078b673"
        `);
        await queryRunner.query(`
            DROP TABLE "TimeSheets"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."TimeSheets_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6e0a1bfb3fa53d5119f0e8bec9"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_166fdf71fca58968f2c4a2f109"
        `);
        await queryRunner.query(`
            DROP TABLE "EmployeeWorkingHours"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."EmployeeWorkingHours_dayofweek_enum"
        `);
    }

}
