import { Navigate, Outlet, useLocation } from "react-router";
import { authStorage } from "../../services/auth/authStorage";
import type { UserRole } from "../../util/accessControl";
import { hasRoleAccess } from "../../util/accessControl";
import { getStoredUser } from "../../util/helper";

interface ProtectedRouteProps {
  allowedRoles?: readonly UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const location = useLocation();
  const user = getStoredUser();
  const requestedPath = `${location.pathname}${location.search}${location.hash}`;

  if (!authStorage.getAccessToken() || !user) {
    return <Navigate to="/login" replace state={{ from: requestedPath }} />;
  }

  if (allowedRoles && !hasRoleAccess(user.role, allowedRoles)) {
    return (
      <Navigate to="/not-authorized" replace state={{ from: requestedPath }} />
    );
  }

  return <Outlet />;
};
