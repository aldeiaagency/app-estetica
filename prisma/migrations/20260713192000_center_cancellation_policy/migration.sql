ALTER TABLE "Center" ADD COLUMN "cancellationNoticeHours" INTEGER NOT NULL DEFAULT 24;
ALTER TABLE "Center" ADD CONSTRAINT "Center_cancellationNoticeHours_check" CHECK ("cancellationNoticeHours" BETWEEN 0 AND 168);
