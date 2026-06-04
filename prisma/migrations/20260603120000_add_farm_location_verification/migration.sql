-- CreateEnum
CREATE TYPE "FarmLocationSource" AS ENUM (
  'ADDRESS_ONLY',
  'GPS_BROWSER',
  'GPS_DEVICE',
  'MAP_PIN',
  'FIELD_OFFICER',
  'COOPERATIVE_MANAGER',
  'ADMIN'
);

-- CreateEnum
CREATE TYPE "FarmLocationVerificationStatus" AS ENUM (
  'UNVERIFIED',
  'PENDING',
  'VERIFIED',
  'REJECTED'
);

-- AlterEnum
ALTER TYPE "CreditScoreFactorType" ADD VALUE 'LOCATION_VERIFICATION';

-- AlterTable
ALTER TABLE "Farm"
ADD COLUMN "locationSource" "FarmLocationSource" NOT NULL DEFAULT 'ADDRESS_ONLY',
ADD COLUMN "locationAccuracyMeters" DOUBLE PRECISION,
ADD COLUMN "locationCapturedAt" TIMESTAMP(3),
ADD COLUMN "locationVerificationStatus" "FarmLocationVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN "locationVerifiedAt" TIMESTAMP(3),
ADD COLUMN "locationVerifiedById" TEXT,
ADD COLUMN "locationVerificationNote" TEXT;

-- AlterTable
ALTER TABLE "CreditScore"
ADD COLUMN "locationVerificationScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Farm_locationSource_idx" ON "Farm"("locationSource");

-- CreateIndex
CREATE INDEX "Farm_locationVerificationStatus_idx" ON "Farm"("locationVerificationStatus");

-- CreateIndex
CREATE INDEX "Farm_locationVerifiedById_idx" ON "Farm"("locationVerifiedById");

-- AddForeignKey
ALTER TABLE "Farm"
ADD CONSTRAINT "Farm_locationVerifiedById_fkey"
FOREIGN KEY ("locationVerifiedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
