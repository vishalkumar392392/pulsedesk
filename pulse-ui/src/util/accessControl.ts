import type { User } from "../types/user";

export type UserRole = User["role"];

export const ALL_ROLES = ["employee", "agent", "admin"] as const;
export const EMPLOYEE_ONLY = ["employee"] as const;
export const SUPPORT_ROLES = ["agent", "admin"] as const;
export const ADMIN_ONLY = ["admin"] as const;

const NAVIGATION_ACCESS: Record<string, readonly UserRole[]> = {
  Dashboard: ALL_ROLES,
  Tickets: ALL_ROLES,
  Assets: SUPPORT_ROLES,
  Users: ADMIN_ONLY,
  Reports: ADMIN_ONLY,
  Settings: ALL_ROLES,
  Logout: ALL_ROLES,
};

export const normalizeRole = (
  role: string | null | undefined,
): UserRole | null => {
  if (!role) return null;

  const normalizedRole = role.toLowerCase();
  return ALL_ROLES.includes(normalizedRole as UserRole)
    ? (normalizedRole as UserRole)
    : null;
};

export const hasRoleAccess = (
  role: string | null | undefined,
  allowedRoles: readonly UserRole[],
) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole !== null && allowedRoles.includes(normalizedRole);
};

export const canViewNavigationItem = (
  item: string,
  role: string | null | undefined,
) => {
  const allowedRoles = NAVIGATION_ACCESS[item];
  return Boolean(allowedRoles && hasRoleAccess(role, allowedRoles));
};
