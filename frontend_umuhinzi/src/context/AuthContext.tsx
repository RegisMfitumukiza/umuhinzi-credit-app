import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type AuthState = {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("umuhinzi_token"));

  useEffect(() => {
    if (token) {
      localStorage.setItem("umuhinzi_token", token);
    } else {
      localStorage.removeItem("umuhinzi_token");
    }
  }, [token]);

  const login = (nextToken: string) => setToken(nextToken);
  const logout = () => setToken(null);

  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
