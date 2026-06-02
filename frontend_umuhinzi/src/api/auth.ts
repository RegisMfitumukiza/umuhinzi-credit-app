import { api } from "./http";
import type {
  AuthSession,
  AuthUser,
  AuthResponse,
  ApiResponse,
  RegisterPayload,
  LoginPayload,
} from "../types/auth";
import { normalizeRole } from "../utils/auth";

const sanitizeUser = (user: AuthUser): AuthUser => ({
  ...user,
  role: normalizeRole(user.role),
});

export const loginRequest = async (payload: LoginPayload): Promise<AuthSession> => {
  const response = await api.post<ApiResponse<AuthResponse>>("/auth/login", payload);
  return {
    user: sanitizeUser(response.data.data.user),
    accessToken: response.data.data.accessToken,
    refreshToken: response.data.data.refreshToken,
  };
};

export const registerRequest = async (payload: RegisterPayload): Promise<{ user: AuthUser }> => {
  const response = await api.post<ApiResponse<{ user: AuthUser }>>("/auth/register", payload);
  return {
    user: sanitizeUser(response.data.data.user),
  };
};

export const getCurrentAuthUser = async (): Promise<AuthUser> => {
  const response = await api.get<ApiResponse<AuthUser>>("/auth/me");
  return sanitizeUser(response.data.data);
};

export const logoutRequest = async (): Promise<void> => {
  await api.post("/auth/logout");
};

export const verifyEmailRequest = async (token: string): Promise<void> => {
  await api.post("/auth/verify-email", { token });
};

export const resendVerificationRequest = async (email: string): Promise<void> => {
  await api.post("/auth/resend-verification-email", { email });
};

export const forgotPasswordRequest = async (email: string): Promise<void> => {
  await api.post("/auth/forgot-password", { email });
};

export const resetPasswordRequest = async (token: string, password: string, confirmPassword: string): Promise<void> => {
  await api.post("/auth/reset-password", { token, password, confirmPassword });
};

export const refreshTokenRequest = async (refreshToken: string): Promise<string> => {
  const response = await api.post<ApiResponse<{ accessToken: string }>>(
    "/auth/refresh-token",
    { refreshToken }
  );
  return response.data.data.accessToken;
};
