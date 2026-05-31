import { api } from "./http";
import type { AuthUser } from "../types/auth";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status?: string;
  enabled: boolean;
};

const toAdminUser = (user: AuthUser & { status?: string }): AdminUser => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  status: user.status,
  enabled: user.status !== "SUSPENDED" && user.status !== "DEACTIVATED",
});

export const getUsers = async (): Promise<AdminUser[]> => {
  const response = await api.get<ApiResponse<Array<AuthUser & { status?: string }>>>("/users");
  return (response.data.data || []).map(toAdminUser);
};

export const updateUserStatus = async (
  id: string,
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED"
): Promise<AdminUser> => {
  const response = await api.patch<ApiResponse<AuthUser & { status?: string }>>(`/users/${id}/status`, { status });
  return toAdminUser(response.data.data);
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};

export type UpdateMyProfilePayload = {
  fullName?: string;
  phone?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
};

export const updateMyProfile = async (payload: UpdateMyProfilePayload): Promise<AuthUser> => {
  const response = await api.patch<ApiResponse<AuthUser>>("/users/me", payload);
  return response.data.data;
};

export type CurrentUserProfile = AuthUser & {
  cooperativeManagerProfile?: {
    cooperativeId?: string | null;
  } | null;
  institutionProfile?: {
    id?: string;
  } | null;
  farmerProfile?: {
    id?: string;
  } | null;
};

export const getCurrentUserProfile = async (): Promise<CurrentUserProfile> => {
  const response = await api.get<ApiResponse<CurrentUserProfile>>("/users/me");
  return response.data.data;
};
