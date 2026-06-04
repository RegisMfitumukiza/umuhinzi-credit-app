CREATE TYPE "YieldVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

CREATE TYPE "YieldVerificationMethod" AS ENUM ('FIELD_VISIT', 'COOPERATIVE_COLLECTION_RECORD');

ALTER TABLE "YieldRecord"
ADD COLUMN "verificationStatus" "YieldVerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "verificationMethod" "YieldVerificationMethod",
ADD COLUMN "evidenceReference" TEXT,
ADD COLUMN "verifiedActualYield" DOUBLE PRECISION,
ADD COLUMN "verifiedUnit" TEXT,
ADD COLUMN "verificationNote" TEXT,
ADD COLUMN "verificationRiskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "verificationRiskNote" TEXT,
ADD COLUMN "verifiedAt" TIMESTAMP(3),
ADD COLUMN "verifiedById" TEXT;

CREATE INDEX "YieldRecord_verificationStatus_idx" ON "YieldRecord"("verificationStatus");
CREATE INDEX "YieldRecord_verificationMethod_idx" ON "YieldRecord"("verificationMethod");
CREATE INDEX "YieldRecord_verifiedById_idx" ON "YieldRecord"("verifiedById");

ALTER TABLE "YieldRecord"
ADD CONSTRAINT "YieldRecord_verifiedById_fkey"
FOREIGN KEY ("verifiedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
