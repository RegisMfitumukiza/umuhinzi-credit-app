import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type AuthState = {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("umuhinzi_token"));
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      localStorage.setItem("umuhinzi_token", token);
    } else {
      localStorage.removeItem("umuhinzi_token");
    }
  }, [token]);

  const login = (nextToken: string) => setToken(nextToken);
  const logout = () => {
    // clear token and user, then redirect to landing page
    setToken(null);
    localStorage.removeItem("umuhinzi_user");
    navigate("/");
  };

  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
