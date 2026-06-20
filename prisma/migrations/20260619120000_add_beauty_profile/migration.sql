-- CreateEnum
CREATE TYPE "SkinType" AS ENUM ('DRY', 'OILY', 'COMBINATION', 'SENSITIVE', 'NORMAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "HairType" AS ENUM ('STRAIGHT', 'WAVY', 'CURLY', 'COILY', 'FINE', 'THICK', 'COLORED', 'DAMAGED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "BeautyStyle" AS ENUM ('NATURAL', 'ELEGANT', 'BOLD', 'MINIMAL', 'PREMIUM', 'PRACTICAL');

-- CreateEnum
CREATE TYPE "MaintenanceLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "PriceSensitivity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "BuyingMotivation" AS ENUM ('ROUTINE', 'EVENT', 'PROBLEM_SOLVING', 'SELF_CARE', 'IMPULSE', 'RECOMMENDATION');

-- CreateEnum
CREATE TYPE "BeautyFear" AS ENUM ('WASTING_MONEY', 'LOOKING_ARTIFICIAL', 'NOT_KNOWING_WHAT_TO_CHOOSE', 'BAD_EXPERIENCE', 'TOO_MUCH_MAINTENANCE', 'IRRITATION_OR_REACTION');

-- CreateEnum
CREATE TYPE "BeautyArea" AS ENUM ('SKIN', 'HAIR', 'NAILS', 'BROWS_LASHES', 'MAKEUP', 'BODY', 'WELLNESS');

-- CreateTable
CREATE TABLE "BeautyProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skinType" "SkinType",
    "hairType" "HairType",
    "beautyStyle" "BeautyStyle",
    "monthlyBudgetCents" INTEGER,
    "maintenanceLevel" "MaintenanceLevel",
    "mainConcern" TEXT,
    "secondaryConcern" TEXT,
    "priceSensitivity" "PriceSensitivity",
    "buyingMotivation" "BuyingMotivation",
    "fear" "BeautyFear",
    "consentPersonalizationAt" TIMESTAMP(3),
    "profileCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeautyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeautyGoal" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "area" "BeautyArea" NOT NULL,
    "objective" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeautyGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BeautyProfile_userId_key" ON "BeautyProfile"("userId");

-- CreateIndex
CREATE INDEX "BeautyGoal_profileId_active_idx" ON "BeautyGoal"("profileId", "active");

-- AddForeignKey
ALTER TABLE "BeautyProfile" ADD CONSTRAINT "BeautyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeautyGoal" ADD CONSTRAINT "BeautyGoal_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "BeautyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
