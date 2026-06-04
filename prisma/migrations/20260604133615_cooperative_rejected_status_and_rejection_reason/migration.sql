/*
  Warnings:

  - Made the column `registrationNumber` on table `Cooperative` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "CooperativeStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "Cooperative" ADD COLUMN     "rejectionReason" TEXT,
ALTER COLUMN "registrationNumber" SET NOT NULL;
