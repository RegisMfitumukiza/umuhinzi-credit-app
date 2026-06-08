/*
  Warnings:

  - You are about to drop the column `purpose` on the `Livestock` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Livestock_purpose_idx";

-- AlterTable
ALTER TABLE "Livestock" DROP COLUMN "purpose",
ADD COLUMN     "purposes" "LivestockPurpose"[];
