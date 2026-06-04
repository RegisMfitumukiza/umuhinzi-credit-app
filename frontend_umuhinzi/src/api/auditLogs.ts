import { api } from "./http";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
};

export type AuditLog = {
  id: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  description?: string | null;
  previousValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: string;
  actor?: {
    id?: string;
    fullName?: string;
    email?: string;
    role?: string;
  };
};

export type AuditLogFilters = {
  page?: number;
  limit?: number;
  actorId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  from?: string;
  to?: string;
};

export type AuditLogResponse = {
  logs: AuditLog[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export const auditApi = {
  getLogs: async (filters: AuditLogFilters = {}): Promise<AuditLogResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== "") params.set(k, String(v));
    });
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await api.get<ApiResponse<AuditLog[]>>(`/audit-logs${qs}`);
    return {
      logs: res.data.data || [],
      pagination: res.data.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },
};
