ALTER TABLE "Service"
ADD COLUMN "depositRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "depositCents" INTEGER;

ALTER TABLE "Booking"
ADD COLUMN "depositExpiresAt" TIMESTAMP(3);

CREATE INDEX "Booking_status_depositExpiresAt_idx" ON "Booking"("status", "depositExpiresAt");
