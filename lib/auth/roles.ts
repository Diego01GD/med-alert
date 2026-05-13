export const appRoles = [
  "paciente",
  "medico",
  "admin",
  "administrador",
  "cuidador",
  "farmaceutico",
] as const;

export type AppRole = (typeof appRoles)[number];

const dashboardRoutes: Record<AppRole, string> = {
  paciente: "/protected/paciente",
  medico: "/protected/doctor",
  admin: "/protected/administrador",
  administrador: "/protected/administrador",
  cuidador: "/protected/cuidador",
  farmaceutico: "/protected/farmaceutico",
};

export function isAppRole(role: string | null | undefined): role is AppRole {
  return Boolean(role && role in dashboardRoutes);
}

export function getDashboardPathForRole(role: string | null | undefined) {
  if (!isAppRole(role)) {
    return null;
  }

  return dashboardRoutes[role];
}
