CREATE TABLE "DataRetentionRun" (
  "id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "summary" JSONB NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "error" TEXT,
  CONSTRAINT "DataRetentionRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DataRetentionRun_startedAt_idx" ON "DataRetentionRun"("startedAt");
