import { MSG } from './messages';

export type AuthErrorCode =
  | 'credenciales_invalidas'
  | 'codigo_incorrecto'
  | 'codigo_expirado'
  | 'factor_no_encontrado'
  | 'limite_frecuencia'
  | 'sesion_invalida'
  | 'permiso_denegado'
  | 'red';

type ErrorLike = { code?: unknown; status?: unknown };

const asErrorLike = (error: unknown): ErrorLike =>
  typeof error === 'object' && error !== null ? (error as ErrorLike) : {};

const SESSION_CODES = [
  'session_expired',
  'session_not_found',
  'refresh_token_not_found',
  'refresh_token_already_used',
  'bad_jwt',
];

export function isSessionError(error: unknown): boolean {
  const { code, status } = asErrorLike(error);
  return status === 401 || (typeof code === 'string' && SESSION_CODES.includes(code));
}

export function toAuthErrorCode(error: unknown): AuthErrorCode {
  const { code, status } = asErrorLike(error);

  if (code === 'invalid_credentials' || code === 'user_banned' || code === 'email_not_confirmed') {
    return 'credenciales_invalidas';
  }
  if (code === 'mfa_verification_failed') return 'codigo_incorrecto';
  if (code === 'mfa_challenge_expired') return 'codigo_expirado';
  if (code === 'mfa_factor_not_found') return 'factor_no_encontrado';
  if (code === 'over_request_rate_limit' || status === 429) return 'limite_frecuencia';
  if (isSessionError(error)) return 'sesion_invalida';
  if (code === '42501') return 'permiso_denegado';
  return 'red';
}

export function toUserMessage(code: AuthErrorCode): string {
  switch (code) {
    case 'credenciales_invalidas':
      return MSG.login.credenciales;
    case 'codigo_incorrecto':
      return MSG.mfa.incorrecto;
    case 'codigo_expirado':
      return MSG.mfa.expirado;
    case 'limite_frecuencia':
      return MSG.general.limiteFrecuencia;
    case 'permiso_denegado':
      return MSG.general.permisoDenegado;
    case 'factor_no_encontrado':
    case 'sesion_invalida':
    case 'red':
      return MSG.general.red;
  }
}
