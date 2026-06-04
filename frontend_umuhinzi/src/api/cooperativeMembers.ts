import { api } from "./http";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type CooperativeMemberApi = {
  id: string;
  cooperativeId: string;
  farmerId: string;
  status?: string;
  joinedAt?: string;
  farmer?: {
    user?: {
      fullName?: string;
      email?: string;

    };
  };
};

export type JoinCooperativePayload = {
  cooperativeId: string;
  joinedAt?: string;
};

export type UpdateCooperativeMemberPayload = {
  status?: "PENDING" | "ACTIVE" | "REMOVED" | "LEFT";
  joinedAt?: string;
  leftAt?: string;
};

export const cooperativeMembersApi = {
  joinCooperative: async (payload: JoinCooperativePayload): Promise<CooperativeMemberApi> => {
    const response = await api.post<ApiResponse<CooperativeMemberApi>>("/cooperative-members", payload);
    return response.data.data;
  },
  getMyCooperativeMembers: async (): Promise<CooperativeMemberApi[]> => {
    const response = await api.get<ApiResponse<CooperativeMemberApi[]>>("/cooperative-members");
    return response.data.data || [];
  },
  updateCooperativeMember: async (id: string, payload: UpdateCooperativeMemberPayload): Promise<CooperativeMemberApi> => {
    const response = await api.patch<ApiResponse<CooperativeMemberApi>>(`/cooperative-members/${id}`, payload);
    return response.data.data;
  },
  removeCooperativeMember: async (id: string): Promise<void> => {
    await api.delete(`/cooperative-members/${id}`);
  },
};