-- CreateEnum
CREATE TYPE "BeautyPlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BeautyPlanItemType" AS ENUM ('SERVICE', 'PRODUCT', 'PACK', 'REMINDER', 'AVOID', 'EDUCATION');

-- CreateEnum
CREATE TYPE "BeautyPlanItemStatus" AS ENUM ('PENDING', 'DONE', 'SKIPPED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "BeautyBenefitType" AS ENUM ('DISCOUNT', 'PRIORITY_BOOKING', 'FREE_DIAGNOSIS', 'GIFT', 'MEMBER_ONLY_PACK', 'FREE_REVIEW', 'CASHBACK', 'POINTS');

-- CreateEnum
CREATE TYPE "UserBenefitStatus" AS ENUM ('ACTIVE', 'CLAIMED', 'USED', 'EXPIRED');

-- CreateTable
CREATE TABLE "BeautyPlan" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "summary" TEXT,
    "status" "BeautyPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "estimatedBudgetCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeautyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeautyPlanItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "type" "BeautyPlanItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "serviceId" TEXT,
    "productId" TEXT,
    "packId" TEXT,
    "centerId" TEXT,
    "recommendedDate" TIMESTAMP(3),
    "estimatedPriceCents" INTEGER,
    "status" "BeautyPlanItemStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "BeautyPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeautyBenefit" (
    "id" TEXT NOT NULL,
    "centerId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "benefitType" "BeautyBenefitType" NOT NULL,
    "value" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "minPlanRequired" "Plan",
    "membersOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeautyBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBenefit" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,
    "status" "UserBenefitStatus" NOT NULL DEFAULT 'ACTIVE',
    "claimedAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "UserBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BeautyPlan_profileId_month_idx" ON "BeautyPlan"("profileId", "month");

-- CreateIndex
CREATE INDEX "BeautyPlanItem_planId_idx" ON "BeautyPlanItem"("planId");

-- CreateIndex
CREATE INDEX "BeautyPlanItem_status_idx" ON "BeautyPlanItem"("status");

-- CreateIndex
CREATE INDEX "BeautyBenefit_centerId_active_idx" ON "BeautyBenefit"("centerId", "active");

-- CreateIndex
CREATE INDEX "BeautyBenefit_active_idx" ON "BeautyBenefit"("active");

-- CreateIndex
CREATE UNIQUE INDEX "UserBenefit_profileId_benefitId_key" ON "UserBenefit"("profileId", "benefitId");

-- CreateIndex
CREATE INDEX "UserBenefit_profileId_status_idx" ON "UserBenefit"("profileId", "status");

-- AddForeignKey
ALTER TABLE "BeautyPlan" ADD CONSTRAINT "BeautyPlan_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BeautyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeautyPlanItem" ADD CONSTRAINT "BeautyPlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BeautyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeautyBenefit" ADD CONSTRAINT "BeautyBenefit_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBenefit" ADD CONSTRAINT "UserBenefit_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BeautyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBenefit" ADD CONSTRAINT "UserBenefit_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "BeautyBenefit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
