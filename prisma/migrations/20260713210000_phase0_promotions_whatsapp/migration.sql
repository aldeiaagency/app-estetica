CREATE TYPE "PromotionScope" AS ENUM ('SERVICE', 'PRODUCT', 'CATEGORY', 'ORDER');

ALTER TABLE "Customer"
  ADD COLUMN "whatsappConsent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "whatsappConsentAt" TIMESTAMP(3),
  ADD COLUMN "whatsappConsentSource" TEXT,
  ADD COLUMN "whatsappOptedOutAt" TIMESTAMP(3);

ALTER TABLE "Booking"
  ADD COLUMN "whatsappReminderSentAt" TIMESTAMP(3),
  ADD COLUMN "whatsappReminderClaimedAt" TIMESTAMP(3),
  ADD COLUMN "whatsappReminderAttempts" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Product"
  ADD COLUMN "sku" TEXT,
  ADD COLUMN "compareAtPriceCents" INTEGER,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Order"
  ADD COLUMN "subtotalCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "discountCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "promotionId" TEXT,
  ADD COLUMN "promotionCode" TEXT,
  ADD COLUMN "promotionTitle" TEXT;

ALTER TABLE "OrderItem"
  ADD COLUMN "originalPriceCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "discountCents" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Promotion"
  ADD COLUMN "scope" "PromotionScope" NOT NULL DEFAULT 'SERVICE',
  ADD COLUMN "code" TEXT,
  ADD COLUMN "minimumOrderCents" INTEGER,
  ADD COLUMN "maxDiscountCents" INTEGER,
  ADD COLUMN "maxUses" INTEGER,
  ADD COLUMN "usedCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "perCustomerLimit" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "stackable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "categoryId" TEXT;

CREATE TABLE "PromotionProduct" (
  "promotionId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  CONSTRAINT "PromotionProduct_pkey" PRIMARY KEY ("promotionId", "productId")
);

CREATE TABLE "PromotionRedemption" (
  "id" TEXT NOT NULL,
  "promotionId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromotionRedemption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Product_centerId_sku_key" ON "Product"("centerId", "sku");
CREATE INDEX "Product_sku_idx" ON "Product"("sku");
CREATE UNIQUE INDEX "Promotion_centerId_code_key" ON "Promotion"("centerId", "code");
CREATE INDEX "Promotion_centerId_startsAt_endsAt_idx" ON "Promotion"("centerId", "startsAt", "endsAt");
CREATE INDEX "PromotionProduct_productId_idx" ON "PromotionProduct"("productId");
CREATE UNIQUE INDEX "PromotionRedemption_orderId_key" ON "PromotionRedemption"("orderId");
CREATE INDEX "PromotionRedemption_promotionId_customerEmail_idx" ON "PromotionRedemption"("promotionId", "customerEmail");
CREATE INDEX "PromotionRedemption_promotionId_createdAt_idx" ON "PromotionRedemption"("promotionId", "createdAt");

ALTER TABLE "Order" ADD CONSTRAINT "Order_promotionId_fkey"
  FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PromotionProduct" ADD CONSTRAINT "PromotionProduct_promotionId_fkey"
  FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionProduct" ADD CONSTRAINT "PromotionProduct_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_promotionId_fkey"
  FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "WhatsAppDeliveryStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED', 'RECEIVED', 'OPTED_OUT');

CREATE TABLE "WhatsAppDelivery" (
  "id" TEXT NOT NULL,
  "providerMessageId" TEXT NOT NULL,
  "bookingId" TEXT,
  "customerId" TEXT,
  "status" "WhatsAppDeliveryStatus" NOT NULL DEFAULT 'SENT',
  "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WhatsAppDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WhatsAppDelivery_providerMessageId_key" ON "WhatsAppDelivery"("providerMessageId");
CREATE INDEX "WhatsAppDelivery_bookingId_status_idx" ON "WhatsAppDelivery"("bookingId", "status");
CREATE INDEX "WhatsAppDelivery_customerId_status_idx" ON "WhatsAppDelivery"("customerId", "status");
ALTER TABLE "WhatsAppDelivery" ADD CONSTRAINT "WhatsAppDelivery_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WhatsAppDelivery" ADD CONSTRAINT "WhatsAppDelivery_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
