import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import type { Prisma } from "../generated/prisma/client.js";

/* ─────────────────────────────────────────
   PLATFORM-WIDE ANALYTICS (ADMIN / GOVERNMENT_PARTNER)
───────────────────────────────────────── */

export const getPlatformAnalyticsService = async () => {
  const [
    totalFarmers,
    totalLoans,
    totalDisbursed,
    loansByStatus,
    totalRepayments,
    totalRepaid,
    avgCreditScore,
    totalInstitutions,
    totalCooperatives,
    recentLoans,
  ] = await Promise.all([
    prisma.farmer.count(),

    prisma.loan.count(),

    prisma.loan.aggregate({
      _sum: { disbursedAmount: true },
      where: { disbursedAmount: { not: null } },
    }),

    prisma.loan.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    prisma.repayment.count(),

    prisma.repayment.aggregate({
      _sum: { amountPaid: true },
    }),

    prisma.creditScore.aggregate({
      _avg: { score: true },
    }),

    prisma.institution.count({ where: { status: "ACTIVE" } }),

    prisma.cooperative.count({ where: { status: "ACTIVE" } }),

    prisma.loan.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        principalAmount: true,
        status: true,
        createdAt: true,
        farmer: {
          select: {
            user: { select: { fullName: true } },
          },
        },
      },
    }),
  ]);

  const loanStatusMap = Object.fromEntries(
    loansByStatus.map((s) => [s.status, s._count.id])
  );

  return {
    farmers: { total: totalFarmers },
    loans: {
      total: totalLoans,
      totalDisbursedAmount: totalDisbursed._sum.disbursedAmount ?? 0,
      byStatus: loanStatusMap,
    },
    repayments: {
      total: totalRepayments,
      totalAmountRepaid: totalRepaid._sum.amountPaid ?? 0,
    },
    creditScores: {
      averageScore: avgCreditScore._avg.score
        ? Math.round(avgCreditScore._avg.score * 100) / 100
        : null,
    },
    institutions: { activeCount: totalInstitutions },
    cooperatives: { activeCount: totalCooperatives },
    recentLoans,
  };
};

/* ─────────────────────────────────────────
   PER-FARMER ANALYTICS
───────────────────────────────────────── */

export const getFarmerAnalyticsService = async (
  farmerId: string,
  requestingUserId: string,
  userRole: string
) => {
  // Farmers can only see their own analytics
  if (userRole === "FARMER") {
    const farmer = await prisma.farmer.findUnique({
      where: { userId: requestingUserId },
      select: { id: true },
    });
    if (!farmer || farmer.id !== farmerId) {
      throw new APIError("Not authorized to access this farmer's analytics.", 403);
    }
  }

  const farmer = await prisma.farmer.findUnique({
    where: { id: farmerId },
    select: {
      id: true,
      user: { select: { fullName: true, email: true } },
    },
  });
  if (!farmer) throw new APIError("Farmer not found.", 404);

  const [
    loanApplications,
    loans,
    loansByStatus,
    totalRepaid,
    latestCreditScore,
    repaymentSchedules,
    overdueSchedules,
  ] = await Promise.all([
    prisma.loanApplication.count({ where: { farmerId } }),

    prisma.loan.count({ where: { farmerId } }),

    prisma.loan.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { farmerId },
    }),

    prisma.repayment.aggregate({
      _sum: { amountPaid: true },
      where: { loan: { farmerId } },
    }),

    prisma.creditScore.findFirst({
      where: { farmerId },
      orderBy: { createdAt: "desc" },
      select: { score: true, riskLevel: true, createdAt: true },
    }),

    prisma.repaymentSchedule.count({
      where: { loan: { farmerId } },
    }),

    prisma.repaymentSchedule.count({
      where: { loan: { farmerId }, status: "OVERDUE" },
    }),
  ]);

  const loanStatusMap = Object.fromEntries(
    loansByStatus.map((s) => [s.status, s._count.id])
  );

  return {
    farmer: { id: farmer.id, ...farmer.user },
    loanApplications: { total: loanApplications },
    loans: {
      total: loans,
      byStatus: loanStatusMap,
    },
    repayments: {
      totalAmountRepaid: totalRepaid._sum.amountPaid ?? 0,
    },
    repaymentSchedules: {
      total: repaymentSchedules,
      overdue: overdueSchedules,
    },
    creditScore: latestCreditScore ?? null,
  };
};

/* ─────────────────────────────────────────
   REGIONAL ANALYTICS (by province/district)
───────────────────────────────────────── */

export const getRegionalAnalyticsService = async () => {
  // Farmers grouped by province
  const farmersByProvince = await prisma.user.groupBy({
    by: ["province"],
    where: { role: "FARMER", province: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  // Farmers grouped by district
  const farmersByDistrict = await prisma.user.groupBy({
    by: ["district"],
    where: { role: "FARMER", district: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  // Loans grouped by institution district
  const loansByDistrict = await prisma.institution.findMany({
    where: { district: { not: null } },
    select: {
      district: true,
      _count: { select: { loans: true, loanApplications: true } },
    },
  });

  // Credit score averages by province (via farmer → user)
  const creditScoresByProvince = await prisma.$queryRaw<
    Array<{ province: string; avg_score: number; count: bigint }>
  >`
    SELECT u.province, AVG(cs.score) as avg_score, COUNT(cs.id) as count
    FROM "CreditScore" cs
    JOIN "Farmer" f ON cs."farmerId" = f.id
    JOIN "User" u ON f."userId" = u.id
    WHERE u.province IS NOT NULL
    GROUP BY u.province
    ORDER BY avg_score DESC
  `;

  return {
    farmersByProvince: farmersByProvince.map((r) => ({
      province: r.province,
      farmerCount: r._count.id,
    })),
    farmersByDistrict: farmersByDistrict.map((r) => ({
      district: r.district,
      farmerCount: r._count.id,
    })),
    loansByDistrict: loansByDistrict.map((r) => ({
      district: r.district,
      loanCount: r._count.loans,
      applicationCount: r._count.loanApplications,
    })),
    creditScoresByProvince: creditScoresByProvince.map((r) => ({
      province: r.province,
      averageScore: Math.round(Number(r.avg_score) * 100) / 100,
      scoredFarmers: Number(r.count),
    })),
  };
};

/* ─────────────────────────────────────────
   ANALYTICS REPORT GENERATION
───────────────────────────────────────── */

export const generateAnalyticsReportService = async (
  generatedById: string,
  input: {
    reportType: "FARMER_GROWTH" | "PRODUCTIVITY" | "LOAN_ANALYTICS" | "REGIONAL_PERFORMANCE" | "FINANCIAL_INCLUSION" | "REPAYMENT_PERFORMANCE" | "COOPERATIVE_PERFORMANCE";
    title: string;
    description?: string;
    visibility?: "ADMIN_ONLY" | "INSTITUTION" | "COOPERATIVE" | "GOVERNMENT_PARTNER" | "PUBLIC_SUMMARY";
  }
) => {
  // Gather data based on report type
  let data: Record<string, unknown> = {};

  switch (input.reportType) {
    case "FARMER_GROWTH": {
      const [total, byStatus, recentRegistrations] = await Promise.all([
        prisma.farmer.count(),
        prisma.farmer.groupBy({ by: ["status"], _count: { id: true } }),
        prisma.farmer.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          select: { id: true, createdAt: true, user: { select: { fullName: true, province: true } } },
        }),
      ]);
      data = { total, byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.id])), recentRegistrations };
      break;
    }

    case "LOAN_ANALYTICS": {
      const [total, byStatus, totalDisbursed, avgLoanAmount] = await Promise.all([
        prisma.loan.count(),
        prisma.loan.groupBy({ by: ["status"], _count: { id: true } }),
        prisma.loan.aggregate({ _sum: { disbursedAmount: true } }),
        prisma.loan.aggregate({ _avg: { principalAmount: true } }),
      ]);
      data = {
        total,
        byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.id])),
        totalDisbursedAmount: totalDisbursed._sum.disbursedAmount ?? 0,
        averageLoanAmount: Math.round((avgLoanAmount._avg.principalAmount ?? 0) * 100) / 100,
      };
      break;
    }

    case "REPAYMENT_PERFORMANCE": {
      const [totalSchedules, byStatus, totalRepaid] = await Promise.all([
        prisma.repaymentSchedule.count(),
        prisma.repaymentSchedule.groupBy({ by: ["status"], _count: { id: true } }),
        prisma.repayment.aggregate({ _sum: { amountPaid: true } }),
      ]);
      const paidCount = byStatus.find((s) => s.status === "PAID")?._count.id ?? 0;
      const repaymentRate = totalSchedules > 0 ? Math.round((paidCount / totalSchedules) * 100) : 0;
      data = {
        totalSchedules,
        byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.id])),
        totalAmountRepaid: totalRepaid._sum.amountPaid ?? 0,
        repaymentRate: `${repaymentRate}%`,
      };
      break;
    }

    case "REGIONAL_PERFORMANCE": {
      data = await getRegionalAnalyticsService();
      break;
    }

    case "FINANCIAL_INCLUSION": {
      const [totalFarmers, farmersWithLoans, farmersWithCreditScores, avgScore] = await Promise.all([
        prisma.farmer.count(),
        prisma.farmer.count({ where: { loans: { some: {} } } }),
        prisma.farmer.count({ where: { creditScores: { some: {} } } }),
        prisma.creditScore.aggregate({ _avg: { score: true } }),
      ]);
      data = {
        totalFarmers,
        farmersWithLoans,
        farmersWithCreditScores,
        financialInclusionRate: totalFarmers > 0 ? `${Math.round((farmersWithLoans / totalFarmers) * 100)}%` : "0%",
        averageCreditScore: Math.round((avgScore._avg.score ?? 0) * 100) / 100,
      };
      break;
    }

    case "COOPERATIVE_PERFORMANCE": {
      const [totalCoops, activeCoops, totalMembers] = await Promise.all([
        prisma.cooperative.count(),
        prisma.cooperative.count({ where: { status: "ACTIVE" } }),
        prisma.cooperativeMember.count({ where: { status: "ACTIVE" } }),
      ]);
      data = { totalCooperatives: totalCoops, activeCooperatives: activeCoops, totalActiveMembers: totalMembers };
      break;
    }

    case "PRODUCTIVITY": {
      const [totalYields, avgYield, totalInputCosts] = await Promise.all([
        prisma.yieldRecord.count(),
        prisma.yieldRecord.aggregate({ _avg: { actualYield: true } }),
        prisma.inputCost.aggregate({ _sum: { totalCost: true } }),
      ]);
      data = {
        totalYieldRecords: totalYields,
        averageActualYield: Math.round((avgYield._avg.actualYield ?? 0) * 100) / 100,
        totalInputCosts: totalInputCosts._sum.totalCost ?? 0,
      };
      break;
    }
  }

  const report = await prisma.analyticsReport.create({
    data: {
      reportType: input.reportType,
      title: input.title,
      description: input.description,
      visibility: input.visibility ?? "ADMIN_ONLY",
      data: data as Prisma.InputJsonValue,
      generatedById,
      generatedAt: new Date(),
    },
    select: {
      id: true,
      reportType: true,
      visibility: true,
      title: true,
      description: true,
      data: true,
      generatedAt: true,
      createdAt: true,
      generatedBy: { select: { id: true, fullName: true, email: true } },
    },
  });

  return report;
};

/* ─────────────────────────────────────────
   GET ANALYTICS REPORTS
───────────────────────────────────────── */

export const getAnalyticsReportsService = async (options: {
  skip?: number;
  limit?: number;
  reportType?: string;
  userRole?: string;
}) => {
  const { skip = 0, limit = 10, reportType, userRole } = options;

  // Government partners can only see reports published for them or as public summary
  const visibilityFilter: Prisma.AnalyticsReportWhereInput =
    userRole === "GOVERNMENT_PARTNER"
      ? { visibility: { in: ["GOVERNMENT_PARTNER", "PUBLIC_SUMMARY"] } }
      : {};

  const where: Prisma.AnalyticsReportWhereInput = {
    ...visibilityFilter,
    ...(reportType && { reportType: reportType as never }),
  };

  const [reports, total] = await Promise.all([
    prisma.analyticsReport.findMany({
      where,
      skip,
      take: limit,
      orderBy: { generatedAt: "desc" },
      select: {
        id: true,
        reportType: true,
        visibility: true,
        title: true,
        description: true,
        data: true,
        generatedAt: true,
        createdAt: true,
        generatedBy: { select: { id: true, fullName: true, email: true } },
      },
    }),
    prisma.analyticsReport.count({ where }),
  ]);

  return {
    reports,
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
   LOAN TRENDS (monthly, last 12 months)
───────────────────────────────────────── */

export const getLoanTrendsService = async () => {
  const rows = await prisma.$queryRaw<
    Array<{ month: string; loan_count: bigint; disbursed_amount: string }>
  >`
    SELECT
      TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
      COUNT(*)::bigint                                      AS loan_count,
      COALESCE(SUM("disbursedAmount"), 0)::text            AS disbursed_amount
    FROM "Loan"
    WHERE "createdAt" >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY DATE_TRUNC('month', "createdAt") ASC
  `;

  return rows.map((r) => ({
    month: r.month,
    loanCount: Number(r.loan_count),
    disbursedAmount: parseFloat(r.disbursed_amount),
  }));
};

/* ─────────────────────────────────────────
   CREDIT SCORE DISTRIBUTION (histogram)
   Uses only the latest score per farmer.
───────────────────────────────────────── */

export const getCreditScoreDistributionService = async () => {
  const rows = await prisma.$queryRaw<
    Array<{ band: string; farmer_count: bigint; avg_score: string }>
  >`
    WITH latest AS (
      SELECT DISTINCT ON ("farmerId") score
      FROM "CreditScore"
      ORDER BY "farmerId", "createdAt" DESC
    )
    SELECT
      CASE
        WHEN score BETWEEN 0  AND 20  THEN '0–20 (Very Poor)'
        WHEN score BETWEEN 21 AND 40  THEN '21–40 (Poor)'
        WHEN score BETWEEN 41 AND 60  THEN '41–60 (Fair)'
        WHEN score BETWEEN 61 AND 80  THEN '61–80 (Good)'
        WHEN score BETWEEN 81 AND 100 THEN '81–100 (Excellent)'
      END                              AS band,
      COUNT(*)::bigint                 AS farmer_count,
      ROUND(AVG(score)::numeric, 2)::text AS avg_score
    FROM latest
    GROUP BY band
    ORDER BY band
  `;

  return rows.map((r) => ({
    band: r.band,
    farmerCount: Number(r.farmer_count),
    averageScore: parseFloat(r.avg_score),
  }));
};

/* ─────────────────────────────────────────
   REPAYMENT TRENDS (monthly, last 12 months)
───────────────────────────────────────── */

export const getRepaymentTrendsService = async () => {
  const rows = await prisma.$queryRaw<
    Array<{ month: string; payment_count: bigint; total_paid: string }>
  >`
    SELECT
      TO_CHAR(DATE_TRUNC('month', "paidAt"), 'YYYY-MM') AS month,
      COUNT(*)::bigint                                    AS payment_count,
      COALESCE(SUM("amountPaid"), 0)::text               AS total_paid
    FROM "Repayment"
    WHERE "paidAt" >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', "paidAt")
    ORDER BY DATE_TRUNC('month', "paidAt") ASC
  `;

  return rows.map((r) => ({
    month: r.month,
    paymentCount: Number(r.payment_count),
    totalAmountPaid: parseFloat(r.total_paid),
  }));
};
