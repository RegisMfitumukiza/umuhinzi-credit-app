import { api } from "./http";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type PlatformAnalytics = {
  farmers?: { total?: number; verified?: number; pending?: number };
  loans?: { total?: number; active?: number; disbursed?: number; completed?: number; defaulted?: number; totalValue?: number };
  repayments?: { total?: number; totalAmountPaid?: number };
  creditScores?: { total?: number; averageScore?: number; distribution?: Record<string, number> };
  institutions?: { total?: number; active?: number };
  cooperatives?: { total?: number; active?: number };
};

export type RegionalAnalytics = Array<{
  province?: string;
  district?: string;
  farmerCount?: number;
  loanCount?: number;
  averageCreditScore?: number;
}>;

export type AnalyticsReport = {
  id: string;
  reportType: string;
  title: string;
  description?: string;
  visibility?: string;
  createdAt?: string;
  data?: Record<string, unknown>;
};

export const analyticsApi = {
  getPlatformAnalytics: async (): Promise<PlatformAnalytics> => {
    const res = await api.get<ApiResponse<PlatformAnalytics>>("/analytics");
    return res.data.data || {};
  },
  getRegionalAnalytics: async (): Promise<RegionalAnalytics> => {
    const res = await api.get<ApiResponse<RegionalAnalytics>>("/analytics/regional");
    return res.data.data || [];
  },
  getReports: async (page = 1, limit = 20): Promise<AnalyticsReport[]> => {
    const res = await api.get<ApiResponse<AnalyticsReport[]>>(`/analytics/reports?page=${page}&limit=${limit}`);
    return res.data.data || [];
  },
  generateReport: async (payload: { reportType: string; title: string; description?: string; visibility?: string }): Promise<AnalyticsReport> => {
    const res = await api.post<ApiResponse<AnalyticsReport>>("/analytics/reports", payload);
    return res.data.data;
  },
  getFarmerAnalytics: async (id: string): Promise<Record<string, unknown>> => {
    const res = await api.get<ApiResponse<Record<string, unknown>>>(`/analytics/farmer/${id}`);
    return res.data.data || {};
  },
};
