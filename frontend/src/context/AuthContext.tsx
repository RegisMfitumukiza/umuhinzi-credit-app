import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";
import type { AuthUser, Role } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

const ROLE_REDIRECT: Record<Role, string> = {
  ADMIN: "/admin",
  COOPERATIVE_MANAGER: "/cooperatives",
  INSTITUTION: "/finance",
  GOVERNMENT_PARTNER: "/government",
  FARMER: "/dashboard",
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

const loadUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem("umuhinzi_user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<AuthUser | null>(loadUser);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("umuhinzi_token")
  );
  const navigate = useNavigate();

  const setUser = (u: AuthUser) => {
    setUserState(u);
    localStorage.setItem("umuhinzi_user", JSON.stringify(u));
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    const { user: u, accessToken, refreshToken } = data.data;
    localStorage.setItem("umuhinzi_token", accessToken);
    localStorage.setItem("umuhinzi_refresh_token", refreshToken);
    localStorage.setItem("umuhinzi_user", JSON.stringify(u));
    setToken(accessToken);
    setUserState(u);
    navigate(ROLE_REDIRECT[u.role as Role] ?? "/dashboard");
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // proceed regardless
    }
    localStorage.removeItem("umuhinzi_token");
    localStorage.removeItem("umuhinzi_refresh_token");
    localStorage.removeItem("umuhinzi_user");
    setToken(null);
    setUserState(null);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
