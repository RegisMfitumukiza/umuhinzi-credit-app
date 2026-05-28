import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";
import {
  notifyLoanDisbursed,
  notifyLoanCompleted,
} from "../utils/notification.helper.js";

import type { Prisma } from "../generated/prisma/client.js";
import type { DisburseLoanInput, UpdateLoanStatusInput } from "../validators/loan.schema.js";

type RequestContext = {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
};

/* ─── Selects ─── */

const repaymentScheduleSelect = {
  id: true,
  loanId: true,
  dueDate: true,
  expectedAmount: true,
  paidAmount: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.RepaymentScheduleSelect;

const safeLoanSelect = {
  id: true,
  loanApplicationId: true,
  farmerId: true,
  institutionId: true,
  principalAmount: true,
  interestRate: true,
  totalPayable: true,
  disbursedAmount: true,
  disbursedAt: true,
  startDate: true,
  endDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  institution: { select: { id: true, name: true, type: true } },
  repaymentSchedules: {
    select: repaymentScheduleSelect,
    orderBy: { dueDate: "asc" as const },
  },
} satisfies Prisma.LoanSelect;

const loanWithFarmerSelect = {
  ...safeLoanSelect,
  farmer: {
    select: {
      id: true,
      user: { select: { id: true, fullName: true, email: true } },
    },
  },
} satisfies Prisma.LoanSelect;

/* ─── Helpers ─── */

const resolveFarmerIdFromUser = async (userId: string) => {
  const farmer = await prisma.farmer.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!farmer) throw new APIError("Farmer profile not found.", 404);
  return farmer.id;
};

const resolveInstitutionIdFromUser = async (userId: string) => {
  const institution = await prisma.institution.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!institution) throw new APIError("Institution profile not found.", 404);
  return institution.id;
};

const addMonths = (date: Date, months: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

/* ─────────────────────────────────────────
   DISBURSE LOAN
───────────────────────────────────────── */

export const disburseLoanService = async (
  loanId: string,
  userId: string,
  userRole: string,
  input: DisburseLoanInput,
  context: RequestContext = {}
) => {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    select: { id: true, farmerId: true, institutionId: true, status: true, totalPayable: true },
  });

  if (!loan) throw new APIError("Loan not found", 404);
  if (loan.status !== "APPROVED") {
    throw new APIError("Only APPROVED loans can be disbursed", 400);
  }

  if (userRole === "INSTITUTION") {
    const institutionId = await resolveInstitutionIdFromUser(userId);
    if (loan.institutionId && loan.institutionId !== institutionId) {
      throw new APIError("Not authorized to disburse this loan", 403);
    }
  }

  const { disbursedAmount, startDate, durationMonths } = input;
  const endDate = addMonths(startDate, durationMonths);
  const monthlyPayment =
    Math.round((loan.totalPayable / durationMonths) * 100) / 100;

  const scheduleData: Prisma.RepaymentScheduleCreateManyInput[] = Array.from(
    { length: durationMonths },
    (_, i) => ({
      loanId,
      dueDate: addMonths(startDate, i + 1),
      expectedAmount: monthlyPayment,
    })
  );

  const updatedLoan = await prisma.$transaction(async (tx) => {
    await tx.loan.update({
      where: { id: loanId },
      data: {
        disbursedAmount,
        disbursedAt: new Date(),
        startDate,
        endDate,
        status: "ACTIVE",
      },
    });

    await tx.loanStatusHistory.create({
      data: {
        loanId,
        status: "ACTIVE",
        changedById: userId,
        note: `Loan disbursed. Amount: ${disbursedAmount}. Term: ${durationMonths} months.`,
      },
    });

    await tx.repaymentSchedule.createMany({ data: scheduleData });

    // Re-fetch after schedules are created so they appear in the response
    return tx.loan.findUnique({
      where: { id: loanId },
      select: loanWithFarmerSelect,
    });
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "STATUS_CHANGE",
    resource: "LOAN",
    resourceId: loanId,
    description: "Loan disbursed and activated",
    metadata: { disbursedAmount, startDate, endDate, durationMonths },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  // Notify farmer
  const farmer = await prisma.farmer.findUnique({
    where: { id: loan.farmerId },
    select: { userId: true },
  });
  if (farmer?.userId) {
    await notifyLoanDisbursed(farmer.userId, loanId, disbursedAmount);
  }

  return updatedLoan;
};

/* ─────────────────────────────────────────
   UPDATE LOAN STATUS (ADMIN)
───────────────────────────────────────── */

export const updateLoanStatusService = async (
  loanId: string,
  userId: string,
  input: UpdateLoanStatusInput,
  context: RequestContext = {}
) => {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    select: { id: true, status: true },
  });

  if (!loan) throw new APIError("Loan not found", 404);

  const validFromStatuses: Record<string, string[]> = {
    ACTIVE: ["APPROVED", "DISBURSED"],
    COMPLETED: ["ACTIVE"],
    DEFAULTED: ["ACTIVE"],
    CANCELLED: ["APPROVED", "DISBURSED", "ACTIVE"],
  };

  const allowed = validFromStatuses[input.status] ?? [];
  if (!allowed.includes(loan.status)) {
    throw new APIError(
      `Cannot transition loan from ${loan.status} to ${input.status}`,
      400
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.loan.update({
      where: { id: loanId },
      data: { status: input.status },
      select: loanWithFarmerSelect,
    });

    await tx.loanStatusHistory.create({
      data: {
        loanId,
        status: input.status,
        changedById: userId,
        note: input.note,
      },
    });

    return result;
  });

  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "STATUS_CHANGE",
    resource: "LOAN",
    resourceId: loanId,
    description: `Loan status changed to ${input.status}`,
    metadata: { previousStatus: loan.status, newStatus: input.status },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  // Notify farmer when loan is completed
  if (input.status === "COMPLETED") {
    const loanRecord = await prisma.loan.findUnique({
      where: { id: loanId },
      select: { farmer: { select: { userId: true } } },
    });
    if (loanRecord?.farmer?.userId) {
      await notifyLoanCompleted(loanRecord.farmer.userId, loanId);
    }
  }

  return updated;
};

/* ─────────────────────────────────────────
   GET MY LOANS (FARMER)
───────────────────────────────────────── */

export const getMyLoansService = async (
  userId: string,
  options: { skip?: number; limit?: number } = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);
  const { skip = 0, limit = 10 } = options;
  const where: Prisma.LoanWhereInput = { farmerId };

  const [loans, total] = await Promise.all([
    prisma.loan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: safeLoanSelect,
    }),
    prisma.loan.count({ where }),
  ]);

  return {
    loans,
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
   GET ALL LOANS (ADMIN / INSTITUTION)
───────────────────────────────────────── */

export const getAllLoansService = async (
  options: {
    skip?: number;
    limit?: number;
    where?: Prisma.LoanWhereInput;
    institutionUserId?: string;
  } = {}
) => {
  const { skip = 0, limit = 10, where = {}, institutionUserId } = options;

  let finalWhere = where;
  if (institutionUserId) {
    const institution = await prisma.institution.findUnique({
      where: { userId: institutionUserId },
      select: { id: true },
    });
    if (institution) {
      finalWhere = { ...where, institutionId: institution.id };
    }
  }

  const [loans, total] = await Promise.all([
    prisma.loan.findMany({
      where: finalWhere,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: loanWithFarmerSelect,
    }),
    prisma.loan.count({ where: finalWhere }),
  ]);

  return {
    loans,
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
   GET LOAN BY ID
───────────────────────────────────────── */

export const getLoanByIdService = async (
  loanId: string,
  userId: string,
  userRole: string
) => {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    select: loanWithFarmerSelect,
  });

  if (!loan) throw new APIError("Loan not found", 404);

  if (userRole === "FARMER") {
    const farmerId = await resolveFarmerIdFromUser(userId);
    if (loan.farmerId !== farmerId) {
      throw new APIError("Not authorized to access this loan", 403);
    }
  }

  if (userRole === "INSTITUTION") {
    const institutionId = await resolveInstitutionIdFromUser(userId);
    if (loan.institutionId && loan.institutionId !== institutionId) {
      throw new APIError("Not authorized to access this loan", 403);
    }
  }

  return loan;
};
