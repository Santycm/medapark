export type AdminNavItem = {
  to: string;
  label: string;
  /** Solo se muestra cuando el administrador ya registró su parqueadero. */
  requiresParking: boolean;
};

export const adminNavItems: readonly AdminNavItem[] = [
  { to: '/admin', label: 'Mi parqueadero', requiresParking: false },
  { to: '/admin/ocupacion', label: 'Gestionar ocupación', requiresParking: true },
  { to: '/admin/parqueadero/celdas', label: 'Configurar celdas', requiresParking: true },
];
