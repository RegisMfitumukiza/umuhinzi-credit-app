import { api } from "./http";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type CooperativeStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export type CooperativeProfile = {
  id: string;
  name: string;
  registrationNumber?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  province?: string | null;
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
  status?: CooperativeStatus;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    managers?: number;
    members?: number;
  };
};

export type CreateCooperativePayload = {
  name: string;
  registrationNumber?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
};

export type UpdateCooperativePayload = Partial<CreateCooperativePayload>;

const normalizeCooperatives = (items: CooperativeProfile[] = []) => items;

export const cooperativeApi = {
  getAllCooperatives: async (): Promise<CooperativeProfile[]> => {
    const response = await api.get<ApiResponse<CooperativeProfile[]>>("/cooperatives");
    return normalizeCooperatives(response.data.data || []);
  },
  getActiveCooperatives: async (): Promise<CooperativeProfile[]> => {
    const response = await api.get<ApiResponse<CooperativeProfile[]>>("/cooperatives");
    return normalizeCooperatives((response.data.data || []).filter((cooperative) => cooperative.status === "ACTIVE"));
  },
  createCooperative: async (payload: CreateCooperativePayload): Promise<CooperativeProfile> => {
    const response = await api.post<ApiResponse<CooperativeProfile>>("/cooperatives", payload);
    return response.data.data;
  },
  updateCooperative: async (id: string, payload: UpdateCooperativePayload): Promise<CooperativeProfile> => {
    const response = await api.patch<ApiResponse<CooperativeProfile>>(`/cooperatives/${id}`, payload);
    return response.data.data;
  },
  updateCooperativeStatus: async (id: string, status: CooperativeStatus): Promise<CooperativeProfile> => {
    const response = await api.patch<ApiResponse<CooperativeProfile>>(`/cooperatives/${id}/status`, { status });
    return response.data.data;
  },
};