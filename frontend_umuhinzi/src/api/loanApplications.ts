import { api } from "./http";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type UserLike = {
  fullName?: string;
};

type FarmerLike = {
  user?: UserLike;
};

type LoanApplicationRaw = {
  id: string;
  farmerId?: string;
  institutionId?: string;
  requestedAmount?: number;
  approvedAmount?: number;
  recommendedAmount?: number;
  status?: string;
  purpose?: string;
  purposeDescription?: string;
  createdAt?: string;
  rejectionReason?: string;
  farmer?: FarmerLike;
  institution?: { name?: string; type?: string };
  reviewedBy?: { fullName?: string; email?: string };
  reviewedAt?: string;
  loan?: {
    id?: string;
    status?: string;
    disbursedAt?: string;
  };
  creditScore?: {
    score?: number;
    riskLevel?: string;
  };
};

export type LoanApplicationUi = {
  id: string;
  loanId?: string;
  loanStatus?: string;
  loanDisbursedAt?: string;
  farmerId?: string;
  institutionId?: string;
  farmer: string;
  institution?: string;
  location: string;
  crop: string;
  purpose?: string;
  purposeDescription?: string;
  amount: string;
  requestedAmount?: number;
  approvedAmount?: number;
  scoreLabel: string;
  scoreValue: string;
  riskLevel?: string;
  date: string;
  reviewedBy?: string;
  reviewedAt?: string;
  status: string;
  createdAt?: string;
  rejectionReason?: string;
};

const formatCurrencyAmount = (value?: number): string => {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  return value.toLocaleString();
};

const toUiStatus = (status?: string): string => {
  if (status === "UNDER_REVIEW") return "Under Review";
  if (status === "APPROVED") return "Approved";
  if (status === "REJECTED") return "Rejected";
  if (status === "CANCELLED") return "Cancelled";
  return "Pending";
};

const toUiModel = (row: LoanApplicationRaw): LoanApplicationUi => {
  const amount = row.approvedAmount ?? row.recommendedAmount ?? row.requestedAmount ?? 0;
  const date = row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-";
  const scoreValue = row.creditScore?.score != null ? String(row.creditScore.score) : "-";
  const scoreLabel = row.creditScore?.riskLevel?.charAt(0) || scoreValue;

  return {
    id: row.id,
    loanId: row.loan?.id,
    loanStatus: row.loan?.status,
    loanDisbursedAt: row.loan?.disbursedAt,
    farmerId: row.farmerId,
    institutionId: row.institutionId,
    farmer: row.farmer?.user?.fullName || "Farmer",
    institution: row.institution?.name,
    location: "Rwanda",
    crop: row.purpose || "General",
    purpose: row.purpose,
    purposeDescription: row.purposeDescription,
    amount: formatCurrencyAmount(amount),
    requestedAmount: row.requestedAmount,
    approvedAmount: row.approvedAmount,
    scoreLabel,
    scoreValue,
    riskLevel: row.creditScore?.riskLevel,
    date,
    reviewedBy: row.reviewedBy?.fullName || row.reviewedBy?.email,
    reviewedAt: row.reviewedAt ? new Date(row.reviewedAt).toLocaleString() : undefined,
    status: toUiStatus(row.status),
    createdAt: row.createdAt,
    rejectionReason: row.rejectionReason,
  };
};

export const getLoanApplications = async (institutionId?: string): Promise<LoanApplicationUi[]> => {
  const qs = institutionId ? `?institutionId=${institutionId}` : "";
  const response = await api.get<ApiResponse<LoanApplicationRaw[]>>(`/loan-applications${qs}`);
  return (response.data.data || []).map(toUiModel);
};

export const getLoanApplicationById = async (id: string): Promise<LoanApplicationUi> => {
  const response = await api.get<ApiResponse<LoanApplicationRaw>>(`/loan-applications/${id}`);
  return toUiModel(response.data.data);
};

export const updateLoanApplicationStatus = async (
  id: string,
  status: "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED",
  rejectionReason?: string,
  terms?: {
    approvedAmount?: number;
    recommendedAmount?: number;
    interestRate?: number;
    totalPayable?: number;
  }
): Promise<LoanApplicationUi> => {
  const response = await api.patch<ApiResponse<LoanApplicationRaw>>(`/loan-applications/${id}/status`, {
    status,
    ...(rejectionReason ? { rejectionReason } : {}),
    ...(terms || {}),
  });
  return toUiModel(response.data.data);
};
