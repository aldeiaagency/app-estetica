-- CreateEnum
CREATE TYPE "FollowUpTemplateCategory" AS ENUM ('GENERIC', 'MANICURE', 'FACIAL', 'COLORATION', 'BROWS_LASHES', 'WELLNESS');

-- CreateEnum
CREATE TYPE "CommunicationPurpose" AS ENUM ('TRANSACTIONAL', 'FOLLOW_UP', 'MARKETING');

-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "FollowUpMessageStatus" AS ENUM ('SCHEDULED', 'READY', 'SENT', 'DISMISSED', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "FollowUpTemplate" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "FollowUpTemplateCategory" NOT NULL DEFAULT 'GENERIC',
    "purpose" "CommunicationPurpose" NOT NULL DEFAULT 'FOLLOW_UP',
    "channel" "CommunicationChannel" NOT NULL DEFAULT 'EMAIL',
    "serviceKeyword" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sendAfterDays" INTEGER NOT NULL DEFAULT 14,
    "consentRequired" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUpTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpMessage" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bookingId" TEXT,
    "templateId" TEXT,
    "channel" "CommunicationChannel" NOT NULL,
    "purpose" "CommunicationPurpose" NOT NULL,
    "status" "FollowUpMessageStatus" NOT NULL DEFAULT 'SCHEDULED',
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUpMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FollowUpTemplate_centerId_active_idx" ON "FollowUpTemplate"("centerId", "active");

-- CreateIndex
CREATE INDEX "FollowUpTemplate_category_active_idx" ON "FollowUpTemplate"("category", "active");

-- CreateIndex
CREATE UNIQUE INDEX "FollowUpMessage_bookingId_templateId_key" ON "FollowUpMessage"("bookingId", "templateId");

-- CreateIndex
CREATE INDEX "FollowUpMessage_centerId_status_scheduledFor_idx" ON "FollowUpMessage"("centerId", "status", "scheduledFor");

-- CreateIndex
CREATE INDEX "FollowUpMessage_customerId_status_idx" ON "FollowUpMessage"("customerId", "status");

-- CreateIndex
CREATE INDEX "FollowUpMessage_purpose_status_idx" ON "FollowUpMessage"("purpose", "status");

-- AddForeignKey
ALTER TABLE "FollowUpTemplate" ADD CONSTRAINT "FollowUpTemplate_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpMessage" ADD CONSTRAINT "FollowUpMessage_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpMessage" ADD CONSTRAINT "FollowUpMessage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpMessage" ADD CONSTRAINT "FollowUpMessage_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpMessage" ADD CONSTRAINT "FollowUpMessage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FollowUpTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
