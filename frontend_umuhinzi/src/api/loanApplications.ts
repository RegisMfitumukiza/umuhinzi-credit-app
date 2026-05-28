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
  requestedAmount?: number;
  approvedAmount?: number;
  recommendedAmount?: number;
  status?: string;
  purpose?: string;
  createdAt?: string;
  farmer?: FarmerLike;
};

export type LoanApplicationUi = {
  id: string;
  farmer: string;
  location: string;
  crop: string;
  amount: string;
  scoreLabel: string;
  scoreValue: string;
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

  return {
    id: row.id,
    farmer: row.farmer?.user?.fullName || "Farmer",
    location: "Rwanda",
    crop: row.purpose || "General",
    amount: formatCurrencyAmount(amount),
    scoreLabel: "-",
    scoreValue: "-",
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
