import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";
import {
  notifyLoanApplicationSubmitted,
  notifyLoanApplicationUnderReview,
  notifyLoanApplicationApproved,
  notifyLoanApplicationRejected,
  notifyLoanApplicationCancelled,
  notifyInstitutionNewApplication,
} from "../utils/notification.helper.js";
import {
  generateLoanApprovedRecommendation,
  generateLoanRejectedRecommendation,
} from "./recommendation.service.js";

import type { Prisma } from "../generated/prisma/client.js";
import type {
  CreateLoanApplicationInput,
  UpdateLoanApplicationStatusInput,
} from "../validators/loan.schema.js";

type RequestContext = {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
};

/* ─── Selects ─── */

const loanApplicationSelect = {
  id: true,
  farmerId: true,
  institutionId: true,
  creditScoreId: true,
  requestedAmount: true,
  recommendedAmount: true,
  approvedAmount: true,
  purpose: true,
  purposeDescription: true,
  status: true,
  reviewedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  loan: { select: { id: true, status: true, disbursedAt: true } },
  creditScore: {
    select: {
      id: true,
      score: true,
      riskLevel: true,
      yieldConsistencyScore: true,
      farmingHistoryScore: true,
      incomeStabilityScore: true,
      repaymentBehaviorScore: true,
      productivityScore: true,
      dataCompletenessScore: true,
      locationVerificationScore: true,
      summary: true,
      generatedAt: true,
    },
  },
  institution: { select: { id: true, name: true, type: true } },
} satisfies Prisma.LoanApplicationSelect;

const loanApplicationWithFarmerSelect = {
  ...loanApplicationSelect,
  farmer: {
    select: {
      id: true,
      user: { select: { id: true, fullName: true, email: true } },
    },
  },
  reviewedBy: { select: { id: true, fullName: true, email: true } },
} satisfies Prisma.LoanApplicationSelect;

/* ─── Helpers ─── */

const resolveFarmerIdFromUser = async (userId: string) => {
  const farmer = await prisma.farmer.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!farmer) {
    throw new APIError(
      "Farmer profile not found. Please create your farmer profile first.",
      404
    );
  }
  return farmer.id;
};

const resolveFarmerUserId = async (farmerId: string): Promise<string | null> => {
  const farmer = await prisma.farmer.findUnique({
    where: { id: farmerId },
    select: { userId: true },
  });
  return farmer?.userId ?? null;
};

const resolveInstitutionIdFromUser = async (userId: string) => {
  const institution = await prisma.institution.findUnique({
    where: { userId },
    select: { id: true, status: true },
  });
  if (!institution) throw new APIError("Institution profile not found.", 404);
  if (institution.status !== "ACTIVE") {
    throw new APIError("Institution must be active before reviewing loan applications.", 403);
  }
  return institution.id;
};

const HIGH_VALUE_LOAN_THRESHOLD_RWF = Number(
  process.env.HIGH_VALUE_LOAN_THRESHOLD_RWF ?? 500_000
);

const assertFarmerLoanReadiness = async (
  farmerId: string,
  requestedAmount: number
) => {
  const [farmCount, verifiedFarmCount] = await Promise.all([
    prisma.farm.count({
      where: {
        farmerId,
        status: { not: "INACTIVE" },
      },
    }),
    prisma.farm.count({
      where: {
        farmerId,
        status: "ACTIVE",
        locationVerificationStatus: "VERIFIED",
      },
    }),
  ]);

  if (farmCount === 0) {
    throw new APIError("At least one farm record is required before applying for agricultural credit.", 400);
  }

  if (
    requestedAmount >= HIGH_VALUE_LOAN_THRESHOLD_RWF &&
    verifiedFarmCount === 0
  ) {
    throw new APIError(
      `Loan requests of ${HIGH_VALUE_LOAN_THRESHOLD_RWF.toLocaleString()} RWF or more require at least one active farm with verified location.`,
      400
    );
  }
};

/* ─────────────────────────────────────────
   CREATE LOAN APPLICATION
───────────────────────────────────────── */

export const createLoanApplicationService = async (
  userId: string,
  input: CreateLoanApplicationInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);
  await assertFarmerLoanReadiness(farmerId, input.requestedAmount);

  if (input.institutionId) {
    const institution = await prisma.institution.findUnique({
      where: { id: input.institutionId },
      select: { id: true, status: true },
    });
    if (!institution) throw new APIError("Institution not found", 404);
    if (institution.status !== "ACTIVE") {
      throw new APIError("Institution is not currently active", 400);
    }
  }

  if (input.creditScoreId) {
    const creditScore = await prisma.creditScore.findUnique({
      where: { id: input.creditScoreId },
      select: { id: true, farmerId: true },
    });
    if (!creditScore) throw new APIError("Credit score not found", 404);
    if (creditScore.farmerId !== farmerId) {
      throw new APIError("Credit score does not belong to this farmer", 403);
    }
  }

  const application = await prisma.loanApplication.create({
    data: {
      farmerId,
      institutionId: input.institutionId,
      creditScoreId: input.creditScoreId,
      requestedAmount: input.requestedAmount,
      purpose: input.purpose,
      purposeDescription: input.purposeDescription,
    },
    select: loanApplicationSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "CREATE",
    resource: "LOAN",
    resourceId: application.id,
    description: "Loan application submitted",
    metadata: { purpose: input.purpose, requestedAmount: input.requestedAmount },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  // Notify farmer
  await notifyLoanApplicationSubmitted(userId, application.id);

  // Notify the institution if the application was directed to one
  if (input.institutionId) {
    const institution = await prisma.institution.findUnique({
      where: { id: input.institutionId },
      select: { userId: true },
    });
    const farmer = await prisma.farmer.findUnique({
      where: { id: application.farmerId },
      select: { user: { select: { fullName: true } } },
    });
    if (institution?.userId) {
      await notifyInstitutionNewApplication(
        institution.userId,
        application.id,
        farmer?.user.fullName ?? "A farmer",
        input.requestedAmount
      );
    }
  }

  return application;
};

/* ─────────────────────────────────────────
   UPDATE LOAN APPLICATION STATUS
───────────────────────────────────────── */

export const updateLoanApplicationStatusService = async (
  applicationId: string,
  userId: string,
  userRole: string,
  input: UpdateLoanApplicationStatusInput,
  context: RequestContext = {}
) => {
  const existing = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      farmerId: true,
      institutionId: true,
      status: true,
      requestedAmount: true,
    },
  });

  if (!existing) throw new APIError("Loan application not found", 404);

  const { status } = input;

  if (userRole === "FARMER") {
    const farmerId = await resolveFarmerIdFromUser(userId);
    if (existing.farmerId !== farmerId) {
      throw new APIError("Not authorized to update this application", 403);
    }
    if (status !== "CANCELLED") {
      throw new APIError("Farmers can only cancel their own applications", 403);
    }
    if (existing.status !== "PENDING") {
      throw new APIError("Only PENDING applications can be cancelled", 400);
    }
  }

  if (userRole === "INSTITUTION") {
    const institutionId = await resolveInstitutionIdFromUser(userId);
    if (existing.institutionId && existing.institutionId !== institutionId) {
      throw new APIError("Not authorized to update this application", 403);
    }
  }

  if (status === "UNDER_REVIEW" && existing.status !== "PENDING") {
    throw new APIError("Only PENDING applications can be moved to UNDER_REVIEW", 400);
  }
  if (status === "APPROVED" && existing.status !== "UNDER_REVIEW") {
    throw new APIError("Only UNDER_REVIEW applications can be approved", 400);
  }
  if (status === "REJECTED") {
    if (existing.status !== "UNDER_REVIEW") {
      throw new APIError("Only UNDER_REVIEW applications can be rejected", 400);
    }
    if (!input.rejectionReason) {
      throw new APIError("Rejection reason is required", 400);
    }
  }

  if (status === "APPROVED") {
    if (existing.institutionId) {
      const institution = await prisma.institution.findUnique({
        where: { id: existing.institutionId },
        select: { id: true, status: true },
      });
      if (!institution || institution.status !== "ACTIVE") {
        throw new APIError("Loan applications can only be approved by an active institution.", 400);
      }
    }

    const approvedAmount =
      input.approvedAmount ?? input.recommendedAmount ?? existing.requestedAmount;
    const interestRate = input.interestRate ?? 0;
    const totalPayable =
      input.totalPayable ?? Math.round(approvedAmount * (1 + interestRate / 100) * 100) / 100;

    const updatedApplication = await prisma.$transaction(async (tx) => {
      const app = await tx.loanApplication.update({
        where: { id: applicationId },
        data: {
          status: "APPROVED",
          approvedAmount,
          recommendedAmount: input.recommendedAmount,
          reviewedById: userId,
          reviewedAt: new Date(),
        },
        select: loanApplicationWithFarmerSelect,
      });

      await tx.loan.create({
        data: {
          loanApplicationId: applicationId,
          farmerId: existing.farmerId,
          institutionId: existing.institutionId,
          principalAmount: approvedAmount,
          interestRate,
          totalPayable,
        },
      });

      // Re-fetch after loan is created so it appears in the response
      return tx.loanApplication.findUnique({
        where: { id: applicationId },
        select: loanApplicationWithFarmerSelect,
      });
    });

    await writeAuditLog({
      actorId: context.actorId ?? userId,
      action: "STATUS_CHANGE",
      resource: "LOAN",
      resourceId: applicationId,
      description: "Loan application approved",
      metadata: { approvedAmount, interestRate, totalPayable },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    // Notify farmer and generate actionable recommendation
    const farmerUserId = await resolveFarmerUserId(existing.farmerId);
    if (farmerUserId) {
      await notifyLoanApplicationApproved(farmerUserId, applicationId, approvedAmount);
    }
    await generateLoanApprovedRecommendation(existing.farmerId, approvedAmount);

    return updatedApplication;
  }

  const updated = await prisma.loanApplication.update({
    where: { id: applicationId },
    data: {
      status,
      rejectionReason: input.rejectionReason,
      reviewedById: userRole !== "FARMER" ? userId : undefined,
      reviewedAt: userRole !== "FARMER" ? new Date() : undefined,
    },
    select: loanApplicationWithFarmerSelect,
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "STATUS_CHANGE",
    resource: "LOAN",
    resourceId: applicationId,
    description: `Loan application status changed to ${status}`,
    metadata: { previousStatus: existing.status, newStatus: status },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  // Send notification based on new status
  const farmerUserId = await resolveFarmerUserId(existing.farmerId);
  if (farmerUserId) {
    if (status === "UNDER_REVIEW") {
      await notifyLoanApplicationUnderReview(farmerUserId, applicationId);
    } else if (status === "REJECTED") {
      await notifyLoanApplicationRejected(farmerUserId, applicationId, input.rejectionReason);
    } else if (status === "CANCELLED") {
      await notifyLoanApplicationCancelled(farmerUserId, applicationId);
    }
  }

  if (status === "REJECTED") {
    await generateLoanRejectedRecommendation(existing.farmerId);
  }

  return updated;
};

/* ─────────────────────────────────────────
   GET MY LOAN APPLICATIONS (FARMER)
───────────────────────────────────────── */

export const getMyLoanApplicationsService = async (
  userId: string,
  options: { skip?: number; limit?: number } = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);
  const { skip = 0, limit = 10 } = options;
  const where: Prisma.LoanApplicationWhereInput = { farmerId };

  const [applications, total] = await Promise.all([
    prisma.loanApplication.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: loanApplicationSelect,
    }),
    prisma.loanApplication.count({ where }),
  ]);

  return {
    applications,
    pagination: {
      total,
      limit,
      skip,
      totalPages: Math.ceil(total / limit),
      currentPage: Math.floor(skip / limit) + 1,
      hasNextPage: skip + limit < total,
      hasPreviousPage: skip > 0,
    },
  };
};

/* ─────────────────────────────────────────
   GET ALL LOAN APPLICATIONS (ADMIN / INSTITUTION)
───────────────────────────────────────── */

export const getAllLoanApplicationsService = async (
  options: {
    skip?: number;
    limit?: number;
    where?: Prisma.LoanApplicationWhereInput;
    institutionUserId?: string;
    minCreditScore?: number;
    maxCreditScore?: number;
    creditRiskLevel?: string;
  } = {}
) => {
  const {
    skip = 0,
    limit = 10,
    where = {},
    institutionUserId,
    minCreditScore,
    maxCreditScore,
    creditRiskLevel,
  } = options;

  let finalWhere: Prisma.LoanApplicationWhereInput = { ...where };

  if (institutionUserId) {
    const institution = await prisma.institution.findUnique({
      where: { userId: institutionUserId },
      select: { id: true },
    });
    if (institution) {
      finalWhere = { ...finalWhere, institutionId: institution.id };
    }
  }

  if (minCreditScore !== undefined || maxCreditScore !== undefined || creditRiskLevel) {
    finalWhere = {
      ...finalWhere,
      creditScore: {
        ...(minCreditScore !== undefined && { score: { gte: minCreditScore } }),
        ...(maxCreditScore !== undefined && { score: { lte: maxCreditScore } }),
        ...(creditRiskLevel && { riskLevel: creditRiskLevel as never }),
      },
    };
  }

  const [applications, total] = await Promise.all([
    prisma.loanApplication.findMany({
      where: finalWhere,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: loanApplicationWithFarmerSelect,
    }),
    prisma.loanApplication.count({ where: finalWhere }),
  ]);

  return {
    applications,
    pagination: {
      total,
      limit,
      skip,
      totalPages: Math.ceil(total / limit),
      currentPage: Math.floor(skip / limit) + 1,
      hasNextPage: skip + limit < total,
      hasPreviousPage: skip > 0,
    },
  };
};

/* ─────────────────────────────────────────
   GET LOAN APPLICATION BY ID
───────────────────────────────────────── */

export const getLoanApplicationByIdService = async (
  applicationId: string,
  userId: string,
  userRole: string
) => {
  const application = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    select: loanApplicationWithFarmerSelect,
  });

  if (!application) throw new APIError("Loan application not found", 404);

  if (userRole === "FARMER") {
    const farmerId = await resolveFarmerIdFromUser(userId);
    if (application.farmerId !== farmerId) {
      throw new APIError("Not authorized to access this application", 403);
    }
  }

  if (userRole === "INSTITUTION") {
    const institutionId = await resolveInstitutionIdFromUser(userId);
    if (application.institutionId && application.institutionId !== institutionId) {
      throw new APIError("Not authorized to access this application", 403);
    }
  }

  return application;
};

/* ─────────────────────────────────────────
   DELETE LOAN APPLICATION (FARMER — PENDING ONLY)
───────────────────────────────────────── */

export const deleteLoanApplicationService = async (
  applicationId: string,
  userId: string,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const application = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    select: { id: true, farmerId: true, status: true },
  });

  if (!application) throw new APIError("Loan application not found", 404);
  if (application.farmerId !== farmerId) {
    throw new APIError("Not authorized to delete this application", 403);
  }
  if (application.status !== "PENDING") {
    throw new APIError("Only PENDING applications can be deleted", 400);
  }

  await prisma.loanApplication.delete({ where: { id: applicationId } });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "DELETE",
    resource: "LOAN",
    resourceId: applicationId,
    description: "Loan application deleted",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return { message: "Loan application deleted successfully." };
};
