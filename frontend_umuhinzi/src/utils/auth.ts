import type { AuthUser, BackendRole } from "../types/auth";

const ROLE_ALIASES: Record<string, BackendRole> = {
  FARMER: "FARMER",
  INSTITUTION: "INSTITUTION",
  FINANCE_INSTITUTION: "INSTITUTION",
  COOPERATIVE_MANAGER: "COOPERATIVE_MANAGER",
  ADMIN: "ADMIN",
  GOVERNMENT: "GOVERNMENT_PARTNER",
  GOVERNMENT_PARTNER: "GOVERNMENT_PARTNER",
};

export const normalizeRole = (value?: string | null): BackendRole => {
  const key = (value || "FARMER").toUpperCase();
  return ROLE_ALIASES[key] ?? "FARMER";
};

export const homeRouteByRole = (role: BackendRole): string => {
  if (role === "COOPERATIVE_MANAGER") return "/cooperatives";
  if (role === "INSTITUTION") return "/finance";
  if (role === "GOVERNMENT_PARTNER") return "/government";
  if (role === "ADMIN") return "/admin";
  return "/farmer/dashboard";
};

export const isRoleAllowed = (role: BackendRole, allowed?: BackendRole[]): boolean => {
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(role);
};

export const needsEmailVerification = (user: AuthUser | null): boolean => {
  if (!user) return false;
  if (user.role !== "FARMER" && user.role !== "COOPERATIVE_MANAGER") return false;
  return user.isEmailVerified === false;
};
