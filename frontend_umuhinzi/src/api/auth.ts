import { api } from "./http";
import type { AuthSession, AuthUser, BackendRole } from "../types/auth";
import { normalizeRole } from "../utils/auth";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type AuthResponseData = {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role?: BackendRole;
};

export type LoginPayload = {
  email: string;
  password: string;
};

const sanitizeUser = (user: AuthUser): AuthUser => ({
  ...user,
  role: normalizeRole(user.role),
});

export const loginRequest = async (payload: LoginPayload): Promise<AuthSession> => {
  const response = await api.post<ApiResponse<AuthResponseData>>("/auth/login", payload);
  return {
    user: sanitizeUser(response.data.data.user),
    accessToken: response.data.data.accessToken,
    refreshToken: response.data.data.refreshToken,
  };
};

export const registerRequest = async (payload: RegisterPayload): Promise<AuthSession> => {
  const response = await api.post<ApiResponse<AuthResponseData>>("/auth/register", payload);
  return {
    user: sanitizeUser(response.data.data.user),
    accessToken: response.data.data.accessToken,
    refreshToken: response.data.data.refreshToken,
  };
};

export const verifyEmailRequest = async (token: string): Promise<AuthUser> => {
  const response = await api.post<ApiResponse<AuthUser>>("/auth/verify-email", { token });
  return sanitizeUser(response.data.data);
};

export const getCurrentAuthUser = async (): Promise<AuthUser> => {
  const response = await api.get<ApiResponse<AuthUser>>("/auth/me");
  return sanitizeUser(response.data.data);
};
