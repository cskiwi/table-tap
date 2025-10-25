import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialDatabase1761380888435 implements MigrationInterface {
    name = 'InitialDatabase1761380888435'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
                "attributes" json,
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
                "customizations" json,
                "specialInstructions" text,
                "basePrice" numeric(10, 2),
                "customizationPrice" numeric(10, 2),
                "discountAmount" numeric(10, 2),
                "countersRequired" text,
                "counterStatus" json,
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
                "providerData" json,
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
                "metadata" json,
                "processorResponse" character varying,
                "notes" text,
                "receiptNumber" character varying,
                "receiptData" json,
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
                "counterId" uuid,
                "estimatedPrepTime" integer,
                "confirmedAt" TIMESTAMP,
                "preparingAt" TIMESTAMP,
                "readyAt" TIMESTAMP,
                "deliveredAt" TIMESTAMP,
                "cancelledAt" TIMESTAMP,
                "workflowSteps" json,
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
                "restrictions" json,
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
                "workingHours" json,
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
                "benefits" json,
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
                "metadata" json,
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
                "badges" json NOT NULL DEFAULT '[]',
                "challengeProgress" json NOT NULL DEFAULT '{}',
                "preferences" json,
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
                "preferences" json,
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
            CREATE TYPE "public"."Counters_status_enum" AS ENUM('active', 'inactive', 'maintenance', 'offline')
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
                "workingHours" json,
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
                "validation" json,
                "isActive" boolean NOT NULL DEFAULT true,
                "isReadOnly" boolean NOT NULL DEFAULT false,
                "isSystem" boolean NOT NULL DEFAULT false,
                "requiresRestart" boolean NOT NULL DEFAULT false,
                "inputType" character varying,
                "uiOptions" json,
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
                "metadata" json,
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
                "requiredTierLevels" json NOT NULL DEFAULT '[]',
                "minimumSpend" numeric(10, 2) NOT NULL DEFAULT '0',
                "applicableProducts" json,
                "terms" text,
                "canCombineWithOtherOffers" boolean NOT NULL DEFAULT true,
                "requiresApproval" boolean NOT NULL DEFAULT false,
                "priority" integer NOT NULL DEFAULT '0',
                "isVisible" boolean NOT NULL DEFAULT true,
                "isActive" boolean NOT NULL DEFAULT true,
                "isFeatured" boolean NOT NULL DEFAULT false,
                "specialProperties" json,
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
                "goals" json NOT NULL DEFAULT '{}',
                "trackingRules" json NOT NULL DEFAULT '{}',
                "rewards" json NOT NULL DEFAULT '{}',
                "eligibility" json NOT NULL DEFAULT '{}',
                "priority" integer NOT NULL DEFAULT '0',
                "color" character varying NOT NULL DEFAULT '#3B82F6',
                "tags" json NOT NULL DEFAULT '[]',
                "milestones" json NOT NULL DEFAULT '[]',
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
                "rules" json NOT NULL DEFAULT '{}',
                "targeting" json NOT NULL DEFAULT '{}',
                "messaging" json NOT NULL DEFAULT '{}',
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
                "settings" json,
                "businessHours" json,
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
            ALTER TABLE "TimeEntries"
            ADD CONSTRAINT "FK_1dfb871e5bd4374243368deec9e" FOREIGN KEY ("timeSheetId") REFERENCES "TimeSheets"("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
            ALTER TABLE "Employees"
            ADD CONSTRAINT "FK_6700509e032755f15eeca2aad8e" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Employees"
            ADD CONSTRAINT "FK_26991f337433972a0848d61541d" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyTiers"
            ADD CONSTRAINT "FK_6427596aaf89c0e101a7dbbb7b2" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
            ALTER TABLE "Users"
            ADD CONSTRAINT "FK_22149f679893ad21ae9782c6f01" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Counters"
            ADD CONSTRAINT "FK_3993d0ba11dee4fe7635e9491b4" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
            ALTER TABLE "LoyaltyRewards"
            ADD CONSTRAINT "FK_7e3e0cf20ccff117ebed78e1091" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyChallenges"
            ADD CONSTRAINT "FK_7fd25bcd575c8b837d15de0f5f1" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyPromotions"
            ADD CONSTRAINT "FK_b48efae8cb7aacd0f015f205e46" FOREIGN KEY ("cafeId") REFERENCES "Cafes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
            ALTER TABLE "LoyaltyPromotions" DROP CONSTRAINT "FK_b48efae8cb7aacd0f015f205e46"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyChallenges" DROP CONSTRAINT "FK_7fd25bcd575c8b837d15de0f5f1"
        `);
        await queryRunner.query(`
            ALTER TABLE "LoyaltyRewards" DROP CONSTRAINT "FK_7e3e0cf20ccff117ebed78e1091"
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
            ALTER TABLE "Configurations" DROP CONSTRAINT "FK_b43921043d37ea2a84c0ed949bf"
        `);
        await queryRunner.query(`
            ALTER TABLE "Configurations" DROP CONSTRAINT "FK_394cdac1170d2c8c241593ce11d"
        `);
        await queryRunner.query(`
            ALTER TABLE "Counters" DROP CONSTRAINT "FK_3993d0ba11dee4fe7635e9491b4"
        `);
        await queryRunner.query(`
            ALTER TABLE "Users" DROP CONSTRAINT "FK_22149f679893ad21ae9782c6f01"
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
            ALTER TABLE "LoyaltyTiers" DROP CONSTRAINT "FK_6427596aaf89c0e101a7dbbb7b2"
        `);
        await queryRunner.query(`
            ALTER TABLE "Employees" DROP CONSTRAINT "FK_26991f337433972a0848d61541d"
        `);
        await queryRunner.query(`
            ALTER TABLE "Employees" DROP CONSTRAINT "FK_6700509e032755f15eeca2aad8e"
        `);
        await queryRunner.query(`
            ALTER TABLE "TimeSheets" DROP CONSTRAINT "FK_e0b92ebc9e4c1ba3c116922c592"
        `);
        await queryRunner.query(`
            ALTER TABLE "TimeSheets" DROP CONSTRAINT "FK_ce7723486df238f84c1078b673d"
        `);
        await queryRunner.query(`
            ALTER TABLE "TimeEntries" DROP CONSTRAINT "FK_1dfb871e5bd4374243368deec9e"
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
            ALTER TABLE "OrderItems" DROP CONSTRAINT "FK_f11d5c16edede51cea87a8c4bfd"
        `);
        await queryRunner.query(`
            ALTER TABLE "OrderItems" DROP CONSTRAINT "FK_f91820d35e8129e7dd09881d886"
        `);
        await queryRunner.query(`
            ALTER TABLE "Products" DROP CONSTRAINT "FK_f937407f1f51448fd5e30cf911c"
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
            DROP INDEX "public"."IDX_e3c3a644db189cc9b5c8bfb891"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a6d61c848877c624ef7f287615"
        `);
        await queryRunner.query(`
            DROP TABLE "Cafes"
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
            DROP INDEX "public"."IDX_9be3c8e45f4d0c4ebc86435bbe"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_394cdac1170d2c8c241593ce11"
        `);
        await queryRunner.query(`
            DROP TABLE "Configurations"
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
            DROP INDEX "public"."IDX_1dfb871e5bd4374243368deec9"
        `);
        await queryRunner.query(`
            DROP TABLE "TimeEntries"
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
            DROP INDEX "public"."IDX_f11d5c16edede51cea87a8c4bf"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_f91820d35e8129e7dd09881d88"
        `);
        await queryRunner.query(`
            DROP TABLE "OrderItems"
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
    }

}
