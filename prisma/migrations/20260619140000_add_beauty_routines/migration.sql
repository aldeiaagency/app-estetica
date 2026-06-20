-- CreateEnum
CREATE TYPE "BeautyRoutineStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BeautyRoutineStepStatus" AS ENUM ('ACTIVE', 'PAUSED', 'FINISHED', 'REMOVED');

-- CreateEnum
CREATE TYPE "BeautyRoutineStepType" AS ENUM ('CLEANSER', 'TONER', 'SERUM', 'MOISTURIZER', 'SPF', 'MASK', 'HAIR_CARE', 'NAIL_CARE', 'BODY_CARE', 'MAKEUP', 'WELLNESS', 'OTHER');

-- CreateEnum
CREATE TYPE "BeautyRoutineMoment" AS ENUM ('MORNING', 'EVENING', 'WEEKLY', 'AS_NEEDED');

-- CreateEnum
CREATE TYPE "ProductUsageStatus" AS ENUM ('IN_USE', 'PAUSED', 'FINISHED', 'REPLENISH_SOON');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "usageInstructions" TEXT,
ADD COLUMN "recommendedFor" TEXT,
ADD COLUMN "notRecommendedFor" TEXT,
ADD COLUMN "expectedDurationDays" INTEGER,
ADD COLUMN "replenishmentIntervalDays" INTEGER,
ADD COLUMN "routineStepType" "BeautyRoutineStepType",
ADD COLUMN "compatibilityTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "recommendationTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "alternativeProductId" TEXT;

-- CreateTable
CREATE TABLE "BeautyRoutine" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "BeautyRoutineStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeautyRoutine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeautyRoutineStep" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "productId" TEXT,
    "title" TEXT NOT NULL,
    "stepType" "BeautyRoutineStepType" NOT NULL DEFAULT 'OTHER',
    "moment" "BeautyRoutineMoment" NOT NULL DEFAULT 'AS_NEEDED',
    "instructions" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "BeautyRoutineStepStatus" NOT NULL DEFAULT 'ACTIVE',
    "pausedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeautyRoutineStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductUsage" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "stepId" TEXT,
    "status" "ProductUsageStatus" NOT NULL DEFAULT 'IN_USE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedEndAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "replenishmentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "replenishmentIntervalDays" INTEGER,
    "lastReminderAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_routineStepType_active_idx" ON "Product"("routineStepType", "active");

-- CreateIndex
CREATE INDEX "BeautyRoutine_profileId_status_idx" ON "BeautyRoutine"("profileId", "status");

-- CreateIndex
CREATE INDEX "BeautyRoutineStep_routineId_status_idx" ON "BeautyRoutineStep"("routineId", "status");

-- CreateIndex
CREATE INDEX "BeautyRoutineStep_productId_idx" ON "BeautyRoutineStep"("productId");

-- CreateIndex
CREATE INDEX "ProductUsage_profileId_status_idx" ON "ProductUsage"("profileId", "status");

-- CreateIndex
CREATE INDEX "ProductUsage_productId_idx" ON "ProductUsage"("productId");

-- CreateIndex
CREATE INDEX "ProductUsage_expectedEndAt_replenishmentEnabled_idx" ON "ProductUsage"("expectedEndAt", "replenishmentEnabled");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_alternativeProductId_fkey" FOREIGN KEY ("alternativeProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeautyRoutine" ADD CONSTRAINT "BeautyRoutine_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BeautyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeautyRoutineStep" ADD CONSTRAINT "BeautyRoutineStep_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "BeautyRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeautyRoutineStep" ADD CONSTRAINT "BeautyRoutineStep_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductUsage" ADD CONSTRAINT "ProductUsage_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BeautyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductUsage" ADD CONSTRAINT "ProductUsage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductUsage" ADD CONSTRAINT "ProductUsage_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "BeautyRoutineStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
