CREATE TABLE "IntegrationOutbox" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processingAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegrationOutbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IntegrationOutbox_status_availableAt_processingAt_idx"
  ON "IntegrationOutbox"("status", "availableAt", "processingAt");
