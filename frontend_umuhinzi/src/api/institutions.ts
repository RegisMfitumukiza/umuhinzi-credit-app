import { api } from "./http";

export type InstitutionType = "SACCO" | "MICROFINANCE" | "BANK" | "NGO" | "GOVERNMENT_PROGRAM" | "OTHER";

export type InstitutionStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type InstitutionProfile = {
  id: string;
  userId?: string;
  name: string;
  type: InstitutionType;
  registrationNumber?: string | null;
  licenseNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  province?: string | null;
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
  status?: InstitutionStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateInstitutionPayload = {
  name: string;
  type: InstitutionType;
  registrationNumber?: string;
  licenseNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
};

export type UpdateInstitutionPayload = Partial<CreateInstitutionPayload>;

const institutionsCacheBust = () => `?_ts=${Date.now()}`;

export const institutionApi = {
  getMyInstitution: async (): Promise<InstitutionProfile | null> => {
    const response = await api.get<ApiResponse<InstitutionProfile[]>>(`/institutions${institutionsCacheBust()}`);
    return response.data.data?.[0] || null;
  },
  getAvailableInstitutions: async (): Promise<InstitutionProfile[]> => {
    const response = await api.get<ApiResponse<InstitutionProfile[]>>(`/institutions/available${institutionsCacheBust()}`);
    return response.data.data || [];
  },
  getAllInstitutions: async (): Promise<InstitutionProfile[]> => {
    const response = await api.get<ApiResponse<InstitutionProfile[]>>(`/institutions${institutionsCacheBust()}`);
    return response.data.data || [];
  },
  getActiveInstitutions: async (): Promise<InstitutionProfile[]> => {
    const response = await api.get<ApiResponse<InstitutionProfile[]>>(`/institutions${institutionsCacheBust()}`);
    return (response.data.data || []).filter((institution) => institution.status === "ACTIVE");
  },
  createInstitution: async (payload: CreateInstitutionPayload): Promise<InstitutionProfile> => {
    const response = await api.post<ApiResponse<InstitutionProfile>>("/institutions", payload);
    return response.data.data;
  },
  updateInstitution: async (id: string, payload: UpdateInstitutionPayload): Promise<InstitutionProfile> => {
    const response = await api.patch<ApiResponse<InstitutionProfile>>(`/institutions/${id}`, payload);
    return response.data.data;
  },
  updateInstitutionStatus: async (id: string, status: InstitutionStatus): Promise<InstitutionProfile> => {
    const response = await api.patch<ApiResponse<InstitutionProfile>>(`/institutions/${id}/status`, { status });
    return response.data.data;
  },
};
