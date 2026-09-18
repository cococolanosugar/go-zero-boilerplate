import type { TitanInitialState } from "./contexts/InitialStateContext";

export function access(initialState: TitanInitialState) {
  const { currentUser } = initialState || {};
  const roles = currentUser?.roles || [];
  const isSuperAdmin = roles.includes("ROLE_ADMIN") || roles.includes("admin");

  return {
    canAdmin: isSuperAdmin,
    isLoggedIn: !!currentUser,
    hasRole: (role: string) => isSuperAdmin || roles.includes(role),
  };
}

export default access;
