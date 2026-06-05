-- CreateEnum
CREATE TYPE "GovernmentPartnerStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'REVOKED');

-- AlterEnum
ALTER TYPE "AuditResource" ADD VALUE 'GOVERNMENT_PARTNER';

-- CreateTable
CREATE TABLE "GovernmentPartner" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "officialEmail" TEXT NOT NULL,
    "mouReference" TEXT,
    "accessPurpose" TEXT NOT NULL,
    "status" "GovernmentPartnerStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernmentPartner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GovernmentPartner_userId_key" ON "GovernmentPartner"("userId");

-- CreateIndex
CREATE INDEX "GovernmentPartner_status_idx" ON "GovernmentPartner"("status");

-- CreateIndex
CREATE INDEX "GovernmentPartner_createdAt_idx" ON "GovernmentPartner"("createdAt");

-- AddForeignKey
ALTER TABLE "GovernmentPartner" ADD CONSTRAINT "GovernmentPartner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
