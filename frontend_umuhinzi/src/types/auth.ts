// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole =
  | "FARMER"
  | "INSTITUTION"
  | "COOPERATIVE_MANAGER"
  | "ADMIN"
  | "GOVERNMENT_PARTNER";

// BackendRole is the same as UserRole — kept as alias so existing imports don't break
export type BackendRole = UserRole;

export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

// ─── User ─────────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;

  role: UserRole;
  status: UserStatus;

  isEmailVerified: boolean;
  isPhoneVerified: boolean;

  province?: string | null;
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;

  profileImageUrl?: string | null;
  profileImagePublicId?: string | null;

  lastLoginAt?: string | null;
  passwordChangedAt?: string | null;

  createdAt: string;
  updatedAt: string;
};

// ─── Session (stored in AuthContext) ─────────────────────────────────────────

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
};

// ─── API response wrappers ────────────────────────────────────────────────────

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type RegisterResponse = {
  user: AuthUser;
};

export type RefreshTokenResponse = {
  accessToken: string;
  refreshToken: string;
};

// ─── Request payloads (what you send to the backend) ─────────────────────────

export type RegisterPayload = {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role?: "FARMER" | "INSTITUTION" | "COOPERATIVE_MANAGER" | "GOVERNMENT_PARTNER";
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
  confirmPassword: string;
};

export type VerifyEmailPayload = {
  token: string;
};

export type ResendVerificationEmailPayload = {
  email: string;
};

export type RefreshTokenPayload = {
  refreshToken: string;
};
