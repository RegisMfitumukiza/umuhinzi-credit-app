import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { AuthSession, AuthUser } from "../types/auth";
import { normalizeRole } from "../utils/auth";
import { getCurrentAuthUser } from "../api/auth";

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (value: string | AuthSession) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

const parseStoredUser = (): AuthUser | null => {
  const raw = localStorage.getItem("umuhinzi_user");

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>;

    if (!parsed.id || !parsed.email || !parsed.fullName || !parsed.role) {
      return null;
    }

    return {
      ...parsed,
      role: normalizeRole(parsed.role),
    } as AuthUser;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("umuhinzi_token"));
  const [user, setUserState] = useState<AuthUser | null>(() => parseStoredUser());
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
      localStorage.setItem("umuhinzi_last_role", user.role);
    } else {
      localStorage.removeItem("umuhinzi_user");
    }
  }, [user]);

  useEffect(() => {
    if (!token || user) return;

    void getCurrentAuthUser()
      .then((nextUser) => {
        setUser(nextUser);
      })
      .catch(() => {
        setToken(null);
        setUserState(null);
      });
  }, [token, user]);

  const setUser = (nextUser: AuthUser | null) => {
    if (!nextUser) {
      setUserState(null);
      return;
    }

    setUserState({
      ...nextUser,
      role: normalizeRole(nextUser.role),
    });
  };

  const login = (value: string | AuthSession) => {
    if (typeof value === "string") {
      setToken(value);
      return;
    }

    setToken(value.accessToken);
    setUser(value.user);
  };

  const logout = () => {
    // clear token and user, then redirect to landing page
    setToken(null);
    setUserState(null);
    localStorage.removeItem("umuhinzi_refresh_token");
    navigate("/");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token),
        login,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
