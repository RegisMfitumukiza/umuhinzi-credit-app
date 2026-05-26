import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";
import { Role } from "../generated/prisma/client.js";

import {
  createLoanApplicationService,
  updateLoanApplicationStatusService,
  getMyLoanApplicationsService,
  getAllLoanApplicationsService,
  getLoanApplicationByIdService,
  deleteLoanApplicationService,
} from "../services/loan-application.service.js";

import {
  disburseLoanService,
  updateLoanStatusService,
  getMyLoansService,
  getAllLoansService,
  getLoanByIdService,
} from "../services/loan.service.js";

import {
  createRepaymentService,
  getMyRepaymentsService,
  getAllRepaymentsService,
  getRepaymentByIdService,
  getMyRepaymentSchedulesService,
  getAllRepaymentSchedulesService,
  getRepaymentScheduleByIdService,
} from "../services/repayment.service.js";

import type { LoanApplicationStatus, LoanStatus } from "../generated/prisma/client.js";

const getContext = (req: Request) => ({
  actorId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

/* ─────────────────────────────────────────
   LOAN APPLICATIONS
───────────────────────────────────────── */

export const createLoanApplication = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const application = await createLoanApplicationService(
      req.user.id,
      req.body,
      getContext(req)
    );

    res.status(201).json({
      success: true,
      message: "Loan application submitted successfully",
      data: application,
    });
  }
);

export const updateLoanApplicationStatus = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const application = await updateLoanApplicationStatusService(
      String(req.params.id),
      req.user.id,
      req.user.role,
      req.body,
      getContext(req)
    );

    res.status(200).json({
      success: true,
      message: "Loan application status updated successfully",
      data: application,
    });
  }
);

export const getLoanApplications = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const { page, limit, skip } = getPagination(req.query.limit, req.query.page);

    if (req.user.role === Role.FARMER) {
      const result = await getMyLoanApplicationsService(req.user.id, { skip, limit });
      return res.status(200).json({
        success: true,
        message: "Loan applications fetched successfully",
        data: result.applications,
        pagination: { page, ...result.pagination },
      });
    }

    const where: { farmerId?: string; status?: LoanApplicationStatus } = {};
    if (req.query.farmerId) where.farmerId = String(req.query.farmerId);
    if (req.query.status) where.status = req.query.status as LoanApplicationStatus;

    if (req.user.role === Role.INSTITUTION) {
      const result = await getAllLoanApplicationsService({
        skip,
        limit,
        where,
        institutionUserId: req.user.id,
      });
      return res.status(200).json({
        success: true,
        message: "Loan applications fetched successfully",
        data: result.applications,
        pagination: { page, ...result.pagination },
      });
    }

    const result = await getAllLoanApplicationsService({ skip, limit, where });
    res.status(200).json({
      success: true,
      message: "Loan applications fetched successfully",
      data: result.applications,
      pagination: { page, ...result.pagination },
    });
  }
);

export const getLoanApplicationById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const application = await getLoanApplicationByIdService(
      String(req.params.id),
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: "Loan application fetched successfully",
      data: application,
    });
  }
);

export const deleteLoanApplication = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const result = await deleteLoanApplicationService(
      String(req.params.id),
      req.user.id,
      getContext(req)
    );

    res.status(200).json({ success: true, ...result });
  }
);

/* ─────────────────────────────────────────
   LOANS
───────────────────────────────────────── */

export const getLoans = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const { page, limit, skip } = getPagination(req.query.limit, req.query.page);

  if (req.user.role === Role.FARMER) {
    const result = await getMyLoansService(req.user.id, { skip, limit });
    return res.status(200).json({
      success: true,
      message: "Loans fetched successfully",
      data: result.loans,
      pagination: { page, ...result.pagination },
    });
  }

  const where: { status?: LoanStatus; farmerId?: string } = {};
  if (req.query.status) where.status = req.query.status as LoanStatus;
  if (req.query.farmerId) where.farmerId = String(req.query.farmerId);

  if (req.user.role === Role.INSTITUTION) {
    const result = await getAllLoansService({
      skip,
      limit,
      where,
      institutionUserId: req.user.id,
    });
    return res.status(200).json({
      success: true,
      message: "Loans fetched successfully",
      data: result.loans,
      pagination: { page, ...result.pagination },
    });
  }

  const result = await getAllLoansService({ skip, limit, where });
  res.status(200).json({
    success: true,
    message: "Loans fetched successfully",
    data: result.loans,
    pagination: { page, ...result.pagination },
  });
});

export const getLoanById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const loan = await getLoanByIdService(String(req.params.id), req.user.id, req.user.role);

  res.status(200).json({
    success: true,
    message: "Loan fetched successfully",
    data: loan,
  });
});

export const disburseLoan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const loan = await disburseLoanService(
    String(req.params.id),
    req.user.id,
    req.user.role,
    req.body,
    getContext(req)
  );

  res.status(200).json({
    success: true,
    message: "Loan disbursed successfully",
    data: loan,
  });
});

export const updateLoanStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const loan = await updateLoanStatusService(
    String(req.params.id),
    req.user.id,
    req.body,
    getContext(req)
  );

  res.status(200).json({
    success: true,
    message: "Loan status updated successfully",
    data: loan,
  });
});

/* ─────────────────────────────────────────
   REPAYMENTS
───────────────────────────────────────── */

export const createRepayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const repayment = await createRepaymentService(req.user.id, req.body, getContext(req));

  res.status(201).json({
    success: true,
    message: "Repayment recorded successfully",
    data: repayment,
  });
});

export const getRepayments = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const { page, limit, skip } = getPagination(req.query.limit, req.query.page);
  const loanId = req.query.loanId ? String(req.query.loanId) : undefined;
  const isAdmin = req.user.role === Role.ADMIN;

  if (!isAdmin) {
    const result = await getMyRepaymentsService(req.user.id, { skip, limit, loanId });
    return res.status(200).json({
      success: true,
      message: "Repayments fetched successfully",
      data: result.repayments,
      pagination: { page, ...result.pagination },
    });
  }

  const result = await getAllRepaymentsService({ skip, limit, loanId });
  res.status(200).json({
    success: true,
    message: "Repayments fetched successfully",
    data: result.repayments,
    pagination: { page, ...result.pagination },
  });
});

export const getRepaymentById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new APIError("User not authenticated", 401);

  const isAdmin = req.user.role === Role.ADMIN;
  const repayment = await getRepaymentByIdService(String(req.params.id), req.user.id, isAdmin);

  res.status(200).json({
    success: true,
    message: "Repayment fetched successfully",
    data: repayment,
  });
});

/* ─────────────────────────────────────────
   REPAYMENT SCHEDULES
───────────────────────────────────────── */

export const getRepaymentSchedules = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const { page, limit, skip } = getPagination(req.query.limit, req.query.page);
    const loanId = req.query.loanId ? String(req.query.loanId) : undefined;
    const isAdmin = req.user.role === Role.ADMIN;

    if (!isAdmin) {
      const result = await getMyRepaymentSchedulesService(req.user.id, { skip, limit, loanId });
      return res.status(200).json({
        success: true,
        message: "Repayment schedules fetched successfully",
        data: result.schedules,
        pagination: { page, ...result.pagination },
      });
    }

    const result = await getAllRepaymentSchedulesService({ skip, limit, loanId });
    res.status(200).json({
      success: true,
      message: "Repayment schedules fetched successfully",
      data: result.schedules,
      pagination: { page, ...result.pagination },
    });
  }
);

export const getRepaymentScheduleById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("User not authenticated", 401);

    const isAdmin = req.user.role === Role.ADMIN;
    const schedule = await getRepaymentScheduleByIdService(
      String(req.params.id),
      req.user.id,
      isAdmin
    );

    res.status(200).json({
      success: true,
      message: "Repayment schedule fetched successfully",
      data: schedule,
    });
  }
);
