import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  profileImageUrl?: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

const ROLE_REDIRECT: Record<string, string> = {
  ADMIN: "/admin",
  COOPERATIVE_MANAGER: "/cooperatives",
  INSTITUTION: "/finance",
  GOVERNMENT_PARTNER: "/government",
  FARMER: "/farms",
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("umuhinzi_token"));
  const [user, setUserState] = useState<AuthUser | null>(() => {
    try { return JSON.parse(localStorage.getItem("umuhinzi_user") || "null"); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      localStorage.setItem("umuhinzi_token", token);
    } else {
      localStorage.removeItem("umuhinzi_token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("umuhinzi_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("umuhinzi_user");
    }
  }, [user]);

  const setUser = (u: AuthUser) => setUserState(u);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post("/v1/auth/login", { email, password });
      const { user: u, accessToken, refreshToken } = res.data.data;
      setToken(accessToken);
      setUserState(u);
      localStorage.setItem("umuhinzi_refresh_token", refreshToken);
      const redirect = ROLE_REDIRECT[u.role] ?? "/farms";
      navigate(redirect);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/v1/auth/logout");
    } catch {}
    setToken(null);
    setUserState(null);
    localStorage.removeItem("umuhinzi_refresh_token");
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
