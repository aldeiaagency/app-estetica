ALTER TABLE "Booking"
  ADD COLUMN "reminderClaimedAt" TIMESTAMP(3),
  ADD COLUMN "reminderAttempts" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "FollowUpMessage"
  ADD COLUMN "processingAt" TIMESTAMP(3),
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastError" TEXT;

CREATE INDEX "Booking_reminderSentAt_reminderClaimedAt_idx"
  ON "Booking"("reminderSentAt", "reminderClaimedAt");

CREATE INDEX "FollowUpMessage_status_scheduledFor_processingAt_idx"
  ON "FollowUpMessage"("status", "scheduledFor", "processingAt");
