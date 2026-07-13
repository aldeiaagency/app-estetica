CREATE TYPE "PaymentState" AS ENUM (
  'NOT_REQUIRED',
  'CHECKOUT_PENDING',
  'PAID',
  'CANCELLED',
  'REFUND_PENDING',
  'REFUNDED'
);

CREATE TYPE "PaymentCompensationTarget" AS ENUM ('ORDER', 'BOOKING');

CREATE TYPE "PaymentCompensationStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED'
);

ALTER TABLE "Order"
  ADD COLUMN "checkoutSessionId" TEXT,
  ADD COLUMN "checkoutIdempotencyKey" TEXT,
  ADD COLUMN "paymentState" "PaymentState" NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN "refundedAt" TIMESTAMP(3);

ALTER TABLE "Booking"
  ADD COLUMN "checkoutSessionId" TEXT,
  ADD COLUMN "checkoutIdempotencyKey" TEXT,
  ADD COLUMN "paymentState" "PaymentState" NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN "refundedAt" TIMESTAMP(3);

ALTER TABLE "BonoInstance"
  ADD COLUMN "checkoutSessionId" TEXT;

ALTER TABLE "StripeWebhookEvent"
  ADD COLUMN "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "OrderStockReservation"
  ADD COLUMN "restockedAt" TIMESTAMP(3);

UPDATE "Order"
SET "paymentState" = 'PAID'
WHERE "stripePaymentIntentId" IS NOT NULL
  AND "status" IN ('PAID', 'READY', 'COMPLETED', 'CONFIRMED', 'SHIPPED', 'DELIVERED');

UPDATE "Booking"
SET "paymentState" = 'PAID'
WHERE "depositPaid" = TRUE;

UPDATE "Booking"
SET "paymentState" = 'CHECKOUT_PENDING'
WHERE "status" = 'PENDING'
  AND "depositPaid" = FALSE
  AND "depositCents" > 0;

CREATE UNIQUE INDEX "Order_checkoutSessionId_key" ON "Order"("checkoutSessionId");
CREATE UNIQUE INDEX "Order_checkoutIdempotencyKey_key" ON "Order"("checkoutIdempotencyKey");
CREATE INDEX "Order_paymentState_idx" ON "Order"("paymentState");

CREATE UNIQUE INDEX "Booking_checkoutSessionId_key" ON "Booking"("checkoutSessionId");
CREATE UNIQUE INDEX "Booking_checkoutIdempotencyKey_key" ON "Booking"("checkoutIdempotencyKey");
CREATE INDEX "Booking_paymentState_idx" ON "Booking"("paymentState");

CREATE UNIQUE INDEX "BonoInstance_stripePaymentId_key"
  ON "BonoInstance"("stripePaymentId");
CREATE UNIQUE INDEX "BonoInstance_checkoutSessionId_key"
  ON "BonoInstance"("checkoutSessionId");

CREATE TABLE "PaymentCompensation" (
  "id" TEXT NOT NULL,
  "targetType" "PaymentCompensationTarget" NOT NULL,
  "targetId" TEXT NOT NULL,
  "paymentIntentId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "PaymentCompensationStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "stripeRefundId" TEXT,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "PaymentCompensation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentCompensation_paymentIntentId_key"
  ON "PaymentCompensation"("paymentIntentId");
CREATE UNIQUE INDEX "PaymentCompensation_idempotencyKey_key"
  ON "PaymentCompensation"("idempotencyKey");
CREATE UNIQUE INDEX "PaymentCompensation_stripeRefundId_key"
  ON "PaymentCompensation"("stripeRefundId");
CREATE INDEX "PaymentCompensation_status_updatedAt_idx"
  ON "PaymentCompensation"("status", "updatedAt");
CREATE INDEX "PaymentCompensation_targetType_targetId_idx"
  ON "PaymentCompensation"("targetType", "targetId");

UPDATE "Product" SET "stock" = 0 WHERE "stock" < 0;
UPDATE "BonoInstance" SET "sessionsRemaining" = 0 WHERE "sessionsRemaining" < 0;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_nonnegative_stock_chk"
  CHECK ("stock" IS NULL OR "stock" >= 0);

ALTER TABLE "BonoInstance"
  ADD CONSTRAINT "BonoInstance_nonnegative_sessions_chk"
  CHECK ("sessionsRemaining" >= 0);

ALTER TABLE "OrderStockReservation"
  ADD CONSTRAINT "OrderStockReservation_lifecycle_chk"
  CHECK (
    NOT ("releasedAt" IS NOT NULL AND "consumedAt" IS NOT NULL)
    AND ("restockedAt" IS NULL OR "consumedAt" IS NOT NULL)
  );

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_deposit_payment_state_chk"
  CHECK (
    ("depositPaid" = FALSE OR "paymentState" IN ('PAID', 'REFUND_PENDING', 'REFUNDED'))
    AND ("paymentState" <> 'PAID' OR "depositPaid" = TRUE)
  );

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_online_payment_state_chk"
  CHECK (
    "paymentState" NOT IN ('PAID', 'REFUND_PENDING', 'REFUNDED')
    OR "stripePaymentIntentId" IS NOT NULL
  );

CREATE OR REPLACE FUNCTION app_cancel_expired_booking_holds_before_write()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."staffId" IS NULL
     OR NEW."status" NOT IN ('PENDING'::"BookingStatus", 'CONFIRMED'::"BookingStatus") THEN
    RETURN NEW;
  END IF;

  UPDATE "Booking"
  SET
    "status" = 'CANCELLED',
    "paymentState" = CASE
      WHEN "paymentState" = 'CHECKOUT_PENDING' THEN 'CANCELLED'::"PaymentState"
      ELSE "paymentState"
    END,
    "cancelledAt" = COALESCE("cancelledAt", CURRENT_TIMESTAMP),
    "cancelledBy" = COALESCE("cancelledBy", 'SYSTEM'::"CancelledBy"),
    "updatedAt" = CURRENT_TIMESTAMP,
    "cancellationReason" = COALESCE(
      "cancellationReason",
      'Pago de senal no completado dentro del plazo.'
    )
  WHERE "id" <> NEW."id"
    AND "staffId" = NEW."staffId"
    AND "status" = 'PENDING'
    AND "depositPaid" = FALSE
    AND "depositExpiresAt" <= CURRENT_TIMESTAMP
    AND tsrange("startAt", "endAt", '[)') && tsrange(NEW."startAt", NEW."endAt", '[)');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "Booking_expire_holds_before_write_trg" ON "Booking";
CREATE TRIGGER "Booking_expire_holds_before_write_trg"
BEFORE INSERT OR UPDATE OF "staffId", "startAt", "endAt", "status" ON "Booking"
FOR EACH ROW EXECUTE FUNCTION app_cancel_expired_booking_holds_before_write();

CREATE OR REPLACE FUNCTION app_enforce_order_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD."status" = NEW."status" THEN RETURN NEW; END IF;

  IF (OLD."status" = 'PENDING' AND NEW."status" IN ('PAID', 'CONFIRMED', 'CANCELLED'))
     OR (OLD."status" = 'PAID' AND NEW."status" IN ('READY', 'CANCELLED'))
     OR (OLD."status" = 'READY' AND NEW."status" IN ('COMPLETED', 'CANCELLED'))
     OR (OLD."status" = 'CONFIRMED' AND NEW."status" IN ('COMPLETED', 'CANCELLED'))
     OR (OLD."status" = 'SHIPPED' AND NEW."status" = 'DELIVERED') THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'invalid order status transition: % -> %', OLD."status", NEW."status"
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS "Order_status_transition_trg" ON "Order";
CREATE TRIGGER "Order_status_transition_trg"
BEFORE UPDATE OF "status" ON "Order"
FOR EACH ROW EXECUTE FUNCTION app_enforce_order_status_transition();

CREATE OR REPLACE FUNCTION app_enforce_booking_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD."status" = NEW."status" THEN RETURN NEW; END IF;

  IF NEW."status" = 'CONFIRMED'
     AND COALESCE(NEW."depositCents", 0) > 0
     AND NEW."depositPaid" = FALSE THEN
    RAISE EXCEPTION 'a paid deposit is required before confirmation'
      USING ERRCODE = 'check_violation';
  END IF;

  IF (OLD."status" = 'PENDING' AND NEW."status" IN ('CONFIRMED', 'CANCELLED'))
     OR (OLD."status" = 'CONFIRMED' AND NEW."status" IN ('CANCELLED', 'COMPLETED', 'NO_SHOW')) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'invalid booking status transition: % -> %', OLD."status", NEW."status"
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS "Booking_status_transition_trg" ON "Booking";
CREATE TRIGGER "Booking_status_transition_trg"
BEFORE UPDATE OF "status" ON "Booking"
FOR EACH ROW EXECUTE FUNCTION app_enforce_booking_status_transition();
