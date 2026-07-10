CREATE TABLE IF NOT EXISTS "StripeWebhookEvent" (
  "id" TEXT PRIMARY KEY,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PROCESSING',
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "StripeWebhookEvent_status_createdAt_idx"
  ON "StripeWebhookEvent" ("status", "createdAt");

CREATE TABLE IF NOT EXISTS "OrderStockReservation" (
  "orderId" TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "releasedAt" TIMESTAMP(3),
  "consumedAt" TIMESTAMP(3),
  "releaseReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderStockReservation_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "OrderStockReservation_expiration_idx"
  ON "OrderStockReservation" ("expiresAt")
  WHERE "releasedAt" IS NULL AND "consumedAt" IS NULL;
