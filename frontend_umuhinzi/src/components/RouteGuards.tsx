import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { BackendRole } from "../types/auth";
import { homeRouteByRole, isRoleAllowed } from "../utils/auth";

type RequireAuthProps = {
  roles?: BackendRole[];
};

export const RequireAuth = ({ roles }: RequireAuthProps) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!isRoleAllowed(user.role, roles)) {
    return <Navigate to={homeRouteByRole(user.role)} replace />;
  }

  return <Outlet />;
};

export const RedirectAuthenticated = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Outlet />;
  }

  return <Navigate to={homeRouteByRole(user.role)} replace />;
};
