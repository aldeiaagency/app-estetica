-- CreateEnum
CREATE TYPE "BeautyPackItemType" AS ENUM ('SERVICE', 'PRODUCT', 'BONUS_SESSION', 'CONSULTATION', 'FOLLOW_UP', 'OTHER');

-- CreateTable
CREATE TABLE "BeautyPack" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "bonoId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "objective" TEXT NOT NULL,
    "description" TEXT,
    "audience" TEXT,
    "notFor" TEXT,
    "expectedResult" TEXT,
    "priceCents" INTEGER NOT NULL,
    "compareAtPriceCents" INTEGER,
    "durationDays" INTEGER,
    "preferredArea" "BeautyArea",
    "minMaintenanceLevel" "MaintenanceLevel",
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeautyPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeautyPackItem" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "itemType" "BeautyPackItemType" NOT NULL DEFAULT 'SERVICE',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "serviceId" TEXT,
    "productId" TEXT,
    "note" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeautyPackItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BeautyPack_centerId_slug_key" ON "BeautyPack"("centerId", "slug");

-- CreateIndex
CREATE INDEX "BeautyPack_centerId_active_idx" ON "BeautyPack"("centerId", "active");

-- CreateIndex
CREATE INDEX "BeautyPack_preferredArea_active_idx" ON "BeautyPack"("preferredArea", "active");

-- CreateIndex
CREATE INDEX "BeautyPackItem_packId_idx" ON "BeautyPackItem"("packId");

-- AddForeignKey
ALTER TABLE "BeautyPack" ADD CONSTRAINT "BeautyPack_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeautyPack" ADD CONSTRAINT "BeautyPack_bonoId_fkey" FOREIGN KEY ("bonoId") REFERENCES "Bono"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeautyPackItem" ADD CONSTRAINT "BeautyPackItem_packId_fkey" FOREIGN KEY ("packId") REFERENCES "BeautyPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeautyPlanItem" ADD CONSTRAINT "BeautyPlanItem_packId_fkey" FOREIGN KEY ("packId") REFERENCES "BeautyPack"("id") ON DELETE SET NULL ON UPDATE CASCADE;
