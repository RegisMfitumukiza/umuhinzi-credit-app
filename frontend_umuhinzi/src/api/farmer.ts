import { api } from "./http";
import { farmApi } from "./farms";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

const getListData = async <T>(path: string): Promise<T[]> => {
  const response = await api.get<ApiResponse<T[]>>(path);
  return response.data.data || [];
};

export type FarmerDashboardProfile = {
  id: string;
  fullName: string;
  email: string;
  nationalId?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  farmingExperienceYears?: number | null;
  primaryCrop?: string | null;
  cooperativeId?: string | null;
  province?: string | null;
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
};

export type FarmerProfilePayload = {
  nationalId: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  farmingExperienceYears?: number;
  primaryCrop?: string;
  cooperativeId?: string | null;
};

export type FarmerCrop = {
  id: string;
  cropName?: string;
  cropType?: string;
  plantingDate?: string;
  expectedHarvestDate?: string;
  estimatedArea?: number;
  status?: string;
  farm?: {
    id?: string;
    name?: string;
    province?: string;
    district?: string;
    sector?: string;
  };
};

export type FarmerProductivityRecord = {
  id: string;
  estimatedIncome?: number;
  expectedIncome?: number;
  actualIncome?: number;
  cropYield?: number;
  cropName?: string;
  createdAt?: string;
  harvestDate?: string;
  season?: { name?: string; year?: number };
};

export type FarmerYield = {
  id: string;
  actualYield?: number;
  expectedYield?: number;
  unit?: string;
  harvestDate?: string;
  qualityGrade?: string;
  crop?: { id?: string; cropName?: string; farm?: { name?: string } };
};

export type FarmerLoan = {
  id: string;
  status?: string;
  requestedAmount?: number;
  approvedAmount?: number;
  recommendedAmount?: number;
  purpose?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type FarmerRepayment = {
  id: string;
  amountPaid?: number;
  paymentMethod?: string;
  paidAt?: string;
  status?: string;
  loan?: { id?: string; status?: string };
};

export type FarmerRepaymentSchedule = {
  id: string;
  dueDate?: string;
  amountDue?: number;
  status?: string;
  installmentNumber?: number;
  loan?: { id?: string; purpose?: string };
};

export type FarmerCreditScore = {
  id: string;
  score?: number;
  riskLevel?: string;
  grade?: string;
  createdAt?: string;
  summary?: string;
};

export type FarmerRecommendation = {
  id: string;
  title?: string;
  message?: string;
  actionLabel?: string;
  actionUrl?: string;
  priority?: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
};

export type FarmerNotification = {
  id: string;
  title?: string;
  message?: string;
  isRead?: boolean;
  createdAt?: string;
};

export type FarmerSeason = {
  id: string;
  name?: string;
  year?: number;
  startDate?: string;
  endDate?: string;
};

export const farmerApi = {
  getProfile: async () => {
    const response = await api.get<ApiResponse<FarmerDashboardProfile>>("/farmers/me");
    return response.data.data;
  },
  createProfile: async (payload: FarmerProfilePayload) => {
    const response = await api.post<ApiResponse<FarmerDashboardProfile>>("/farmers", payload);
    return response.data.data;
  },
  updateProfile: async (payload: Partial<FarmerProfilePayload>) => {
    const response = await api.patch<ApiResponse<FarmerDashboardProfile>>("/farmers/me", payload);
    return response.data.data;
  },
  getFarms: async () => farmApi.listMine(),
  getCrops: async () => getListData<FarmerCrop>("/crops"),
  getYields: async () => getListData<FarmerYield>("/yields"),
  getLoans: async () => getListData<FarmerLoan>("/loans"),
  getRepayments: async () => getListData<FarmerRepayment>("/repayments"),
  getRepaymentSchedules: async () => getListData<FarmerRepaymentSchedule>("/repayment-schedules"),
  getLatestCreditScore: async () => {
    const response = await api.get<ApiResponse<FarmerCreditScore>>("/credit-scores/latest");
    return response.data.data;
  },
  getNotifications: async (limit = 5) => {
    const response = await api.get<ApiResponse<FarmerNotification[]>>(`/notifications?limit=${limit}`);
    return response.data.data || [];
  },
  getRecommendations: async (limit = 5) => {
    const response = await api.get<ApiResponse<FarmerRecommendation[]>>(`/recommendations?limit=${limit}`);
    return response.data.data || [];
  },
  getSeasons: async () => {
    const response = await api.get<ApiResponse<FarmerSeason[]>>("/seasons");
    return response.data.data || [];
  },
  getProductivityRecords: async () => getListData<FarmerProductivityRecord>("/productivity"),
  createLoanApplication: async (payload: Record<string, unknown>) => {
    const response = await api.post<ApiResponse<unknown>>("/loan-applications", payload);
    return response.data.data;
  },
  createRepayment: async (payload: Record<string, unknown>) => {
    const response = await api.post<ApiResponse<unknown>>("/repayments", payload);
    return response.data.data;
  },
  createCrop: async (payload: Record<string, unknown>) => {
    const response = await api.post<ApiResponse<unknown>>("/crops", payload);
    return response.data.data;
  },
  createYield: async (payload: Record<string, unknown>) => {
    const response = await api.post<ApiResponse<unknown>>("/yields", payload);
    return response.data.data;
  },
};