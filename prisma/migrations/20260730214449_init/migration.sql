-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'RESPONDED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ResponseAnswer" AS ENUM ('ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('COFFEE_CHAT', 'WALK_AND_COFFEE', 'SPORTS', 'BREAKFAST', 'GALLERY', 'SURPRISE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('TELEGRAM', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "inviteeName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "answer" "ResponseAnswer" NOT NULL,
    "activityType" "ActivityType",
    "customActivity" TEXT,
    "note" TEXT,
    "noClickCount" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT NOT NULL,
    "secureEditTokenHash" TEXT,
    "inviteePhoneEncrypted" TEXT,
    "inviteePhoneLast4" TEXT,
    "phoneConsentAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityChoice" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "localDate" TEXT NOT NULL,
    "localTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tehran',
    "datetimeUtc" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationAttempt" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinalPlan" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "finalDatetimeUtc" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tehran',
    "locationNote" TEXT,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinalPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminIdentifier" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_slug_key" ON "Invitation"("slug");

-- CreateIndex
CREATE INDEX "Invitation_status_idx" ON "Invitation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Response_idempotencyKey_key" ON "Response"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Response_invitationId_idx" ON "Response"("invitationId");

-- CreateIndex
CREATE INDEX "Response_answer_idx" ON "Response"("answer");

-- CreateIndex
CREATE INDEX "Response_submittedAt_idx" ON "Response"("submittedAt");

-- CreateIndex
CREATE INDEX "AvailabilityChoice_responseId_idx" ON "AvailabilityChoice"("responseId");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityChoice_responseId_rank_key" ON "AvailabilityChoice"("responseId", "rank");

-- CreateIndex
CREATE INDEX "NotificationAttempt_responseId_idx" ON "NotificationAttempt"("responseId");

-- CreateIndex
CREATE INDEX "NotificationAttempt_status_idx" ON "NotificationAttempt"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FinalPlan_responseId_key" ON "FinalPlan"("responseId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityChoice" ADD CONSTRAINT "AvailabilityChoice_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationAttempt" ADD CONSTRAINT "NotificationAttempt_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalPlan" ADD CONSTRAINT "FinalPlan_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response"("id") ON DELETE CASCADE ON UPDATE CASCADE;
