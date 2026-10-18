import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
  mfa: {
    getAuthenticatorAssuranceLevel: vi.fn(),
    listFactors: vi.fn(),
    unenroll: vi.fn(),
    enroll: vi.fn(),
    challenge: vi.fn(),
    verify: vi.fn(),
  },
}));

vi.mock('../lib/supabase', () => ({ supabase: { auth } }));

import {
  createChallenge,
  getAuthSnapshot,
  login,
  signInAdmin,
  signOutLocal,
  startTotpEnrollment,
  verifyCode,
} from './auth';
import { MSG } from '../lib/messages';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('signInAdmin', () => {
  it('credenciales inválidas → mensaje literal', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: { code: 'invalid_credentials' } });
    const result = await signInAdmin('a@b.co', 'x');
    expect(result).toEqual({
      ok: false,
      code: 'credenciales_invalidas',
      message: 'El correo electrónico o la contraseña son incorrectos',
    });
  });

  it('normaliza el correo (trim + minúsculas)', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'u1' }, session: {} },
      error: null,
    });
    auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
      error: null,
    });

    const result = await signInAdmin('  Admin@X.CO ', 'clave');

    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'admin@x.co', password: 'clave' });
    expect(result).toEqual({ ok: true, data: { userId: 'u1' } });
  });
});

describe('login (existente)', () => {
  it('conserva su comportamiento: lanza el error', async () => {
    const error = { code: 'invalid_credentials' };
    auth.signInWithPassword.mockResolvedValue({ data: {}, error });
    await expect(login('a@b.co', 'x')).rejects.toBe(error);
  });
});

describe('startTotpEnrollment', () => {
  it('elimina los factores unverified antes de enrolar', async () => {
    auth.mfa.listFactors.mockResolvedValue({
      data: {
        all: [
          { id: 'f1', factor_type: 'totp', status: 'unverified' },
          { id: 'f2', factor_type: 'totp', status: 'unverified' },
          { id: 'f3', factor_type: 'totp', status: 'verified' },
        ],
        totp: [],
      },
      error: null,
    });
    auth.mfa.unenroll.mockResolvedValue({ error: null });
    auth.mfa.enroll.mockResolvedValue({
      data: { id: 'new', totp: { qr_code: 'data:svg', secret: 'SECRET', uri: 'otpauth://' } },
      error: null,
    });

    const result = await startTotpEnrollment();

    expect(auth.mfa.unenroll).toHaveBeenCalledTimes(2);
    expect(auth.mfa.unenroll).toHaveBeenCalledWith({ factorId: 'f1' });
    expect(auth.mfa.unenroll).toHaveBeenCalledWith({ factorId: 'f2' });
    expect(result).toEqual({
      ok: true,
      data: { factorId: 'new', qrCodeSvg: 'data:svg', secret: 'SECRET' },
    });
  });
});

describe('createChallenge / verifyCode', () => {
  it('createChallenge devuelve el id', async () => {
    auth.mfa.challenge.mockResolvedValue({ data: { id: 'c1' }, error: null });
    expect(await createChallenge('f1')).toEqual({ ok: true, data: { challengeId: 'c1' } });
  });

  it('verifyCode distingue incorrecto y expirado', async () => {
    auth.mfa.verify.mockResolvedValueOnce({ error: { code: 'mfa_verification_failed' } });
    expect(await verifyCode('f', 'c', '000000')).toMatchObject({
      ok: false,
      code: 'codigo_incorrecto',
      message: MSG.mfa.incorrecto,
    });

    auth.mfa.verify.mockResolvedValueOnce({ error: { code: 'mfa_challenge_expired' } });
    expect(await verifyCode('f', 'c', '000000')).toMatchObject({
      ok: false,
      code: 'codigo_expirado',
      message: MSG.mfa.expirado,
    });

    auth.mfa.verify.mockResolvedValueOnce({ error: null });
    expect(await verifyCode('f', 'c', '123456')).toEqual({ ok: true, data: undefined });
  });
});

describe('signOutLocal', () => {
  it('usa scope local y no lanza', async () => {
    auth.signOut.mockRejectedValue(new Error('red'));
    await expect(signOutLocal()).resolves.toBeUndefined();
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
});

describe('getAuthSnapshot', () => {
  it('sin sesión → hasSession false', async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: { code: 'session_not_found' } });
    expect((await getAuthSnapshot()).hasSession).toBe(false);
  });

  it('con sesión aal1 y factor verificado', async () => {
    auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.co' } },
      error: null,
    });
    auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
      error: null,
    });
    auth.mfa.listFactors.mockResolvedValue({
      data: { all: [], totp: [{ id: 'f1', status: 'verified' }] },
      error: null,
    });

    expect(await getAuthSnapshot()).toEqual({
      hasSession: true,
      user: { id: 'u1', email: 'a@b.co' },
      currentLevel: 'aal1',
      verifiedTotpFactorId: 'f1',
    });
  });
});
