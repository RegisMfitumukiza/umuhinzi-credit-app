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

export const cooperativeMembersApi = {
  getMyCooperativeMembers: async (): Promise<CooperativeMemberApi[]> => {
    const response = await api.get<ApiResponse<CooperativeMemberApi[]>>("/cooperative-members");
    return response.data.data || [];
  },
};