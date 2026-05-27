import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { writeAuditLog } from "../utils/audit.helper.js";
import {
  notifyRepaymentRecorded,
  notifyLoanCompleted,
} from "../utils/notification.helper.js";
import { triggerCreditScoreRecalculation } from "../utils/auto-credit-score.helper.js";

import type { Prisma } from "../generated/prisma/client.js";
import type { CreateRepaymentInput } from "../validators/loan.schema.js";

type RequestContext = {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
};

/* ─── Selects ─── */

const safeRepaymentScheduleSelect = {
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

const safeRepaymentSelect = {
  id: true,
  loanId: true,
  repaymentScheduleId: true,
  amountPaid: true,
  paymentMethod: true,
  status: true,
  transactionReference: true,
  paidAt: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  repaymentSchedule: {
    select: {
      id: true,
      dueDate: true,
      expectedAmount: true,
      paidAmount: true,
      status: true,
    },
  },
} satisfies Prisma.RepaymentSelect;

const repaymentWithLoanSelect = {
  ...safeRepaymentSelect,
  loan: {
    select: {
      id: true,
      farmerId: true,
      status: true,
      farmer: {
        select: {
          id: true,
          user: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  },
} satisfies Prisma.RepaymentSelect;

/* ─── Helpers ─── */

const resolveFarmerIdFromUser = async (userId: string) => {
  const farmer = await prisma.farmer.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!farmer) throw new APIError("Farmer profile not found.", 404);
  return farmer.id;
};

/* ─────────────────────────────────────────
   CREATE REPAYMENT
───────────────────────────────────────── */

export const createRepaymentService = async (
  userId: string,
  input: CreateRepaymentInput,
  context: RequestContext = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);

  const loan = await prisma.loan.findUnique({
    where: { id: input.loanId },
    select: { id: true, farmerId: true, status: true },
  });

  if (!loan) throw new APIError("Loan not found", 404);
  if (loan.farmerId !== farmerId) {
    throw new APIError("Not authorized to make payments on this loan", 403);
  }
  if (loan.status !== "ACTIVE") {
    throw new APIError("Repayments can only be made on ACTIVE loans", 400);
  }

  if (input.transactionReference) {
    const existingRef = await prisma.repayment.findUnique({
      where: { transactionReference: input.transactionReference },
      select: { id: true },
    });
    if (existingRef) throw new APIError("Duplicate transaction reference", 409);
  }

  if (input.repaymentScheduleId) {
    const schedule = await prisma.repaymentSchedule.findUnique({
      where: { id: input.repaymentScheduleId },
      select: { id: true, loanId: true, status: true },
    });
    if (!schedule) throw new APIError("Repayment schedule not found", 404);
    if (schedule.loanId !== input.loanId) {
      throw new APIError("Schedule does not belong to this loan", 400);
    }
    if (schedule.status === "PAID" || schedule.status === "CANCELLED") {
      throw new APIError(`Schedule is already ${schedule.status}`, 400);
    }
  }

  const repayment = await prisma.$transaction(async (tx) => {
    const created = await tx.repayment.create({
      data: {
        loanId: input.loanId,
        repaymentScheduleId: input.repaymentScheduleId,
        amountPaid: input.amountPaid,
        paymentMethod: input.paymentMethod,
        transactionReference: input.transactionReference,
        notes: input.notes,
        paidAt: input.paidAt ?? new Date(),
      },
    });

    if (input.repaymentScheduleId) {
      const schedule = await tx.repaymentSchedule.findUnique({
        where: { id: input.repaymentScheduleId },
        select: { paidAmount: true, expectedAmount: true },
      });

      if (schedule) {
        const newPaidAmount = schedule.paidAmount + input.amountPaid;
        const newStatus =
          newPaidAmount >= schedule.expectedAmount ? "PAID" : "PARTIALLY_PAID";
        await tx.repaymentSchedule.update({
          where: { id: input.repaymentScheduleId },
          data: { paidAmount: newPaidAmount, status: newStatus },
        });
      }
    }

    // If all non-cancelled schedules are paid, mark loan COMPLETED
    const unpaidCount = await tx.repaymentSchedule.count({
      where: {
        loanId: input.loanId,
        status: { notIn: ["PAID", "CANCELLED"] },
      },
    });

    const totalSchedules = await tx.repaymentSchedule.count({
      where: { loanId: input.loanId, status: { not: "CANCELLED" } },
    });

    if (totalSchedules > 0 && unpaidCount === 0) {
      await tx.loan.update({
        where: { id: input.loanId },
        data: { status: "COMPLETED" },
      });
      await tx.loanStatusHistory.create({
        data: {
          loanId: input.loanId,
          status: "COMPLETED",
          note: "All repayment schedules have been paid",
        },
      });
    }

    // Re-fetch with updated schedule so response is accurate
    return tx.repayment.findUnique({
      where: { id: created.id },
      select: safeRepaymentSelect,
    });
  });

  if (!repayment) throw new APIError("Failed to create repayment", 500);
  await writeAuditLog({
    actorId: context.actorId ?? userId,
    action: "CREATE",
    resource: "REPAYMENT",
    resourceId: repayment.id,
    description: "Repayment recorded",
    metadata: {
      loanId: input.loanId,
      amountPaid: input.amountPaid,
      paymentMethod: input.paymentMethod,
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  // Notify farmer of repayment recorded
  await notifyRepaymentRecorded(userId, input.loanId, input.amountPaid);

  // Check if loan was just completed and notify
  const updatedLoan = await prisma.loan.findUnique({
    where: { id: input.loanId },
    select: { status: true, farmer: { select: { userId: true } } },
  });
  if (updatedLoan?.status === "COMPLETED" && updatedLoan.farmer?.userId) {
    await notifyLoanCompleted(updatedLoan.farmer.userId, input.loanId);
  }

  // Trigger credit score recalculation — repayment behavior affects score
  await triggerCreditScoreRecalculation(loan.farmerId);

  return repayment;
};

/* ─────────────────────────────────────────
   GET MY REPAYMENTS (FARMER)
───────────────────────────────────────── */

export const getMyRepaymentsService = async (
  userId: string,
  options: { skip?: number; limit?: number; loanId?: string } = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);
  const { skip = 0, limit = 10, loanId } = options;

  const where: Prisma.RepaymentWhereInput = {
    loan: { farmerId },
    ...(loanId && { loanId }),
  };

  const [repayments, total] = await Promise.all([
    prisma.repayment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { paidAt: "desc" },
      select: safeRepaymentSelect,
    }),
    prisma.repayment.count({ where }),
  ]);

  return {
    repayments,
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
   GET ALL REPAYMENTS (ADMIN)
───────────────────────────────────────── */

export const getAllRepaymentsService = async (
  options: { skip?: number; limit?: number; loanId?: string } = {}
) => {
  const { skip = 0, limit = 10, loanId } = options;

  const where: Prisma.RepaymentWhereInput = {
    ...(loanId && { loanId }),
  };

  const [repayments, total] = await Promise.all([
    prisma.repayment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { paidAt: "desc" },
      select: repaymentWithLoanSelect,
    }),
    prisma.repayment.count({ where }),
  ]);

  return {
    repayments,
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
   GET REPAYMENT BY ID
───────────────────────────────────────── */

export const getRepaymentByIdService = async (
  repaymentId: string,
  userId: string,
  isAdmin: boolean
) => {
  const repayment = await prisma.repayment.findUnique({
    where: { id: repaymentId },
    select: repaymentWithLoanSelect,
  });

  if (!repayment) throw new APIError("Repayment not found", 404);

  if (!isAdmin) {
    const farmerId = await resolveFarmerIdFromUser(userId);
    if (repayment.loan.farmerId !== farmerId) {
      throw new APIError("Not authorized to access this repayment", 403);
    }
  }

  return repayment;
};

/* ─────────────────────────────────────────
   GET MY REPAYMENT SCHEDULES (FARMER)
───────────────────────────────────────── */

export const getMyRepaymentSchedulesService = async (
  userId: string,
  options: { skip?: number; limit?: number; loanId?: string } = {}
) => {
  const farmerId = await resolveFarmerIdFromUser(userId);
  const { skip = 0, limit = 10, loanId } = options;

  const where: Prisma.RepaymentScheduleWhereInput = {
    loan: { farmerId },
    ...(loanId && { loanId }),
  };

  const [schedules, total] = await Promise.all([
    prisma.repaymentSchedule.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dueDate: "asc" },
      select: safeRepaymentScheduleSelect,
    }),
    prisma.repaymentSchedule.count({ where }),
  ]);

  return {
    schedules,
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
   GET ALL REPAYMENT SCHEDULES (ADMIN)
───────────────────────────────────────── */

export const getAllRepaymentSchedulesService = async (
  options: { skip?: number; limit?: number; loanId?: string } = {}
) => {
  const { skip = 0, limit = 10, loanId } = options;

  const where: Prisma.RepaymentScheduleWhereInput = {
    ...(loanId && { loanId }),
  };

  const [schedules, total] = await Promise.all([
    prisma.repaymentSchedule.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dueDate: "asc" },
      select: safeRepaymentScheduleSelect,
    }),
    prisma.repaymentSchedule.count({ where }),
  ]);

  return {
    schedules,
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
   GET REPAYMENT SCHEDULE BY ID
───────────────────────────────────────── */

export const getRepaymentScheduleByIdService = async (
  scheduleId: string,
  userId: string,
  isAdmin: boolean
) => {
  const schedule = await prisma.repaymentSchedule.findUnique({
    where: { id: scheduleId },
    select: {
      ...safeRepaymentScheduleSelect,
      loan: { select: { farmerId: true } },
    },
  });

  if (!schedule) throw new APIError("Repayment schedule not found", 404);

  if (!isAdmin) {
    const farmerId = await resolveFarmerIdFromUser(userId);
    if (schedule.loan.farmerId !== farmerId) {
      throw new APIError("Not authorized to access this repayment schedule", 403);
    }
  }

  return schedule;
};
