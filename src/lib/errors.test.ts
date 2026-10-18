import { describe, expect, it } from 'vitest';
import { isSessionError, toAuthErrorCode, toUserMessage } from './errors';
import { MSG } from './messages';

describe('toAuthErrorCode / toUserMessage', () => {
  it.each([
    [{ code: 'invalid_credentials' }, 'credenciales_invalidas', MSG.login.credenciales],
    [{ code: 'user_banned' }, 'credenciales_invalidas', MSG.login.credenciales],
    [{ code: 'email_not_confirmed' }, 'credenciales_invalidas', MSG.login.credenciales],
    [{ code: 'mfa_verification_failed' }, 'codigo_incorrecto', MSG.mfa.incorrecto],
    [{ code: 'mfa_challenge_expired' }, 'codigo_expirado', MSG.mfa.expirado],
    [{ code: 'mfa_factor_not_found' }, 'factor_no_encontrado', MSG.general.red],
    [{ code: 'over_request_rate_limit' }, 'limite_frecuencia', MSG.general.limiteFrecuencia],
    [{ status: 429 }, 'limite_frecuencia', MSG.general.limiteFrecuencia],
    [{ code: 'session_expired' }, 'sesion_invalida', MSG.general.red],
    [{ code: 'session_not_found' }, 'sesion_invalida', MSG.general.red],
    [{ code: 'refresh_token_not_found' }, 'sesion_invalida', MSG.general.red],
    [{ status: 401 }, 'sesion_invalida', MSG.general.red],
    [{ code: '42501' }, 'permiso_denegado', MSG.general.permisoDenegado],
    [{ code: 'algo_raro' }, 'red', MSG.general.red],
    [null, 'red', MSG.general.red],
    ['texto', 'red', MSG.general.red],
  ])('%j → %s', (error, code, message) => {
    expect(toAuthErrorCode(error)).toBe(code);
    expect(toUserMessage(toAuthErrorCode(error))).toBe(message);
  });
});

describe('isSessionError', () => {
  it('detecta errores de sesión y 401', () => {
    expect(isSessionError({ code: 'session_not_found' })).toBe(true);
    expect(isSessionError({ status: 401 })).toBe(true);
    expect(isSessionError({ code: 'invalid_credentials' })).toBe(false);
    expect(isSessionError(undefined)).toBe(false);
  });
});
