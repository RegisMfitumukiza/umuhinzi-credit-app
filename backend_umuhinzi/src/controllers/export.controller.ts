import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { sendCSV } from "../utils/csv.helper.js";
import { prisma } from "../lib/prisma.js";
import { Role } from "../generated/prisma/client.js";

/* ─── Helpers ─── */

const resolveInstitutionId = async (userId: string): Promise<string | null> => {
  const inst = await prisma.institution.findUnique({
    where: { userId },
    select: { id: true },
  });
  return inst?.id ?? null;
};

/* ─────────────────────────────────────────
   EXPORT LOANS
───────────────────────────────────────── */

export const exportLoans = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const where: Record<string, unknown> = {};

  if (req.user.role === Role.INSTITUTION) {
    const institutionId = await resolveInstitutionId(req.user.id);
    if (institutionId) where.institutionId = institutionId;
  }

  if (req.query.status) where.status = String(req.query.status);
  if (req.query.farmerId) where.farmerId = String(req.query.farmerId);

  const loans = await prisma.loan.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000, // cap at 5000 rows
    select: {
      id: true,
      principalAmount: true,
      interestRate: true,
      totalPayable: true,
      disbursedAmount: true,
      disbursedAt: true,
      startDate: true,
      endDate: true,
      status: true,
      createdAt: true,
      farmer: { select: { user: { select: { fullName: true, email: true, province: true, district: true } } } },
      institution: { select: { name: true, type: true } },
    },
  });

  const rows = loans.map((l) => ({
    id: l.id,
    farmerName: l.farmer.user.fullName,
    farmerEmail: l.farmer.user.email,
    province: l.farmer.user.province ?? "",
    district: l.farmer.user.district ?? "",
    institution: l.institution?.name ?? "",
    institutionType: l.institution?.type ?? "",
    principalAmount: l.principalAmount,
    interestRate: l.interestRate,
    totalPayable: l.totalPayable,
    disbursedAmount: l.disbursedAmount ?? "",
    disbursedAt: l.disbursedAt?.toISOString() ?? "",
    startDate: l.startDate?.toISOString() ?? "",
    endDate: l.endDate?.toISOString() ?? "",
    status: l.status,
    createdAt: l.createdAt.toISOString(),
  }));

  sendCSV(res, `loans-export-${Date.now()}.csv`, rows);
});

/* ─────────────────────────────────────────
   EXPORT REPAYMENTS
───────────────────────────────────────── */

export const exportRepayments = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const where: Record<string, unknown> = {};
  if (req.query.loanId) where.loanId = String(req.query.loanId);

  if (req.user.role === Role.INSTITUTION) {
    const institutionId = await resolveInstitutionId(req.user.id);
    if (institutionId) where.loan = { institutionId };
  }

  const repayments = await prisma.repayment.findMany({
    where,
    orderBy: { paidAt: "desc" },
    take: 5000,
    select: {
      id: true,
      amountPaid: true,
      paymentMethod: true,
      status: true,
      transactionReference: true,
      paidAt: true,
      createdAt: true,
      loan: {
        select: {
          id: true,
          status: true,
          farmer: { select: { user: { select: { fullName: true, email: true } } } },
        },
      },
    },
  });

  const rows = repayments.map((r) => ({
    id: r.id,
    loanId: r.loan.id,
    farmerName: r.loan.farmer.user.fullName,
    farmerEmail: r.loan.farmer.user.email,
    amountPaid: r.amountPaid,
    paymentMethod: r.paymentMethod,
    status: r.status,
    transactionReference: r.transactionReference ?? "",
    paidAt: r.paidAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }));

  sendCSV(res, `repayments-export-${Date.now()}.csv`, rows);
});

/* ─────────────────────────────────────────
   EXPORT FARMERS
───────────────────────────────────────── */

export const exportFarmers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const where: Record<string, unknown> = {};
  if (req.query.status) where.status = String(req.query.status);
  if (req.query.province) where.user = { province: String(req.query.province) };
  if (req.query.district) where.user = { district: String(req.query.district) };

  const farmers = await prisma.farmer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
    select: {
      id: true,
      nationalId: true,
      gender: true,
      farmingExperienceYears: true,
      primaryCrop: true,
      credibilityStatus: true,
      status: true,
      createdAt: true,
      user: {
        select: {
          fullName: true,
          email: true,
          phone: true,
          province: true,
          district: true,
          sector: true,
        },
      },
      _count: { select: { loans: true, creditScores: true, farms: true } },
    },
  });

  const rows = farmers.map((f) => ({
    id: f.id,
    fullName: f.user.fullName,
    email: f.user.email,
    phone: f.user.phone ?? "",
    nationalId: f.nationalId,
    gender: f.gender ?? "",
    province: f.user.province ?? "",
    district: f.user.district ?? "",
    sector: f.user.sector ?? "",
    farmingExperienceYears: f.farmingExperienceYears ?? 0,
    primaryCrop: f.primaryCrop ?? "",
    credibilityStatus: f.credibilityStatus,
    status: f.status,
    totalLoans: f._count.loans,
    totalCreditScores: f._count.creditScores,
    totalFarms: f._count.farms,
    createdAt: f.createdAt.toISOString(),
  }));

  sendCSV(res, `farmers-export-${Date.now()}.csv`, rows);
});

/* ─────────────────────────────────────────
   EXPORT REPAYMENT SCHEDULES
───────────────────────────────────────── */

export const exportRepaymentSchedules = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const where: Record<string, unknown> = {};
  if (req.query.loanId) where.loanId = String(req.query.loanId);
  if (req.query.status) where.status = String(req.query.status);

  if (req.user.role === Role.INSTITUTION) {
    const institutionId = await resolveInstitutionId(req.user.id);
    if (institutionId) where.loan = { institutionId };
  }

  const schedules = await prisma.repaymentSchedule.findMany({
    where,
    orderBy: { dueDate: "asc" },
    take: 5000,
    select: {
      id: true,
      loanId: true,
      dueDate: true,
      expectedAmount: true,
      paidAmount: true,
      status: true,
      createdAt: true,
      loan: {
        select: {
          farmer: { select: { user: { select: { fullName: true, email: true } } } },
        },
      },
    },
  });

  const rows = schedules.map((s) => ({
    id: s.id,
    loanId: s.loanId,
    farmerName: s.loan.farmer.user.fullName,
    farmerEmail: s.loan.farmer.user.email,
    dueDate: s.dueDate.toISOString(),
    expectedAmount: s.expectedAmount,
    paidAmount: s.paidAmount,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
  }));

  sendCSV(res, `repayment-schedules-export-${Date.now()}.csv`, rows);
});
