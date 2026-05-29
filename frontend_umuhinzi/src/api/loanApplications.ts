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
  requestedAmount?: number;
  approvedAmount?: number;
  recommendedAmount?: number;
  status?: string;
  purpose?: string;
  createdAt?: string;
  farmer?: FarmerLike;
  creditScore?: {
    score?: number;
    riskLevel?: string;
  };
};

export type LoanApplicationUi = {
  id: string;
  farmerId?: string;
  farmer: string;
  location: string;
  crop: string;
  amount: string;
  scoreLabel: string;
  scoreValue: string;
  riskLevel?: string;
  date: string;
  status: string;
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
    farmerId: row.farmerId,
    farmer: row.farmer?.user?.fullName || "Farmer",
    location: "Rwanda",
    crop: row.purpose || "General",
    amount: formatCurrencyAmount(amount),
    scoreLabel,
    scoreValue,
    riskLevel: row.creditScore?.riskLevel,
    date,
    status: toUiStatus(row.status),
  };
};

export const getLoanApplications = async (): Promise<LoanApplicationUi[]> => {
  const response = await api.get<ApiResponse<LoanApplicationRaw[]>>("/loan-applications");
  return (response.data.data || []).map(toUiModel);
};

export const getLoanApplicationById = async (id: string): Promise<LoanApplicationUi> => {
  const response = await api.get<ApiResponse<LoanApplicationRaw>>(`/loan-applications/${id}`);
  return toUiModel(response.data.data);
};

export const updateLoanApplicationStatus = async (
  id: string,
  status: "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED"
): Promise<LoanApplicationUi> => {
  const response = await api.patch<ApiResponse<LoanApplicationRaw>>(`/loan-applications/${id}/status`, { status });
  return toUiModel(response.data.data);
};
