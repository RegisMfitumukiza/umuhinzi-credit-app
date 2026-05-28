export type BackendRole =
  | "FARMER"
  | "INSTITUTION"
  | "COOPERATIVE_MANAGER"
  | "ADMIN"
  | "GOVERNMENT_PARTNER";

export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: BackendRole;
  status?: UserStatus;
  isEmailVerified?: boolean;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
};
