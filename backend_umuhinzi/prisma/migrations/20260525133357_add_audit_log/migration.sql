/*
  Warnings:

  - You are about to drop the column `address` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('FARMER_GROWTH', 'PRODUCTIVITY', 'LOAN_ANALYTICS', 'REGIONAL_PERFORMANCE', 'FINANCIAL_INCLUSION', 'REPAYMENT_PERFORMANCE', 'COOPERATIVE_PERFORMANCE');

-- CreateEnum
CREATE TYPE "ReportVisibility" AS ENUM ('ADMIN_ONLY', 'INSTITUTION', 'COOPERATIVE', 'GOVERNMENT_PARTNER', 'PUBLIC_SUMMARY');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_RESET', 'STATUS_CHANGE', 'ROLE_CHANGE', 'FILE_UPLOAD', 'FILE_DELETE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditResource" AS ENUM ('USER', 'FARMER', 'INSTITUTION', 'COOPERATIVE', 'FARM', 'CROP', 'LOAN', 'REPAYMENT', 'CREDIT_SCORE', 'NOTIFICATION', 'AUTH', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CooperativeStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "CooperativeMemberStatus" AS ENUM ('PENDING', 'ACTIVE', 'REMOVED', 'LEFT');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "CreditScoreFactorType" AS ENUM ('YIELD_CONSISTENCY', 'FARMING_HISTORY', 'INCOME_STABILITY', 'REPAYMENT_BEHAVIOR', 'PRODUCTIVITY', 'FARM_SIZE', 'LIVESTOCK_VALUE', 'COOPERATIVE_MEMBERSHIP', 'DATA_COMPLETENESS');

-- CreateEnum
CREATE TYPE "CropType" AS ENUM ('CEREAL', 'LEGUME', 'VEGETABLE', 'FRUIT', 'ROOT_TUBER', 'CASH_CROP', 'OTHER');

-- CreateEnum
CREATE TYPE "CropStatus" AS ENUM ('PLANNED', 'PLANTED', 'GROWING', 'HARVESTED', 'FAILED');

-- CreateEnum
CREATE TYPE "LandUnit" AS ENUM ('HECTARE', 'ACRE', 'SQUARE_METER');

-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('OWNED', 'RENTED', 'FAMILY_LAND', 'COOPERATIVE_LAND', 'GOVERNMENT_ALLOCATED', 'OTHER');

-- CreateEnum
CREATE TYPE "SoilType" AS ENUM ('CLAY', 'SANDY', 'SILT', 'LOAM', 'PEAT', 'CHALKY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "FarmStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "FarmerStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CredibilityStatus" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'TRUSTED');

-- CreateEnum
CREATE TYPE "CashFlowStatus" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('SEED', 'FERTILIZER', 'PESTICIDE', 'HERBICIDE', 'LABOR', 'IRRIGATION', 'TRANSPORT', 'EQUIPMENT', 'STORAGE', 'RENT', 'LOAN_REPAYMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "InputType" AS ENUM ('SEED', 'FERTILIZER', 'PESTICIDE', 'HERBICIDE', 'LABOR', 'IRRIGATION', 'TRANSPORT', 'EQUIPMENT', 'STORAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('SACCO', 'MICROFINANCE', 'BANK', 'NGO', 'GOVERNMENT_PROGRAM', 'OTHER');

-- CreateEnum
CREATE TYPE "InstitutionStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "LivestockType" AS ENUM ('CATTLE', 'GOAT', 'SHEEP', 'PIG', 'CHICKEN', 'DUCK', 'RABBIT', 'FISH', 'BEE', 'OTHER');

-- CreateEnum
CREATE TYPE "LivestockPurpose" AS ENUM ('MILK', 'MEAT', 'EGGS', 'BREEDING', 'FARM_WORK', 'COMMERCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "LivestockStatus" AS ENUM ('ACTIVE', 'SOLD', 'DECEASED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "LoanApplicationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('APPROVED', 'DISBURSED', 'ACTIVE', 'COMPLETED', 'DEFAULTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LoanPurpose" AS ENUM ('SEEDS', 'FERTILIZER', 'EQUIPMENT', 'IRRIGATION', 'LIVESTOCK', 'LAND_RENT', 'LABOR', 'TRANSPORT', 'STORAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LOAN_APPROVAL', 'REPAYMENT_REMINDER', 'CREDIT_SCORE_UPDATE', 'MISSING_DATA_ALERT', 'COOPERATIVE_ANNOUNCEMENT', 'SYSTEM', 'GENERAL');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "YieldQualityGrade" AS ENUM ('EXCELLENT', 'GOOD', 'AVERAGE', 'POOR', 'DAMAGED');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('LOAN_AMOUNT', 'FINANCIAL_IMPROVEMENT', 'REPAYMENT_STRATEGY', 'PRODUCTIVITY', 'RISK_REDUCTION', 'DATA_COMPLETENESS', 'GENERAL_ADVISORY');

-- CreateEnum
CREATE TYPE "RecommendationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('ACTIVE', 'READ', 'ARCHIVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "RepaymentScheduleStatus" AS ENUM ('UPCOMING', 'DUE', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MOBILE_MONEY', 'BANK_TRANSFER', 'CASH', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "RepaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');

-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "address",
DROP COLUMN "username",
ADD COLUMN     "province" TEXT;

-- CreateTable
CREATE TABLE "AnalyticsReport" (
    "id" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "visibility" "ReportVisibility" NOT NULL DEFAULT 'ADMIN_ONLY',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "data" JSONB NOT NULL,
    "generatedById" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "resource" "AuditResource" NOT NULL,
    "resourceId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cooperative" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "description" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "province" TEXT,
    "district" TEXT,
    "sector" TEXT,
    "cell" TEXT,
    "village" TEXT,
    "status" "CooperativeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cooperative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CooperativeManager" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CooperativeManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CooperativeMember" (
    "id" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "status" "CooperativeMemberStatus" NOT NULL DEFAULT 'PENDING',
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CooperativeMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditScore" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "yieldConsistencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "farmingHistoryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "incomeStabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "repaymentBehaviorScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "productivityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dataCompletenessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "summary" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditScoreFactor" (
    "id" TEXT NOT NULL,
    "creditScoreId" TEXT NOT NULL,
    "type" "CreditScoreFactorType" NOT NULL,
    "factorName" TEXT NOT NULL,
    "factorValue" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "contribution" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditScoreFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "creditScoreId" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "reason" TEXT,
    "recommendedAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crop" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "cropName" TEXT NOT NULL,
    "cropType" "CropType" NOT NULL,
    "plantingDate" TIMESTAMP(3) NOT NULL,
    "expectedHarvestDate" TIMESTAMP(3),
    "actualHarvestDate" TIMESTAMP(3),
    "estimatedArea" DOUBLE PRECISION,
    "status" "CropStatus" NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmingSeason" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmingSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "landSize" DOUBLE PRECISION NOT NULL,
    "landUnit" "LandUnit" NOT NULL DEFAULT 'HECTARE',
    "ownershipType" "OwnershipType" NOT NULL DEFAULT 'OWNED',
    "soilType" "SoilType" NOT NULL DEFAULT 'UNKNOWN',
    "status" "FarmStatus" NOT NULL DEFAULT 'ACTIVE',
    "province" TEXT,
    "district" TEXT NOT NULL,
    "sector" TEXT,
    "cell" TEXT,
    "village" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farmer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "farmingExperienceYears" INTEGER DEFAULT 0,
    "primaryCrop" TEXT,
    "credibilityStatus" "CredibilityStatus" NOT NULL DEFAULT 'LOW',
    "status" "FarmerStatus" NOT NULL DEFAULT 'PENDING',
    "cooperativeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farmer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketPrice" (
    "id" TEXT NOT NULL,
    "cropName" TEXT NOT NULL,
    "marketLocation" TEXT NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmExpense" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "cropId" TEXT,
    "type" "ExpenseType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialSummary" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "totalIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashFlowStatus" "CashFlowStatus" NOT NULL DEFAULT 'NEUTRAL',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InputCost" (
    "id" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "type" "InputType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "unitCost" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "dateUsed" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InputCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InstitutionType" NOT NULL,
    "registrationNumber" TEXT,
    "licenseNumber" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "province" TEXT,
    "district" TEXT,
    "sector" TEXT,
    "cell" TEXT,
    "village" TEXT,
    "status" "InstitutionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Livestock" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "type" "LivestockType" NOT NULL,
    "purpose" "LivestockPurpose" NOT NULL DEFAULT 'COMMERCIAL',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "estimatedValue" DOUBLE PRECISION,
    "notes" TEXT,
    "status" "LivestockStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Livestock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanApplication" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "institutionId" TEXT,
    "creditScoreId" TEXT,
    "requestedAmount" DOUBLE PRECISION NOT NULL,
    "recommendedAmount" DOUBLE PRECISION,
    "approvedAmount" DOUBLE PRECISION,
    "purpose" "LoanPurpose" NOT NULL,
    "purposeDescription" TEXT,
    "status" "LoanApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "loanApplicationId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "institutionId" TEXT,
    "principalAmount" DOUBLE PRECISION NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPayable" DOUBLE PRECISION NOT NULL,
    "disbursedAmount" DOUBLE PRECISION,
    "disbursedAt" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "LoanStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanStatusHistory" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "status" "LoanStatus" NOT NULL,
    "changedById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YieldRecord" (
    "id" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "expectedYield" DOUBLE PRECISION,
    "actualYield" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "harvestDate" TIMESTAMP(3) NOT NULL,
    "qualityGrade" "YieldQualityGrade" NOT NULL DEFAULT 'AVERAGE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YieldRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductivityRecord" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "totalExpectedYield" DOUBLE PRECISION,
    "totalActualYield" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "productivityRate" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductivityRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "type" "RecommendationType" NOT NULL,
    "priority" "RecommendationPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RecommendationStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionLabel" TEXT,
    "actionUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepaymentSchedule" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "expectedAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "RepaymentScheduleStatus" NOT NULL DEFAULT 'UPCOMING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepaymentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repayment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "repaymentScheduleId" TEXT,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "RepaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "transactionReference" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsReport_reportType_idx" ON "AnalyticsReport"("reportType");

-- CreateIndex
CREATE INDEX "AnalyticsReport_visibility_idx" ON "AnalyticsReport"("visibility");

-- CreateIndex
CREATE INDEX "AnalyticsReport_generatedById_idx" ON "AnalyticsReport"("generatedById");

-- CreateIndex
CREATE INDEX "AnalyticsReport_generatedAt_idx" ON "AnalyticsReport"("generatedAt");

-- CreateIndex
CREATE INDEX "AnalyticsReport_createdAt_idx" ON "AnalyticsReport"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resource_idx" ON "AuditLog"("resource");

-- CreateIndex
CREATE INDEX "AuditLog_resourceId_idx" ON "AuditLog"("resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Cooperative_registrationNumber_key" ON "Cooperative"("registrationNumber");

-- CreateIndex
CREATE INDEX "Cooperative_status_idx" ON "Cooperative"("status");

-- CreateIndex
CREATE INDEX "Cooperative_district_idx" ON "Cooperative"("district");

-- CreateIndex
CREATE INDEX "Cooperative_sector_idx" ON "Cooperative"("sector");

-- CreateIndex
CREATE INDEX "Cooperative_createdAt_idx" ON "Cooperative"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CooperativeManager_userId_key" ON "CooperativeManager"("userId");

-- CreateIndex
CREATE INDEX "CooperativeManager_cooperativeId_idx" ON "CooperativeManager"("cooperativeId");

-- CreateIndex
CREATE INDEX "CooperativeManager_createdAt_idx" ON "CooperativeManager"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CooperativeMember_farmerId_key" ON "CooperativeMember"("farmerId");

-- CreateIndex
CREATE INDEX "CooperativeMember_cooperativeId_idx" ON "CooperativeMember"("cooperativeId");

-- CreateIndex
CREATE INDEX "CooperativeMember_farmerId_idx" ON "CooperativeMember"("farmerId");

-- CreateIndex
CREATE INDEX "CooperativeMember_status_idx" ON "CooperativeMember"("status");

-- CreateIndex
CREATE INDEX "CreditScore_farmerId_idx" ON "CreditScore"("farmerId");

-- CreateIndex
CREATE INDEX "CreditScore_score_idx" ON "CreditScore"("score");

-- CreateIndex
CREATE INDEX "CreditScore_riskLevel_idx" ON "CreditScore"("riskLevel");

-- CreateIndex
CREATE INDEX "CreditScore_generatedAt_idx" ON "CreditScore"("generatedAt");

-- CreateIndex
CREATE INDEX "CreditScoreFactor_creditScoreId_idx" ON "CreditScoreFactor"("creditScoreId");

-- CreateIndex
CREATE INDEX "CreditScoreFactor_type_idx" ON "CreditScoreFactor"("type");

-- CreateIndex
CREATE UNIQUE INDEX "RiskAssessment_creditScoreId_key" ON "RiskAssessment"("creditScoreId");

-- CreateIndex
CREATE INDEX "RiskAssessment_farmerId_idx" ON "RiskAssessment"("farmerId");

-- CreateIndex
CREATE INDEX "RiskAssessment_riskLevel_idx" ON "RiskAssessment"("riskLevel");

-- CreateIndex
CREATE INDEX "Crop_farmId_idx" ON "Crop"("farmId");

-- CreateIndex
CREATE INDEX "Crop_seasonId_idx" ON "Crop"("seasonId");

-- CreateIndex
CREATE INDEX "Crop_cropName_idx" ON "Crop"("cropName");

-- CreateIndex
CREATE INDEX "Crop_cropType_idx" ON "Crop"("cropType");

-- CreateIndex
CREATE INDEX "Crop_status_idx" ON "Crop"("status");

-- CreateIndex
CREATE INDEX "Crop_plantingDate_idx" ON "Crop"("plantingDate");

-- CreateIndex
CREATE INDEX "FarmingSeason_year_idx" ON "FarmingSeason"("year");

-- CreateIndex
CREATE INDEX "FarmingSeason_startDate_idx" ON "FarmingSeason"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "FarmingSeason_name_year_key" ON "FarmingSeason"("name", "year");

-- CreateIndex
CREATE INDEX "Farm_farmerId_idx" ON "Farm"("farmerId");

-- CreateIndex
CREATE INDEX "Farm_district_idx" ON "Farm"("district");

-- CreateIndex
CREATE INDEX "Farm_sector_idx" ON "Farm"("sector");

-- CreateIndex
CREATE INDEX "Farm_ownershipType_idx" ON "Farm"("ownershipType");

-- CreateIndex
CREATE INDEX "Farm_soilType_idx" ON "Farm"("soilType");

-- CreateIndex
CREATE INDEX "Farm_status_idx" ON "Farm"("status");

-- CreateIndex
CREATE INDEX "Farm_createdAt_idx" ON "Farm"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Farmer_userId_key" ON "Farmer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Farmer_nationalId_key" ON "Farmer"("nationalId");

-- CreateIndex
CREATE INDEX "Farmer_cooperativeId_idx" ON "Farmer"("cooperativeId");

-- CreateIndex
CREATE INDEX "Farmer_credibilityStatus_idx" ON "Farmer"("credibilityStatus");

-- CreateIndex
CREATE INDEX "Farmer_status_idx" ON "Farmer"("status");

-- CreateIndex
CREATE INDEX "Farmer_primaryCrop_idx" ON "Farmer"("primaryCrop");

-- CreateIndex
CREATE INDEX "MarketPrice_cropName_idx" ON "MarketPrice"("cropName");

-- CreateIndex
CREATE INDEX "MarketPrice_marketLocation_idx" ON "MarketPrice"("marketLocation");

-- CreateIndex
CREATE INDEX "MarketPrice_recordedAt_idx" ON "MarketPrice"("recordedAt");

-- CreateIndex
CREATE INDEX "FarmExpense_farmerId_idx" ON "FarmExpense"("farmerId");

-- CreateIndex
CREATE INDEX "FarmExpense_cropId_idx" ON "FarmExpense"("cropId");

-- CreateIndex
CREATE INDEX "FarmExpense_type_idx" ON "FarmExpense"("type");

-- CreateIndex
CREATE INDEX "FarmExpense_expenseDate_idx" ON "FarmExpense"("expenseDate");

-- CreateIndex
CREATE INDEX "FarmExpense_createdAt_idx" ON "FarmExpense"("createdAt");

-- CreateIndex
CREATE INDEX "FinancialSummary_farmerId_idx" ON "FinancialSummary"("farmerId");

-- CreateIndex
CREATE INDEX "FinancialSummary_seasonId_idx" ON "FinancialSummary"("seasonId");

-- CreateIndex
CREATE INDEX "FinancialSummary_cashFlowStatus_idx" ON "FinancialSummary"("cashFlowStatus");

-- CreateIndex
CREATE INDEX "FinancialSummary_createdAt_idx" ON "FinancialSummary"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialSummary_farmerId_seasonId_key" ON "FinancialSummary"("farmerId", "seasonId");

-- CreateIndex
CREATE INDEX "InputCost_cropId_idx" ON "InputCost"("cropId");

-- CreateIndex
CREATE INDEX "InputCost_type_idx" ON "InputCost"("type");

-- CreateIndex
CREATE INDEX "InputCost_dateUsed_idx" ON "InputCost"("dateUsed");

-- CreateIndex
CREATE INDEX "InputCost_createdAt_idx" ON "InputCost"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_userId_key" ON "Institution"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_registrationNumber_key" ON "Institution"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_licenseNumber_key" ON "Institution"("licenseNumber");

-- CreateIndex
CREATE INDEX "Institution_type_idx" ON "Institution"("type");

-- CreateIndex
CREATE INDEX "Institution_status_idx" ON "Institution"("status");

-- CreateIndex
CREATE INDEX "Institution_district_idx" ON "Institution"("district");

-- CreateIndex
CREATE INDEX "Institution_sector_idx" ON "Institution"("sector");

-- CreateIndex
CREATE INDEX "Institution_createdAt_idx" ON "Institution"("createdAt");

-- CreateIndex
CREATE INDEX "Livestock_farmerId_idx" ON "Livestock"("farmerId");

-- CreateIndex
CREATE INDEX "Livestock_type_idx" ON "Livestock"("type");

-- CreateIndex
CREATE INDEX "Livestock_purpose_idx" ON "Livestock"("purpose");

-- CreateIndex
CREATE INDEX "Livestock_status_idx" ON "Livestock"("status");

-- CreateIndex
CREATE INDEX "LoanApplication_farmerId_idx" ON "LoanApplication"("farmerId");

-- CreateIndex
CREATE INDEX "LoanApplication_institutionId_idx" ON "LoanApplication"("institutionId");

-- CreateIndex
CREATE INDEX "LoanApplication_creditScoreId_idx" ON "LoanApplication"("creditScoreId");

-- CreateIndex
CREATE INDEX "LoanApplication_reviewedById_idx" ON "LoanApplication"("reviewedById");

-- CreateIndex
CREATE INDEX "LoanApplication_status_idx" ON "LoanApplication"("status");

-- CreateIndex
CREATE INDEX "LoanApplication_purpose_idx" ON "LoanApplication"("purpose");

-- CreateIndex
CREATE INDEX "LoanApplication_createdAt_idx" ON "LoanApplication"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Loan_loanApplicationId_key" ON "Loan"("loanApplicationId");

-- CreateIndex
CREATE INDEX "Loan_farmerId_idx" ON "Loan"("farmerId");

-- CreateIndex
CREATE INDEX "Loan_institutionId_idx" ON "Loan"("institutionId");

-- CreateIndex
CREATE INDEX "Loan_status_idx" ON "Loan"("status");

-- CreateIndex
CREATE INDEX "Loan_disbursedAt_idx" ON "Loan"("disbursedAt");

-- CreateIndex
CREATE INDEX "Loan_createdAt_idx" ON "Loan"("createdAt");

-- CreateIndex
CREATE INDEX "LoanStatusHistory_loanId_idx" ON "LoanStatusHistory"("loanId");

-- CreateIndex
CREATE INDEX "LoanStatusHistory_changedById_idx" ON "LoanStatusHistory"("changedById");

-- CreateIndex
CREATE INDEX "LoanStatusHistory_status_idx" ON "LoanStatusHistory"("status");

-- CreateIndex
CREATE INDEX "LoanStatusHistory_createdAt_idx" ON "LoanStatusHistory"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_priority_idx" ON "Notification"("priority");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "YieldRecord_cropId_idx" ON "YieldRecord"("cropId");

-- CreateIndex
CREATE INDEX "YieldRecord_harvestDate_idx" ON "YieldRecord"("harvestDate");

-- CreateIndex
CREATE INDEX "YieldRecord_qualityGrade_idx" ON "YieldRecord"("qualityGrade");

-- CreateIndex
CREATE INDEX "YieldRecord_createdAt_idx" ON "YieldRecord"("createdAt");

-- CreateIndex
CREATE INDEX "ProductivityRecord_farmerId_idx" ON "ProductivityRecord"("farmerId");

-- CreateIndex
CREATE INDEX "ProductivityRecord_seasonId_idx" ON "ProductivityRecord"("seasonId");

-- CreateIndex
CREATE INDEX "ProductivityRecord_productivityRate_idx" ON "ProductivityRecord"("productivityRate");

-- CreateIndex
CREATE INDEX "ProductivityRecord_createdAt_idx" ON "ProductivityRecord"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductivityRecord_farmerId_seasonId_key" ON "ProductivityRecord"("farmerId", "seasonId");

-- CreateIndex
CREATE INDEX "Recommendation_farmerId_idx" ON "Recommendation"("farmerId");

-- CreateIndex
CREATE INDEX "Recommendation_type_idx" ON "Recommendation"("type");

-- CreateIndex
CREATE INDEX "Recommendation_priority_idx" ON "Recommendation"("priority");

-- CreateIndex
CREATE INDEX "Recommendation_status_idx" ON "Recommendation"("status");

-- CreateIndex
CREATE INDEX "Recommendation_isRead_idx" ON "Recommendation"("isRead");

-- CreateIndex
CREATE INDEX "Recommendation_createdAt_idx" ON "Recommendation"("createdAt");

-- CreateIndex
CREATE INDEX "RepaymentSchedule_loanId_idx" ON "RepaymentSchedule"("loanId");

-- CreateIndex
CREATE INDEX "RepaymentSchedule_dueDate_idx" ON "RepaymentSchedule"("dueDate");

-- CreateIndex
CREATE INDEX "RepaymentSchedule_status_idx" ON "RepaymentSchedule"("status");

-- CreateIndex
CREATE INDEX "RepaymentSchedule_createdAt_idx" ON "RepaymentSchedule"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Repayment_transactionReference_key" ON "Repayment"("transactionReference");

-- CreateIndex
CREATE INDEX "Repayment_loanId_idx" ON "Repayment"("loanId");

-- CreateIndex
CREATE INDEX "Repayment_repaymentScheduleId_idx" ON "Repayment"("repaymentScheduleId");

-- CreateIndex
CREATE INDEX "Repayment_paymentMethod_idx" ON "Repayment"("paymentMethod");

-- CreateIndex
CREATE INDEX "Repayment_status_idx" ON "Repayment"("status");

-- CreateIndex
CREATE INDEX "Repayment_paidAt_idx" ON "Repayment"("paidAt");

-- CreateIndex
CREATE INDEX "User_sector_idx" ON "User"("sector");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- AddForeignKey
ALTER TABLE "AnalyticsReport" ADD CONSTRAINT "AnalyticsReport_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CooperativeManager" ADD CONSTRAINT "CooperativeManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CooperativeManager" ADD CONSTRAINT "CooperativeManager_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CooperativeMember" ADD CONSTRAINT "CooperativeMember_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CooperativeMember" ADD CONSTRAINT "CooperativeMember_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditScore" ADD CONSTRAINT "CreditScore_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditScoreFactor" ADD CONSTRAINT "CreditScoreFactor_creditScoreId_fkey" FOREIGN KEY ("creditScoreId") REFERENCES "CreditScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_creditScoreId_fkey" FOREIGN KEY ("creditScoreId") REFERENCES "CreditScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crop" ADD CONSTRAINT "Crop_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crop" ADD CONSTRAINT "Crop_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "FarmingSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmExpense" ADD CONSTRAINT "FarmExpense_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmExpense" ADD CONSTRAINT "FarmExpense_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialSummary" ADD CONSTRAINT "FinancialSummary_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialSummary" ADD CONSTRAINT "FinancialSummary_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "FarmingSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InputCost" ADD CONSTRAINT "InputCost_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Institution" ADD CONSTRAINT "Institution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Livestock" ADD CONSTRAINT "Livestock_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_creditScoreId_fkey" FOREIGN KEY ("creditScoreId") REFERENCES "CreditScore"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_loanApplicationId_fkey" FOREIGN KEY ("loanApplicationId") REFERENCES "LoanApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanStatusHistory" ADD CONSTRAINT "LoanStatusHistory_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanStatusHistory" ADD CONSTRAINT "LoanStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YieldRecord" ADD CONSTRAINT "YieldRecord_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductivityRecord" ADD CONSTRAINT "ProductivityRecord_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductivityRecord" ADD CONSTRAINT "ProductivityRecord_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "FarmingSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepaymentSchedule" ADD CONSTRAINT "RepaymentSchedule_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repayment" ADD CONSTRAINT "Repayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repayment" ADD CONSTRAINT "Repayment_repaymentScheduleId_fkey" FOREIGN KEY ("repaymentScheduleId") REFERENCES "RepaymentSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
