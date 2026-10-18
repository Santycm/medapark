import type { AuthStage } from '../../domain/authStage';

/** Ruta a la que corresponde cada etapa de autenticación (contracts/routes.md). */
export function homeFor(stage: AuthStage): string {
  switch (stage) {
    case 'requiere_enrolamiento':
      return '/admin/mfa/configurar';
    case 'requiere_verificacion':
      return '/admin/mfa/verificar';
    case 'autenticado':
      return '/admin';
    default:
      return '/admin/login';
  }
}
