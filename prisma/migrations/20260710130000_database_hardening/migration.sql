ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_valid_interval_chk" CHECK ("endAt" > "startAt") NOT VALID,
  ADD CONSTRAINT "Booking_nonnegative_deposit_chk" CHECK ("depositCents" IS NULL OR "depositCents" >= 0) NOT VALID;

ALTER TABLE "ManualBlock"
  ADD CONSTRAINT "ManualBlock_valid_interval_chk" CHECK ("endAt" > "startAt") NOT VALID;

ALTER TABLE "Service"
  ADD CONSTRAINT "Service_positive_duration_chk" CHECK ("durationMinutes" > 0) NOT VALID,
  ADD CONSTRAINT "Service_nonnegative_price_chk" CHECK ("priceCents" >= 0) NOT VALID,
  ADD CONSTRAINT "Service_valid_deposit_chk" CHECK (
    "depositCents" IS NULL OR ("depositCents" >= 0 AND "depositCents" <= "priceCents")
  ) NOT VALID,
  ADD CONSTRAINT "Service_nonnegative_buffers_chk" CHECK (
    "bufferMinutesBefore" >= 0 AND "bufferMinutesAfter" >= 0
  ) NOT VALID;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_nonnegative_total_chk" CHECK ("totalCents" >= 0) NOT VALID;

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_positive_quantity_chk" CHECK ("quantity" > 0) NOT VALID,
  ADD CONSTRAINT "OrderItem_nonnegative_price_chk" CHECK ("priceCents" >= 0) NOT VALID;

ALTER TABLE "ScheduleRule"
  ADD CONSTRAINT "ScheduleRule_valid_day_chk" CHECK ("dayOfWeek" BETWEEN 0 AND 6) NOT VALID,
  ADD CONSTRAINT "ScheduleRule_owner_chk" CHECK (
    ("centerId" IS NOT NULL AND "staffId" IS NULL)
    OR ("centerId" IS NULL AND "staffId" IS NOT NULL)
  ) NOT VALID;

CREATE INDEX IF NOT EXISTS "Booking_staff_status_interval_idx"
  ON "Booking" ("staffId", "status", "startAt", "endAt");
CREATE INDEX IF NOT EXISTS "Booking_center_createdAt_idx"
  ON "Booking" ("centerId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx"
  ON "Order" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_center_createdAt_idx"
  ON "Order" ("centerId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ServiceStaff_staffId_serviceId_idx"
  ON "ServiceStaff" ("staffId", "serviceId");
CREATE INDEX IF NOT EXISTS "VerificationToken_expires_idx"
  ON "VerificationToken" ("expires");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx"
  ON "AuditLog" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Customer_center_createdAt_idx"
  ON "Customer" ("centerId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "WaitlistEntry_requestedDate_status_idx"
  ON "WaitlistEntry" ("requestedDate", "status");
